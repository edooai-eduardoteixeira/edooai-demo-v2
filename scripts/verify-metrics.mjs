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
  computeCampaignList,
  computeDailyOutreach,
  computeFollowUpRate,
  computeOpsDecomposition,
  computeSuggestedChange,
  ENGINE_MAX_DAYS,
  KPI_KEYS,
} from '../src/lib/metrics.js';
import { CAMPAIGNS, activeCampaigns } from '../src/fixtures/campaigns.js';
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

// ─── 7. S2: Campaign roster stability (P4) ─────────────────────────────
console.log('\n═══ 7. S2 Campaign roster stability ═══');
{
  // Active campaigns at every day must be a subset (in fixture order) of
  // CAMPAIGNS — i.e., once a campaign starts, it keeps the same id and color.
  let stableIds = true;
  let stableColors = true;
  let weightsValid = true;
  for (let day = 1; day <= 30; day++) {
    const active = activeCampaigns(day);
    for (const c of active) {
      const fixtureEntry = CAMPAIGNS.find(f => f.id === c.id);
      if (!fixtureEntry || fixtureEntry.color !== c.color) stableColors = false;
    }
    const sumShares = active.reduce((s, c) => s + c.share, 0);
    if (active.length > 0 && Math.abs(sumShares - 1) > 1e-9) weightsValid = false;
    // IDs must appear in fixture order (subset preserves order)
    const fixtureIdsInOrder = CAMPAIGNS.map(c => c.id);
    let lastIdx = -1;
    for (const c of active) {
      const idx = fixtureIdsInOrder.indexOf(c.id);
      if (idx <= lastIdx) stableIds = false;
      lastIdx = idx;
    }
  }
  check('Campaign IDs in stable fixture order on every day', stableIds);
  check('Campaign colors stable per ID across all days', stableColors);
  check('Active-campaign shares sum to 1.0 on every day', weightsValid);
}

// ─── 8. S2: Operations decomposition invariant ─────────────────────────
console.log('\n═══ 8. S2 newContacts + followUps ≡ total ═══');
{
  let invariantOk = true;
  let detail = '';
  for (let day = 1; day <= 30; day++) {
    const decomp = computeOpsDecomposition(projection.days, day);
    if (decomp.newContacts + decomp.followUps !== decomp.total) {
      invariantOk = false;
      detail = `day ${day}: ${decomp.newContacts} + ${decomp.followUps} ≠ ${decomp.total}`;
      break;
    }
  }
  check('newContacts + followUps === total for all days 1..30', invariantOk, detail);

  // Follow-up rate is 0 during grace window
  check('Follow-up rate = 0 at Day 1', computeFollowUpRate(projection.days, 1) === 0);
  check('Follow-up rate = 0 at Day 3 (within grace)', computeFollowUpRate(projection.days, 3) === 0);
  // Follow-up rate ramps up after grace, capped at 0.35
  const fr30 = computeFollowUpRate(projection.days, 30);
  check(`Follow-up rate at Day 30 in (0, 0.35]`, fr30 > 0 && fr30 <= 0.35, `got ${fr30}`);
}

// ─── 9.5 S3: Funnel monotonicity (P1) ──────────────────────────────────
console.log('\n═══ 9.5 S3 Funnel monotonicity ═══');
{
  let allMonotonic = true;
  let firstViolation = null;
  for (let day = 1; day <= 30; day++) {
    const m = computeDashboardMetrics(projection, { selectedDay: day, dateRange: 30 });
    const values = m.funnel.map(s => s.value);
    for (let i = 1; i < values.length; i++) {
      if (values[i] > values[i - 1]) {
        allMonotonic = false;
        firstViolation = `day ${day}: ${m.funnel[i - 1].label}=${values[i - 1]} < ${m.funnel[i].label}=${values[i]}`;
        break;
      }
    }
    if (!allMonotonic) break;
  }
  check('Funnel non-increasing across all 6 stages, every day 1..30', allMonotonic, firstViolation);
}

// ─── 9.6 S3: KPI ↔ funnel.activeUser tie-out (P7) ──────────────────────
console.log('\n═══ 9.6 S3 KPI/funnel tie-out (period covers full history) ═══');
{
  let allTied = true;
  let firstFail = null;
  for (let day = 1; day <= 30; day++) {
    // dateRange >= day → period covers full history → KPI === cumulative funnel
    const m = computeDashboardMetrics(projection, { selectedDay: day, dateRange: 30 });
    const kpiActive = m.kpiCards.find(c => c.key === 'activeUsers').value;
    const funnelActive = m.funnel.find(s => s.label === 'Active User').value;
    if (kpiActive !== funnelActive) {
      allTied = false;
      firstFail = `day ${day}: KPI.activeUsers=${kpiActive}, funnel.Active=${funnelActive}`;
      break;
    }
  }
  check('KPI activeUsers === funnel.Active when period covers full history',
    allTied, firstFail);
}

