import React, { useEffect, useState, useRef, useCallback } from 'react';
import { cn } from '../lib/utils';

/*
  HeroVisual — "An agent is acquiring customers"

  - Top: pulsing glow dot + "Agent working" text (agent presence)
  - Title: "NEW ACTIVE CUSTOMERS" (frames the list)
  - Body: name + transaction amount rows, growing one by one
  - Bottom: skeleton row resolving into next customer

  List grows from 2 to 6, holds, fades, loops.
*/

const CUSTOMERS = [
  { name: 'Sarah M.', amount: '$45.00' },
  { name: 'James K.', amount: '$120.00' },
  { name: 'Rachel T.', amount: '$67.50' },
  { name: 'David L.', amount: '$89.00' },
  { name: 'Ana P.', amount: '$34.00' },
  { name: 'Marcus W.', amount: '$156.00' },
];

const SKELETON_DURATION = 1200;
const PAUSE_BETWEEN = 400;
const HOLD_AT_END = 2500;
const FADE_OUT = 500;

export default function HeroVisual({ className }) {
  const [visibleCount, setVisibleCount] = useState(2);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [phase, setPhase] = useState('growing');
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

      setShowSkeleton(true);
      schedule(() => {
        setVisibleCount(count + 1);
        setShowSkeleton(false);
        schedule(() => addNext(count + 1), PAUSE_BETWEEN);
      }, SKELETON_DURATION);
    }

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
        {/* Agent status */}
        <div className="flex items-center gap-2.5 px-5 pt-5 pb-4">
          <div className="relative flex items-center justify-center w-4 h-4">
            <div className="absolute w-2 h-2 rounded-full bg-brand" />
            <div className="absolute w-2 h-2 rounded-full bg-brand animate-[agent-glow_2s_ease-in-out_infinite]" />
          </div>
          <span className="text-[13px] font-medium text-foreground-faint">
            Agent working
          </span>
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
        <div className="px-5 pb-5 flex flex-col gap-0.5">
          {visibleCustomers.map((customer) => (
            <div
              key={customer.name}
              className="flex items-center justify-between py-2 px-2 rounded-md animate-fade-in"
            >
              <span className="text-[13px] font-medium text-foreground-muted">
                {customer.name}
              </span>
              <span className="text-[13px] text-foreground-faint tabular-nums">
                {customer.amount}
              </span>
            </div>
          ))}

          {/* Skeleton row — next customer incoming */}
          {showSkeleton && (
            <div className="flex items-center justify-between py-2 px-2 rounded-md animate-fade-in">
              <div className="h-3 w-20 rounded-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer" />
              <div className="h-3 w-12 rounded-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
