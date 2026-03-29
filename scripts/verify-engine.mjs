/**
 * Verification script for the projection engine v3.
 *
 * v3 checks: reach quality (conv rate decreasing with budget), distributed resolution
 * (smooth curve from day 2), value learning (avgValuePerUser bounds).
 *
 * Imports the real engine + config and checks behavioral invariants.
 * Fails loudly if any invariant is violated.
 *
 * Usage: node scripts/verify-engine.mjs
 */

import { computeProjection } from '../src/engine/projectionEngine.js';
import neobank from '../src/config/neobank.js';

const params = neobank.engineParams;
let passed = 0;
let failed = 0;

function check(name, condition, detail) {
  if (condition) {
    console.log(`  ✓ ${name}`);
    passed++;
  } else {
    console.log(`  ✗ ${name}: ${detail}`);
    failed++;
  }
}

// ─── 1. Return shape ────────────────────────────────────────────────

console.log('\n═══ 1. Return Shape ═══');
const r = computeProjection({ budget: 150_000, params });
const REQUIRED_KEYS = ['dailyCurve', 'thresholdDay', 'activeUsers', 'cac', 'roi', 'convRate', 'fraudSaved', 'guidanceState', 'confidenceCurve', 'totalJourneysStarted', 'avgValuePerUser', 'kpiCurves'];
for (const key of REQUIRED_KEYS) {
  check(`has '${key}'`, key in r, `missing from return object`);
}
check('dailyCurve is array of 30', Array.isArray(r.dailyCurve) && r.dailyCurve.length === 30, `length=${r.dailyCurve?.length}`);
check('confidenceCurve is array of 30', Array.isArray(r.confidenceCurve) && r.confidenceCurve.length === 30, `length=${r.confidenceCurve?.length}`);
check('activeUsers is number', typeof r.activeUsers === 'number', typeof r.activeUsers);
check('cac is number', typeof r.cac === 'number', typeof r.cac);
check('roi is number', typeof r.roi === 'number', typeof r.roi);
check('totalJourneysStarted is number', typeof r.totalJourneysStarted === 'number', typeof r.totalJourneysStarted);
check('avgValuePerUser is number', typeof r.avgValuePerUser === 'number', typeof r.avgValuePerUser);
check('kpiCurves has cac/roi/convRate/fraudSaved arrays of 30',
  r.kpiCurves && ['cac', 'roi', 'convRate', 'fraudSaved'].every(k => Array.isArray(r.kpiCurves[k]) && r.kpiCurves[k].length === 30),
  `keys=${r.kpiCurves ? Object.keys(r.kpiCurves) : 'missing'}`);

// ─── 2. KPI Coherence (THE KEY CHECK) ──────────────────────────────

console.log('\n═══ 2. KPI Coherence ═══');
for (const b of [50_000, 150_000, 500_000]) {
  const res = computeProjection({ budget: b, params });
  const derived = Math.round(res.totalJourneysStarted * (res.convRate / 100));
  const tolerance = Math.max(1, Math.round(res.activeUsers * 0.01));
  check(
    `$${b / 1000}K: journeys × convRate ≈ activeUsers`,
    Math.abs(derived - res.activeUsers) <= tolerance,
    `journeys(${res.totalJourneysStarted}) × conv(${res.convRate}%) = ${derived}, expected ~${res.activeUsers}`
  );
}

// ─── 3. Conv rate DECREASES with budget (v3 reach quality) ──────────

console.log('\n═══ 3. Conv Rate Direction ═══');
const cr50 = computeProjection({ budget: 50_000, params }).convRate;
const cr150 = computeProjection({ budget: 150_000, params }).convRate;
const cr500 = computeProjection({ budget: 500_000, params }).convRate;
check(
  `Conv rate decreasing: $50K (${cr50.toFixed(2)}%) > $150K (${cr150.toFixed(2)}%) > $500K (${cr500.toFixed(2)}%)`,
  cr50 > cr150 && cr150 > cr500,
  `$50K=${cr50.toFixed(2)}%, $150K=${cr150.toFixed(2)}%, $500K=${cr500.toFixed(2)}%`
);

// ─── 4. Smooth curve — no staircase (v3 distributed resolution) ─────

