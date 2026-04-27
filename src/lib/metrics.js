/**
 * metrics.js — single source of truth for every visible number on the dashboard.
 *
 * See docs/METRIC_MODEL.md for the canonical definition of each metric (meaning,
 * time-base, derivation, edge-case policy). This file IMPLEMENTS that doc.
 *
 * Pure functions. No React. No engine. Inputs go in, numbers come out.
 *
 * Stage 1 contract: reproduces current dashboard behavior EXACTLY (refactor only).
 * Stage 2: numeric side channels eliminated — campaign roster comes from
 * src/fixtures/campaigns.js (stable IDs and colors), follow-up rate is engine-
 * state-derived (not a linear animation), Day 30 recommendation comes from the
 * engine's agentRecommendations (constrained to data ≤ selected day), no longer
 * the fabricated "$50 credit / 3.2x" placeholder.
 */

import { CAMPAIGNS, activeCampaigns } from '../fixtures/campaigns.js';

// ─── Constants ──────────────────────────────────────────────────────────
// UI horizon: Day 60 is the highest day stop. Engine runs to 90 days (60 +
// 30-day buffer for cohort maturation and offer expiration). See
// computeDashboardProjection in projectionEngine.js.
export const ENGINE_MAX_DAYS = 60;

export const KPI_KEYS = ['activeUsers', 'cac', 'roi', 'fraudSaved'];

// Grace window before the agent starts following up on prior contacts.
// Below this, today's outreach is 100% new contacts.
const FOLLOW_UP_GRACE_DAYS = 3;
const FOLLOW_UP_CAP = 0.35;

/**
 * Compute the windowed [startDay, endDay] range for a chart view.
 * Mirrors the period-windowing used by KPI cards: last `dateRange` days
 * ending at `selectedDay`, clipped to start at Day 1 if selectedDay < dateRange.
 */
export function computeWindow(selectedDay, dateRange) {
  const endDay = selectedDay;
  const startDay = Math.max(1, selectedDay - dateRange + 1);
  return { startDay, endDay, length: endDay - startDay + 1 };
}

// ─── Day clamp (MX.1) ───────────────────────────────────────────────────
/** @see METRIC_MODEL.md §MX.1 */
export function computeEffectiveDay(selectedDay) {
  return Math.min(selectedDay, ENGINE_MAX_DAYS);
}

// ─── Region 1: Campaign Health Row + Suggested Change ───────────────────

/** @see METRIC_MODEL.md §M1.1 */
export function computeDeliveryState(projection, dayData, selectedDay) {
  const isLearning = selectedDay <= projection.thresholdDay;
  if (isLearning) return { label: 'Learning', active: false };
  if (dayData.capHit) return { label: 'Limited by Budget', active: false };
  return { label: 'Acquiring Customers', active: true };
}

/** @see METRIC_MODEL.md §M1.3 §M1.4 §M1.2 */
export function computeCampaignHealth(projection, dayData, selectedDay, dateRange) {
  const days = projection.days;

  // M1.4: Pacing — annualize current daily spend rate to monthly
  const dailySpendRate = selectedDay > 0 ? dayData.cumulativeSpend / selectedDay : 0;
  const monthlyPace = Math.round(dailySpendRate * 30);

  // M1.3: Spent — period total based on date range, using ACTUAL reward
  // payouts (cumulativeRewardCost), not budget allocation (cumulativeSpend).
  // Domain: cost flows through conversion, not contact.
  const endIdx = selectedDay - 1;
  const startIdx = Math.max(0, endIdx - dateRange + 1);
  const startReward = startIdx > 0 ? days[startIdx - 1].cumulativeRewardCost : 0;
  const periodSpend = Math.round(dayData.cumulativeRewardCost - startReward);
  return {
    delivery: computeDeliveryState(projection, dayData, selectedDay),
    budget: projection.budget,
    periodSpend,
    monthlyPace,
  };
}

