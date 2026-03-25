import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import Logo from '../components/Logo.jsx';
import CTAButton from '../components/CTAButton.jsx';
import AnimatedNumber from '../components/AnimatedNumber.jsx';
import Tooltip from '../components/Tooltip.jsx';
import { useProjections } from '../hooks/useProjections.js';
import StrategyCards, { GearIcon, ChevronRight } from '../components/StrategyCards.jsx';
import WhatUsersSee from '../components/WhatUsersSee.jsx';
import sDrawer from '../styles/StrategyDrawer.module.css';

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
/* ───────── Skeleton loading bar ───────── */
function SkeletonBar({ width, height = 14, style }) {
  return (
    <span style={{
      display: 'inline-block', width, height, borderRadius: 4,
      background: 'linear-gradient(90deg, var(--color-gray-200) 25%, var(--color-gray-100) 50%, var(--color-gray-200) 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.8s infinite linear',
      verticalAlign: 'middle',
      ...style,
    }} />
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
    approvalScope,
    totalCustomers,
  } = config;

  /* ── Budget + reward tiers + engine projections ── */
  const [budget, setBudget] = useState(budgetSlider.default);
  const [rewardTiers, setRewardTiers] = useState(null); // null = use config defaults

  // Merge reward tier overrides into engine params when user changes them
  const mergedEngineParams = useMemo(() => {
    if (!rewardTiers) return engineParams;
    return { ...engineParams, ...rewardTiers };
  }, [engineParams, rewardTiers]);

  const proj = useProjections(mergedEngineParams, budget);



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
  const [budgetHovered, setBudgetHovered] = useState(false);
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
  const [activeDrawer, setActiveDrawer] = useState(null);

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

  /* ── Reasoning animation (Phase 1 → Phase 2 transition) ── */
  const REASONING_STEPS = useMemo(() => [
    'Scanning your CRM and transaction data to find natural referrers',
    'Filtering out anyone who shouldn\u2019t be asked right now',
    'Matching the right reward to each segment',
    'Placing the reward at the right step in the journey',
  ], []);

  const [phase, setPhase] = useState('reasoning'); // 'reasoning' | 'complete' | 'revealing' | 'done'
  const [visibleLines, setVisibleLines] = useState(0);
  const isRevealed = phase === 'revealing' || phase === 'done';

  // Run reasoning sequence on mount, then transition to strategy
  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    cancelRef.current = false;

    const run = async () => {
      for (let i = 1; i <= 4; i++) {
        if (cancelRef.current) return;
        setVisibleLines(i);
        await sleep(700);
      }
      // "Complete" moment — all checkmarks, no dots
      if (cancelRef.current) return;
      setPhase('complete');
      // Reading pause — user sees all 4 lines with checkmarks
      await sleep(800);
      // Reveal — reasoning collapses, skeletons swap to real values
      if (cancelRef.current) return;
      setPhase('revealing');
      await sleep(600);
      if (cancelRef.current) return;
      setPhase('done');
    };
    run();

    return () => { cancelRef.current = true; };
  }, []);

  // Start strategy reveal when phase transitions
  useEffect(() => {
    if (phase === 'revealing') {
      runReveal();
    }
  }, [phase, runReveal]);

  const formatCurrency = (val) => '$' + val.toLocaleString('en-US');

  /* ═══════ RENDER ═══════ */
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header
        style={{
          padding: '14px 48px',
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
            HEADING — visible from frame 1
            ════════════════════════════════════════════ */}
        <h3 style={{
          fontSize: 32,
          fontWeight: 600,
          letterSpacing: '-0.02em',
          color: 'var(--text-primary)',
          marginBottom: 32,
        }}>Your Referral Strategy</h3>

        {/* ════════════════════════════════════════════
            REASONING BLOCK — collapses after complete
            ════════════════════════════════════════════ */}
        <div
          style={{
            overflow: 'hidden',
            transition: 'max-height 0.5s ease, opacity 0.4s ease',
            maxHeight: isRevealed ? 0 : 500,
            opacity: isRevealed ? 0 : 1,
            ...(phase === 'done' ? { display: 'none' } : {}),
            marginTop: 24,
            marginBottom: 32,
          }}
        >
          {REASONING_STEPS.map((text, i) => {
            const isVisible = i < visibleLines;
            const isActive = i === visibleLines - 1;
            const isCompleted = i < visibleLines - 1;
            const isAllDone = phase === 'complete' || phase === 'revealing';

            if (!isVisible) return null;

            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '8px 0',
                  animation: 'reasonLineIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                }}
              >
                {/* Checkmark or spinner */}
                <span
                  style={{
                    flexShrink: 0,
                    width: 20,
                    height: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isCompleted || isAllDone ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ animation: 'reasonCheckIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
                      <path d="M3 8.5L6.5 12L13 4" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <span style={{
                      display: 'inline-block',
                      width: 12,
                      height: 12,
                      border: '1.5px solid var(--border)',
                      borderTopColor: 'var(--text-tertiary)',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }} />
                  )}
                </span>

                {/* Text */}
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 400,
                    lineHeight: 1.5,
                    color: isActive && !isAllDone ? 'var(--text-primary)' : 'var(--text-tertiary)',
                    transition: 'color var(--transition-slow) ease',
                  }}
                >
                  {text}
                </span>
              </div>
            );
          })}
        </div>

        {/* ════════════════════════════════════════════
            SECTION 1 — Strategy content (skeleton → real)
            ════════════════════════════════════════════ */}
        <section
          style={{
            marginBottom: 48,
          }}
        >
            {/* ── Open surface grid: budget | results ── */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '340px 1fr',
            }}>

              {/* ── Budget column ── */}
              <div style={{
                padding: '0 32px 0 0',
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

                {/* Budget number — inline editable */}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'baseline',
                    marginTop: 8,
                    cursor: isRevealed ? 'text' : 'default',
                  }}
                  onClick={isRevealed && !editingBudget ? startEditBudget : undefined}
                >
                  <span style={{
                    fontSize: 40,
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    lineHeight: 1,
                  }}>$</span>
                  {!isRevealed ? (
                    <SkeletonBar width={80} height={40} style={{ margin: '0 2px' }} />
                  ) : editingBudget ? (
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
                        background: 'var(--color-gray-100)',
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
                    <span
                      onMouseEnter={() => setBudgetHovered(true)}
                      onMouseLeave={() => setBudgetHovered(false)}
                      style={{
                      fontSize: 40,
                      fontWeight: 500,
                      letterSpacing: '-0.02em',
                      color: 'var(--text-primary)',
                      lineHeight: 1,
                      cursor: 'pointer',
                      background: budgetHovered ? 'var(--color-gray-100)' : 'transparent',
                      padding: '2px 4px 3px 2px',
                      borderRadius: 4,
                      textDecoration: 'underline',
                      textDecorationStyle: 'dashed',
                      textDecorationColor: 'var(--color-gray-400)',
                      textDecorationThickness: '2px',
                      textUnderlineOffset: '4px',
                      animation: 'fadeIn 0.3s ease-out',
                    }}>
                      {Math.round(budget / 1000)}
                    </span>
                  )}
                  {isRevealed ? (
                    <>
                      <span style={{
                        fontSize: 40,
                        fontWeight: 500,
                        color: 'var(--text-primary)',
                        lineHeight: 1,
                        animation: 'fadeIn 0.3s ease-out',
                      }}>K</span>
                      <span style={{
                        fontSize: 15,
                        color: 'var(--text-tertiary)',
                        fontWeight: 500,
                        marginLeft: 6,
                        animation: 'fadeIn 0.3s ease-out',
                      }}>/mo</span>
                    </>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>

                {/* Slider — tight spacing */}
                <div style={{ marginTop: 12, pointerEvents: isRevealed ? 'auto' : 'none' }}>
                  <div style={{ position: 'relative', height: 20 }}>
                    {/* Track background */}
                    <div style={{
                      position: 'absolute',
                      top: 7,
                      left: 0,
                      right: 0,
                      height: 6,
                      background: 'var(--color-gray-200)',
                      borderRadius: 3,
                    }} />

                    {/* Zone boundary tick marks */}
                    <div style={{
                      position: 'absolute',
                      left: `${recZoneLeft}%`,
                      top: 2,
                      width: 1.5,
                      height: 16,
                      background: 'var(--color-gray-400)',
                      borderRadius: 1,
                      zIndex: 2,
                    }} />
                    <div style={{
                      position: 'absolute',
                      left: `${recZoneLeft + recZoneWidth}%`,
                      top: 2,
                      width: 1.5,
                      height: 16,
                      background: 'var(--color-gray-400)',
                      borderRadius: 1,
                      zIndex: 2,
                    }} />

                    {/* Fill */}
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: 7,
                      width: `${isRevealed ? sliderPercent : 50}%`,
                      height: 6,
                      background: isRevealed ? 'var(--accent)' : 'var(--color-gray-300)',
                      borderRadius: 3,
                      zIndex: 1,
                      transition: isRevealed ? 'width 0.3s ease' : 'none',
                    }} />

                    {/* Thumb */}
                    <div style={{
                      position: 'absolute',
                      left: `${isRevealed ? sliderPercent : 50}%`,
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 20,
                      height: 20,
                      background: 'var(--accent)',
                      border: '3px solid var(--surface)',
                      borderRadius: '50%',
                      cursor: 'grab',
                      zIndex: 3,
                      boxShadow: 'var(--shadow-sm)',
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

                  {/* Bounds — subtle */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: 6,
                    fontSize: 10,
                    color: 'var(--color-gray-300)',
                  }}>
                    <span>${Math.round(budgetSlider.min / 1000)}K</span>
                    <span>${Math.round(budgetSlider.max / 1000)}K</span>
                  </div>
                </div>

                {/* Strategy context — AI insight + rules access */}
                <div style={{
                  marginTop: 24,
                  background: 'var(--accent-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 16px',
                }}>
                  {!isRevealed ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <SkeletonBar width="100%" height={12} />
                      <SkeletonBar width="70%" height={12} />
                    </div>
                  ) : (
                    <>
                      {/* AI insight */}
                      <div style={{
                        display: 'flex',
                        gap: 8,
                        alignItems: 'flex-start',
                        animation: 'fadeIn 0.3s ease-out',
                        animationDelay: '400ms',
                        animationFillMode: 'both',
                      }}>
                        <svg style={{ flexShrink: 0, marginTop: 1 }} width="14" height="14" viewBox="0 0 16 16" fill="none">
                          <path d="M8 0L9.8 6.2L16 8L9.8 9.8L8 16L6.2 9.8L0 8L6.2 6.2L8 0Z" fill="var(--text-tertiary)"/>
                        </svg>
                        <div style={{
                          fontSize: 12.5,
                          color: 'var(--text-secondary)',
                          lineHeight: 1.5,
                          minHeight: 57,
                        }}>
                          {guidanceMessage}
                        </div>
                      </div>

                      {/* Divider */}
                      <div style={{
                        height: 1,
                        background: 'var(--border-light)',
                        margin: '12px 0',
                      }} />

                      {/* Rules trigger */}
                      <button className={sDrawer.rulesButton} onClick={() => setActiveDrawer('index')} style={{ animation: 'fadeIn 0.3s ease-out', animationDelay: '400ms', animationFillMode: 'both' }}>
                        <GearIcon /> <span>Referral Rules</span> <ChevronRight />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* ── Results column ── */}
              <div style={{
                paddingLeft: 32,
                display: 'flex',
                flexDirection: 'column',
              }}>
                {/* Headline */}
                <div style={{ paddingBottom: 16 }}>
                  <div style={{
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    color: 'var(--text-tertiary)',
                  }}>
                    First 30 days
                  </div>

                  <div style={{
                    fontSize: 64,
                    fontWeight: 800,
                    letterSpacing: '-0.03em',
                    color: 'var(--text-primary)',
                    lineHeight: 1,
                    marginTop: 6,
                  }}>
                    {!isRevealed ? (
                      <SkeletonBar width={120} height={48} />
                    ) : (
                      <span style={{ animation: 'fadeIn 0.3s ease-out', animationDelay: '100ms', animationFillMode: 'both', display: 'inline-block' }}>
                        <AnimatedNumber value={activeUsers} duration={300} />
                      </span>
                    )}
                  </div>

                  <div style={{
                    fontSize: 14,
                    color: 'var(--text-secondary)',
                    marginTop: 4,
                  }}>
                    new active users
                  </div>
                </div>

                {/* KPI grid */}
                <div style={{
                  paddingTop: 14,
                  borderTop: '1px solid var(--border-light)',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '14px 20px',
                }}>
                  {[
                    { key: 'cac', label: 'Avg CAC', value: `$${cac}`, curve: dailyKPIs?.cac, invertGood: true, refValue: cac,
                      desc: 'Customer Acquisition Cost — total spend divided by new active users. Lower is better.' },
                    { key: 'roi', label: 'ROI', value: `${typeof roi === 'number' ? roi.toFixed(1) : roi}x`, curve: dailyKPIs?.roi, invertGood: false, refValue: roi,
                      desc: 'Return on Investment — revenue generated by referred users divided by campaign spend.' },
                    { key: 'convRate', label: 'Conv rate', value: `${typeof convRate === 'number' ? convRate.toFixed(1) : convRate}%`, curve: dailyKPIs?.convRate, invertGood: false, refValue: convRate,
                      desc: 'Conversion Rate — percentage of contacted users who completed the referral journey.' },
                    { key: 'fraudSaved', label: 'Fraud saved', value: `$${Math.round((fraudSaved || 0) / 1000)}K`, curve: dailyKPIs?.fraudSaved, invertGood: false, refValue: (fraudSaved || 0) / 30,
                      desc: "Estimated fraud prevention savings from VincorAI's verification layer." },
                  ].map((kpi) => {
                    const pts = kpi.curve ? sparkPointsData(kpi.curve, td) : null;
                    const last = pts ? pts[pts.length - 1] : null;
                    const color = kpi.curve ? sparkColor(kpi.curve, kpi.invertGood, td) : 'var(--text-tertiary)';

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
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        marginTop: 2,
                      }}>
                        {!isRevealed ? (
                          <SkeletonBar width={48} height={18} />
                        ) : (
                          <>
                            <span style={{
                              fontSize: 16,
                              fontWeight: 600,
                              color: 'var(--text-primary)',
                              animation: 'fadeIn 0.3s ease-out',
                              animationDelay: '200ms',
                              animationFillMode: 'both',
                            }}>
                              {kpi.value}
                            </span>
                            {pts && last && (
                              <span
                                onMouseEnter={() => setHoveredSparkline(kpi.key)}
                                onMouseLeave={() => setHoveredSparkline(null)}
                                style={{ display: 'inline-flex', alignItems: 'center', cursor: 'default', animation: 'fadeIn 0.3s ease-out', animationDelay: '200ms', animationFillMode: 'both' }}
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
                          </>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>

              {/* third column removed — rules button moved to budget column */}
            </div>

            {/* ── Chart: daily forecast with learning zone + area fill ── */}
            {!isRevealed ? (
              <div style={{ marginTop: 32 }}>
                <SkeletonBar width="100%" height={200} style={{ borderRadius: 'var(--radius-md)', display: 'block' }} />
              </div>
            ) : dailyCurve && (
              <div style={{ marginTop: 32, animation: 'fadeIn 0.3s ease-out', animationDelay: '300ms', animationFillMode: 'both' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Daily forecast: new active users
                  </span>
                </div>

                <div style={{ marginTop: 8 }}>
                  <svg
                    viewBox="-28 0 828 210"
                    preserveAspectRatio="xMidYMid meet"
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                  >
                    {(() => {
                      const maxVal = Math.max(...dailyCurve) + 2;
                      const chartLeft = 0, chartRight = 800, chartBottom = 170, chartTop = 10;
                      const chartW = chartRight - chartLeft, chartH = chartBottom - chartTop;
                      const threshX = chartLeft + ((thresholdDay - 1) / 29) * chartW;

                      const points = dailyCurve.map((v, i) => {
                        const x = chartLeft + (i / 29) * chartW;
                        const y = chartBottom - (v / maxVal) * chartH;
                        return { x, y };
                      });
                      const pathD = `M${points.map(p => `${p.x},${p.y}`).join(' L')}`;
                      const areaD = `${pathD} L${chartRight},${chartBottom} L${chartLeft},${chartBottom} Z`;
                      const lastPt = points[points.length - 1];
                      const lastVal = dailyCurve[dailyCurve.length - 1];

                      return (
                        <>
                          <defs>
                            {/* Area fill: dark grey fading to transparent */}
                            <linearGradient id="areaFill" x1="0" y1={chartTop} x2="0" y2={chartBottom} gradientUnits="userSpaceOnUse">
                              <stop offset="0%" stopColor="#1e293b" stopOpacity="0.10" />
                              <stop offset="60%" stopColor="#1e293b" stopOpacity="0.04" />
                              <stop offset="100%" stopColor="#1e293b" stopOpacity="0" />
                            </linearGradient>
                            {/* Post-threshold stroke gradient */}
                            <linearGradient id="strokeGrad" x1={threshX} y1="0" x2={chartRight} y2="0" gradientUnits="userSpaceOnUse">
                              <stop offset="0%" stopColor="#94a3b8" />
                              <stop offset="40%" stopColor="#475569" />
                              <stop offset="100%" stopColor="#1e293b" />
                            </linearGradient>
                            <clipPath id="clipPost">
                              <rect x={threshX} y="0" width={chartRight - threshX} height="210" />
                            </clipPath>
                            <clipPath id="clipPre">
                              <rect x="0" y="0" width={threshX} height="210" />
                            </clipPath>
                          </defs>

                          {/* Learning phase shaded zone */}
                          <rect x={chartLeft} y={chartTop} width={threshX - chartLeft} height={chartH} fill="#f1f5f9" />

                          {/* Light gridlines — after learning zone only */}
                          <line x1={threshX} y1={chartTop + chartH * 0.33} x2={chartRight} y2={chartTop + chartH * 0.33} stroke="var(--border-light)" strokeWidth="1" strokeDasharray="4,4" />
                          <line x1={threshX} y1={chartTop + chartH * 0.66} x2={chartRight} y2={chartTop + chartH * 0.66} stroke="var(--border-light)" strokeWidth="1" strokeDasharray="4,4" />

                          {/* X-axis baseline */}
                          <line x1={chartLeft} y1={chartBottom} x2={chartRight} y2={chartBottom} stroke="var(--border-light)" strokeWidth="1" />

                          {/* Y-axis: 0 and max */}
                          <text x="-6" y={chartBottom + 4} fontSize="10" fill="var(--text-tertiary)" textAnchor="end" fontFamily="var(--font-family)">0</text>
                          <text x="-6" y={chartTop + 14} fontSize="10" fill="var(--text-tertiary)" textAnchor="end" fontFamily="var(--font-family)">{Math.round(maxVal)}</text>

                          {/* X-axis labels */}
                          <text x={chartLeft} y="190" fontSize="11" fill="var(--text-tertiary)" textAnchor="start" fontFamily="var(--font-family)">Day 1</text>
                          <text x={chartRight} y="190" fontSize="11" fill="var(--text-tertiary)" textAnchor="end" fontFamily="var(--font-family)">Day 30</text>

                          {/* Area fill */}
                          <path d={areaD} fill="url(#areaFill)" />

                          {/* Pre-threshold curve — light */}
                          <path d={pathD} fill="none" stroke="var(--color-gray-300)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" clipPath="url(#clipPre)" />

                          {/* Post-threshold curve — confident dark gradient */}
                          <path d={pathD} fill="none" stroke="url(#strokeGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" clipPath="url(#clipPost)" />

                          {/* Learning phase label */}
                          <text x={chartLeft + 8} y={chartTop + 16} fontSize="10" fill="var(--text-secondary)" fontFamily="var(--font-family)" fontWeight="600">Learning phase</text>
                          <text x={chartLeft + 8} y={chartTop + 28} fontSize="9" fill="var(--text-tertiary)" fontFamily="var(--font-family)">AI calibrating signals</text>

                          {/* Hover overlay */}
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
                              <line x1={hoveredDay.x} y1={chartTop} x2={hoveredDay.x} y2={chartBottom} stroke="var(--color-gray-300)" strokeWidth="1" strokeDasharray="3,3" />
                              <circle cx={hoveredDay.x} cy={hoveredDay.y} r="4" fill="var(--text-primary)" stroke="white" strokeWidth="2" />
                              <rect
                                x={Math.max(-20, Math.min(chartRight - 52, hoveredDay.x - 36))} y={hoveredDay.y - 32}
                                width="72" height="22" rx="4"
                                fill="var(--text-primary)"
                              />
                              <text
                                x={Math.max(16, Math.min(chartRight - 16, hoveredDay.x))} y={hoveredDay.y - 17}
                                fontSize="11" fontWeight="600" fill="white"
                                textAnchor="middle" fontFamily="var(--font-family)"
                              >
                                Day {hoveredDay.day}: {hoveredDay.value}
                              </text>
                            </>
                          )}

                          {/* Endpoint */}
                          <circle cx={lastPt.x} cy={lastPt.y} r="3.5" fill="var(--text-primary)" />
                          <text
                            x={lastPt.x - 14}
                            y={Math.max(10, lastPt.y - 10)}
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

        {/* ════════════════════════════════════════════
            SECTION 2 — What Users See (grey background zone)
            ════════════════════════════════════════════ */}
        {showJourney && (
          <section
            style={{
              animation: 'fadeIn 0.4s ease forwards',
              background: 'var(--color-gray-50)',
              width: '100vw',
              marginLeft: 'calc(-50vw + 50%)',
              padding: '48px 0 56px',
              marginBottom: '3rem',
            }}
          >
            <div style={{
              maxWidth: 'calc(1100px - 6rem)',
              margin: '0 auto',
              padding: '0 3rem',
            }}>
              <WhatUsersSee />
            </div>
          </section>
        )}

        {/* ════════════════════════════════════════════
            CTA — Launch Campaigns
            ════════════════════════════════════════════ */}
        {showCTA && (
          <div style={{ textAlign: 'center', marginTop: 32, animation: 'fadeIn 0.4s ease forwards' }}>
            {approvalScope && <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 32, lineHeight: 1.5 }}>{approvalScope}</div>}
            <CTAButton onClick={onNext}>Launch Campaigns</CTAButton>
          </div>
        )}

        {/* Strategy Rules Drawer */}
        <StrategyCards
          activeDrawer={activeDrawer}
          onClose={() => setActiveDrawer(null)}
          onNavigate={setActiveDrawer}
          onRewardsChange={setRewardTiers}
        />
      </main>

      <style>{`
        @keyframes blink { 50% { opacity: 0; } }
        @keyframes reasonLineIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes reasonCheckIn { from { opacity: 0; transform: scale(0.5); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}
