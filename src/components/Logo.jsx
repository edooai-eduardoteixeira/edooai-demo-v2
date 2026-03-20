import React from 'react';

export default function Logo({ size = 'default' }) {
  const fontSize = size === 'large' ? '1.5rem' : '1.125rem';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontWeight: 700,
        fontSize,
        color: 'var(--color-black)',
        letterSpacing: '-0.02em',
      }}
    >
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect width="28" height="28" rx="6" fill="black" />
        <text
          x="14"
          y="19"
          textAnchor="middle"
          fill="white"
          fontSize="14"
          fontWeight="700"
          fontFamily="Inter, sans-serif"
        >
          V
        </text>
      </svg>
      Vincor AI
    </div>
  );
}
