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
      <img
        src="/vincor svg.svg"
        alt=""
        className="w-6 h-6 shrink-0"
      />
      {variant === 'full' && 'Vincor'}
    </div>
  );
}
