import React from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function Logo({ size = 'default', variant = 'full', className }) {
  const navigate = useNavigate();

  return (
    <div
      className={cn(
        'flex items-center gap-2 font-bold text-brand tracking-tight cursor-pointer',
        size === 'large' ? 'text-2xl' : variant === 'full' ? 'text-xl' : 'text-lg',
        className
      )}
      style={variant === 'full' ? { fontFamily: "'Playfair Display', serif" } : undefined}
      onClick={() => navigate('/')}
    >
      <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
        <rect width="28" height="28" rx="6" fill="var(--color-brand)" />
        <text
          x="14"
          y="19"
          textAnchor="middle"
          fill="white"
          fontSize="16"
          fontWeight="700"
          fontFamily="'Playfair Display', serif"
        >
          V
        </text>
      </svg>
      {variant === 'full' && 'Vincor'}
    </div>
  );
}
