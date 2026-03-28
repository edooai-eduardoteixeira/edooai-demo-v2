import React, { useEffect, useState, useRef, useCallback } from 'react';
import { cn } from '../lib/utils';

/*
  HeroVisual — "An agent is acquiring customers"

  - Top: pulsing glow dot + "Agent working" (agent presence)
  - Column headers: "NEW CUSTOMERS" + "CAC" (labels > data hierarchy)
  - Body: name + CAC rows, growing one by one
  - Bottom: skeleton resolving into next customer

  List grows from 1 to 4, holds, fades, loops.
*/

const CUSTOMERS = [
  { name: 'Gina Miller', cac: '$60' },
  { name: 'Paul Davis', cac: '$90' },
  { name: 'Karen Walsh', cac: '$60' },
  { name: 'Tom Bennett', cac: '$120' },
];

const SKELETON_DURATION = 1500;
const PAUSE_BETWEEN = 600;
const HOLD_AT_END = 2500;

export default function HeroVisual({ className }) {
  const [visibleCount, setVisibleCount] = useState(1);
  const [showSkeleton, setShowSkeleton] = useState(false);
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
        schedule(() => {
          setVisibleCount(1);
          setShowSkeleton(false);
          schedule(() => addNext(1), 400);
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

    schedule(() => addNext(1), 1000);

    return () => {
      mountedRef.current = false;
      clearTimer();
    };
  }, [clearTimer]);

  const visibleCustomers = CUSTOMERS.slice(0, visibleCount);

  return (
    <div className={cn('flex items-start justify-center', className)}>
      <div
        className="bg-accent-subtle rounded-xl w-[280px]"
      >
        {/* Agent status */}
        <div className="flex items-center gap-2.5 px-5 pt-5 pb-4">
          <div className="relative flex items-center justify-center w-5 h-5">
            <div className="absolute w-2.5 h-2.5 rounded-full bg-brand" />
            <div className="absolute w-2.5 h-2.5 rounded-full border-[1.5px] border-brand animate-[agent-glow_2s_ease-out_infinite]" />
          </div>
          <span className="text-[13px] font-semibold text-foreground">
            Agent acquiring customers
          </span>
        </div>

        {/* Divider */}
        <div className="mx-5 border-b border-border-light" />

        {/* Column headers — labels > data hierarchy */}
        <div className="flex items-center justify-between px-7 pt-4 pb-2">
          <span className="text-[11px] font-semibold tracking-[0.05em] text-foreground-muted uppercase">
            New Customers
          </span>
          <span className="text-[11px] font-semibold tracking-[0.05em] text-foreground-muted uppercase">
            CAC
          </span>
        </div>

        {/* Customer list — fixed height, content animates inside */}
        <div className="px-5 pb-5 flex flex-col gap-0.5 h-[180px]">
          {visibleCustomers.map((customer) => (
            <div
              key={customer.name}
              className="flex items-center justify-between py-2 px-2 rounded-md animate-fade-in"
            >
              <span className="text-[13px] font-medium text-foreground-faint">
                {customer.name}
              </span>
              <span className="text-[13px] text-foreground-faint tabular-nums">
                {customer.cac}
              </span>
            </div>
          ))}

          {/* Skeleton row */}
          {showSkeleton && (
            <div className="flex items-center justify-between py-2 px-2 rounded-md animate-fade-in">
              <div className="h-3 w-20 rounded-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer" />
              <div className="h-3 w-8 rounded-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
