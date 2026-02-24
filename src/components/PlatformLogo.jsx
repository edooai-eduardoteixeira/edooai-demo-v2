import React from 'react';

const PLATFORM_COLORS = {
  Segment: '#52BD95',
  Braze: '#000000',
  Klaviyo: '#000000',
  HubSpot: '#FF7A59',
  'Customer.io': '#1B9AAA',
  Snowflake: '#29B5E8',
  BigQuery: '#4285F4',
  Redshift: '#8C4FFF',
  Databricks: '#FF3621',
  Synapse: '#0078D4',
  Zendesk: '#03363D',
  Intercom: '#286EFA',
  Delighted: '#6B4FBB',
};

const PLATFORM_INITIALS = {
  Segment: 'Sg',
  Braze: 'Bz',
  Klaviyo: 'Kl',
  HubSpot: 'HS',
  'Customer.io': 'Ci',
  Snowflake: 'Sf',
  BigQuery: 'BQ',
  Redshift: 'Rs',
  Databricks: 'Db',
  Synapse: 'Sy',
  Zendesk: 'Zd',
  Intercom: 'Ic',
  Delighted: 'Dl',
};

export default function PlatformLogo({ name, connected, connecting, onClick }) {
  const color = PLATFORM_COLORS[name] || '#666';
  const initials = PLATFORM_INITIALS[name] || name.slice(0, 2);

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.75rem',
        borderRadius: 'var(--radius-md)',
        border: connected
          ? '2px solid var(--color-green-500)'
          : '2px solid var(--color-gray-200)',
        backgroundColor: connected
          ? 'var(--color-green-50)'
          : 'var(--color-white)',
        cursor: connected || connecting ? 'default' : 'pointer',
        transition: 'all var(--transition-base)',
        minWidth: '80px',
        position: 'relative',
      }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: connected ? 'var(--color-green-100)' : color + '15',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 'var(--font-size-sm)',
          fontWeight: 700,
          color: connected ? 'var(--color-green-600)' : color,
          position: 'relative',
        }}
      >
        {connecting ? (
          <div
            style={{
              width: '20px',
              height: '20px',
              border: '2px solid var(--color-gray-300)',
              borderTopColor: color,
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
        ) : connected ? (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M5 10l3 3 7-7"
              stroke="var(--color-green-600)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          initials
        )}
      </div>
      <span
        style={{
          fontSize: 'var(--font-size-xs)',
          fontWeight: 500,
          color: 'var(--color-gray-700)',
          textAlign: 'center',
        }}
      >
        {name}
      </span>
      {connected && (
        <span
          style={{
            fontSize: '0.625rem',
            color: 'var(--color-green-600)',
            fontWeight: 500,
          }}
        >
          Connected
        </span>
      )}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
}
