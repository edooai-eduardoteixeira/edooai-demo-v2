/**
 * Calibration script for the projection engine v3.
 *
 * v3 changes: pool quality decay, distributed resolution (truncated normal),
 * value learning (base/premium revenue).
 *
 * Sweeps parameter combinations to find values that hit calibration targets.
 * Implements the engine inline (no app imports) so it can run standalone.
 *
 * Usage: node scripts/calibrate-engine.mjs
 */

// ─── Resolution Distribution ────────────────────────────────────────

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

// ─── Model (matches src/engine/projectionEngine.js v3) ──────────────

function supplyFrontier(budget, N_max, B_half, alpha) {
  return N_max * Math.pow(budget / (budget + B_half), alpha);
}

function computeProjection(budget, p) {
  const audienceSize = Math.round(p.totalCustomers * p.eligibilityRate);
  const N_frontier = supplyFrontier(budget, p.N_max, p.B_half, p.alpha);
  const totalJourneys = N_frontier / p.baseConvRate;
  const dailyJourneyTarget = totalJourneys / 30;

  const resolutionWeights = computeResolutionWeights(p.avgResolutionDays, p.offerExpirationDays);

  let remainingPool = audienceSize;
  let cumulativeN = 0;
  let cumulativeValue = 0;
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

    const journeysToday = Math.min(dailyJourneyTarget, remainingPool * p.maxDailyReachRate);

    // Pool quality decay
    const poolQuality = Math.pow(remainingPool / audienceSize, p.poolDecayExponent);
    const effectiveBaseConvRate = p.baseConvRate * poolQuality;

    const wellTargeted = journeysToday * eff;
    const goodConversions = wellTargeted * effectiveBaseConvRate;

    const poorlyTargeted = journeysToday * (1 - eff);
    const accidentalConversions = poorlyTargeted * p.accidentalConvRate;

    const dailyConversionsGenerated = goodConversions + accidentalConversions;

    // Value learning
    const effectiveRevenuePerUser = p.baseRevenuePerUser +
      (p.premiumRevenuePerUser - p.baseRevenuePerUser) * eff;
    const dailyValueGenerated = dailyConversionsGenerated * effectiveRevenuePerUser;

    // Distributed resolution
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
  const cac = activeUsers > 0 ? Math.round(budget / activeUsers) : Infinity;
  const roi = cumulativeValue > 0 && budget > 0
    ? Math.round((cumulativeValue / budget) * 10) / 10
    : 0;
  const avgValuePerUser = activeUsers > 0
    ? Math.round(cumulativeValue / activeUsers)
    : 0;
  const convRate = totalJourneysStarted > 0
    ? Math.round((activeUsers / totalJourneysStarted) * 10000) / 100
    : 0;

  return {
    dailyCurve,
    activeUsers,
    cac,
    roi,
    convRate,
    avgValuePerUser,
    thresholdDay,
    effCurve,
    totalJourneysStarted: Math.round(totalJourneysStarted),
    N_frontier: Math.round(N_frontier),
    remainingPool: Math.round(remainingPool),
    audienceSize,
  };
}

// ─── Targets ────────────────────────────────────────────────────────

const TARGETS = [
  { budget: 50_000,  cac: [200, 250],  users: [200, 250],   roi: [1.8, 2.2] },
  { budget: 150_000, cac: [250, 350],  users: [430, 600],   roi: [1.4, 2.0] },
  { budget: 500_000, cac: [400, 600],  users: [830, 1250],  roi: [0.8, 1.2] },
];

const ALL_BUDGETS = [25_000, 50_000, 75_000, 100_000, 150_000, 200_000, 300_000, 500_000];

// ─── Fixed parameters ───────────────────────────────────────────────

const FIXED = {
  totalCustomers: 847_000,
  eligibilityRate: 0.295,
  fraudRate: 0.07,
  minSignalVolume: 40,
  baseConvRate: 0.03,
  referrerEligibilityRate: 0.4,
  offerExpirationDays: 14,
};

// ─── Sweep ranges ───────────────────────────────────────────────────

