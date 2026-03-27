import React from 'react';
import { cn } from '../lib/utils';

export default function Logo({ size = 'default', variant = 'full', onClick, className }) {
  return (
    <div
      className={cn(
        'font-bold text-brand tracking-tight cursor-pointer flex items-center',
        variant === 'full' ? 'text-2xl gap-0.5' : 'text-lg',
        size === 'large' && 'text-2xl',
        className
      )}
      style={variant === 'full' ? { fontFamily: "'Playfair Display', serif" } : undefined}
      onClick={onClick}
    >
      <img
        src="/vincor svg.svg"
        alt=""
        className="shrink-0 w-[54px] h-[54px] -m-2.5"
      />
      {variant === 'full' && 'Vincor'}
    </div>
  );
}