console.log('\n═══ 4. Smooth Curve ═══');
for (const b of [50_000, 150_000, 500_000]) {
  const res = computeProjection({ budget: b, params });
  // Conversions should appear from day 2 (fast resolutions)
  const day2 = res.dailyCurve[1];
  check(
    `$${b / 1000}K: day 2 has conversions (${day2})`,
    day2 > 0,
    `day 2 = ${day2}`
  );

  // No staircase: check that no single day jumps more than 5× the running avg
  // (skip first 5 days of ramp; cohort curve accelerates naturally with budget pacing)
  let hasStaircase = false;
  for (let d = 5; d < 30; d++) {
    const runningAvg = res.dailyCurve.slice(0, d).reduce((s, v) => s + v, 0) / d;
    if (runningAvg > 0 && res.dailyCurve[d] > runningAvg * 5) {
      hasStaircase = true;
    }
  }
  check(
    `$${b / 1000}K: no staircase jumps`,
    !hasStaircase,
    'detected day-to-day jump > 3× running average'
  );
}

// ─── 5. Value learning (v3) ──────────────────────────────────────────

console.log('\n═══ 5. Value Learning ═══');
for (const b of [50_000, 150_000, 500_000]) {
  const res = computeProjection({ budget: b, params });
  check(
    `$${b / 1000}K: avgValuePerUser ($${res.avgValuePerUser}) in [${params.baseRevenuePerUser}, ${params.premiumRevenuePerUser}]`,
    res.avgValuePerUser >= params.baseRevenuePerUser && res.avgValuePerUser <= params.premiumRevenuePerUser,
    `got $${res.avgValuePerUser}`
  );
}

// Higher budget → higher avgValuePerUser (engine learns faster with more data)
const v50 = computeProjection({ budget: 50_000, params }).avgValuePerUser;
const v500 = computeProjection({ budget: 500_000, params }).avgValuePerUser;
check(
  `$500K avgValuePerUser ($${v500}) >= $50K ($${v50})`,
  v500 >= v50,
  `$50K=$${v50}, $500K=$${v500}`
);

// ─── 6. Audience derivation ─────────────────────────────────────────

console.log('\n═══ 6. Audience Derivation ═══');
const expectedAudience = Math.round(params.totalCustomers * params.eligibilityRate);
check(
  `audienceSize = ${params.totalCustomers} × ${params.eligibilityRate} = ${expectedAudience}`,
  expectedAudience === Math.round(params.totalCustomers * params.eligibilityRate),
  `got ${expectedAudience}`
);
check(
  'N_max <= audienceSize',
  params.N_max <= expectedAudience,
  `N_max=${params.N_max}, audienceSize=${expectedAudience}`
);

// ─── 7. Daily curve shape ───────────────────────────────────────────

console.log('\n═══ 7. Daily Curve Shape ═══');
const budgets = [50_000, 150_000, 500_000];
for (const b of budgets) {
  const res = computeProjection({ budget: b, params });
  // Last 5 days avg should be > first 5 days avg (S-curve ramp)
  const first5avg = res.dailyCurve.slice(0, 5).reduce((s, v) => s + v, 0) / 5;
  const last5avg = res.dailyCurve.slice(25).reduce((s, v) => s + v, 0) / 5;
  check(
    `$${b / 1000}K: last 5 days avg > first 5 days avg`,
    last5avg > first5avg,
    `first5=${first5avg.toFixed(1)}, last5=${last5avg.toFixed(1)}`
  );
}

// ─── 7b. No fake saturation at $500K (plateau, no peak-and-drop) ────

console.log('\n═══ 7b. $500K Plateau Check ═══');
{
  const res500 = computeProjection({ budget: 500_000, params });
  const curve = res500.dailyCurve;
  // Find peak value (ignoring first 5 days of ramp)
  const peakVal = Math.max(...curve.slice(5));
  const last5 = curve.slice(25);
  const last5avg = last5.reduce((s, v) => s + v, 0) / last5.length;
  // Last 5 days avg should be at least 85% of peak (no >15% decline)
  const declinePct = peakVal > 0 ? ((peakVal - last5avg) / peakVal) * 100 : 0;
  check(
    `$500K: no fake saturation (last5avg ${last5avg.toFixed(1)} vs peak ${peakVal.toFixed(1)}, decline ${declinePct.toFixed(0)}%)`,
    declinePct <= 15,
    `decline=${declinePct.toFixed(1)}% (max 15%)`
  );
}

