/**
 * verify-metrics.mjs — invariants for the metrics derivation module.
 *
 * Pattern matches scripts/verify-engine.mjs (check helper, exit code on failure).
 *
 * Stage 1: shape and basic edge cases. Subsequent stages add monotonicity,
 * tie-out, period collapse, etc. — see docs/METRIC_MODEL.md stage map.
 *
 * Snapshot regression diff is in scripts/diff-snapshot.mjs.
 *
 * Usage: node scripts/verify-metrics.mjs
 */

import { computeDashboardProjection } from '../src/engine/projectionEngine.js';
import {
  computeDashboardMetrics,
  computeHeroChartForKPI,
  computeEffectiveDay,
  ENGINE_MAX_DAYS,
  KPI_KEYS,
} from '../src/lib/metrics.js';
import neobank from '../src/config/neobank.js';

const params = neobank.engineParams;
let passed = 0;
let failed = 0;

function check(name, condition, detail = '') {
  if (condition) {
    console.log(`  ✓ ${name}`);
    passed++;
  } else {
    console.log(`  ✗ ${name}${detail ? `: ${detail}` : ''}`);
    failed++;
  }
}

// ─── 1. Day clamp ───────────────────────────────────────────────────────
console.log('\n═══ 1. Day clamp ═══');
check('Day 1 → effectiveDay 1', computeEffectiveDay(1) === 1);
check('Day 10 → effectiveDay 10', computeEffectiveDay(10) === 10);
check('Day 30 → effectiveDay 30', computeEffectiveDay(30) === 30);
check('Day 60 → effectiveDay 30 (S1: clamps)', computeEffectiveDay(60) === 30);
check('ENGINE_MAX_DAYS = 30', ENGINE_MAX_DAYS === 30);

// ─── 2. Top-level orchestrator returns expected shape ──────────────────
console.log('\n═══ 2. Shape ═══');
const projection = computeDashboardProjection({ budget: 150_000, params });
const m = computeDashboardMetrics(projection, { selectedDay: 30, dateRange: 30 });
const expectedKeys = [
  'effectiveDay', 'dayData', 'campaignHealth', 'suggestedChange',
  'kpiCards', 'funnel', 'audienceOverview', 'campaignList', 'dailyOutreach',
];
for (const key of expectedKeys) {
  check(`computeDashboardMetrics returns ${key}`, key in m, `keys=${Object.keys(m).join(',')}`);
}

check('kpiCards has 4 entries', m.kpiCards.length === 4, `got ${m.kpiCards.length}`);
check('kpiCards keys match KPI_KEYS', m.kpiCards.every((c, i) => c.key === KPI_KEYS[i]),
  `got ${m.kpiCards.map(c => c.key).join(',')}`);
check('funnel has 6 stages', m.funnel.length === 6, `got ${m.funnel.length}`);
const funnelLabels = ['Contacted', 'Engaged', 'Referred', 'Reached', 'Signed Up', 'Active User'];
check('funnel labels in order', m.funnel.every((s, i) => s.label === funnelLabels[i]),
  `got ${m.funnel.map(s => s.label).join(',')}`);

// ─── 3. No NaN / undefined leaks ───────────────────────────────────────
console.log('\n═══ 3. No NaN/undefined leaks ═══');
function checkNoNaN(label, obj) {
  const json = JSON.stringify(obj);
  const hasNaN = json.includes('null') === false && /:\s*NaN/.test(JSON.stringify(obj, (k, v) => Number.isNaN(v) ? 'NaN-LEAK' : v));
  // More robust: walk the object
  function walk(node, path = '') {
    if (Number.isNaN(node)) {
      console.log(`    ⚠ NaN at ${path}`);
      return true;
    }
    if (typeof node === 'object' && node !== null) {
      for (const [k, v] of Object.entries(node)) {
        if (walk(v, `${path}.${k}`)) return true;
      }
    }
    return false;
  }
  const found = walk(obj, label);
  check(`${label}: no NaN`, !found);
}

for (const day of [1, 10, 30, 60]) {
  for (const range of [7, 30]) {
    checkNoNaN(`day=${day} range=${range}`, computeDashboardMetrics(projection, { selectedDay: day, dateRange: range }));
    for (const kpi of KPI_KEYS) {
      const eff = computeEffectiveDay(day);
      checkNoNaN(`day=${day} kpi=${kpi}`, computeHeroChartForKPI(projection, kpi, eff));
    }
  }
}

// ─── 4. Day 1 doesn't crash ────────────────────────────────────────────
console.log('\n═══ 4. Day 1 boundary ═══');
const m1 = computeDashboardMetrics(projection, { selectedDay: 1, dateRange: 7 });
check('Day 1 / 7d returns metrics', m1 && m1.kpiCards.length === 4);
check('Day 1 funnel has 6 stages', m1.funnel.length === 6);
check('Day 1 hero chart for activeUsers does not crash',
  computeHeroChartForKPI(projection, 'activeUsers', 1) !== undefined);
check('Day 1 hero chart for cac does not crash',
  computeHeroChartForKPI(projection, 'cac', 1) !== undefined);

// ─── 5. Day 60 returns same as Day 30 (S1 clamp behavior preserved) ────
console.log('\n═══ 5. Day 60 clamp parity ═══');
const m30 = computeDashboardMetrics(projection, { selectedDay: 30, dateRange: 30 });
const m60 = computeDashboardMetrics(projection, { selectedDay: 60, dateRange: 30 });
check('Day 60 effectiveDay = 30', m60.effectiveDay === 30);
check('Day 60 funnel = Day 30 funnel',
  JSON.stringify(m60.funnel) === JSON.stringify(m30.funnel));
check('Day 60 audienceOverview.bands = Day 30',
  JSON.stringify(m60.audienceOverview.bands) === JSON.stringify(m30.audienceOverview.bands));

// ─── 6. KPI period values: monotonic with window growth ────────────────
console.log('\n═══ 6. KPI period sums grow with window (where additive) ═══');
// activeUsers and fraudSaved are additive — period 30d > period 7d at Day 30
const m30_30 = computeDashboardMetrics(projection, { selectedDay: 30, dateRange: 30 });
const m30_7 = computeDashboardMetrics(projection, { selectedDay: 30, dateRange: 7 });
const usersKpi30 = m30_30.kpiCards.find(c => c.key === 'activeUsers').value;
const usersKpi7 = m30_7.kpiCards.find(c => c.key === 'activeUsers').value;
check('activeUsers: 30d sum >= 7d sum at Day 30',
  usersKpi30 >= usersKpi7,
  `30d=${usersKpi30}, 7d=${usersKpi7}`);

// ─── Summary ───────────────────────────────────────────────────────────
console.log(`\n══════════════════════════════════════════════════════════════`);
console.log(`  ${passed} passed, ${failed} failed`);
console.log(`══════════════════════════════════════════════════════════════\n`);

if (failed > 0) process.exit(1);
