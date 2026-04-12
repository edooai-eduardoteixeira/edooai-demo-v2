import { generateDayBriefing } from './nameGenerator.js';

/**
 * Projection Engine v3/v4 — Journey Model with Distributed Resolution & Value Learning
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
// given a tier interpolation factor (0 = cheap distribution, 1 = expensive).
// Budget level drives the primary interpolation (deeper reach = more expensive tiers).
// Efficiency provides a small secondary discount (trained engine saves on tier selection).
function blendedRewardCost(factor, referrerTiers, refereeTiers, distCheap, distExpensive) {
  const weights = distCheap.map((wCheap, i) => wCheap + (distExpensive[i] - wCheap) * factor);
  let referrer = 0, referee = 0;
  for (let i = 0; i < weights.length; i++) {
    referrer += weights[i] * referrerTiers[i];
    referee += weights[i] * refereeTiers[i];
  }
  return { referrer, referee, total: referrer + referee };
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

  // Expected reward cost at this budget level (at mid efficiency for budget constraint)
  const effTierDiscount = params.effTierDiscount || 0.10;
  const midBudgetRewardCost = blendedRewardCost(tierReach, referrerTiers, refereeTiers, tierDistCheap, tierDistExpensive).total;
  const midEffDiscountFactor = 1 - 0.5 * effTierDiscount; // at mid efficiency
  const adjMidEffReward = midBudgetRewardCost * midEffDiscountFactor;

  // Budget-as-reward-pool constraint: can't convert more than budget can pay for.
  // Only resolved conversions cost rewards (expired offers cost nothing),
  // so we scale up by 1/realizationEstimate to account for resolution losses.
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

    // Reward cost: budget-driven tier distribution with learning discount.
    // tierReach (computed once before loop) determines base tier mix.
    // Efficiency provides a small discount (trained engine saves on tier selection).
    const tierCosts = blendedRewardCost(tierReach, referrerTiers, refereeTiers, tierDistCheap, tierDistExpensive);
    const dailyRewardCost = tierCosts.total * (1 - eff * effTierDiscount);

    // Pace journeys: don't exhaust pool before learning
    const journeysToday = Math.min(dailyJourneyTarget, remainingPool * maxDailyReachRate);
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
    // Use generation-time values (not resolution-time) to avoid cohort mismatch
    dailyKPIs.cac.push(dailyConversionsGenerated > 0 ? Math.round(dailyRewardCost) : 0);
    dailyKPIs.roi.push(dailyConversionsGenerated > 0 ? Math.round((dailyValueGenerated / dailySpend) * 10) / 10 : 0);
    dailyKPIs.convRate.push(journeysToday > 0
      ? Math.round((dailyConversionsGenerated / journeysToday) * 10000) / 100 : 0);
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


// ═══════════════════════════════════════════════════════════════════════
// v4 — Dashboard Projection Engine
// Extends v3 with: funnel stages, cohort tracking, decision log,
// static baseline, learning annotations, agent recommendations.
// ═══════════════════════════════════════════════════════════════════════

/**
 * Compute tier distribution weights for a given budget reach and efficiency.
 */
function getTierDistribution(tierReach, distCheap, distExpensive, eff, effTierDiscount) {
  // Interpolate base distribution by budget reach
  const base = distCheap.map((wCheap, i) => wCheap + (distExpensive[i] - wCheap) * tierReach);
  // Efficiency shifts distribution toward cheaper tiers (small effect)
  const shift = eff * effTierDiscount;
  const adjusted = base.map((w, i) => {
    if (i === 0) return w + shift * (1 - w); // more Tier 1
    return w * (1 - shift);
  });
  const sum = adjusted.reduce((s, v) => s + v, 0);
  return adjusted.map(v => v / sum);
}

/**
 * Run the core simulation loop and return detailed per-day data.
 * staticMode: if true, locks efficiency at floor (no learning).
 */
