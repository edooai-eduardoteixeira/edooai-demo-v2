/**
 * Projection Engine — Allocation Calculator Model
 *
 * Pure functions, zero React dependencies. Takes budget + params → computes all projections.
 *
 * Three interlocking components:
 *
 *   1. Supply curve (N_frontier): concave function of budget.
 *      Represents max possible conversions with perfect allocation.
 *      Higher budget → more conversions, but diminishing returns → CAC rises.
 *
 *   2. Allocation efficiency: f(time, cumulative conversions).
 *      Models the learning period. Starts low (engine is guessing), rises as
 *      data accumulates. Two drivers — time (algorithms improve) and volume
 *      (conversion outcomes confirm targeting patterns). Positive feedback:
 *      more conversions → higher confidence → better allocation → more conversions.
 *
 *   3. Two-type waste during low confidence:
 *      - Well-targeted contacts → convert at baseConvRate (right customer, right offer)
 *      - Poorly-targeted contacts → mostly wasted, small fraction converts accidentally
 *        (overpaying). All contacted customers are "used up" for this month
 *        (contactFrequency = 1), depleting the pool.
 *
 *   Pool replenishment: successful conversions create new eligible referrers
 *   (the referral program grows its own audience).
 *
 * Within a month: efficiency drives the curve upward (more conversions per day).
 * Across budgets: supply curve concavity produces diminishing returns (CAC rises).
 */

// ─── Supply Curve ────────────────────────────────────────────────────
// N_frontier(B) = N_max × (B / (B + B_half))^alpha
// Concave in budget. Encodes the aggregate result of optimal allocation
// across a heterogeneous customer population — we don't model individual
// rewards, only the resulting conversion count.
function supplyFrontier(budget, N_max, B_half, alpha) {
  return N_max * Math.pow(budget / (budget + B_half), alpha);
}

// ─── Allocation Efficiency ──────────────────────────────────────────
// eff(day, cumN) = floor + (1 - floor) × timeFactor × volumeFactor
//   timeFactor  = 1 - exp(-timeLearnRate × day)     — algorithms improve over time
//   volumeFactor = cumN / (cumN + confHalfPoint)     — results confirm patterns
// Returns 0→1 (guessing → fully optimized).
function allocationEfficiency(day, cumulativeN, p) {
  const timeFactor = 1 - Math.exp(-p.timeLearnRate * day);
  const volumeFactor = cumulativeN / (cumulativeN + p.confHalfPoint);
  return p.effFloor + (1 - p.effFloor) * timeFactor * volumeFactor;
}

// ─── Main Computation ───────────────────────────────────────────────
/**
 * @param {Object} options
 * @param {number} options.budget - Monthly budget in dollars
 * @param {Object} options.params - Engine parameters (from config per vertical)
 * @returns {Object} Projection results (same shape as before — 9 keys)
 */
export function computeProjection({ budget, params }) {
  const {
    N_max,
    B_half,
    alpha,
    effFloor,
    timeLearnRate,
    confHalfPoint,
    accidentalFraction,
    baseConvRate,
    referrerEligibilityRate,
    audienceSize,
    avgRevenuePerUser,
    fraudRate,
    minSignalVolume,
    budget: budgetThresholds,
  } = params;

  // Supply curve: theoretical max conversions at this budget
  const N_frontier = supplyFrontier(budget, N_max, B_half, alpha);
  const dailyFrontier = N_frontier / 30;

  // Contact intensity for pool depletion (fraction of audience processed daily)
  const contactIntensity = dailyFrontier / (baseConvRate * audienceSize);

  let cumulativeN = 0;
  let poolHealth = 1.0;

  const dailyCurve = [];
  const confidenceCurve = [];
  let thresholdDay = 30;
  let thresholdFound = false;

  for (let day = 1; day <= 30; day++) {
    // Allocation efficiency
    const eff = allocationEfficiency(day, cumulativeN, params);
    confidenceCurve.push(eff);

    // Realized conversions:
    //   well-targeted portion (eff) converts at full rate
    //   poorly-targeted portion (1-eff) converts at accidentalFraction rate
    const rawConversions = dailyFrontier * (eff + (1 - eff) * accidentalFraction);
    const dailyConversions = rawConversions * poolHealth;

    // Pool dynamics:
    //   Waste depletes pool (contacts burned by poor allocation)
    //   Replenishment from new converts becoming eligible referrers
    const dailyWaste = contactIntensity * (1 - eff);
    poolHealth -= dailyWaste;
    poolHealth += (dailyConversions * referrerEligibilityRate) / audienceSize;
    poolHealth = Math.max(0, Math.min(1.0, poolHealth));

    cumulativeN += dailyConversions;

    // Threshold: cumulative volume reaches statistical significance
    if (!thresholdFound && cumulativeN >= (minSignalVolume || 40)) {
      thresholdDay = day;
      thresholdFound = true;
    }

    // Record daily new users (rounded for display, minimum 1)
    dailyCurve.push(Math.max(1, Math.round(dailyConversions)));
  }

  // ─── Aggregate metrics ──────────────────────────────────────────
  const activeUsers = dailyCurve.reduce((sum, v) => sum + v, 0);
  const cac = activeUsers > 0 ? Math.round(budget / activeUsers) : 999;

  const roi = activeUsers > 0 && budget > 0
    ? Math.round(((activeUsers * avgRevenuePerUser) / budget) * 10) / 10
    : 0;

  // Conversion rate: effective rate achieved (scales with final efficiency)
  const finalEff = confidenceCurve[confidenceCurve.length - 1] || 0;
  const displayConvRate = params.displayBaseConvRate || 4.8;
  const convRate = Math.round(
    displayConvRate * (0.4 + 0.6 * finalEff) * 10
  ) / 10;

  const fraudSaved = Math.round(budget * fraudRate);

  // ─── Guidance state ─────────────────────────────────────────────
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
  };
}
