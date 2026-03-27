import React from 'react';
import { cn } from '../lib/utils';

export default function Logo({ size = 'default', variant = 'full', className }) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 font-bold text-brand tracking-tight',
        size === 'large' ? 'text-2xl' : 'text-lg',
        className
      )}
    >
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect width="28" height="28" rx="6" fill="var(--color-brand)" />
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
      {variant === 'full' && 'Vincor AI'}
    </div>
  );
}
