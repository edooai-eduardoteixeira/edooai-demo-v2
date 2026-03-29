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
 *   3. Budget-driven tier selection & reward dynamics:
 *      - Wider reach = lower quality per contact (effectiveBaseConvRate decreases)
 *      - Tier distribution driven by budget level: low budget → cheap tiers
 *        (cherry-picking easy converts), high budget → expensive tiers
 *        (hard prospects need bigger incentives). CAC is always bounded by tiers.
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
function allocationEfficiency(day, cumulativeResolved, p) {
  const timeFactor = 1 - Math.exp(-p.timeLearnRate * day);
  const volumeFactor = cumulativeResolved / (cumulativeResolved + p.confHalfPoint);
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
// given a tier interpolation factor (0 = cheap distribution, 1 = expensive).
// Budget level drives the primary interpolation (deeper reach = more expensive tiers).
// Efficiency provides a small secondary discount (trained engine saves on tier selection).
function blendedRewardCost(factor, referrerTiers, refereeTiers, distCheap, distExpensive) {
  const weights = distCheap.map((wCheap, i) => wCheap + (distExpensive[i] - wCheap) * factor);
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
  if (!(Array.isArray(p.tierDistCheap) && p.tierDistCheap.length === p.referrerTiers.length)) fail('tierDistCheap must match referrerTiers length');
  if (!(Array.isArray(p.tierDistExpensive) && p.tierDistExpensive.length === p.referrerTiers.length)) fail('tierDistExpensive must match referrerTiers length');
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
    tierDistCheap,
    tierDistExpensive,
    fraudRate,
    minSignalVolume,
    budget: budgetThresholds,
  } = params;

  // ─── Setup ─────────────────────────────────────────────────────────
  const audienceSize = Math.round(totalCustomers * eligibilityRate);

  // Supply curve: theoretical max CONVERSIONS at this budget
  const N_frontier = supplyFrontier(budget, N_max, B_half, alpha);

  // Budget-driven tier reach: determines reward tier distribution.
  // Low budget → cheap tiers (cherry-picking easy converts).
  // High budget → expensive tiers (hard prospects need bigger incentives).
  // Uses power function for tunable concavity.
  const tierBudgetCeiling = params.tierBudgetCeiling || 300000;
  const tierBudgetAlpha = params.tierBudgetAlpha || 0.7;
  const tierReach = Math.pow(Math.min(1, budget / tierBudgetCeiling), tierBudgetAlpha);

  const effTierDiscount = params.effTierDiscount || 0.10;

  // Supply frontier: max journeys at this budget level (audience constraint).
  // Budget is paced adaptively in the daily loop — each day uses
  // remainingBudget / remainingDays to determine daily spend.
  const maxJourneys = N_frontier / baseConvRate;
  const supplyDailyTarget = maxJourneys / 30;

  // Reach quality: wider net = lower quality per contact (structural, not temporal)
  // Cap penetration at 0.99 to prevent degenerate quality factor (0^x = 0)
  const reachPenetration = Math.min(maxJourneys / audienceSize, 0.99);
  const qualityFactor = Math.pow(1 - reachPenetration, reachDecayExponent);
  const effectiveBaseConvRate = baseConvRate * qualityFactor;

  // Pre-compute resolution distribution weights (once)
  const resolutionWeights = computeResolutionWeights(avgResolutionDays, offerExpirationDays);


  let remainingPool = audienceSize;
  let remainingBudget = budget;
  let cumulativeResolved = 0;
  let cumulativeGenerated = 0;
  let cumulativeValue = 0;
  let cumulativeGeneratedValue = 0;
  let totalJourneysStarted = 0;
  const pendingConversions = []; // {resolveDay, count, value}

  const dailyCurve = [];
  const confidenceCurve = [];
  const kpiCurves = { cac: [], roi: [], convRate: [], fraudSaved: [] };
  const dailyKPIs = { cac: [], roi: [], convRate: [], fraudSaved: [] };
  let cumulativeRewardCost = 0;
  let thresholdDay = 30;
  let thresholdFound = false;

  // ─── Daily Loop ────────────────────────────────────────────────────
  for (let day = 1; day <= 30; day++) {
    // Efficiency uses only RESOLVED conversions
    const eff = allocationEfficiency(day, cumulativeResolved, params);
    confidenceCurve.push(eff);

    // Reward cost: budget-driven tier distribution with learning discount.
    // tierReach (computed once before loop) determines base tier mix.
    // Efficiency provides a small discount (trained engine saves on tier selection).
    const baseTierCost = blendedRewardCost(tierReach, referrerTiers, refereeTiers, tierDistCheap, tierDistExpensive);
    const dailyRewardCost = baseTierCost * (1 - eff * effTierDiscount);

    // Conversion rate: compute before journey pacing (needed for budget constraint)
    const maxTierCost = referrerTiers[referrerTiers.length - 1] + refereeTiers[refereeTiers.length - 1];
    const rewardIntensity = maxTierCost > 0 ? dailyRewardCost / maxTierCost : 0;
    const rewardConvBoost = 1 + rewardIntensity * (params.rewardConvElasticity || 0.5);
    const adjustedConvRate = effectiveBaseConvRate * rewardConvBoost;

    // Adaptive budget pacing: spread remaining budget evenly over remaining days.
    // Cost per journey accounts for the efficiency split: well-targeted journeys
    // convert at adjustedConvRate, poorly-targeted at accidentalConvRate.
    const remainingDays = 31 - day;
    const dailyBudget = remainingDays > 0 ? remainingBudget / remainingDays : 0;
    const expectedConvPerJourney = eff * adjustedConvRate + (1 - eff) * accidentalConvRate;
    const expectedCostPerJourney = dailyRewardCost * expectedConvPerJourney;
    const budgetJourneyCap = expectedCostPerJourney > 0 ? dailyBudget / expectedCostPerJourney : Infinity;
    const journeysToday = remainingBudget <= 0 ? 0 : Math.min(supplyDailyTarget, remainingPool * maxDailyReachRate, budgetJourneyCap);

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

    // Cohort attribution: count all generated conversions as acquired users.
    // Budget is committed at generation time (reward is owed on conversion).
    const generationRewardCost = dailyRewardCost * dailyConversionsGenerated;
    cumulativeRewardCost += generationRewardCost;
    remainingBudget -= generationRewardCost;
    cumulativeGenerated += dailyConversionsGenerated;
    cumulativeGeneratedValue += dailyValueGenerated;

    // Distribute conversions across future days for the daily S-curve visual
    for (let delayIdx = 0; delayIdx < offerExpirationDays; delayIdx++) {
      const delay = delayIdx + 1;
      const resolveDay = day + delay;
      if (resolveDay <= 30) {
        pendingConversions.push({
          resolveDay,
          count: dailyConversionsGenerated * resolutionWeights[delayIdx],
        });
      }
    }

    // Resolve pending conversions scheduled for today (for S-curve display)
    let resolvedToday = 0;
    for (const entry of pendingConversions) {
      if (entry.resolveDay === day) {
        resolvedToday += entry.count;
      }
    }
    cumulativeResolved += resolvedToday;
    cumulativeValue += dailyValueGenerated;

    // Pool dynamics
    remainingPool -= journeysToday;                                // journeys deplete pool
    remainingPool += resolvedToday * referrerEligibilityRate;      // new referrers enter pool
    remainingPool = Math.min(remainingPool, audienceSize);         // cap at audience size
    remainingPool = Math.max(0, remainingPool);                    // floor at 0

    totalJourneysStarted += journeysToday;

    // Threshold: cumulative generated conversions reach statistical significance
    if (!thresholdFound && cumulativeGenerated >= (minSignalVolume || 40)) {
      thresholdDay = day;
      thresholdFound = true;
    }

    // Running cumulative KPI trajectories (cohort attribution — all generated conversions)
    kpiCurves.cac.push(cumulativeGenerated > 0 ? Math.round(cumulativeRewardCost / cumulativeGenerated) : 0);
    kpiCurves.roi.push(cumulativeRewardCost > 0 ? Math.round((cumulativeGeneratedValue / cumulativeRewardCost) * 10) / 10 : 0);
    kpiCurves.convRate.push(totalJourneysStarted > 0
      ? Math.round((cumulativeGenerated / totalJourneysStarted) * 10000) / 100 : 0);
    kpiCurves.fraudSaved.push(Math.round(cumulativeRewardCost * fraudRate));

    // Daily KPI values (marginal, this day only — for sparkline trends)
    dailyKPIs.cac.push(dailyConversionsGenerated > 0 ? Math.round(generationRewardCost / dailyConversionsGenerated) : 0);
    dailyKPIs.roi.push(generationRewardCost > 0 ? Math.round((dailyValueGenerated / generationRewardCost) * 10) / 10 : 0);
    dailyKPIs.convRate.push(journeysToday > 0
      ? Math.round((dailyConversionsGenerated / journeysToday) * 10000) / 100 : 0);
    dailyKPIs.fraudSaved.push(Math.round(generationRewardCost * fraudRate));

    // Daily output: generated conversions (cohort view — matches activeUsers total)
    dailyCurve.push(Math.max(0, Math.round(dailyConversionsGenerated)));
  }

  // ─── Aggregate Metrics (Cohort Attribution) ─────────────────────────
  // activeUsers = all conversions generated in the 30-day period.
  // Uses cohort attribution: conversions are counted when generated,
  // not when resolved. This is industry standard (Google Ads, Meta, etc.).
  const activeUsers = dailyCurve.reduce((sum, v) => sum + v, 0);

  // dailyCurve shows resolved conversions per day (for S-curve visualization)
  // activeUsers may be higher than sum(dailyCurve) due to pipeline conversions

  // CAC = budget / users. Simple, verifiable by anyone.
  // The engine generates enough users so that CAC ≤ max reward tier.
  const cac = activeUsers > 0 ? Math.round(budget / activeUsers) : 999;

  // Budget utilization: how much of the budget was committed to conversions
  const budgetUtilization = budget > 0 ? cumulativeRewardCost / budget : 0;

  // ROI = revenue generated / budget allocated
  const roi = budget > 0
    ? Math.round((cumulativeGeneratedValue / budget) * 10) / 10
    : 0;

  // Average value per user: shows engine finds better customers over time
  const avgValuePerUser = activeUsers > 0
    ? Math.round(cumulativeGeneratedValue / activeUsers)
    : 0;

  // Conversion rate: generated conversions / journeys started
  const convRate = totalJourneysStarted > 0
    ? Math.round((activeUsers / totalJourneysStarted) * 10000) / 100
    : 0;

  const fraudSaved = Math.round(cumulativeRewardCost * fraudRate);

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
    dailyJourneyTarget: Math.round(supplyDailyTarget),
    avgValuePerUser,
    budgetUtilization: Math.round(budgetUtilization * 100),
    kpiCurves,
    dailyKPIs,
  };
}
