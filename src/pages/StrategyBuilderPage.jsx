import React, { useEffect, useState, useRef, useCallback } from 'react';
import Logo from '../components/Logo.jsx';
import CTAButton from '../components/CTAButton.jsx';
import JourneyPipeline from '../components/JourneyPipeline.jsx';
import AnimatedNumber from '../components/AnimatedNumber.jsx';
import Badge from '../components/Badge.jsx';
import Expandable from '../components/Expandable.jsx';
import { useProjections } from '../hooks/useProjections.js';

/* ───────── Strategy Summary Card (lightweight) ───────── */
function StrategySummaryCard({ strategy, variant }) {
  return (
    <div
      style={{
        flex: 1,
        border: '1px solid var(--color-gray-200)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <Badge variant={variant}>{strategy.name}</Badge>
      </div>
      <h3
        style={{
          fontSize: 'var(--font-size-lg)',
          fontWeight: 700,
          marginBottom: '0.5rem',
          color: 'var(--color-gray-900)',
        }}
      >
        {strategy.headline}
      </h3>
      <p
        style={{
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-gray-600)',
          lineHeight: 1.5,
        }}
      >
        {strategy.basis}
      </p>
    </div>
  );
}

/* ───────── KPI Metric Card ───────── */
function MetricCard({ label, children }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: '140px',
        padding: '1.25rem',
        backgroundColor: 'var(--color-gray-50)',
        borderRadius: 'var(--radius-lg)',
        textAlign: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
      }}
    >
      <div
        style={{
          fontSize: 'var(--font-size-xs)',
          fontWeight: 500,
          color: 'var(--color-gray-500)',
          marginBottom: '0.5rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 'var(--font-size-2xl)',
          fontWeight: 700,
          color: 'var(--color-black)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ───────── Strategy Detail (expandable content) ───────── */
function StrategyDetailContent({ breakdown, strategies, roiExample, budget }) {
  const formatBudget = (v) => '$' + (v / 1000).toFixed(0) + 'K';

  return (
    <div>
      <h4
        style={{
          fontSize: 'var(--font-size-sm)',
          fontWeight: 600,
          marginBottom: '1rem',
          color: 'var(--color-gray-700)',
        }}
      >
        Per-Strategy Breakdown at Current Budget ({formatBudget(budget)})
      </h4>

      <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          <thead>
            <tr style={{ borderBottom: '2px solid var(--color-gray-200)' }}>
              <th style={thStyle}></th>
              <th style={thStyle}>Quick Win</th>
              <th style={thStyle}>Look-a-Like</th>
            </tr>
          </thead>
          <tbody>
            <tr style={trStyle}>
              <td style={tdLabelStyle}>Eligible referrers</td>
              <td style={tdStyle}>{breakdown.quickWin.eligibleReferrers.toLocaleString()}</td>
              <td style={tdStyle}>{breakdown.lookALike.eligibleReferrers.toLocaleString()}</td>
            </tr>
            <tr style={trStyle}>
              <td style={tdLabelStyle}>Projected referrals sent</td>
              <td style={tdStyle}>{breakdown.quickWin.projectedReferralsSent.toLocaleString()}</td>
              <td style={tdStyle}>{breakdown.lookALike.projectedReferralsSent.toLocaleString()}</td>
            </tr>
            <tr style={trStyle}>
              <td style={tdLabelStyle}>Projected conversions</td>
              <td style={tdStyle}>{breakdown.quickWin.projectedConversions.toLocaleString()} {breakdown.quickWin.conversionUnit}</td>
              <td style={tdStyle}>{breakdown.lookALike.projectedConversions.toLocaleString()} {breakdown.lookALike.conversionUnit}</td>
            </tr>
            <tr style={trStyle}>
              <td style={tdLabelStyle}>Reward per conversion</td>
              <td style={tdStyle}>${breakdown.quickWin.rewardPerConversion} total (${strategies.quickWin.rewardPerSide}/side x 2)</td>
              <td style={tdStyle}>${breakdown.lookALike.rewardPerConversion} total (${strategies.lookALike.rewardPerSide}/side x 2)</td>
            </tr>
            <tr style={trStyle}>
              <td style={tdLabelStyle}>Projected spend</td>
              <td style={tdStyle}>${breakdown.quickWin.projectedSpend.toLocaleString()}</td>
              <td style={tdStyle}>${breakdown.lookALike.projectedSpend.toLocaleString()}</td>
            </tr>
            <tr style={trStyle}>
              <td style={tdLabelStyle}>Allocation</td>
              <td style={tdStyle}>{breakdown.quickWin.allocationPercent}% of eligible users</td>
              <td style={tdStyle}>{breakdown.lookALike.allocationPercent}% of eligible users</td>
            </tr>
          </tbody>
        </table>
        <p
          style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-gray-400)',
            marginTop: '0.75rem',
            fontStyle: 'italic',
          }}
        >
          Note: Remaining budget (~${(breakdown.reservedBudget / 1000).toFixed(0)}K of the budget) is {breakdown.reservedNote.toLowerCase()}.
        </p>
      </div>

      <h4
        style={{
          fontSize: 'var(--font-size-sm)',
          fontWeight: 600,
          marginBottom: '0.75rem',
          color: 'var(--color-gray-700)',
        }}
      >
        A/B Test Variables
      </h4>
      <ul style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)', lineHeight: 1.8, paddingLeft: '1.25rem', marginBottom: '2rem' }}>
        <li>Quick Win: Coupon vs. Account Credit x 2 message variants = 4 combinations.</li>
        <li>Look-a-Like: Cashback vs. Account Credit x 2 message variants = 4 combinations.</li>
        <li>Timing: Quick Win sends within 24h of eligibility detection. Look-a-Like sends at peak engagement time per user (inferred from historical activity patterns).</li>
        <li>Channel: Per user's most responsive channel (email, push, SMS, WhatsApp).</li>
      </ul>

      <h4
        style={{
          fontSize: 'var(--font-size-sm)',
          fontWeight: 600,
          marginBottom: '0.75rem',
          color: 'var(--color-gray-700)',
        }}
      >
        Per-User ROI Ranking Example
      </h4>
      <div
        style={{
          backgroundColor: 'var(--color-gray-50)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem',
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-gray-700)',
          lineHeight: 1.7,
          marginBottom: '1rem',
        }}
      >
        <p>
          User #{roiExample.userId}: Eligible for both strategies.
        </p>
        <p>
          Quick Win: ${roiExample.quickWin.costPerSide}/side x 2 = ${roiExample.quickWin.totalCost} total cost,{' '}
          {(roiExample.quickWin.successProbability * 100).toFixed(0)}% success probability.
          Expected cost per conversion: ${roiExample.quickWin.totalCost} / {roiExample.quickWin.successProbability.toFixed(2)} = ${roiExample.quickWin.expectedCostPerConversion}.
        </p>
        <p>
          Look-a-Like: ${roiExample.lookALike.costPerSide}/side x 2 = ${roiExample.lookALike.totalCost} total cost,{' '}
          {(roiExample.lookALike.successProbability * 100).toFixed(0)}% success probability.
          Expected cost per conversion: ${roiExample.lookALike.totalCost} / {roiExample.lookALike.successProbability.toFixed(2)} = ${roiExample.lookALike.expectedCostPerConversion}.
        </p>
        <p style={{ fontWeight: 600 }}>
          Assigned to: {roiExample.assignedTo} ({roiExample.reason}).
        </p>
      </div>
      <p
        style={{
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-gray-400)',
          fontStyle: 'italic',
        }}
      >
        {roiExample.note}
      </p>

      <h4
        style={{
          fontSize: 'var(--font-size-sm)',
          fontWeight: 600,
          marginTop: '1.5rem',
          marginBottom: '0.75rem',
          color: 'var(--color-gray-700)',
        }}
      >
        Current Allocation Logic
      </h4>
      <p
        style={{
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-gray-600)',
          lineHeight: 1.7,
        }}
      >
        Each eligible user is evaluated for both strategies. The system calculates expected cost per
        conversion: total reward cost divided by estimated success probability. Users are assigned to the
        strategy with the lower expected cost per conversion. At ${(budget / 1000).toFixed(0)}K budget:{' '}
        {breakdown.quickWin.allocationPercent}% of eligible users assigned to Quick Win (higher volume,
        lower cost), {breakdown.lookALike.allocationPercent}% to Look-a-Like (lower volume, higher value).
        This ratio shifts daily as campaign performance data comes in.
      </p>
    </div>
  );
}