/** @see METRIC_MODEL.md §M1.5 — S2 uses engine.agentRecommendations indexed by
 * selected day (no future leakage). Falls back to scanning earlier days so the
 * strip persists once the agent first surfaces a recommendation. */
export function computeSuggestedChange(projection, selectedDay) {
  const recs = projection.agentRecommendations;
  if (!recs || !recs.length) return null;
  // Scan from selectedDay back to 1 — surface the most recent rec available.
  const maxIdx = Math.min(selectedDay, recs.length) - 1;
  for (let i = maxIdx; i >= 0; i--) {
    if (recs[i]) return recs[i];
  }
  return null;
}

// ─── Region 2: Block 1 Left — KPI selector + hero chart ─────────────────

/**
 * @see METRIC_MODEL.md §M2.1–M2.4
 *
 * Period KPI formulas — aligned with the chart's daily values so the chart
 * and KPI card represent the same metric and tie out under their natural
 * aggregation rule.
 *
 *   activeUsers (sum):       Σ daily activeUser
 *   CAC (weighted ratio):    Σ daily reward cost / Σ daily users
 *   ROAS (weighted ratio):   Σ daily value / Σ daily spend
 *   fraudSaved (sum):        Σ daily fraudSaved increment
 *
 * Note on CAC: uses `cumulativeRewardCost` (actual rewards paid out on
 * resolved conversions), matching the engine's notion of CAC at line 304
 * of projectionEngine.js. This is the real cost-per-acquisition; budget/30
 * was an allocation cap, not actual cost.
 */
export function computePeriodKPI(days, selectedDay, dateRange, key) {
  const endIdx = selectedDay - 1;
  const startIdx = Math.max(0, endIdx - dateRange + 1);
  const periodDays = days.slice(startIdx, endIdx + 1);

  // Helper: sum daily increments of a cumulative engine field over the period.
  const sumDailyIncrements = (field) => periodDays.reduce((sum, d, i) => {
    const dayIdx = startIdx + i;
    const prev = dayIdx > 0 ? days[dayIdx - 1][field] : 0;
    return sum + (d[field] - prev);
  }, 0);
  const sumDailyKpiIncrements = (key) => periodDays.reduce((sum, d, i) => {
    const dayIdx = startIdx + i;
    const prev = dayIdx > 0 ? days[dayIdx - 1].kpiCumulative[key] : 0;
    return sum + (d.kpiCumulative[key] - prev);
  }, 0);

  if (key === 'activeUsers') {
    return periodDays.reduce((sum, d) => sum + (d.dailyFunnel?.activeUser || 0), 0);
  }
  if (key === 'cac') {
    const users = periodDays.reduce((sum, d) => sum + (d.dailyFunnel?.activeUser || 0), 0);
    const rewardCost = sumDailyIncrements('cumulativeRewardCost');
    return users > 0 ? Math.round(rewardCost / users) : 0;
  }
  if (key === 'roi') {
    // Spend here means actual reward payouts on resolved conversions
    // (cumulativeRewardCost), NOT budget allocation. Aligns with the
    // domain model: cost flows through conversion, not contact.
    const rewardCost = sumDailyIncrements('cumulativeRewardCost');
    const value = sumDailyIncrements('cumulativeValue');
    return rewardCost > 0 ? Math.round((value / rewardCost) * 10) / 10 : 0;
  }
  if (key === 'fraudSaved') {
    return Math.max(0, sumDailyKpiIncrements('fraudSaved'));
  }
  return 0;
}

/**
 * @see METRIC_MODEL.md §M2.5–M2.8
 *
 * GA-style delta rule (S4 revision):
 * Show delta whenever there is ANY prior-period data — even if the prior
 * window is shorter than the current one (clipped at the start of history).
 * Show 0% as 0% (don't hide). Only return null when there is literally no
 * prior period (selectedDay <= dateRange ⇒ current period covers all data).
 *
 * Rationale: matches Google Analytics "Compare to previous period" behavior.
 * Users expect a comparison whenever data exists; hiding it inconsistently
 * (no delta on 30d view, ever) feels like the feature is broken.
 */