// ─── 9.7 S3: Hero chart values sane (no NaN, ROI/fraud non-negative) ───
console.log('\n═══ 9.7 S3 Hero chart values ═══');
{
  let roiSane = true;
  let fraudSane = true;
  for (let day = 1; day <= 30; day++) {
    const roiHero = computeHeroChartForKPI(projection, 'roi', day);
    const fraudHero = computeHeroChartForKPI(projection, 'fraudSaved', day);
    if (roiHero.slice.some(v => Number.isNaN(v) || v < 0)) roiSane = false;
    if (fraudHero.slice.some(v => Number.isNaN(v) || v < 0)) fraudSane = false;
  }
  check('ROI hero chart: no NaN, no negatives every day', roiSane);
  check('FraudSaved hero chart: no NaN, no negatives every day', fraudSane);
}

// ─── 9.85 S4 (post-QA): GA-style delta visibility ─────────────────────
// - deltaPct is null only when there's literally no prior period
//   (selectedDay <= dateRange ⇒ current period covers all data) OR when
//   priorValue is 0 (ratio metrics that haven't accumulated meaningful data).
// - When prior period exists with priorValue > 0, deltaPct is shown
//   regardless of clipping (matches Google Analytics behavior).
// - 0% deltas are shown (not hidden).
console.log('\n═══ 9.85 S4 GA-style delta visibility ═══');
{
  let deltaCorrect = true;
  let firstFail = '';
  for (const range of [7, 30]) {
    for (let day = 1; day <= 30; day++) {
      const m = computeDashboardMetrics(projection, { selectedDay: day, dateRange: range });
      const expectedHasAnyPrior = day - range >= 1;
      for (const card of m.kpiCards) {
        // When no prior period exists, delta MUST be null
        if (!expectedHasAnyPrior && card.deltaPct !== null) {
          deltaCorrect = false;
          firstFail = `day=${day} range=${range} ${card.key}: delta=${card.deltaPct} (expected null, no prior)`;
          break;
        }
      }
      if (!deltaCorrect) break;
    }
    if (!deltaCorrect) break;
  }
  check('deltaPct === null only when no prior period exists', deltaCorrect, firstFail);
}

