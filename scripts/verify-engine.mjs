/**
 * Verification script for the projection engine v2 (Journey Model).
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
const REQUIRED_KEYS = ['dailyCurve', 'thresholdDay', 'activeUsers', 'cac', 'roi', 'convRate', 'fraudSaved', 'guidanceState', 'confidenceCurve', 'totalJourneysStarted'];
for (const key of REQUIRED_KEYS) {
  check(`has '${key}'`, key in r, `missing from return object`);
}
check('dailyCurve is array of 30', Array.isArray(r.dailyCurve) && r.dailyCurve.length === 30, `length=${r.dailyCurve?.length}`);
check('confidenceCurve is array of 30', Array.isArray(r.confidenceCurve) && r.confidenceCurve.length === 30, `length=${r.confidenceCurve?.length}`);
check('activeUsers is number', typeof r.activeUsers === 'number', typeof r.activeUsers);
check('cac is number', typeof r.cac === 'number', typeof r.cac);
check('roi is number', typeof r.roi === 'number', typeof r.roi);
check('totalJourneysStarted is number', typeof r.totalJourneysStarted === 'number', typeof r.totalJourneysStarted);

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

// ─── 3. Journey resolution delay ────────────────────────────────────

console.log('\n═══ 3. Journey Resolution Delay ═══');
const delay = params.journeyResolutionDays;
for (const b of [50_000, 150_000, 500_000]) {
  const res = computeProjection({ budget: b, params });
  const earlyDays = res.dailyCurve.slice(0, delay);
  const allZero = earlyDays.every(v => v === 0);
  check(
    `$${b / 1000}K: first ${delay} days have 0 resolved conversions`,
    allZero,
    `got [${earlyDays.join(', ')}]`
  );
}

// ─── 4. Audience derivation ─────────────────────────────────────────

console.log('\n═══ 4. Audience Derivation ═══');
const expectedAudience = Math.round(params.totalCustomers * params.eligibilityRate);
check(
  `audienceSize = ${params.totalCustomers} × ${params.eligibilityRate} = ${expectedAudience}`,
  expectedAudience === Math.round(847000 * 0.295),
  `got ${expectedAudience}`
);
check(
  'N_max <= audienceSize',
  params.N_max <= expectedAudience,
  `N_max=${params.N_max}, audienceSize=${expectedAudience}`
);

// ─── 5. Daily curve shape ───────────────────────────────────────────

console.log('\n═══ 5. Daily Curve Shape ═══');
const budgets = [50_000, 150_000, 500_000];
for (const b of budgets) {
  const res = computeProjection({ budget: b, params });
  // Compare resolved days only (skip initial delay)
  const resolvedDays = res.dailyCurve.slice(delay);
  const firstResolvedAvg = resolvedDays.slice(0, 5).reduce((s, v) => s + v, 0) / 5;
  const lastResolvedAvg = resolvedDays.slice(-5).reduce((s, v) => s + v, 0) / 5;
  check(
    `$${b / 1000}K: last 5 resolved days avg > first 5 resolved days avg`,
    lastResolvedAvg > firstResolvedAvg,
    `first5=${firstResolvedAvg.toFixed(1)}, last5=${lastResolvedAvg.toFixed(1)}`
  );
}

// ─── 6. Users increase with budget (sublinearly) ────────────────────

console.log('\n═══ 6. Users vs Budget ═══');
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

// ─── 7. CAC increases with budget (above recommended range) ─────────

console.log('\n═══ 7. CAC vs Budget ═══');
const aboveRec = results.filter(r => r.budget >= params.budget.recMin);
let cacMonotone = true;
for (let i = 1; i < aboveRec.length; i++) {
  if (aboveRec[i].cac < aboveRec[i - 1].cac) cacMonotone = false;
}
check('CAC increases with budget (above recMin)', cacMonotone,
  aboveRec.map(r => `$${r.budget / 1000}K→$${r.cac}`).join(', '));

// ─── 8. ROI decreases with budget (above recommended range) ────────

console.log('\n═══ 8. ROI vs Budget ═══');
let roiMonotone = true;
for (let i = 1; i < aboveRec.length; i++) {
  if (aboveRec[i].roi > aboveRec[i - 1].roi) roiMonotone = false;
}
check('ROI decreases with budget (above recMin)', roiMonotone,
  aboveRec.map(r => `$${r.budget / 1000}K→${r.roi}x`).join(', '));

// ─── 9. ThresholdDay moves with budget ──────────────────────────────

console.log('\n═══ 9. Threshold Day ═══');
const td50 = computeProjection({ budget: 50_000, params }).thresholdDay;
const td150 = computeProjection({ budget: 150_000, params }).thresholdDay;
const td500 = computeProjection({ budget: 500_000, params }).thresholdDay;
check(`$50K thresholdDay (${td50}) >= $150K (${td150})`, td50 >= td150, '');
check(`$150K thresholdDay (${td150}) >= $500K (${td500})`, td150 >= td500, '');

// ─── 10. Guidance states ────────────────────────────────────────────

console.log('\n═══ 10. Guidance States ═══');
check('Below floor → belowFloor', computeProjection({ budget: 10_000, params }).guidanceState === 'belowFloor', '');
check('Below recMin → belowRec', computeProjection({ budget: 80_000, params }).guidanceState === 'belowRec', '');
check('In range → atRec', computeProjection({ budget: 150_000, params }).guidanceState === 'atRec', '');
check('Above recMax → aboveRec', computeProjection({ budget: 300_000, params }).guidanceState === 'aboveRec', '');

// ─── 11. Calibration targets ───────────────────────────────────────

console.log('\n═══ 11. Calibration Targets ═══');
const TARGETS = [
  { budget: 50_000,  cac: [200, 250],  users: [200, 250],   roi: [1.8, 2.2] },
  { budget: 150_000, cac: [250, 350],  users: [430, 600],   roi: [1.4, 2.0] },
  { budget: 500_000, cac: [400, 600],  users: [830, 1250],  roi: [0.8, 1.2] },
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

// ─── 12. Edge cases ─────────────────────────────────────────────────

console.log('\n═══ 12. Edge Cases ═══');
const zero = computeProjection({ budget: 0, params });
check('$0 budget → 0 ROI', zero.roi === 0, `got ${zero.roi}`);
check('$0 budget → belowFloor', zero.guidanceState === 'belowFloor', zero.guidanceState);

const tiny = computeProjection({ budget: 1000, params });
check('$1K budget → runs without error', typeof tiny.activeUsers === 'number', '');

const huge = computeProjection({ budget: 5_000_000, params });
check('$5M budget → runs without error', typeof huge.activeUsers === 'number', '');
check('$5M budget → activeUsers > $500K users', huge.activeUsers > users500, `got ${huge.activeUsers}`);

// ─── 13. Parameter assertions ───────────────────────────────────────

console.log('\n═══ 13. Parameter Assertions ═══');
check('totalCustomers > 0', params.totalCustomers > 0, params.totalCustomers);
check('eligibilityRate in (0, 1]', params.eligibilityRate > 0 && params.eligibilityRate <= 1, params.eligibilityRate);
check('N_max > 0', params.N_max > 0, params.N_max);
check('N_max <= audienceSize', params.N_max <= expectedAudience, `N_max=${params.N_max}, audience=${expectedAudience}`);
check('alpha in (0, 2]', params.alpha > 0 && params.alpha <= 2, params.alpha);
check('B_half > 0', params.B_half > 0, params.B_half);
check('baseConvRate in (0, 1)', params.baseConvRate > 0 && params.baseConvRate < 1, params.baseConvRate);
check('accidentalConvRate in (0, baseConvRate)', params.accidentalConvRate > 0 && params.accidentalConvRate < params.baseConvRate, params.accidentalConvRate);
check('effFloor in (0, 1)', params.effFloor > 0 && params.effFloor < 1, params.effFloor);
check('confHalfPoint > 0', params.confHalfPoint > 0, params.confHalfPoint);
check('timeLearnRate in (0, 1]', params.timeLearnRate > 0 && params.timeLearnRate <= 1, params.timeLearnRate);
check('maxDailyReachRate in (0, 1)', params.maxDailyReachRate > 0 && params.maxDailyReachRate < 1, params.maxDailyReachRate);
check('referrerEligibilityRate in [0, 1)', params.referrerEligibilityRate >= 0 && params.referrerEligibilityRate < 1, params.referrerEligibilityRate);
check('journeyResolutionDays in [1, 14]', params.journeyResolutionDays >= 1 && params.journeyResolutionDays <= 14, params.journeyResolutionDays);
check('bootstrap safety', params.effFloor > 0 || params.accidentalConvRate > 0, '');

// ─── Summary ────────────────────────────────────────────────────────

console.log(`\n═══ Summary: ${passed} passed, ${failed} failed ═══`);
if (failed > 0) {
  console.log('\n⚠ Some checks failed. Review output above.');
  process.exit(1);
} else {
  console.log('\nAll checks passed.');
}