/* ───────── Execution Plan (expandable content) ───────── */
function ExecutionPlanContent({ plan }) {
  const phases = [
    { label: `Seed (Days ${plan.seed.days})`, text: plan.seed.description },
    { label: `Expand (Days ${plan.expand.days})`, text: plan.expand.description },
    { label: `Optimize (Day ${plan.optimize.days})`, text: plan.optimize.description },
  ];

  return (
    <div>
      {phases.map((phase, i) => (
        <div
          key={i}
          style={{
            marginBottom: '1.5rem',
            paddingLeft: '1rem',
            borderLeft: '3px solid var(--color-gray-200)',
          }}
        >
          <h4
            style={{
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
              color: 'var(--color-gray-800)',
              marginBottom: '0.375rem',
            }}
          >
            {phase.label}
          </h4>
          <p
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-gray-600)',
              lineHeight: 1.6,
            }}
          >
            {phase.text}
          </p>
        </div>
      ))}
      <p
        style={{
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-gray-500)',
          fontStyle: 'italic',
          padding: '0.75rem',
          backgroundColor: 'var(--color-gray-50)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        Guardrail: {plan.guardrail}
      </p>
    </div>
  );
}

/* ───────── Table styles ───────── */
const thStyle = {
  textAlign: 'left',
  padding: '0.75rem',
  fontSize: 'var(--font-size-sm)',
  fontWeight: 600,
  color: 'var(--color-gray-700)',
};