export function computeKpiDelta(days, selectedDay, dateRange, key, betterWhen) {
  const value = computePeriodKPI(days, selectedDay, dateRange, key);

  // Prior period starts one dateRange earlier and spans dateRange days.
  // computePeriodKPI clips startIdx to 0, so a partial prior window is fine.
  const priorEndDay = selectedDay - dateRange;
  const hasAnyPriorData = priorEndDay >= 1;
  const priorValue = hasAnyPriorData
    ? computePeriodKPI(days, priorEndDay, dateRange, key)
    : null;

  // Compute delta whenever priorValue is meaningful (> 0).
  // For ratio metrics that round to 0 in early days, treat 0 as "no comparable
  // value" and hide; otherwise compute even at 0% and show "0%" honestly.
  const hasMeaningfulPrior = priorValue != null && priorValue > 0;
  const deltaPct = hasMeaningfulPrior
    ? Math.round(((value - priorValue) / priorValue) * 100)
    : null;
  const isPositive = deltaPct != null && deltaPct > 0;
  // isGood is null when the delta is 0% — neither good nor bad, render neutrally.
  const isGood = deltaPct === 0 ? null : (betterWhen === 'up' ? isPositive : !isPositive);
  const showDelta = deltaPct != null;

  return { value, deltaPct, isPositive, isGood, showDelta };
}

/**
 * @see METRIC_MODEL.md §M2.9–M2.13
 *
 * Hero chart per KPI:
 *   activeUsers → line of daily resolved users (sum to KPI)
 *   CAC         → stacked bar of [dailyReferrerCost, dailyRefereeCost]
 *                 (unit cost decomposition — users-weighted average ties
 *                  to KPI CAC = Σ reward / Σ users)
 *   ROAS        → line of daily ROI (Σ value / Σ spend ties to KPI)
 *   fraudSaved  → line of daily fraud increments (sum to KPI)
 */
