import React, { useState, useMemo } from 'react';
import Logo from '../components/Logo.jsx';
import Chart from '../components/Chart.jsx';
import FunnelChart from '../components/FunnelChart.jsx';
import { cn } from '../lib/utils.js';
import { computeDashboardProjection } from '../engine/projectionEngine.js';

// ─── Constants ────────────────────────────────────────────────────────
const DAY_STOPS = [1, 10, 20, 30];
const DAY_META = {
  1: { label: 'Day 1', subtitle: 'Cold Start' },
  10: { label: 'Day 10', subtitle: 'First Learnings' },
  20: { label: 'Day 20', subtitle: 'Hitting Stride' },
  30: { label: 'Day 30', subtitle: 'Mature Operation' },
};

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
// KPI SELECTOR — tabs that control the hero chart
// ═══════════════════════════════════════════════════════════════════════
const KPI_DEFS = [
  { key: 'activeUsers', label: 'Active Users', format: (v) => fmt(v) },
  { key: 'cac', label: 'CAC', format: (v) => v > 0 ? fmtDollar(v) : '—' },
  { key: 'roi', label: 'ROI', format: (v) => v > 0 ? `${v}x` : '—' },
  { key: 'fraudSaved', label: 'Fraud Saved', format: (v) => fmtDollar(v) },
];

