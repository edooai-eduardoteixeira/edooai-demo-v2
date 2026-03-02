/**
 * Projection Engine v2 — Journey Model with Resolution Delay
 *
 * Pure functions, zero React dependencies. Takes budget + params → computes all projections.
 *
 * Three interlocking components:
 *
 *   1. Supply curve (N_frontier): concave function of budget.
 *      Returns max possible CONVERSIONS with perfect allocation.
 *      N_frontier is in conversion units — divide by baseConvRate to get journeys.
 *
 *   2. Allocation efficiency: f(time, resolved conversions).
 *      Models the learning period. Starts at effFloor, rises as resolved
 *      conversions accumulate. Two drivers — time (algorithms improve) and
 *      volume (conversion outcomes confirm targeting patterns).
 *
 *   3. Journey resolution delay:
 *      Journeys started on day D produce conversions on day D + journeyResolutionDays.
 *      The pending queue means cumulativeN stays at 0 early, keeping efficiency
 *      near floor and shifting the S-curve right.
 *
 *   Pool dynamics: journeys deplete the remaining pool; resolved conversions
 *   replenish it (new referrers). Pool capped at audienceSize.
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
//   timeFactor  = 1 - exp(-timeLearnRate × day)
//   volumeFactor = cumN / (cumN + confHalfPoint)
// cumN counts only RESOLVED conversions, not pending ones.
function allocationEfficiency(day, cumulativeN, p) {
  const timeFactor = 1 - Math.exp(-p.timeLearnRate * day);
  const volumeFactor = cumulativeN / (cumulativeN + p.confHalfPoint);
  return p.effFloor + (1 - p.effFloor) * timeFactor * volumeFactor;
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
  if (!(p.effFloor > 0 && p.effFloor < 1)) fail('effFloor must be in (0, 1)');
  if (!(p.confHalfPoint > 0)) fail('confHalfPoint must be > 0');
  if (!(p.timeLearnRate > 0 && p.timeLearnRate <= 1)) fail('timeLearnRate must be in (0, 1]');
  if (!(p.maxDailyReachRate > 0 && p.maxDailyReachRate < 1)) fail('maxDailyReachRate must be in (0, 1)');
  if (!(p.referrerEligibilityRate >= 0 && p.referrerEligibilityRate < 1)) fail('referrerEligibilityRate must be in [0, 1)');
  if (!(p.journeyResolutionDays >= 1 && p.journeyResolutionDays <= 14)) fail('journeyResolutionDays must be in [1, 14]');
  if (!(p.effFloor > 0 || p.accidentalConvRate > 0)) fail('effFloor or accidentalConvRate must be > 0 (bootstrap safety)');
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
    referrerEligibilityRate,
    maxDailyReachRate,
    journeyResolutionDays,
    avgRevenuePerUser,
    fraudRate,
    minSignalVolume,
    budget: budgetThresholds,
  } = params;

  // ─── Setup ─────────────────────────────────────────────────────────
  const audienceSize = Math.round(totalCustomers * eligibilityRate);

  // Supply curve: theoretical max CONVERSIONS at this budget
  const N_frontier = supplyFrontier(budget, N_max, B_half, alpha);

  // Convert from conversion units to journey units
  const totalJourneys = N_frontier / baseConvRate;
  const dailyJourneyTarget = totalJourneys / 30;

  let remainingPool = audienceSize;
  let cumulativeN = 0;
  let totalJourneysStarted = 0;
  const pendingConversions = []; // {day: resolveDay, count: conversions}

  const dailyCurve = [];
  const confidenceCurve = [];
  let thresholdDay = 30;
  let thresholdFound = false;

  // ─── Daily Loop ────────────────────────────────────────────────────
  for (let day = 1; day <= 30; day++) {
    // Efficiency uses only RESOLVED conversions
    const eff = allocationEfficiency(day, cumulativeN, params);
    confidenceCurve.push(eff);

    // Pace journeys: don't exhaust pool before learning
    const journeysToday = Math.min(dailyJourneyTarget, remainingPool * maxDailyReachRate);

    // Targeting split
    const wellTargeted = journeysToday * eff;
    const goodConversions = wellTargeted * baseConvRate;

    const poorlyTargeted = journeysToday * (1 - eff);
    const accidentalConversions = poorlyTargeted * accidentalConvRate;

    const dailyConversionsGenerated = goodConversions + accidentalConversions;

    // Queue conversions for resolution after delay
    pendingConversions.push({
      day: day + journeyResolutionDays,
      count: dailyConversionsGenerated,
    });

    // Resolve any conversions scheduled for today
    let resolvedToday = 0;
    for (const entry of pendingConversions) {
      if (entry.day === day) {
        resolvedToday += entry.count;
      }
    }
    cumulativeN += resolvedToday;

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

    // Daily output: resolved conversions (rounded for display, minimum 0)
    dailyCurve.push(Math.max(0, Math.round(resolvedToday)));
  }

  // ─── Aggregate Metrics ─────────────────────────────────────────────
  const activeUsers = dailyCurve.reduce((sum, v) => sum + v, 0);
  const cac = activeUsers > 0 ? Math.round(budget / activeUsers) : 999;

  const roi = activeUsers > 0 && budget > 0
    ? Math.round(((activeUsers * avgRevenuePerUser) / budget) * 10) / 10
    : 0;

  // Conversion rate: derived from simulation (THE FIX)
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
  };
}