function runSimulation({ budget, params, staticMode = false }) {
  const {
    totalCustomers, eligibilityRate, N_max, B_half, alpha,
    baseConvRate, accidentalConvRate, reachDecayExponent,
    referrerEligibilityRate, maxDailyReachRate, avgResolutionDays,
    offerExpirationDays, baseRevenuePerUser, premiumRevenuePerUser,
    referrerTiers, refereeTiers, tierDistCheap, tierDistExpensive,
    fraudRate, minSignalVolume, budget: budgetThresholds,
  } = params;

  const audienceSize = Math.round(totalCustomers * eligibilityRate);
  const N_frontier = supplyFrontier(budget, N_max, B_half, alpha);

  const tierBudgetCeiling = params.tierBudgetCeiling || 300000;
  const tierBudgetAlpha = params.tierBudgetAlpha || 0.7;
  const tierReach = Math.pow(Math.min(1, budget / tierBudgetCeiling), tierBudgetAlpha);

  const effTierDiscount = params.effTierDiscount || 0.10;
  const midBudgetRewardCost = blendedRewardCost(tierReach, referrerTiers, refereeTiers, tierDistCheap, tierDistExpensive).total;
  const midEffDiscountFactor = 1 - 0.5 * effTierDiscount;
  const adjMidEffReward = midBudgetRewardCost * midEffDiscountFactor;

  const realizationEstimate = params.budgetRealizationFactor || 0.55;
  const maxAffordable = adjMidEffReward > 0 ? budget / adjMidEffReward / realizationEstimate : Infinity;
  const effectiveN = Math.min(N_frontier, maxAffordable);

  const totalJourneys = effectiveN / baseConvRate;
  const dailyJourneyTarget = totalJourneys / 30;

  const reachPenetration = totalJourneys / audienceSize;
  const qualityFactor = Math.pow(1 - reachPenetration, reachDecayExponent);
  const effectiveBaseConvRate = baseConvRate * qualityFactor;

  const resolutionWeights = computeResolutionWeights(avgResolutionDays, offerExpirationDays);

  // Funnel sub-stage config
  const baseShareRate = params.baseShareRate || 0.55;
  const shareLearnFactor = params.shareLearnFactor || 0.35;
  const signupRate = params.signupRate || 0.28;

  let remainingPool = audienceSize;
  let cumulativeN = 0;
  let cumulativeValue = 0;
  let totalJourneysStarted = 0;

  // Cohort tracking: pendingConversions now includes startDay
  const pendingConversions = [];

  // Per-day outputs
  const days = [];
  const dailySpend = budget / 30;
  let cumulativeRewardCost = 0;
  let cumulativeReferrerCost = 0;
  let cumulativeRefereeCost = 0;
  let thresholdDay = 30;
  let thresholdFound = false;

  // Cumulative funnel counters
  let cumContacted = 0;
  let cumReferralSent = 0;
  let cumSignedUp = 0;
  let cumActiveUser = 0;

  // Cohort resolution matrix: cohorts[startDay] = { contacted, resolutionByDay: {resolveDay: count} }
  const cohorts = {};

  for (let day = 1; day <= 30; day++) {
    const eff = staticMode
      ? params.effFloor
      : allocationEfficiency(day, cumulativeN, params);

    const tierCosts = blendedRewardCost(tierReach, referrerTiers, refereeTiers, tierDistCheap, tierDistExpensive);
    const dailyReferrerCost = tierCosts.referrer * (1 - eff * effTierDiscount);
    const dailyRefereeCost = tierCosts.referee * (1 - eff * effTierDiscount);
    const dailyRewardCost = dailyReferrerCost + dailyRefereeCost;

    const maxCapacity = remainingPool * maxDailyReachRate;
    const journeysToday = Math.min(dailyJourneyTarget, maxCapacity);
    const capHit = dailyJourneyTarget > maxCapacity * 1.01; // within 1% = cap hit

    const maxTierCost = referrerTiers[referrerTiers.length - 1] + refereeTiers[refereeTiers.length - 1];
    const rewardIntensity = maxTierCost > 0 ? dailyRewardCost / maxTierCost : 0;
    const rewardConvBoost = 1 + rewardIntensity * (params.rewardConvElasticity || 0.5);
    const adjustedConvRate = effectiveBaseConvRate * rewardConvBoost;

    const wellTargeted = journeysToday * eff;
    const goodConversions = wellTargeted * adjustedConvRate;
    const poorlyTargeted = journeysToday * (1 - eff);
    const accidentalConversions = poorlyTargeted * accidentalConvRate;
    const dailyConversionsGenerated = goodConversions + accidentalConversions;

    const effectiveRevenuePerUser = staticMode
      ? baseRevenuePerUser
      : baseRevenuePerUser + (premiumRevenuePerUser - baseRevenuePerUser) * eff;
    const dailyValueGenerated = dailyConversionsGenerated * effectiveRevenuePerUser;

    // Funnel sub-stages for today's cohort
    const effectiveShareRate = baseShareRate * (1 + eff * shareLearnFactor);
    const referralsSent = journeysToday * Math.min(effectiveShareRate, 0.95);
    const signedUp = referralsSent * signupRate;

    // Track this cohort
    cohorts[day] = {
      contacted: Math.round(journeysToday),
      referralSent: Math.round(referralsSent),
      signedUp: Math.round(signedUp),
      conversionsGenerated: dailyConversionsGenerated,
      resolutionByDay: {},
      cumulativeResolved: [],
    };

    // Distribute conversions across future days
    for (let delayIdx = 0; delayIdx < offerExpirationDays; delayIdx++) {
      const delay = delayIdx + 1;
      const resolveDay = day + delay;
      const count = dailyConversionsGenerated * resolutionWeights[delayIdx];
      const value = dailyValueGenerated * resolutionWeights[delayIdx];

      if (resolveDay <= 30) {
        pendingConversions.push({ startDay: day, resolveDay, count, value });
        cohorts[day].resolutionByDay[resolveDay] = (cohorts[day].resolutionByDay[resolveDay] || 0) + count;
      }
    }

    // Resolve conversions scheduled for today
    let resolvedToday = 0;
    let resolvedValueToday = 0;
    for (const entry of pendingConversions) {
      if (entry.resolveDay === day) {
        resolvedToday += entry.count;
        resolvedValueToday += entry.value;
      }
    }
    cumulativeRewardCost += dailyRewardCost * resolvedToday;
    cumulativeReferrerCost += dailyReferrerCost * resolvedToday;
    cumulativeRefereeCost += dailyRefereeCost * resolvedToday;
    cumulativeN += resolvedToday;
    cumulativeValue += resolvedValueToday;

    remainingPool -= journeysToday;
    remainingPool += resolvedToday * referrerEligibilityRate;
    remainingPool = Math.min(remainingPool, audienceSize);
    remainingPool = Math.max(0, remainingPool);

    totalJourneysStarted += journeysToday;

    if (!thresholdFound && cumulativeN >= (minSignalVolume || 40)) {
      thresholdDay = day;
      thresholdFound = true;
    }

    // Cumulative funnel
    cumContacted += Math.round(journeysToday);
    cumReferralSent += Math.round(referralsSent);
    cumSignedUp += Math.round(signedUp);
    cumActiveUser += Math.max(0, Math.round(resolvedToday));

    // Count pending offers + pipeline forecast
    let pending = 0;
    let pipeline7Day = 0;
    for (const entry of pendingConversions) {
      if (entry.resolveDay > day) {
        pending += entry.count;
        if (entry.resolveDay <= day + 7) pipeline7Day += entry.count;
      }
    }

    // Sustainability: simple placeholder (remainingPool / audienceSize)
    const sustainabilityPct = audienceSize > 0 ? remainingPool / audienceSize : 1;

    // Tier distribution for this day
    const tierDist = getTierDistribution(tierReach, tierDistCheap, tierDistExpensive, eff, effTierDiscount);

    const cumSpend = dailySpend * day;

    days.push({
      day,
      efficiency: eff,
      journeysToday: Math.round(journeysToday),
      resolvedToday: Math.max(0, Math.round(resolvedToday)),
      cumulativeN: Math.round(cumulativeN),
      cumulativeValue: Math.round(cumulativeValue),
      cumulativeRewardCost: Math.round(cumulativeRewardCost),
      cumulativeSpend: Math.round(cumSpend),
      remainingPool: Math.round(remainingPool),
      capHit,
      rewardCostPerConversion: Math.round(dailyRewardCost),
      dailyReferrerCost: Math.round(dailyReferrerCost),
      dailyRefereeCost: Math.round(dailyRefereeCost),
      effectiveRevenuePerUser: Math.round(effectiveRevenuePerUser),
      tierDistribution: tierDist.map(v => Math.round(v * 100) / 100),
      // Campaign health fields
      maxCapacity: Math.round(maxCapacity),
      dailyJourneyTarget: Math.round(dailyJourneyTarget),
      pipeline7Day: Math.round(pipeline7Day),
      sustainabilityPct: Math.round(sustainabilityPct * 100) / 100,
      sustainabilityStatus: sustainabilityPct > 0.7 ? 'sustainable' : sustainabilityPct > 0.4 ? 'tightening' : 'at_risk',
      funnelCumulative: {
        contacted: cumContacted,
        referralSent: cumReferralSent,
        signedUp: cumSignedUp,
        activeUser: cumActiveUser,
        pending: Math.round(pending),
      },
      dailyFunnel: {
        contacted: Math.round(journeysToday),
        referralSent: Math.round(referralsSent),
        signedUp: Math.round(signedUp),
        activeUser: Math.max(0, Math.round(resolvedToday)),
      },
      kpiCumulative: {
        cac: cumulativeN > 0 ? Math.round(cumulativeRewardCost / cumulativeN) : 0,
        roi: cumSpend > 0 ? Math.round((cumulativeValue / cumSpend) * 10) / 10 : 0,
        convRate: totalJourneysStarted > 0
          ? Math.round((cumulativeN / totalJourneysStarted) * 10000) / 100 : 0,
        fraudSaved: Math.round(cumSpend * fraudRate),
      },
    });
  }

  // Build cohort resolution curves (cumulative conversions over time since start)
  for (const startDay of Object.keys(cohorts)) {
    const cohort = cohorts[startDay];
    const curve = [];
    let cumResolved = 0;
    for (let d = 1; d <= 14; d++) {
      const resolveDay = Number(startDay) + d;
      cumResolved += (cohort.resolutionByDay[resolveDay] || 0);
      curve.push(Math.round(cumResolved * 100) / 100);
    }
    cohort.cumulativeResolved = curve;
    cohort.totalResolved = Math.round(cumResolved);
    cohort.convRate = cohort.contacted > 0
      ? Math.round((cumResolved / cohort.contacted) * 10000) / 100 : 0;
  }

  const activeUsers = days.reduce((sum, d) => sum + d.resolvedToday, 0);
  const finalCumN = days[29]?.cumulativeN || 0;

  return {
    days,
    cohorts,
    thresholdDay,
    activeUsers,
    cac: finalCumN > 0 ? Math.round(days[29].cumulativeRewardCost / finalCumN) : 999,
    roi: budget > 0 ? Math.round((days[29]?.cumulativeValue || 0) / budget * 10) / 10 : 0,
    convRate: totalJourneysStarted > 0
      ? Math.round((finalCumN / totalJourneysStarted) * 10000) / 100 : 0,
    fraudSaved: Math.round(budget * fraudRate),
    totalJourneysStarted: Math.round(totalJourneysStarted),
    audienceSize,
    budget,
  };
}

