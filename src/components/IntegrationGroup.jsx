import React from 'react';
import Badge from './Badge.jsx';
import PlatformLogo from './PlatformLogo.jsx';

export default function IntegrationGroup({
  group,
  connected,
  connecting,
  connectedPlatform,
  onConnect,
}) {
  const statusVariant = group.status === 'Required' ? 'required' : 'optional';

  return (
    <div
      style={{
        border: '1px solid var(--color-gray-200)',
        borderRadius: '8px',
        padding: '24px',
        backgroundColor: 'var(--color-white)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.5rem',
        }}
      >
        <h3
          style={{
            fontSize: 'var(--font-size-base)',
            fontWeight: 700,
            color: 'var(--color-gray-900)',
          }}
        >
          {group.label}
        </h3>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Badge variant="default">{group.accessType}</Badge>
          <Badge variant={connected ? 'success' : statusVariant}>
            {connected ? '✓ Connected' : group.status}
          </Badge>
        </div>
      </div>

      <p
        style={{
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-gray-500)',
          marginBottom: '1.25rem',
          lineHeight: 1.5,
        }}
      >
        {group.description}
      </p>

      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
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
