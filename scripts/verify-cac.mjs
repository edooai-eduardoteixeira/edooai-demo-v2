/**
 * Quick verification script for the reward-based CAC model.
 * Runs the updated engine logic at 3 budget points and checks coherence.
 *
 * Usage: node scripts/verify-cac.mjs
 */

// ─── Engine functions (inline, matching projectionEngine.js) ─────────

function supplyFrontier(budget, N_max, B_half, alpha) {
  return N_max * Math.pow(budget / (budget + B_half), alpha);
}

function computeResolutionWeights(avgResolutionDays, offerExpirationDays) {
  const sigma = (offerExpirationDays - 1) / 3;
  const weights = [];
  for (let delay = 1; delay <= offerExpirationDays; delay++) {
    const z = (delay - avgResolutionDays) / sigma;
    weights.push(Math.exp(-0.5 * z * z));
  }
  const sum = weights.reduce((s, w) => s + w, 0);
  return weights.map(w => w / sum);
}

function rewardCostForEfficiency(eff, referrerTiers, refereeTiers, distLow, distHigh) {
  const weights = distLow.map((wLow, i) => wLow + (distHigh[i] - wLow) * eff);
  let cost = 0;
  for (let i = 0; i < weights.length; i++) {
    cost += weights[i] * (referrerTiers[i] + refereeTiers[i]);
  }
  return cost;
}

