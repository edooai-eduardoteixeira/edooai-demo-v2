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
}) {
  return (
    <div
      style={{
        border: isOptional ? '1px dashed var(--border)' : '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '32px',
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
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0' }}>
          <span
            style={{
              fontSize: '1.0625rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
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
            display: 'inline-flex',
            alignItems: 'center',
            fontSize: '0.6875rem',
            fontWeight: 600,
            padding: '3px 10px',
            borderRadius: '9999px',
            whiteSpace: 'nowrap',
            backgroundColor: group.dataDirection === 'Read only' ? '#dbeafe' : '#f1f5f9',
            color: group.dataDirection === 'Read only' ? '#1e40af' : '#334155',
          }}
        >
          {group.dataDirection}
        </span>
      </div>

      {/* WHY line */}
      <p
        style={{
          fontSize: '0.9375rem',
          color: 'var(--text-secondary)',
          fontWeight: 400,
          lineHeight: 1.5,
          marginBottom: '24px',
        }}
      >
        {group.whyLine}
      </p>

      {/* Logos */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
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

    </div>
  );
}