/**
 * Derive learning annotations from simulation data.
 * These are specific, data-driven moments where the agent's behavior measurably changed.
 */
function deriveLearningAnnotations(agenticDays, staticDays, params) {
  const annotations = [];

  // 1. Signal threshold: when minSignalVolume was reached
  const signalDay = agenticDays.find(d => d.cumulativeN >= (params.minSignalVolume || 100));
  if (signalDay) {
    const effPct = Math.round(signalDay.efficiency * 100);
    annotations.push({
      day: signalDay.day,
      type: 'signal',
      title: 'Signal threshold reached',
      description: `${signalDay.cumulativeN} conversions resolved. Targeting accuracy: ${effPct}% (up from ${Math.round(params.effFloor * 100)}% baseline).`,
    });
  }

  // 2. Tier optimization: find day where Tier 1 usage meaningfully exceeds baseline
  const baselineTier1 = agenticDays[0]?.tierDistribution[0] || 0;
  const tierShiftDay = agenticDays.find(d =>
    d.day >= 7 && d.tierDistribution[0] > baselineTier1 * 1.3 && d.tierDistribution[0] > 0.10
  );
  if (tierShiftDay) {
    const tier1Pct = Math.round(tierShiftDay.tierDistribution[0] * 100);
    const baselinePct = Math.round(baselineTier1 * 100);
    const savingsPerConversion = params.referrerTiers[params.referrerTiers.length - 1] +
      params.refereeTiers[params.refereeTiers.length - 1];
    const organicCount = Math.round(tierShiftDay.funnelCumulative.activeUser * tierShiftDay.tierDistribution[0]);
    annotations.push({
      day: tierShiftDay.day,
      type: 'tier',
      title: 'Reward optimization',
      description: `Tier 1 (organic) usage at ${tier1Pct}% (up from ${baselinePct}%). ${organicCount} customers identified as self-converting — $${savingsPerConversion} saved per conversion.`,
    });
  }

  // 3. Value learning: find day where revenue per user meaningfully exceeds baseline
  const baseRevenue = params.baseRevenuePerUser;
  const valueDay = agenticDays.find(d =>
    d.day >= 10 && d.effectiveRevenuePerUser > baseRevenue * 1.5
  );
  if (valueDay) {
    annotations.push({
      day: valueDay.day,
      type: 'value',
      title: 'High-value segment discovery',
      description: `Revenue per converted user: $${valueDay.effectiveRevenuePerUser} (baseline: $${baseRevenue}). Agent targeting referrer segments that bring ${Math.round(valueDay.effectiveRevenuePerUser / baseRevenue * 10) / 10}x higher-LTV customers.`,
    });
  }

  // 4. Divergence point: when agentic active users exceed static by >20%
  for (let i = 0; i < agenticDays.length && i < staticDays.length; i++) {
    const ag = agenticDays[i].cumulativeN;
    const st = staticDays[i].cumulativeN;
    if (ag > 0 && st > 0 && (ag - st) / st > 0.20 && agenticDays[i].day >= 5) {
      const pctMore = Math.round(((ag - st) / st) * 100);
      annotations.push({
        day: agenticDays[i].day,
        type: 'divergence',
        title: 'Learning advantage visible',
        description: `Agentic: ${Math.round(ag)} active users vs Static: ${Math.round(st)} — ${pctMore}% more conversions from the same budget.`,
      });
      break;
    }
  }

  return annotations.sort((a, b) => a.day - b.day);
}

