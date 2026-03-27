import React, { useEffect, useState, useRef, useCallback } from 'react';
import { cn } from '../lib/utils';

/*
  HeroVisual — "An agent is acquiring customers"

  A card showing an autonomous agent at work:
  - Top: agent status indicator (pulsing dot + shimmer bar)
  - Title: "New Active Customers" — frames the list
  - Body: customer rows that appear one by one
  - Bottom: skeleton row that resolves into the next customer

  The list grows from 1–2 to 6, pauses, then resets and loops.
*/

const CUSTOMERS = [
  { initial: 'S', name: 'Sarah M.', bg: 'bg-brand' },
  { initial: 'J', name: 'James K.', bg: 'bg-foreground' },
  { initial: 'R', name: 'Rachel T.', bg: 'bg-gray-600' },
  { initial: 'D', name: 'David L.', bg: 'bg-brand' },
  { initial: 'A', name: 'Ana P.', bg: 'bg-foreground' },
  { initial: 'M', name: 'Marcus W.', bg: 'bg-gray-600' },
];

const SKELETON_DURATION = 1200;  // how long skeleton shows before resolving
const PAUSE_BETWEEN = 400;       // pause after resolve before next skeleton
const HOLD_AT_END = 2500;        // pause when list is full
const FADE_OUT = 500;            // fade-out before restart

export default function HeroVisual({ className }) {
  const [visibleCount, setVisibleCount] = useState(2);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [phase, setPhase] = useState('growing'); // 'growing' | 'holding' | 'resetting'
  const timeoutRef = useRef(null);
  const mountedRef = useRef(true);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    function schedule(fn, delay) {
      clearTimer();
      timeoutRef.current = setTimeout(() => {
        if (mountedRef.current) fn();
      }, delay);
    }

    function addNext(count) {
      if (!mountedRef.current) return;

      if (count >= CUSTOMERS.length) {
        // List is full — hold, then reset
        setShowSkeleton(false);
        setPhase('holding');
        schedule(() => {
          setPhase('resetting');
          schedule(() => {
            setVisibleCount(2);
            setShowSkeleton(false);
            setPhase('growing');
            schedule(() => addNext(2), 800);
          }, FADE_OUT);
        }, HOLD_AT_END);
        return;
      }

      // Show skeleton
      setShowSkeleton(true);
      schedule(() => {
        // Resolve skeleton into customer
        setVisibleCount(count + 1);
        setShowSkeleton(false);
        schedule(() => addNext(count + 1), PAUSE_BETWEEN);
      }, SKELETON_DURATION);
    }

    // Start first cycle after initial delay
    schedule(() => addNext(2), 1000);

    return () => {
      mountedRef.current = false;
      clearTimer();
    };
  }, [clearTimer]);

  const visibleCustomers = CUSTOMERS.slice(0, visibleCount);

  return (
    <div className={cn('flex items-start justify-center', className)}>
      <div
        className={cn(
          'bg-surface rounded-xl shadow-lg w-[280px]',
          'transition-opacity duration-500 ease-out',
          phase === 'resetting' ? 'opacity-0' : 'opacity-100'
        )}
      >
        {/* Agent status bar */}
        <div className="flex items-center gap-2.5 px-5 pt-5 pb-4">
          <div className="w-2 h-2 rounded-full bg-brand animate-pulse" />
          <div className="relative h-1.5 w-16 rounded-full bg-gray-100 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] animate-shimmer rounded-full" />
          </div>
        </div>

        {/* Divider */}
        <div className="mx-5 border-b border-border-light" />

        {/* List title */}
        <div className="px-5 pt-4 pb-3">
          <span className="text-[11px] font-semibold tracking-[0.05em] text-foreground-faint uppercase">
            New Active Customers
          </span>
        </div>

        {/* Customer list */}
        <div className="px-5 pb-5 flex flex-col gap-1">
          {visibleCustomers.map((customer, i) => (
            <div
              key={customer.name}
              className={cn(
                'flex items-center gap-3 py-2 px-2 rounded-md',
                'animate-fade-in'
              )}
            >
              {/* Avatar */}
              <div
                className={cn(
                  'w-7 h-7 rounded-full shrink-0 flex items-center justify-center',
                  customer.bg
                )}
              >
                <span className="text-[11px] font-semibold text-white leading-none">
                  {customer.initial}
                </span>
              </div>

              {/* Name */}
              <span className="text-[13px] font-medium text-foreground-muted">
                {customer.name}
              </span>
            </div>
          ))}

          {/* Skeleton row — next customer loading */}
          {showSkeleton && (
            <div className="flex items-center gap-3 py-2 px-2 rounded-md animate-fade-in">
              {/* Skeleton avatar */}
              <div className="w-7 h-7 rounded-full shrink-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer" />

              {/* Skeleton name */}
              <div className="h-3 w-20 rounded-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
