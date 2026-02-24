import React from 'react';

function CheckItem({ field, checked, source, animDelay }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        padding: '0.5rem 0',
        transition: 'opacity var(--transition-base)',
        animationDelay: animDelay ? `${animDelay}ms` : '0ms',
      }}
    >
      <div
        style={{
          width: '20px',
          height: '20px',
          borderRadius: 'var(--radius-sm)',
          border: checked
            ? '2px solid var(--color-green-500)'
            : '2px solid var(--color-gray-300)',
          backgroundColor: checked
            ? 'var(--color-green-50)'
            : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'all var(--transition-base)',
          marginTop: '1px',
        }}
      >
        {checked && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M2.5 6l2.5 2.5 5-5"
              stroke="var(--color-green-600)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              fontSize: 'var(--font-size-sm)',
              fontWeight: 500,
              color: checked
                ? 'var(--color-gray-900)'
                : 'var(--color-gray-500)',
            }}
          >
            {field.framework}
          </span>
          {source && (
            <span
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-green-600)',
                fontWeight: 500,
              }}
            >
              via {source}
            </span>
          )}
        </div>
        <span
          style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-gray-400)',
          }}
        >
          ({field.business})
        </span>
      </div>
    </div>
  );
}

export default function DataChecklist({
  config,
  checkedFields,
  profileNote,
}) {
  const categories = [
    {
      label: 'Customer Base',
      badge: 'Required',
      fields: config.connection.group1.fieldsProvided.find(
        (c) => c.category === 'Customer Base'
      )?.fields || [],
    },
    {
      label: 'Transaction History',
      badge: 'Required',
      fields: config.connection.group2.fieldsProvided.find(
        (c) => c.category === 'Transaction History'
      )?.fields || [],
    },
    {
      label: 'Behavioral Events',
      badge: 'Required',
      fields: config.connection.group2.fieldsProvided.find(
        (c) => c.category === 'Behavioral Events'
      )?.fields || [],
    },
    {
      label: 'Customer Profile',
      badge: 'Recommended',
      fields: [
        { framework: 'Age / Date of Birth', business: 'Age / Date of Birth' },
        { framework: 'Address / Region', business: 'Address / Region' },
        { framework: 'Signup Date', business: 'Signup Date' },
        { framework: 'Acquisition Channel', business: 'Acquisition Channel' },
      ],
    },
    {
      label: 'Satisfaction Signals',
      badge: 'Optional',
      fields: config.connection.group3.fieldsProvided.find(
        (c) => c.category === 'Satisfaction Signals'
      )?.fields || [],
    },
  ];

  return (
    <div
      style={{
        backgroundColor: 'var(--color-gray-50)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        height: 'fit-content',
        position: 'sticky',
        top: '2rem',
      }}
    >
      <h3
        style={{
          fontSize: 'var(--font-size-base)',
          fontWeight: 600,
          marginBottom: '1.25rem',
          color: 'var(--color-gray-900)',
        }}
      >
        Data Requirements
      </h3>

      {categories.map((cat, ci) => {
        const isProfile = cat.label === 'Customer Profile';
        const showNote = isProfile && profileNote;

        return (
          <div key={ci} style={{ marginBottom: '1.25rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.5rem',
              }}
            >
              <span
                style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 600,
                  color: 'var(--color-gray-700)',
                }}
              >
                {cat.label}
              </span>
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-gray-400)',
                  fontWeight: 500,
                }}
              >
                ({cat.badge})
              </span>
            </div>
            {cat.fields.map((field, fi) => {
              const key = `${cat.label}:${field.framework}`;
              const checked = checkedFields[key];
              return (
                <CheckItem
                  key={fi}
                  field={field}
                  checked={!!checked}
                  source={checked || null}
                />
              );
            })}
            {showNote && (
              <p
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-gray-400)',
                  fontStyle: 'italic',
                  marginTop: '0.5rem',
                  paddingLeft: '1.75rem',
                }}
              >
                {profileNote}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
