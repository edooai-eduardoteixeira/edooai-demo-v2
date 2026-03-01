/**
 * Projection Engine
 *
 * Implements the confidence-based optimization model from the business logic document.
 * Pure functions, zero React dependencies. Takes budget + params → computes all projections.
 *
 * Two competing forces shape the economics:
 *   1. Confidence ↑ → base CAC ↓ (optimization gets better over time)
 *   2. Higher daily spend → marginal difficulty ↑ (harder to reach next user)
 *
 * Within a month: confidence drives the curve upward (more users per day).
 * Across budgets: difficulty multiplier produces diminishing returns (CAC rises with budget).
 */

// ─── Confidence Function ───────────────────────────────────────────
// Two-input sigmoid: neither volume nor time substitutes for the other.
// Returns 0→1 (no optimization → full optimization).
function confidence(cumulativeVolume, daysElapsed, conf) {
  const volumeConf = cumulativeVolume / (cumulativeVolume + conf.volumeHalfPoint);
  const timeConf = daysElapsed / (daysElapsed + conf.timeHalfPoint);
  return conf.volumeWeight * volumeConf + conf.timeWeight * timeConf;
}

// ─── Spend-Rate Difficulty ─────────────────────────────────────────
// Based on daily budget rate relative to audience size (constant per month).
// Higher daily spend = competing for harder-to-reach audience = higher cost multiplier.
// Returns multiplier >= 1.0 applied to base CAC.
function spendDifficulty(dailyBudget, audienceSize, dim) {
  const spendRate = dailyBudget / audienceSize;
  return 1 + dim.scale * Math.pow(spendRate, dim.curve);
}

// ─── Main Computation ──────────────────────────────────────────────
/**
 * @param {Object} options
 * @param {number} options.budget - Monthly budget in dollars
 * @param {Object} options.params - Engine parameters (from config per vertical)
 * @returns {Object} Projection results
 */
export function computeProjection({ budget, params }) {
  const {
    learningCAC,
    optimizedCAC,
    audienceSize,
    fraudRate,
    avgRevenuePerUser,
    diminishing,
    confidence: confParams,
    budget: budgetThresholds,
    minSignalVolume,
  } = params;

  const dailyBudget = budget / 30;
  const cacRange = learningCAC - optimizedCAC;

  // Difficulty is constant for a given budget level
  const difficulty = spendDifficulty(dailyBudget, audienceSize, diminishing);

  let cumulativeVolume = 0;
  let currentCAC = learningCAC;

  const dailyCurve = [];
  const confidenceCurve = [];
  let thresholdDay = 30;
  let thresholdFound = false;

  for (let day = 1; day <= 30; day++) {
    // Daily conversions at current effective CAC
    const dailyConversions = dailyBudget / currentCAC;

    // Accumulate
    cumulativeVolume += dailyConversions;

    // Confidence update
    const conf = confidence(cumulativeVolume, day, confParams);
    confidenceCurve.push(conf);

    // Threshold: cumulative volume reaches statistical significance
    if (!thresholdFound && cumulativeVolume >= (minSignalVolume || 40)) {
      thresholdDay = day;
      thresholdFound = true;
    }

    // Base CAC improvement from confidence (improves over time)
    const baseCAC = learningCAC - cacRange * conf;

    // Effective CAC = base × difficulty (constant per budget level)
    currentCAC = Math.max(optimizedCAC, baseCAC * difficulty);

    // Record daily new users (rounded for display)
    dailyCurve.push(Math.max(1, Math.round(dailyConversions)));
  }

  // ─── Aggregate metrics ─────────────────────────────────────────
  const activeUsers = dailyCurve.reduce((sum, v) => sum + v, 0);
  const cac = activeUsers > 0 ? Math.round(budget / activeUsers) : learningCAC;

  const roi = activeUsers > 0
    ? Math.round(((activeUsers * avgRevenuePerUser) / budget) * 10) / 10
    : 0;

  // Conversion rate: base rate scaled by confidence achieved and difficulty
  const finalConf = confidenceCurve[confidenceCurve.length - 1] || 0;
  const baseConvRate = params.baseConvRate || 4.0;
  const convRate = Math.round(
    (baseConvRate * (0.5 + 0.5 * finalConf) / difficulty) * 10
  ) / 10;

  const fraudSaved = Math.round(budget * fraudRate);

  // ─── Guidance state ────────────────────────────────────────────
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