const N_MAX_VALUES               = [1500, 2000, 3000, 4000, 5000];
const B_HALF_VALUES              = [100_000, 200_000, 400_000, 700_000, 1_000_000];
const ALPHA_VALUES               = [0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
const EFF_FLOOR_VALUES           = [0.10, 0.15, 0.20, 0.25, 0.30];
const TIME_LEARN_VALUES          = [0.06, 0.10, 0.14, 0.18];
const CONF_HALF_VALUES           = [20, 35, 50, 70];
const MAX_DAILY_REACH_VALUES     = [0.03, 0.05, 0.08, 0.10];
const AVG_RESOLUTION_VALUES      = [3, 4, 5];
const ACCIDENTAL_CONV_VALUES     = [0.0005, 0.001, 0.002];
const POOL_DECAY_VALUES          = [0.5, 1.0, 1.5, 2.0, 3.0, 4.0];
const BASE_REVENUE_VALUES        = [250, 300, 350];
const PREMIUM_REVENUE_VALUES     = [700, 800, 900];

// ─── Scoring ────────────────────────────────────────────────────────

function score(params) {
  let total = 0;

  for (const t of TARGETS) {
    const r = computeProjection(t.budget, params);

    const cacMid = (t.cac[0] + t.cac[1]) / 2;
    const cacSpan = (t.cac[1] - t.cac[0]) / 2;
    const cacErr = Math.max(0, Math.abs(r.cac - cacMid) - cacSpan) / cacMid;

    const usersMid = (t.users[0] + t.users[1]) / 2;
    const usersSpan = (t.users[1] - t.users[0]) / 2;
    const usersErr = Math.max(0, Math.abs(r.activeUsers - usersMid) - usersSpan) / usersMid;

    const roiMid = (t.roi[0] + t.roi[1]) / 2;
    const roiSpan = (t.roi[1] - t.roi[0]) / 2;
    const roiErr = Math.max(0, Math.abs(r.roi - roiMid) - roiSpan) / roiMid;

    total += cacErr + usersErr + roiErr;
  }

  // Penalty: threshold day at floor budget should be 25-30
  const floorResult = computeProjection(75_000, params);
  if (floorResult.thresholdDay < 15) total += 0.3;

  // Penalty: conv rate should decrease with budget
  const r50 = computeProjection(50_000, params);
  const r150 = computeProjection(150_000, params);
  const r500 = computeProjection(500_000, params);
  if (r150.convRate >= r50.convRate) total += 0.5;
  if (r500.convRate >= r150.convRate) total += 0.5;

  return total;
}

// ─── Two-stage sweep ────────────────────────────────────────────────
// Stage 1: supply curve + learning + pacing + pool decay (jointly optimized)
// Stage 2: refine resolution + revenue params around stage 1 best

console.log('Calibrating projection engine v3...');

const stage1Combos = N_MAX_VALUES.length * B_HALF_VALUES.length * ALPHA_VALUES.length *
  EFF_FLOOR_VALUES.length * TIME_LEARN_VALUES.length * CONF_HALF_VALUES.length *
  MAX_DAILY_REACH_VALUES.length * ACCIDENTAL_CONV_VALUES.length * POOL_DECAY_VALUES.length;
console.log(`Stage 1: ${stage1Combos.toLocaleString()} combinations (supply + learning + pool decay)`);

let bestScore = Infinity;
let bestParams = null;
let tested = 0;

const STAGE1_DEFAULTS = {
  avgResolutionDays: 4,
  baseRevenuePerUser: 300,
  premiumRevenuePerUser: 800,
};

for (const N_max of N_MAX_VALUES) {
  for (const B_half of B_HALF_VALUES) {
    for (const alpha of ALPHA_VALUES) {
      for (const effFloor of EFF_FLOOR_VALUES) {
        for (const timeLearnRate of TIME_LEARN_VALUES) {
          for (const confHalfPoint of CONF_HALF_VALUES) {
            for (const maxDailyReachRate of MAX_DAILY_REACH_VALUES) {
              for (const accidentalConvRate of ACCIDENTAL_CONV_VALUES) {
                for (const poolDecayExponent of POOL_DECAY_VALUES) {
                  const params = {
                    ...FIXED,
                    ...STAGE1_DEFAULTS,
                    N_max, B_half, alpha,
                    effFloor, timeLearnRate, confHalfPoint,
                    maxDailyReachRate, accidentalConvRate,
                    poolDecayExponent,
                  };
                  const s = score(params);
                  tested++;

                  if (s < bestScore) {
                    bestScore = s;
                    bestParams = params;
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}

console.log(`Stage 1: ${tested.toLocaleString()} tested. Best score: ${bestScore.toFixed(4)}\n`);

// Stage 2: refine resolution + revenue around stage 1 best
console.log('Stage 2: Resolution + revenue...');
const stage2Combos = AVG_RESOLUTION_VALUES.length *
  BASE_REVENUE_VALUES.length * PREMIUM_REVENUE_VALUES.length;
console.log(`Stage 2: ${stage2Combos.toLocaleString()} combinations\n`);

const stage1Best = { ...bestParams };
tested = 0;

for (const avgResolutionDays of AVG_RESOLUTION_VALUES) {
  for (const baseRevenuePerUser of BASE_REVENUE_VALUES) {
    for (const premiumRevenuePerUser of PREMIUM_REVENUE_VALUES) {
      const params = {
        ...stage1Best,
        avgResolutionDays,
        baseRevenuePerUser,
        premiumRevenuePerUser,
      };
      const s = score(params);
      tested++;

      if (s < bestScore) {
        bestScore = s;
        bestParams = params;
      }
    }
  }
}

console.log(`Stage 2: ${tested.toLocaleString()} tested. Best score: ${bestScore.toFixed(4)}\n`);

// ─── Best parameters ────────────────────────────────────────────────

console.log('═══ Best Parameters ═══');
console.log(`  N_max:                ${bestParams.N_max}`);
console.log(`  B_half:               ${bestParams.B_half.toLocaleString()}`);
console.log(`  alpha:                ${bestParams.alpha}`);
console.log(`  effFloor:             ${bestParams.effFloor}`);
console.log(`  timeLearnRate:        ${bestParams.timeLearnRate}`);
console.log(`  confHalfPoint:        ${bestParams.confHalfPoint}`);
console.log(`  maxDailyReachRate:    ${bestParams.maxDailyReachRate}`);
console.log(`  accidentalConvRate:   ${bestParams.accidentalConvRate}`);
console.log(`  poolDecayExponent:    ${bestParams.poolDecayExponent}`);
console.log(`  avgResolutionDays:    ${bestParams.avgResolutionDays}`);
console.log(`  offerExpirationDays:  ${bestParams.offerExpirationDays}`);
console.log(`  baseRevenuePerUser:   ${bestParams.baseRevenuePerUser}`);
console.log(`  premiumRevenuePerUser:${bestParams.premiumRevenuePerUser}`);
console.log(`  baseConvRate:         ${bestParams.baseConvRate}`);
console.log(`  referrerEligRate:     ${bestParams.referrerEligibilityRate}`);

// ─── Results table ──────────────────────────────────────────────────

console.log('\n═══ Results across budgets ═══');
console.log('Budget     │ Users  │ CAC    │ ROI  │ Conv%  │ AvgVal │ Journeys │ ThDay │ Pool Left');
console.log('───────────┼────────┼────────┼──────┼────────┼────────┼──────────┼───────┼──────────');

for (const b of ALL_BUDGETS) {
  const r = computeProjection(b, bestParams);
  const marker = TARGETS.find(t => t.budget === b) ? ' ◄' : '';
  console.log(
    `$${(b / 1000).toString().padStart(4)}K    │ ${r.activeUsers.toString().padStart(6)} │ $${r.cac.toString().padStart(5)} │ ${r.roi.toFixed(1).padStart(4)}x │ ${r.convRate.toFixed(2).padStart(5)}% │ $${r.avgValuePerUser.toString().padStart(5)} │ ${r.totalJourneysStarted.toString().padStart(8)} │ ${r.thresholdDay.toString().padStart(5)} │ ${r.remainingPool.toString().padStart(9)}${marker}`
  );
}

// ─── Target comparison ──────────────────────────────────────────────

console.log('\n═══ Target Comparison ═══');
for (const t of TARGETS) {
  const r = computeProjection(t.budget, bestParams);
  const bLabel = `$${(t.budget / 1000)}K`;
  const cacOk = r.cac >= t.cac[0] && r.cac <= t.cac[1];
  const usersOk = r.activeUsers >= t.users[0] && r.activeUsers <= t.users[1];
  const roiOk = r.roi >= t.roi[0] && r.roi <= t.roi[1];
  console.log(`${bLabel}:`);
  console.log(`  CAC:   $${r.cac} (target $${t.cac[0]}-${t.cac[1]}) ${cacOk ? '✓' : '✗'}`);
  console.log(`  Users: ${r.activeUsers} (target ${t.users[0]}-${t.users[1]}) ${usersOk ? '✓' : '✗'}`);
  console.log(`  ROI:   ${r.roi}x (target ${t.roi[0]}-${t.roi[1]}x) ${roiOk ? '✓' : '✗'}`);
  console.log(`  Conv:  ${r.convRate}% | AvgVal: $${r.avgValuePerUser}`);
}

// ─── Conv rate direction check ───────────────────────────────────────

console.log('\n═══ Conv Rate Direction ═══');
const cr50 = computeProjection(50_000, bestParams).convRate;
const cr150 = computeProjection(150_000, bestParams).convRate;
const cr500 = computeProjection(500_000, bestParams).convRate;
console.log(`  $50K:  ${cr50.toFixed(2)}%`);
console.log(`  $150K: ${cr150.toFixed(2)}%`);
console.log(`  $500K: ${cr500.toFixed(2)}%`);
console.log(`  Decreasing: ${(cr50 > cr150 && cr150 > cr500) ? '✓' : '✗'}`);

// ─── KPI coherence check ────────────────────────────────────────────

console.log('\n═══ KPI Coherence Check ═══');
for (const b of [50_000, 150_000, 500_000]) {
  const r = computeProjection(b, bestParams);
  const derived = Math.round(r.totalJourneysStarted * (r.convRate / 100));
  const match = Math.abs(derived - r.activeUsers) <= 1;
  console.log(`$${b / 1000}K: journeys(${r.totalJourneysStarted}) × conv(${r.convRate}%) = ${derived} ≈ ${r.activeUsers} users ${match ? '✓' : '✗'}`);
}

// ─── Daily curve at $150K ───────────────────────────────────────────

console.log('\n═══ Daily Curve at $150K ═══');
const mid = computeProjection(150_000, bestParams);
const maxVal = Math.max(...mid.dailyCurve);
for (let d = 0; d < 30; d++) {
  const val = mid.dailyCurve[d];
  const barLen = maxVal > 0 ? Math.round((val / maxVal) * 40) : 0;
  const bar = '█'.repeat(barLen);
  const eff = (mid.effCurve[d] * 100).toFixed(0);
  console.log(`Day ${(d + 1).toString().padStart(2)}: ${bar.padEnd(40)} ${val.toFixed(1).padStart(6)} (eff ${eff}%)`);
}

// ─── Monotonicity ───────────────────────────────────────────────────

console.log('\n═══ Monotonicity Checks ═══');
let prevCAC = 0, prevUsers = 0, prevROI = Infinity;
let cacOk = true, usersOk = true, roiOk = true;
for (const b of ALL_BUDGETS) {
  const r = computeProjection(b, bestParams);
  if (r.cac < prevCAC) cacOk = false;
  if (r.activeUsers < prevUsers) usersOk = false;
  if (r.roi > prevROI) roiOk = false;
  prevCAC = r.cac;
  prevUsers = r.activeUsers;
  prevROI = r.roi;
}
console.log(`  CAC increases with budget:  ${cacOk ? '✓' : '✗'}`);
console.log(`  Users increase with budget: ${usersOk ? '✓' : '✗'}`);
console.log(`  ROI decreases with budget:  ${roiOk ? '✓' : '✗'}`);

// ─── Floor budget search ────────────────────────────────────────────

console.log('\n═══ Floor Budget (thresholdDay ≈ 28-30) ═══');
let lo = 5_000, hi = 200_000;
for (let i = 0; i < 25; i++) {
  const m = Math.round((lo + hi) / 2);
  const r = computeProjection(m, bestParams);
  if (r.thresholdDay >= 28) lo = m;
  else hi = m;
}
const floorBudget = Math.round(hi / 5000) * 5000;
const floorR = computeProjection(floorBudget, bestParams);
console.log(`  Floor budget: $${floorBudget.toLocaleString()} (thresholdDay=${floorR.thresholdDay})`);

// ─── Config snippet ─────────────────────────────────────────────────

console.log('\n═══ Config Snippet ═══');
console.log(`engineParams: {
  totalCustomers: ${bestParams.totalCustomers},
  eligibilityRate: ${bestParams.eligibilityRate},
  N_max: ${bestParams.N_max},
  B_half: ${bestParams.B_half},
  alpha: ${bestParams.alpha},
  effFloor: ${bestParams.effFloor},
  timeLearnRate: ${bestParams.timeLearnRate},
  confHalfPoint: ${bestParams.confHalfPoint},
  baseConvRate: ${bestParams.baseConvRate},
  accidentalConvRate: ${bestParams.accidentalConvRate},
  poolDecayExponent: ${bestParams.poolDecayExponent},
  maxDailyReachRate: ${bestParams.maxDailyReachRate},
  avgResolutionDays: ${bestParams.avgResolutionDays},
  offerExpirationDays: ${bestParams.offerExpirationDays},
  referrerEligibilityRate: ${bestParams.referrerEligibilityRate},
  baseRevenuePerUser: ${bestParams.baseRevenuePerUser},
  premiumRevenuePerUser: ${bestParams.premiumRevenuePerUser},
  fraudRate: ${bestParams.fraudRate},
  minSignalVolume: ${bestParams.minSignalVolume},
  budget: {
    floor: ${floorBudget},
    recMin: 100000,
    recMax: 200000,
  },
}`);