const trStyle = {
  borderBottom: '1px solid var(--color-gray-100)',
};

const tdLabelStyle = {
  padding: '0.625rem 0.75rem',
  fontSize: 'var(--font-size-sm)',
  fontWeight: 500,
  color: 'var(--color-gray-600)',
};

const tdStyle = {
  padding: '0.625rem 0.75rem',
  fontSize: 'var(--font-size-sm)',
  color: 'var(--color-gray-700)',
};

/* ═════════════════════════════════════════════════════════
   Main Page Component
   ═════════════════════════════════════════════════════════ */
export default function StrategyBuilderPage({ config, onNext }) {
  const {
    journeyInference,
    strategies,
    budgetSlider,
    projections: projData,
    strategyBreakdown150K,
    perUserROIExample,
    executionPlan,
  } = config;

  /* ── Phase management ── */
  const [phase, setPhase] = useState('journey'); // 'journey' | 'strategy'

  /* ── Journey phase state ── */
  const [lines, setLines] = useState([]);
  const [currentText, setCurrentText] = useState('');
  const [pipelineVisible, setPipelineVisible] = useState(0);
  const [connectorVisible, setConnectorVisible] = useState([false, false, false]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fadeOutJourney, setFadeOutJourney] = useState(false);

  /* ── Strategy phase state ── */
  const [strategyLines, setStrategyLines] = useState([]);
  const [strategyCurrentText, setStrategyCurrentText] = useState('');
  const [showBudget, setShowBudget] = useState(false);
  const [showProjectedFunnel, setShowProjectedFunnel] = useState(false);
  const [showKPIs, setShowKPIs] = useState(false);
  const [showStrategyCards, setShowStrategyCards] = useState(false);
  const [showExpandables, setShowExpandables] = useState(false);
  const [showLaunchCTA, setShowLaunchCTA] = useState(false);

  /* ── Budget + projections ── */
  const [budget, setBudget] = useState(budgetSlider.default);
  const proj = useProjections(projData, budget);

  const cancelRef = useRef(false);
  const hasStartedRef = useRef(false);

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const streamText = useCallback(
    async (text, duration, setTextFn, setLinesFn) => {
      const charDelay = duration / text.length;
      let built = '';
      for (let i = 0; i < text.length; i++) {
        if (cancelRef.current) return;
        built += text[i];
        setTextFn(built);
        await new Promise((r) => setTimeout(r, charDelay));
      }
      setLinesFn((prev) => [...prev, text]);
      setTextFn('');
    },
    []
  );

  /* ── Journey-phase animation ── */
  const runJourneyPhase = useCallback(async () => {
    await streamText(
      'Mapping how your users activate, from sign-up to recurring usage...',
      1500,
      setCurrentText,
      setLines
    );
    await sleep(1500);
    if (cancelRef.current) return;

    await streamText(
      '82% of your users follow this path:',
      1000,
      setCurrentText,
      setLines
    );
    await sleep(800);
    if (cancelRef.current) return;

    // Animate pipeline stages one by one with connectors
    for (let i = 1; i <= journeyInference.stages.length; i++) {
      if (cancelRef.current) return;
      setPipelineVisible(i);
      await sleep(400);
      if (i < journeyInference.stages.length) {
        await sleep(100);
        setConnectorVisible((prev) => {
          const next = [...prev];
          next[i - 1] = true;
          return next;
        });
        await sleep(200);
        await sleep(500);
      }
    }

    await sleep(600);
    if (cancelRef.current) return;
    setShowConfirm(true);
  }, [journeyInference, streamText]);

  /* ── Strategy-phase animation ── */
  const runStrategyPhase = useCallback(async () => {
    await streamText(
      'Building your referral strategy...',
      1200,
      setStrategyCurrentText,
      setStrategyLines
    );
    await sleep(800);
    if (cancelRef.current) return;

    setShowBudget(true);
    await sleep(600);
    if (cancelRef.current) return;

    setShowProjectedFunnel(true);
    await sleep(400);
    if (cancelRef.current) return;

    setShowKPIs(true);
    await sleep(400);
    if (cancelRef.current) return;

    setShowStrategyCards(true);
    await sleep(400);
    if (cancelRef.current) return;

    setShowExpandables(true);
    await sleep(300);
    if (cancelRef.current) return;

    setShowLaunchCTA(true);
  }, [streamText]);

  /* ── Start journey on mount ── */
  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    cancelRef.current = false;
    runJourneyPhase();
    return () => { cancelRef.current = true; };
  }, []);

  /* ── Confirm journey → transition to strategy phase ── */
  const handleConfirm = async () => {
    setShowConfirm(false);
    setFadeOutJourney(true);
    await sleep(400);
    setPhase('strategy');
    await sleep(100);
    runStrategyPhase();
  };

  /* ── Projected funnel stages (dynamic with slider) ── */
  const projectedStages = [
    { name: 'Sign-Up', users: proj.signups, percentage: 100 },
    { name: 'KYC Completed', users: Math.round(proj.signups * 0.72), percentage: 72 },
    { name: 'First Transaction', users: proj.firstTransactions, percentage: (proj.signups > 0 ? Math.round((proj.firstTransactions / proj.signups) * 100) : 34) },
    { name: 'Recurring', users: Math.round(proj.signups * 0.17), percentage: 17 },
  ];

  const formatCurrency = (val) => '$' + val.toLocaleString('en-US');

  /* ═══════ JOURNEY PHASE RENDER ═══════ */
  if (phase === 'journey') {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#FAFAFA',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        {/* Header */}
        <header
          style={{
            padding: '1.5rem 3rem',
            borderBottom: '1px solid #E5E5E5',
            backgroundColor: '#FFFFFF',
          }}
        >
          <Logo />
        </header>

        {/* Main Content */}
        <main
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: '0 3rem',
            maxWidth: '960px',
            margin: '0 auto',
            width: '100%',
          }}
        >
          {/* Framing text */}
          <div
            style={{
              marginTop: '2rem',
              marginBottom: '1.5rem',
              opacity: fadeOutJourney ? 0 : 1,
              transition: 'opacity 0.4s ease',
            }}
          >
            <p
              style={{
                fontSize: '16px',
                color: '#444',
                lineHeight: 1.7,
                maxWidth: '640px',
                margin: 0,
              }}
            >
              New users your referral program brings in will follow your product's
              activation journey. To design the right incentives, we first need to
              understand that journey.
            </p>
          </div>

          {/* Streaming text */}
          <div
            style={{
              minHeight: '50px',
              overflow: 'hidden',
              opacity: fadeOutJourney ? 0 : 1,
              transition: 'opacity 0.4s ease',
            }}
          >
            {lines.map((line, i) => (
              <p
                key={i}
                style={{
                  fontSize: '14px',
                  color: '#666',
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
                  color: '#666',
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
                    backgroundColor: '#666',
                    marginLeft: '2px',
                    animation: 'blink 1s step-end infinite',
                    verticalAlign: 'text-bottom',
                  }}
                />
              </p>
            )}
          </div>

          {/* Journey funnel — names only */}
          <div
            style={{
              flex: 1,
              minHeight: '20vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: fadeOutJourney ? 0 : 1,
              transition: 'opacity 0.4s ease',
            }}
          >
            {pipelineVisible > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  maxWidth: '872px',
                  margin: '0 auto',
                }}
              >
                {journeyInference.stages.map((stage, i) => (
                  <React.Fragment key={i}>
                    {/* Stage card — name only */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        opacity: i < pipelineVisible ? 1 : 0,
                        transform: i < pipelineVisible ? 'translateX(0)' : 'translateX(-20px)',
                        transition: 'opacity 0.4s ease, transform 0.4s ease',
                        width: '200px',
                        minWidth: '160px',
                        flexShrink: 1,
                      }}
                    >
                      <div
                        style={{
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #E5E5E5',
                          borderRadius: '8px',
                          padding: '20px 16px',
                          textAlign: 'center',
                          width: '100%',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '14px',
                            fontWeight: 700,
                            color: '#111',
                          }}
                        >
                          {stage.name}
                        </div>
                      </div>
                    </div>
                    {/* Connector */}
                    {i < journeyInference.stages.length - 1 && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: connectorVisible[i] ? 1 : 0,
                          transition: 'opacity 0.2s ease',
                          width: '24px',
                          flexShrink: 0,
                        }}
                      >
                        <div style={{ flex: 1, height: '2px', backgroundColor: '#CCCCCC' }} />
                        <span
                          style={{
                            color: '#999',
                            fontSize: '16px',
                            lineHeight: 1,
                            marginLeft: '-2px',
                          }}
                        >
                          ›
                        </span>
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>

          {/* "Does this match…" + Confirm Journey button */}
          {showConfirm && (
            <div
              style={{
                height: '80px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                opacity: fadeOutJourney ? 0 : 1,
                transition: 'opacity 0.3s ease',
              }}
            >
              <p style={{ fontSize: '16px', color: '#666', margin: 0 }}>
                Does this match how your users activate?
              </p>
              <button
                onClick={handleConfirm}
                style={{
                  background: '#111',
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  padding: '14px 32px',
                  fontSize: '16px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease',
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = '#333')}
                onMouseOut={(e) => (e.currentTarget.style.background = '#111')}
              >
                Confirm Journey
              </button>
            </div>
          )}

          {/* Spacer when confirm not yet shown */}
          {!showConfirm && <div style={{ height: '80px' }} />}
        </main>

        <style>{`
          @keyframes blink { 50% { opacity: 0; } }
        `}</style>
      </div>
    );
  }

  /* ═══════ STRATEGY PHASE RENDER ═══════ */
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header
        style={{
          padding: '1.5rem 3rem',
          borderBottom: '1px solid var(--color-gray-100)',
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
        {/* ── Compact approved journey ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            backgroundColor: 'var(--color-gray-50)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-gray-200)',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: '14px', color: 'var(--color-gray-500)' }}>
            Your journey:
          </span>
          {journeyInference.stages.map((stage, i) => (
            <React.Fragment key={i}>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--color-gray-800)',
                }}
              >
                {stage.name}
              </span>
              {i < journeyInference.stages.length - 1 && (
                <span style={{ color: 'var(--color-gray-400)', fontSize: '12px' }}>→</span>
              )}
            </React.Fragment>
          ))}
          <Badge variant="success">Confirmed</Badge>
        </div>

        {/* ── Strategy streaming text ── */}
        <div style={{ minHeight: '30px', marginBottom: '1.5rem' }}>
          {strategyLines.map((line, i) => (
            <p
              key={i}
              style={{
                fontSize: '14px',
                color: '#666',
                lineHeight: 1.6,
                margin: 0,
                marginBottom: '4px',
              }}
            >
              {line}
            </p>
          ))}
          {strategyCurrentText && (
            <p
              style={{
                fontSize: '14px',
                color: '#666',
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              {strategyCurrentText}
              <span
                style={{
                  display: 'inline-block',
                  width: '2px',
                  height: '1em',
                  backgroundColor: '#666',
                  marginLeft: '2px',
                  animation: 'blink 1s step-end infinite',
                  verticalAlign: 'text-bottom',
                }}
              />
            </p>
          )}
        </div>

        {/* ── Budget slider ── */}
        {showBudget && (
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
                marginBottom: '1rem',
              }}
            >
              Set your monthly budget cap
            </h3>
            <div style={{ marginBottom: '1.25rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.75rem',
                }}
              >
                <span
                  style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-gray-500)',
                  }}
                >
                  {formatCurrency(budgetSlider.min)}
                </span>
                <span
                  style={{
                    fontSize: 'var(--font-size-2xl)',
                    fontWeight: 700,
                    color: 'var(--color-black)',
                  }}
                >
                  <AnimatedNumber value={budget} prefix="$" duration={200} />
                </span>
                <span
                  style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-gray-500)',
                  }}
                >
                  {formatCurrency(budgetSlider.max)}
                </span>
              </div>
              <input
                type="range"
                min={budgetSlider.min}
                max={budgetSlider.max}
                step={budgetSlider.step}
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                style={{
                  width: '100%',
                  height: '8px',
                  appearance: 'none',
                  background: `linear-gradient(to right, var(--color-black) ${((budget - budgetSlider.min) / (budgetSlider.max - budgetSlider.min)) * 100}%, var(--color-gray-200) ${((budget - budgetSlider.min) / (budgetSlider.max - budgetSlider.min)) * 100}%)`,
                  borderRadius: '4px',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              />
            </div>
          </section>
        )}

        {/* ── Projected funnel impact ── */}
        {showProjectedFunnel && (
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
                marginBottom: '1rem',
              }}
            >
              Projected Funnel Impact
            </h3>
            <JourneyPipeline
              stages={projectedStages}
              visibleCount={projectedStages.length}
            />
          </section>
        )}

        {/* ── Supporting KPIs ── */}
        {showKPIs && (
          <section
            style={{
              marginBottom: '2rem',
              animation: 'fadeIn 0.4s ease forwards',
            }}
          >
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <MetricCard label="Conv Rate">
                <AnimatedNumber value={proj.convRate} suffix="%" duration={300} />
              </MetricCard>
              <MetricCard label="CAC">
                <AnimatedNumber value={proj.cac} prefix="$" duration={300} />
              </MetricCard>
              <MetricCard label="Rev / Referral">
                <AnimatedNumber value={proj.revPerReferral} prefix="$" duration={300} />
              </MetricCard>
              <MetricCard label="ROI">
                <AnimatedNumber
                  value={proj.roi}
                  suffix="x"
                  duration={300}
                  formatter={(v) => (v / 10).toFixed(1)}
                />
              </MetricCard>
              <MetricCard label="Fraud Saved">
                <AnimatedNumber value={proj.fraudSaved} prefix="$" duration={300} />
              </MetricCard>
            </div>
          </section>
        )}

        {/* ── Strategy summary cards ── */}
        {showStrategyCards && (
          <section
            style={{
              marginBottom: '2rem',
              animation: 'fadeIn 0.4s ease forwards',
            }}
          >
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <StrategySummaryCard strategy={strategies.quickWin} variant="quickwin" />
              <StrategySummaryCard strategy={strategies.lookALike} variant="lookalike" />
            </div>
          </section>
        )}

        {/* ── Expandable sections ── */}
        {showExpandables && (
          <section
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              animation: 'fadeIn 0.4s ease forwards',
            }}
          >
            <Expandable title="View Full Strategy Detail">
              <StrategyDetailContent
                breakdown={strategyBreakdown150K}
                strategies={strategies}
                roiExample={perUserROIExample}
                budget={150000}
              />
            </Expandable>
            <Expandable title="View Execution Plan">
              <ExecutionPlanContent plan={executionPlan} />
            </Expandable>
          </section>
        )}
      </main>

      {/* ── Bottom bar: Launch Campaigns ── */}
      {showLaunchCTA && (
        <div
          style={{
            position: 'sticky',
            bottom: 0,
            borderTop: '1px solid var(--color-gray-200)',
            backgroundColor: 'var(--color-white)',
            padding: '1.25rem 3rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
          }}
          className="bottom-bar"
        >
          <CTAButton onClick={onNext}>Launch Campaigns</CTAButton>
          <p
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-gray-400)',
            }}
          >
            In production, this triggers autonomous execution. In this demo, we'll
            show you projected 30-day results.
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
