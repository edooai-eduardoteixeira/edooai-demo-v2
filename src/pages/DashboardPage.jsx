import React, { useState, useMemo, useRef, useLayoutEffect } from 'react';
import { ArrowRight, RotateCcw, Pause, Lightbulb } from 'lucide-react';
import Logo from '../components/Logo.jsx';
import Chart from '../components/Chart.jsx';
import StackedBarChart from '../components/StackedBarChart.jsx';
import StackedAreaChart from '../components/StackedAreaChart.jsx';
import FunnelChart from '../components/FunnelChart.jsx';
import StrategyCards, { DefaultBudgetSlider, BUDGET_CONFIG } from '../components/StrategyCards.jsx';
import { cn } from '../lib/utils.js';
import { niceYMax, dayXTicks, CHART_MARGIN, formatCompact } from '../components/chartUtils.js';
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
    <div className="flex items-center gap-0.5 bg-surface border border-border rounded-sm p-0.5">
      {DAY_STOPS.map((day) => {
        const active = selected === day;
        const meta = DAY_META[day];
        return (
          <button
            key={day}
            onClick={() => onSelect(day)}
            title={meta.subtitle}
            className={cn(
              'px-4 py-2 rounded-sm text-[13px] font-semibold transition-colors duration-200 ease-out',
              active
                ? 'bg-accent-subtle text-foreground'
                : 'text-foreground-muted hover:text-foreground'
            )}
          >
            {meta.label}
          </button>
        );
      })}
    </div>
  );
}

// Chart fills — rooted in bg-accent-subtle (same as funnel bars)
// Stacked area: range from gray-300 down to accent-subtle (adjacent bands need differentiation)
// Single bars: exact same as funnel
const CHART_FILLS = {
  high: '#D1C8BE',   // gray-300 — darkest band (bottom)
  medium: '#E4DDD5', // gray-200 — middle band
  low: '#F5F1EB',    // accent-subtle — lightest band, matches funnel exactly
  bar: 'var(--accent-subtle)',  // CSS variable — same rendering path as funnel
};

// ═══════════════════════════════════════════════════════════════════════
// CAMPAIGN HEALTH ROW — compact status strip at top of Block 1
// ═══════════════════════════════════════════════════════════════════════

function getDeliveryState(dayData, selectedDay, projection) {
  const isLearning = selectedDay <= projection.thresholdDay;
  if (isLearning) return { label: 'Learning', active: false };

  // Limited by Budget: agent could acquire more but daily budget caps contact volume
  if (dayData.capHit) return { label: 'Limited by Budget', active: false };

  return { label: 'Acquiring Customers', active: true };
}

function fmtRate(n) {
  return fmtDollar(n) + '/mo';
}

