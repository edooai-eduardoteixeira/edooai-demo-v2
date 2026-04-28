/**
 * useDashboardAnimation — RAF-driven dashboard animation engine.
 *
 * Drives `displayDay` from 1 → 60 over `ANIMATION_TOTAL_MS` (90s), exposes
 * `withinDay` (0..1 within the current day) for staggered beat interpolation,
 * and supports manual override (slider touch) + budget-change reset.
 *
 * See docs/PLAN-numbers-consistency.md "Item 5 — Live operations animation".
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  ANIMATION_TOTAL_MS,
  ANIMATION_TOTAL_DAYS,
  MS_PER_DAY,
  dayFromElapsed,
  withinDayProgress,
  isAnimationComplete,
} from './animation.js';

/**
 * Returns:
 *   displayDay (1..60) — current displayed day
 *   withinDay (0..1)   — progress through the current day (0 when paused/done)
 *   isAnimating        — whether the animation engine is actively running
 *   setDayManual(d)    — user-driven slider input; stops animation, jumps to day
 *   restartFromBudget()— call when budget changes; resets to Day 1 and replays
 */
export function useDashboardAnimation(budget) {
  const [displayDay, setDisplayDay] = useState(1);
  const [withinDay, setWithinDay] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  // Frame timestamp drives a re-render every RAF tick; consumers compute dt
  // from successive `frameTs` values for frame-rate-aware lerps.
  const [frameTs, setFrameTs] = useState(() => performance.now());

  // Refs for the RAF loop (avoid stale closures + needless re-renders)
  const startTimeRef = useRef(null);
  const rafIdRef = useRef(null);
  const sourceRef = useRef('animation'); // 'animation' | 'user'
  const animatingRef = useRef(true);

  const stopRaf = useCallback(() => {
    if (rafIdRef.current != null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    if (!animatingRef.current) return;
    const now = performance.now();
    if (startTimeRef.current == null) startTimeRef.current = now;
    const elapsed = now - startTimeRef.current;

    if (isAnimationComplete(elapsed)) {
      setDisplayDay(ANIMATION_TOTAL_DAYS);
      setWithinDay(1);
      setFrameTs(now);
      setIsAnimating(false);
      animatingRef.current = false;
      return;
    }

    setDisplayDay(dayFromElapsed(elapsed));
    setWithinDay(withinDayProgress(elapsed));
    setFrameTs(now);
    rafIdRef.current = requestAnimationFrame(tick);
  }, []);

  const startAnimation = useCallback(() => {
    stopRaf();
    sourceRef.current = 'animation';
    startTimeRef.current = null; // re-anchor on next tick
    animatingRef.current = true;
    setIsAnimating(true);
    setDisplayDay(1);
    setWithinDay(0);
    rafIdRef.current = requestAnimationFrame(tick);
  }, [stopRaf, tick]);

  // Initial start on mount + cleanup (covers React 18 StrictMode double-mount).
  useEffect(() => {
    startAnimation();
    return () => {
      stopRaf();
      animatingRef.current = false;
    };
  }, [startAnimation, stopRaf]);

  // Restart on budget change (skip the very first render — budget hasn't
  // actually "changed" the first time we see it; the initial useEffect handles that).
  const lastBudgetRef = useRef(budget);
  useEffect(() => {
    if (lastBudgetRef.current === budget) return;
    lastBudgetRef.current = budget;
    startAnimation();
  }, [budget, startAnimation]);

  /** User dragged the slider — stop animation, jump to chosen day, no auto-resume. */
  const setDayManual = useCallback((day) => {
    stopRaf();
    sourceRef.current = 'user';
    animatingRef.current = false;
    setIsAnimating(false);
    setDisplayDay(Math.min(ANIMATION_TOTAL_DAYS, Math.max(1, day)));
    setWithinDay(1); // user-selected days are shown in their final state
  }, [stopRaf]);

  return {
    displayDay,
    withinDay,
    isAnimating,
    setDayManual,
    msPerDay: MS_PER_DAY,
    frameTs,
  };
}
