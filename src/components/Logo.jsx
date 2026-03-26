import React from 'react';
import { cn } from '../lib/utils';

export default function Logo({ size = 'default', className }) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 font-bold text-black tracking-tight',
        size === 'large' ? 'text-2xl' : 'text-lg',
        className
      )}
    >
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect width="28" height="28" rx="6" fill="black" />
        <text
          x="14"
          y="19"
          textAnchor="middle"
          fill="white"
          fontSize="14"
          fontWeight="700"
          fontFamily="Inter, sans-serif"
        >
          V
        </text>
      </svg>
      Vincor AI
    </div>
  );
}
