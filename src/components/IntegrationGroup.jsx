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
  totalCustomers,
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: isOptional ? '1px dashed #E0E0E0' : '1px solid #E8E8E8',
        borderRadius: '10px',
        padding: '24px',
        backgroundColor: '#fff',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        opacity: isOptional && !connected ? (hovered ? 1 : 0.7) : 1,
        transition: 'opacity 200ms ease',
        marginTop: isOptional ? '12px' : 0,
      }}
    >
      {/* Title row: step · TITLE + pill */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
          <span
            style={{
              fontSize: '13px',
              fontWeight: 500,
              color: '#999',
            }}
          >
            {step} &middot;&nbsp;
          </span>
          <span
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: '#888',
              textTransform: 'uppercase',
              letterSpacing: '1.2px',
            }}
          >
            {group.label}
          </span>
          {isOptional && (
            <span
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#BBB',
                textTransform: 'uppercase',
                letterSpacing: '1.2px',
                marginLeft: '6px',
              }}
            >
              (optional)
            </span>
          )}
        </div>
        <span
          style={{
            fontSize: '12px',
            fontWeight: 500,
            color: '#555',
            whiteSpace: 'nowrap',
            border: '1px solid #CCC',
            borderRadius: '16px',
            padding: '3px 12px',
            lineHeight: 1.4,
          }}
        >
          {group.dataDirection}
        </span>
      </div>

      {/* WHY line */}
      <p
        style={{
          fontSize: '14px',
          color: '#555',
          fontWeight: 400,
          lineHeight: 1.4,
          marginBottom: '16px',
        }}
      >
        {group.whyLine}
      </p>

      {/* Logos */}
      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
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
            fontSize: '13px',
            fontWeight: 500,
            color: '#34C759',
            marginTop: '12px',
          }}
        >
          ✓ Connected · {totalCustomers.toLocaleString()} records
        </p>
      )}
    </div>
  );
}
