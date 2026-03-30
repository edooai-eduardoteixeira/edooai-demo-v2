import React, { useState, useMemo } from 'react';
import Logo from '../components/Logo.jsx';
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
function DaySelector({ selected, onSelect, thresholdDay }) {
  return (
    <div className="flex items-center gap-2 mb-8">
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

// ═══════════════════════════════════════════════════════════════════════
// VERTICAL FUNNEL — narrowing bars, wide at top, narrow at bottom
// ═══════════════════════════════════════════════════════════════════════
function VerticalFunnel({ data, audienceSize }) {
  const stages = [
    { label: 'Eligible', value: audienceSize, key: 'eligible' },
    { label: 'Contacted', value: data.contacted, key: 'contacted' },
    { label: 'Referral Sent', value: data.referralSent, key: 'referralSent' },
    { label: 'Signed Up', value: data.signedUp, key: 'signedUp' },
    { label: 'Active User', value: data.activeUser, key: 'activeUser' },
  ];

  const maxValue = stages[0].value;

  return (
    <div className="bg-surface border border-border rounded-lg p-6">
      <SectionLabel>Referral Funnel</SectionLabel>
      <div className="flex flex-col items-center gap-0 mt-2">
        {stages.map((stage, i) => {
          // sqrt scale so bottom bars stay visible (linear makes them invisible at 424K → 686)
          const widthPct = Math.max(12, Math.sqrt(stage.value / maxValue) * 100);
          const prevValue = i > 0 ? stages[i - 1].value : null;
          const convRate = prevValue && prevValue > 0
            ? ((stage.value / prevValue) * 100).toFixed(1) + '%'
            : null;
          const isLast = i === stages.length - 1;

          return (
            <div key={stage.key} className="w-full flex flex-col items-center">
              {/* Conversion rate between stages */}
              {i > 0 && (
                <div className="flex items-center gap-1 py-1">
                  <svg width="8" height="10" className="text-foreground-faint">
                    <path d="M 4 0 L 4 8 M 2 6 L 4 8 L 6 6" fill="none" stroke="currentColor" strokeWidth="1" />
                  </svg>
                  <span className="text-[11px] text-foreground-faint">{convRate}</span>
                </div>
              )}

              {/* Bar + label row */}
              <div className="w-full flex items-center gap-3">
                <span className="text-[11px] font-semibold tracking-[0.05em] text-foreground-faint uppercase w-24 text-right shrink-0">
                  {stage.label}
                </span>
                <div className="flex-1 flex items-center gap-2">
                  <div
                    className={cn(
                      'h-7 rounded-sm transition-all duration-300',
                      isLast ? 'bg-brand' : 'bg-accent-subtle'
                    )}
                    style={{ width: `${widthPct}%` }}
                  />
                  <span className={cn(
                    'text-sm font-semibold shrink-0',
                    isLast ? 'text-foreground' : 'text-foreground-muted'
                  )}>
                    {stage.value >= 1000 ? fmtK(stage.value) : fmt(stage.value)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pending pipeline bridge */}
      {data.pending > 0 && (
        <div className="mt-4 pt-3 border-t border-border-light flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-warn shrink-0" />
          <span className="text-[13px] text-foreground-muted">
            <span className="font-semibold">{fmt(data.pending)} offers in flight</span>
            {' — '}results to be realized from active cohorts
          </span>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// ACTIVE USERS HERO CHART — the largest visual on the page
// ═══════════════════════════════════════════════════════════════════════
function ActiveUsersChart({ cumulativeCurve, currentDay }) {
  const width = 600;
  const height = 280;
  const pad = { top: 30, right: 60, bottom: 40, left: 50 };
  const cw = width - pad.left - pad.right;
  const ch = height - pad.top - pad.bottom;

  const slice = cumulativeCurve.slice(0, currentDay);
  const fullMax = Math.max(...cumulativeCurve, 1);
  const yMax = Math.ceil(fullMax / 200) * 200 || 200;

  function toX(day) { return pad.left + ((day - 1) / 29) * cw; }
  function toY(val) { return pad.top + ch - (val / yMax) * ch; }

  const pathD = slice.map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i + 1)} ${toY(v)}`).join(' ');
  const lastVal = slice.length > 0 ? slice[slice.length - 1] : 0;

  return (
    <div className="bg-surface border border-border rounded-lg p-6">
      <div className="flex items-baseline gap-3 mb-4">
        <span className="text-[32px] font-extrabold text-foreground tracking-tight leading-none">
          {fmt(lastVal)}
        </span>
        <span className="text-[15px] text-foreground-muted">active users acquired</span>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
          const y = toY(yMax * frac);
          return (
            <g key={i}>
              <line x1={pad.left} y1={y} x2={width - pad.right} y2={y}
                className="stroke-border-light" strokeWidth="1" />
              <text x={pad.left - 8} y={y + 3} textAnchor="end"
                className="fill-foreground-faint font-sans" fontSize="10">
                {fmtK(Math.round(yMax * frac))}
              </text>
            </g>
          );
        })}

        {/* X-axis labels */}
        {[1, 5, 10, 15, 20, 25, 30].map(d => (
          <text key={d} x={toX(d)} y={height - 8} textAnchor="middle"
            className="fill-foreground-faint font-sans" fontSize="10">
            Day {d}
          </text>
        ))}

        {/* Area fill + line */}
        {slice.length > 1 && (
          <>
            <path
              d={`${pathD} L ${toX(slice.length)} ${toY(0)} L ${toX(1)} ${toY(0)} Z`}
              fill="var(--color-brand)" opacity="0.07"
            />
            <path d={pathD} fill="none" className="stroke-brand"
              strokeWidth="2.5" strokeLinejoin="round" />
            <circle cx={toX(slice.length)} cy={toY(lastVal)}
              r="4" className="fill-brand" />
          </>
        )}

        {/* End value on chart */}
        {slice.length > 0 && (
          <text x={toX(slice.length) + 8} y={toY(lastVal) + 4}
            className="fill-brand font-sans" fontSize="12" fontWeight="600">
            {fmt(lastVal)}
          </text>
        )}
      </svg>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// ZONE A: KPI CARDS (Results to Date)
// ═══════════════════════════════════════════════════════════════════════
function KPICard({ label, value, detail, highlight }) {
  return (
    <div className="bg-surface border border-border rounded-md p-4">
      <div className="text-[11px] font-semibold tracking-[0.05em] text-foreground-faint uppercase mb-2">
        {label}
      </div>
      <div className={cn(
        'text-[22px] font-bold tracking-tight',
        highlight ? 'text-foreground' : 'text-foreground'
      )}>
        {value}
      </div>
      {detail && (
        <div className="text-xs text-foreground-faint mt-1">{detail}</div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// ZONE A: COHORT CHART (Funnel Performance)
// ═══════════════════════════════════════════════════════════════════════
function CohortChart({ cohorts, currentDay }) {
  const width = 480;
  const height = 220;
  const pad = { top: 24, right: 16, bottom: 32, left: 44 };
  const cw = width - pad.left - pad.right;
  const ch = height - pad.top - pad.bottom;

  // Pick representative cohorts visible at the current day stop
  const repDays = [2, 5, 10, 15, 20, 25].filter(d => d <= currentDay && cohorts[d]);
  if (repDays.length === 0 && cohorts[1]) repDays.push(1);

  // Find max cumulative for Y scale
  let maxCum = 1;
  for (const d of repDays) {
    const curve = cohorts[d]?.cumulativeResolved || [];
    for (const v of curve) {
      if (v > maxCum) maxCum = v;
    }
  }
  maxCum = Math.ceil(maxCum / 5) * 5;

  // Color gradient: early cohorts lighter, later cohorts darker
  const cohortColors = [
    '#D1C8BE', '#A89E94', '#7D7368', '#6B5E54', '#4A3F37', '#2C2320',
  ];

  function toPoints(curve) {
    const maxDays = Math.min(curve.length, 14);
    return curve.slice(0, maxDays).map((v, i) => ({
      x: pad.left + (i / 13) * cw,
      y: pad.top + ch - (v / maxCum) * ch,
    }));
  }

  return (
    <div className="bg-surface border border-border rounded-lg p-4 h-full">
      <SectionLabel>Funnel Performance</SectionLabel>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
          const y = pad.top + ch * (1 - frac);
          return (
            <g key={i}>
              <line x1={pad.left} y1={y} x2={width - pad.right} y2={y}
                className="stroke-border-light" strokeWidth="1" />
              <text x={pad.left - 6} y={y + 3} textAnchor="end"
                className="fill-foreground-faint font-sans" fontSize="10">
                {Math.round(maxCum * frac)}
              </text>
            </g>
          );
        })}

        {/* X-axis labels */}
        {[0, 3, 7, 10, 14].map(d => (
          <text key={d} x={pad.left + (Math.min(d, 13) / 13) * cw} y={height - 6}
            textAnchor="middle" className="fill-foreground-faint font-sans" fontSize="10">
            +{d}d
          </text>
        ))}

        {/* Cohort lines */}
        {repDays.map((day, idx) => {
          const curve = cohorts[day]?.cumulativeResolved || [];
          const points = toPoints(curve);
          if (points.length < 2) return null;
          const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
          const color = cohortColors[Math.min(idx, cohortColors.length - 1)];
          const isLatest = idx === repDays.length - 1;
          return (
            <g key={day}>
              <path d={pathD} fill="none" stroke={color}
                strokeWidth={isLatest ? 2.5 : 1.5} strokeLinejoin="round"
                opacity={isLatest ? 1 : 0.7} />
              {/* End label */}
              {points.length > 0 && (
                <text x={points[points.length - 1].x + 4} y={points[points.length - 1].y + 3}
                  className="font-sans" fontSize="9" fill={color} fontWeight={isLatest ? 600 : 400}>
                  D{day}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-2">
        {repDays.map((day, idx) => {
          const color = cohortColors[Math.min(idx, cohortColors.length - 1)];
          const rate = cohorts[day]?.convRate || 0;
          return (
            <div key={day} className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
              <span className="text-[10px] text-foreground-faint">
                Day {day} ({rate.toFixed(1)}%)
              </span>
            </div>
          );
        })}
      </div>
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

// ═══════════════════════════════════════════════════════════════════════
// ZONE C: AGENTIC vs STATIC COMPARISON CHART
// ═══════════════════════════════════════════════════════════════════════
function ComparisonChart({ agenticCurve, staticCurve, annotations, currentDay }) {
  const width = 700;
  const height = 280;
  const pad = { top: 30, right: 80, bottom: 40, left: 50 };
  const cw = width - pad.left - pad.right;
  const ch = height - pad.top - pad.bottom;

  // Slice curves to current day
  const agSlice = agenticCurve.slice(0, currentDay);
  const stSlice = staticCurve.slice(0, currentDay);

  const maxVal = Math.max(
    ...agenticCurve,
    ...staticCurve,
    1
  );
  const yMax = Math.ceil(maxVal / 200) * 200;

  function toX(day) { return pad.left + ((day - 1) / 29) * cw; }
  function toY(val) { return pad.top + ch - (val / yMax) * ch; }

  function buildPath(data) {
    return data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i + 1)} ${toY(v)}`).join(' ');
  }

  const agPath = buildPath(agSlice);
  const stPath = buildPath(stSlice);

  // Active annotations (up to current day)
  const activeAnnotations = (annotations || []).filter(a => a.day <= currentDay);

  return (
    <div className="bg-surface border border-border rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <SectionLabel>Agentic vs Static Execution</SectionLabel>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-brand rounded-full" />
            <span className="text-[11px] text-foreground-muted">Vincor Agent</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-gray-300 rounded-full" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #D1C8BE, #D1C8BE 3px, transparent 3px, transparent 6px)' }} />
            <span className="text-[11px] text-foreground-muted">Static Rules</span>
          </div>
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        {/* Grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
          const y = toY(yMax * frac);
          return (
            <g key={i}>
              <line x1={pad.left} y1={y} x2={width - pad.right} y2={y}
                className="stroke-border-light" strokeWidth="1" />
              <text x={pad.left - 8} y={y + 3} textAnchor="end"
                className="fill-foreground-faint font-sans" fontSize="10">
                {fmt(Math.round(yMax * frac))}
              </text>
            </g>
          );
        })}

        {/* X-axis */}
        {[1, 5, 10, 15, 20, 25, 30].map(day => (
          <text key={day} x={toX(day)} y={height - 8} textAnchor="middle"
            className="fill-foreground-faint font-sans" fontSize="10">
            {day}
          </text>
        ))}
        <text x={pad.left + cw / 2} y={height} textAnchor="middle"
          className="fill-foreground-faint font-sans" fontSize="9">
          Day
        </text>

        {/* Static line (dashed, gray) */}
        {stSlice.length > 1 && (
          <path d={stPath} fill="none" stroke="#D1C8BE" strokeWidth="1.5"
            strokeDasharray="4,3" strokeLinejoin="round" />
        )}

        {/* Agentic line (solid, brand) */}
        {agSlice.length > 1 && (
          <>
            {/* Area fill */}
            <path d={`${agPath} L ${toX(agSlice.length)} ${toY(0)} L ${toX(1)} ${toY(0)} Z`}
              fill="var(--color-brand)" opacity="0.06" />
            <path d={agPath} fill="none" className="stroke-brand" strokeWidth="2.5" strokeLinejoin="round" />
            {/* End dot */}
            <circle cx={toX(agSlice.length)} cy={toY(agSlice[agSlice.length - 1])}
              r="4" className="fill-brand" />
          </>
        )}

        {/* Current day marker */}
        <line x1={toX(currentDay)} y1={pad.top} x2={toX(currentDay)} y2={pad.top + ch}
          stroke="var(--color-foreground-faint)" strokeWidth="1" strokeDasharray="2,3" opacity="0.4" />

        {/* End labels */}
        {agSlice.length > 0 && (
          <text x={toX(agSlice.length) + 6} y={toY(agSlice[agSlice.length - 1]) + 4}
            className="fill-brand font-sans" fontSize="11" fontWeight="600">
            {fmt(agSlice[agSlice.length - 1])}
          </text>
        )}
        {stSlice.length > 0 && (
          <text x={toX(stSlice.length) + 6} y={toY(stSlice[stSlice.length - 1]) + 4}
            className="fill-foreground-faint font-sans" fontSize="11">
            {fmt(stSlice[stSlice.length - 1])}
          </text>
        )}

        {/* Annotation markers */}
        {activeAnnotations.map((a, i) => {
          const agVal = agSlice[a.day - 1] || 0;
          return (
            <g key={i}>
              <circle cx={toX(a.day)} cy={toY(agVal)} r="6"
                fill="var(--color-brand)" opacity="0.15" />
              <circle cx={toX(a.day)} cy={toY(agVal)} r="2.5"
                fill="var(--color-brand)" />
            </g>
          );
        })}
      </svg>

      {/* Annotations list */}
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
    // Show decisions from a window around the selected day
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
      {/* Header: Logo + Day Selector */}
      <header className="flex items-center justify-between py-2.5 mb-6">
        <Logo variant="mark" onClick={onHome} />
        <DaySelector
          selected={selectedDay}
          onSelect={setSelectedDay}
          thresholdDay={projection.thresholdDay}
        />
      </header>

      <main className="flex-1 pb-16">
        {/* ── POSITION 1: RESULTS ── */}
        {/* Top row: Vertical Funnel (left) + Hero Chart (right) */}
        <div className="grid grid-cols-[280px_1fr] gap-6 mb-6">
          <VerticalFunnel
            data={dayData.funnelCumulative}
            audienceSize={projection.audienceSize}
          />
          <ActiveUsersChart
            cumulativeCurve={projection.cumulativeCurve}
            currentDay={selectedDay}
          />
        </div>

        {/* KPIs + Funnel Performance (cohort chart) */}
        <div className="grid grid-cols-[1fr_1.5fr] gap-6 mb-6">
          <div>
            <SectionLabel>Results to Date</SectionLabel>
            <div className="grid grid-cols-3 gap-3">
              <KPICard
                label="CAC"
                value={dayData.kpiCumulative.cac > 0 ? fmtDollar(dayData.kpiCumulative.cac) : '—'}
                detail={dayData.kpiCumulative.cac > 0 ? `$${fmtK(dayData.cumulativeValue)} revenue` : 'Awaiting conversions'}
              />
              <KPICard
                label="ROI"
                value={dayData.kpiCumulative.roi > 0 ? `${dayData.kpiCumulative.roi}x` : '—'}
                detail={dayData.kpiCumulative.roi > 0 ? `$${fmtK(dayData.cumulativeSpend)} spend` : 'Awaiting conversions'}
              />
              <KPICard
                label="Fraud Saved"
                value={fmtDollar(dayData.kpiCumulative.fraudSaved)}
              />
            </div>
          </div>
          <CohortChart
            cohorts={projection.cohorts}
            currentDay={selectedDay}
          />
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
