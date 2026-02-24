import React from 'react';
import PlatformLogo from './PlatformLogo.jsx';

export default function IntegrationGroup({
  group,
  connected,
  connecting,
  connectedPlatform,
  onConnect,
  step,
  isOptional,
  totalCustomers,
}) {
  return (
    <div
      style={{
        border: isOptional ? '1px dashed var(--border)' : '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '28px 32px',
        backgroundColor: 'var(--color-white)',
        boxShadow: isOptional ? 'none' : 'var(--shadow-sm)',
        opacity: isOptional && !connected ? 0.75 : 1,
        transition: 'opacity 300ms ease',
        marginTop: isOptional ? '12px' : 0,
      }}
    >
      {/* Title row: step · title + data direction tag */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: '6px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0' }}>
          <span
            style={{
              fontSize: '1.0625rem',
              fontWeight: 400,
              color: 'var(--text-tertiary)',
            }}
          >
            {step} &middot;&nbsp;
          </span>
          <span
            style={{
              fontSize: '1.0625rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            {group.label}
          </span>
          {isOptional && (
            <span
              style={{
                fontSize: '1.0625rem',
                fontWeight: 400,
                color: 'var(--text-tertiary)',
                marginLeft: '4px',
              }}
            >
              (optional)
            </span>
          )}
        </div>
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 400,
            color: 'var(--text-tertiary)',
            whiteSpace: 'nowrap',
          }}
        >
          {group.dataDirection}
        </span>
      </div>

      {/* WHY line */}
      <p
        style={{
          fontSize: '0.875rem',
          color: 'var(--text-secondary)',
          fontWeight: 400,
          lineHeight: 1.5,
          marginBottom: '20px',
        }}
      >
        {group.whyLine}
      </p>

      {/* Logos */}
      <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap' }}>
        {group.platforms.map((platform) => (
          <PlatformLogo
            key={platform}
            name={platform}
            connected={connected && connectedPlatform === platform}
            connecting={connecting && connectedPlatform === platform}
            disabled={connected || connecting}
            onClick={() => {
              if (!connected && !connecting) onConnect(platform);
            }}
          />
        ))}
      </div>

      {/* Connected summary */}
      {connected && (
        <p
          style={{
            fontSize: '0.75rem',
            fontWeight: 500,
            color: 'var(--color-green-600)',
            marginTop: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
          }}
        >
          ✓ Connected · {totalCustomers.toLocaleString()} records
        </p>
      )}
    </div>
  );
}
