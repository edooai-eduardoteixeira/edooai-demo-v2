import React, { useEffect, useState, useRef, useCallback } from 'react';
import Logo from '../components/Logo.jsx';
import CTAButton from '../components/CTAButton.jsx';
import AnimatedNumber from '../components/AnimatedNumber.jsx';
import Expandable from '../components/Expandable.jsx';
import { useProjections } from '../hooks/useProjections.js';

/* ───────── KPI Card ───────── */
function KPICard({ label, children }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: '120px',
        padding: '1rem',
        backgroundColor: 'var(--color-gray-50)',
        borderRadius: 'var(--radius-lg)',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: 'var(--font-size-xs)',
          fontWeight: 500,
          color: 'var(--color-gray-500)',
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
          color: 'var(--color-black)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ───────── Journey Step Card ───────── */
function JourneyStep({ step, index, isLast }) {
  return (
    <div style={{ display: 'flex', gap: '1rem', marginBottom: isLast ? 0 : '1.5rem' }}>
      {/* Step number + connector line */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minWidth: '32px',
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-black)',
            color: 'var(--color-white)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {index + 1}
        </div>
        {!isLast && (
          <div
            style={{
              width: '2px',
              flex: 1,
              backgroundColor: 'var(--color-gray-200)',
              marginTop: '4px',
            }}
          />
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, paddingBottom: isLast ? 0 : '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
          <h4
            style={{
              fontSize: 'var(--font-size-base)',
              fontWeight: 700,
              color: 'var(--color-gray-900)',
              margin: 0,
            }}
          >
            {step.step}
          </h4>
          <span
            style={{
              fontSize: '11px',
              color: 'var(--color-gray-400)',
              fontWeight: 500,
            }}
          >
            {step.recipient}
          </span>
        </div>
        <p
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-gray-600)',
            lineHeight: 1.5,
            margin: 0,
            marginBottom: '0.375rem',
          }}
        >
          {step.whatHappens}
        </p>
        <p
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-gray-500)',
            lineHeight: 1.5,
            margin: 0,
            fontStyle: 'italic',
          }}
        >
          Edoo decides: {step.edooDecides}
        </p>
        {step.reward && (
          <p
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-black)',
              fontWeight: 600,
              margin: 0,
              marginTop: '0.375rem',
            }}
          >
            {step.reward}
          </p>
        )}
      </div>
    </div>
  );
}

