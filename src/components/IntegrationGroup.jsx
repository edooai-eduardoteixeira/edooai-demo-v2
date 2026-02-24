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
        border: isOptional ? '1px dashed #E0E0E0' : '1px solid var(--color-gray-200)',
        borderRadius: '8px',
        padding: '20px 24px',
        backgroundColor: 'var(--color-white)',
        boxShadow: isOptional ? 'none' : '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
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
          marginBottom: '4px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0' }}>
          <span
            style={{
              fontSize: '0.9375rem',
              fontWeight: 400,
              color: '#999',
            }}
          >
            {step} &middot;&nbsp;
          </span>
          <span
            style={{
              fontSize: '0.9375rem',
              fontWeight: 700,
              color: '#333',
            }}
          >
            {group.label}
          </span>
          {isOptional && (
            <span
              style={{
                fontSize: '0.9375rem',
                fontWeight: 400,
                color: '#999',
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
            color: '#999',
            whiteSpace: 'nowrap',
          }}
        >
          {group.dataDirection}
        </span>
      </div>

      {/* WHY line */}
      <p
        style={{
          fontSize: '0.8125rem',
          color: '#666',
          fontWeight: 400,
          lineHeight: 1.4,
          marginBottom: '16px',
        }}
      >
        {group.whyLine}
      </p>

      {/* Logos */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
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
            color: '#34C759',
            marginTop: '12px',
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