function computeProjection(budget, p) {
  const audienceSize = Math.round(p.totalCustomers * p.eligibilityRate);
  const N_frontier = supplyFrontier(budget, p.N_max, p.B_half, p.alpha);

  const budgetPressure = budget / (budget + p.B_half);
  const midEffReward = rewardCostForEfficiency(0.5, p.referrerTiers, p.refereeTiers, p.tierDistLowEff, p.tierDistHighEff);
  const reachCostPremium = 1 + budgetPressure * (p.reachCostElasticity || 1.0);
  const adjMidEffReward = midEffReward * reachCostPremium;
  const realizationEstimate = p.budgetRealizationFactor || 0.55;
  const maxAffordable = adjMidEffReward > 0 ? budget / adjMidEffReward / realizationEstimate : Infinity;
  const effectiveN = Math.min(N_frontier, maxAffordable);

  const totalJourneys = effectiveN / p.baseConvRate;
  const dailyJourneyTarget = totalJourneys / 30;

  const reachPenetration = totalJourneys / audienceSize;
  const qualityFactor = Math.pow(1 - reachPenetration, p.reachDecayExponent);
  const effectiveBaseConvRate = p.baseConvRate * qualityFactor;

  const resolutionWeights = computeResolutionWeights(p.avgResolutionDays, p.offerExpirationDays);

  let remainingPool = audienceSize;
  let cumulativeN = 0;
  let cumulativeValue = 0;
  let cumulativeRewardCost = 0;
  let totalJourneysStarted = 0;
  const pendingConversions = [];
  const dailyCurve = [];
  const effCurve = [];
  let thresholdDay = 30;
  let thresholdFound = false;

  for (let day = 1; day <= 30; day++) {
    const timeFactor = 1 - Math.exp(-p.timeLearnRate * day);
    const volumeFactor = cumulativeN / (cumulativeN + p.confHalfPoint);
    const eff = p.effFloor + (1 - p.effFloor) * timeFactor * volumeFactor;
    effCurve.push(eff);

    // Reward cost: eff-driven tier mix + budget pressure premium
    const baseRewardCost = rewardCostForEfficiency(eff, p.referrerTiers, p.refereeTiers, p.tierDistLowEff, p.tierDistHighEff);
    const dailyRewardCost = baseRewardCost * reachCostPremium;

    const journeysToday = Math.min(dailyJourneyTarget, remainingPool * p.maxDailyReachRate);

    // Reward-to-conversion boost: higher rewards increase prospect willingness to convert
    const maxTierCost = p.referrerTiers[p.referrerTiers.length - 1] + p.refereeTiers[p.refereeTiers.length - 1];
    const rewardIntensity = maxTierCost > 0 ? dailyRewardCost / maxTierCost : 0;
    const rewardConvBoost = 1 + rewardIntensity * (p.rewardConvElasticity || 0.5);
    const adjustedConvRate = effectiveBaseConvRate * rewardConvBoost;

    const wellTargeted = journeysToday * eff;
    const goodConversions = wellTargeted * adjustedConvRate;
    const poorlyTargeted = journeysToday * (1 - eff);
    const accidentalConversions = poorlyTargeted * p.accidentalConvRate;
    const dailyConversionsGenerated = goodConversions + accidentalConversions;

    const effectiveRevenuePerUser = p.baseRevenuePerUser +
      (p.premiumRevenuePerUser - p.baseRevenuePerUser) * eff;
    const dailyValueGenerated = dailyConversionsGenerated * effectiveRevenuePerUser;

    for (let delayIdx = 0; delayIdx < p.offerExpirationDays; delayIdx++) {
      const resolveDay = day + delayIdx + 1;
      if (resolveDay <= 30) {
        pendingConversions.push({
          resolveDay,
          count: dailyConversionsGenerated * resolutionWeights[delayIdx],
          value: dailyValueGenerated * resolutionWeights[delayIdx],
        });
      }
    }

    let resolvedToday = 0;
    let resolvedValueToday = 0;
    for (const entry of pendingConversions) {
      if (entry.resolveDay === day) {
        resolvedToday += entry.count;
        resolvedValueToday += entry.value;
      }
    }

    cumulativeRewardCost += dailyRewardCost * resolvedToday;

    cumulativeN += resolvedToday;
    cumulativeValue += resolvedValueToday;

    remainingPool -= journeysToday;
    remainingPool += resolvedToday * p.referrerEligibilityRate;
    remainingPool = Math.min(remainingPool, audienceSize);
    remainingPool = Math.max(0, remainingPool);

    totalJourneysStarted += journeysToday;

    if (!thresholdFound && cumulativeN >= p.minSignalVolume) {
      thresholdDay = day;
      thresholdFound = true;
    }

    dailyCurve.push(Math.max(0, resolvedToday));
  }

  const activeUsers = Math.round(dailyCurve.reduce((s, v) => s + v, 0));
  const cac = activeUsers > 0 ? Math.round(cumulativeRewardCost / activeUsers) : 999;
  const roi = cumulativeValue > 0 && budget > 0
    ? Math.round((cumulativeValue / budget) * 10) / 10 : 0;
  const convRate = totalJourneysStarted > 0
    ? Math.round((activeUsers / totalJourneysStarted) * 10000) / 100 : 0;

  return {
    activeUsers, cac, roi, convRate, thresholdDay,
    totalJourneysStarted: Math.round(totalJourneysStarted),
    N_frontier: Math.round(N_frontier),
    effectiveN: Math.round(effectiveN),
    maxAffordable: Math.round(maxAffordable),
    midEffReward: Math.round(midEffReward * 100) / 100,
    totalRewardSpend: Math.round(cumulativeRewardCost),
    totalRevenue: Math.round(cumulativeValue),
    effRange: `${(effCurve[0] * 100).toFixed(0)}-${(effCurve[29] * 100).toFixed(0)}%`,
    dailyCurve,
    effCurve,
  };
}

// ─── Test parameters ─────────────────────────────────────────────────

