import React, { useEffect, useState, useRef, useCallback } from 'react';
import Logo from '../components/Logo.jsx';
import CTAButton from '../components/CTAButton.jsx';
import JourneyPipeline from '../components/JourneyPipeline.jsx';
import Badge from '../components/Badge.jsx';

export default function AnalysisPage({ config, onNext }) {
  const { journeyInference, streamingText } = config;

  const [phase, setPhase] = useState(1);
  const [lines, setLines] = useState([]);
  const [currentText, setCurrentText] = useState('');
  const [pipelineVisible, setPipelineVisible] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [showViewStrategy, setShowViewStrategy] = useState(false);
  const [annotations, setAnnotations] = useState({});
  const [conversionLabels, setConversionLabels] = useState({});
  const cancelRef = useRef(false);
  const bottomRef = useRef(null);
  const hasStartedRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, []);

  const streamText = useCallback(
    async (text, duration) => {
      const charDelay = duration / text.length;
      let built = '';
      for (let i = 0; i < text.length; i++) {
        if (cancelRef.current) return;
        built += text[i];
        setCurrentText(built);
        if (i % 3 === 0) scrollToBottom();
        await new Promise((r) => setTimeout(r, charDelay));
      }
      setLines((prev) => [...prev, text]);
      setCurrentText('');
      scrollToBottom();
    },
    [scrollToBottom]
  );

  const runPhase1 = useCallback(async () => {
    for (const item of streamingText.phase1) {
      if (cancelRef.current) return;

      if (item.type === 'pause') {
        await new Promise((r) => setTimeout(r, item.duration));
      } else if (item.type === 'action' && item.action === 'animatePipeline') {
        // Animate pipeline stages in one at a time
        for (let i = 1; i <= journeyInference.stages.length; i++) {
          setPipelineVisible(i);
          await new Promise((r) => setTimeout(r, 500));
        }
      } else if (item.type === 'text') {
        await streamText(item.text, item.duration);
      }
    }
    setShowConfirm(true);
  }, [streamingText, journeyInference, streamText]);

  const runPhase2 = useCallback(async () => {
    setShowConfirm(false);

    for (const item of streamingText.phase2) {
      if (cancelRef.current) return;

      if (item.type === 'pause') {
        await new Promise((r) => setTimeout(r, item.duration));
      } else if (
        item.type === 'action' &&
        item.action === 'annotateConversion'
      ) {
        setAnnotations({
          0: { text: 'Quick Win — redemption triggers here', variant: 'quickwin' },
          2: {
            text: 'Look-a-Like — redemption triggers here',
            variant: 'lookalike',
          },
        });
        setConversionLabels({
          1: '34% convert within 90 days',
        });
        await new Promise((r) => setTimeout(r, 500));
      } else if (item.type === 'text') {
        await streamText(item.text, item.duration);
      }
    }
    setShowViewStrategy(true);
  }, [streamingText, streamText]);

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    cancelRef.current = false;
    runPhase1();
    return () => {
      cancelRef.current = true;
    };
  }, []);

  const handleConfirm = () => {
    setConfirmed(true);
    setPhase(2);
    runPhase2();
  };

  const handleRename = (index, newName) => {
    // Rename is a real interaction but doesn't affect downstream data
  };

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
          padding: '3rem 3rem',
          maxWidth: '960px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        <h2
          style={{
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 700,
            marginBottom: '2rem',
          }}
        >
          AI Analysis
        </h2>

        {/* Streaming Lines */}
        <div style={{ marginBottom: '2rem' }}>
          {lines.map((line, i) => (
            <p
              key={i}
              style={{
                fontSize: 'var(--font-size-base)',
                color: 'var(--color-gray-700)',
                marginBottom: '0.75rem',
                lineHeight: 1.6,
              }}
            >
              {line}
            </p>
          ))}
          {currentText && (
            <p
              style={{
                fontSize: 'var(--font-size-base)',
                color: 'var(--color-gray-700)',
                marginBottom: '0.75rem',
                lineHeight: 1.6,
              }}
            >
              {currentText}
              <span
                style={{
                  display: 'inline-block',
                  width: '2px',
                  height: '1em',
                  backgroundColor: 'var(--color-gray-700)',
                  marginLeft: '2px',
                  animation: 'blink 1s step-end infinite',
                  verticalAlign: 'text-bottom',
                }}
              />
            </p>
          )}
        </div>

        {/* Journey Pipeline */}
        {pipelineVisible > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <JourneyPipeline
              stages={journeyInference.stages}
              visibleCount={pipelineVisible}
              annotations={annotations}
              conversionLabels={conversionLabels}
              editable={!confirmed}
              onRename={handleRename}
            />
          </div>
        )}

        {/* Confirm Journey Button */}
        {showConfirm && !confirmed && (
          <div
            style={{
              marginTop: '2rem',
              padding: '1.5rem',
              backgroundColor: 'var(--color-gray-50)',
              borderRadius: 'var(--radius-lg)',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontSize: 'var(--font-size-base)',
                color: 'var(--color-gray-700)',
                marginBottom: '1rem',
              }}
            >
              Does this match your user journey?
            </p>
            <CTAButton onClick={handleConfirm}>Confirm Journey</CTAButton>
          </div>
        )}

        {/* View Strategy Button */}
        {showViewStrategy && (
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <CTAButton onClick={onNext}>View Strategy Proposal</CTAButton>
          </div>
        )}
        <div ref={bottomRef} />
      </main>

      <style>{`
        @keyframes blink {
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
