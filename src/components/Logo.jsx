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
      <div className={cn('shrink-0 overflow-hidden flex items-center justify-center', variant === 'full' ? 'w-10 h-10 -mr-1' : 'w-6 h-6')}>
        <img
          src="/vincor svg.svg"
          alt=""
          className={cn(variant === 'full' ? 'w-[72px] h-[72px]' : 'w-11 h-11')}
        />
      </div>
      {variant === 'full' && 'Vincor'}
    </div>
  );
}
