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
  const borderColor = connected
    ? 'var(--color-green-500)'
    : 'var(--color-gray-200)';

  return (
    <div
      style={{
        border: `1px solid ${borderColor}`,
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        transition: 'border-color var(--transition-base)',
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
            fontWeight: 600,
            color: 'var(--color-gray-900)',
          }}
        >
          {group.label}
        </h3>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Badge variant="default">{group.accessType}</Badge>
          <Badge variant={connected ? 'success' : statusVariant}>
            {connected ? 'Connected' : group.status}
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

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {group.platforms.map((platform) => (
          <PlatformLogo
            key={platform}
            name={platform}
            connected={connected && connectedPlatform === platform}
            connecting={connecting && connectedPlatform === platform}
            onClick={() => {
              if (!connected && !connecting) onConnect(platform);
            }}
          />
        ))}
      </div>
    </div>
  );
}
