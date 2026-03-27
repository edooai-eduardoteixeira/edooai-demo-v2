import React from 'react';
import { cn } from '../lib/utils';

export default function Logo({ size = 'default', variant = 'full', onClick, className }) {
  return (
    <div
      className={cn(
        'font-bold text-brand tracking-tight cursor-pointer flex items-center',
        variant === 'full' ? 'font-display text-2xl gap-0.5' : 'text-lg',
        size === 'large' && 'text-2xl',
        className
      )}
      onClick={onClick}
    >
      <div className="shrink-0 w-8 h-8 overflow-hidden flex items-center justify-center">
        <img
          src="/vincor-mark.png"
          alt=""
          className="w-[54px] h-[54px] max-w-none"
        />
      </div>
      {variant === 'full' && 'Vincor'}
    </div>
  );
}