function CampaignHealthRow({ dayData, selectedDay, projection, onAdjustBudget, dateRange, days }) {
  const budget = projection.budget;
  const delivery = getDeliveryState(dayData, selectedDay, projection);

  // Pacing: annualize current daily spend rate to monthly
  const dailySpendRate = selectedDay > 0 ? dayData.cumulativeSpend / selectedDay : 0;
  const monthlyPace = Math.round(dailySpendRate * 30);

  // Spent: period total based on date range
  const endIdx = selectedDay - 1;
  const startIdx = Math.max(0, endIdx - dateRange + 1);
  const startSpend = startIdx > 0 ? days[startIdx - 1].cumulativeSpend : 0;
  const periodSpend = Math.round(dayData.cumulativeSpend - startSpend);

  return (
    <div className="flex items-center bg-accent-subtle px-5 py-2.5 rounded-t-lg border-b border-border-light">
      {/* Delivery State — fixed width to prevent layout shift */}
      <span className="flex items-center gap-2.5 shrink-0 min-w-[190px]">
        <span className="relative flex items-center justify-center">
          <span className={cn('w-2 h-2 rounded-full', delivery.active ? 'bg-brand' : 'bg-warn')} />
          {delivery.active && (
            <span className="absolute w-2 h-2 rounded-full border-[1.5px] border-brand animate-[agent-glow_2s_ease-out_infinite]" />
          )}
        </span>
        <span className="text-[11px] font-semibold tracking-[0.05em] text-foreground uppercase">
          {delivery.label}
        </span>
      </span>

      {/* Divider */}
      <div className="w-px h-5 bg-border-light shrink-0 mx-4" />

      {/* Budget — small button per DESIGN.md: user controls pop (bg-surface, border) */}
      <div className="flex items-center gap-2 shrink-0 min-w-[200px]">
        <span className="text-[11px] font-semibold tracking-[0.05em] text-foreground-faint uppercase shrink-0">Budget</span>
        <button
          onClick={onAdjustBudget}
          className="inline-flex items-center justify-center py-1 px-2.5 text-[13px] font-semibold rounded-sm bg-surface text-foreground-muted border border-border hover:bg-accent-subtle hover:text-foreground transition-colors duration-200"
        >
          {fmtRate(budget)}
        </button>
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-border-light shrink-0 mx-4" />

      {/* Spent — period total, no /mo so narrower slot */}
      <span className="flex items-center gap-2 shrink-0 min-w-[155px]">
        <span className="text-[11px] font-semibold tracking-[0.05em] text-foreground-faint uppercase shrink-0">Spent</span>
        <span className="text-[13px] text-foreground-muted whitespace-nowrap">
          {fmtDollar(periodSpend)}
        </span>
      </span>

      {/* Divider */}
      <div className="w-px h-5 bg-border-light shrink-0 mx-4" />

      {/* Pacing — spend rate annualized to monthly */}
      <span className="flex items-center gap-2 shrink-0 min-w-[195px]">
        <span className="text-[11px] font-semibold tracking-[0.05em] text-foreground-faint uppercase shrink-0">Pacing</span>
        <span className="text-[13px] text-foreground-muted whitespace-nowrap">
          ~{fmtRate(monthlyPace)}
        </span>
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// KPI SELECTOR — tabs that control the hero chart
// ═══════════════════════════════════════════════════════════════════════
const KPI_DEFS = [
  { key: 'activeUsers', label: 'New Active Users', format: (v) => fmt(v), betterWhen: 'up' },
  { key: 'cac', label: 'CAC', format: (v) => v > 0 ? fmtDollar(v) : '—', betterWhen: 'down' },
  { key: 'roi', label: 'ROAS', format: (v) => v > 0 ? `${v.toFixed(1)}x` : '—', betterWhen: 'up' },
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
    <div className="flex">
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
        const showDelta = hasDelta && deltaPct !== 0;

        return (
          <button
            key={kpi.key}
            onClick={() => onSelect(kpi.key)}
            className={cn(
              'flex-1 flex flex-col items-start px-4 py-2.5 rounded-sm transition-all duration-200',
              active
                ? 'bg-accent-subtle'
                : 'hover:bg-accent-subtle/50'
            )}
          >
            <span className="text-[11px] font-semibold tracking-[0.05em] text-foreground-faint uppercase">
              {kpi.label}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={cn(
                'text-[22px] font-bold tracking-tight leading-tight',
                active ? 'text-foreground' : 'text-foreground-muted'
              )}>
                {kpi.format(value)}
              </span>
              {/* Inline delta — invisible placeholder keeps width stable */}
              <span className={cn(
                'text-[11px] font-semibold',
                showDelta
                  ? (isGood ? 'text-success' : 'text-warn')
                  : 'invisible'
              )}>
                {showDelta ? `${isPositive ? '↑' : '↓'}${Math.abs(deltaPct)}%` : '—'}
              </span>
            </div>
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
  const xLabels = dayXTicks(currentDay).map(d => ({ value: String(d), at: d }));

  // CAC: stacked bar chart showing referrer/referee cost breakdown
  if (selectedKPI === 'cac') {
    const cacData = days.slice(0, currentDay).map(d => ({
      values: [d.dailyReferrerCost, d.dailyRefereeCost],
    }));
    const maxVal = Math.max(...cacData.map(d => d.values[0] + d.values[1]));
    const yMax = niceYMax(maxVal);

    return (
      <StackedBarChart
        key={`cac-${currentDay}`}
        data={cacData}
        segments={[
          { color: 'rgba(102, 0, 31, 0.45)', label: 'Referrer' },
          { color: 'var(--color-brand)', label: 'Referee' },
        ]}
        maxValue={yMax}
        cssHeight="100%"

        xLabels={xLabels}
        yLabels={maxVal > 0 ? [yMax * 0.5, yMax] : []}
        gridlines="from-labels"
        legend
      />
    );
  }

  // All other KPIs: daily values line chart
  let slice, yMax, formatLabel;

  if (selectedKPI === 'activeUsers') {
    slice = projection.dailyCurve.slice(0, currentDay);
    const maxVal = Math.max(...slice, 0);
    yMax = niceYMax(maxVal);
    formatLabel = (v) => fmt(v);
  } else {
    const dailyKPIs = projection.dailyKPIs;
    if (dailyKPIs && dailyKPIs[selectedKPI]) {
      slice = dailyKPIs[selectedKPI].slice(0, currentDay);
    } else {
      slice = days.slice(0, currentDay).map((d, i) => {
        if (i === 0) return d.kpiCumulative[selectedKPI];
        return Math.max(0, d.kpiCumulative[selectedKPI] - days[i - 1].kpiCumulative[selectedKPI]);
      });
    }
    const maxVal = Math.max(...slice, 0);
    if (selectedKPI === 'roi') {
      yMax = niceYMax(maxVal);
      formatLabel = (v) => `${v}x`;
    } else {
      yMax = niceYMax(maxVal);
      formatLabel = (v) => fmtDollar(v);
    }
  }

  // Static baseline for ROAS — placeholder at 70% of agentic values
  const isROAS = selectedKPI === 'roi';
  const staticSlice = isROAS
    ? slice.map(v => Math.round(v * 0.7 * 10) / 10)
    : null;

  const hasData = Math.max(...(slice || []), 0) > 0;
  const yLabels = hasData ? [yMax * 0.5, yMax] : [];

  return (
    <Chart
      key={`${selectedKPI}-${currentDay}`}
      series={isROAS ? [
        { data: slice, color: 'var(--color-brand)', label: 'Vincor Agent' },
        { data: staticSlice, color: 'var(--color-gray-300)', dashed: true, width: 1.5, label: 'Static Rules' },
      ] : [
        { data: slice, color: 'var(--color-brand)', label: 'Daily' },
      ]}
      legend={isROAS}
      maxValue={yMax}
      cssHeight="100%"
      xLabels={xLabels}
      yLabels={yLabels}
      gridlines="from-labels"
      fill={{ color: 'var(--color-brand)', opacity: 0.07 }}
      endpointLabel={(v) => formatLabel(v)}
      formatYLabel={isROAS ? (v) => `${v}x` : undefined}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════
// COHORT CHART — funnel performance over time
// ═══════════════════════════════════════════════════════════════════════

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
        <span className="text-foreground-faint shrink-0">{icon}</span>
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
          icon={<ArrowRight size={12} />}
          count={contacts.length}
          items={contacts}
          renderItem={(c) => (
            <div key={c.id} className="py-1.5 border-b border-border-light last:border-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-foreground">{c.name}</span>
                <span className="text-[11px] text-foreground-faint">{c.channel} · {c.offerName || c.tierLabel} · {c.messageApproach}</span>
                <span className="text-[11px] text-foreground-faint ml-auto">{fmtTime(c.hour, c.minute)}</span>
              </div>
              <p className="text-[11px] text-foreground-faint leading-relaxed mt-0.5">{c.reasoning}</p>
            </div>
          )}
        />

        {followUps.length > 0 && (
          <BriefingCategory
            label="follow-ups sent"
            icon={<RotateCcw size={12} />}
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
          icon={<Pause size={12} />}
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
            icon={<Lightbulb size={12} />}
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


function KeyLearnings({ annotations, selectedDay }) {
  const visible = (annotations || []).filter(a => a.day <= selectedDay);

  return (
    <div>
      <SectionLabel>Key Learnings</SectionLabel>
      {visible.length === 0 ? (
        <p className="text-xs text-foreground-faint">Agent is calibrating...</p>
      ) : (
        <div className="space-y-3">
          {visible.map((a, i) => (
            <div
              key={i}
              className="flex items-start gap-2 animate-fade-in"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <span className="w-2 h-2 rounded-full bg-brand mt-1.5 shrink-0" />
              <div>
                <span className="text-xs font-semibold text-foreground-muted">
                  Day {a.day} — {a.title}
                </span>
                <p className="text-xs text-foreground-faint mt-0.5 leading-relaxed">
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
    <div className="flex items-center gap-0.5 bg-surface border border-border rounded-sm p-0.5">
      {DATE_RANGES.map((range) => {
        const active = selected === range.value;
        return (
          <button
            key={range.value}
            onClick={() => onSelect(range.value)}
            className={cn(
              'px-4 py-2 rounded-sm text-[13px] font-semibold transition-colors duration-200 ease-out',
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
// BLOCK 2 LEFT: AUDIENCE HEALTH — propensity distribution + reach depth
// ═══════════════════════════════════════════════════════════════════════
function AudienceHealth({ propensityHealth, effectiveDay }) {
  if (!propensityHealth) return null;

  const { highEligible, medEligible, lowEligible,
          totalEligible, totalReached } = propensityHealth;
  const dataSlice = effectiveDay;

  // Stacked area: eligible pool per cluster over time
  const bands = [
    { label: 'Advocates', color: CHART_FILLS.high, data: highEligible.slice(0, dataSlice) },
    { label: 'Persuadable', color: CHART_FILLS.medium, data: medEligible.slice(0, dataSlice) },
    { label: 'Passive', color: CHART_FILLS.low, data: lowEligible.slice(0, dataSlice) },
  ];

  const currentPool = (highEligible[dataSlice - 1] || 0) + (medEligible[dataSlice - 1] || 0) + (lowEligible[dataSlice - 1] || 0);
  const utilizationPct = totalEligible > 0 ? Math.round((1 - currentPool / totalEligible) * 100) : 0;
  const xLabels = dayXTicks(effectiveDay).map(d => ({ value: String(d), at: d }));

  return (
    <div className="flex-[9] p-5 min-w-0 flex flex-col">
      <SectionLabel>Audience Health</SectionLabel>
      <div className="flex-1 min-h-0">
        <StackedAreaChart
          bands={bands}
          cssHeight="100%"
          xLabels={xLabels}
          legend
          formatTooltip={(i, v) => formatCompact(v)}
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// BLOCK 2 CENTER: ENGAGEMENT EFFECTIVENESS — combined decay + trend
// ═══════════════════════════════════════════════════════════════════════
function EngagementEffectiveness({ effectivenessData, effectiveDay }) {
  if (!effectivenessData) return null;

  const { frequencyCurve } = effectivenessData;
  const hasData = effectiveDay >= 5;

  if (!hasData) {
    return (
      <div className="flex-[4] p-5 min-w-0 flex flex-col">
        <SectionLabel>Response by Frequency</SectionLabel>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-foreground-faint text-center px-4">
            Frequency data available after first campaign cycle
          </p>
        </div>
      </div>
    );
  }

  // Convert rates to percentage space so Y-axis labels render correctly
  const barData = frequencyCurve.map(({ rate }) => ({
    values: [Math.round(rate * 100)],
  }));
  const maxPct = Math.max(...barData.map(d => d.values[0]));
  const yMax = niceYMax(maxPct);
  const xLabels = frequencyCurve.map((d, i) => ({ value: d.label, at: i + 1 }));

  return (
    <div className="flex-[4] p-5 min-w-0 flex flex-col">
      <SectionLabel>Response by Frequency</SectionLabel>
      <div className="flex-1 min-h-0">
        <StackedBarChart
          data={barData}
          segments={[
            { color: CHART_FILLS.bar },
          ]}
          maxValue={yMax}
          cssHeight="100%"
          xLabels={xLabels}
          categorical
          hoverHighlight
          showBarValues
          formatBarValue={(v) => `${v}%`}
          formatTooltip={(i, v) => `${v}%`}
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// BLOCK 2 RIGHT: TODAY'S OPERATIONS — summary + narrative + dist + feed
// ═══════════════════════════════════════════════════════════════════════
function RewardDistribution({ contacts }) {
  if (!contacts || contacts.length === 0) return null;

  // Compute offer distribution
  const offerCounts = {};
  const messageCounts = {};
  for (const c of contacts) {
    const offer = c.offerName || c.tierLabel;
    offerCounts[offer] = (offerCounts[offer] || 0) + 1;
    messageCounts[c.messageApproach] = (messageCounts[c.messageApproach] || 0) + 1;
  }

  const total = contacts.length;
  const offerEntries = Object.entries(offerCounts).sort((a, b) => b[1] - a[1]);
  const messageEntries = Object.entries(messageCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="bg-accent-subtle rounded-sm px-3 py-2.5 space-y-2">
      <div>
        <span className="text-[11px] font-semibold tracking-[0.05em] text-foreground-faint uppercase">Reward Mix</span>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
          {offerEntries.map(([name, count]) => (
            <span key={name} className="text-[11px] text-foreground-muted">
              {name} <span className="font-semibold text-foreground">{Math.round(count / total * 100)}%</span>
            </span>
          ))}
        </div>
      </div>
      <div>
        <span className="text-[11px] font-semibold tracking-[0.05em] text-foreground-faint uppercase">Message Mix</span>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
          {messageEntries.map(([name, count]) => (
            <span key={name} className="text-[11px] text-foreground-muted">
              {name} <span className="font-semibold text-foreground">{Math.round(count / total * 100)}%</span>
            </span>
          ))}
        </div>
      </div>
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

  // Get the current day's contacts for reward/message distribution
  const currentDayContacts = briefings?.[effectiveDay]?.contacts || [];

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
            dateRange={dateRange}
            days={projection.days}
          />

          {/* Main content area */}
          <div className="flex gap-5 flex-1 min-h-0 p-5">
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
            <div className="flex-1 min-w-0 flex flex-col pt-2.5">
              <SectionLabel>Referral Funnel</SectionLabel>
              <div className="flex-1 min-h-0">
                <FunnelChart
                  stages={(() => {
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
                  })()}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── BLOCK 2: THREE-COLUMN — Health | Effectiveness | Today's Ops ── */}
        <div className="bg-surface border border-border rounded-lg">
          <div className="flex h-[500px]">
            {/* LEFT (~45%): Audience Health — propensity + reach depth */}
            <AudienceHealth
              propensityHealth={projection.propensityHealth}
              effectiveDay={effectiveDay}
            />

            {/* DIVIDER */}
            <div className="w-px bg-border-light shrink-0" />

            {/* CENTER (~20%): Engagement Effectiveness — combined chart */}
            <EngagementEffectiveness
              effectivenessData={projection.effectivenessData}
              effectiveDay={effectiveDay}
            />

            {/* DIVIDER */}
            <div className="w-px bg-border-light shrink-0" />

            {/* RIGHT (~35%): Today's Operations */}
            <div className="flex-[7] p-5 overflow-y-auto flex flex-col gap-3">
              {/* Heartbeat — summary bar */}
              <div className="bg-accent-subtle rounded-sm px-3 py-2.5">
                <div className="text-[13px] font-semibold text-foreground">
                  {fmt(briefings?.[effectiveDay]?.dailyPlan?.contactCount || 0)} contacts
                  {' · '}
                  {briefings?.[effectiveDay]?.holdbacks?.length || 0} held back
                  {' · '}
                  {fmtDollar(briefings?.[effectiveDay]?.dailyPlan?.budgetToday || 0)} spent
                </div>
              </div>

              {/* Strategy narrative */}
              <div>
                <SectionLabel>Strategy</SectionLabel>
                <p className="text-xs text-foreground-muted leading-relaxed">
                  {briefings?.[effectiveDay]?.dailyPlan?.strategyShift || 'Agent is calibrating...'}
                </p>
              </div>

              {/* Reward & Message Distribution */}
              <RewardDistribution contacts={currentDayContacts} />

              {/* Agent recommendation */}
              <GuardrailRecommendation briefings={briefings} selectedDay={effectiveDay} />

              {/* Key Learnings */}
              <KeyLearnings annotations={projection.learningAnnotations} selectedDay={effectiveDay} />

              {/* Decision Feed */}
              <DecisionFeed briefings={briefings} selectedDay={effectiveDay} />
            </div>
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
