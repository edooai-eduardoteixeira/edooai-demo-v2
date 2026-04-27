import React, { useState, useMemo, useRef, useLayoutEffect } from 'react';
import Logo from '../components/Logo.jsx';
import Chart from '../components/Chart.jsx';
import StackedBarChart from '../components/StackedBarChart.jsx';
import StackedAreaChart from '../components/StackedAreaChart.jsx';
import FunnelChart from '../components/FunnelChart.jsx';
import StrategyCards, { DefaultBudgetSlider, BUDGET_CONFIG } from '../components/StrategyCards.jsx';
import { cn } from '../lib/utils.js';
import { niceYMax, dayXTicks, CHART_MARGIN, formatCompact } from '../components/chartUtils.js';
import { computeDashboardProjection } from '../engine/projectionEngine.js';
import { computeDashboardMetrics, computeHeroChartForKPI } from '../lib/metrics.js';

// ─── Constants ────────────────────────────────────────────────────────
const DAY_STOPS = [1, 10, 30, 60];
const DAY_META = {
  1: { label: 'Day 1', subtitle: 'Cold Start' },
  10: { label: 'Day 10', subtitle: 'First Learnings' },
  30: { label: 'Day 30', subtitle: 'Hitting Stride' },
  60: { label: 'Day 60', subtitle: 'Mature Operation' },
};

// ─── Formatting helpers ──────────────────────────────────────────────
function fmt(n) { return Math.round(n).toLocaleString('en-US'); }
function fmtDollar(n) { return '$' + fmt(n); }

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
  high: 'var(--color-data-3)',   // step 3 — Advocates (highest propensity)
  medium: 'var(--color-data-2)', // step 2 — Persuadable
  low: 'var(--color-data-1)',    // step 1 — Passive (lowest propensity)
  bar: 'var(--accent-subtle)',   // CSS variable — funnel bars (unchanged)
};

// ═══════════════════════════════════════════════════════════════════════
// CAMPAIGN HEALTH ROW — compact status strip at top of Block 1
// ═══════════════════════════════════════════════════════════════════════

function fmtRate(n) {
  return fmtDollar(n) + '/mo';
}

