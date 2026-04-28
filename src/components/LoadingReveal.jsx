import React, { useEffect, useState } from 'react';

/*
 * LoadingReveal — composition-theater animation extracted from
 * StrategyBuilderPage. Plays a sequence of "reasoning" lines, each with a
 * spinner-then-checkmark transition, then collapses out of the layout.
 *
 *   t=0          line 1 visible (spinner)
 *   t=stepMs     line 2 visible (line 1 → checkmark)
 *   ...
 *   t=stepMs*n   all lines visible & checkmarked (phase: 'complete')
 *   t=+pauseMs   block fades and collapses (phase: 'revealing')
 *                onReveal fires here so the parent can start mounting its
 *                own content alongside the collapse
 *   t=+revealMs  block disappears (phase: 'done')
 *                onDone fires here
 *
 * Props:
 *   steps      array of strings (the reasoning lines)
 *   stepMs     ms per step (default 1400)
 *   pauseMs    pause after all steps complete (default 1200)
 *   revealMs   collapse animation duration (default 600)
 *   onReveal   called when the block starts collapsing
 *   onDone     called when the block has fully collapsed
 */
export default function LoadingReveal({
  steps,
  stepMs = 1400,
  pauseMs = 1200,
  revealMs = 600,
  onReveal,
  onDone,
}) {
  const [phase, setPhase] = useState('reasoning'); // reasoning | complete | revealing | done
  const [visibleLines, setVisibleLines] = useState(0);

  const isRevealed = phase === 'revealing' || phase === 'done';

  // Closure-scoped cancellation: each effect run has its own `cancelled` flag,
  // so the second mount under React.StrictMode can run to completion even after
  // the first mount's cleanup has fired. (Refs persist across StrictMode
  // unmount/remount, so a hasStartedRef + cancelRef pattern would deadlock.)
  useEffect(() => {
    let cancelled = false;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    const run = async () => {
      for (let i = 1; i <= steps.length; i++) {
        if (cancelled) return;
        setVisibleLines(i);
        await sleep(stepMs);
      }
      if (cancelled) return;
      setPhase('complete');
      await sleep(pauseMs);
      if (cancelled) return;
      setPhase('revealing');
      onReveal?.();
      await sleep(revealMs);
      if (cancelled) return;
      setPhase('done');
      onDone?.();
    };
    run();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      role="status"
      style={{
        overflow: 'hidden',
        transition: `max-height ${revealMs}ms ease, opacity ${Math.round(revealMs * 0.7)}ms ease`,
        maxHeight: isRevealed ? 0 : 500,
        opacity: isRevealed ? 0 : 1,
        ...(phase === 'done' ? { display: 'none' } : {}),
      }}
    >
      {steps.map((text, i) => {
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
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  style={{ animation: 'reasonCheckIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
                >
                  <path
                    d="M3 8.5L6.5 12L13 4"
                    stroke="var(--text-tertiary)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <span
                  style={{
                    display: 'inline-block',
                    width: 12,
                    height: 12,
                    border: '1.5px solid var(--border)',
                    borderTopColor: 'var(--text-tertiary)',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
              )}
            </span>

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
  );
}