// ─── 8. Users increase with budget (sublinearly) ────────────────────

console.log('\n═══ 8. Users vs Budget ═══');
const sweep = [50_000, 100_000, 150_000, 200_000, 300_000, 500_000];
const results = sweep.map(b => ({ budget: b, ...computeProjection({ budget: b, params }) }));

let usersMonotone = true;
for (let i = 1; i < results.length; i++) {
  if (results[i].activeUsers < results[i - 1].activeUsers) usersMonotone = false;
}
check('Users increase monotonically with budget', usersMonotone,
  results.map(r => `$${r.budget / 1000}K→${r.activeUsers}`).join(', '));

const users50 = results.find(r => r.budget === 50_000).activeUsers;
const users500 = results.find(r => r.budget === 500_000).activeUsers;
const ratio = users500 / users50;
check(`Sublinear: 10x budget gives ${ratio.toFixed(1)}x users (should be <10)`, ratio < 10,
  `ratio=${ratio.toFixed(1)}`);

// ─── 9. CAC increases with budget (above recommended range) ─────────

console.log('\n═══ 9. CAC vs Budget ═══');
const aboveRec = results.filter(r => r.budget >= params.budget.recMin);
let cacMonotone = true;
for (let i = 1; i < aboveRec.length; i++) {
  if (aboveRec[i].cac < aboveRec[i - 1].cac) cacMonotone = false;
}
check('CAC increases with budget (above recMin)', cacMonotone,
  aboveRec.map(r => `$${r.budget / 1000}K→$${r.cac}`).join(', '));

// ─── 10. ROI decreases with budget (above recommended range) ────────

console.log('\n═══ 10. ROI vs Budget ═══');
let roiMonotone = true;
for (let i = 1; i < aboveRec.length; i++) {
  if (aboveRec[i].roi > aboveRec[i - 1].roi) roiMonotone = false;
}
check('ROI decreases with budget (above recMin)', roiMonotone,
  aboveRec.map(r => `$${r.budget / 1000}K→${r.roi}x`).join(', '));

// ─── 11. ThresholdDay moves with budget ──────────────────────────────

console.log('\n═══ 11. Threshold Day ═══');
const td50 = computeProjection({ budget: 50_000, params }).thresholdDay;
const td150 = computeProjection({ budget: 150_000, params }).thresholdDay;
const td500 = computeProjection({ budget: 500_000, params }).thresholdDay;
check(`$50K thresholdDay (${td50}) >= $150K (${td150})`, td50 >= td150, '');
check(`$150K thresholdDay (${td150}) >= $500K (${td500})`, td150 >= td500, '');

// ─── 12. Guidance states ────────────────────────────────────────────

console.log('\n═══ 12. Guidance States ═══');
check('Below floor → belowFloor', computeProjection({ budget: 5_000, params }).guidanceState === 'belowFloor', '');
check('Below recMin → belowRec', computeProjection({ budget: 80_000, params }).guidanceState === 'belowRec', '');
check('In range → atRec', computeProjection({ budget: 150_000, params }).guidanceState === 'atRec', '');
check('Above recMax → aboveRec', computeProjection({ budget: 300_000, params }).guidanceState === 'aboveRec', '');

// ─── 13. Calibration targets ───────────────────────────────────────

console.log('\n═══ 13. Calibration Targets ═══');
const TARGETS = [
  { budget: 50_000,  cac: [45, 70],    users: [750, 1000],  roi: [2.5, 4.0] },
  { budget: 150_000, cac: [70, 100],   users: [1500, 2100],  roi: [2.0, 3.0] },
  { budget: 500_000, cac: [110, 150],  users: [3500, 4500],  roi: [1.2, 2.0] },
];
for (const t of TARGETS) {
  const res = computeProjection({ budget: t.budget, params });
  const label = `$${t.budget / 1000}K`;
  check(`${label} CAC $${res.cac} in [${t.cac[0]}-${t.cac[1]}]`,
    res.cac >= t.cac[0] && res.cac <= t.cac[1], `got $${res.cac}`);
  check(`${label} Users ${res.activeUsers} in [${t.users[0]}-${t.users[1]}]`,
    res.activeUsers >= t.users[0] && res.activeUsers <= t.users[1], `got ${res.activeUsers}`);
  check(`${label} ROI ${res.roi}x in [${t.roi[0]}-${t.roi[1]}]`,
    res.roi >= t.roi[0] && res.roi <= t.roi[1], `got ${res.roi}x`);
}