/**
 * Derive agent recommendation from simulation constraints.
 * Only uses known/factual numbers — no estimates or predictions.
 */
function deriveAgentRecommendation(agenticDays, params, budget) {
  const { minSignalVolume } = params;

  // Don't recommend until we have statistical significance
  const latestDay = agenticDays[agenticDays.length - 1];
  if (!latestDay || latestDay.cumulativeN < (minSignalVolume || 100)) {
    return null;
  }

  // Find the day significance was reached
  const significanceDay = agenticDays.find(d => d.cumulativeN >= (minSignalVolume || 100));
  const availableFromDay = significanceDay ? significanceDay.day : 30;

  // Check: is daily cap being hit?
  const recentDays = agenticDays.slice(-10);
  const capHitCount = recentDays.filter(d => d.capHit).length;

  if (capHitCount >= 5) {
    const uncontacted = latestDay.remainingPool;
    const currentDaily = Math.round(latestDay.journeysToday);
    const suggestedBudget = Math.round(budget * 1.25 / 5000) * 5000;
    const projectedDaily = Math.round(currentDaily * 1.25);

    return {
      availableFromDay,
      type: 'budget',
      title: 'Daily contact capacity reached',
      description: `Daily contact cap reached on ${capHitCount} of the last 10 days. ${uncontacted.toLocaleString()} eligible customers remain uncontacted.`,
      action: `Current budget supports ${currentDaily.toLocaleString()} contacts/day — $${(suggestedBudget / 1000)}K would support ${projectedDaily.toLocaleString()}/day.`,
    };
  }

  // Check: is conversion rate exceeding the budget assumption?
  const actualConvRate = latestDay.kpiCumulative.convRate;
  const assumedConvRate = Math.round(params.baseConvRate * 100 * 100) / 100;
  if (actualConvRate > assumedConvRate * 1.15) {
    const currentPace = Math.round(budget / 30 * latestDay.day);
    const projectedExhaustDay = Math.round(30 * (budget / (latestDay.cumulativeRewardCost / latestDay.day * 30)));

    if (projectedExhaustDay < 28) {
      return {
        availableFromDay,
        type: 'pacing',
        title: 'Budget pacing ahead of schedule',
        description: `Actual conversion rate (${actualConvRate}%) exceeding baseline assumption (${assumedConvRate}%). Reward spend pacing ${Math.round((1 - projectedExhaustDay / 30) * 100)}% ahead of plan.`,
        action: `At current pace, reward budget fully committed by Day ${projectedExhaustDay}. Adding $${Math.round((budget * 0.12) / 1000)}K maintains contact volume through Day 30.`,
      };
    }
  }

  // Default: pool depletion observation
  const poolDepletionPct = Math.round((1 - latestDay.remainingPool / Math.round(params.totalCustomers * params.eligibilityRate)) * 100);
  if (poolDepletionPct > 60) {
    return {
      availableFromDay,
      type: 'pool',
      title: 'Audience pool narrowing',
      description: `${poolDepletionPct}% of eligible audience has been contacted. ${latestDay.remainingPool.toLocaleString()} customers remaining in pool.`,
      action: `Consider expanding eligibility criteria or adjusting NPS threshold to unlock additional audience segments.`,
    };
  }

  return null;
}