function KPISelector({ selected, onSelect, dayData }) {
  return (
    <div className="flex gap-2">
      {KPI_DEFS.map((kpi) => {
        const active = selected === kpi.key;
        const value = kpi.key === 'activeUsers'
          ? dayData.funnelCumulative.activeUser
          : dayData.kpiCumulative[kpi.key];
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
          </button>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// HERO CHART — renders the selected KPI's 30-day trend
// ═══════════════════════════════════════════════════════════════════════
function HeroChart({ selectedKPI, days, currentDay, cumulativeCurve, height }) {
  // Build the data slice for the selected KPI
  let slice, yMax, formatLabel;

  if (selectedKPI === 'activeUsers') {
    slice = cumulativeCurve.slice(0, currentDay);
    const maxVal = Math.max(...slice, 1);
    yMax = Math.ceil(maxVal / 200) * 200 || 200;
    formatLabel = (v) => fmt(v);
  } else {
    slice = days.slice(0, currentDay).map(d => d.kpiCumulative[selectedKPI]);
    const maxVal = Math.max(...slice, 1);
    if (selectedKPI === 'cac') {
      yMax = Math.ceil(maxVal / 20) * 20 || 100;
      formatLabel = (v) => fmtDollar(v);
    } else if (selectedKPI === 'roi') {
      yMax = Math.ceil(maxVal * 2) / 2 || 2;
      formatLabel = (v) => `${v}x`;
    } else {
      yMax = Math.ceil(maxVal / 1000) * 1000 || 1000;
      formatLabel = (v) => fmtDollar(v);
    }
  }

  const yLabels = selectedKPI === 'roi'
    ? [0, yMax * 0.5, yMax]
    : [0, yMax * 0.5, yMax];

  return (
    <Chart
      data={slice}
      maxValue={yMax}
      height={height}
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
function CohortChart({ cohorts, currentDay, height }) {
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
    <div className="flex-1 min-h-0">
      <SectionLabel>Funnel Performance</SectionLabel>
      <Chart
        series={cohortSeries}
        maxValue={maxPct}
        height={height}
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
  );
}

// ═══════════════════════════════════════════════════════════════════════
// ZONE B: DECISION FEED
// ═══════════════════════════════════════════════════════════════════════
const OUTCOME_STYLES = {
  converted: { icon: '✓', className: 'bg-[#d1fae5] text-[#065f46]' },
  pending: { icon: '⏳', className: 'bg-[#fef3c7] text-[#92400e]' },
  expired: { icon: '✗', className: 'bg-border-light text-foreground-muted' },
};

const CHANNEL_ICONS = {
  push: '📱',
  email: '✉️',
  sms: '💬',
};

function DecisionFeed({ decisions, referrerTiers, refereeTiers }) {
  const [expandedId, setExpandedId] = useState(null);

  if (!decisions || decisions.length === 0) return null;

  return (
    <div className="bg-surface border border-border rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <SectionLabel>Live Decisions</SectionLabel>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-brand" />
          <span className="text-[11px] text-foreground-faint">
            {decisions.length} decisions shown
          </span>
        </span>
      </div>

      <div className="max-h-[200px] overflow-y-auto space-y-0">
        {decisions.map((d) => {
          const outcome = OUTCOME_STYLES[d.outcome] || OUTCOME_STYLES.expired;
          const expanded = expandedId === d.id;

          return (
            <div key={d.id}>
              <button
                onClick={() => setExpandedId(expanded ? null : d.id)}
                className={cn(
                  'w-full flex items-center gap-3 py-2 px-2 rounded-sm text-left transition-colors duration-150',
                  'hover:bg-accent-subtle',
                  expanded && 'bg-accent-subtle'
                )}
              >
                {/* Name */}
                <span className="text-[13px] font-medium text-foreground w-28 truncate shrink-0">
                  {d.name}
                </span>

                {/* Tier */}
                <span className="text-xs text-foreground-muted w-24 shrink-0">
                  {d.tierLabel} (${d.rewardReferrer}/${d.rewardReferee})
                </span>

                {/* Channel */}
                <span className="text-xs text-foreground-faint w-12 shrink-0 text-center">
                  {CHANNEL_ICONS[d.channel] || d.channel}
                </span>

                {/* Time */}
                <span className="text-xs text-foreground-faint w-16 shrink-0">
                  {fmtTime(d.hour, d.minute)}
                </span>

                {/* Outcome badge */}
                <span className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold shrink-0',
                  outcome.className
                )}>
                  {outcome.icon} {d.outcome}
                  {d.outcome === 'converted' && d.resolvedDay && (
                    <span className="font-normal"> (Day {d.resolvedDay})</span>
                  )}
                </span>

                {/* Expand arrow */}
                <svg className={cn(
                  'w-3.5 h-3.5 text-foreground-faint ml-auto transition-transform duration-200 shrink-0',
                  expanded && 'rotate-180'
                )} fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              {/* Expanded journey timeline */}
              {expanded && (
                <div className="pl-4 pr-2 pb-3 ml-2 border-l-2 border-border-light">
                  <div className="space-y-1.5 mt-1">
                    <TimelineEvent
                      label={`Contacted via ${d.channel}`}
                      day={d.day}
                    />
                    {d.referralSentDay && (
                      <TimelineEvent
                        label="Referral link shared"
                        day={d.referralSentDay}
                      />
                    )}
                    {d.signedUpDay && (
                      <TimelineEvent
                        label="Referee signed up"
                        day={d.signedUpDay}
                      />
                    )}
                    {d.outcome === 'converted' && d.resolvedDay && (
                      <TimelineEvent
                        label="First transaction — Converted"
                        day={d.resolvedDay}
                        highlight
                      />
                    )}
                    {d.outcome === 'expired' && (
                      <TimelineEvent
                        label="Offer expired"
                        day={d.day + 14}
                        muted
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TimelineEvent({ label, day, highlight, muted }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn(
        'w-1.5 h-1.5 rounded-full shrink-0',
        highlight ? 'bg-success' : muted ? 'bg-foreground-faint' : 'bg-border'
      )} />
      <span className={cn(
        'text-xs',
        highlight ? 'text-success font-semibold' : muted ? 'text-foreground-faint' : 'text-foreground-muted'
      )}>
        Day {day}: {label}
      </span>
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
// ZONE D: AGENT INSIGHT
// ═══════════════════════════════════════════════════════════════════════
function AgentInsight({ dayData, currentDay, recommendation, staticDay }) {
  // Always show something — evolves with confidence
  let title, description, type;

  if (currentDay <= 1) {
    type = 'observing';
    title = 'Agent initializing';
    description = `${fmt(dayData.journeysToday)} contacts sent. ${fmt(dayData.funnelCumulative.pending)} offers now in flight. First conversion results expected by Day 3–4.`;
  } else if (currentDay <= 10) {
    const actualConv = dayData.kpiCumulative.convRate;
    type = 'learning';
    title = 'Early signal';
    description = `Conversion rate: ${actualConv}% — ${dayData.cumulativeN > 50 ? 'signal building' : 'early data'}. ` +
      `${fmt(dayData.cumulativeN)} active users from ${fmt(dayData.funnelCumulative.contacted)} contacts. ` +
      `Targeting accuracy at ${Math.round(dayData.efficiency * 100)}% (${Math.round(dayData.efficiency * 100) > 30 ? 'improving from' : 'starting at'} 30% baseline).`;
  } else if (recommendation && recommendation.availableFromDay <= currentDay) {
    type = 'recommendation';
    title = recommendation.title;
    description = `${recommendation.description} ${recommendation.action}`;
  } else {
    type = 'monitoring';
    const agenticUsers = dayData.cumulativeN;
    const staticUsers = staticDay?.cumulativeN || 0;
    const advantage = staticUsers > 0 ? Math.round(((agenticUsers - staticUsers) / staticUsers) * 100) : 0;
    title = 'System operating within guardrails';
    description = `Conversion rate ${dayData.kpiCumulative.convRate}% vs ${staticDay?.kpiCumulative?.convRate || 0}% static baseline. ` +
      `${advantage > 0 ? `${advantage}% more conversions from the same budget. ` : ''}` +
      `Budget utilization: ${Math.round((dayData.cumulativeRewardCost / dayData.cumulativeSpend) * 100)}% of spend allocated to rewards.`;
  }

  const typeStyles = {
    observing: 'border-foreground-faint',
    learning: 'border-warn',
    monitoring: 'border-success',
    recommendation: 'border-brand',
  };

  const dotStyles = {
    observing: 'bg-foreground-faint',
    learning: 'bg-warn',
    monitoring: 'bg-success',
    recommendation: 'bg-brand',
  };

  return (
    <div className={cn(
      'border rounded-lg p-5 mb-8 transition-all duration-300',
      'bg-surface',
      typeStyles[type] || 'border-border'
    )}>
      <div className="flex items-center gap-2 mb-2">
        <span className={cn('w-2 h-2 rounded-full shrink-0', dotStyles[type])} />
        <span className="text-[11px] font-semibold tracking-[0.05em] text-foreground-faint uppercase">
          Agent Insight
        </span>
      </div>
      <div className="text-sm font-semibold text-foreground mb-1">
        {title}
      </div>
      <p className="text-[13px] text-foreground-muted leading-relaxed">
        {description}
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD PAGE
// ═══════════════════════════════════════════════════════════════════════
export default function DashboardPage({ config, onHome }) {
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedKPI, setSelectedKPI] = useState('activeUsers');

  // Run v4 engine once with recommended budget
  const projection = useMemo(() => {
    const budget = config.recommendedBudget?.amount || 150000;
    return computeDashboardProjection({ budget, params: config.engineParams });
  }, [config]);

  // Current day data
  const dayData = projection.days[selectedDay - 1];
  const staticDayData = projection.staticBaseline.days[selectedDay - 1];

  // Decisions for the selected day window
  const decisions = useMemo(() => {
    const start = Math.max(1, selectedDay - 1);
    const end = Math.min(30, selectedDay + 1);
    const all = [];
    for (let d = start; d <= end; d++) {
      if (projection.decisionLog[d]) {
        all.push(...projection.decisionLog[d]);
      }
    }
    return all.slice(0, 20);
  }, [projection, selectedDay]);

  return (
    <div className="min-h-screen flex flex-col w-full px-6 animate-page-enter">
      {/* Header: Logo + Day Selector — compact, left-aligned together */}
      <header className="flex items-center gap-8 py-2 mb-2">
        <Logo variant="mark" onClick={onHome} />
        <DaySelector
          selected={selectedDay}
          onSelect={setSelectedDay}
        />
      </header>

      <main className="flex-1 pb-8">
        {/* ── POSITION 1: RESULTS — one unified area ── */}
        <div className="bg-surface border border-border rounded-lg p-5 mb-5 h-[380px]">
          <div className="flex gap-5 h-full">
            {/* LEFT COLUMN (60%): KPI selector + hero chart */}
            <div className="flex-[3] min-w-0 flex flex-col">
              <KPISelector
                selected={selectedKPI}
                onSelect={setSelectedKPI}
                dayData={dayData}
              />
              {/* Hero chart fills remaining height */}
              <div className="mt-4 flex-1 min-h-0">
                <HeroChart
                  selectedKPI={selectedKPI}
                  days={projection.days}
                  currentDay={selectedDay}
                  cumulativeCurve={projection.cumulativeCurve}
                  height={250}
                />
              </div>
            </div>

            {/* DIVIDER */}
            <div className="w-px bg-border-light shrink-0" />

            {/* MIDDLE COLUMN (20%): Referral Funnel */}
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
                  pending={dayData.funnelCumulative.pending}
                />
              </div>
            </div>

            {/* DIVIDER */}
            <div className="w-px bg-border-light shrink-0" />

            {/* RIGHT COLUMN (20%): Funnel Performance (cohort chart) */}
            <div className="flex-1 min-w-0 flex flex-col">
              <CohortChart
                cohorts={projection.cohorts}
                currentDay={selectedDay}
                height={290}
              />
            </div>
          </div>
        </div>

        {/* ── POSITION 2 + 3: LEARNINGS | DECISIONS ── */}
        <div className="grid grid-cols-[1.3fr_1fr] gap-6">
          {/* Position 2: Learnings */}
          <div className="space-y-6">
            <ComparisonChart
              agenticCurve={projection.cumulativeCurve}
              staticCurve={projection.staticCumulativeCurve}
              annotations={projection.learningAnnotations}
              currentDay={selectedDay}
            />
            <AgentInsight
              dayData={dayData}
              currentDay={selectedDay}
              recommendation={projection.agentRecommendation}
              staticDay={staticDayData}
            />
          </div>

          {/* Position 3: Decisions */}
          <div>
            <DecisionFeed
              decisions={decisions}
              referrerTiers={projection.referrerTiers}
              refereeTiers={projection.refereeTiers}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
