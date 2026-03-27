import React from 'react';
import { cn } from '../lib/utils';

export default function Logo({ size = 'default', variant = 'full', onClick, className }) {
  return (
    <div
      className={cn(
        'font-bold text-brand tracking-tight cursor-pointer flex items-center',
        variant === 'full' ? 'gap-px text-xl' : 'text-lg',
        size === 'large' && 'text-2xl',
        className
      )}
      style={variant === 'full' ? { fontFamily: "'Playfair Display', serif" } : undefined}
      onClick={onClick}
    >
      <img
        src="/vincor svg.svg"
        alt=""
        className={cn('shrink-0', variant === 'full' ? 'w-10 h-10' : 'w-6 h-6')}
      />
      {variant === 'full' && 'Vincor'}
    </div>
  );
}
