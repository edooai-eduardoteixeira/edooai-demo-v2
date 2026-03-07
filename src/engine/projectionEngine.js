/**
 * Projection Engine v3 — Journey Model with Distributed Resolution & Value Learning
 *
 * Pure functions, zero React dependencies. Takes budget + params → computes all projections.
 *
 * Five interlocking components:
 *
 *   1. Supply curve (N_frontier): concave function of budget.
 *      Returns max possible CONVERSIONS with perfect allocation.
 *      N_frontier is in conversion units — divide by baseConvRate to get journeys.
 *
 *   2. Allocation efficiency: f(time, resolved conversions).
 *      Models the learning period. Starts at effFloor, rises as resolved
 *      conversions accumulate.
 *
 *   3. Reach quality & cost dynamics:
 *      - Wider reach = lower quality per contact (effectiveBaseConvRate decreases)
 *      - Reach cost premium: deeper reach requires higher rewards to convert
 *        less propense prospects (dailyRewardCost × reachCostPremium)
 *      - Reward-to-conversion boost: higher rewards increase prospect willingness
 *        to convert, partially offsetting quality decline (U-curve on conversion)
 *
 *   4. Distributed resolution: conversions are spread across a truncated
 *      normal distribution from day+1 to day+offerExpirationDays, peaking
 *      at day+avgResolutionDays. No staircase jumps.
 *
 *   5. Value learning: as the engine gets better at targeting, it finds
 *      super referrers who bring high-value customers. effectiveRevenuePerUser
 *      rises with efficiency, from baseRevenuePerUser to premiumRevenuePerUser.
 *
 * Unit semantics:
 *   - N_frontier, N_max: conversion units
 *   - dailyJourneyTarget, journeysToday, totalJourneysStarted: journey units
 *   - baseConvRate bridges the two: journeys = conversions / baseConvRate
 */

// ─── Supply Curve ────────────────────────────────────────────────────
// N_frontier(B) = N_max × (B / (B + B_half))^alpha
// Returns CONVERSIONS (not journeys). Concave in budget.
function supplyFrontier(budget, N_max, B_half, alpha) {
  return N_max * Math.pow(budget / (budget + B_half), alpha);
}

// ─── Allocation Efficiency ──────────────────────────────────────────
// eff(day, cumN) = floor + (1 - floor) × timeFactor × volumeFactor
// cumN counts only RESOLVED conversions, not pending ones.
function allocationEfficiency(day, cumulativeN, p) {
  const timeFactor = 1 - Math.exp(-p.timeLearnRate * day);
  const volumeFactor = cumulativeN / (cumulativeN + p.confHalfPoint);
  return p.effFloor + (1 - p.effFloor) * timeFactor * volumeFactor;
}

// ─── Truncated Normal Distribution Weights ───────────────────────────
// Pre-computed once at init. Weights for delays 1..offerExpirationDays,
// centered on avgResolutionDays. Normalized to sum to 1.
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

// ─── Reward Cost per Conversion ──────────────────────────────────────
// Returns the blended reward cost (referrer + referee) per conversion
// at a given allocation efficiency level.
// Low eff → AI uses expensive tiers (3/4) → high cost per conversion.
// High eff → AI finds willing converters → cheap tiers (2/3) → low cost.
function rewardCostForEfficiency(eff, referrerTiers, refereeTiers, distLow, distHigh) {
  const weights = distLow.map((wLow, i) => wLow + (distHigh[i] - wLow) * eff);
  let cost = 0;
  for (let i = 0; i < weights.length; i++) {
    cost += weights[i] * (referrerTiers[i] + refereeTiers[i]);
  }
  return cost;
}

