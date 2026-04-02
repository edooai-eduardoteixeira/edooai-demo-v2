import React, { useState, useMemo } from 'react';
import Logo from '../components/Logo.jsx';
import Chart from '../components/Chart.jsx';
import FunnelChart from '../components/FunnelChart.jsx';
import StrategyCards, { DefaultBudgetSlider, BUDGET_CONFIG } from '../components/StrategyCards.jsx';
import { cn } from '../lib/utils.js';
import { computeDashboardProjection } from '../engine/projectionEngine.js';

// ─── Constants ────────────────────────────────────────────────────────
const DAY_STOPS = [1, 10, 30, 60];
const DAY_META = {
  1: { label: 'Day 1', subtitle: 'Cold Start' },
  10: { label: 'Day 10', subtitle: 'First Learnings' },
  30: { label: 'Day 30', subtitle: 'Hitting Stride' },
  60: { label: 'Day 60', subtitle: 'Mature Operation' },
};
const ENGINE_MAX_DAYS = 30; // Engine currently generates 30 days; clamp beyond this

// ─── Formatting helpers ──────────────────────────────────────────────
function fmt(n) { return Math.round(n).toLocaleString('en-US'); }
function fmtK(n) { return n >= 1000 ? `${Math.round(n / 1000)}K` : fmt(n); }
function fmtDollar(n) { return '$' + fmt(n); }
function fmtTime(h, m) {
  const period = h >= 12 ? 'pm' : 'am';
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour}:${String(m).padStart(2, '0')}${period}`;
}

// ─── Section Label ───────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <h3 className="text-[11px] font-semibold tracking-[0.05em] text-foreground-faint uppercase mb-3">
      {children}
    </h3>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// DAY SELECTOR
// ═══════════════════════════════════════════════════════════════════════
function DaySelector({ selected, onSelect }) {
  return (
    <div className="flex items-center gap-2">
      {DAY_STOPS.map((day, i) => {
        const active = selected === day;
        const meta = DAY_META[day];
        return (
          <React.Fragment key={day}>
            {i > 0 && (
              <div className="flex-1 h-px bg-border-light max-w-12" />
            )}
            <button
              onClick={() => onSelect(day)}
              className={cn(
                'flex flex-col items-center px-5 py-2.5 rounded-md transition-all duration-200 ease-out min-w-[100px]',
                active
                  ? 'bg-surface border border-border shadow-sm'
                  : 'hover:bg-accent-subtle'
              )}
            >
              <span className={cn(
                'text-sm font-semibold',
                active ? 'text-foreground' : 'text-foreground-muted'
              )}>
                {meta.label}
              </span>
              <span className={cn(
                'text-[11px] mt-0.5',
                active ? 'text-foreground-muted' : 'text-foreground-faint'
              )}>
                {meta.subtitle}
              </span>
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}

// Sequential warm palette — lightest (oldest cohort) to darkest (newest)
const COHORT_COLORS = [
  'var(--color-gray-300)',
  'var(--color-gray-400)',
  'var(--color-gray-500)',
  'var(--color-gray-600)',
  'var(--color-gray-700)',
  'var(--color-brand)',
];

// ═══════════════════════════════════════════════════════════════════════
// CAMPAIGN HEALTH ROW — compact status strip at top of Block 1
// ═══════════════════════════════════════════════════════════════════════

function getDeliveryState(dayData, selectedDay, projection) {
  const isLearning = selectedDay <= projection.thresholdDay;
  if (isLearning) return { label: 'Learning', color: 'warn' };

  // Limited by Budget: agent could acquire more but daily budget caps contact volume
  if (dayData.capHit) return { label: 'Limited by Budget', color: 'warn' };

  return { label: 'Acquiring Customers', color: 'success' };
}

function fmtBudgetRate(n) {
  if (n >= 1000) return '$' + Math.round(n / 1000) + 'K/mo';
  return '$' + fmt(n) + '/mo';
}

function CampaignHealthRow({ dayData, selectedDay, projection, onAdjustBudget }) {
  const budget = projection.budget;
  const delivery = getDeliveryState(dayData, selectedDay, projection);

  // Pacing: annualize current daily spend rate to monthly
  const dailySpendRate = selectedDay > 0 ? dayData.cumulativeSpend / selectedDay : 0;
  const monthlyPace = Math.round(dailySpendRate * 30);

  return (
    <div className="flex items-center bg-accent-subtle px-5 py-2 rounded-t-lg border-b border-border-light gap-4">
      {/* Delivery State */}
      <span className="flex items-center gap-1.5 shrink-0">
        <span className={cn('w-2 h-2 rounded-full', `bg-${delivery.color}`)} />
        <span className={cn(
          'text-[11px] font-semibold tracking-[0.05em]',
          `text-${delivery.color}`
        )}>
          {delivery.label}
        </span>
      </span>

      {/* Divider */}
      <div className="w-px h-5 bg-border-light shrink-0" />

      {/* Budget — rate as clickable to open budget drawer */}
      <button
        onClick={onAdjustBudget}
        className="flex items-center gap-1.5 hover:bg-accent-light rounded-sm px-1.5 py-0.5 -mx-1.5 transition-colors duration-150"
      >
        <span className="text-[11px] font-semibold tracking-[0.05em] text-foreground-faint uppercase shrink-0">Budget</span>
        <span className="text-[13px] text-foreground-muted whitespace-nowrap">
          {fmtBudgetRate(budget)}
        </span>
        {/* Pencil icon */}
        <svg className="w-3 h-3 text-foreground-faint shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
        </svg>
      </button>

      {/* Divider */}
      <div className="w-px h-5 bg-border-light shrink-0" />

      {/* Spent — cumulative spend within the window */}
      <span className="flex items-center gap-1.5 shrink-0">
        <span className="text-[11px] font-semibold tracking-[0.05em] text-foreground-faint uppercase">Spent</span>
        <span className="text-[13px] text-foreground-muted whitespace-nowrap">
          {fmtDollar(dayData.cumulativeSpend)}
        </span>
      </span>

      {/* Divider */}
      <div className="w-px h-5 bg-border-light shrink-0" />

      {/* Pacing — current spend rate annualized to monthly */}
      <span className="flex items-center gap-1.5 shrink-0">
        <span className="text-[11px] font-semibold tracking-[0.05em] text-foreground-faint uppercase">Pacing</span>
        <span className="text-[13px] text-foreground-muted whitespace-nowrap">
          ~{fmtBudgetRate(monthlyPace)}
        </span>
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// KPI SELECTOR — tabs that control the hero chart
// ═══════════════════════════════════════════════════════════════════════
const KPI_DEFS = [
  { key: 'activeUsers', label: 'Active Users', format: (v) => fmt(v), betterWhen: 'up' },
  { key: 'cac', label: 'CAC', format: (v) => v > 0 ? fmtDollar(v) : '—', betterWhen: 'down' },
  { key: 'roi', label: 'ROI', format: (v) => v > 0 ? `${v}x` : '—', betterWhen: 'up' },
  { key: 'fraudSaved', label: 'Fraud Saved', format: (v) => fmtDollar(v), betterWhen: 'up' },
];

// Compute KPI value for a period (sum daily values within window)
function getPeriodKPI(days, selectedDay, dateRange, key) {
  const endIdx = selectedDay - 1; // 0-based
  const startIdx = Math.max(0, endIdx - dateRange + 1);
  const periodDays = days.slice(startIdx, endIdx + 1);

  if (key === 'activeUsers') {
    // Sum daily new active users in the period
    return periodDays.reduce((sum, d) => sum + (d.dailyFunnel?.activeUser || 0), 0);
  }
  if (key === 'cac') {
    // Period spend / period users
    const users = periodDays.reduce((sum, d) => sum + (d.dailyFunnel?.activeUser || 0), 0);
    const spend = periodDays.reduce((sum, d, i) => {
      const dayIdx = startIdx + i;
      const prevSpend = dayIdx > 0 ? days[dayIdx - 1].cumulativeSpend : 0;
      return sum + (d.cumulativeSpend - prevSpend);
    }, 0);
    return users > 0 ? Math.round(spend / users) : 0;
  }
  if (key === 'roi') {
    // Period value / period spend
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
    // Sum daily fraud savings
    const spend = periodDays.reduce((sum, d, i) => {
      const dayIdx = startIdx + i;
      const prevSpend = dayIdx > 0 ? days[dayIdx - 1].cumulativeSpend : 0;
      return sum + (d.cumulativeSpend - prevSpend);
    }, 0);
    // fraudSaved is spend * fraudRate — use the cumulative ratio
    const lastDay = periodDays[periodDays.length - 1];
    const fraudRate = lastDay.cumulativeSpend > 0
      ? lastDay.kpiCumulative.fraudSaved / lastDay.cumulativeSpend : 0;
    return Math.round(spend * fraudRate);
  }
  return 0;
}

function KPISelector({ selected, onSelect, dayData, days, selectedDay, dateRange }) {
  return (
    <div className="flex gap-2">
      {KPI_DEFS.map((kpi) => {
        const active = selected === kpi.key;
        const value = getPeriodKPI(days, selectedDay, dateRange, kpi.key);

        // Delta: compare current period vs prior period
        const hasPriorPeriod = selectedDay > dateRange;
        const priorValue = hasPriorPeriod
          ? getPeriodKPI(days, selectedDay - dateRange, dateRange, kpi.key)
          : 0;
        const hasDelta = hasPriorPeriod && priorValue > 0 && value > 0;
        const deltaPct = hasDelta ? Math.round(((value - priorValue) / priorValue) * 100) : 0;
        const isPositive = deltaPct > 0;
        const isGood = kpi.betterWhen === 'up' ? isPositive : !isPositive;

        return (
          <button
            key={kpi.key}
            onClick={() => onSelect(kpi.key)}
            className={cn(
              'flex flex-col px-4 py-2.5 rounded-sm transition-all duration-200 min-w-0',
              active
                ? 'bg-accent-subtle'
                : 'hover:bg-accent-subtle/50'
            )}
          >
            <span className="text-[11px] font-semibold tracking-[0.05em] text-foreground-faint uppercase">
              {kpi.label}
            </span>
            <span className={cn(
              'text-[22px] font-bold tracking-tight leading-tight mt-1',
              active ? 'text-foreground' : 'text-foreground-muted'
            )}>
              {kpi.format(value)}
            </span>
            {hasDelta && deltaPct !== 0 && (
              <span className={cn(
                'text-[11px] font-semibold mt-0.5',
                isGood ? 'text-success' : 'text-warn'
              )}>
                {isPositive ? '↑' : '↓'}{Math.abs(deltaPct)}%
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// HERO CHART — renders the selected KPI's 30-day trend
// ═══════════════════════════════════════════════════════════════════════
function HeroChart({ selectedKPI, days, currentDay, projection }) {
  // Daily values — show rate, not cumulative
  let slice, yMax, formatLabel;

  if (selectedKPI === 'activeUsers') {
    // Daily new active users (resolved per day)
    slice = projection.dailyCurve.slice(0, currentDay);
    const maxVal = Math.max(...slice, 1);
    yMax = Math.ceil(maxVal / 20) * 20 || 100;
    formatLabel = (v) => fmt(v);
  } else {
    // Daily KPI values from the engine
    const dailyKPIs = projection.dailyKPIs;
    if (dailyKPIs && dailyKPIs[selectedKPI]) {
      slice = dailyKPIs[selectedKPI].slice(0, currentDay);
    } else {
      // Fallback: compute daily delta from cumulative
      slice = days.slice(0, currentDay).map((d, i) => {
        if (i === 0) return d.kpiCumulative[selectedKPI];
        return Math.max(0, d.kpiCumulative[selectedKPI] - days[i - 1].kpiCumulative[selectedKPI]);
      });
    }
    const maxVal = Math.max(...slice, 1);
    if (selectedKPI === 'cac') {
      yMax = Math.ceil(maxVal / 20) * 20 || 100;
      formatLabel = (v) => fmtDollar(v);
    } else if (selectedKPI === 'roi') {
      yMax = Math.ceil(maxVal * 2) / 2 || 2;
      formatLabel = (v) => `${v}x`;
    } else {
      yMax = Math.ceil(maxVal / 500) * 500 || 1000;
      formatLabel = (v) => fmtDollar(v);
    }
  }

  const yLabels = [0, yMax * 0.5, yMax];

  return (
    <Chart
      series={[
        { data: slice, color: 'var(--color-brand)', label: 'Daily' },
      ]}
      maxValue={yMax}
      cssHeight="100%"
      padding={{ left: 50 }}
      xLabels={[1, 10, 20, 30].filter(d => d <= currentDay).map(d => ({ value: String(d), at: d }))}
      yLabels={yLabels.map(v => {
        if (selectedKPI === 'roi') return Math.round(v * 10) / 10;
        return Math.round(v);
      })}
      gridlines="from-labels"
      fill={{ color: 'var(--color-brand)', opacity: 0.07 }}
      endpointLabel={(v) => formatLabel(v)}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════
// COHORT CHART — funnel performance over time
// ═══════════════════════════════════════════════════════════════════════
function CohortChart({ cohorts, currentDay }) {
  const repDays = [2, 5, 10, 15, 20, 25].filter(d => d <= currentDay && cohorts[d]);
  if (repDays.length === 0 && cohorts[1]) repDays.push(1);

  // Convert cumulative resolved to % of contacted for each cohort
  const cohortSeries = repDays.map((day, idx) => {
    const contacted = cohorts[day]?.contacted || 1;
    const resolved = (cohorts[day]?.cumulativeResolved || []).slice(0, 14);
    const pctData = resolved.map(v => (v / contacted) * 100);
    const isLatest = idx === repDays.length - 1;
    return {
      data: pctData,
      color: COHORT_COLORS[Math.min(idx, COHORT_COLORS.length - 1)],
      width: isLatest ? 2 : 1.5,
      label: `Day ${day} (${(cohorts[day]?.convRate || 0).toFixed(1)}%)`,
    };
  });

  // Find max % for Y-axis
  let maxPct = 1;
  for (const s of cohortSeries) {
    for (const v of s.data) {
      if (v > maxPct) maxPct = v;
    }
  }
  maxPct = Math.ceil(maxPct);

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <SectionLabel>Funnel Performance</SectionLabel>
      <div className="flex-1 min-h-0">
      <Chart
        series={cohortSeries}
        maxValue={maxPct}
        cssHeight="100%"
        padding={{ left: 40 }}
        xLabels={[
          { value: '+0d', at: 1 },
          { value: '+3d', at: 4 },
          { value: '+7d', at: 8 },
          { value: '+10d', at: 11 },
          { value: '+14d', at: 14 },
        ]}
        yLabels={[0, 0.25, 0.5, 0.75, 1].map(f => `${(maxPct * f).toFixed(1)}%`)}
        gridlines="from-labels"
        legend
        formatTooltip={(i, v) => `${v.toFixed(2)}% (${Math.round(v * (cohorts[repDays[0]]?.contacted || 1) / 100)} users)`}
      />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// POSITION 3: LIVE DECISIONS — Daily briefing with drill-down
// ═══════════════════════════════════════════════════════════════════════

function BriefingCategory({ label, icon, count, items, renderItem }) {
  const [expanded, setExpanded] = useState(false);
  if (count === 0) return null;

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'w-full flex items-center gap-2 py-2 px-2 rounded-sm text-left transition-colors duration-150',
          'hover:bg-accent-subtle',
          expanded && 'bg-accent-subtle'
        )}
      >
        <span className="text-xs text-foreground-faint shrink-0">{icon}</span>
        <span className="text-[13px] font-medium text-foreground">
          {count} {label}
        </span>
        <svg className={cn(
          'w-3.5 h-3.5 text-foreground-faint ml-auto transition-transform duration-200 shrink-0',
          expanded && 'rotate-180'
        )} fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {expanded && (
        <div className="pl-4 pr-2 pb-2 ml-2 border-l-2 border-border-light max-h-[180px] overflow-y-auto">
          {items.map(renderItem)}
        </div>
      )}
    </div>
  );
}

function DayBriefing({ briefing }) {
  const { dailyPlan, contacts, followUps, holdbacks, learnings, recommendation } = briefing;

  return (
    <div>
      {/* Daily Plan headline */}
      <div className="bg-accent-subtle rounded-sm px-3 py-2.5 mb-2">
        <div className="text-[13px] font-semibold text-foreground">
          {fmt(dailyPlan.contactCount)} contacts · {fmtK(dailyPlan.eligibleCount)} eligible · {fmtDollar(dailyPlan.budgetToday)}
        </div>
        <p className="text-xs text-foreground-muted mt-1 leading-relaxed">
          {dailyPlan.strategyShift}
        </p>
      </div>

      {/* Collapsible categories */}
      <div className="space-y-0">
        <BriefingCategory
          label="new contacts"
          icon="→"
          count={contacts.length}
          items={contacts}
          renderItem={(c) => (
            <div key={c.id} className="py-1.5 border-b border-border-light last:border-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-foreground">{c.name}</span>
                <span className="text-[11px] text-foreground-faint">{c.channel} · {c.tierLabel} · {c.messageApproach}</span>
                <span className="text-[11px] text-foreground-faint ml-auto">{fmtTime(c.hour, c.minute)}</span>
              </div>
              <p className="text-[11px] text-foreground-faint leading-relaxed mt-0.5">{c.reasoning}</p>
            </div>
          )}
        />

        {followUps.length > 0 && (
          <BriefingCategory
            label="follow-ups sent"
            icon="↻"
            count={followUps.length}
            items={followUps}
            renderItem={(f) => (
              <div key={f.id} className="py-1.5 border-b border-border-light last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-foreground">{f.name}</span>
                  <span className="text-[11px] text-foreground-faint">{f.funnelStageLabel}</span>
                </div>
                <p className="text-[11px] text-foreground-faint leading-relaxed mt-0.5">{f.reasoning}</p>
              </div>
            )}
          />
        )}

        <BriefingCategory
          label="customers held back"
          icon="⏸"
          count={holdbacks.length}
          items={holdbacks}
          renderItem={(h) => (
            <div key={h.id} className="py-1.5 border-b border-border-light last:border-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-foreground">{h.name}</span>
                <span className="text-[11px] text-foreground-faint">{h.reason}</span>
              </div>
              <p className="text-[11px] text-foreground-faint leading-relaxed mt-0.5">{h.reasoning}</p>
              <span className="text-[10px] text-foreground-faint">Re-enters: {h.reenter}</span>
            </div>
          )}
        />

        {/* Yesterday's learnings — what user actions told the agent */}
        {learnings.length > 0 && (
          <BriefingCategory
            label="learnings from yesterday"
            icon="💡"
            count={learnings.length}
            items={learnings}
            renderItem={(l) => (
              <div key={l.id} className="py-1.5 border-b border-border-light last:border-0">
                <p className="text-[11px] text-foreground-muted leading-relaxed">{l.summary}</p>
              </div>
            )}
          />
        )}
      </div>
    </div>
  );
}

// Guardrail Recommendation — separate from the feed, underneath it
function GuardrailRecommendation({ briefings, selectedDay }) {
  // Find the most recent recommendation up to the selected day
  for (let d = selectedDay; d >= 1; d--) {
    const rec = briefings?.[d]?.recommendation;
    if (rec) {
      return (
        <div className="border border-brand/20 rounded-lg px-4 py-3 bg-brand-light/30 mb-6">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-brand shrink-0" />
            <span className="text-[11px] font-semibold tracking-[0.05em] text-foreground-faint uppercase">
              Agent Recommendation · Day {d}
            </span>
          </div>
          <div className="text-sm font-semibold text-foreground mb-1">{rec.title}</div>
          <p className="text-[13px] text-foreground-muted leading-relaxed">{rec.observation}</p>
          <p className="text-[13px] text-foreground-muted leading-relaxed mt-1">{rec.action}</p>
          <div className="flex gap-2 mt-3">
            <button className="px-3 py-1.5 text-xs font-semibold rounded-sm bg-brand text-white hover:-translate-y-px hover:shadow-md transition-all duration-200">
              Approve
            </button>
            <button className="px-3 py-1.5 text-xs font-semibold rounded-sm bg-surface text-foreground-muted border border-border hover:bg-accent-subtle transition-all duration-200">
              Dismiss
            </button>
          </div>
        </div>
      );
    }
  }
  return null;
}

function DecisionFeed({ briefings, selectedDay }) {
  if (!briefings) return null;

  // Show all days up to selectedDay, most recent first
  const days = [];
  for (let d = selectedDay; d >= 1; d--) {
    if (briefings[d]) days.push(briefings[d]);
  }

  return (
    <div className="bg-surface border border-border rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <SectionLabel>Live Decisions</SectionLabel>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-brand" />
          <span className="text-[11px] text-foreground-faint">{days.length} days</span>
        </span>
      </div>

      <div className="max-h-[400px] overflow-y-auto space-y-4">
        {days.map((briefing) => (
          <div key={briefing.day}>
            {/* Date header */}
            <div className="flex items-center gap-2 mb-2">
              <div className="h-px flex-1 bg-border-light" />
              <span className="text-[11px] font-semibold text-foreground-faint shrink-0">Day {briefing.day}</span>
              <div className="h-px flex-1 bg-border-light" />
            </div>
            <DayBriefing briefing={briefing} />
          </div>
        ))}
      </div>
    </div>
  );
}


function ComparisonChart({ agenticCurve, staticCurve, annotations, currentDay }) {
  const agSlice = agenticCurve.slice(0, currentDay);
  const stSlice = staticCurve.slice(0, currentDay);
  const yMax = Math.ceil(Math.max(...agSlice, ...stSlice, 1) / 200) * 200;
  const activeAnnotations = (annotations || []).filter(a => a.day <= currentDay);

  return (
    <div className="bg-surface border border-border rounded-lg p-6 mb-6">
      <SectionLabel>Agentic vs Static Execution</SectionLabel>

      <Chart
        series={[
          { data: agSlice, color: 'var(--color-brand)', label: 'Vincor Agent' },
          { data: stSlice, color: 'var(--color-gray-300)', dashed: true, width: 1.5, label: 'Static Rules' },
        ]}
        legend
        maxValue={yMax}
        padding={{ left: 50, right: 20 }}
        xLabels={[1, 5, 10, 15, 20, 25, 30].filter(d => d <= currentDay).map(d => ({ value: String(d), at: d }))}
        yLabels={[0, 0.25, 0.5, 0.75, 1].map(f => Math.round(yMax * f))}
        gridlines="from-labels"
        fill={{ color: 'var(--color-brand)', opacity: 0.06 }}
        annotations={activeAnnotations.map(a => ({ at: a.day - 1 }))}
        marker={{ at: currentDay - 1 }}
        endpointLabel={(v) => fmt(v)}
        formatTooltip={(i, v) => fmt(v)}
      />

      {activeAnnotations.length > 0 && (
        <div className="mt-4 pt-3 border-t border-border-light space-y-2">
          {activeAnnotations.map((a, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="w-2 h-2 rounded-full bg-brand mt-1.5 shrink-0" />
              <div>
                <span className="text-xs font-semibold text-foreground-muted">
                  Day {a.day} — {a.title}
                </span>
                <p className="text-xs text-foreground-faint mt-0.5">
                  {a.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════
// DASHBOARD BUDGET SLIDER — forked from DefaultBudgetSlider for
// independent iteration. Changes here do NOT affect the strategy page.
// ═══════════════════════════════════════════════════════════════════════
const DashboardBudgetSlider = DefaultBudgetSlider;

// ═══════════════════════════════════════════════════════════════════════
// DATE RANGE SELECTOR — controls viewing window (7d / 30d)
// ═══════════════════════════════════════════════════════════════════════
const DATE_RANGES = [
  { value: 7, label: '7d' },
  { value: 30, label: '30d' },
];

function DateRangeSelector({ selected, onSelect }) {
  return (
    <div className="flex items-center gap-1 bg-surface border border-border rounded-md p-0.5">
      {DATE_RANGES.map((range) => {
        const active = selected === range.value;
        return (
          <button
            key={range.value}
            onClick={() => onSelect(range.value)}
            className={cn(
              'px-2.5 py-1 rounded text-[12px] font-semibold transition-all duration-150',
              active
                ? 'bg-accent-subtle text-foreground'
                : 'text-foreground-muted hover:text-foreground'
            )}
          >
            {range.label}
          </button>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD PAGE
// ═══════════════════════════════════════════════════════════════════════
export default function DashboardPage({ config, onHome }) {
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedKPI, setSelectedKPI] = useState('activeUsers');
  const [dateRange, setDateRange] = useState(30);
  const [activeDrawer, setActiveDrawer] = useState(null);
  const [budget, setBudget] = useState(config.recommendedBudget?.amount || 150000);

  // Run v4 engine with current budget
  const projection = useMemo(() => {
    return computeDashboardProjection({ budget, params: config.engineParams });
  }, [config, budget]);

  // Current day data — clamp to engine range
  const effectiveDay = Math.min(selectedDay, ENGINE_MAX_DAYS);
  const dayData = projection.days[effectiveDay - 1];

  // All daily briefings (for scrollable history)
  const briefings = projection.dailyBriefings;

  return (
    <div className="min-h-screen flex flex-col w-full px-6 animate-page-enter">
      {/* Header: Logo + Day Selector — compact, left-aligned together */}
      <header className="flex items-center gap-8 py-2 mb-2">
        <Logo variant="mark" onClick={onHome} />
        <DaySelector
          selected={selectedDay}
          onSelect={setSelectedDay}
        />
        <div className="ml-auto">
          <DateRangeSelector selected={dateRange} onSelect={setDateRange} />
        </div>
      </header>

      <main className="flex-1 pb-8">
        {/* ── POSITION 1: RESULTS — command center ── */}
        <div className="bg-surface border border-border rounded-lg mb-5 h-[420px] flex flex-col">
          {/* Campaign Health Row — compact status strip */}
          <CampaignHealthRow
            dayData={dayData}
            selectedDay={effectiveDay}
            projection={projection}
            onAdjustBudget={() => setActiveDrawer('budget')}
          />

          {/* Main content area */}
          <div className="flex gap-5 flex-1 min-h-0 p-5 pt-3">
            {/* LEFT COLUMN (75%): KPI selector + hero chart */}
            <div className="flex-[3] min-w-0 flex flex-col">
              <KPISelector
                selected={selectedKPI}
                onSelect={setSelectedKPI}
                dayData={dayData}
                days={projection.days}
                selectedDay={effectiveDay}
                dateRange={dateRange}
              />
              {/* Hero chart fills remaining height */}
              <div className="mt-4 flex-1 min-h-0">
                <HeroChart
                  selectedKPI={selectedKPI}
                  days={projection.days}
                  currentDay={effectiveDay}
                  projection={projection}
                />
              </div>
            </div>

            {/* DIVIDER */}
            <div className="w-px bg-border-light shrink-0" />

            {/* RIGHT COLUMN (25%): Referral Funnel */}
            <div className="flex-1 min-w-0 flex flex-col">
              <SectionLabel>Referral Funnel</SectionLabel>
              <div className="mt-1 flex-1 min-h-0 overflow-hidden">
                <FunnelChart
                  stages={[
                    { label: 'Eligible', value: projection.audienceSize },
                    { label: 'Contacted', value: dayData.funnelCumulative.contacted },
                    { label: 'Referral Sent', value: dayData.funnelCumulative.referralSent },
                    { label: 'Signed Up', value: dayData.funnelCumulative.signedUp },
                    { label: 'Active User', value: dayData.funnelCumulative.activeUser },
                  ]}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── POSITION 2 + 3: PROOF ENGINE | DECISIONS ── */}
        <div className="grid grid-cols-[1.5fr_1fr] gap-6">
          {/* Position 2: Proof — why agentic beats static */}
          <div className="space-y-6">
            <ComparisonChart
              agenticCurve={projection.cumulativeCurve}
              staticCurve={projection.staticCumulativeCurve}
              annotations={projection.learningAnnotations}
              currentDay={effectiveDay}
            />

            {/* Cohort chart — moved from Block 1 to serve as evidence */}
            <div className="bg-surface border border-border rounded-lg p-4">
              <CohortChart
                cohorts={projection.cohorts}
                currentDay={effectiveDay}
              />
            </div>
          </div>

          {/* Position 3: Decisions + Recommendation below */}
          <div>
            <DecisionFeed briefings={briefings} selectedDay={effectiveDay} />
            <GuardrailRecommendation briefings={briefings} selectedDay={effectiveDay} />
          </div>
        </div>
      </main>

      {/* Budget & Guardrails Drawer */}
      <StrategyCards
        activeDrawer={activeDrawer}
        onClose={() => setActiveDrawer(null)}
        onNavigate={setActiveDrawer}
        budget={budget}
        onBudgetChange={setBudget}
        BudgetSliderComponent={DashboardBudgetSlider}
      />
    </div>
  );
}
