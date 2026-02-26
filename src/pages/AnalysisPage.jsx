import React, { useEffect, useState, useRef, useCallback } from 'react';
import Logo from '../components/Logo.jsx';
import JourneyPipeline from '../components/JourneyPipeline.jsx';

export default function AnalysisPage({ config, onNext }) {
  const { journeyInference, conversionAnalysis } = config;

  const [phase, setPhase] = useState(1);
  const [lines, setLines] = useState([]);
  const [currentText, setCurrentText] = useState('');
  const [pipelineVisible, setPipelineVisible] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [showViewStrategy, setShowViewStrategy] = useState(false);
  const [annotations, setAnnotations] = useState({});
  const [conversionAnnotation, setConversionAnnotation] = useState(null);
  const [showInsightCards, setShowInsightCards] = useState(false);
  const [showCard1, setShowCard1] = useState(false);
  const [showCard2, setShowCard2] = useState(false);
  const [phase2Lines, setPhase2Lines] = useState([]);
  const [phase2CurrentText, setPhase2CurrentText] = useState('');
  const [transitioning, setTransitioning] = useState(false);
  const [fadeOutPhase1, setFadeOutPhase1] = useState(false);
  const [connectorVisible, setConnectorVisible] = useState([false, false, false]);
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

  const runPhase1 = useCallback(async () => {
    // Line 1
    await streamText(
      'Scanning 847,000 customer records...',
      1500,
      setCurrentText,
      setLines
    );
    await sleep(1500);
    if (cancelRef.current) return;

    // Line 2
    await streamText(
      'Mapping how your users move from sign-up to active engagement...',
      1500,
      setCurrentText,
      setLines
    );
    await sleep(2000);
    if (cancelRef.current) return;

    // Line 3
    await streamText(
      'Found a clear pattern. 82% of your customers follow this journey:',
      1500,
      setCurrentText,
      setLines
    );
    await sleep(1000);
    if (cancelRef.current) return;

    // Animate pipeline stages one by one with connectors
    for (let i = 1; i <= journeyInference.stages.length; i++) {
      if (cancelRef.current) return;
      setPipelineVisible(i);
      await sleep(400); // card animation time
      if (i < journeyInference.stages.length) {
        // Show connector after card
        await sleep(100);
        setConnectorVisible((prev) => {
          const next = [...prev];
          next[i - 1] = true;
          return next;
        });
        await sleep(200); // connector fade in
        await sleep(500); // pause before next card
      }
    }

    await sleep(500);
    if (cancelRef.current) return;

    // Line 4 (after pipeline fully visible)
    await streamText(
      '4 key stages from sign-up to repeat usage. This is how your users activate.',
      1500,
      setCurrentText,
      setLines
    );

    await sleep(500);
    if (cancelRef.current) return;
    setShowConfirm(true);
  }, [journeyInference, streamText]);

  const runPhase2 = useCallback(async () => {
    // Phase 2 Line 1
    await streamText(
      'Calculating conversion between referral milestones...',
      1500,
      setPhase2CurrentText,
      setPhase2Lines
    );
    await sleep(1500);
    if (cancelRef.current) return;

    // Phase 2 Line 2
    await streamText(
      'Based on the last 90 days of your data:',
      1000,
      setPhase2CurrentText,
      setPhase2Lines
    );
    await sleep(1000);
    if (cancelRef.current) return;

    // Annotations appear on pipeline
    setAnnotations({
      0: { text: 'Quick Win — redemption triggers here', variant: 'quickwin' },
      2: { text: 'Look-a-Like — redemption triggers here', variant: 'lookalike' },
    });
    setConversionAnnotation({
      rate: '34%',
      label: 'convert within 90 days',
    });

    await sleep(500);
    if (cancelRef.current) return;

    // Insight cards appear staggered
    setShowInsightCards(true);
    setShowCard1(true);
    await sleep(600);
    if (cancelRef.current) return;
    setShowCard2(true);
    await sleep(600);
    if (cancelRef.current) return;

    // View Strategy CTA
    setShowViewStrategy(true);
  }, [streamText]);

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    cancelRef.current = false;
    runPhase1();
    return () => {
      cancelRef.current = true;
    };
  }, []);

  const handleConfirm = async () => {
    setConfirmed(true);
    setShowConfirm(false);

    // Fade out phase 1 content
    setFadeOutPhase1(true);
    await sleep(400);

    setTransitioning(true);
    setPhase(2);

    // Small delay for DOM update
    await sleep(100);
    runPhase2();
  };

  const { rewardPricingExample } = conversionAnalysis;

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--accent-subtle)',
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: '1.5rem 3rem',
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'var(--surface)',
        }}
      >
        <Logo />
      </header>

      {/* Main Content — flexbox column layout */}
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
        {/* Page Heading — fixed height */}
        <div style={{ height: '60px', display: 'flex', alignItems: 'center' }}>
          <h2
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            AI Analysis
          </h2>
        </div>

        {/* Streaming Text Area — fixed height, does not grow */}
        <div
          style={{
            maxHeight: phase === 1 ? '100px' : '60px',
            minHeight: phase === 1 ? '80px' : '50px',
            overflow: 'hidden',
            position: 'relative',
            transition: 'max-height var(--transition-slow), min-height var(--transition-slow)',
          }}
        >
          {phase === 1 && (
            <div
              style={{
                opacity: fadeOutPhase1 ? 0 : 1,
                transition: 'opacity var(--transition-slow)',
              }}
            >
              {lines.map((line, i) => (
                <p
                  key={i}
                  style={{
                    fontSize: '14px',
                    color: 'var(--text-secondary)',
                    marginBottom: '4px',
                    lineHeight: 1.6,
                    margin: 0,
                    padding: 0,
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
                    padding: 0,
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
          )}

          {phase === 2 && (
            <div
              style={{
                opacity: 1,
                transition: 'opacity var(--transition-slow)',
              }}
            >
              {phase2Lines.map((line, i) => (
                <p
                  key={i}
                  style={{
                    fontSize: '14px',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                    margin: 0,
                    padding: 0,
                    marginBottom: '4px',
                  }}
                >
                  {line}
                </p>
              ))}
              {phase2CurrentText && (
                <p
                  style={{
                    fontSize: '14px',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                    margin: 0,
                    padding: 0,
                  }}
                >
                  {phase2CurrentText}
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
          )}
        </div>

        {/* Pipeline Area — hero element, flex: 1 to fill available space */}
        <div
          style={{
            flex: 1,
            minHeight: phase === 1 ? '40vh' : '35vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'min-height var(--transition-slow)',
            paddingTop: phase === 2 && Object.keys(annotations).length > 0 ? '50px' : '0',
          }}
        >
          {pipelineVisible > 0 && (
            <JourneyPipeline
              stages={journeyInference.stages}
              visibleCount={pipelineVisible}
              annotations={annotations}
              conversionAnnotation={conversionAnnotation}
              animateFill={true}
            />
          )}
        </div>

        {/* Phase 1: Confirm Journey area */}
        {phase === 1 && showConfirm && !confirmed && (
          <div
            style={{
              height: '80px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              opacity: fadeOutPhase1 ? 0 : 1,
              transition: 'opacity var(--transition-slow)',
            }}
          >
            <p
              style={{
                fontSize: '16px',
                color: 'var(--text-secondary)',
                margin: 0,
              }}
            >
              Does this match your user journey?
            </p>
            <button
              onClick={handleConfirm}
              style={{
                background: 'var(--accent)',
                color: 'var(--color-white)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 32px',
                fontSize: '16px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                transition: 'background var(--transition-base)',
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = 'var(--accent-hover)')}
              onMouseOut={(e) => (e.currentTarget.style.background = 'var(--accent)')}
            >
              Confirm Journey
            </button>
          </div>
        )}

        {/* Phase 2: Insight Cards */}
        {phase === 2 && showInsightCards && (
          <div
            style={{
              minHeight: '200px',
              display: 'flex',
              gap: '24px',
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginTop: '16px',
            }}
          >
            {/* Card 1 — Conversion Rate */}
            <div
              style={{
                width: 'calc(50% - 12px)',
                minWidth: '280px',
                minHeight: '160px',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-sm)',
                padding: '24px',
                textAlign: 'center',
                opacity: showCard1 ? 1 : 0,
                transform: showCard1 ? 'translateY(0)' : 'translateY(20px)',
                transition: 'opacity var(--transition-slow), transform var(--transition-slow)',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--text-tertiary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '12px',
                }}
              >
                SIGN-UP → FIRST TRANSACTION
              </div>
              <div
                style={{
                  fontSize: '32px',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  lineHeight: 1.1,
                }}
              >
                34%
              </div>
              <div
                style={{
                  fontSize: '15px',
                  color: 'var(--text-secondary)',
                  marginTop: '4px',
                  marginBottom: '12px',
                }}
              >
                convert within 90 days
              </div>
              <div
                style={{
                  fontSize: '13px',
                  color: 'var(--text-tertiary)',
                  lineHeight: 1.5,
                }}
              >
                For every 100 referred users who sign up,
                <br />
                ~34 complete their first transaction.
              </div>
            </div>

            {/* Card 2 — Reward Pricing */}
            <div
              style={{
                width: 'calc(50% - 12px)',
                minWidth: '280px',
                minHeight: '160px',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-sm)',
                padding: '24px',
                textAlign: 'center',
                opacity: showCard2 ? 1 : 0,
                transform: showCard2 ? 'translateY(0)' : 'translateY(20px)',
                transition: 'opacity var(--transition-slow), transform var(--transition-slow)',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--text-tertiary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '12px',
                }}
              >
                REWARD PRICING
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'center',
                  gap: '12px',
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      fontSize: '32px',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      lineHeight: 1.1,
                    }}
                  >
                    ${rewardPricingExample.signupReward}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    sign-up reward
                  </div>
                </div>
                <span style={{ fontSize: '24px', color: 'var(--text-tertiary)', lineHeight: 1 }}>→</span>
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      fontSize: '32px',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      lineHeight: 1.1,
                    }}
                  >
                    ~${rewardPricingExample.effectiveCostPerTransaction}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    per active user
                  </div>
                </div>
              </div>
              <div
                style={{
                  fontSize: '13px',
                  color: 'var(--text-tertiary)',
                  lineHeight: 1.5,
                  marginTop: '12px',
                }}
              >
                A $40 reward for sign-up implies ~$118
                <br />
                effective cost per first transaction
                <br />
                ($40 ÷ 0.34). This validates the
                <br />
                $100–$200 range for deeper
                <br />
                engagement goals.
              </div>
            </div>
          </div>
        )}

        {/* Phase 2: View Strategy Proposal CTA */}
        {phase === 2 && showViewStrategy && (
          <div
            style={{
              height: '80px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: '24px',
              opacity: showViewStrategy ? 1 : 0,
              animation: 'fadeIn 0.3s ease forwards',
            }}
          >
            <button
              onClick={onNext}
              style={{
                background: 'var(--accent)',
                color: 'var(--color-white)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 32px',
                fontSize: '16px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                transition: 'background var(--transition-base)',
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = 'var(--accent-hover)')}
              onMouseOut={(e) => (e.currentTarget.style.background = 'var(--accent)')}
            >
              View Strategy Proposal
            </button>
          </div>
        )}

        {/* Spacer for phase 1 when confirm is not yet shown */}
        {phase === 1 && !showConfirm && (
          <div style={{ height: '80px' }} />
        )}
      </main>

      <style>{`
        @keyframes blink {
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
