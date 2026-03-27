import React, { useEffect, useState, useRef } from 'react';
import { cn } from '../lib/utils';

/*
  HeroVisual — "The agent is working"

  A simplified software interface that operates itself.
  5 abstract rows animate in sequence: highlight → action → complete.
  No text, no labels. The pattern of autonomous task completion
  communicates "this software does the work for you."

  Uses a JS interval for looping. All transitions via Tailwind classes.
*/

const ROWS = 5;
const STEP_DURATION = 700;   // ms per row
const HOLD_DURATION = 1500;  // pause when all complete
const RESET_DURATION = 600;  // fade-out before restart

export default function HeroVisual({ className }) {
  const [activeRow, setActiveRow] = useState(-1);
  const [completedRows, setCompletedRows] = useState(new Set());
  const [phase, setPhase] = useState('running'); // 'running' | 'holding' | 'resetting'
  const timeoutRef = useRef(null);

  useEffect(() => {
    let currentRow = -1;
    let completed = new Set();

    function tick() {
      currentRow++;

      if (currentRow >= ROWS) {
        // All rows complete — hold
        setPhase('holding');
        timeoutRef.current = setTimeout(() => {
          // Reset
          setPhase('resetting');
          timeoutRef.current = setTimeout(() => {
            currentRow = -1;
            completed = new Set();
            setActiveRow(-1);
            setCompletedRows(new Set());
            setPhase('running');
            timeoutRef.current = setTimeout(tick, 300);
          }, RESET_DURATION);
        }, HOLD_DURATION);
        return;
      }

      setActiveRow(currentRow);

      // Mark previous row as completed (with slight delay for the "action" feel)
      if (currentRow > 0) {
        const prev = currentRow - 1;
        completed = new Set([...completed, prev]);
        setCompletedRows(new Set(completed));
      }

      // Mark last row complete after its step
      if (currentRow === ROWS - 1) {
        timeoutRef.current = setTimeout(() => {
          completed = new Set([...completed, currentRow]);
          setCompletedRows(new Set(completed));
          setActiveRow(-1);
          timeoutRef.current = setTimeout(() => {
            setPhase('holding');
            timeoutRef.current = setTimeout(() => {
              setPhase('resetting');
              timeoutRef.current = setTimeout(() => {
                currentRow = -1;
                completed = new Set();
                setActiveRow(-1);
                setCompletedRows(new Set());
                setPhase('running');
                timeoutRef.current = setTimeout(tick, 300);
              }, RESET_DURATION);
            }, HOLD_DURATION);
          }, 100);
        }, STEP_DURATION * 0.6);
        return;
      }

      timeoutRef.current = setTimeout(tick, STEP_DURATION);
    }

    // Initial delay before first cycle
    timeoutRef.current = setTimeout(tick, 800);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Row bar widths — varying for organic feel
  const barWidths = ['w-3/4', 'w-4/5', 'w-2/3', 'w-[85%]', 'w-3/5'];

  return (
    <div className={cn('flex items-start justify-center', className)}>
      <div
        className={cn(
          'bg-surface rounded-xl shadow-lg p-6 w-[260px]',
          'transition-opacity duration-500',
          phase === 'resetting' && 'opacity-0'
        )}
      >
        {/* Abstract header bar — looks like a tiny toolbar */}
        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-border-light">
          <div className="w-2 h-2 rounded-full bg-gray-300" />
          <div className="w-2 h-2 rounded-full bg-gray-300" />
          <div className="w-2 h-2 rounded-full bg-gray-300" />
          <div className="flex-1" />
          <div className="w-8 h-1.5 rounded-full bg-gray-200" />
        </div>

        {/* Task rows */}
        <div className="flex flex-col gap-3">
          {Array.from({ length: ROWS }).map((_, i) => {
            const isActive = activeRow === i;
            const isCompleted = completedRows.has(i);

            return (
              <div
                key={i}
                className={cn(
                  'flex items-center gap-3 px-2.5 py-2 rounded-md',
                  'transition-all duration-300 ease-out',
                  isActive && 'bg-brand-light',
                  !isActive && !isCompleted && 'bg-transparent'
                )}
              >
                {/* Avatar circle */}
                <div
                  className={cn(
                    'w-3 h-3 rounded-full shrink-0',
                    'transition-all duration-300 ease-out',
                    isActive && 'bg-brand scale-110',
                    isCompleted && 'bg-brand',
                    !isActive && !isCompleted && 'bg-gray-300'
                  )}
                />

                {/* Content bar */}
                <div
                  className={cn(
                    'h-2 rounded-full',
                    'transition-all duration-300 ease-out',
                    barWidths[i],
                    isActive && 'bg-brand/20',
                    isCompleted && 'bg-gray-200',
                    !isActive && !isCompleted && 'bg-gray-200'
                  )}
                />

                {/* Completion indicator */}
                <div className="w-3 h-3 shrink-0 flex items-center justify-center ml-auto">
                  {isCompleted && (
                    <svg
                      className="w-3 h-3 text-brand animate-fade-in"
                      viewBox="0 0 12 12"
                      fill="none"
                    >
                      <path
                        d="M2.5 6L5 8.5L9.5 4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                  {isActive && (
                    <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
