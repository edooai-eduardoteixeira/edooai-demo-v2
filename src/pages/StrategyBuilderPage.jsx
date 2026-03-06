import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import Logo from '../components/Logo.jsx';
import CTAButton from '../components/CTAButton.jsx';
import AnimatedNumber from '../components/AnimatedNumber.jsx';
import Tooltip from '../components/Tooltip.jsx';
import { useProjections } from '../hooks/useProjections.js';
import StrategyCards from '../components/StrategyCards.jsx';
import WhatUsersSee from '../components/WhatUsersSee.jsx';

/* ───────── Sparkline helpers ───────── */

/* 3-point moving average: smooths day-to-day noise, highlights trend */
function smooth(arr) {
  if (arr.length < 3) return arr;
  return arr.map((v, i) => {
    if (i === 0) return (arr[0] + arr[1]) / 2;
    if (i === arr.length - 1) return (arr[i - 1] + arr[i]) / 2;
    return (arr[i - 1] + arr[i] + arr[i + 1]) / 3;
  });
}

/* Green if KPI is improving, red if worsening.
   invertGood = true means lower values are better (e.g. CAC). */
function sparkColor(arr, invertGood = false, startDay = 0) {
  const data = startDay > 0 ? arr.slice(startDay - 1) : arr;
  if (!data || data.length < 2) return 'var(--text-tertiary)';
  const midIdx = Math.floor(data.length * 0.6);
  const mid = data[midIdx];
  const end = data[data.length - 1];
  if (mid === 0 && end === 0) return 'var(--text-tertiary)';
  const improving = invertGood ? (end <= mid) : (end >= mid);
  return improving ? 'var(--success)' : 'var(--danger)';
}

/* Returns [{x, y}] for SVG polyline + trailing dot (viewBox 0 0 60 16).
   startDay = thresholdDay for KPI curves, 0 for headline. */
function sparkPointsData(arr, startDay = 0) {
  const fallback = [{ x: 2, y: 8 }, { x: 58, y: 8 }];
  if (!arr || arr.length === 0) return fallback;

  const data = startDay > 0 ? arr.slice(startDay - 1) : arr.filter((_, i) => i === 0 || arr[i] !== 0 || arr[i - 1] !== 0);
  if (data.length < 2) return fallback;

  const smoothed = smooth(data);
  const min = Math.min(...smoothed);
  const max = Math.max(...smoothed);
  const range = max - min || 1;

  return smoothed
    .filter((_, i) => i % 3 === 0 || i === smoothed.length - 1)
    .map((v, i, sampled) => {
      const x = 2 + (i / (sampled.length - 1)) * 56;
      const norm = (v - min) / range;
      const y = 14 - norm * 12;
      return { x: +x.toFixed(1), y: +y.toFixed(1) };
    });
}

/* Y-coordinate for a horizontal reference line inside the sparkline viewBox (0 0 60 16).
   Uses the same smoothing & normalization as sparkPointsData so the line aligns. */
function sparkRefY(arr, refValue, startDay = 0) {
  if (!arr || arr.length === 0 || refValue == null) return null;
  const data = startDay > 0 ? arr.slice(startDay - 1) : arr.filter((_, i) => i === 0 || arr[i] !== 0 || arr[i - 1] !== 0);
  if (data.length < 2) return null;
  const smoothed = smooth(data);
  const min = Math.min(...smoothed);
  const max = Math.max(...smoothed);
  const range = max - min || 1;
  const norm = Math.max(0, Math.min(1, (refValue - min) / range));
  return +(14 - norm * 12).toFixed(1);
}

/* Format a KPI value for "Trending to" labels */
function formatTrend(key, value) {
  if (value == null || isNaN(value)) return '—';
  switch (key) {
    case 'cac': return `$${Math.round(value)}`;
    case 'roi': return `${(Math.round(value * 10) / 10).toFixed(1)}x`;
    case 'convRate': return `${(Math.round(value * 10) / 10).toFixed(1)}%`;
    case 'fraudSaved': return `$${Math.round(value / 1000)}K`;
    case 'activeUsers': return String(Math.round(value));
    default: return String(Math.round(value));
  }
}

