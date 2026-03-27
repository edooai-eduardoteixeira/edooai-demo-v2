import React from 'react';
import { cn } from '../lib/utils';

export default function Logo({ size = 'default', variant = 'full', onClick, className }) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 font-bold text-brand tracking-tight cursor-pointer',
        size === 'large' ? 'text-2xl' : variant === 'full' ? 'text-xl' : 'text-lg',
        className
      )}
      style={variant === 'full' ? { fontFamily: "'Playfair Display', serif" } : undefined}
      onClick={onClick}
    >
      <svg width="24" height="24" viewBox="0 0 100 100" fill="none" style={{ flexShrink: 0 }}>
        <rect width="100" height="100" rx="18" fill="var(--color-brand)" />
        {/* Crystalline crown mark */}
        <g fill="white" transform="translate(50, 52)">
          {/* Center blade */}
          <polygon points="0,-34 5,-8 0,-12 -5,-8" />
          {/* Inner left blade */}
          <polygon points="-4,-10 -12,-30 -8,-8" />
          {/* Inner right blade */}
          <polygon points="4,-10 12,-30 8,-8" />
          {/* Mid left blade */}
          <polygon points="-9,-7 -22,-24 -15,-4" />
          {/* Mid right blade */}
          <polygon points="9,-7 22,-24 15,-4" />
          {/* Outer left blade */}
          <polygon points="-16,-2 -30,-14 -28,-4 -18,2" />
          {/* Outer right blade */}
          <polygon points="16,-2 30,-14 28,-4 18,2" />
          {/* Left wing */}
          <polygon points="-18,2 -30,0 -26,6 -14,6" />
          {/* Right wing */}
          <polygon points="18,2 30,0 26,6 14,6" />
          {/* Diamond at base */}
          <polygon points="0,6 6,12 0,18 -6,12" />
        </g>
      </svg>
      {variant === 'full' && 'Vincor'}
    </div>
  );
}
