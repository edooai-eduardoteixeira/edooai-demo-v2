import React from 'react';

export default function Badge({ children, variant = 'default' }) {
  const variants = {
    default: {
      backgroundColor: 'var(--color-gray-100)',
      color: 'var(--color-gray-700)',
    },
    required: {
      backgroundColor: 'var(--color-gray-900)',
      color: 'var(--color-white)',
    },
    optional: {
      backgroundColor: 'var(--color-gray-100)',
      color: 'var(--color-gray-600)',
    },
    success: {
      backgroundColor: 'var(--color-green-100)',
      color: 'var(--color-green-600)',
    },
    quickwin: {
      backgroundColor: '#f0f0f0',
      color: 'var(--color-gray-800)',
      border: '1px solid var(--color-gray-300)',
    },
    lookalike: {
      backgroundColor: 'var(--color-gray-900)',
      color: 'var(--color-white)',
    },
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.25rem 0.75rem',
        fontSize: 'var(--font-size-xs)',
        fontWeight: 500,
        borderRadius: 'var(--radius-full)',
        whiteSpace: 'nowrap',
        ...variants[variant],
      }}
    >
      {children}
    </span>
  );
}
