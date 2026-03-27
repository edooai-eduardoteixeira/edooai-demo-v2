import React from 'react';
import { cn } from '../lib/utils';

export default function Logo({ size = 'default', variant = 'full', onClick, className }) {
  return (
    <div
      className={cn(
        'font-bold text-brand tracking-tight cursor-pointer flex items-center gap-0',
        variant === 'full' ? 'text-xl' : 'text-lg',
        size === 'large' && 'text-2xl',
        className
      )}
      style={variant === 'full' ? { fontFamily: "'Playfair Display', serif" } : undefined}
      onClick={onClick}
    >
      <img
        src="/vincor svg.svg"
        alt=""
        className={cn('shrink-0', variant === 'full' ? 'w-16 h-16 -m-3' : 'w-10 h-10 -m-2')}
      />
      {variant === 'full' && 'Vincor'}
    </div>
  );
}