/* ───────── Reward Selector (mini pill UI) ───────── */
function RewardSelector({ label, options, selectedIndex = 0 }) {
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div
        style={{
          fontSize: '11px',
          fontWeight: 600,
          color: 'var(--color-gray-500)',
          marginBottom: '0.375rem',
        }}
      >
        {label}
      </div>
      <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
        {options.map((opt, i) => (
          <span
            key={i}
            style={{
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 500,
              borderRadius: '12px',
              border: '1px solid',
              borderColor: i === selectedIndex ? 'var(--color-black)' : 'var(--color-gray-200)',
              backgroundColor: i === selectedIndex ? 'var(--color-black)' : '#fff',
              color: i === selectedIndex ? 'var(--color-white)' : 'var(--color-gray-600)',
              cursor: 'pointer',
            }}
          >
            {opt}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ───────── Preview Card (referrer / referee mockup) ───────── */
function PreviewCard({ label, data }) {
  const hasRewardChoice = data.rewardOptions && data.giftOptions;

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
        {hasRewardChoice ? (
          <div style={{ marginBottom: '1.25rem' }}>
            <RewardSelector label="Choose your reward:" options={data.rewardOptions} selectedIndex={0} />
            <RewardSelector label="Gift your friend:" options={data.giftOptions} selectedIndex={0} />
          </div>
        ) : (
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
        )}
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

/* ───────── Operations Cycle Step ───────── */
function CycleStep({ step, index, total }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        padding: '0.75rem 0',
        borderBottom: index < total - 1 ? '1px solid var(--color-gray-100)' : 'none',
      }}
    >
      <span
        style={{
          fontSize: 'var(--font-size-sm)',
          fontWeight: 700,
          color: 'var(--color-black)',
          minWidth: '70px',
          flexShrink: 0,
        }}
      >
        {step.name}
      </span>
      <span
        style={{
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-gray-600)',
          lineHeight: 1.5,
        }}
      >
        {step.description}
      </span>
    </div>
  );
}

/* ───────── Risk Item ───────── */
function RiskItem({ label, description }) {
  return (
    <div
      style={{
        padding: '1rem',
        backgroundColor: 'var(--color-gray-50)',
        borderRadius: 'var(--radius-md)',
        marginBottom: '0.75rem',
      }}
    >
      <h4
        style={{
          fontSize: 'var(--font-size-sm)',
          fontWeight: 700,
          color: 'var(--color-gray-800)',
          marginBottom: '0.25rem',
        }}
      >
        {label}
      </h4>
      <p
        style={{
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-gray-600)',
          lineHeight: 1.5,
          margin: 0,
        }}
      >
        {description}
      </p>
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
    budgetAnnotation,
    projections: projData,
    redemptionJourney,
    refereePreview,
    offerDetails,
    operationsCycle,
    riskManagement,
    approvalScope,
  } = config;

  /* ── Budget + projections ── */
  const [budget, setBudget] = useState(budgetSlider.default);
  const proj = useProjections(projData, budget);

  /* ── Progressive reveal ── */
  const [showResult, setShowResult] = useState(false);
  const [showJourney, setShowJourney] = useState(false);
  const [showExecution, setShowExecution] = useState(false);
  const [showRisk, setShowRisk] = useState(false);
  const [showCTA, setShowCTA] = useState(false);

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

        {/* ════════════════════════════════════════════
            SECTION 1 — Result + Budget (one unit)
            ════════════════════════════════════════════ */}
        {showResult && (
          <section
            style={{
              marginBottom: '3rem',
              animation: 'fadeIn 0.4s ease forwards',
            }}
          >
            {/* Primary result */}
            <div
              style={{
                textAlign: 'center',
                padding: '2rem 0 1.5rem',
              }}
            >
              <div
                style={{
                  fontSize: '3.5rem',
                  fontWeight: 700,
                  color: 'var(--color-black)',
                  lineHeight: 1,
                  marginBottom: '0.5rem',
                }}
              >
                <AnimatedNumber value={proj.activeUsers} duration={300} />
              </div>
              <div
                style={{
                  fontSize: 'var(--font-size-lg)',
                  color: 'var(--color-gray-600)',
                  fontWeight: 500,
                }}
              >
                projected new active users in 30 days
              </div>
            </div>

            {/* KPI row */}
            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                marginBottom: '2rem',
              }}
            >
              <KPICard label="CAC">
                <AnimatedNumber value={proj.cac} prefix="$" duration={300} />
              </KPICard>
              <KPICard label="ROI">
                <span>{typeof proj.roi === 'number' ? proj.roi.toFixed(1) : proj.roi}x</span>
              </KPICard>
              <KPICard label="Conv Rate">
                <span>{typeof proj.convRate === 'number' ? proj.convRate.toFixed(1) : proj.convRate}%</span>
              </KPICard>
              <KPICard label="Fraud Saved">
                <AnimatedNumber value={proj.fraudSaved} prefix="$" duration={300} />
              </KPICard>
            </div>

            {/* Budget slider */}
            <div
              style={{
                padding: '1.5rem',
                backgroundColor: 'var(--color-gray-50)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem',
                }}
              >
                <h3
                  style={{
                    fontSize: 'var(--font-size-base)',
                    fontWeight: 700,
                    margin: 0,
                  }}
                >
                  Monthly Budget
                </h3>
                <span
                  style={{
                    fontSize: 'var(--font-size-2xl)',
                    fontWeight: 700,
                    color: 'var(--color-black)',
                  }}
                >
                  <AnimatedNumber value={budget} prefix="$" duration={200} />
                </span>
              </div>
              <p
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-gray-500)',
                  margin: 0,
                  marginBottom: '1rem',
                }}
              >
                {recommendedBudget.rationale}
              </p>
              <div style={{ marginBottom: '0.75rem' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.5rem',
                  }}
                >
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-400)' }}>
                    {formatCurrency(budgetSlider.min)}
                  </span>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-400)' }}>
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
              <p
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-gray-400)',
                  margin: 0,
                  fontStyle: 'italic',
                }}
              >
                {budgetAnnotation}
              </p>
            </div>
          </section>
        )}

        {/* ════════════════════════════════════════════
            SECTION 2 — Redemption Journey
            ════════════════════════════════════════════ */}
        {showJourney && (
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
              The Redemption Journey
            </h3>
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-gray-500)',
                marginBottom: '1.5rem',
              }}
            >
              Success = referee makes a first transaction. Edoo manages the entire path.
            </p>

            {/* Journey steps */}
            <div
              style={{
                border: '1px solid var(--color-gray-200)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem',
                marginBottom: '1.5rem',
              }}
            >
              {redemptionJourney.map((step, i) => (
                <JourneyStep
                  key={i}
                  step={step}
                  index={i}
                  isLast={i === redemptionJourney.length - 1}
                />
              ))}
            </div>

            {/* Preview cards */}
            <h4
              style={{
                fontSize: 'var(--font-size-base)',
                fontWeight: 700,
                marginBottom: '0.75rem',
                color: 'var(--color-gray-700)',
              }}
            >
              What your users see
            </h4>
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <PreviewCard label="REFERRER SEES" data={refereePreview.referrer} />
              <PreviewCard label="REFEREE SEES" data={refereePreview.referee} />
            </div>

            {/* Expandable offer details */}
            <Expandable title="Offer details & personalization">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-gray-700)', marginBottom: '0.375rem' }}>
                    Reward structure
                  </h4>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)', lineHeight: 1.6, margin: 0 }}>
                    {offerDetails.rewardStructure}
                  </p>
                </div>
                <div>
                  <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-gray-700)', marginBottom: '0.375rem' }}>
                    Reward types
                  </h4>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)', lineHeight: 1.6, margin: 0 }}>
                    {offerDetails.rewardTypes}
                  </p>
                </div>
                <div>
                  <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-gray-700)', marginBottom: '0.375rem' }}>
                    Customer targeting
                  </h4>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)', lineHeight: 1.6, margin: 0 }}>
                    {offerDetails.targeting}
                  </p>
                </div>
                <div>
                  <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-gray-700)', marginBottom: '0.375rem' }}>
                    Personalization variables
                  </h4>
                  <ul style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)', lineHeight: 1.8, paddingLeft: '1.25rem', margin: 0 }}>
                    {offerDetails.personalization.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-gray-700)', marginBottom: '0.375rem' }}>
                    Offer window
                  </h4>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)', lineHeight: 1.6, margin: 0 }}>
                    {offerDetails.offerWindow}
                  </p>
                </div>
              </div>
            </Expandable>
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
                color: 'var(--color-gray-500)',
                marginBottom: '1.5rem',
              }}
            >
              {operationsCycle.summary}
            </p>

            {/* Daily cycle */}
            <div
              style={{
                border: '1px solid var(--color-gray-200)',
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
                        color: 'var(--color-black)',
                        padding: '4px 10px',
                        backgroundColor: 'var(--color-gray-100)',
                        borderRadius: '12px',
                      }}
                    >
                      {step.name}
                    </span>
                    {i < operationsCycle.steps.length - 1 && (
                      <span style={{ fontSize: '12px', color: 'var(--color-gray-300)', alignSelf: 'center' }}>
                        {'\u2192'}
                      </span>
                    )}
                  </React.Fragment>
                ))}
                <span style={{ fontSize: '12px', color: 'var(--color-gray-300)', alignSelf: 'center' }}>
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
                    backgroundColor: 'var(--color-gray-50)',
                    borderRadius: 'var(--radius-md)',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 600,
                      color: 'var(--color-gray-500)',
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
                      color: 'var(--color-black)',
                      marginBottom: '0.25rem',
                    }}
                  >
                    ~{phase.activeUsersPerDay}/day
                  </div>
                  <div
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-gray-400)',
                    }}
                  >
                    {phase.note}
                  </div>
                </div>
              ))}
            </div>

            {/* Budget pacing & offer lifecycle */}
            <Expandable title="Budget pacing & offer lifecycle">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-gray-700)', marginBottom: '0.375rem' }}>
                    Budget pacing
                  </h4>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)', lineHeight: 1.6, margin: 0 }}>
                    {operationsCycle.budgetPacing}
                  </p>
                </div>
                <div>
                  <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-gray-700)', marginBottom: '0.375rem' }}>
                    Offer lifecycle
                  </h4>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)', lineHeight: 1.6, margin: 0 }}>
                    {operationsCycle.offerLifecycle}
                  </p>
                </div>
              </div>
            </Expandable>
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
                color: 'var(--color-gray-500)',
                marginBottom: '1.5rem',
              }}
            >
              How Edoo protects your budget during continuous operations.
            </p>

            <RiskItem
              label={riskManagement.pacing.label}
              description={riskManagement.pacing.description}
            />
            <RiskItem
              label={riskManagement.offerLiability.label}
              description={riskManagement.offerLiability.description}
            />
            <RiskItem
              label={riskManagement.rewardTracking.label}
              description={riskManagement.rewardTracking.description}
            />
            <RiskItem
              label={riskManagement.anomalyDetection.label}
              description={riskManagement.anomalyDetection.description}
            />

            {/* Fraud */}
            <Expandable title="Fraud detection">
              <p
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-gray-600)',
                  lineHeight: 1.6,
                  marginBottom: '1.25rem',
                }}
              >
                Edoo autonomously issues financial rewards on behalf of your business. If a fraudulent referral succeeds, your budget is wasted. Three adversary profiles, each requiring a different detection strategy:
              </p>
              {riskManagement.fraud.map((item, i) => (
                <div
                  key={i}
                  style={{
                    marginBottom: '1.25rem',
                    paddingLeft: '1rem',
                    borderLeft: '3px solid var(--color-gray-200)',
                  }}
                >
                  {/* Title + scale badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <h4
                      style={{
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 600,
                        color: 'var(--color-gray-800)',
                        margin: 0,
                      }}
                    >
                      {item.type}
                    </h4>
                    <span
                      style={{
                        fontSize: '10px',
                        color: 'var(--color-gray-400)',
                        backgroundColor: 'var(--color-gray-50)',
                        border: '1px solid var(--color-gray-200)',
                        borderRadius: '9999px',
                        padding: '1px 8px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.scale}
                    </span>
                  </div>

                  {/* Description */}
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)', lineHeight: 1.5, margin: 0, marginBottom: '0.35rem' }}>
                    {item.description}
                  </p>

                  {/* Why it matters */}
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', margin: 0, marginBottom: '0.5rem', fontStyle: 'italic' }}>
                    {item.whyItMatters}
                  </p>

                  {/* Detection signals */}
                  <p style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-gray-500)', margin: 0, marginBottom: '0.25rem' }}>
                    Signals:
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '1.1rem', marginBottom: '0.4rem' }}>
                    {item.signals.map((signal, j) => (
                      <li
                        key={j}
                        style={{
                          fontSize: 'var(--font-size-xs)',
                          color: 'var(--color-gray-400)',
                          lineHeight: 1.5,
                        }}
                      >
                        {signal}
                      </li>
                    ))}
                  </ul>

                  {/* Response */}
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', margin: 0 }}>
                    <span style={{ fontWeight: 600 }}>Response:</span> {item.response}
                  </p>
                </div>
              ))}
              <p
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-gray-600)',
                  fontWeight: 600,
                  marginTop: '0.25rem',
                }}
              >
                {riskManagement.fraudSummary}
              </p>
            </Expandable>
          </section>
        )}
      </main>

      {/* ── Approve button (sticky bottom) ── */}
      {showCTA && (
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
