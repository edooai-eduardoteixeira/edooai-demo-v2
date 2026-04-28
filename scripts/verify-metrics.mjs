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

// ─── 1. Day clamp (S5: extended to 60) ─────────────────────────────────
console.log('\n═══ 1. Day clamp ═══');
check('Day 1 → effectiveDay 1', computeEffectiveDay(1) === 1);
check('Day 10 → effectiveDay 10', computeEffectiveDay(10) === 10);
check('Day 30 → effectiveDay 30', computeEffectiveDay(30) === 30);
check('Day 60 → effectiveDay 60 (S5: real Day 60 data)', computeEffectiveDay(60) === 60);
check('Day 90 → clamp to 60 (UI horizon)', computeEffectiveDay(90) === 60);
check('ENGINE_MAX_DAYS = 60 (UI horizon)', ENGINE_MAX_DAYS === 60);

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

// ─── 5. Day 60 differentiates from Day 30 (S5: real Day 60 data) ──────
console.log('\n═══ 5. Day 60 differentiation ═══');
const m30 = computeDashboardMetrics(projection, { selectedDay: 30, dateRange: 30 });
const m60 = computeDashboardMetrics(projection, { selectedDay: 60, dateRange: 30 });
check('Day 60 effectiveDay = 60', m60.effectiveDay === 60);
check('Day 60 funnel ≠ Day 30 funnel (real differentiation)',
  JSON.stringify(m60.funnel) !== JSON.stringify(m30.funnel));
// S6: audience bands are windowed to dateRange. Day 60 with 30d range → 30 entries.
check('Day 60 + 30d audienceOverview.bands has 30 entries (windowed)',
  m60.audienceOverview.bands.advocates.length === 30);
// Verify the window covers the right days
check('Day 60 + 30d audienceOverview window = Days 31..60',
  m60.audienceOverview.startDay === 31 && m60.audienceOverview.endDay === 60);
