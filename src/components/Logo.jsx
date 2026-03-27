import React from 'react';
import { cn } from '../lib/utils';

export default function Logo({ size = 'default', variant = 'full', onClick, className, iconSize = 7, iconGap = 1.5 }) {
  return (
    <div
      className={cn(
        'font-bold text-brand tracking-tight cursor-pointer flex items-center',
        size === 'large' ? 'text-2xl' : variant === 'full' ? 'text-xl' : 'text-lg',
        className
      )}
      style={{
        ...(variant === 'full' ? { fontFamily: "'Playfair Display', serif" } : {}),
        gap: `${iconGap * 4}px`,
      }}
      onClick={onClick}
    >
      <img
        src="/vincor svg.svg"
        alt=""
        className="shrink-0"
        style={{ width: iconSize * 4, height: iconSize * 4 }}
      />
      {variant === 'full' && 'Vincor'}
    </div>
  );
}