/* ───────── KPI Card ───────── */
function KPICard({ label, children }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: '120px',
        padding: '1rem',
        backgroundColor: 'var(--accent-subtle)',
        borderRadius: 'var(--radius-lg)',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: 'var(--font-size-xs)',
          fontWeight: 500,
          color: 'var(--text-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '0.375rem',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 'var(--font-size-xl)',
          fontWeight: 700,
          color: 'var(--text-primary)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ───────── Operations Cycle Step ───────── */
/* ═════════════════════════════════════════════════════════
   Main Page Component
   ═════════════════════════════════════════════════════════ */
export default function StrategyBuilderPage({ config, onNext }) {
  const {
    strategy,
    budgetSlider,
    recommendedBudget,
    budgetGuidance,
    engineParams,
    approvalScope,
    totalCustomers,
  } = config;

  /* ── Budget + engine projections ── */
  const [budget, setBudget] = useState(budgetSlider.default);
  const proj = useProjections(engineParams, budget);



  // Destructure engine outputs
  const {
    dailyCurve,
    thresholdDay,
    activeUsers,
    cac,
    roi,
    convRate,
    fraudSaved,
    guidanceState,
    totalJourneysStarted,
    dailyJourneyTarget,
    avgValuePerUser,
    kpiCurves,
    dailyKPIs,
  } = proj || {};

  /* ── Editable budget number ── */
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  const budgetInputRef = useRef(null);

  const startEditBudget = () => {
    setBudgetInput(String(budget / 1000));
    setEditingBudget(true);
    setTimeout(() => budgetInputRef.current?.select(), 0);
  };

  const commitBudget = () => {
    const val = Math.round(Number(budgetInput) * 1000);
    if (!isNaN(val) && val >= budgetSlider.min && val <= budgetSlider.max) {
      setBudget(Math.round(val / budgetSlider.step) * budgetSlider.step);
    }
    setEditingBudget(false);
  };

  /* ── Guidance message from engine state ── */
  const guidanceMessage = budgetGuidance && guidanceState
    ? budgetGuidance[guidanceState] || ''
    : '';

  /* ── Recommended zone position on slider (%) ── */
  const recZoneLeft = recommendedBudget?.min
    ? ((recommendedBudget.min - budgetSlider.min) / (budgetSlider.max - budgetSlider.min)) * 100
    : 60;
  const recZoneWidth = recommendedBudget?.max
    ? ((recommendedBudget.max - recommendedBudget.min) / (budgetSlider.max - budgetSlider.min)) * 100
    : 20;
  const sliderPercent = ((budget - budgetSlider.min) / (budgetSlider.max - budgetSlider.min)) * 100;

  const td = thresholdDay; // alias for sparkline trust-period start

  /* ── Progressive reveal ── */
  const [showResult, setShowResult] = useState(false);
  const [showJourney, setShowJourney] = useState(false);
  const [showRisk, setShowRisk] = useState(false);
  const [showCTA, setShowCTA] = useState(false);

  const [hoveredDay, setHoveredDay] = useState(null);
  const [hoveredSparkline, setHoveredSparkline] = useState(null);

  const cancelRef = useRef(false);
  const hasStartedRef = useRef(false);

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const runReveal = useCallback(async () => {
    if (cancelRef.current) return;

    setShowResult(true);
    await sleep(500);
    if (cancelRef.current) return;

    setShowJourney(true);
    await sleep(400);
    if (cancelRef.current) return;

    setShowRisk(true);
    await sleep(300);
    if (cancelRef.current) return;

    setShowCTA(true);
  }, []);

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    cancelRef.current = false;
    runReveal();
    return () => {
      cancelRef.current = true;
    };
  }, []);

  const formatCurrency = (val) => '$' + val.toLocaleString('en-US');

  /* ═══════ RENDER ═══════ */
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header
        style={{
          padding: '1.5rem 3rem',
          borderBottom: '1px solid var(--border-light)',
        }}
      >
        <Logo />
      </header>

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          padding: '2rem 3rem 6rem',
          maxWidth: '1100px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        {/* ════════════════════════════════════════════
            SECTION 1 — Forecast Panel (Budget + Result + Chart)
            Redesigned: v12 wireframe with real logic
            ════════════════════════════════════════════ */}
        {showResult && (
          <section
            style={{
              marginBottom: 48,
              animation: 'fadeIn 0.4s ease forwards',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
            }}
          >
            {/* ── Forecast panel: 2×2 grid — shared row boundary aligns separator lines ── */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '380px 1fr',
              gridTemplateRows: 'auto auto',
            }}>

              {/* Cell 1: Top-left — budget label + number */}
              <div style={{
                padding: '32px 28px 16px',
                borderRight: '1px solid var(--border-light)',
                display: 'flex',
                flexDirection: 'column',
              }}>
                <div style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: 'var(--text-tertiary)',
                }}>
                  Monthly budget
                </div>

                {/* Budget number — inline editable, $ and K are always visible as mask */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 0,
                    marginTop: 8,
                    cursor: 'text',
                  }}
                  onClick={!editingBudget ? startEditBudget : undefined}
                >
                  <span style={{
                    fontSize: 40,
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    lineHeight: 1,
                  }}>$</span>
                  {editingBudget ? (
                    <input
                      ref={budgetInputRef}
                      type="text"
                      inputMode="numeric"
                      value={budgetInput}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^0-9]/g, '');
                        setBudgetInput(v);
                      }}
                      onBlur={commitBudget}
                      onKeyDown={(e) => e.key === 'Enter' && commitBudget()}
                      style={{
                        fontSize: 40,
                        fontWeight: 500,
                        letterSpacing: '-0.02em',
                        color: 'var(--text-primary)',
                        lineHeight: 1,
                        border: 'none',
                        outline: 'none',
                        background: '#ececec',
                        padding: '2px 4px 3px 2px',
                        borderRadius: 4,
                        width: `${Math.max(2, String(budgetInput).length) * 0.6}em`,
                        fontFamily: 'inherit',
                        margin: 0,
                        textDecoration: 'underline',
                        textDecorationStyle: 'solid',
                        textDecorationColor: 'var(--accent)',
                        textDecorationThickness: '2px',
                        textUnderlineOffset: '4px',
                      }}
                    />
                  ) : (
                    <span style={{
                      fontSize: 40,
                      fontWeight: 500,
                      letterSpacing: '-0.02em',
                      color: 'var(--text-primary)',
                      lineHeight: 1,
                      cursor: 'pointer',
                      background: '#ececec',
                      padding: '2px 4px 3px 2px',
                      borderRadius: 4,
                      textDecoration: 'underline',
                      textDecorationStyle: 'dashed',
                      textDecorationColor: 'var(--color-gray-400)',
                      textDecorationThickness: '2px',
                      textUnderlineOffset: '4px',
                    }}>
                      {Math.round(budget / 1000)}
                    </span>
                  )}
                  <span style={{
                    fontSize: 40,
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    lineHeight: 1,
                  }}>K</span>
                  <span style={{
                    fontSize: 15,
                    color: 'var(--text-tertiary)',
                    fontWeight: 500,
                    marginLeft: 6,
                  }}>/mo</span>
                </div>

                {/* Recommended zone label — pushed to bottom via marginTop auto */}
                <div style={{
                  marginTop: 'auto',
                  paddingLeft: `${recZoneLeft}%`,
                }}>
                  <div style={{
                    width: `${recZoneWidth}%`,
                    textAlign: 'center',
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--text-tertiary)',
                    letterSpacing: '0.04em',
                  }}>
                    Recommended
                  </div>
                </div>
              </div>

              {/* Cell 2: Top-right — headline number */}
              <div style={{ padding: '32px 28px 16px' }}>
                <div style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: 'var(--text-tertiary)',
                }}>
                  First 30 days
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    fontSize: 64,
                    fontWeight: 800,
                    letterSpacing: '-0.03em',
                    color: 'var(--text-primary)',
                    lineHeight: 1,
                    marginTop: 6,
                  }}>
                    <AnimatedNumber value={activeUsers} duration={300} />
                  </div>
                  {dailyCurve && (() => {
                    const pts = sparkPointsData(dailyCurve, td);
                    const last = pts[pts.length - 1];
                    return (
                      <span
                        onMouseEnter={() => setHoveredSparkline('headline')}
                        onMouseLeave={() => setHoveredSparkline(null)}
                        style={{ display: 'inline-flex', alignItems: 'center', cursor: 'default' }}
                      >
                        <svg width="64" height="24" viewBox="0 0 60 16" style={{ marginTop: 8 }}>
                          {(() => {
                            const refY = sparkRefY(dailyCurve, activeUsers / 30, td);
                            return refY != null ? (
                              <line x1="2" y1={refY} x2="58" y2={refY}
                                stroke="var(--text-tertiary)" strokeWidth="0.6"
                                strokeDasharray="2 2" opacity="0.55" />
                            ) : null;
                          })()}
                          <polyline
                            points={pts.map(p => `${p.x},${p.y}`).join(' ')}
                            fill="none"
                            stroke="var(--success)"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <circle cx={last.x} cy={last.y} r="2.5" fill="var(--success)" />
                        </svg>
                      </span>
                    );
                  })()}
                  {hoveredSparkline === 'headline' && dailyCurve && dailyCurve.length > 0 && (() => {
                    const lastDay = dailyCurve[dailyCurve.length - 1];
                    const trendTo = Math.round(lastDay * 30);
                    return (
                      <span style={{
                        fontSize: 12,
                        fontWeight: 500,
                        color: 'var(--text-tertiary)',
                        whiteSpace: 'nowrap',
                      }}>
                        Trending to {formatTrend('activeUsers', trendTo)}/mo
                      </span>
                    );
                  })()}
                </div>

                <div style={{
                  fontSize: 14,
                  color: 'var(--text-secondary)',
                  marginTop: 4,
                }}>
                  new active users
                </div>
              </div>

              {/* Cell 3: Bottom-left — slider + guidance */}
              <div style={{
                padding: '0 28px 32px',
                borderRight: '1px solid var(--border-light)',
              }}>
                {/* Track + input wrapper — marginTop: -7 aligns track (at top:7) with Cell 4 borderTop */}
                <div style={{ position: 'relative', height: 20, marginTop: -7 }}>
                  {/* Track background */}
                  <div style={{
                    position: 'absolute',
                    top: 7,
                    left: 0,
                    right: 0,
                    height: 6,
                    background: 'var(--border-light)',
                    borderRadius: 3,
                  }} />

                  {/* Recommended zone band */}
                  <div style={{
                    position: 'absolute',
                    left: `${recZoneLeft}%`,
                    width: `${recZoneWidth}%`,
                    top: 3,
                    height: 14,
                    background: 'var(--color-gray-300)',
                    borderRadius: 7,
                    zIndex: 0,
                  }} />

                  {/* Fill */}
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 7,
                    width: `${sliderPercent}%`,
                    height: 6,
                    background: 'var(--accent)',
                    borderRadius: 3,
                    zIndex: 1,
                  }} />

                  {/* Thumb */}
                  <div style={{
                    position: 'absolute',
                    left: `${sliderPercent}%`,
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 20,
                    height: 20,
                    background: 'var(--accent)',
                    border: '3px solid var(--surface)',
                    borderRadius: '50%',
                    cursor: 'grab',
                    zIndex: 3,
                    boxShadow: 'var(--shadow-md)',
                  }} />

                  {/* Invisible range input */}
                  <input
                    type="range"
                    min={budgetSlider.min}
                    max={budgetSlider.max}
                    step={budgetSlider.step}
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      opacity: 0,
                      cursor: 'pointer',
                      zIndex: 4,
                    }}
                  />
                </div>

                {/* Bounds */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: 8,
                  fontSize: 11,
                  color: 'var(--text-tertiary)',
                }}>
                  <span>${Math.round(budgetSlider.min / 1000)}K</span>
                  <span>${Math.round(budgetSlider.max / 1000)}K</span>
                </div>

                {/* Guidance note */}
                <div style={{
                  marginTop: 20,
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.55,
                }}>
                  {guidanceMessage}
                </div>
              </div>

              {/* Cell 4: Bottom-right — KPI grid */}
              <div style={{
                padding: '14px 28px 32px',
                borderTop: '1px solid var(--border-light)',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px 20px',
              }}>
                  {[
                    { key: 'cac', label: 'Avg CAC', value: `$${cac}`, curve: dailyKPIs?.cac, invertGood: true, refValue: cac,
                      desc: 'Customer Acquisition Cost — total spend divided by new active users. Lower is better.' },
                    { key: 'roi', label: 'ROI', value: `${typeof roi === 'number' ? roi.toFixed(1) : roi}x`, curve: dailyKPIs?.roi, invertGood: false, refValue: roi,
                      desc: 'Return on Investment — revenue generated by referred users divided by campaign spend.' },
                    { key: 'convRate', label: 'Conv rate', value: `${typeof convRate === 'number' ? convRate.toFixed(1) : convRate}%`, curve: dailyKPIs?.convRate, invertGood: false, refValue: convRate,
                      desc: 'Conversion Rate — percentage of contacted users who completed the referral journey.' },
                    { key: 'fraudSaved', label: 'Fraud saved', value: `$${Math.round((fraudSaved || 0) / 1000)}K`, curve: dailyKPIs?.fraudSaved, invertGood: false, refValue: (fraudSaved || 0) / 30,
                      desc: "Estimated fraud prevention savings from EdooAI's verification layer." },
                  ].map((kpi) => {
                    const pts = kpi.curve ? sparkPointsData(kpi.curve, td) : null;
                    const last = pts ? pts[pts.length - 1] : null;
                    const color = kpi.curve ? sparkColor(kpi.curve, kpi.invertGood, td) : 'var(--text-tertiary)';

                    /* Trending-to: rates use last daily value, accumulations use × 30 */
                    let trendLabel = null;
                    if (kpi.curve && kpi.curve.length > 0) {
                      const lastVal = kpi.curve[kpi.curve.length - 1];
                      if (lastVal > 0) {
                        const trendVal = kpi.key === 'fraudSaved' ? lastVal * 30 : lastVal;
                        trendLabel = `Trending to ${formatTrend(kpi.key, trendVal)}`;
                      }
                    }

                    return (
                    <div key={kpi.key} style={{ position: 'relative' }}>
                      {/* Label (hover-underline tooltip) */}
                      <div style={{
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        color: 'var(--text-tertiary)',
                      }}>
                        <Tooltip text={kpi.desc} underline>
                          <span>{kpi.label}</span>
                        </Tooltip>
                      </div>
                      {/* Value + sparkline + trending-to (all inline) */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        marginTop: 2,
                      }}>
                        <span style={{
                          fontSize: 16,
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                        }}>
                          {kpi.value}
                        </span>
                        {pts && last && (
                          <span
                            onMouseEnter={() => setHoveredSparkline(kpi.key)}
                            onMouseLeave={() => setHoveredSparkline(null)}
                            style={{ display: 'inline-flex', alignItems: 'center', cursor: 'default' }}
                          >
                            <svg width="60" height="16" viewBox="0 0 60 16">
                              {(() => {
                                const refY = sparkRefY(kpi.curve, kpi.refValue, td);
                                return refY != null ? (
                                  <line x1="2" y1={refY} x2="58" y2={refY}
                                    stroke="var(--text-tertiary)" strokeWidth="0.5"
                                    strokeDasharray="2 2" opacity="0.45" />
                                ) : null;
                              })()}
                              <polyline
                                points={pts.map(p => `${p.x},${p.y}`).join(' ')}
                                fill="none"
                                stroke={color}
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <circle cx={last.x} cy={last.y} r="2" fill={color} />
                            </svg>
                          </span>
                        )}
                        {hoveredSparkline === kpi.key && trendLabel && (
                          <span style={{
                            fontSize: 11,
                            fontWeight: 500,
                            color: 'var(--text-tertiary)',
                          }}>
                            {trendLabel}
                          </span>
                        )}
                      </div>
                    </div>
                    );
                  })}
              </div>
            </div>

            {/* ── Daily new users chart ── */}
            {dailyCurve && (
              <div style={{
                padding: '20px 16px 16px',
                borderTop: '1px solid var(--border-light)',
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  padding: '0 12px',
                }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Daily new active users
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                    Projected · 30 days
                  </span>
                </div>

                <div style={{ marginTop: 14, height: 260, position: 'relative' }}>
                  <svg
                    viewBox="0 0 780 240"
                    preserveAspectRatio="xMidYMid meet"
                    style={{ width: '100%', height: '100%', display: 'block' }}
                  >
                    <defs>
                      {(() => {
                        // Threshold X position
                        const threshX = 30 + ((thresholdDay - 1) / 29) * 730;
                        return (
                          <>
                            <linearGradient id="curveGrad" x1={threshX} y1="0" x2="760" y2="0" gradientUnits="userSpaceOnUse">
                              <stop offset="0%" stopColor="var(--color-gray-400)" />
                              <stop offset="25%" stopColor="var(--color-gray-500)" />
                              <stop offset="55%" stopColor="var(--color-gray-700)" />
                              <stop offset="100%" stopColor="var(--text-primary)" />
                            </linearGradient>
                            <linearGradient id="areaGradPost" x1={threshX} y1="0" x2="760" y2="0" gradientUnits="userSpaceOnUse">
                              <stop offset="0%" stopColor="var(--color-gray-300)" stopOpacity="0.04" />
                              <stop offset="100%" stopColor="var(--text-primary)" stopOpacity="0.07" />
                            </linearGradient>
                            <clipPath id="clipPost">
                              <rect x={threshX} y="0" width={760 - threshX} height="240" />
                            </clipPath>
                            <clipPath id="clipPre">
                              <rect x="0" y="0" width={threshX} height="240" />
                            </clipPath>
                          </>
                        );
                      })()}
                    </defs>

                    {/* Pre-threshold background wash */}
                    {(() => {
                      const threshX = 30 + ((thresholdDay - 1) / 29) * 730;
                      return <rect x="30" y="10" width={threshX - 30} height="190" fill="var(--accent-subtle)" />;
                    })()}

                    {/* Grid lines */}
                    {[30, 70, 110, 150, 195].map((y) => (
                      <line key={y} x1="30" y1={y} x2="760" y2={y} stroke="var(--border-light)" strokeWidth="1" />
                    ))}

                    {/* Y-axis labels */}
                    {(() => {
                      const maxVal = Math.max(...dailyCurve) + 2;
                      const step = Math.ceil(maxVal / 4);
                      return [0, step, step * 2, step * 3, step * 4].map((v, i) => (
                        <text
                          key={i}
                          x="24"
                          y={199 - i * 41}
                          fontSize="11"
                          fill="var(--text-tertiary)"
                          textAnchor="end"
                          fontFamily="var(--font-family)"
                        >
                          {v}
                        </text>
                      ));
                    })()}

                    {/* X-axis */}
                    <line x1="30" y1="195" x2="760" y2="195" stroke="var(--border)" strokeWidth="1" />
                    {[1, 5, 10, 15, 20, 25, 30].map((d) => {
                      const x = 30 + ((d - 1) / 29) * 730;
                      return (
                        <text
                          key={d}
                          x={x}
                          y="214"
                          fontSize="11"
                          fill="var(--text-tertiary)"
                          textAnchor="middle"
                          fontFamily="var(--font-family)"
                        >
                          {d}
                        </text>
                      );
                    })}
                    <text x="395" y="232" fontSize="11" fill="var(--text-tertiary)" textAnchor="middle" fontFamily="var(--font-family)">Day</text>

                    {/* Build SVG path from daily data */}
                    {(() => {
                      const maxVal = Math.max(...dailyCurve) + 2;
                      const chartLeft = 30, chartRight = 760, chartBottom = 195, chartTop = 15;
                      const chartW = chartRight - chartLeft, chartH = chartBottom - chartTop;
                      const points = dailyCurve.map((v, i) => {
                        const x = chartLeft + (i / 29) * chartW;
                        const y = chartBottom - (v / maxVal) * chartH;
                        return `${x},${y}`;
                      });
                      const pathD = `M${points[0]} ${points.slice(1).map((p) => `L${p}`).join(' ')}`;
                      const areaD = `${pathD} L${chartRight},${chartBottom} L${chartLeft},${chartBottom} Z`;
                      const lastPoint = points[points.length - 1].split(',');
                      const lastVal = dailyCurve[dailyCurve.length - 1];

                      return (
                        <>
                          {/* Area fill pre-threshold */}
                          <path d={areaD} fill="var(--accent-subtle)" clipPath="url(#clipPre)" opacity="0.5" />

                          {/* Area fill post-threshold */}
                          <path d={areaD} fill="url(#areaGradPost)" clipPath="url(#clipPost)" />

                          {/* Curve pre-threshold (flat light) */}
                          <path d={pathD} fill="none" stroke="var(--color-gray-200)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" clipPath="url(#clipPre)" />

                          {/* Curve post-threshold (gradient) */}
                          <path d={pathD} fill="none" stroke="url(#curveGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" clipPath="url(#clipPost)" />

                          {/* Hover overlay for tooltip */}
                          <rect
                            x={chartLeft} y={chartTop}
                            width={chartW} height={chartH}
                            fill="transparent"
                            style={{ cursor: 'crosshair' }}
                            onMouseMove={(e) => {
                              const svg = e.currentTarget.closest('svg');
                              const pt = svg.createSVGPoint();
                              pt.x = e.clientX; pt.y = e.clientY;
                              const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
                              const dayIdx = Math.round(((svgP.x - chartLeft) / chartW) * 29);
                              const clamped = Math.max(0, Math.min(29, dayIdx));
                              setHoveredDay({ day: clamped + 1, value: dailyCurve[clamped], x: chartLeft + (clamped / 29) * chartW, y: chartBottom - (dailyCurve[clamped] / maxVal) * chartH });
                            }}
                            onMouseLeave={() => setHoveredDay(null)}
                          />

                          {/* Tooltip */}
                          {hoveredDay && (
                            <>
                              <line x1={hoveredDay.x} y1={chartTop} x2={hoveredDay.x} y2={chartBottom} stroke="var(--text-tertiary)" strokeWidth="1" strokeDasharray="3,3" opacity="0.5" />
                              <circle cx={hoveredDay.x} cy={hoveredDay.y} r="4" fill="var(--text-primary)" stroke="white" strokeWidth="2" />
                              <rect
                                x={hoveredDay.x - 36} y={hoveredDay.y - 32}
                                width="72" height="22" rx="4"
                                fill="var(--text-primary)"
                              />
                              <text
                                x={hoveredDay.x} y={hoveredDay.y - 17}
                                fontSize="11" fontWeight="600" fill="white"
                                textAnchor="middle" fontFamily="var(--font-family)"
                              >
                                Day {hoveredDay.day}: {hoveredDay.value}
                              </text>
                            </>
                          )}

                          {/* Endpoint */}
                          <circle cx={lastPoint[0]} cy={lastPoint[1]} r="3.5" fill="var(--text-primary)" />
                          <text
                            x={Number(lastPoint[0])}
                            y={Number(lastPoint[1]) - 10}
                            fontSize="11"
                            fill="var(--text-primary)"
                            fontWeight="600"
                            textAnchor="end"
                            fontFamily="var(--font-family)"
                          >
                            {lastVal}/day
                          </text>
                        </>
                      );
                    })()}
                  </svg>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ════════════════════════════════════════════
            SECTION 2 — What Users See (Redesigned)
            ════════════════════════════════════════════ */}
        {showJourney && (
          <section
            style={{
              marginBottom: '3rem',
              animation: 'fadeIn 0.4s ease forwards',
            }}
          >
            <WhatUsersSee />
          </section>
        )}

        {/* ════════════════════════════════════════════
            SECTION 3 — Strategy & Guardrails Cards
            ════════════════════════════════════════════ */}
        {showRisk && (
          <section
            style={{
              marginBottom: '2rem',
              animation: 'fadeIn 0.4s ease forwards',
            }}
          >
            <StrategyCards />
          </section>
        )}
        {/* ── Approve button (fixed at end of content) ── */}
        {showCTA && (
          <div
            style={{
              borderTop: '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
              padding: '1.25rem 3rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <CTAButton onClick={onNext}>Launch Campaigns</CTAButton>
            <p
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--text-tertiary)',
                margin: 0,
                textAlign: 'center',
              }}
            >
              {approvalScope}
            </p>
          </div>
        )}
      </main>

      <style>{`
        @keyframes blink { 50% { opacity: 0; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