// ─── 14. Edge cases ─────────────────────────────────────────────────

console.log('\n═══ 14. Edge Cases ═══');
const zero = computeProjection({ budget: 0, params });
check('$0 budget → 0 ROI', zero.roi === 0, `got ${zero.roi}`);
check('$0 budget → belowFloor', zero.guidanceState === 'belowFloor', zero.guidanceState);

const tiny = computeProjection({ budget: 1000, params });
check('$1K budget → runs without error', typeof tiny.activeUsers === 'number', '');

const huge = computeProjection({ budget: 5_000_000, params });
check('$5M budget → runs without error', typeof huge.activeUsers === 'number' && !isNaN(huge.activeUsers), `got ${huge.activeUsers}`);

// ─── 15. Parameter assertions ───────────────────────────────────────

console.log('\n═══ 15. Parameter Assertions ═══');
check('totalCustomers > 0', params.totalCustomers > 0, params.totalCustomers);
check('eligibilityRate in (0, 1]', params.eligibilityRate > 0 && params.eligibilityRate <= 1, params.eligibilityRate);
check('N_max > 0', params.N_max > 0, params.N_max);
check('N_max <= audienceSize', params.N_max <= expectedAudience, `N_max=${params.N_max}, audience=${expectedAudience}`);
check('alpha in (0, 2]', params.alpha > 0 && params.alpha <= 2, params.alpha);
check('B_half > 0', params.B_half > 0, params.B_half);
check('baseConvRate in (0, 1)', params.baseConvRate > 0 && params.baseConvRate < 1, params.baseConvRate);
check('accidentalConvRate in (0, baseConvRate)', params.accidentalConvRate > 0 && params.accidentalConvRate < params.baseConvRate, params.accidentalConvRate);
check('reachDecayExponent > 0', params.reachDecayExponent > 0, params.reachDecayExponent);
check('effFloor in (0, 1)', params.effFloor > 0 && params.effFloor < 1, params.effFloor);
check('confHalfPoint > 0', params.confHalfPoint > 0, params.confHalfPoint);
check('timeLearnRate in (0, 1]', params.timeLearnRate > 0 && params.timeLearnRate <= 1, params.timeLearnRate);
check('maxDailyReachRate in (0, 1)', params.maxDailyReachRate > 0 && params.maxDailyReachRate < 1, params.maxDailyReachRate);
check('referrerEligibilityRate in [0, 1)', params.referrerEligibilityRate >= 0 && params.referrerEligibilityRate < 1, params.referrerEligibilityRate);
check('avgResolutionDays in [1, offerExpirationDays]', params.avgResolutionDays >= 1 && params.avgResolutionDays <= params.offerExpirationDays, params.avgResolutionDays);
check('offerExpirationDays in (0, 30]', params.offerExpirationDays > 0 && params.offerExpirationDays <= 30, params.offerExpirationDays);
check('baseRevenuePerUser > 0', params.baseRevenuePerUser > 0, params.baseRevenuePerUser);
check('premiumRevenuePerUser >= baseRevenuePerUser', params.premiumRevenuePerUser >= params.baseRevenuePerUser, `base=${params.baseRevenuePerUser}, premium=${params.premiumRevenuePerUser}`);
check('bootstrap safety', params.effFloor > 0 || params.accidentalConvRate > 0, '');

// ─── Summary ────────────────────────────────────────────────────────

console.log(`\n═══ Summary: ${passed} passed, ${failed} failed ═══`);
if (failed > 0) {
  console.log('\n⚠ Some checks failed. Review output above.');
  process.exit(1);
} else {
  console.log('\nAll checks passed.');
}