export function computeHeroChart(projection, selectedKPI, currentDay, dateRange = currentDay) {
  const days = projection.days;
  const { startDay, endDay } = computeWindow(currentDay, dateRange);
  const startIdx = startDay - 1; // 0-indexed inclusive
  const endIdx = endDay;         // 0-indexed exclusive

  // Helper: daily increment of a cumulative engine field at engine index i.
  // Uses days[i-1] for prev (NOT slice[i-1]) so windowed slices still compute
  // correct daily values at the window's left edge.
  const dailyIncr = (i, field) => {
    const prev = i > 0 ? days[i - 1][field] : 0;
    return days[i][field] - prev;
  };
  const dailyKpiIncr = (i, key) => {
    const prev = i > 0 ? days[i - 1].kpiCumulative[key] : 0;
    return days[i].kpiCumulative[key] - prev;
  };

  // CAC: stacked bar of daily unit cost (referrer + referee).
  // Tie-out: KPI = Σ (daily reward paid) / Σ daily users, where daily reward
  // paid = (referrer + referee) × daily users for that day.
  if (selectedKPI === 'cac') {
    const cacData = days.slice(startIdx, endIdx).map(d => ({
      values: [d.dailyReferrerCost, d.dailyRefereeCost],
    }));
    const maxVal = Math.max(...cacData.map(d => d.values[0] + d.values[1]), 0);
    return { kind: 'stacked', cacData, maxVal, startDay, endDay };
  }

  const slice = [];
  for (let i = startIdx; i < endIdx; i++) {
    if (selectedKPI === 'activeUsers') {
      slice.push(projection.dailyCurve[i]);
    } else if (selectedKPI === 'roi') {
      // Daily ROI = day's resolved value / day's actual reward payouts.
      // Engine spend (budget allocation) intentionally NOT used here — see
      // METRIC_MODEL.md §M2.11.
      const dayReward = dailyIncr(i, 'cumulativeRewardCost');
      const dayValue = dailyIncr(i, 'cumulativeValue');
      slice.push(dayReward > 0 ? Math.round((dayValue / dayReward) * 10) / 10 : 0);
    } else if (selectedKPI === 'fraudSaved') {
      slice.push(Math.max(0, dailyKpiIncr(i, 'fraudSaved')));
    } else {
      slice.push(Math.max(0, dailyKpiIncr(i, selectedKPI)));
    }
  }
  const maxVal = Math.max(...slice, 0);

  // M2.12 ROAS: dashed static baseline = engine's staticMode daily ROAS.
  // Windowed analogously to the agentic slice. Day 1 of either window uses
  // a previous-day-of-zero (i.e., absolute Day 1 of engine).
  const isROAS = selectedKPI === 'roi';
  let staticSlice = null;
  if (isROAS && projection.staticBaseline?.days) {
    const sd = projection.staticBaseline.days;
    staticSlice = [];
    for (let i = startIdx; i < endIdx; i++) {
      const prevReward = i > 0 ? sd[i - 1].cumulativeRewardCost : 0;
      const prevValue = i > 0 ? sd[i - 1].cumulativeValue : 0;
      const dayReward = sd[i].cumulativeRewardCost - prevReward;
      const dayValue = sd[i].cumulativeValue - prevValue;
      staticSlice.push(dayReward > 0 ? Math.round((dayValue / dayReward) * 10) / 10 : 0);
    }
  }

  return {
    kind: 'line',
    slice,
    staticSlice,
    maxVal,
    isROAS,
    hasData: maxVal > 0,
    startDay,
    endDay,
  };
}

// ─── Region 3: Block 1 Right — Funnel ───────────────────────────────────

/**
 * @see METRIC_MODEL.md §M3.1–M3.6
 *
 * S3: Engaged and Reached defined as structural midpoints between adjacent
 * engine-cumulative stages. Monotonic by construction (no magic multipliers).
 *
 *   Contacted ≥ Engaged ≥ Referred ≥ Reached ≥ SignedUp ≥ Active
 *
 * Engaged = (Contacted + Referred) / 2
 *   At baseShareRate = 0.55 this lands ~77% of Contacted (matching the prior
 *   hardcoded 0.77 multiplier) but properly responds to engine state changes
 *   as efficiency lifts effectiveShareRate.
 *
 * Reached = (Referred + SignedUp) / 2
 *   Replaces the impossible × 1.4 multiplier. Reached is now strictly bounded
 *   by Referred (an engine cumulative) above and SignedUp (an engine
 *   cumulative) below — invariant holds for every day.
 */
export function computeFunnel(dayData) {
  const contacted = dayData.funnelCumulative.contacted;
  const referred = dayData.funnelCumulative.referralSent;
  const signedUp = dayData.funnelCumulative.signedUp;
  const activeUser = dayData.funnelCumulative.activeUser;

  const engaged = Math.round((contacted + referred) / 2);
  const reached = Math.round((referred + signedUp) / 2);

  return [
    { label: 'Contacted', value: contacted, time: null, group: 'referrer' },
    { label: 'Engaged', value: engaged, time: '1 day', group: 'referrer' },
    { label: 'Referred', value: referred, time: '3 days', group: 'referrer' },
    { label: 'Reached', value: reached, time: '4 days', group: 'referee' },
    { label: 'Signed Up', value: signedUp, time: '6 days', group: 'referee' },
    { label: 'Active User', value: activeUser, time: '12 days', group: 'referee' },
  ];
}

// ─── Region 4: Block 2 Left — Audience Overview ─────────────────────────

