import React from 'react';

export default function CTAButton({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  style = {},
}) {
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.875rem 2rem',
    fontSize: 'var(--font-size-base)',
    fontWeight: 600,
    borderRadius: 'var(--radius-md)',
    transition: 'all var(--transition-base)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none',
    lineHeight: 1.4,
  };

  const variants = {
    primary: {
      backgroundColor: disabled ? 'var(--color-gray-300)' : 'var(--color-black)',
      color: 'var(--color-white)',
      opacity: disabled ? 0.6 : 1,
    },
    secondary: {
      backgroundColor: 'var(--color-white)',
      color: 'var(--color-black)',
      border: '1px solid var(--color-gray-300)',
    },
  };

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{ ...baseStyles, ...variants[variant], ...style }}
    >
      {children}
    </button>
  );
}
