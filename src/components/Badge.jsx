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
      backgroundColor: 'var(--color-gray-900)',
      color: 'var(--color-white)',
    },
    quickwin: {
      backgroundColor: 'var(--accent-light)',
      color: 'var(--text-primary)',
      border: '1px solid var(--accent)',
    },
    lookalike: {
      backgroundColor: 'var(--accent-light)',
      color: 'var(--text-primary)',
      border: '1px solid var(--accent)',
    },
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 12px',
        fontSize: '11px',
        fontWeight: 600,
        borderRadius: 'var(--radius-full)',
        whiteSpace: 'nowrap',
        ...variants[variant],
      }}
    >
      {children}
    </span>
  );
}