// Param sets to test
const paramSets = [
  {
    label: 'A: Higher pool + faster learn + higher convRate',
    params: {
      totalCustomers: 847000,
      eligibilityRate: 0.50,
      N_max: 25000,
      B_half: 200000,
      alpha: 1,
      effFloor: 0.30,
      timeLearnRate: 0.10,
      confHalfPoint: 40,
      baseConvRate: 0.05,
      accidentalConvRate: 0.003,
      reachDecayExponent: 0.5,
      maxDailyReachRate: 0.04,
      avgResolutionDays: 3,
      offerExpirationDays: 14,
      referrerEligibilityRate: 0.4,
      baseRevenuePerUser: 100,
      premiumRevenuePerUser: 280,
      fraudRate: 0.07,
      minSignalVolume: 40,
      referrerTiers: [0, 20, 50, 75],
      refereeTiers: [0, 10, 25, 50],
      tierDistLowEff: [0.03, 0.12, 0.40, 0.45],
      tierDistHighEff: [0.07, 0.38, 0.45, 0.10],
      reachCostElasticity: 1.5,
      rewardConvElasticity: 0.5,
      budgetRealizationFactor: 0.70,
    },
  },
  {
    label: 'B: More aggressive — higher effFloor, faster timeLearn',
    params: {
      totalCustomers: 847000,
      eligibilityRate: 0.50,
      N_max: 20000,
      B_half: 150000,
      alpha: 1,
      effFloor: 0.35,
      timeLearnRate: 0.12,
      confHalfPoint: 30,
      baseConvRate: 0.06,
      accidentalConvRate: 0.004,
      reachDecayExponent: 0.4,
      maxDailyReachRate: 0.05,
      avgResolutionDays: 2,
      offerExpirationDays: 14,
      referrerEligibilityRate: 0.4,
      baseRevenuePerUser: 100,
      premiumRevenuePerUser: 350,
      fraudRate: 0.07,
      minSignalVolume: 40,
      referrerTiers: [0, 20, 50, 75],
      refereeTiers: [0, 10, 25, 50],
      tierDistLowEff: [0.03, 0.12, 0.40, 0.45],
      tierDistHighEff: [0.07, 0.38, 0.45, 0.10],
    },
  },
  {
    label: 'C: High throughput — fast ramp, high conv, big pool',
    params: {
      totalCustomers: 847000,
      eligibilityRate: 0.50,
      N_max: 25000,
      B_half: 200000,
      alpha: 1,
      effFloor: 0.40,
      timeLearnRate: 0.15,
      confHalfPoint: 20,
      baseConvRate: 0.08,
      accidentalConvRate: 0.005,
      reachDecayExponent: 0.4,
      maxDailyReachRate: 0.06,
      avgResolutionDays: 2,
      offerExpirationDays: 14,
      referrerEligibilityRate: 0.4,
      baseRevenuePerUser: 100,
      premiumRevenuePerUser: 350,
      fraudRate: 0.07,
      minSignalVolume: 40,
      referrerTiers: [0, 20, 50, 75],
      refereeTiers: [0, 10, 25, 50],
      tierDistLowEff: [0.03, 0.12, 0.40, 0.45],
      tierDistHighEff: [0.07, 0.38, 0.45, 0.10],
    },
  },
  {
    label: 'D: Max throughput — very fast ramp, no budget cap',
    params: {
      totalCustomers: 847000,
      eligibilityRate: 0.50,
      N_max: 40000,
      B_half: 300000,
      alpha: 1,
      effFloor: 0.40,
      timeLearnRate: 0.14,
      confHalfPoint: 25,
      baseConvRate: 0.07,
      accidentalConvRate: 0.004,
      reachDecayExponent: 0.3,
      maxDailyReachRate: 0.06,
      avgResolutionDays: 2,
      offerExpirationDays: 14,
      referrerEligibilityRate: 0.4,
      baseRevenuePerUser: 100,
      premiumRevenuePerUser: 350,
      fraudRate: 0.07,
      minSignalVolume: 40,
      referrerTiers: [0, 20, 50, 75],
      refereeTiers: [0, 10, 25, 50],
      tierDistLowEff: [0.03, 0.12, 0.40, 0.45],
      tierDistHighEff: [0.07, 0.38, 0.45, 0.10],
    },
  },
];