check('Day 60 funnel.Active > Day 30 funnel.Active (more cumulative resolutions)',
  m60.funnel.find(s => s.label === 'Active User').value >
    m30.funnel.find(s => s.label === 'Active User').value);

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
  for (let day = 1; day <= 60; day++) {
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
  for (let day = 1; day <= 60; day++) {
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
  for (let day = 1; day <= 60; day++) {
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

// ─── 9.6 KPI ↔ funnel tie-out (period-windowed, all combos) ────────────
// Funnel is now period-windowed (Item 2 v3 close-out). KPI activeUsers and
// funnel "Active User" should match at every (day × range) combo, not just
// when the period covers full history.
console.log('\n═══ 9.6 KPI/funnel tie-out (period-windowed, all day×range combos) ═══');
{
  let allTied = true;
  let firstFail = null;
  const ranges = [7, 30];
  for (let day = 1; day <= 60 && allTied; day++) {
    for (const range of ranges) {
      const m = computeDashboardMetrics(projection, { selectedDay: day, dateRange: range });
      const kpiActive = m.kpiCards.find(c => c.key === 'activeUsers').value;
      const funnelActive = m.funnel.find(s => s.label === 'Active User').value;
      if (kpiActive !== funnelActive) {
        allTied = false;
        firstFail = `day ${day}, range ${range}d: KPI.activeUsers=${kpiActive}, funnel.Active=${funnelActive}`;
        break;
      }
    }
  }
  check('KPI activeUsers === funnel.Active at every (day × range) combo',
    allTied, firstFail);
}

// ─── 9.6b S6: Windowed chart slices match dateRange ────────────────────
// All three time-series charts (hero, audience, daily outreach) slice to
// the last `dateRange` days ending at selectedDay (clipped to Day 1).
console.log('\n═══ 9.6b S6 Windowed chart slices ═══');
{
  const cases = [
    { day: 60, range: 30, expectedLen: 30, expectedStart: 31, expectedEnd: 60 },
    { day: 60, range: 7, expectedLen: 7, expectedStart: 54, expectedEnd: 60 },
    { day: 30, range: 30, expectedLen: 30, expectedStart: 1, expectedEnd: 30 },
    { day: 30, range: 7, expectedLen: 7, expectedStart: 24, expectedEnd: 30 },
    { day: 5, range: 30, expectedLen: 5, expectedStart: 1, expectedEnd: 5 },
    { day: 1, range: 7, expectedLen: 1, expectedStart: 1, expectedEnd: 1 },
  ];

  let allOk = true;
  let firstFail = '';
  for (const c of cases) {
    const m = computeDashboardMetrics(projection, { selectedDay: c.day, dateRange: c.range });
    const heroLine = computeHeroChartForKPI(projection, 'activeUsers', c.day, c.range);
    const heroCac = computeHeroChartForKPI(projection, 'cac', c.day, c.range);
    // Audience bands
    if (m.audienceOverview.bands.advocates.length !== c.expectedLen ||
        m.audienceOverview.startDay !== c.expectedStart ||
        m.audienceOverview.endDay !== c.expectedEnd) {
      allOk = false;
      firstFail = `audience day=${c.day} range=${c.range}: len=${m.audienceOverview.bands.advocates.length} (expected ${c.expectedLen}), start=${m.audienceOverview.startDay} end=${m.audienceOverview.endDay}`;
      break;
    }
    // Hero line slice
    if (heroLine.slice.length !== c.expectedLen ||
        heroLine.startDay !== c.expectedStart ||
        heroLine.endDay !== c.expectedEnd) {
      allOk = false;
      firstFail = `hero(activeUsers) day=${c.day} range=${c.range}: len=${heroLine.slice.length} (expected ${c.expectedLen})`;
      break;
    }
    // Hero CAC stacked
    if (heroCac.cacData.length !== c.expectedLen ||
        heroCac.startDay !== c.expectedStart ||
        heroCac.endDay !== c.expectedEnd) {
      allOk = false;
      firstFail = `hero(cac) day=${c.day} range=${c.range}: len=${heroCac.cacData.length} (expected ${c.expectedLen})`;
      break;
    }
    // Daily outreach
    if (m.dailyOutreach.paddedData.length !== c.expectedLen ||
        m.dailyOutreach.startDay !== c.expectedStart ||
        m.dailyOutreach.endDay !== c.expectedEnd) {
      allOk = false;
      firstFail = `dailyOutreach day=${c.day} range=${c.range}: len=${m.dailyOutreach.paddedData.length} (expected ${c.expectedLen})`;
      break;
    }
  }
  check('Windowed slices match dateRange across all 3 time-series charts',
    allOk, firstFail);
}

// ─── 9.65 S6: Static-Rules ROAS line plumbed from engine ──────────────
// staticSlice for ROI must come from projection.staticBaseline.days, not
// from agenticSlice × 0.7 (the prior placeholder). Verifies the line
// represents real engine staticMode output (efficiency locked at effFloor).
console.log('\n═══ 9.65 S6 Static-Rules ROAS plumbing ═══');
{
  const heroRoi = computeHeroChartForKPI(projection, 'roi', 30);
  check('staticSlice exists for ROI hero chart', heroRoi.staticSlice !== null);
  check('staticSlice has same length as agentic slice',
    heroRoi.staticSlice.length === heroRoi.slice.length);
  // Static is NOT just agentic × 0.7 (placeholder formula).
  // Tolerance: allow up to 2 days where static happens to land near 0.7×
  // (e.g. early days where both are 0).
  const close = heroRoi.slice.reduce((cnt, v, i) => {
    const expected = Math.round(v * 0.7 * 10) / 10;
    return cnt + (heroRoi.staticSlice[i] === expected ? 1 : 0);
  }, 0);
  check('staticSlice differs structurally from agentic × 0.7',
    close < heroRoi.slice.length - 2,
    `${close}/${heroRoi.slice.length} days matched the placeholder formula`);

  // S6: at Day 2 (first day with non-zero ROAS), agentic and static must
  // match — both have eff = effFloor (no learning has happened yet).
  // Concept: "static = agentic without learning" requires Day 1 parity.
  check('Day 2 agentic ROAS === static ROAS (parity before any learning)',
    heroRoi.slice[1] === heroRoi.staticSlice[1],
    `agentic=${heroRoi.slice[1]}x, static=${heroRoi.staticSlice[1]}x`);
}

// ─── 9.7 S3: Hero chart values sane (no NaN, ROI/fraud non-negative) ───
console.log('\n═══ 9.7 S3 Hero chart values ═══');
{
  let roiSane = true;
  let fraudSane = true;
  for (let day = 1; day <= 60; day++) {
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
    for (let day = 1; day <= 60; day++) {
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
    for (let day = 1; day <= 60; day++) {
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

// ─── 10. S6 Item 2: Audience flow model ───────────────────────────────
// Replaces the old propensity-coefficient placeholder with a real
// bookkeeping model (acquisition + per-segment contact + cooldown return
// + event-driven promotion + decay). See METRIC_MODEL.md §M4.1–M4.3.
console.log('\n═══ 10. S6 Item 2 v3 Integrated audience model ═══');
{
  const ph = projection.propensityHealth;

  // 10.1 — Bands non-negative at every day
  let allNonNeg = true;
  let firstNeg = '';
  for (let d = 0; d < ph.highEligible.length; d++) {
    if (ph.highEligible[d] < 0 || ph.medEligible[d] < 0 || ph.lowEligible[d] < 0) {
      allNonNeg = false;
      firstNeg = `day=${d + 1}: high=${ph.highEligible[d]} med=${ph.medEligible[d]} low=${ph.lowEligible[d]}`;
      break;
    }
  }
  check('Audience bands non-negative every day', allNonNeg, firstNeg);

  // 10.2 — Day 1 bands match initial 30/45/25 split (within rounding +
  //        one day of acquisition + first-day contacts/decay)
  const day1Total = ph.highEligible[0] + ph.medEligible[0] + ph.lowEligible[0];
  const initialTotal = ph.highStart + ph.medStart + ph.lowStart;
  // Day 1 should be within 1% of initial total (acquisition adds, contacts/decay subtract)
  check('Day 1 total ≈ initial eligible (within 1%)',
    Math.abs(day1Total - initialTotal) / initialTotal < 0.01,
    `day1=${day1Total}, initial=${initialTotal}`);

  // 10.3 — TIE-OUT: audience promotions = engine cumulative referralSent.
  //        Single source of truth — every advocate earned ties to a refer event.
  const cumReferred = projection.days[projection.days.length - 1]?.funnelCumulative?.referralSent || 0;
  const audiencePromos = Math.round(ph._totalPromotions || 0);
  check('Tie-out: audience promotions === engine cumulative referralSent',
    audiencePromos === cumReferred,
    `audience=${audiencePromos}, engine=${cumReferred}`);

  // 10.4 — TIE-OUT: audience internal acq = engine cumulative activeUser
  const cumActive = projection.days[projection.days.length - 1]?.funnelCumulative?.activeUser || 0;
  const audienceInt = Math.round(ph._totalInternalAcq || 0);
  check('Tie-out: audience internal acquisition === engine cumulative activeUser',
    audienceInt === cumActive,
    `audience=${audienceInt}, engine=${cumActive}`);

  // 10.5 — Higher budget grows Advocate band more than zero budget
  //        (more contacts → more refers → more promotions)
  const projZero = computeDashboardProjection({ budget: 0, params });
  const projHigh = computeDashboardProjection({ budget: 300_000, params });
  const advZeroDay60 = projZero.propensityHealth.highEligible[59];
  const advHighDay60 = projHigh.propensityHealth.highEligible[59];
  check('Higher budget grows Advocate band more than zero budget',
    advHighDay60 > advZeroDay60,
    `zero=${advZeroDay60}, $300K=${advHighDay60}`);

  // 10.6 — At zero budget: zero promotions, zero internal acquisition
  //        (no contacts → no refers → no actives). Pool grows only via external acq.
  check('Zero budget: zero promotions (no refer events without contacts)',
    Math.round(projZero.propensityHealth._totalPromotions) === 0);
  check('Zero budget: zero internal acquisition',
    Math.round(projZero.propensityHealth._totalInternalAcq) === 0);

  // 10.7 — Pool grows over 60 days at any budget (external acquisition is
  //        positive every day, budget-independent).
  const total1 = ph.highEligible[0] + ph.medEligible[0] + ph.lowEligible[0];
  const total60 = ph.highEligible[59] + ph.medEligible[59] + ph.lowEligible[59];
  check('Pool total grows over 60 days (acquisition adds; only Pas-exits remove)',
    total60 > total1,
    `day1=${total1}, day60=${total60}`);

  // 10.8 — Pool total similar across budgets (external acq is budget-independent;
  //        only Pas-exit removes, scaled by demotion volume which is small)
  const totalZero60 = projZero.propensityHealth.highEligible[59] +
                      projZero.propensityHealth.medEligible[59] +
                      projZero.propensityHealth.lowEligible[59];
  const totalHigh60 = projHigh.propensityHealth.highEligible[59] +
                      projHigh.propensityHealth.medEligible[59] +
                      projHigh.propensityHealth.lowEligible[59];
  const totalDriftPct = Math.abs(totalZero60 - totalHigh60) / totalZero60 * 100;
  check('Pool total drift between zero and high budget < 5% (acquisition dominates)',
    totalDriftPct < 5,
    `zero=${totalZero60}, $300K=${totalHigh60}, drift=${totalDriftPct.toFixed(2)}%`);
}

// ─── 11. S6 Item 2 close-out: Daily outreach tie-out ───────────────────
// Largest-remainder allocation makes Σ campaigns per day === engine.dailyFunnel.contacted exactly.
console.log('\n═══ 11. S6 Item 2 close-out — daily-outreach tie-out ═══');
{
  // 11.1 — Σ campaigns per day === engine.dailyFunnel.contacted at every day
  let allTied = true;
  let firstFail = '';
  for (let day = 1; day <= 60 && allTied; day++) {
    const m = computeDashboardMetrics(projection, { selectedDay: day, dateRange: day });
    // paddedData has length = day; index 0 = day 1, ..., index day-1 = current day
    for (let i = 0; i < m.dailyOutreach.paddedData.length; i++) {
      const dayN = i + 1;
      const sumCampaigns = m.dailyOutreach.paddedData[i].reduce((a, b) => a + b, 0);
      const engineDaily = projection.days[dayN - 1]?.dailyFunnel?.contacted || 0;
      if (sumCampaigns !== engineDaily) {
        allTied = false;
        firstFail = `day ${dayN} (selectedDay=${day}): sum=${sumCampaigns}, engine=${engineDaily}`;
        break;
      }
    }
  }
  check('Σ campaigns at every day === engine.dailyFunnel.contacted (hard equality)',
    allTied, firstFail);

  // 11.2 — Period sum across (day × range) === funnel.Contacted at that combo
  const periodCases = [
    { day: 60, range: 30 }, { day: 60, range: 7 },
    { day: 30, range: 30 }, { day: 30, range: 7 },
    { day: 10, range: 7 }, { day: 1, range: 7 },
  ];
  let allPeriodTied = true;
  let firstPeriodFail = '';
  for (const c of periodCases) {
    const m = computeDashboardMetrics(projection, { selectedDay: c.day, dateRange: c.range });
    let outreachSum = 0;
    m.dailyOutreach.paddedData.forEach(perDay => {
      outreachSum += perDay.reduce((a, b) => a + b, 0);
    });
    const funnelContacted = m.funnel.find(s => s.label === 'Contacted').value;
    if (outreachSum !== funnelContacted) {
      allPeriodTied = false;
      firstPeriodFail = `day ${c.day} range ${c.range}: outreach sum=${outreachSum}, funnel=${funnelContacted}`;
      break;
    }
  }
  check('Σ daily outreach across period === funnel.Contacted at every (day × range)',
    allPeriodTied, firstPeriodFail);
}

// ─── Summary ───────────────────────────────────────────────────────────
console.log(`\n══════════════════════════════════════════════════════════════`);
console.log(`  ${passed} passed, ${failed} failed`);
console.log(`══════════════════════════════════════════════════════════════\n`);

if (failed > 0) process.exit(1);