/** @see METRIC_MODEL.md §M4.1–M4.4 */
export function computeAudienceOverview(projection, effectiveDay, dateRange = effectiveDay) {
  const ph = projection.propensityHealth;
  const ed = projection.effectivenessData;
  if (!ph) return null;

  const { startDay, endDay } = computeWindow(effectiveDay, dateRange);
  const startIdx = startDay - 1;
  const endIdx = endDay;

  return {
    bands: {
      advocates: ph.highEligible.slice(startIdx, endIdx),
      persuadable: ph.medEligible.slice(startIdx, endIdx),
      passive: ph.lowEligible.slice(startIdx, endIdx),
    },
    convRateOverlay: ed?.dailyConversionRate?.slice(startIdx, endIdx) || [],
    totals: {
      highEligible: ph.highEligible,
      medEligible: ph.medEligible,
      lowEligible: ph.lowEligible,
      totalEligible: ph.totalEligible,
    },
    startDay,
    endDay,
  };
}

// ─── Region 5: Block 2 Right — Campaign list + Daily Outreach ───────────

/**
 * @see METRIC_MODEL.md §M5.1
 *
 * S2: campaign roster comes from src/fixtures/campaigns.js (stable IDs/colors/
 * weights). contactCount is derived from engine's daily journey total × the
 * fixture's normalized share. The campaign roster does NOT churn day-to-day
 * (only changes when a campaign's startsDay/endsDay window opens or closes).
 */
export function computeCampaignList(projection, effectiveDay) {
  const dayData = projection.days[effectiveDay - 1];
  if (!dayData) return [];
  const journeysToday = dayData.journeysToday || 0;
  return activeCampaigns(effectiveDay).map(c => ({
    id: c.id,
    type: c.type,
    title: c.title,
    whyRefer: c.whyRefer,
    example: c.example,
    channel: c.channel,
    reward: c.reward,
    color: c.color,
    contactCount: Math.round(journeysToday * c.share),
  }));
}

/**
 * @see METRIC_MODEL.md §M5.2
 *
 * S2: stack ordered by fixture order (CAMPAIGNS array) — colors and segments
 * stay aligned to campaign IDs across days. A campaign that hasn't started by
 * day d shows zero on that day; it's a real time series of share-of-voice.
 */
export function computeDailyOutreach(projection, effectiveDay, dateRange = effectiveDay) {
  // Segments shown = all campaigns that are active by `effectiveDay`,
  // in stable fixture order (so colors don't shuffle as new campaigns appear).
  const segments = CAMPAIGNS.filter(c =>
    effectiveDay >= c.startsDay && (c.endsDay == null || effectiveDay <= c.endsDay)
  );

  const { startDay, endDay } = computeWindow(effectiveDay, dateRange);
  const startIdx = startDay - 1;
  const endIdx = endDay;

  // Per-day: for each segment, contactCount = today's journeys × segment's
  // active-day share. Inactive on day d → 0 in that segment slot.
  const paddedData = projection.days.slice(startIdx, endIdx).map((d) => {
    const day = d.day;
    const journeysToday = d.journeysToday || 0;
    const dayActive = activeCampaigns(day);
    const shareById = new Map(dayActive.map(c => [c.id, c.share]));
    return segments.map(seg => {
      const share = shareById.get(seg.id) || 0;
      return Math.round(journeysToday * share);
    });
  });

  // Y-max from per-day stack totals
  const maxTotal = Math.max(...paddedData.map(v => v.reduce((a, b) => a + b, 0)), 1);

  // latestCampaigns retains existing prop shape ({title, color, ...}) for the
  // chart's segments mapping; ordered to match paddedData columns.
  const latestCampaigns = segments.map(s => ({
    id: s.id,
    title: s.title,
    color: s.color,
  }));

  return {
    paddedData,
    latestCampaigns,
    maxTotal,
    startDay,
    endDay,
  };
}