/**
 * Dashboard Projection Engine (v4)
 *
 * Runs agentic + static simulations, generates decision logs,
 * derives learning annotations and agent recommendations.
 *
 * @param {Object} options
 * @param {number} options.budget - Monthly budget in dollars
 * @param {Object} options.params - Engine parameters (from config)
 * @returns {Object} Full dashboard data
 */
export function computeDashboardProjection({ budget, params }) {
  assertParams(params);

  // Run agentic simulation (with learning)
  const agentic = runSimulation({ budget, params, staticMode: false });

  // Run static baseline (no learning — efficiency locked at floor)
  const static_ = runSimulation({ budget, params, staticMode: true });

  // Derive learning annotations FIRST (briefings reference them)
  const learningAnnotations = deriveLearningAnnotations(agentic.days, static_.days, params);

  // Build annotation lookup by day for briefing generation
  const annotationByDay = {};
  for (const a of learningAnnotations) {
    annotationByDay[a.day] = a;
  }

  // Generate daily briefings — annotation days get matched strategy shifts
  const dailyBriefings = {};
  for (let day = 1; day <= 30; day++) {
    const dayData = agentic.days[day - 1];
    const prevDayData = day > 1 ? agentic.days[day - 2] : null;

    dailyBriefings[day] = generateDayBriefing({
      day,
      dayData,
      prevDayData,
      seed: 42,
      tierDistribution: dayData.tierDistribution,
      annotation: annotationByDay[day] || null,
    });
  }

  // Derive agent recommendation
  const agentRecommendation = deriveAgentRecommendation(agentic.days, params, budget);

  // Build the cumulative daily curve for chart (matches v3 format)
  const dailyCurve = agentic.days.map(d => d.resolvedToday);
  const cumulativeCurve = agentic.days.map(d => d.cumulativeN);
  const staticCumulativeCurve = static_.days.map(d => d.cumulativeN);

  // Compute lifecycle states and cohort waves for Block 2 charts
  const lifecycleStates = computeLifecycleStates(agentic, params);
  const cohortWaves = computeCohortWaves(agentic, params);

  return {
    // Core metrics
    activeUsers: agentic.activeUsers,
    cac: agentic.cac,
    roi: agentic.roi,
    convRate: agentic.convRate,
    fraudSaved: agentic.fraudSaved,
    thresholdDay: agentic.thresholdDay,
    totalJourneysStarted: agentic.totalJourneysStarted,
    audienceSize: agentic.audienceSize,
    budget,

    // Per-day detailed data (agentic)
    days: agentic.days,

    // Cohort data
    cohorts: agentic.cohorts,

    // Curves for charts
    dailyCurve,
    cumulativeCurve,
    staticCumulativeCurve,

    // Static baseline summary
    staticBaseline: {
      activeUsers: static_.activeUsers,
      cac: static_.cac,
      roi: static_.roi,
      convRate: static_.convRate,
      days: static_.days,
    },

    // Daily briefings (structured, not flat log)
    dailyBriefings,

    // Learning annotations
    learningAnnotations,

    // Agent recommendation
    agentRecommendation,

    // Lifecycle states for stacked area chart (Block 2, Graph 1)
    lifecycleStates,

    // Cohort waves for breakdown bar (Block 2, Graph 2)
    cohortWaves,

    // Propensity health for Block 2 (audience health chart)
    propensityHealth: computePropensityHealth(agentic, params),

    // Effectiveness data for Block 2 (engagement effectiveness chart)
    effectivenessData: computeEffectivenessData(agentic, params),

    // Config passthrough for display
    referrerTiers: params.referrerTiers,
    refereeTiers: params.refereeTiers,
    industryCACBenchmark: params.industryCACBenchmark || 140,
  };
}


