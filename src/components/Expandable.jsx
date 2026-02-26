import React, { useState } from 'react';

export default function Expandable({ title, children }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        border: '1px solid var(--color-gray-200)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          padding: '1rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--color-gray-50)',
          fontSize: 'var(--font-size-sm)',
          fontWeight: 600,
          color: 'var(--color-gray-800)',
          cursor: 'pointer',
          border: 'none',
          fontFamily: 'inherit',
        }}
      >
        {title}
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform var(--transition-base)',
          }}
        >
          <path
            d="M4 6l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <div
        style={{
          maxHeight: open ? '2000px' : '0',
          overflow: 'hidden',
          transition: 'max-height 0.4s ease',
        }}
      >
        <div style={{ padding: '1.5rem' }}>{children}</div>
      </div>
    </div>
  );
}
