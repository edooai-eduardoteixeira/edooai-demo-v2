import React, { useState } from 'react';

export default function CTAButton({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  style = {},
}) {
  const [hovered, setHovered] = useState(false);

  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 28px',
    fontSize: '15px',
    fontWeight: 600,
    borderRadius: 'var(--radius-md)',
    transition: 'all var(--transition-base)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none',
    lineHeight: 1.4,
    letterSpacing: '-0.01em',
  };

  const variants = {
    primary: {
      backgroundColor: disabled
        ? 'var(--color-gray-300)'
        : hovered
          ? 'var(--accent-hover)'
          : 'var(--accent)',
      color: 'var(--color-white)',
      opacity: disabled ? 0.6 : 1,
      boxShadow: disabled
        ? 'none'
        : hovered
          ? 'var(--shadow-md)'
          : 'var(--shadow-sm), 0 1px 2px rgba(0,0,0,0.15)',
      transform: hovered && !disabled ? 'translateY(-1px)' : 'translateY(0)',
    },
    secondary: {
      backgroundColor: hovered ? 'var(--accent-light)' : 'var(--surface)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border)',
      boxShadow: hovered ? 'var(--shadow-sm)' : 'var(--shadow-xs)',
    },
  };

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ ...baseStyles, ...variants[variant], ...style }}
    >
      {children}
    </button>
  );
}
