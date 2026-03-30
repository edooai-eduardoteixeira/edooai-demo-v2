import React, { useState, useMemo } from 'react';
import Logo from '../components/Logo.jsx';
import { cn } from '../lib/utils.js';
import { computeDashboardProjection } from '../engine/projectionEngine.js';

// ─── Constants ────────────────────────────────────────────────────────
const DAY_STOPS = [1, 10, 20, 30];
const DAY_META = {
  1: { label: 'Day 1', sub: 'Cold Start' },
  10: { label: 'Day 10', sub: 'First Learnings' },
  20: { label: 'Day 20', sub: 'Hitting Stride' },
  30: { label: 'Day 30', sub: 'Mature' },
};

// ─── Formatting ──────────────────────────────────────────────────────
function fmt(n) { return Math.round(n).toLocaleString('en-US'); }
function fmtK(n) { return n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : fmt(n); }
function fmtDollar(n) { return '$' + fmt(n); }
function fmtTime(h, m) {
  const p = h >= 12 ? 'pm' : 'am';
  return `${h > 12 ? h - 12 : h || 12}:${String(m).padStart(2, '0')}${p}`;
}

function SectionLabel({ children, className }) {
  return (
    <h3 className={cn('text-[11px] font-semibold tracking-[0.05em] text-foreground-faint uppercase', className)}>
      {children}
    </h3>
  );
}