function CampaignHealthRow({ health, onAdjustBudget }) {
  const { delivery, budget, periodSpend, monthlyPace } = health;

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
        <span className={cn(
          'text-[13px] font-semibold tracking-[0.05em] uppercase',
          delivery.active ? 'text-brand' : 'text-foreground'
        )}>
          {delivery.label}
        </span>
      </span>

      {/* Divider */}
      <div className="w-px h-5 bg-border-light shrink-0 mx-4" />

      {/* Budget */}
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

      {/* Spent */}
      <span className="flex items-center gap-2 shrink-0 min-w-[155px]">
        <span className="text-[11px] font-semibold tracking-[0.05em] text-foreground-faint uppercase shrink-0">Spent</span>
        <span className="text-[13px] text-foreground-muted whitespace-nowrap">
          {fmtDollar(periodSpend)}
        </span>
      </span>

      {/* Divider */}
      <div className="w-px h-5 bg-border-light shrink-0 mx-4" />

      {/* Pacing */}
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

function KPISelector({ selected, onSelect, kpiCards }) {
  return (
    <div className="flex">
      {KPI_DEFS.map((kpi) => {
        const active = selected === kpi.key;
        const card = kpiCards.find((c) => c.key === kpi.key);
        const { value, deltaPct, isPositive, isGood, showDelta } = card;

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
                  ? (isGood === null ? 'text-foreground-faint' : isGood ? 'text-success' : 'text-warn')
                  : 'invisible'
              )}>
                {showDelta
                  ? (deltaPct === 0 ? '0%' : `${isPositive ? '↑' : '↓'}${Math.abs(deltaPct)}%`)
                  : '—'}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// HERO CHART — renders the selected KPI's trend
// ═══════════════════════════════════════════════════════════════════════
function HeroChart({ selectedKPI, currentDay, projection }) {
  const xLabels = dayXTicks(currentDay).map(d => ({ value: String(d), at: d }));
  const hero = computeHeroChartForKPI(projection, selectedKPI, currentDay);

  // All KPIs render as a line chart of daily values.
  const { slice, staticSlice, maxVal, isROAS, hasData } = hero;
  const yMax = niceYMax(maxVal);
  const formatLabel = selectedKPI === 'activeUsers'
    ? (v) => fmt(v)
    : isROAS
      ? (v) => `${v}x`
      : (v) => fmtDollar(v);
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

function SuggestedChangeStrip({ recommendation, onReview }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed || !recommendation) return null;

  return (
    <div className="flex items-center border-l-[3px] border-l-brand border-b border-border-light px-5 py-2.5">
      <span className="text-[13px] text-foreground-muted">
        <span className="font-semibold text-brand">Suggested change:</span> {recommendation.action}
      </span>
      <button
        onClick={onReview}
        className="py-1 px-2.5 text-[13px] font-semibold rounded-sm bg-surface text-brand border border-brand/30 hover:bg-brand-light transition-all duration-200 shrink-0 ml-3"
      >
        Review
      </button>
      <button
        onClick={() => setDismissed(true)}
        className="w-6 h-6 flex items-center justify-center rounded-sm text-foreground-faint hover:text-foreground hover:bg-accent-subtle transition-colors duration-200 shrink-0 ml-auto"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
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
function AudienceHealth({ audience, effectiveDay }) {
  if (!audience) return null;

  const { bands: bandData, convRateOverlay } = audience;

  // Stacked area: eligible pool per cluster over time
  const bands = [
    { label: 'Advocates', color: CHART_FILLS.high, data: bandData.advocates },
    { label: 'Persuadable', color: CHART_FILLS.medium, data: bandData.persuadable },
    { label: 'Passive', color: CHART_FILLS.low, data: bandData.passive },
  ];

  const convRate = convRateOverlay;

  const xLabels = dayXTicks(effectiveDay).map(d => ({ value: String(d), at: d }));

  return (
    <div className="flex-[5] p-5 min-w-0 flex flex-col">
      <SectionLabel>Audience Overview</SectionLabel>
      <div className="flex-1 min-h-0">
        <StackedAreaChart
          bands={bands}
          cssHeight="100%"
          xLabels={xLabels}
          legend
          formatTooltip={(i, v) => formatCompact(v)}
          overlayLine={{
            data: convRate,
            color: 'var(--color-brand)',
            label: 'Conversion rate',
            formatLabel: (v) => `${Math.round(v)}%`,
          }}
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// CAMPAIGN CARDS — horizontal, structured
// ═══════════════════════════════════════════════════════════════════════
function CampaignList({ campaigns }) {
  const [selectedId, setSelectedId] = useState(campaigns?.[0]?.id || null);

  if (!campaigns || campaigns.length === 0) return null;

  const selected = campaigns.find(c => c.id === selectedId);

  return (
    <div className="flex gap-3 h-full">
      {/* Left: label + campaign list — scrolls independently */}
      <div className="w-[40%] shrink-0 flex flex-col">
        <SectionLabel>Active Campaigns</SectionLabel>
        <div className="flex-1 min-h-0 overflow-y-auto">
        {campaigns.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedId(c.id)}
            className={cn(
              'w-full rounded-sm px-2 py-1.5 text-left transition-colors duration-150',
              selectedId === c.id
                ? 'bg-accent-subtle'
                : 'hover:bg-accent-subtle/50',
            )}
          >
            <div className="flex items-baseline justify-between gap-1">
              <span className="text-[11px] font-semibold text-foreground leading-tight truncate">{c.title}</span>
              <span className="text-[11px] text-foreground-faint tabular-nums shrink-0">{fmt(c.contactCount)}</span>
            </div>
          </button>
        ))}
        </div>
      </div>

      {/* Right: selected campaign detail */}
      {selected && (
        <div className="flex-1 min-w-0 pl-8 pr-6 self-start">
          <p className="text-[13px] font-medium text-foreground-muted leading-relaxed">{selected.whyRefer}</p>
          <div className="flex items-center gap-2 mt-3">
            <span className="inline-flex items-center px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-border-light text-foreground-muted">{selected.channel}</span>
            <span className="inline-flex items-center px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-border-light text-foreground-muted">{selected.reward}</span>
          </div>
          <p className="text-[13px] text-foreground-faint leading-relaxed mt-3 border-l-2 border-border-light pl-3">{selected.example.replace(/^(Push|Email|In-app|SMS):\s*/i, '')}</p>
        </div>
      )}
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

  // Single source of truth — see docs/METRIC_MODEL.md and src/lib/metrics.js
  const metrics = useMemo(
    () => computeDashboardMetrics(projection, { selectedDay, dateRange }),
    [projection, selectedDay, dateRange]
  );
  const { effectiveDay, dayData } = metrics;

  return (
    <div className="h-screen flex flex-col w-full px-6 animate-page-enter overflow-hidden">
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

      <main className="flex-1 pb-4 min-h-0">
        {/* ── ONE CARD: One agent, one program, one surface ── */}
        <div className="bg-surface border border-border rounded-lg shadow-sm h-full flex flex-col">
          {/* Campaign Health Row — permanent agent status, top of card */}
          <CampaignHealthRow
            health={metrics.campaignHealth}
            onAdjustBudget={() => setActiveDrawer('budget')}
          />
          {/* Suggested change — below health row, adds height when visible */}
          <SuggestedChangeStrip
            recommendation={metrics.suggestedChange}
            onReview={() => setActiveDrawer('budget')}
          />

          {/* ── Block 1: Outcomes ── */}
          <div className="flex gap-5 flex-1 min-h-0 px-5 pt-5 pb-3">
            {/* LEFT COLUMN (75%): KPI selector + hero chart */}
            <div className="flex-[3] min-w-0 flex flex-col border-r border-border-light">
              <KPISelector
                selected={selectedKPI}
                onSelect={setSelectedKPI}
                kpiCards={metrics.kpiCards}
              />
              {/* Hero chart fills remaining height */}
              <div className="mt-4 flex-1 min-h-0">
                <HeroChart
                  selectedKPI={selectedKPI}
                  currentDay={effectiveDay}
                  projection={projection}
                />
              </div>
            </div>

            {/* RIGHT COLUMN (25%): Referral Funnel */}
            <div className="flex-1 min-w-0 flex flex-col pt-2.5 pl-4">
              <SectionLabel>Referral Funnel</SectionLabel>
              <div className="flex-1 min-h-0 pb-6">
                <FunnelChart stages={metrics.funnel} />
              </div>
            </div>
          </div>

          {/* HORIZONTAL DIVIDER between blocks */}
          <div className="h-px bg-border-light mx-5 shrink-0" />

          {/* ── Block 2: Health + Operations ── */}
          <div className="flex flex-1 min-h-0">
            {/* LEFT: Audience Health — pool + conversion rate (dual axis) */}
            <AudienceHealth
              audience={metrics.audienceOverview}
              effectiveDay={effectiveDay}
            />

            {/* DIVIDER */}
            <div className="w-px bg-border-light shrink-0" />

            {/* RIGHT (~50%): campaigns + daily outreach chart */}
            <div className="flex-[5] px-5 flex flex-col">
              {/* The playbook — fixed 50%, scrolls if needed */}
              <div className="flex-[2] min-h-0 overflow-hidden pt-5 pb-3">
                <CampaignList campaigns={metrics.campaignList} />
              </div>

              {/* The execution over time — fixed 50%, py only (column handles px) */}
              <div className="flex-[3] min-h-0 flex flex-col py-5">
                <SectionLabel>Daily Outreach</SectionLabel>
                <div className="flex-1 min-h-0">
                {(() => {
                  const { paddedData, latestCampaigns, maxTotal } = metrics.dailyOutreach;
                  const CAMPAIGN_COLORS = [
                    'var(--color-data-5)',  // step 5 — product-specific (highest volume)
                    'var(--color-data-4)',  // step 4
                    'var(--color-data-3)',  // step 3
                    'var(--color-data-2)',  // step 2 — transactional
                    'var(--color-data-1)',  // step 1 — generic promo (lowest volume)
                  ];
                  const yMax = niceYMax(maxTotal);
                  return (
                    <StackedBarChart
                      data={paddedData.map((values) => ({ values }))}
                      segments={latestCampaigns.map((c, i) => ({
                        label: c.title,
                        color: CAMPAIGN_COLORS[i] || 'var(--color-data-3)',
                      }))}
                      maxValue={yMax}
                      xLabels={dayXTicks(effectiveDay).map(d => ({ value: String(d), at: d }))}
                      yLabels={[yMax * 0.5, yMax]}
                      gridlines="from-labels"
                      cssHeight="100%"
                      legend
                    />
                  );
                })()}
                </div>
              </div>
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