// ═══════════════════════════════════════════════════════════════════════
// Lifecycle State Computation
// 4 states that sum to totalCustomers every day:
//   Dormant + Cooling Off + Engaged + Eligible = totalCustomers
// ═══════════════════════════════════════════════════════════════════════

const COOLDOWN_DAYS = 5;

function computeLifecycleStates(simResult, params) {
  const { days, cohorts } = simResult;
  const { totalCustomers, eligibilityRate, offerExpirationDays } = params;
  const total = totalCustomers;

  const eligible = [];
  const engaged = [];
  const coolingOff = [];
  const dormant = [];

  for (let d = 1; d <= days.length; d++) {
    const dayData = days[d - 1];

    // Eligible = remaining pool (customers who haven't been contacted yet)
    const elig = dayData.remainingPool;

    // Engaged = all contacted users whose offer window is still open
    let eng = 0;
    for (const startDayStr of Object.keys(cohorts)) {
      const s = Number(startDayStr);
      const cohort = cohorts[s];
      const daysSinceContact = d - s;

      // Active engagement window: day after contact through offer expiration
      if (daysSinceContact >= 1 && daysSinceContact <= offerExpirationDays) {
        // Start with contacted count, subtract resolved conversions up to today
        let resolved = 0;
        for (const [resolveDayStr, count] of Object.entries(cohort.resolutionByDay)) {
          if (Number(resolveDayStr) <= d) {
            resolved += count;
          }
        }
        eng += cohort.contacted - resolved;
      }
    }

    // Cooling off = expired cohorts within cooldown window
    let cool = 0;
    for (const startDayStr of Object.keys(cohorts)) {
      const s = Number(startDayStr);
      const cohort = cohorts[s];
      const daysSinceContact = d - s;

      // Cooling off window: after offer expires, for COOLDOWN_DAYS
      if (daysSinceContact > offerExpirationDays && daysSinceContact <= offerExpirationDays + COOLDOWN_DAYS) {
        // Unresolved at time of offer expiration
        let resolvedByExpiration = 0;
        for (const [resolveDayStr, count] of Object.entries(cohort.resolutionByDay)) {
          if (Number(resolveDayStr) <= s + offerExpirationDays) {
            resolvedByExpiration += count;
          }
        }
        cool += cohort.contacted - resolvedByExpiration;
      }
    }

    // Dormant = everyone else (absorbs non-eligible)
    const dorm = total - elig - eng - cool;

    eligible.push(Math.round(elig));
    engaged.push(Math.max(0, Math.round(eng)));
    coolingOff.push(Math.max(0, Math.round(cool)));
    dormant.push(Math.max(0, Math.round(dorm)));
  }

  // Dev-only invariant check
  if (process.env.NODE_ENV === 'development') {
    for (let d = 0; d < days.length; d++) {
      const sum = eligible[d] + engaged[d] + coolingOff[d] + dormant[d];
      console.assert(Math.abs(sum - total) < 2, `Lifecycle sum ${sum} != ${total} at day ${d + 1}`);
    }
  }

  return { eligible, engaged, coolingOff, dormant, total };
}


