import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import Logo from '../components/Logo.jsx';
import CTAButton from '../components/CTAButton.jsx';
import AnimatedNumber from '../components/AnimatedNumber.jsx';
import Tooltip from '../components/Tooltip.jsx';
import { useProjections } from '../hooks/useProjections.js';
import tl from '../styles/StrategyTimeline.module.css';

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
function CycleStep({ step, index, total }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        padding: '0.75rem 0',
        borderBottom: index < total - 1 ? '1px solid var(--border-light)' : 'none',
      }}
    >
      <span
        style={{
          fontSize: 'var(--font-size-sm)',
          fontWeight: 700,
          color: 'var(--text-primary)',
          minWidth: '70px',
          flexShrink: 0,
        }}
      >
        {step.name}
      </span>
      <span
        style={{
          fontSize: 'var(--font-size-sm)',
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
        }}
      >
        {step.description}
      </span>
    </div>
  );
}

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
    operationsCycle,
    riskManagement,
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
  const [showExecution, setShowExecution] = useState(false);
  const [showRisk, setShowRisk] = useState(false);
  const [showCTA, setShowCTA] = useState(false);

  /* ── Timeline dropdown state ── */
  const [s1Combo, setS1Combo] = useState({ msg: 'ask', ch: 'push' });
  const [s3Combo, setS3Combo] = useState({ msg: 'success', ch: 'push' });
  const [openDD, setOpenDD] = useState(null);
  const [hoveredDay, setHoveredDay] = useState(null);
  const [hoveredSparkline, setHoveredSparkline] = useState(null);
  const timelineRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (timelineRef.current && !e.target.closest(`.${tl.ddWrap}`)) {
        setOpenDD(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const selectCombo = (step, msg, ch) => {
    if (step === 's1') setS1Combo({ msg, ch });
    else setS3Combo({ msg, ch });
    setOpenDD(null);
  };

  const comboLabel = (msg, ch) =>
    msg.charAt(0).toUpperCase() + msg.slice(1) + ' \u00b7 ' + ch.charAt(0).toUpperCase() + ch.slice(1).toLowerCase();

  const [lines, setLines] = useState([]);
  const [currentText, setCurrentText] = useState('');

  const cancelRef = useRef(false);
  const hasStartedRef = useRef(false);

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const streamText = useCallback(async (text, duration) => {
    const charDelay = duration / text.length;
    let built = '';
    for (let i = 0; i < text.length; i++) {
      if (cancelRef.current) return;
      built += text[i];
      setCurrentText(built);
      await new Promise((r) => setTimeout(r, charDelay));
    }
    setLines((prev) => [...prev, text]);
    setCurrentText('');
  }, []);

  const runReveal = useCallback(async () => {
    await streamText('Analyzing your data to propose Referral Strategy and Execution Plan...', 1600);
    await sleep(400);
    if (cancelRef.current) return;

    setShowResult(true);
    await sleep(500);
    if (cancelRef.current) return;

    setShowJourney(true);
    await sleep(400);
    if (cancelRef.current) return;

    setShowExecution(true);
    await sleep(400);
    if (cancelRef.current) return;

    setShowRisk(true);
    await sleep(300);
    if (cancelRef.current) return;

    setShowCTA(true);
  }, [streamText]);

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
        {/* ── Streaming text ── */}
        <div style={{ minHeight: '50px', marginBottom: '1.5rem' }}>
          {lines.map((line, i) => (
            <p
              key={i}
              style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                margin: 0,
                marginBottom: '4px',
              }}
            >
              {line}
            </p>
          ))}
          {currentText && (
            <p
              style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              {currentText}
              <span
                style={{
                  display: 'inline-block',
                  width: '2px',
                  height: '1em',
                  backgroundColor: 'var(--text-secondary)',
                  marginLeft: '2px',
                  animation: 'blink 1s step-end infinite',
                  verticalAlign: 'text-bottom',
                }}
              />
            </p>
          )}
        </div>

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
                </div>

                <div style={{
                  fontSize: 14,
                  color: 'var(--text-secondary)',
                  marginTop: 4,
                }}>
                  new active users
                </div>

                {/* Trending-to: last-day run rate projected to 30 days — visible on sparkline hover */}
                {hoveredSparkline === 'headline' && dailyCurve && dailyCurve.length > 0 && (() => {
                  const lastDay = dailyCurve[dailyCurve.length - 1];
                  const trendTo = Math.round(lastDay * 30);
                  return (
                    <div style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: 'var(--text-tertiary)',
                      marginTop: 6,
                    }}>
                      Trending to {formatTrend('activeUsers', trendTo)}/mo
                    </div>
                  );
                })()}
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
                    { key: 'cac', label: 'Avg CAC', value: `$${cac}`, curve: dailyKPIs?.cac, invertGood: true,
                      desc: 'Customer Acquisition Cost — total spend divided by new active users. Lower is better.' },
                    { key: 'roi', label: 'ROI', value: `${typeof roi === 'number' ? roi.toFixed(1) : roi}x`, curve: dailyKPIs?.roi, invertGood: false,
                      desc: 'Return on Investment — revenue generated by referred users divided by campaign spend.' },
                    { key: 'convRate', label: 'Conv rate', value: `${typeof convRate === 'number' ? convRate.toFixed(1) : convRate}%`, curve: dailyKPIs?.convRate, invertGood: false,
                      desc: 'Conversion Rate — percentage of contacted users who completed the referral journey.' },
                    { key: 'fraudSaved', label: 'Fraud saved', value: `$${Math.round((fraudSaved || 0) / 1000)}K`, curve: dailyKPIs?.fraudSaved, invertGood: false,
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
            SECTION 2 — Referral Strategy and User Journey
            ════════════════════════════════════════════ */}
        {showJourney && (
          <section
            ref={timelineRef}
            style={{
              marginBottom: '3rem',
              animation: 'fadeIn 0.4s ease forwards',
            }}
          >
            <span className={tl.sectionLabel}>Strategy Preview — Timeline Layout</span>
            <h3 className={tl.sectionTitle}>Referral Strategy and User Journey</h3>

            {/* Context Card — Strategy Rules */}
            <div className={tl.contextCard}>
              <div className={tl.contextCardTitle}>Strategy Rules</div>
              <div className={tl.fieldsGrid}>
                <div className={tl.fieldLabel}>Activated by</div>
                <span className={tl.fieldVal}>All Transactions, Timing Insights</span>
                <div className={tl.fieldLabel}>Redemption upon</div>
                <span className={tl.fieldVal}>1st Transaction</span>
                <div className={tl.fieldLabel}>Redemption journey</div>
                <span className={tl.fieldVal}>Sign Up, KYC</span>
                <div className={tl.fieldLabel}>Reward</div>
                <span className={tl.fieldVal}>$0, $20, $50, $75</span>
                <div className={tl.fieldLabel}>Paid as</div>
                <span className={tl.fieldVal}>Organic, Gift Card, Coupon, Account Credit, Cashback</span>
                <div className={tl.fieldLabel}>Tracked via</div>
                <span className={tl.fieldVal}>Referral Link</span>
              </div>
            </div>

            {/* Timeline — Two-Column Grid */}
            <div className={tl.timeline}>

              {/* ═══ ROW 1: Invite — text LEFT, card RIGHT ═══ */}
              <div className={`${tl.tlText} ${tl.tlColLeft} ${tl.tlRow1}`}>
                <h3 className={tl.tlTitle}>Invite</h3>
                <p className={tl.tlDesc}>Trigger the referral offer</p>
              </div>
              <div className={`${tl.tlCardWrap} ${tl.tlColRight} ${tl.tlRow1}`}>
                <div className={tl.tlCard}>
                  <div className={tl.tlCardHeader}>
                    <div className={tl.ddWrap}>
                      <button className={tl.ddTrigger} onClick={() => setOpenDD(openDD === 's1' ? null : 's1')}>
                        <span>{comboLabel(s1Combo.msg, s1Combo.ch)}</span>
                        <svg className={`${tl.ddChevron} ${openDD === 's1' ? tl.ddChevronOpen : ''}`} viewBox="0 0 10 10"><path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </button>
                      <div className={`${tl.ddMenu} ${openDD === 's1' ? tl.ddMenuOpen : ''}`}>
                        {[['ask', 'push'], ['ask', 'sms'], ['ask', 'email'], ['reminder', 'push'], ['reminder', 'sms'], ['reminder', 'email']].map(([m, c]) => (
                          <button key={`${m}-${c}`} className={`${tl.ddItem} ${s1Combo.msg === m && s1Combo.ch === c ? tl.ddItemActive : ''}`} onClick={() => selectCombo('s1', m, c)}>
                            {comboLabel(m, c)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className={tl.tlCardBody}>
                    {/* Ask · Push */}
                    <div className={s1Combo.msg === 'ask' && s1Combo.ch === 'push' ? '' : tl.hidden}>
                      <div className={tl.notif}>
                        <div className={tl.notifHeader}><div className={tl.notifIcon}>N</div><span className={tl.notifApp}>NeoBank</span><span className={tl.notifTime}>now</span></div>
                        <div className={tl.notifTitle}>$211 on streaming, Gina? 💸</div>
                        <div className={tl.notifBody}>Gina, you spent $211 on streaming! 💸 Claim one free month of Netflix for you now. Tap to share! 🍿</div>
                      </div>
                    </div>
                    {/* Ask · SMS */}
                    <div className={s1Combo.msg === 'ask' && s1Combo.ch === 'sms' ? '' : tl.hidden}>
                      <div className={tl.notif}>
                        <div className={tl.notifHeader}><div className={tl.notifIcon} style={{ background: '#34C759' }}><svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" /></svg></div><span className={tl.notifApp}>Messages</span><span className={tl.notifTime}>now</span></div>
                        <div className={tl.notifTitle}>NeoBank &middot; 72589</div>
                        <div className={tl.notifBody}>Gina, you spent $211 on streaming! 💸 Claim one free month of Netflix for you now. Tap to share https://nflx.it/gina 🍿</div>
                      </div>
                    </div>
                    {/* Ask · Email */}
                    <div className={s1Combo.msg === 'ask' && s1Combo.ch === 'email' ? '' : tl.hidden}>
                      <div className={tl.notif}>
                        <div className={tl.notifHeader}><div className={tl.notifIcon} style={{ background: '#007AFF' }}><svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" /></svg></div><span className={tl.notifApp}>Mail</span><span className={tl.notifTime}>now</span></div>
                        <div className={tl.notifTitle}>Gina, let&apos;s get that $211 back? 🍿</div>
                        <div className={tl.notifBody}>Netflix for free, Gina. One for you, one for a friend. You spent $211 on streaming — let&apos;s get that back! Share with a friend and you both win 🍿</div>
                      </div>
                    </div>
                    {/* Reminder · Push */}
                    <div className={s1Combo.msg === 'reminder' && s1Combo.ch === 'push' ? '' : tl.hidden}>
                      <div className={tl.notif}>
                        <div className={tl.notifHeader}><div className={tl.notifIcon}>N</div><span className={tl.notifApp}>NeoBank</span><span className={tl.notifTime}>now</span></div>
                        <div className={tl.notifTitle}>Still thinking about it, Gina? 🍿</div>
                        <div className={tl.notifBody}>Your free Netflix month is still here. Share your link with a friend before it expires!</div>
                      </div>
                    </div>
                    {/* Reminder · SMS */}
                    <div className={s1Combo.msg === 'reminder' && s1Combo.ch === 'sms' ? '' : tl.hidden}>
                      <div className={tl.notif}>
                        <div className={tl.notifHeader}><div className={tl.notifIcon} style={{ background: '#34C759' }}><svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" /></svg></div><span className={tl.notifApp}>Messages</span><span className={tl.notifTime}>now</span></div>
                        <div className={tl.notifTitle}>NeoBank &middot; 72589</div>
                        <div className={tl.notifBody}>Gina, your free Netflix month is still up for grabs! 🍿 Share with a friend before it expires: neo.bnk/r/gina</div>
                      </div>
                    </div>
                    {/* Reminder · Email */}
                    <div className={s1Combo.msg === 'reminder' && s1Combo.ch === 'email' ? '' : tl.hidden}>
                      <div className={tl.notif}>
                        <div className={tl.notifHeader}><div className={tl.notifIcon} style={{ background: '#007AFF' }}><svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" /></svg></div><span className={tl.notifApp}>Mail</span><span className={tl.notifTime}>now</span></div>
                        <div className={tl.notifTitle}>Gina, your Netflix reward is still here 🍿</div>
                        <div className={tl.notifBody}>Don&apos;t let it expire, Gina. Your free month of Netflix is still waiting — share with a friend before it&apos;s gone. One for you, one for them!</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ═══ ROW 2: Refer — card LEFT, text RIGHT ═══ */}
              <div className={`${tl.tlCardWrap} ${tl.tlColLeft} ${tl.tlRow2}`}>
                <div className={`${tl.tlCard} ${tl.conversationCard}`}>
                  {/* Gina → Paul */}
                  <div className={tl.convoMessage}>
                    <div className={tl.convoSenderLabel}>Gina → Paul</div>
                    <div className={tl.notif}>
                      <div className={tl.notifHeader}><div className={tl.notifIcon} style={{ background: '#25D366' }}><svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg></div><span className={tl.notifApp}>WhatsApp</span><span className={tl.notifTime}>now</span></div>
                      <div className={tl.notifTitle}>Gina Miller</div>
                      <div className={tl.notifBody}>Hey, you should check out NeoBank. I&apos;m a big fan so far. Plus, if you sign up with my link, you get a month of 🍿 Netflix for free. Not a bad deal! neo.bnk/r/gina</div>
                    </div>
                  </div>
                  <div className={tl.convoDivider}></div>
                  {/* Paul → Gina */}
                  <div className={`${tl.convoMessage} ${tl.convoReply}`}>
                    <div className={tl.convoReplyLabel}>Paul → Gina</div>
                    <div className={tl.notif}>
                      <div className={tl.notifHeader}><div className={tl.notifIcon} style={{ background: '#25D366' }}><svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg></div><span className={tl.notifApp}>WhatsApp</span><span className={tl.notifTime}>now</span></div>
                      <div className={tl.notifTitle}>Paul Davis</div>
                      <div className={tl.notifBody}>Love this! Thanks for keeping me in mind, Gina 🍿</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className={`${tl.tlText} ${tl.tlColRight} ${tl.tlRow2}`}>
                <h3 className={tl.tlTitle}>Refer</h3>
                <p className={tl.tlDesc}>Share with friends</p>
              </div>

              {/* ═══ ROW 3: Redeem — text LEFT, card RIGHT ═══ */}
              <div className={`${tl.tlText} ${tl.tlColLeft} ${tl.tlRow3}`}>
                <h3 className={tl.tlTitle}>Redeem</h3>
                <p className={tl.tlDesc}>Both sides get rewarded</p>
              </div>
              <div className={`${tl.tlCardWrap} ${tl.tlColRight} ${tl.tlRow3}`}>
                <div className={tl.tlCard}>
                  <div className={tl.tlCardHeader}>
                    <div className={tl.ddWrap}>
                      <button className={tl.ddTrigger} onClick={() => setOpenDD(openDD === 's3' ? null : 's3')}>
                        <span>{comboLabel(s3Combo.msg, s3Combo.ch)}</span>
                        <svg className={`${tl.ddChevron} ${openDD === 's3' ? tl.ddChevronOpen : ''}`} viewBox="0 0 10 10"><path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </button>
                      <div className={`${tl.ddMenu} ${openDD === 's3' ? tl.ddMenuOpen : ''}`}>
                        {[['success', 'push'], ['success', 'sms'], ['success', 'email'], ['reminder', 'push'], ['reminder', 'sms'], ['reminder', 'email']].map(([m, c]) => (
                          <button key={`${m}-${c}`} className={`${tl.ddItem} ${s3Combo.msg === m && s3Combo.ch === c ? tl.ddItemActive : ''}`} onClick={() => selectCombo('s3', m, c)}>
                            {comboLabel(m, c)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Success · Push */}
                  <div className={s3Combo.msg === 'success' && s3Combo.ch === 'push' ? '' : tl.hidden}>
                    <div className={tl.notifSection}>
                      <div className={tl.notifSectionLabel}>Referee (Paul)</div>
                      <div className={tl.notif}>
                        <div className={tl.notifHeader}><div className={tl.notifIcon}>N</div><span className={tl.notifApp}>NeoBank</span><span className={tl.notifTime}>now</span></div>
                        <div className={tl.notifTitle}>Netflix is officially unlocked! 📺</div>
                        <div className={tl.notifBody}>Nice move. Since you&apos;ve joined NeoBank, you and Gina both get a free month of Netflix. Head to the app to claim your reward and start streaming!</div>
                      </div>
                    </div>
                    <div className={tl.notifDivider}></div>
                    <div className={tl.notifSection}>
                      <div className={tl.notifSectionLabel}>Referrer (Gina)</div>
                      <div className={tl.notif}>
                        <div className={tl.notifHeader}><div className={tl.notifIcon}>N</div><span className={tl.notifApp}>NeoBank</span><span className={tl.notifTime}>now</span></div>
                        <div className={tl.notifTitle}>Your Netflix is on us! 🍿</div>
                        <div className={tl.notifBody}>Huge win—you and Paul both just scored a free month of Netflix. Your reward is officially unlocked and ready to use in the app. Enjoy!</div>
                      </div>
                    </div>
                  </div>

                  {/* Success · SMS */}
                  <div className={s3Combo.msg === 'success' && s3Combo.ch === 'sms' ? '' : tl.hidden}>
                    <div className={tl.notifSection}>
                      <div className={tl.notifSectionLabel}>Referee (Paul)</div>
                      <div className={tl.notif}>
                        <div className={tl.notifHeader}><div className={tl.notifIcon} style={{ background: '#34C759' }}><svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" /></svg></div><span className={tl.notifApp}>Messages</span><span className={tl.notifTime}>now</span></div>
                        <div className={tl.notifTitle}>NeoBank &middot; 72589</div>
                        <div className={tl.notifBody}>Nice move. Since you&apos;ve joined NeoBank, you and Gina both get a free month of Netflix. Head to the app to claim your reward and start streaming!</div>
                      </div>
                    </div>
                    <div className={tl.notifDivider}></div>
                    <div className={tl.notifSection}>
                      <div className={tl.notifSectionLabel}>Referrer (Gina)</div>
                      <div className={tl.notif}>
                        <div className={tl.notifHeader}><div className={tl.notifIcon} style={{ background: '#34C759' }}><svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" /></svg></div><span className={tl.notifApp}>Messages</span><span className={tl.notifTime}>now</span></div>
                        <div className={tl.notifTitle}>NeoBank &middot; 72589</div>
                        <div className={tl.notifBody}>Huge win—you and Paul both just scored a free month of Netflix. Your reward is officially unlocked and ready to use in the app. Enjoy!</div>
                      </div>
                    </div>
                  </div>

                  {/* Success · Email */}
                  <div className={s3Combo.msg === 'success' && s3Combo.ch === 'email' ? '' : tl.hidden}>
                    <div className={tl.notifSection}>
                      <div className={tl.notifSectionLabel}>Referee (Paul)</div>
                      <div className={tl.notif}>
                        <div className={tl.notifHeader}><div className={tl.notifIcon} style={{ background: '#007AFF' }}><svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" /></svg></div><span className={tl.notifApp}>Mail</span><span className={tl.notifTime}>now</span></div>
                        <div className={tl.notifTitle}>Netflix is officially unlocked! 📺</div>
                        <div className={tl.notifBody}>Nice move. Since you&apos;ve joined NeoBank, you and Gina both get a free month of Netflix. Head to the app to claim your reward and start streaming!</div>
                      </div>
                    </div>
                    <div className={tl.notifDivider}></div>
                    <div className={tl.notifSection}>
                      <div className={tl.notifSectionLabel}>Referrer (Gina)</div>
                      <div className={tl.notif}>
                        <div className={tl.notifHeader}><div className={tl.notifIcon} style={{ background: '#007AFF' }}><svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" /></svg></div><span className={tl.notifApp}>Mail</span><span className={tl.notifTime}>now</span></div>
                        <div className={tl.notifTitle}>Your Netflix is on us! 🍿</div>
                        <div className={tl.notifBody}>Huge win—you and Paul both just scored a free month of Netflix. Your reward is officially unlocked and ready to use in the app. Enjoy!</div>
                      </div>
                    </div>
                  </div>

                  {/* Reminder · Push */}
                  <div className={s3Combo.msg === 'reminder' && s3Combo.ch === 'push' ? '' : tl.hidden}>
                    <div className={tl.notifSection}>
                      <div className={tl.notifSectionLabel}>Referee (Paul)</div>
                      <div className={tl.notif}>
                        <div className={tl.notifHeader}><div className={tl.notifIcon}>N</div><span className={tl.notifApp}>NeoBank</span><span className={tl.notifTime}>now</span></div>
                        <div className={tl.notifTitle}>Your Netflix month is waiting 🍿</div>
                        <div className={tl.notifBody}>Make your first transaction and unlock a free month of Netflix — for you and for Gina. Don&apos;t miss out!</div>
                      </div>
                    </div>
                    <div className={tl.notifDivider}></div>
                    <div className={tl.notifSection}>
                      <div className={tl.notifSectionLabel}>Referrer (Gina)</div>
                      <div className={tl.notif}>
                        <div className={tl.notifHeader}><div className={tl.notifIcon}>N</div><span className={tl.notifApp}>NeoBank</span><span className={tl.notifTime}>now</span></div>
                        <div className={tl.notifTitle}>Almost there, Gina! 🍿</div>
                        <div className={tl.notifBody}>Paul hasn&apos;t completed their first transaction yet. Once they do, you both unlock a free month of Netflix. Hang tight!</div>
                      </div>
                    </div>
                  </div>

                  {/* Reminder · SMS */}
                  <div className={s3Combo.msg === 'reminder' && s3Combo.ch === 'sms' ? '' : tl.hidden}>
                    <div className={tl.notifSection}>
                      <div className={tl.notifSectionLabel}>Referee (Paul)</div>
                      <div className={tl.notif}>
                        <div className={tl.notifHeader}><div className={tl.notifIcon} style={{ background: '#34C759' }}><svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" /></svg></div><span className={tl.notifApp}>Messages</span><span className={tl.notifTime}>now</span></div>
                        <div className={tl.notifTitle}>NeoBank &middot; 72589</div>
                        <div className={tl.notifBody}>Your free Netflix month is waiting! 🍿 Make your first transaction to unlock it — Gina gets one too. Expires in 7 days.</div>
                      </div>
                    </div>
                    <div className={tl.notifDivider}></div>
                    <div className={tl.notifSection}>
                      <div className={tl.notifSectionLabel}>Referrer (Gina)</div>
                      <div className={tl.notif}>
                        <div className={tl.notifHeader}><div className={tl.notifIcon} style={{ background: '#34C759' }}><svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" /></svg></div><span className={tl.notifApp}>Messages</span><span className={tl.notifTime}>now</span></div>
                        <div className={tl.notifTitle}>NeoBank &middot; 72589</div>
                        <div className={tl.notifBody}>Almost there! Paul hasn&apos;t completed their first transaction yet. Once they do, you both unlock a free month of Netflix. Hang tight!</div>
                      </div>
                    </div>
                  </div>

                  {/* Reminder · Email */}
                  <div className={s3Combo.msg === 'reminder' && s3Combo.ch === 'email' ? '' : tl.hidden}>
                    <div className={tl.notifSection}>
                      <div className={tl.notifSectionLabel}>Referee (Paul)</div>
                      <div className={tl.notif}>
                        <div className={tl.notifHeader}><div className={tl.notifIcon} style={{ background: '#007AFF' }}><svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" /></svg></div><span className={tl.notifApp}>Mail</span><span className={tl.notifTime}>now</span></div>
                        <div className={tl.notifTitle}>A free Netflix month, one step away 🍿</div>
                        <div className={tl.notifBody}>Almost there — one transaction is all it takes to unlock a free month of Netflix for you and Gina. Don&apos;t miss out, it expires in 7 days!</div>
                      </div>
                    </div>
                    <div className={tl.notifDivider}></div>
                    <div className={tl.notifSection}>
                      <div className={tl.notifSectionLabel}>Referrer (Gina)</div>
                      <div className={tl.notif}>
                        <div className={tl.notifHeader}><div className={tl.notifIcon} style={{ background: '#007AFF' }}><svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" /></svg></div><span className={tl.notifApp}>Mail</span><span className={tl.notifTime}>now</span></div>
                        <div className={tl.notifTitle}>Almost there, Gina! 🍿</div>
                        <div className={tl.notifBody}>Paul hasn&apos;t completed their first transaction yet. Once they do, you both unlock a free month of Netflix. We&apos;ll let you know!</div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </section>
        )}

        {/* ════════════════════════════════════════════
            SECTION 3 — Execution: How Edoo Operates
            ════════════════════════════════════════════ */}
        {showExecution && (
          <section
            style={{
              marginBottom: '3rem',
              animation: 'fadeIn 0.4s ease forwards',
            }}
          >
            <h3
              style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: 700,
                marginBottom: '0.25rem',
              }}
            >
              How Edoo Operates
            </h3>
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--text-tertiary)',
                marginBottom: '1.5rem',
              }}
            >
              {operationsCycle.summary}
            </p>

            {/* Daily cycle */}
            <div
              style={{
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                marginBottom: '1.5rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: '0.375rem',
                  marginBottom: '1rem',
                  flexWrap: 'wrap',
                }}
              >
                {operationsCycle.steps.map((step, i) => (
                  <React.Fragment key={i}>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        padding: '4px 10px',
                        backgroundColor: 'var(--accent-light)',
                        borderRadius: '12px',
                      }}
                    >
                      {step.name}
                    </span>
                    {i < operationsCycle.steps.length - 1 && (
                      <span style={{ fontSize: '12px', color: 'var(--border)', alignSelf: 'center' }}>
                        {'\u2192'}
                      </span>
                    )}
                  </React.Fragment>
                ))}
                <span style={{ fontSize: '12px', color: 'var(--border)', alignSelf: 'center' }}>
                  {'\u21BB'}
                </span>
              </div>

              {operationsCycle.steps.map((step, i) => (
                <CycleStep key={i} step={step} index={i} total={operationsCycle.steps.length} />
              ))}
            </div>

            {/* Expected daily ramp */}
            <div
              style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '1.5rem',
              }}
            >
              {operationsCycle.dailyRamp.map((phase, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    padding: '1rem',
                    backgroundColor: 'var(--accent-subtle)',
                    borderRadius: 'var(--radius-md)',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 600,
                      color: 'var(--text-tertiary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '0.25rem',
                    }}
                  >
                    Days {phase.days}
                  </div>
                  <div
                    style={{
                      fontSize: 'var(--font-size-xl)',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      marginBottom: '0.25rem',
                    }}
                  >
                    ~{phase.activeUsersPerDay}/day
                  </div>
                  <div
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--text-tertiary)',
                    }}
                  >
                    {phase.note}
                  </div>
                </div>
              ))}
            </div>

          </section>
        )}

        {/* ════════════════════════════════════════════
            SECTION 4 — Risk Management
            ════════════════════════════════════════════ */}
        {showRisk && (
          <section
            style={{
              marginBottom: '2rem',
              animation: 'fadeIn 0.4s ease forwards',
            }}
          >
            <h3
              style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: 700,
                marginBottom: '0.25rem',
              }}
            >
              Risk Management
            </h3>
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--text-tertiary)',
                marginBottom: '1.5rem',
              }}
            >
              How Edoo protects your budget during continuous operations.
            </p>

            {/* Two-column layout: Controls + Fraud side by side on desktop */}
            <div className="risk-layout">
              {/* Left column — Controls */}
              <div
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                }}
              >
                {riskManagement.controls.map((ctrl, i) => {
                  const displayValue = ctrl.format === 'currency'
                    ? formatCurrency(Math.round(budget * ctrl.ratio))
                    : ctrl.fixedValue;
                  return (
                    <div
                      key={ctrl.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem 1.25rem',
                        borderBottom: i < riskManagement.controls.length - 1 ? '1px solid var(--border-light)' : 'none',
                        backgroundColor: 'var(--surface)',
                      }}
                    >
                      <Tooltip text={ctrl.labelTooltip}>
                        <span
                          style={{
                            fontSize: 'var(--font-size-sm)',
                            fontWeight: 500,
                            color: 'var(--text-secondary)',
                            borderBottom: '1px dotted var(--text-tertiary)',
                          }}
                        >
                          {ctrl.label}
                        </span>
                      </Tooltip>
                      <Tooltip text={ctrl.valueTooltip}>
                        <span
                          style={{
                            fontSize: 'var(--font-size-sm)',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            padding: '2px 10px',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--accent-subtle)',
                            fontFamily: 'monospace',
                            cursor: 'help',
                          }}
                        >
                          {displayValue}
                        </span>
                      </Tooltip>
                    </div>
                  );
                })}
              </div>

              {/* Right column — Fraud Estimation */}
              <div
                style={{
                  border: '1px dashed var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.25rem',
                  backgroundColor: 'var(--surface)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Estimation label */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <span
                    className="monitoring-pulse"
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--text-tertiary)',
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 600,
                      color: 'var(--text-tertiary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Estimated
                  </span>
                </div>

                {/* Big KPI — total fraud rate */}
                <Tooltip text={riskManagement.fraudTotalTooltip}>
                  <div style={{ marginBottom: '1rem' }}>
                    <div
                      style={{
                        fontSize: 'var(--font-size-4xl)',
                        fontWeight: 700,
                        color: 'var(--text-secondary)',
                        lineHeight: 1,
                        cursor: 'help',
                      }}
                    >
                      ~{riskManagement.fraud.reduce((sum, f) => sum + f.rate, 0).toFixed(1)}%
                    </div>
                    <div
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--text-tertiary)',
                        marginTop: '0.25rem',
                      }}
                    >
                      Total fraud exposure
                    </div>
                  </div>
                </Tooltip>

                {/* Breakdown rows */}
                <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem' }}>
                  {riskManagement.fraud.map((item, i) => (
                    <Tooltip key={i} text={item.tooltip}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.375rem 0',
                          borderBottom: i < riskManagement.fraud.length - 1 ? '1px solid var(--border-light)' : 'none',
                          cursor: 'help',
                        }}
                      >
                        <span
                          style={{
                            fontSize: 'var(--font-size-xs)',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {item.type}
                        </span>
                        <span
                          style={{
                            fontSize: 'var(--font-size-sm)',
                            fontWeight: 600,
                            color: 'var(--text-secondary)',
                            fontFamily: 'monospace',
                          }}
                        >
                          {item.rate}%
                        </span>
                      </div>
                    </Tooltip>
                  ))}
                </div>

                {/* Monitoring footer */}
                <div
                  style={{
                    marginTop: 'auto',
                    paddingTop: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                  }}
                >
                  <span
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-tertiary)',
                      fontStyle: 'italic',
                    }}
                  >
                    Monitored in real-time during execution
                  </span>
                </div>
              </div>
            </div>

            {/* Policy line */}
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                margin: 0,
                marginTop: '1rem',
              }}
            >
              {riskManagement.fraudPolicy}
            </p>
          </section>
        )}
      </main>

      {/* ── Approve button (sticky bottom) ── */}
      {showCTA && (
        <div
          style={{
            position: 'sticky',
            bottom: 0,
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

      <style>{`
        @keyframes blink { 50% { opacity: 0; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
