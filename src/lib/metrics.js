/**
 * metrics.js — single source of truth for every visible number on the dashboard.
 *
 * See docs/METRIC_MODEL.md for the canonical definition of each metric (meaning,
 * time-base, derivation, edge-case policy). This file IMPLEMENTS that doc.
 *
 * Pure functions. No React. No engine. Inputs go in, numbers come out.
 *
 * Stage 1 contract: this module reproduces current dashboard behavior EXACTLY,
 * including known bugs (funnel 0.77/1.4× multipliers, Day 60 clamp, fake static
 * baseline × 0.7, follow-up linear ramp, etc.). Subsequent stages replace
 * specific functions per the stage map in METRIC_MODEL.md.
 */

// ─── Constants (mirror DashboardPage.jsx for S1 parity) ─────────────────
export const ENGINE_MAX_DAYS = 30;

export const KPI_KEYS = ['activeUsers', 'cac', 'roi', 'fraudSaved'];

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

  // M1.3: Spent — period total based on date range
  const endIdx = selectedDay - 1;
  const startIdx = Math.max(0, endIdx - dateRange + 1);
  const startSpend = startIdx > 0 ? days[startIdx - 1].cumulativeSpend : 0;
  const periodSpend = Math.round(dayData.cumulativeSpend - startSpend);

  return {
    delivery: computeDeliveryState(projection, dayData, selectedDay),
    budget: projection.budget,
    periodSpend,
    monthlyPace,
  };
}

/** @see METRIC_MODEL.md §M1.5 — S1 preserves fabricated "$50/$75/3.2x" text */
export function computeSuggestedChange(projection, selectedDay) {
  const briefings = projection.dailyBriefings;
  if (!briefings) return null;

  for (let d = selectedDay; d >= 1; d--) {
    const rec = briefings[d]?.recommendation;
    if (rec) return rec;
  }
  return null;
}

// ─── Region 2: Block 1 Left — KPI selector + hero chart ─────────────────

/** @see METRIC_MODEL.md §M2.1–M2.4 — preserves current getPeriodKPI */
export function computePeriodKPI(days, selectedDay, dateRange, key) {
  const endIdx = selectedDay - 1;
  const startIdx = Math.max(0, endIdx - dateRange + 1);
  const periodDays = days.slice(startIdx, endIdx + 1);

  if (key === 'activeUsers') {
    return periodDays.reduce((sum, d) => sum + (d.dailyFunnel?.activeUser || 0), 0);
  }
  if (key === 'cac') {
    const users = periodDays.reduce((sum, d) => sum + (d.dailyFunnel?.activeUser || 0), 0);
    const spend = periodDays.reduce((sum, d, i) => {
      const dayIdx = startIdx + i;
      const prevSpend = dayIdx > 0 ? days[dayIdx - 1].cumulativeSpend : 0;
      return sum + (d.cumulativeSpend - prevSpend);
    }, 0);
    return users > 0 ? Math.round(spend / users) : 0;
  }
  if (key === 'roi') {
    const spend = periodDays.reduce((sum, d, i) => {
      const dayIdx = startIdx + i;
      const prevSpend = dayIdx > 0 ? days[dayIdx - 1].cumulativeSpend : 0;
      return sum + (d.cumulativeSpend - prevSpend);
    }, 0);
    const value = periodDays.reduce((sum, d, i) => {
      const dayIdx = startIdx + i;
      const prevVal = dayIdx > 0 ? days[dayIdx - 1].cumulativeValue : 0;
      return sum + (d.cumulativeValue - prevVal);
    }, 0);
    return spend > 0 ? Math.round((value / spend) * 10) / 10 : 0;
  }
  if (key === 'fraudSaved') {
    const spend = periodDays.reduce((sum, d, i) => {
      const dayIdx = startIdx + i;
      const prevSpend = dayIdx > 0 ? days[dayIdx - 1].cumulativeSpend : 0;
      return sum + (d.cumulativeSpend - prevSpend);
    }, 0);
    const lastDay = periodDays[periodDays.length - 1];
    const fraudRate = lastDay && lastDay.cumulativeSpend > 0
      ? lastDay.kpiCumulative.fraudSaved / lastDay.cumulativeSpend
      : 0;
    return Math.round(spend * fraudRate);
  }
  return 0;
}

/** @see METRIC_MODEL.md §M2.5–M2.8 */
export function computeKpiDelta(days, selectedDay, dateRange, key, betterWhen) {
  const value = computePeriodKPI(days, selectedDay, dateRange, key);
  const hasPriorPeriod = selectedDay > dateRange;
  const priorValue = hasPriorPeriod
    ? computePeriodKPI(days, selectedDay - dateRange, dateRange, key)
    : 0;
  const hasDelta = hasPriorPeriod && priorValue > 0 && value > 0;
  const deltaPct = hasDelta ? Math.round(((value - priorValue) / priorValue) * 100) : 0;
  const isPositive = deltaPct > 0;
  const isGood = betterWhen === 'up' ? isPositive : !isPositive;
  const showDelta = hasDelta && deltaPct !== 0;
  return { value, deltaPct, isPositive, isGood, showDelta };
}