// ═══════════════════════════════════════════════════════════════════════
// Cohort Waves — engaged count per cohort per day
// Used by CohortBar to show composition of the Engaged band at selectedDay
// ═══════════════════════════════════════════════════════════════════════

function computeCohortWaves(simResult, params) {
  const { days, cohorts } = simResult;
  const { offerExpirationDays } = params;
  const numDays = days.length;

  const waves = [];

  for (const startDayStr of Object.keys(cohorts)) {
    const s = Number(startDayStr);
    const cohort = cohorts[s];
    const data = new Array(numDays).fill(0);

    for (let d = 1; d <= numDays; d++) {
      const daysSinceContact = d - s;
      if (daysSinceContact >= 1 && daysSinceContact <= offerExpirationDays) {
        let resolved = 0;
        for (const [resolveDayStr, count] of Object.entries(cohort.resolutionByDay)) {
          if (Number(resolveDayStr) <= d) {
            resolved += count;
          }
        }
        data[d - 1] = Math.max(0, cohort.contacted - resolved);
      }
    }

    waves.push({ startDay: s, data });
  }

  // Sort by startDay ascending
  waves.sort((a, b) => a.startDay - b.startDay);
  return waves;
}


// ═══════════════════════════════════════════════════════════════════════
// Propensity Health — H/M/L distribution + reach depth over time
// Used by Block 2 Left: Audience Health stacked area chart
// ═══════════════════════════════════════════════════════════════════════