// ─── Guardrail Assertions ────────────────────────────────────────────
function assertParams(p) {
  const fail = (msg) => { throw new Error(`Engine assertion failed: ${msg}`); };

  if (!(p.totalCustomers > 0)) fail('totalCustomers must be > 0');
  if (!(p.eligibilityRate > 0 && p.eligibilityRate <= 1)) fail('eligibilityRate must be in (0, 1]');
  if (!(p.N_max > 0)) fail('N_max must be > 0');

  const audienceSize = Math.round(p.totalCustomers * p.eligibilityRate);
  if (!(p.N_max <= audienceSize)) fail(`N_max (${p.N_max}) must be <= audienceSize (${audienceSize})`);

  if (!(p.alpha > 0 && p.alpha <= 2)) fail('alpha must be in (0, 2]');
  if (!(p.B_half > 0)) fail('B_half must be > 0');
  if (!(p.baseConvRate > 0 && p.baseConvRate < 1)) fail('baseConvRate must be in (0, 1)');
  if (!(p.accidentalConvRate > 0 && p.accidentalConvRate < p.baseConvRate)) fail('accidentalConvRate must be in (0, baseConvRate)');
  if (!(p.reachDecayExponent > 0)) fail('reachDecayExponent must be > 0');
  if (!(p.effFloor > 0 && p.effFloor < 1)) fail('effFloor must be in (0, 1)');
  if (!(p.confHalfPoint > 0)) fail('confHalfPoint must be > 0');
  if (!(p.timeLearnRate > 0 && p.timeLearnRate <= 1)) fail('timeLearnRate must be in (0, 1]');
  if (!(p.maxDailyReachRate > 0 && p.maxDailyReachRate < 1)) fail('maxDailyReachRate must be in (0, 1)');
  if (!(p.referrerEligibilityRate >= 0 && p.referrerEligibilityRate < 1)) fail('referrerEligibilityRate must be in [0, 1)');
  if (!(p.avgResolutionDays >= 1 && p.avgResolutionDays <= p.offerExpirationDays)) fail('avgResolutionDays must be in [1, offerExpirationDays]');
  if (!(p.offerExpirationDays > 0 && p.offerExpirationDays <= 30)) fail('offerExpirationDays must be in (0, 30]');
  if (!(p.baseRevenuePerUser > 0)) fail('baseRevenuePerUser must be > 0');
  if (!(p.premiumRevenuePerUser >= p.baseRevenuePerUser)) fail('premiumRevenuePerUser must be >= baseRevenuePerUser');
  if (!(p.effFloor > 0 || p.accidentalConvRate > 0)) fail('effFloor or accidentalConvRate must be > 0 (bootstrap safety)');
  if (!(Array.isArray(p.referrerTiers) && p.referrerTiers.length >= 2)) fail('referrerTiers must be an array with >= 2 elements');
  if (!(Array.isArray(p.refereeTiers) && p.refereeTiers.length >= 2)) fail('refereeTiers must be an array with >= 2 elements');
  if (!(Array.isArray(p.tierDistLowEff) && p.tierDistLowEff.length === p.referrerTiers.length)) fail('tierDistLowEff must match referrerTiers length');
  if (!(Array.isArray(p.tierDistHighEff) && p.tierDistHighEff.length === p.referrerTiers.length)) fail('tierDistHighEff must match referrerTiers length');
}

// ─── Main Computation ───────────────────────────────────────────────
/**
 * @param {Object} options
 * @param {number} options.budget - Monthly budget in dollars
 * @param {Object} options.params - Engine parameters (from config per vertical)
 * @returns {Object} Projection results
 */
