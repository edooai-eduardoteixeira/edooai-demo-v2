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
      <div className={cn('shrink-0 overflow-hidden flex items-center justify-center', variant === 'full' ? 'w-8 h-8' : 'w-5 h-5')}>
        <img
          src="/vincor svg.svg"
          alt=""
          className={cn(variant === 'full' ? 'w-14 h-14' : 'w-9 h-9')}
        />
      </div>
      {variant === 'full' && 'Vincor'}
    </div>
  );
}