function computePropensityHealth(simResult, params) {
  const { days } = simResult;
  const { totalCustomers, eligibilityRate } = params;
  const totalEligible = Math.round(totalCustomers * eligibilityRate);

  // Segment sizes
  const highTotal = Math.round(totalEligible * 0.30);
  const medTotal = Math.round(totalEligible * 0.45);
  const lowTotal = totalEligible - highTotal - medTotal;

  // Per-segment contacted counts over time (absolute)
  // Agent contacts high-propensity first → high fills fastest
  const highContacted = [];
  const medContacted = [];
  const lowContacted = [];

  for (let d = 0; d < days.length; d++) {
    const dayData = days[d];
    const contacted = dayData.funnelCumulative.contacted;
    const overallDepth = Math.min(1, contacted / totalEligible);

    const hRate = Math.min(1, overallDepth * 2.2);
    const mRate = Math.min(1, overallDepth * 0.85);
    const lRate = Math.min(1, Math.max(0, overallDepth * 0.35));

    highContacted.push(Math.round(highTotal * hRate));
    medContacted.push(Math.round(medTotal * mRate));
    lowContacted.push(Math.round(lowTotal * lRate));
  }

  return {
    highContacted, medContacted, lowContacted,
    highTotal, medTotal, lowTotal, totalEligible,
  };
}


// ═══════════════════════════════════════════════════════════════════════
// Effectiveness Data — touchpoint decay + lifetime response trend
// Used by Block 2 Center: Engagement Effectiveness chart
// ═══════════════════════════════════════════════════════════════════════

function computeEffectivenessData(simResult, params) {
  const { days } = simResult;
  const latestDay = days[days.length - 1];
  const efficiency = latestDay?.efficiency || 0.5;

  // Frequency curve: response rate by number of program contacts received
  // Shows how customer responsiveness changes with repeated exposure
  // Modulated by agent efficiency (better personalization = slower fatigue)
  const frequencyBuckets = [
    { label: '1x', baseRate: 0.14 },
    { label: '2-3x', baseRate: 0.11 },
    { label: '4-6x', baseRate: 0.08 },
    { label: '7-10x', baseRate: 0.05 },
    { label: '11+', baseRate: 0.03 },
  ];

  const frequencyCurve = frequencyBuckets.map(({ label, baseRate }) => {
    const boost = 1 + efficiency * 0.25;
    return { label, rate: Math.round(baseRate * boost * 1000) / 1000 };
  });

  return { frequencyCurve };
}