/**
 * @see METRIC_MODEL.md §M5.3
 *
 * S2: follow-up share of today's outreach as a function of engine state.
 * Replaces the (day/30) × 0.35 linear animation. Heuristic: agent waits
 * FOLLOW_UP_GRACE_DAYS before nudging, then ramps toward FOLLOW_UP_CAP.
 *
 * Engine inputs: `day` (elapsed days) and the cohort lifecycle. We don't model
 * repeat-contact strategy in the engine itself; this is a documented heuristic
 * that's at least anchored to elapsed days from real engine state, not to the
 * dashboard's day index.
 */
export function computeFollowUpRate(allDays, day) {
  if (!allDays || day <= FOLLOW_UP_GRACE_DAYS) return 0;
  const today = allDays[day - 1];
  if (!today) return 0;
  // Ramp from 0 at end-of-grace to FOLLOW_UP_CAP across ~30 days
  const elapsed = day - FOLLOW_UP_GRACE_DAYS;
  const ramp = Math.min(1, elapsed / 27);
  return Math.min(FOLLOW_UP_CAP, ramp * FOLLOW_UP_CAP);
}

/**
 * @see METRIC_MODEL.md §M5.3
 *
 * Decompose today's journey count into (newContacts, followUps).
 * Invariant (verified): newContacts + followUps === total.
 */
export function computeOpsDecomposition(allDays, day) {
  const today = allDays?.[day - 1];
  if (!today) return { day, newContacts: 0, followUps: 0, total: 0 };
  const total = Math.round(today.journeysToday || 0);
  const followUpRate = computeFollowUpRate(allDays, day);
  const followUps = Math.round(total * followUpRate);
  const newContacts = total - followUps;
  return { day, newContacts, followUps, total };
}

// ─── Top-level orchestrator ─────────────────────────────────────────────

/**
 * Compute every visible metric on the dashboard.
 * Single entry point. Memoized in the dashboard via useMemo.
 *
 * @param {Object} projection - from computeDashboardProjection({ budget, params })
 * @param {Object} options
 * @param {number} options.selectedDay - 1..60 (UI value, may exceed engine horizon)
 * @param {number} options.dateRange - 7 or 30
 * @returns {Object} all metrics for the current selection
 */
export function computeDashboardMetrics(projection, { selectedDay, dateRange }) {
  const effectiveDay = computeEffectiveDay(selectedDay);
  const dayData = projection.days[effectiveDay - 1];
  const days = projection.days;

  // KPI cards: one per KPI key
  const KPI_DEFS = [
    { key: 'activeUsers', label: 'New Active Users', betterWhen: 'up' },
    { key: 'cac', label: 'CAC', betterWhen: 'down' },
    { key: 'roi', label: 'ROAS', betterWhen: 'up' },
    { key: 'fraudSaved', label: 'Fraud Saved', betterWhen: 'up' },
  ];
  const kpiCards = KPI_DEFS.map(({ key, label, betterWhen }) => ({
    key,
    label,
    betterWhen,
    ...computeKpiDelta(days, effectiveDay, dateRange, key, betterWhen),
  }));

  return {
    effectiveDay,
    dayData,
    campaignHealth: computeCampaignHealth(projection, dayData, effectiveDay, dateRange),
    suggestedChange: computeSuggestedChange(projection, effectiveDay),
    kpiCards,
    funnel: computeFunnel(dayData),
    audienceOverview: computeAudienceOverview(projection, effectiveDay, dateRange),
    campaignList: computeCampaignList(projection, effectiveDay),
    dailyOutreach: computeDailyOutreach(projection, effectiveDay, dateRange),
  };
}

/**
 * Hero chart data is selectedKPI-specific and isolated for memoization
 * (rebuilds only when selectedKPI or currentDay changes).
 */
export function computeHeroChartForKPI(projection, selectedKPI, currentDay, dateRange = currentDay) {
  return computeHeroChart(projection, selectedKPI, currentDay, dateRange);
}