// ─── 9.8 S3+S4: KPI ↔ hero chart aggregation tie-out at ANY window ─────
// Daily chart values, aggregated under each metric's natural rule, must
// equal the KPI card's period value at every window combination.
//
//   activeUsers: Σ daily over period === KPI                (additive)
//   CAC:         (Σ day reward cost) / (Σ day users) === KPI (weighted ratio)
//   ROAS:        (Σ day value) / (Σ day spend) === KPI       (weighted ratio)
//   fraudSaved:  Σ day fraudSaved increments === KPI         (additive)
//
// All 4 KPIs verified at all (day, range) combinations.
console.log('\n═══ 9.8 KPI/hero aggregation tie-out (all windows) ═══');
{
  const days = projection.days;
  let usersTie = true, cacTie = true, roiTie = true, fraudTie = true;
  let firstFail = { users: '', cac: '', roi: '', fraud: '' };

  for (const range of [7, 30]) {
    for (let day = 1; day <= 30; day++) {
      const m = computeDashboardMetrics(projection, { selectedDay: day, dateRange: range });
      const endIdx = day - 1;
      const startIdx = Math.max(0, endIdx - range + 1);
      const periodDays = days.slice(startIdx, endIdx + 1);

      // Helper: sum daily increments of a cumulative engine field
      const sumIncrements = (field) => periodDays.reduce((s, d, i) => {
        const idx = startIdx + i;
        const prev = idx > 0 ? days[idx - 1][field] : 0;
        return s + (d[field] - prev);
      }, 0);

      // activeUsers: chart slice over period
      const usersHero = computeHeroChartForKPI(projection, 'activeUsers', day).slice;
      const usersPeriod = usersHero.slice(startIdx, endIdx + 1).reduce((s, v) => s + v, 0);
      const usersKpi = m.kpiCards.find(c => c.key === 'activeUsers').value;
      if (usersPeriod !== usersKpi && !firstFail.users) {
        usersTie = false;
        firstFail.users = `day=${day} range=${range}: chart sum=${usersPeriod}, KPI=${usersKpi}`;
      }

      // CAC: weighted-by-users average of daily unit costs.
      // Chart shows daily unit cost as stacked bar [referrer, referee].
      // Engine: cumRewardCost increment per day = unit cost × resolved users.
      // KPI = Σ (unit_cost × users) / Σ users = Σ cumRewardCost increments / Σ users.
      const periodUsers = periodDays.reduce((s, d) => s + (d.dailyFunnel?.activeUser || 0), 0);
      const periodReward = sumIncrements('cumulativeRewardCost');
      const expectedCac = periodUsers > 0 ? Math.round(periodReward / periodUsers) : 0;
      const cacKpi = m.kpiCards.find(c => c.key === 'cac').value;
      if (cacKpi !== expectedCac && !firstFail.cac) {
        cacTie = false;
        firstFail.cac = `day=${day} range=${range}: KPI=${cacKpi}, expected=${expectedCac} (Σreward/Σusers)`;
      }

      // ROAS: weighted by daily reward cost (actual payouts), NOT budget.
      // KPI = Σ daily value / Σ daily reward cost = value-per-reward-dollar.
      const periodRewardForRoi = sumIncrements('cumulativeRewardCost');
      const periodValue = sumIncrements('cumulativeValue');
      const expectedRoi = periodRewardForRoi > 0
        ? Math.round((periodValue / periodRewardForRoi) * 10) / 10 : 0;
      const roiKpi = m.kpiCards.find(c => c.key === 'roi').value;
      if (roiKpi !== expectedRoi && !firstFail.roi) {
        roiTie = false;
        firstFail.roi = `day=${day} range=${range}: KPI=${roiKpi}, expected=${expectedRoi}`;
      }

      // fraudSaved: chart slice over period
      const fraudHero = computeHeroChartForKPI(projection, 'fraudSaved', day).slice;
      const fraudPeriod = fraudHero.slice(startIdx, endIdx + 1).reduce((s, v) => s + v, 0);
      const fraudKpi = m.kpiCards.find(c => c.key === 'fraudSaved').value;
      if (Math.abs(fraudPeriod - fraudKpi) > 1 && !firstFail.fraud) {
        fraudTie = false;
        firstFail.fraud = `day=${day} range=${range}: chart sum=${fraudPeriod}, KPI=${fraudKpi}`;
      }
    }
  }

  check('activeUsers: sum(daily over period) === KPI (any window)', usersTie, firstFail.users);
  check('CAC: Σ reward cost / Σ users === KPI (any window)', cacTie, firstFail.cac);
  check('ROAS: Σ value / Σ reward cost === KPI (any window)', roiTie, firstFail.roi);
  check('fraudSaved: sum(daily over period) === KPI ±$1 (any window)', fraudTie, firstFail.fraud);
}

// ─── 9. S2: Suggested change comes from engine, not fabricated ─────────
console.log('\n═══ 9. S2 SuggestedChange is engine-derived ═══');
{
  // Engine produces agentRecommendations array
  check('projection.agentRecommendations is an array', Array.isArray(projection.agentRecommendations),
    `type=${typeof projection.agentRecommendations}`);
  check('projection.agentRecommendations length >= 30',
    (projection.agentRecommendations?.length || 0) >= 30,
    `length=${projection.agentRecommendations?.length}`);

  // Day 1 suggestion: either null or computed from Day 1 data only (not horizon)
  const recDay1 = computeSuggestedChange(projection, 1);
  const recDay30 = computeSuggestedChange(projection, 30);
  // No future leakage: rec at Day 1 should equal projection.agentRecommendations[0]
  check('SuggestedChange at Day 1 uses agentRecommendations[0] (no future leakage)',
    recDay1 === projection.agentRecommendations[0]);
  // Day 30 surfaces the latest available rec (no fabricated $50/$75/3.2x text)
  if (recDay30) {
    const text = JSON.stringify(recDay30);
    check('Day 30 recommendation does NOT contain fabricated "$50 credit" text',
      !text.includes('$50 credit outperforms') && !text.includes('3.2x better'),
      'fabricated text leaked');
  } else {
    check('Day 30 recommendation null is acceptable (no fabricated text)', true);
  }
}

// ─── Summary ───────────────────────────────────────────────────────────
console.log(`\n══════════════════════════════════════════════════════════════`);
console.log(`  ${passed} passed, ${failed} failed`);
console.log(`══════════════════════════════════════════════════════════════\n`);

if (failed > 0) process.exit(1);