export function computeProjection({ budget, params }) {
  assertParams(params);

  const {
    totalCustomers,
    eligibilityRate,
    N_max,
    B_half,
    alpha,
    baseConvRate,
    accidentalConvRate,
    reachDecayExponent,
    referrerEligibilityRate,
    maxDailyReachRate,
    avgResolutionDays,
    offerExpirationDays,
    baseRevenuePerUser,
    premiumRevenuePerUser,
    referrerTiers,
    refereeTiers,
    tierDistLowEff,
    tierDistHighEff,
    fraudRate,
    minSignalVolume,
    budget: budgetThresholds,
  } = params;

  // ─── Setup ─────────────────────────────────────────────────────────
  const audienceSize = Math.round(totalCustomers * eligibilityRate);

  // Supply curve: theoretical max CONVERSIONS at this budget
  const N_frontier = supplyFrontier(budget, N_max, B_half, alpha);

  // Budget pressure: how hard you're pushing relative to the sweet spot.
  // Squared so premium is near-zero at low budgets (cherry-picking cheap tiers)
  // and ramps steeply at high budgets (full audience needs bigger rewards).
  const budgetPressure = Math.pow(budget / (budget + B_half), 2);

  // Budget-as-reward-pool constraint: can't convert more than budget can pay for.
  // Only resolved conversions cost rewards (expired offers cost nothing),
  // so we scale up by 1/realizationEstimate to account for resolution losses.
  const midEffReward = rewardCostForEfficiency(0.5, referrerTiers, refereeTiers, tierDistLowEff, tierDistHighEff);
  const reachCostPremium = 1 + budgetPressure * (params.reachCostElasticity || 1.0);
  const adjMidEffReward = midEffReward * reachCostPremium;
  const realizationEstimate = params.budgetRealizationFactor || 0.55;
  const maxAffordable = adjMidEffReward > 0 ? budget / adjMidEffReward / realizationEstimate : Infinity;
  const effectiveN = Math.min(N_frontier, maxAffordable);

  // Convert from conversion units to journey units
  const totalJourneys = effectiveN / baseConvRate;
  const dailyJourneyTarget = totalJourneys / 30;

  // Reach quality: wider net = lower quality per contact (structural, not temporal)
  const reachPenetration = totalJourneys / audienceSize;
  const qualityFactor = Math.pow(1 - reachPenetration, reachDecayExponent);
  const effectiveBaseConvRate = baseConvRate * qualityFactor;

  // Pre-compute resolution distribution weights (once)
  const resolutionWeights = computeResolutionWeights(avgResolutionDays, offerExpirationDays);

  let remainingPool = audienceSize;
  let cumulativeN = 0;
  let cumulativeValue = 0;
  let totalJourneysStarted = 0;
  const pendingConversions = []; // {resolveDay, count, value}

  const dailyCurve = [];
  const confidenceCurve = [];
  const kpiCurves = { cac: [], roi: [], convRate: [], fraudSaved: [] };
  const dailyKPIs = { cac: [], roi: [], convRate: [], fraudSaved: [] };
  const dailySpend = budget / 30;
  let cumulativeRewardCost = 0;
  let thresholdDay = 30;
  let thresholdFound = false;

  // ─── Daily Loop ────────────────────────────────────────────────────
  for (let day = 1; day <= 30; day++) {
    // Efficiency uses only RESOLVED conversions
    const eff = allocationEfficiency(day, cumulativeN, params);
    confidenceCurve.push(eff);

    // Reward cost: eff-driven tier mix + budget pressure premium
    const baseRewardCost = rewardCostForEfficiency(eff, referrerTiers, refereeTiers, tierDistLowEff, tierDistHighEff);
    // reachCostPremium computed once before loop from budgetPressure
    const dailyRewardCost = baseRewardCost * reachCostPremium;

    // Pace journeys: don't exhaust pool before learning
    const journeysToday = Math.min(dailyJourneyTarget, remainingPool * maxDailyReachRate);

    // Reward-to-conversion boost: higher rewards increase prospect willingness to convert
    const maxTierCost = referrerTiers[referrerTiers.length - 1] + refereeTiers[refereeTiers.length - 1];
    const rewardIntensity = maxTierCost > 0 ? dailyRewardCost / maxTierCost : 0;
    const rewardConvBoost = 1 + rewardIntensity * (params.rewardConvElasticity || 0.5);
    const adjustedConvRate = effectiveBaseConvRate * rewardConvBoost;

    // Targeting split
    const wellTargeted = journeysToday * eff;
    const goodConversions = wellTargeted * adjustedConvRate;

    const poorlyTargeted = journeysToday * (1 - eff);
    const accidentalConversions = poorlyTargeted * accidentalConvRate;

    const dailyConversionsGenerated = goodConversions + accidentalConversions;

    // Value learning: engine finds super referrers who bring high-value customers
    const effectiveRevenuePerUser = baseRevenuePerUser +
      (premiumRevenuePerUser - baseRevenuePerUser) * eff;
    const dailyValueGenerated = dailyConversionsGenerated * effectiveRevenuePerUser;

    // Distribute conversions across future days using normal distribution
    for (let delayIdx = 0; delayIdx < offerExpirationDays; delayIdx++) {
      const delay = delayIdx + 1; // delays are 1..offerExpirationDays
      const resolveDay = day + delay;
      if (resolveDay <= 30) {
        pendingConversions.push({
          resolveDay,
          count: dailyConversionsGenerated * resolutionWeights[delayIdx],
          value: dailyValueGenerated * resolutionWeights[delayIdx],
        });
      }
      // Conversions resolving after day 30 are lost (conservative)
    }

    // Resolve any conversions scheduled for today
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

    // Pool dynamics
    remainingPool -= journeysToday;                                // journeys deplete pool
    remainingPool += resolvedToday * referrerEligibilityRate;      // new referrers enter pool
    remainingPool = Math.min(remainingPool, audienceSize);         // cap at audience size
    remainingPool = Math.max(0, remainingPool);                    // floor at 0

    totalJourneysStarted += journeysToday;

    // Threshold: cumulative resolved conversions reach statistical significance
    if (!thresholdFound && cumulativeN >= (minSignalVolume || 40)) {
      thresholdDay = day;
      thresholdFound = true;
    }

    // Running cumulative KPI trajectories
    const cumSpend = (budget / 30) * day;
    kpiCurves.cac.push(cumulativeN > 0 ? Math.round(cumulativeRewardCost / cumulativeN) : 0);
    kpiCurves.roi.push(cumSpend > 0 ? Math.round((cumulativeValue / cumSpend) * 10) / 10 : 0);
    kpiCurves.convRate.push(totalJourneysStarted > 0
      ? Math.round((cumulativeN / totalJourneysStarted) * 10000) / 100 : 0);
    kpiCurves.fraudSaved.push(Math.round(cumSpend * fraudRate));

    // Daily KPI values (marginal, this day only — for sparkline trends)
    dailyKPIs.cac.push(resolvedToday > 0 ? Math.round(dailyRewardCost) : 0);
    dailyKPIs.roi.push(resolvedToday > 0 ? Math.round((resolvedValueToday / dailySpend) * 10) / 10 : 0);
    dailyKPIs.convRate.push(journeysToday > 0
      ? Math.round((resolvedToday / journeysToday) * 10000) / 100 : 0);
    dailyKPIs.fraudSaved.push(Math.round(dailySpend * fraudRate));

    // Daily output: resolved conversions (rounded for display, minimum 0)
    dailyCurve.push(Math.max(0, Math.round(resolvedToday)));
  }

  // ─── Aggregate Metrics ─────────────────────────────────────────────
  const activeUsers = dailyCurve.reduce((sum, v) => sum + v, 0);
  const cac = activeUsers > 0 ? Math.round(cumulativeRewardCost / activeUsers) : 999;

  // ROI uses actual cumulative value generated (not fixed average)
  const roi = cumulativeValue > 0 && budget > 0
    ? Math.round((cumulativeValue / budget) * 10) / 10
    : 0;

  // Average value per user: shows engine finds better customers over time
  const avgValuePerUser = activeUsers > 0
    ? Math.round(cumulativeValue / activeUsers)
    : 0;

  // Conversion rate: derived from simulation
  // 2 decimal places — needed for coherence at low rates (~1%)
  const convRate = totalJourneysStarted > 0
    ? Math.round((activeUsers / totalJourneysStarted) * 10000) / 100
    : 0;

  const fraudSaved = Math.round(budget * fraudRate);

  // ─── Guidance State ────────────────────────────────────────────────
  let guidanceState;
  if (budget < budgetThresholds.floor) {
    guidanceState = 'belowFloor';
  } else if (budget < budgetThresholds.recMin) {
    guidanceState = 'belowRec';
  } else if (budget <= budgetThresholds.recMax) {
    guidanceState = 'atRec';
  } else {
    guidanceState = 'aboveRec';
  }

  return {
    dailyCurve,
    thresholdDay,
    activeUsers,
    cac,
    roi,
    convRate,
    fraudSaved,
    guidanceState,
    confidenceCurve,
    totalJourneysStarted: Math.round(totalJourneysStarted),
    dailyJourneyTarget: Math.round(dailyJourneyTarget),
    avgValuePerUser,
    kpiCurves,
    dailyKPIs,
  };
}