for (const { label, params: p } of paramSets) {
  console.log(`\n═══ ${label} ═══`);
  const budgets = [50000, 100000, 150000, 200000, 300000];
  console.log('Budget     │ Users  │ CAC  │ ROI   │ Conv%  │ ThDay │ Eff      │ RewardSpend │ Revenue');
  console.log('───────────┼────────┼──────┼───────┼────────┼───────┼──────────┼─────────────┼────────');
  for (const b of budgets) {
    const r = computeProjection(b, p);
    const binding = r.effectiveN === r.maxAffordable ? 'budget' : 'supply';
    console.log(
      `$${(b / 1000).toString().padStart(4)}K    │ ${r.activeUsers.toString().padStart(6)} │ $${r.cac.toString().padStart(3)} │ ${r.roi.toFixed(1).padStart(5)}x │ ${r.convRate.toFixed(2).padStart(5)}% │ ${r.thresholdDay.toString().padStart(5)} │ ${r.effRange.padStart(8)} │ $${r.totalRewardSpend.toLocaleString().padStart(10)} │ $${r.totalRevenue.toLocaleString().padStart(9)} [${binding}]`
    );
  }
  // Coherence
  console.log('Coherence:');
  for (const b of [50000, 150000, 300000]) {
    const r = computeProjection(b, p);
    console.log(`  $${b/1000}K: RewardSpend $${r.totalRewardSpend.toLocaleString()} (${(r.totalRewardSpend/b*100).toFixed(0)}% of budget)`);
  }
}

const params = paramSets[0].params;

// ─── Run verification ────────────────────────────────────────────────

const budgets = [50000, 100000, 150000, 200000, 300000];

console.log('Budget     │ Users  │ CAC  │ ROI   │ Conv%  │ ThDay │ Eff      │ RewardSpend │ Revenue    │ N_front │ MaxAff │ EffN');
console.log('───────────┼────────┼──────┼───────┼────────┼───────┼──────────┼─────────────┼────────────┼─────────┼────────┼──────');

for (const b of budgets) {
  const r = computeProjection(b, params);
  const binding = r.effectiveN === r.maxAffordable ? 'budget' : 'supply';
  console.log(
    `$${(b / 1000).toString().padStart(4)}K    │ ${r.activeUsers.toString().padStart(6)} │ $${r.cac.toString().padStart(3)} │ ${r.roi.toFixed(1).padStart(5)}x │ ${r.convRate.toFixed(2).padStart(5)}% │ ${r.thresholdDay.toString().padStart(5)} │ ${r.effRange.padStart(8)} │ $${r.totalRewardSpend.toLocaleString().padStart(10)} │ $${r.totalRevenue.toLocaleString().padStart(9)} │ ${r.N_frontier.toString().padStart(7)} │ ${r.maxAffordable.toString().padStart(6)} │ ${r.effectiveN.toString().padStart(5)} [${binding}]`
  );
}

// Coherence check
console.log('\n═══ Coherence Check (CAC × Users ≈ Budget) ═══');
for (const b of budgets) {
  const r = computeProjection(b, params);
  const impliedSpend = r.cac * r.activeUsers;
  const ratio = impliedSpend / b;
  console.log(`$${b/1000}K: CAC($${r.cac}) × Users(${r.activeUsers}) = $${impliedSpend.toLocaleString()} (${(ratio * 100).toFixed(0)}% of budget) — RewardSpend: $${r.totalRewardSpend.toLocaleString()}`);
}

// Reward cost at different efficiency levels
console.log('\n═══ Reward Cost per Efficiency ═══');
for (const eff of [0.0, 0.3, 0.5, 0.7, 0.8, 1.0]) {
  const cost = rewardCostForEfficiency(eff, params.referrerTiers, params.refereeTiers, params.tierDistLowEff, params.tierDistHighEff);
  console.log(`eff=${eff.toFixed(1)}: $${cost.toFixed(2)}/conversion`);
}

// Daily curve at $150K
console.log('\n═══ Daily Curve at $150K ═══');
const mid = computeProjection(150000, params);
const maxVal = Math.max(...mid.dailyCurve);
for (let d = 0; d < 30; d++) {
  const val = mid.dailyCurve[d];
  const barLen = maxVal > 0 ? Math.round((val / maxVal) * 40) : 0;
  const bar = '█'.repeat(barLen);
  const eff = (mid.effCurve[d] * 100).toFixed(0);
  const rewCost = rewardCostForEfficiency(mid.effCurve[d], params.referrerTiers, params.refereeTiers, params.tierDistLowEff, params.tierDistHighEff);
  console.log(`Day ${(d + 1).toString().padStart(2)}: ${bar.padEnd(40)} ${val.toFixed(1).padStart(6)} (eff ${eff}%, CAC $${rewCost.toFixed(0)})`);
}
