import React, { useState } from 'react';
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
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: isOptional ? '1px dashed var(--border)' : '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '28px 32px',
        backgroundColor: 'var(--surface)',
        boxShadow: isOptional
          ? 'none'
          : hovered
            ? 'var(--shadow-md)'
            : 'var(--shadow-sm)',
        opacity: isOptional && !connected ? 0.75 : 1,
        transition: 'all var(--transition-base)',
        marginTop: isOptional ? '12px' : 0,
      }}
    >
      {/* Title row: step badge · title + data direction tag */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Step number badge */}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: connected ? 'var(--success)' : 'var(--accent)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              flexShrink: 0,
              transition: 'background-color var(--transition-base)',
            }}
          >
            {connected ? '✓' : step}
          </span>
          <span
            style={{
              fontSize: '17px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
            }}
          >
            {group.label}
          </span>
          {isOptional && (
            <span
              style={{
                fontSize: '14px',
                fontWeight: 400,
                color: 'var(--text-tertiary)',
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
            fontSize: '11px',
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            backgroundColor: group.dataDirection === 'Read only' ? '#dbeafe' : 'var(--border-light)',
            color: group.dataDirection === 'Read only' ? '#1e40af' : '#334155',
          }}
        >
          {group.dataDirection}
        </span>
      </div>

      {/* WHY line */}
      <p
        style={{
          fontSize: '15px',
          color: 'var(--text-secondary)',
          fontWeight: 400,
          lineHeight: 1.6,
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