// ─── Trend arrow: compares current to earlier value ──────────────────
function TrendArrow({ current, previous, invertGood }) {
  if (previous == null || current == null || previous === 0) return null;
  const improving = invertGood ? current < previous : current > previous;
  const flat = Math.abs(current - previous) / Math.max(Math.abs(previous), 1) < 0.02;
  if (flat) return <span className="text-foreground-faint text-xs ml-1">→</span>;
  return (
    <span className={cn('text-xs ml-1', improving ? 'text-success' : 'text-foreground-faint')}>
      {improving ? (invertGood ? '↘' : '↗') : (invertGood ? '↗' : '↘')}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// DAY SELECTOR — compact horizontal strip
// ═══════════════════════════════════════════════════════════════════════
function DaySelector({ selected, onSelect }) {
  return (
    <div className="flex items-center gap-1">
      {DAY_STOPS.map((day, i) => {
        const active = selected === day;
        return (
          <React.Fragment key={day}>
            {i > 0 && <div className="w-6 h-px bg-border-light" />}
            <button
              onClick={() => onSelect(day)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-sm transition-all duration-200',
                active
                  ? 'bg-surface border border-border shadow-xs text-foreground'
                  : 'text-foreground-faint hover:text-foreground-muted hover:bg-accent-subtle'
              )}
            >
              <span className="text-[13px] font-semibold">{DAY_META[day].label}</span>
              <span className="text-[11px] text-foreground-faint hidden sm:inline">{DAY_META[day].sub}</span>
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// POSITION 1: RESULTS — Funnel + Hero Chart + Inline KPIs
// ═══════════════════════════════════════════════════════════════════════

/* ── Condensed Funnel Row ── */
function CondensedFunnel({ data, audienceSize }) {
  const stages = [
    { label: 'Eligible', value: audienceSize },
    { label: 'Contacted', value: data.contacted },
    { label: 'Ref. Sent', value: data.referralSent },
    { label: 'Signed Up', value: data.signedUp },
    { label: 'Active', value: data.activeUser },
  ];

  return (
    <div className="flex items-center gap-0.5">
      {stages.map((s, i) => {
        const prev = i > 0 ? stages[i - 1].value : null;
        const rate = prev && prev > 0 ? ((s.value / prev) * 100).toFixed(1) : null;
        const isLast = i === stages.length - 1;
        return (
          <React.Fragment key={i}>
            {i > 0 && (
              <div className="flex items-center gap-0.5 px-1 shrink-0">
                <svg width="8" height="8" className="text-foreground-faint">
                  <path d="M 1 4 L 7 4 M 5 2 L 7 4 L 5 6" fill="none" stroke="currentColor" strokeWidth="1" />
                </svg>
                <span className="text-[10px] text-foreground-faint">{rate}%</span>
              </div>
            )}
            <div className={cn(
              'flex flex-col items-center min-w-0',
              isLast ? 'flex-[1.2]' : 'flex-1'
            )}>
              <span className="text-[10px] text-foreground-faint uppercase tracking-[0.04em] truncate">
                {s.label}
              </span>
              <span className={cn(
                'text-[13px] font-semibold',
                isLast ? 'text-foreground' : 'text-foreground-muted'
              )}>
                {fmtK(s.value)}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ── Active Users Hero Chart ── */
function ActiveUsersChart({ cumulativeCurve, currentDay, activeUsers }) {
  const width = 520;
  const height = 160;
  const pad = { top: 16, right: 52, bottom: 24, left: 40 };
  const cw = width - pad.left - pad.right;
  const ch = height - pad.top - pad.bottom;

  const slice = cumulativeCurve.slice(0, currentDay);
  const fullMax = Math.max(...cumulativeCurve, 1);
  const yMax = Math.ceil(fullMax / 200) * 200 || 200;

  function toX(day) { return pad.left + ((day - 1) / 29) * cw; }
  function toY(val) { return pad.top + ch - (val / yMax) * ch; }

  const pathD = slice.map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i + 1)} ${toY(v)}`).join(' ');
  const lastX = slice.length > 0 ? toX(slice.length) : toX(1);
  const lastY = slice.length > 0 ? toY(slice[slice.length - 1]) : toY(0);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        {/* Grid */}
        {[0, 0.5, 1].map((frac, i) => {
          const y = toY(yMax * frac);
          return (
            <g key={i}>
              <line x1={pad.left} y1={y} x2={width - pad.right} y2={y}
                className="stroke-border-light" strokeWidth="1" />
              <text x={pad.left - 6} y={y + 3} textAnchor="end"
                className="fill-foreground-faint font-sans" fontSize="9">
                {fmtK(Math.round(yMax * frac))}
              </text>
            </g>
          );
        })}

        {/* X-axis */}
        {[1, 10, 20, 30].map(d => (
          <text key={d} x={toX(d)} y={height - 4} textAnchor="middle"
            className="fill-foreground-faint font-sans" fontSize="9">
            {d}
          </text>
        ))}

        {/* Area + Line */}
        {slice.length > 1 && (
          <>
            <path d={`${pathD} L ${lastX} ${toY(0)} L ${toX(1)} ${toY(0)} Z`}
              fill="var(--color-brand)" opacity="0.06" />
            <path d={pathD} fill="none" className="stroke-brand"
              strokeWidth="2" strokeLinejoin="round" />
            <circle cx={lastX} cy={lastY} r="3.5" className="fill-brand" />
          </>
        )}

        {/* End value label */}
        {slice.length > 0 && (
          <text x={lastX + 6} y={lastY + 4}
            className="fill-brand font-sans" fontSize="11" fontWeight="700">
            {fmt(slice[slice.length - 1])}
          </text>
        )}
      </svg>
    </div>
  );
}

/* ── Inline KPI Metric ── */
function InlineKPI({ label, value, trend, trendInvert }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-[10px] text-foreground-faint uppercase tracking-[0.04em] shrink-0">{label}</span>
      <span className="text-[15px] font-bold text-foreground">{value}</span>
      {trend}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// POSITION 2: LEARNINGS
// ═══════════════════════════════════════════════════════════════════════

/* ── Agentic vs Static Comparison Chart ── */
function ComparisonChart({ agenticCurve, staticCurve, annotations, currentDay }) {
  const width = 500;
  const height = 200;
  const pad = { top: 20, right: 56, bottom: 28, left: 40 };
  const cw = width - pad.left - pad.right;
  const ch = height - pad.top - pad.bottom;

  const agSlice = agenticCurve.slice(0, currentDay);
  const stSlice = staticCurve.slice(0, currentDay);
  const fullMax = Math.max(...agenticCurve, ...staticCurve, 1);
  const yMax = Math.ceil(fullMax / 200) * 200 || 200;

  function toX(day) { return pad.left + ((day - 1) / 29) * cw; }
  function toY(val) { return pad.top + ch - (val / yMax) * ch; }
  function buildPath(data) {
    return data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i + 1)} ${toY(v)}`).join(' ');
  }

  const agPath = buildPath(agSlice);
  const stPath = buildPath(stSlice);
  const activeAnnotations = (annotations || []).filter(a => a.day <= currentDay);

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <SectionLabel>Agentic vs Static</SectionLabel>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-brand rounded-full" />
            <span className="text-[10px] text-foreground-faint">Agent</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-px bg-gray-300" />
            <span className="text-[10px] text-foreground-faint">Static</span>
          </span>
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        {/* Grid */}
        {[0, 0.5, 1].map((frac, i) => {
          const y = toY(yMax * frac);
          return (
            <g key={i}>
              <line x1={pad.left} y1={y} x2={width - pad.right} y2={y}
                className="stroke-border-light" strokeWidth="1" />
              <text x={pad.left - 6} y={y + 3} textAnchor="end"
                className="fill-foreground-faint font-sans" fontSize="9">
                {fmtK(Math.round(yMax * frac))}
              </text>
            </g>
          );
        })}

        {[1, 10, 20, 30].map(d => (
          <text key={d} x={toX(d)} y={height - 4} textAnchor="middle"
            className="fill-foreground-faint font-sans" fontSize="9">{d}</text>
        ))}

        {/* Static line */}
        {stSlice.length > 1 && (
          <path d={stPath} fill="none" stroke="#D1C8BE" strokeWidth="1.5"
            strokeDasharray="4,3" strokeLinejoin="round" />
        )}

        {/* Agentic line */}
        {agSlice.length > 1 && (
          <>
            <path d={`${agPath} L ${toX(agSlice.length)} ${toY(0)} L ${toX(1)} ${toY(0)} Z`}
              fill="var(--color-brand)" opacity="0.05" />
            <path d={agPath} fill="none" className="stroke-brand"
              strokeWidth="2" strokeLinejoin="round" />
            <circle cx={toX(agSlice.length)} cy={toY(agSlice[agSlice.length - 1])}
              r="3" className="fill-brand" />
          </>
        )}

        {/* End labels */}
        {agSlice.length > 0 && (
          <text x={toX(agSlice.length) + 5} y={toY(agSlice[agSlice.length - 1]) + 4}
            className="fill-brand font-sans" fontSize="10" fontWeight="600">
            {fmt(agSlice[agSlice.length - 1])}
          </text>
        )}
        {stSlice.length > 0 && (
          <text x={toX(stSlice.length) + 5} y={toY(stSlice[stSlice.length - 1]) + 4}
            className="fill-foreground-faint font-sans" fontSize="10">
            {fmt(stSlice[stSlice.length - 1])}
          </text>
        )}

        {/* Annotation dots */}
        {activeAnnotations.map((a, i) => {
          const v = agSlice[a.day - 1] || 0;
          return (
            <g key={i}>
              <circle cx={toX(a.day)} cy={toY(v)} r="5" fill="var(--color-brand)" opacity="0.12" />
              <circle cx={toX(a.day)} cy={toY(v)} r="2" fill="var(--color-brand)" />
            </g>
          );
        })}
      </svg>

      {/* Milestone annotations */}
      {activeAnnotations.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {activeAnnotations.map((a, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand mt-1.5 shrink-0" />
              <span className="text-[11px] text-foreground-muted leading-snug">
                <span className="font-semibold">Day {a.day}:</span> {a.description}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Cohort Chart ── */
function CohortChart({ cohorts, currentDay }) {
  const width = 500;
  const height = 150;
  const pad = { top: 16, right: 32, bottom: 24, left: 40 };
  const cw = width - pad.left - pad.right;
  const ch = height - pad.top - pad.bottom;

  const repDays = [2, 5, 10, 15, 20, 25].filter(d => d <= currentDay && cohorts[d]);
  if (repDays.length === 0 && cohorts[1]) repDays.push(1);

  let maxCum = 1;
  for (const d of repDays) {
    for (const v of (cohorts[d]?.cumulativeResolved || [])) {
      if (v > maxCum) maxCum = v;
    }
  }
  maxCum = Math.ceil(maxCum / 5) * 5 || 5;

  const colors = ['#D1C8BE', '#A89E94', '#7D7368', '#6B5E54', '#4A3F37', '#2C2320'];

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <SectionLabel>Cohort Conversion Curves</SectionLabel>
        <div className="flex items-center gap-2">
          {repDays.slice(-3).map((day, idx) => {
            const color = colors[Math.min(repDays.indexOf(day), colors.length - 1)];
            return (
              <span key={day} className="flex items-center gap-1">
                <span className="w-2.5 h-0.5 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-[10px] text-foreground-faint">D{day} ({(cohorts[day]?.convRate || 0).toFixed(1)}%)</span>
              </span>
            );
          })}
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        {[0, 0.5, 1].map((frac, i) => {
          const y = pad.top + ch * (1 - frac);
          return (
            <g key={i}>
              <line x1={pad.left} y1={y} x2={width - pad.right} y2={y}
                className="stroke-border-light" strokeWidth="1" />
              <text x={pad.left - 6} y={y + 3} textAnchor="end"
                className="fill-foreground-faint font-sans" fontSize="9">
                {Math.round(maxCum * frac)}
              </text>
            </g>
          );
        })}

        {[0, 3, 7, 14].map(d => (
          <text key={d} x={pad.left + (Math.min(d, 13) / 13) * cw} y={height - 4}
            textAnchor="middle" className="fill-foreground-faint font-sans" fontSize="9">
            +{d}d
          </text>
        ))}

        {repDays.map((day, idx) => {
          const curve = cohorts[day]?.cumulativeResolved || [];
          const points = curve.slice(0, 14).map((v, i) => ({
            x: pad.left + (i / 13) * cw,
            y: pad.top + ch - (v / maxCum) * ch,
          }));
          if (points.length < 2) return null;
          const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
          const color = colors[Math.min(idx, colors.length - 1)];
          const isLatest = idx === repDays.length - 1;
          return (
            <path key={day} d={pathD} fill="none" stroke={color}
              strokeWidth={isLatest ? 2 : 1.5} strokeLinejoin="round"
              opacity={isLatest ? 1 : 0.6} />
          );
        })}
      </svg>
    </div>
  );
}

/* ── Agent Insight ── */
function AgentInsight({ dayData, currentDay, recommendation, staticDay }) {
  let title, description, type;

  if (currentDay <= 1) {
    type = 'observing';
    title = 'Agent initializing';
    description = `${fmt(dayData.journeysToday)} contacts sent. ${fmt(dayData.funnelCumulative.pending)} offers now in flight. First conversion results expected by Day 3–4.`;
  } else if (currentDay <= 10) {
    type = 'learning';
    title = 'Early signal';
    description = `Conversion rate: ${dayData.kpiCumulative.convRate}%. ${fmt(dayData.cumulativeN)} active users from ${fmt(dayData.funnelCumulative.contacted)} contacts. Targeting accuracy at ${Math.round(dayData.efficiency * 100)}%.`;
  } else if (recommendation && recommendation.availableFromDay <= currentDay) {
    type = 'recommendation';
    title = recommendation.title;
    description = `${recommendation.description} ${recommendation.action}`;
  } else {
    type = 'monitoring';
    const advantage = staticDay?.cumulativeN > 0
      ? Math.round(((dayData.cumulativeN - staticDay.cumulativeN) / staticDay.cumulativeN) * 100) : 0;
    title = 'System operating within guardrails';
    description = `Conversion rate ${dayData.kpiCumulative.convRate}% vs ${staticDay?.kpiCumulative?.convRate || 0}% static. ${advantage > 0 ? `${advantage}% more conversions from same budget. ` : ''}Budget utilization: ${Math.round((dayData.cumulativeRewardCost / dayData.cumulativeSpend) * 100)}%.`;
  }

  const dots = { observing: 'bg-foreground-faint', learning: 'bg-warn', monitoring: 'bg-success', recommendation: 'bg-brand' };

  return (
    <div className="mt-3 pt-3 border-t border-border-light">
      <div className="flex items-start gap-2">
        <span className={cn('w-2 h-2 rounded-full mt-1 shrink-0', dots[type])} />
        <div>
          <span className="text-[11px] font-semibold text-foreground-muted">{title}</span>
          <p className="text-[11px] text-foreground-faint leading-relaxed mt-0.5">{description}</p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// POSITION 3: DECISIONS
// ═══════════════════════════════════════════════════════════════════════
const OUTCOME_STYLES = {
  converted: { icon: '✓', cls: 'bg-[#d1fae5] text-[#065f46]' },
  pending: { icon: '⏳', cls: 'bg-[#fef3c7] text-[#92400e]' },
  expired: { icon: '✗', cls: 'bg-border-light text-foreground-muted' },
};

function DecisionFeed({ decisions }) {
  const [expandedId, setExpandedId] = useState(null);
  if (!decisions || decisions.length === 0) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <SectionLabel>Live Decisions</SectionLabel>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-brand" />
          <span className="text-[10px] text-foreground-faint">{decisions.length} shown</span>
        </span>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 space-y-0">
        {decisions.map((d) => {
          const outcome = OUTCOME_STYLES[d.outcome] || OUTCOME_STYLES.expired;
          const expanded = expandedId === d.id;

          return (
            <div key={d.id}>
              <button
                onClick={() => setExpandedId(expanded ? null : d.id)}
                className={cn(
                  'w-full flex items-center gap-2 py-1.5 px-1.5 rounded-sm text-left transition-colors duration-150',
                  'hover:bg-accent-subtle',
                  expanded && 'bg-accent-subtle'
                )}
              >
                <span className="text-[12px] font-medium text-foreground w-24 truncate shrink-0">{d.name}</span>
                <span className="text-[11px] text-foreground-muted shrink-0">{d.tierLabel}</span>
                <span className="text-[11px] text-foreground-faint shrink-0">{d.channel}</span>
                <span className="text-[11px] text-foreground-faint shrink-0">{fmtTime(d.hour, d.minute)}</span>
                <span className={cn(
                  'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ml-auto',
                  outcome.cls
                )}>
                  {outcome.icon} {d.outcome}
                </span>
                <svg className={cn(
                  'w-3 h-3 text-foreground-faint transition-transform duration-200 shrink-0',
                  expanded && 'rotate-180'
                )} fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              {expanded && (
                <div className="pl-3 pr-1 pb-2 ml-1.5 border-l-2 border-border-light">
                  <div className="space-y-1 mt-0.5">
                    <TlEvent label={`Contacted via ${d.channel}`} day={d.day} />
                    {d.referralSentDay && <TlEvent label="Referral link shared" day={d.referralSentDay} />}
                    {d.signedUpDay && <TlEvent label="Referee signed up" day={d.signedUpDay} />}
                    {d.outcome === 'converted' && d.resolvedDay && (
                      <TlEvent label="First transaction — Converted" day={d.resolvedDay} highlight />
                    )}
                    {d.outcome === 'expired' && <TlEvent label="Offer expired" day={d.day + 14} muted />}
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

function TlEvent({ label, day, highlight, muted }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn('w-1 h-1 rounded-full shrink-0',
        highlight ? 'bg-success' : muted ? 'bg-foreground-faint' : 'bg-border'
      )} />
      <span className={cn('text-[11px]',
        highlight ? 'text-success font-semibold' : muted ? 'text-foreground-faint' : 'text-foreground-muted'
      )}>
        Day {day}: {label}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD PAGE
// ═══════════════════════════════════════════════════════════════════════
export default function DashboardPage({ config, onHome }) {
  const [selectedDay, setSelectedDay] = useState(1);

  const projection = useMemo(() => {
    const budget = config.recommendedBudget?.amount || 150000;
    return computeDashboardProjection({ budget, params: config.engineParams });
  }, [config]);

  const dayData = projection.days[selectedDay - 1];
  const staticDayData = projection.staticBaseline.days[selectedDay - 1];

  // Earlier day data for trend comparison
  const earlierDay = Math.max(0, selectedDay - 6);
  const earlierData = earlierDay > 0 ? projection.days[earlierDay - 1] : null;

  const decisions = useMemo(() => {
    const start = Math.max(1, selectedDay - 1);
    const end = Math.min(30, selectedDay + 1);
    const all = [];
    for (let d = start; d <= end; d++) {
      if (projection.decisionLog[d]) all.push(...projection.decisionLog[d]);
    }
    return all.slice(0, 25);
  }, [projection, selectedDay]);

  const cacTrend = earlierData && dayData.kpiCumulative.cac > 0 && earlierData.kpiCumulative.cac > 0
    ? <TrendArrow current={dayData.kpiCumulative.cac} previous={earlierData.kpiCumulative.cac} invertGood />
    : null;
  const roiTrend = earlierData && dayData.kpiCumulative.roi > 0 && earlierData.kpiCumulative.roi > 0
    ? <TrendArrow current={dayData.kpiCumulative.roi} previous={earlierData.kpiCumulative.roi} />
    : null;

  return (
    <div className="min-h-screen flex flex-col w-full px-6 animate-page-enter">
      {/* ── Header: Logo + Day Selector ── */}
      <header className="flex items-center justify-between py-2.5 mb-4">
        <Logo variant="mark" onClick={onHome} />
        <DaySelector selected={selectedDay} onSelect={setSelectedDay} />
      </header>

      {/* ── POSITION 1: RESULTS (full-width top strip) ── */}
      <section className="mb-4">
        {/* Funnel row */}
        <div className="mb-3">
          <CondensedFunnel data={dayData.funnelCumulative} audienceSize={projection.audienceSize} />
        </div>

        {/* Hero chart + inline KPIs */}
        <div className="flex gap-6">
          {/* Active Users chart — the hero */}
          <div className="flex-[2] min-w-0">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-[28px] font-extrabold text-foreground tracking-tight leading-none">
                {fmt(dayData.funnelCumulative.activeUser)}
              </span>
              <span className="text-[13px] text-foreground-muted">active users</span>
            </div>
            <ActiveUsersChart
              cumulativeCurve={projection.cumulativeCurve}
              currentDay={selectedDay}
              activeUsers={dayData.funnelCumulative.activeUser}
            />
          </div>

          {/* Inline KPIs — contextualize the funnel result */}
          <div className="flex-[0.8] flex flex-col justify-center gap-4 min-w-[180px]">
            <InlineKPI
              label="CAC"
              value={dayData.kpiCumulative.cac > 0 ? fmtDollar(dayData.kpiCumulative.cac) : '—'}
              trend={cacTrend}
            />
            <InlineKPI
              label="ROI"
              value={dayData.kpiCumulative.roi > 0 ? `${dayData.kpiCumulative.roi}x` : '—'}
              trend={roiTrend}
            />
            <InlineKPI
              label="Fraud saved"
              value={fmtDollar(dayData.kpiCumulative.fraudSaved)}
            />

            {/* Pipeline bridge */}
            {dayData.funnelCumulative.pending > 0 && (
              <div className="pt-3 border-t border-border-light">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-warn shrink-0" />
                  <span className="text-[12px] text-foreground-muted">
                    <span className="font-semibold">{fmt(dayData.funnelCumulative.pending)}</span> offers in flight
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Divider between Position 1 and 2/3 ── */}
      <div className="border-t border-border-light mb-4" />

      {/* ── POSITION 2 + 3: Two columns ── */}
      <section className="flex-1 flex gap-6 min-h-0 pb-4">
        {/* Position 2: Learnings (left, wider) */}
        <div className="flex-[1.3] min-w-0 flex flex-col gap-4">
          {/* Agentic vs Static — the strongest element */}
          <ComparisonChart
            agenticCurve={projection.cumulativeCurve}
            staticCurve={projection.staticCumulativeCurve}
            annotations={projection.learningAnnotations}
            currentDay={selectedDay}
          />

          {/* Cohort chart — proves learning */}
          <CohortChart
            cohorts={projection.cohorts}
            currentDay={selectedDay}
          />

          {/* Agent Insight — bridges to Position 3 */}
          <AgentInsight
            dayData={dayData}
            currentDay={selectedDay}
            recommendation={projection.agentRecommendation}
            staticDay={staticDayData}
          />
        </div>

        {/* Position 3: Decisions (right, narrower) */}
        <div className="flex-1 min-w-0 border-l border-border-light pl-6">
          <DecisionFeed decisions={decisions} />
        </div>
      </section>
    </div>
  );
}
