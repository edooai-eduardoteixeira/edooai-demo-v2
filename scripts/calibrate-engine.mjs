/**
 * Calibration script for the projection engine v2 (Journey Model).
 *
 * Sweeps parameter combinations to find values that hit calibration targets.
 * Implements the engine inline (no app imports) so it can run standalone.
 *
 * Usage: node scripts/calibrate-engine.mjs
 */

// ─── Model (matches src/engine/projectionEngine.js) ──────────────────

function supplyFrontier(budget, N_max, B_half, alpha) {
  return N_max * Math.pow(budget / (budget + B_half), alpha);
}

function computeProjection(budget, p) {
  const audienceSize = Math.round(p.totalCustomers * p.eligibilityRate);

  // Supply curve: conversions. Divide by baseConvRate → journeys.
  const N_frontier = supplyFrontier(budget, p.N_max, p.B_half, p.alpha);
  const totalJourneys = N_frontier / p.baseConvRate;
  const dailyJourneyTarget = totalJourneys / 30;

  let remainingPool = audienceSize;
  let cumulativeN = 0;
  let totalJourneysStarted = 0;
  const pendingConversions = [];

  const dailyCurve = [];
  const effCurve = [];
  let thresholdDay = 30;
  let thresholdFound = false;

  for (let day = 1; day <= 30; day++) {
    // Efficiency uses only RESOLVED conversions
    const timeFactor = 1 - Math.exp(-p.timeLearnRate * day);
    const volumeFactor = cumulativeN / (cumulativeN + p.confHalfPoint);
    const eff = p.effFloor + (1 - p.effFloor) * timeFactor * volumeFactor;
    effCurve.push(eff);

    // Pace journeys
    const journeysToday = Math.min(dailyJourneyTarget, remainingPool * p.maxDailyReachRate);

    // Targeting split
    const wellTargeted = journeysToday * eff;
    const goodConversions = wellTargeted * p.baseConvRate;

    const poorlyTargeted = journeysToday * (1 - eff);
    const accidentalConversions = poorlyTargeted * p.accidentalConvRate;

    const dailyConversionsGenerated = goodConversions + accidentalConversions;

    // Queue for resolution
    pendingConversions.push({
      day: day + p.journeyResolutionDays,
      count: dailyConversionsGenerated,
    });

    // Resolve pending
    let resolvedToday = 0;
    for (const entry of pendingConversions) {
      if (entry.day === day) resolvedToday += entry.count;
    }
    cumulativeN += resolvedToday;

    // Pool dynamics
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
  const roi = activeUsers > 0
    ? Math.round(((activeUsers * p.avgRevenuePerUser) / budget) * 10) / 10
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
  avgRevenuePerUser: 500,
  fraudRate: 0.07,
  minSignalVolume: 40,
  baseConvRate: 0.03,
  referrerEligibilityRate: 0.4,
};

// ─── Sweep ranges ───────────────────────────────────────────────────

const N_MAX_VALUES               = [1500, 2000, 3000, 4000, 5000];
const B_HALF_VALUES              = [100_000, 200_000, 400_000, 700_000, 1_000_000];
const ALPHA_VALUES               = [0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
const EFF_FLOOR_VALUES           = [0.10, 0.15, 0.20, 0.25, 0.30];
const TIME_LEARN_VALUES          = [0.06, 0.10, 0.14, 0.18];
const CONF_HALF_VALUES           = [20, 35, 50, 70];
const MAX_DAILY_REACH_VALUES     = [0.03, 0.05, 0.08, 0.10];
const JOURNEY_RESOLUTION_VALUES  = [3, 5, 7, 10];
const ACCIDENTAL_CONV_VALUES     = [0.0005, 0.001, 0.002];

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

  return total;
}

// ─── Sweep ──────────────────────────────────────────────────────────

console.log('Calibrating projection engine v2 (Journey Model)...');
const totalCombos = N_MAX_VALUES.length * B_HALF_VALUES.length * ALPHA_VALUES.length *
  EFF_FLOOR_VALUES.length * TIME_LEARN_VALUES.length * CONF_HALF_VALUES.length *
  MAX_DAILY_REACH_VALUES.length * JOURNEY_RESOLUTION_VALUES.length * ACCIDENTAL_CONV_VALUES.length;
console.log(`Sweeping ${totalCombos.toLocaleString()} combinations...\n`);

let bestScore = Infinity;
let bestParams = null;
let tested = 0;

for (const N_max of N_MAX_VALUES) {
  for (const B_half of B_HALF_VALUES) {
    for (const alpha of ALPHA_VALUES) {
      for (const effFloor of EFF_FLOOR_VALUES) {
        for (const timeLearnRate of TIME_LEARN_VALUES) {
          for (const confHalfPoint of CONF_HALF_VALUES) {
            for (const maxDailyReachRate of MAX_DAILY_REACH_VALUES) {
              for (const journeyResolutionDays of JOURNEY_RESOLUTION_VALUES) {
                for (const accidentalConvRate of ACCIDENTAL_CONV_VALUES) {
                  const params = {
                    ...FIXED,
                    N_max, B_half, alpha,
                    effFloor, timeLearnRate, confHalfPoint,
                    maxDailyReachRate, journeyResolutionDays, accidentalConvRate,
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

console.log(`Tested ${tested.toLocaleString()} combinations.`);
console.log(`Best score: ${bestScore.toFixed(4)}\n`);

// ─── Best parameters ────────────────────────────────────────────────

console.log('═══ Best Parameters ═══');
console.log(`  N_max:                ${bestParams.N_max}`);
console.log(`  B_half:               ${bestParams.B_half.toLocaleString()}`);
console.log(`  alpha:                ${bestParams.alpha}`);
console.log(`  effFloor:             ${bestParams.effFloor}`);
console.log(`  timeLearnRate:        ${bestParams.timeLearnRate}`);
console.log(`  confHalfPoint:        ${bestParams.confHalfPoint}`);
console.log(`  maxDailyReachRate:    ${bestParams.maxDailyReachRate}`);
console.log(`  journeyResolutionDays:${bestParams.journeyResolutionDays}`);
console.log(`  accidentalConvRate:   ${bestParams.accidentalConvRate}`);
console.log(`  baseConvRate:         ${bestParams.baseConvRate}`);
console.log(`  referrerEligRate:     ${bestParams.referrerEligibilityRate}`);

// ─── Results table ──────────────────────────────────────────────────

console.log('\n═══ Results across budgets ═══');
console.log('Budget     │ Users  │ CAC    │ ROI  │ Conv%  │ Journeys │ ThDay │ Pool Left');
console.log('───────────┼────────┼────────┼──────┼────────┼──────────┼───────┼──────────');

for (const b of ALL_BUDGETS) {
  const r = computeProjection(b, bestParams);
  const marker = TARGETS.find(t => t.budget === b) ? ' ◄' : '';
  console.log(
    `$${(b / 1000).toString().padStart(4)}K    │ ${r.activeUsers.toString().padStart(6)} │ $${r.cac.toString().padStart(5)} │ ${r.roi.toFixed(1).padStart(4)}x │ ${r.convRate.toFixed(1).padStart(5)}% │ ${r.totalJourneysStarted.toString().padStart(8)} │ ${r.thresholdDay.toString().padStart(5)} │ ${r.remainingPool.toString().padStart(9)}${marker}`
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
  console.log(`  Conv:  ${r.convRate}% (from ${r.totalJourneysStarted} journeys)`);
}

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
  maxDailyReachRate: ${bestParams.maxDailyReachRate},
  journeyResolutionDays: ${bestParams.journeyResolutionDays},
  referrerEligibilityRate: ${bestParams.referrerEligibilityRate},
  avgRevenuePerUser: ${bestParams.avgRevenuePerUser},
  fraudRate: ${bestParams.fraudRate},
  minSignalVolume: ${bestParams.minSignalVolume},
  budget: {
    floor: ${floorBudget},
    recMin: 100000,
    recMax: 200000,
  },
}`);
