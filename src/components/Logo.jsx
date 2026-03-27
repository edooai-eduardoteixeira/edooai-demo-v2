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
      <div style={{
        width: 24,
        height: 24,
        borderRadius: 6,
        background: 'var(--color-brand)',
        overflow: 'hidden',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <img
          src="/vincor svg.svg"
          alt=""
          style={{
            width: 18,
            height: 18,
            filter: 'brightness(0) invert(1)',
          }}
        />
      </div>
      {variant === 'full' && 'Vincor'}
    </div>
  );
}
