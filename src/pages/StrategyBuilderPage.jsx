import React, { useEffect, useState, useRef, useCallback } from 'react';
import Logo from '../components/Logo.jsx';
import CTAButton from '../components/CTAButton.jsx';
import JourneyPipeline from '../components/JourneyPipeline.jsx';
import AnimatedNumber from '../components/AnimatedNumber.jsx';
import Badge from '../components/Badge.jsx';
import Expandable from '../components/Expandable.jsx';
import { useProjections } from '../hooks/useProjections.js';

/* ───────── Info Row (label + value pair) ───────── */
function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <span
        style={{
          fontWeight: 600,
          color: 'var(--color-gray-500)',
          minWidth: '70px',
          flexShrink: 0,
          fontSize: 'var(--font-size-sm)',
        }}
      >
        {label}
      </span>
      <span style={{ color: 'var(--color-gray-700)', fontSize: 'var(--font-size-sm)' }}>
        {value}
      </span>
    </div>
  );
}

/* ───────── Strategy Card (enriched) ───────── */
function StrategyCard({ strategy, variant }) {
  const tagLine =
    variant === 'quickwin'
      ? 'High volume \u00b7 Lower cost'
      : 'Lower volume \u00b7 Higher LTV';

  return (
    <div
      style={{
        flex: 1,
        border: '1px solid var(--color-gray-200)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '0.75rem',
        }}
      >
        <Badge variant={variant}>{strategy.name}</Badge>
        <span style={{ fontSize: '12px', color: 'var(--color-gray-400)' }}>{tagLine}</span>
      </div>
      <h3
        style={{
          fontSize: 'var(--font-size-lg)',
          fontWeight: 700,
          marginBottom: '1rem',
          color: 'var(--color-gray-900)',
        }}
      >
        {strategy.headline}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <InfoRow label="Target" value={strategy.target} />
        <InfoRow label="Success" value={strategy.successMetric} />
        <InfoRow
          label="Reward"
          value={`$${strategy.rewardPerSide}/side \u00b7 ${strategy.rewardTypes.join(' or ')}`}
        />
        <InfoRow label="Timing" value={strategy.timing} />
      </div>
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

/* ───────── Preview Card (referrer / referee mockup) ───────── */
function PreviewCard({ label, data }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          fontSize: '11px',
          fontWeight: 700,
          color: 'var(--color-gray-400)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '0.5rem',
        }}
      >
        {label}
      </div>
      <div
        style={{
          flex: 1,
          border: '1px solid var(--color-gray-200)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          backgroundColor: '#fff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            color: 'var(--color-gray-400)',
            marginBottom: '1rem',
            fontStyle: 'italic',
          }}
        >
          {data.channel}
        </div>
        <h4
          style={{
            fontSize: 'var(--font-size-base)',
            fontWeight: 700,
            color: 'var(--color-gray-900)',
            marginBottom: '0.5rem',
          }}
        >
          {data.headline}
        </h4>
        <p
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-gray-600)',
            lineHeight: 1.5,
            marginBottom: '1rem',
          }}
        >
          {data.body}
        </p>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1.25rem',
            padding: '0.75rem',
            backgroundColor: 'var(--color-gray-50)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <span
            style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 700,
              color: 'var(--color-black)',
            }}
          >
            {data.rewardDisplay}
          </span>
          <span
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-gray-500)',
            }}
          >
            {data.rewardLabel}
          </span>
        </div>
        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              padding: '0.625rem 1.5rem',
              backgroundColor: 'var(--color-black)',
              color: 'var(--color-white)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
              textAlign: 'center',
            }}
          >
            {data.ctaText}
          </div>
        </div>
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
        Per-Strategy Breakdown at {formatBudget(budget)}
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
              <td style={tdStyle}>
                {breakdown.quickWin.eligibleReferrers.toLocaleString()}
              </td>
              <td style={tdStyle}>
                {breakdown.lookALike.eligibleReferrers.toLocaleString()}
              </td>
            </tr>
            <tr style={trStyle}>
              <td style={tdLabelStyle}>Projected referrals sent</td>
              <td style={tdStyle}>
                {breakdown.quickWin.projectedReferralsSent.toLocaleString()}
              </td>
              <td style={tdStyle}>
                {breakdown.lookALike.projectedReferralsSent.toLocaleString()}
              </td>
            </tr>
            <tr style={trStyle}>
              <td style={tdLabelStyle}>Projected conversions</td>
              <td style={tdStyle}>
                {breakdown.quickWin.projectedConversions.toLocaleString()}{' '}
                {breakdown.quickWin.conversionUnit}
              </td>
              <td style={tdStyle}>
                {breakdown.lookALike.projectedConversions.toLocaleString()}{' '}
                {breakdown.lookALike.conversionUnit}
              </td>
            </tr>
            <tr style={trStyle}>
              <td style={tdLabelStyle}>Reward per conversion</td>
              <td style={tdStyle}>
                ${breakdown.quickWin.rewardPerConversion} total ($
                {strategies.quickWin.rewardPerSide}/side x 2)
              </td>
              <td style={tdStyle}>
                ${breakdown.lookALike.rewardPerConversion} total ($
                {strategies.lookALike.rewardPerSide}/side x 2)
              </td>
            </tr>
            <tr style={trStyle}>
              <td style={tdLabelStyle}>Projected spend</td>
              <td style={tdStyle}>
                ${breakdown.quickWin.projectedSpend.toLocaleString()}
              </td>
              <td style={tdStyle}>
                ${breakdown.lookALike.projectedSpend.toLocaleString()}
              </td>
            </tr>
            <tr style={trStyle}>
              <td style={tdLabelStyle}>Allocation</td>
              <td style={tdStyle}>
                {breakdown.quickWin.allocationPercent}% of eligible users
              </td>
              <td style={tdStyle}>
                {breakdown.lookALike.allocationPercent}% of eligible users
              </td>
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
          Note: Remaining budget (~$
          {(breakdown.reservedBudget / 1000).toFixed(0)}K of the budget) is{' '}
          {breakdown.reservedNote.toLowerCase()}.
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
      <ul
        style={{
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-gray-600)',
          lineHeight: 1.8,
          paddingLeft: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        <li>Quick Win: Coupon vs. Account Credit x 2 message variants = 4 combinations.</li>
        <li>Look-a-Like: Cashback vs. Account Credit x 2 message variants = 4 combinations.</li>
        <li>
          Timing: Quick Win sends within 24h of eligibility detection. Look-a-Like sends at peak
          engagement time per user (inferred from historical activity patterns).
        </li>
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
        <p>User #{roiExample.userId}: Eligible for both strategies.</p>
        <p>
          Quick Win: ${roiExample.quickWin.costPerSide}/side x 2 = $
          {roiExample.quickWin.totalCost} total cost,{' '}
          {(roiExample.quickWin.successProbability * 100).toFixed(0)}% success probability.
          Expected cost per conversion: ${roiExample.quickWin.totalCost} /{' '}
          {roiExample.quickWin.successProbability.toFixed(2)} = $
          {roiExample.quickWin.expectedCostPerConversion}.
        </p>
        <p>
          Look-a-Like: ${roiExample.lookALike.costPerSide}/side x 2 = $
          {roiExample.lookALike.totalCost} total cost,{' '}
          {(roiExample.lookALike.successProbability * 100).toFixed(0)}% success probability.
          Expected cost per conversion: ${roiExample.lookALike.totalCost} /{' '}
          {roiExample.lookALike.successProbability.toFixed(2)} = $
          {roiExample.lookALike.expectedCostPerConversion}.
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
        conversion: total reward cost divided by estimated success probability. Users are assigned to
        the strategy with the lower expected cost per conversion. At $
        {(budget / 1000).toFixed(0)}K budget:{' '}
        {breakdown.quickWin.allocationPercent}% of eligible users assigned to Quick Win (higher
        volume, lower cost), {breakdown.lookALike.allocationPercent}% to Look-a-Like (lower volume,
        higher value). This ratio shifts daily as campaign performance data comes in.
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
   Main Page Component — single continuous reveal
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
    refereeTouchpoints,
    refereePreview,
  } = config;

  /* ── Streaming text state ── */
  const [lines, setLines] = useState([]);
  const [currentText, setCurrentText] = useState('');

  /* ── Progressive reveal flags (time-based, no user interaction) ── */
  const [showPipeline, setShowPipeline] = useState(false);
  const [showBudget, setShowBudget] = useState(false);
  const [showFunnel, setShowFunnel] = useState(false);
  const [showKPIs, setShowKPIs] = useState(false);
  const [showStrategies, setShowStrategies] = useState(false);
  const [showRefereeJourney, setShowRefereeJourney] = useState(false);
  const [showExecution, setShowExecution] = useState(false);
  const [showExpandables, setShowExpandables] = useState(false);
  const [showLaunchCTA, setShowLaunchCTA] = useState(false);

  /* ── Budget + projections ── */
  const [budget, setBudget] = useState(budgetSlider.default);
  const proj = useProjections(projData, budget);

  const cancelRef = useRef(false);
  const hasStartedRef = useRef(false);

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const streamText = useCallback(
    async (text, duration) => {
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
    },
    []
  );

  /* ── Single animation sequence on mount ── */
  const runReveal = useCallback(async () => {
    // Brief streaming analysis (~3 seconds total)
    await streamText(
      'Analyzing 847,000 customer records across 18 event types...',
      1200
    );
    await sleep(500);
    if (cancelRef.current) return;

    await streamText(
      '82% follow a clear activation path. Designing strategy...',
      1200
    );
    await sleep(500);
    if (cancelRef.current) return;

    // 1. Pipeline as context
    setShowPipeline(true);
    await sleep(600);
    if (cancelRef.current) return;

    // 2. Budget slider — the dial
    setShowBudget(true);
    await sleep(400);
    if (cancelRef.current) return;

    // 3. Projected funnel — the hook
    setShowFunnel(true);
    await sleep(400);
    if (cancelRef.current) return;

    // 4. Supporting KPIs
    setShowKPIs(true);
    await sleep(400);
    if (cancelRef.current) return;

    // 5. Strategy cards — how Edoo gets there
    setShowStrategies(true);
    await sleep(400);
    if (cancelRef.current) return;

    // 6. Referee experience preview
    setShowRefereeJourney(true);
    await sleep(400);
    if (cancelRef.current) return;

    // 7. Execution timeline
    setShowExecution(true);
    await sleep(300);
    if (cancelRef.current) return;

    // 8. Expandable deep detail
    setShowExpandables(true);
    await sleep(200);
    if (cancelRef.current) return;

    // 9. Launch CTA
    setShowLaunchCTA(true);
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

  /* ── Projected funnel stages (dynamic with slider) ── */
  const projectedStages = [
    { name: 'Sign-Up', users: proj.signups, percentage: 100 },
    {
      name: 'KYC Completed',
      users: Math.round(proj.signups * 0.72),
      percentage: 72,
    },
    {
      name: 'First Transaction',
      users: proj.firstTransactions,
      percentage:
        proj.signups > 0
          ? Math.round((proj.firstTransactions / proj.signups) * 100)
          : 34,
    },
    {
      name: 'Recurring',
      users: Math.round(proj.signups * 0.17),
      percentage: 17,
    },
  ];

  /* ── Pipeline annotations (where each strategy triggers) ── */
  const pipelineAnnotations = {
    0: { text: 'Quick Win', variant: 'quickwin' },
    2: { text: 'Look-a-Like', variant: 'lookalike' },
  };

  const formatCurrency = (val) => '$' + val.toLocaleString('en-US');

  /* ── Execution plan phases ── */
  const execPhases = [
    { label: `Seed (Days ${executionPlan.seed.days})`, text: executionPlan.seed.description },
    {
      label: `Expand (Days ${executionPlan.expand.days})`,
      text: executionPlan.expand.description,
    },
    {
      label: `Optimize (Day ${executionPlan.optimize.days})`,
      text: executionPlan.optimize.description,
    },
  ];

  /* ═══════ RENDER ═══════ */
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
        {/* ── Streaming text ── */}
        <div style={{ minHeight: '50px', marginBottom: '1.5rem' }}>
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

        {/* ── 1. Journey pipeline as context (with strategy annotations) ── */}
        {showPipeline && (
          <section
            style={{
              marginBottom: '2rem',
              animation: 'fadeIn 0.4s ease forwards',
            }}
          >
            <JourneyPipeline
              stages={journeyInference.stages}
              visibleCount={journeyInference.stages.length}
              annotations={pipelineAnnotations}
              showManagementBracket={true}
            />
          </section>
        )}

        {/* ── 2. Budget slider ── */}
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

        {/* ── 3. Projected funnel impact ── */}
        {showFunnel && (
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

        {/* ── 4. Supporting KPIs ── */}
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

        {/* ── 5. Strategy cards ── */}
        {showStrategies && (
          <section
            style={{
              marginBottom: '2rem',
              animation: 'fadeIn 0.4s ease forwards',
            }}
          >
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <StrategyCard strategy={strategies.quickWin} variant="quickwin" />
              <StrategyCard strategy={strategies.lookALike} variant="lookalike" />
            </div>
          </section>
        )}

        {/* ── 6. Referee experience preview (side-by-side) ── */}
        {showRefereeJourney && (
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
              The Referral Experience
            </h3>
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-gray-500)',
                marginBottom: '1rem',
              }}
            >
              What your users see at each side of the referral flow
            </p>
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem' }}>
              <PreviewCard label="REFERRER SEES" data={refereePreview.referrer} />
              <PreviewCard label="REFEREE SEES" data={refereePreview.referee} />
            </div>
            {/* Compact journey steps showing full automation scope */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                flexWrap: 'wrap',
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--color-gray-50)',
                borderRadius: 'var(--radius-md)',
                border: '1px dashed var(--color-gray-300)',
              }}
            >
              <span
                style={{
                  fontSize: '12px',
                  color: 'var(--color-gray-500)',
                  fontWeight: 600,
                }}
              >
                Edoo automates:
              </span>
              {refereeTouchpoints.map((tp, i) => (
                <React.Fragment key={i}>
                  <span
                    style={{
                      fontSize: '12px',
                      color: 'var(--color-gray-600)',
                    }}
                  >
                    {tp.step}
                  </span>
                  {i < refereeTouchpoints.length - 1 && (
                    <span
                      style={{
                        fontSize: '10px',
                        color: 'var(--color-gray-300)',
                      }}
                    >
                      {'\u2192'}
                    </span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </section>
        )}

        {/* ── 7. Execution timeline ── */}
        {showExecution && (
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
              Execution Timeline
            </h3>
            <div
              style={{
                border: '1px solid var(--color-gray-200)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                marginBottom: '0.75rem',
              }}
            >
              {execPhases.map((phase, i) => (
                <div
                  key={i}
                  style={{
                    marginBottom: i < execPhases.length - 1 ? '1.25rem' : 0,
                    paddingLeft: '1rem',
                    borderLeft: '3px solid var(--color-gray-200)',
                  }}
                >
                  <h4
                    style={{
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 600,
                      color: 'var(--color-gray-800)',
                      marginBottom: '0.25rem',
                    }}
                  >
                    {phase.label}
                  </h4>
                  <p
                    style={{
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--color-gray-600)',
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    {phase.text}
                  </p>
                </div>
              ))}
            </div>
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
              Guardrail: {executionPlan.guardrail}
            </p>
          </section>
        )}

        {/* ── 8. Expandable deep detail ── */}
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
          </section>
        )}
      </main>

      {/* ── 9. Bottom bar: Launch Campaigns ── */}
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
        >
          <CTAButton onClick={onNext}>Launch Campaigns</CTAButton>
          <p
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-gray-400)',
            }}
          >
            In production, this triggers autonomous execution. In this demo, we'll show you
            projected 30-day results.
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