/** @see METRIC_MODEL.md §M2.9–M2.13 */
export function computeHeroChart(projection, selectedKPI, currentDay) {
  const days = projection.days;

  // M2.10 CAC: stacked bar [referrer, referee] cost per day
  if (selectedKPI === 'cac') {
    const cacData = days.slice(0, currentDay).map(d => ({
      values: [d.dailyReferrerCost, d.dailyRefereeCost],
    }));
    const maxVal = Math.max(...cacData.map(d => d.values[0] + d.values[1]), 0);
    return { kind: 'stacked', cacData, maxVal };
  }

  // M2.9 / M2.11: line chart
  let slice;
  if (selectedKPI === 'activeUsers') {
    slice = projection.dailyCurve.slice(0, currentDay);
  } else {
    const dailyKPIs = projection.dailyKPIs;
    if (dailyKPIs && dailyKPIs[selectedKPI]) {
      slice = dailyKPIs[selectedKPI].slice(0, currentDay);
    } else {
      // Fallback: cumulative diff. Note: for ratio metrics (CAC, ROI) this is
      // mathematically dubious but preserved for S1 parity. See §M2.11.
      slice = days.slice(0, currentDay).map((d, i) => {
        if (i === 0) return d.kpiCumulative[selectedKPI];
        return Math.max(0, d.kpiCumulative[selectedKPI] - days[i - 1].kpiCumulative[selectedKPI]);
      });
    }
  }
  const maxVal = Math.max(...slice, 0);

  // M2.12 ROAS: dashed static baseline at 70% of agentic (PLACEHOLDER, S1 preserves)
  const isROAS = selectedKPI === 'roi';
  const staticSlice = isROAS
    ? slice.map(v => Math.round(v * 0.7 * 10) / 10)
    : null;

  return {
    kind: 'line',
    slice,
    staticSlice,
    maxVal,
    isROAS,
    hasData: maxVal > 0,
  };
}

// ─── Region 3: Block 1 Right — Funnel ───────────────────────────────────

/** @see METRIC_MODEL.md §M3.1–M3.6 — S1 preserves 0.77 and 1.4× hardcodes */
export function computeFunnel(dayData) {
  const contacted = dayData.funnelCumulative.contacted;
  const engaged = Math.round(contacted * 0.77);
  const referred = dayData.funnelCumulative.referralSent;
  const reached = Math.round(referred * 1.4);
  const signedUp = dayData.funnelCumulative.signedUp;
  const activeUser = dayData.funnelCumulative.activeUser;

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
export function computeAudienceOverview(projection, effectiveDay) {
  const ph = projection.propensityHealth;
  const ed = projection.effectivenessData;
  if (!ph) return null;

  return {
    bands: {
      advocates: ph.highEligible.slice(0, effectiveDay),
      persuadable: ph.medEligible.slice(0, effectiveDay),
      passive: ph.lowEligible.slice(0, effectiveDay),
    },
    convRateOverlay: ed?.dailyConversionRate?.slice(0, effectiveDay) || [],
    totals: {
      highEligible: ph.highEligible,
      medEligible: ph.medEligible,
      lowEligible: ph.lowEligible,
      totalEligible: ph.totalEligible,
    },
  };
}

// ─── Region 5: Block 2 Right — Campaign list + Daily Outreach ───────────

/** @see METRIC_MODEL.md §M5.1 */
export function computeCampaignList(projection, effectiveDay) {
  return projection.dailyBriefings?.[effectiveDay]?.dailyPlan?.campaigns || [];
}

/** @see METRIC_MODEL.md §M5.2 */
export function computeDailyOutreach(projection, effectiveDay) {
  const opsSlice = projection.operationsData.slice(0, effectiveDay);
  const briefings = projection.dailyBriefings;

  // Per-day: campaign contact counts
  const campaignData = opsSlice.map(d => {
    const dayCampaigns = briefings?.[d.day]?.dailyPlan?.campaigns || [];
    return dayCampaigns.map(c => c.contactCount);
  });

  // Pad to max campaign count (campaigns appear over time)
  const maxCampaigns = Math.max(...campaignData.map(d => d.length), 1);
  const paddedData = campaignData.map(d => {
    const padded = [...d];
    while (padded.length < maxCampaigns) padded.push(0);
    return padded;
  });

  // Latest day campaigns drive segment metadata (titles + colors)
  const latestCampaigns = briefings?.[effectiveDay]?.dailyPlan?.campaigns || [];

  // Y-max from totals
  const maxTotal = Math.max(...paddedData.map(v => v.reduce((a, b) => a + b, 0)), 1);

  return {
    paddedData,
    latestCampaigns,
    maxTotal,
  };
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
    audienceOverview: computeAudienceOverview(projection, effectiveDay),
    campaignList: computeCampaignList(projection, effectiveDay),
    dailyOutreach: computeDailyOutreach(projection, effectiveDay),
  };
}

/**
 * Hero chart data is selectedKPI-specific and isolated for memoization
 * (rebuilds only when selectedKPI or currentDay changes).
 */
export function computeHeroChartForKPI(projection, selectedKPI, currentDay) {
  return computeHeroChart(projection, selectedKPI, currentDay);
}
