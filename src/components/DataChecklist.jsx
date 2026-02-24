import React from 'react';

function CheckItem({ field, checked, source }) {
  const hasNote = field.business && field.business.length > 0;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        height: '28px',
        gap: '0.5rem',
        padding: '0 0.25rem',
      }}
    >
      {/* Checkbox */}
      <div
        style={{
          width: '14px',
          height: '14px',
          borderRadius: '2px',
          border: checked
            ? 'none'
            : '1.5px solid var(--color-gray-300)',
          backgroundColor: checked
            ? 'var(--color-gray-900)'
            : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'all var(--transition-fast)',
        }}
      >
        {checked && (
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
            <path
              d="M1.5 4.5l2 2 4-4"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>

      {/* Field label · clarifying note */}
      <span
        style={{
          fontSize: '0.8125rem',
          color: 'var(--color-gray-900)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          flex: 1,
          minWidth: 0,
          lineHeight: 1.3,
        }}
      >
        <span style={{ fontWeight: 600 }}>{field.framework}</span>
        {hasNote && (
          <span
            style={{
              color: '#888',
              fontWeight: 400,
            }}
          >
            {' '}&middot; {field.business}
          </span>
        )}
      </span>

      {/* Source label — only shows when checked */}
      {source && (
        <span
          style={{
            fontSize: '0.6875rem',
            color: 'var(--color-gray-400)',
            fontWeight: 400,
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          via {source}
        </span>
      )}
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
      label: 'Customer Data',
      badge: 'Required',
      fields: config.connection.group1.fieldsProvided.find(
        (c) => c.category === 'Customer Data'
      )?.fields || [],
    },
    {
      label: 'Transaction Data',
      badge: 'Required',
      fields: config.connection.group2.fieldsProvided.find(
        (c) => c.category === 'Transaction Data'
      )?.fields || [],
    },
    {
      label: 'User Activity',
      badge: 'Required',
      fields: config.connection.group2.fieldsProvided.find(
        (c) => c.category === 'User Activity'
      )?.fields || [],
    },
    {
      label: 'Customer Profile',
      badge: 'Recommended',
      fields: [
        { framework: 'Date of Birth', business: '' },
        { framework: 'Location', business: 'City, state, or region' },
        { framework: 'Account Open Date', business: 'When they signed up' },
        { framework: 'Acquisition Source', business: 'How they found you' },
      ],
    },
    {
      label: 'Support & Satisfaction',
      badge: 'Optional',
      fields: config.connection.group3.fieldsProvided.find(
        (c) => c.category === 'Support & Satisfaction'
      )?.fields || [],
    },
  ];

  return (
    <div
      style={{
        backgroundColor: 'var(--color-gray-50)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem',
        height: 'fit-content',
        position: 'sticky',
        top: '2rem',
      }}
    >
      <h3
        style={{
          fontSize: 'var(--font-size-sm)',
          fontWeight: 700,
          marginBottom: '1rem',
          color: 'var(--color-gray-900)',
        }}
      >
        Data Requirements
      </h3>

      {categories.map((cat, ci) => {
        const isProfile = cat.label === 'Customer Profile';
        const showNote = isProfile && profileNote;

        return (
          <div key={ci} style={{ marginBottom: ci < categories.length - 1 ? '0.875rem' : 0 }}>
            {/* Category header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '0.375rem',
                marginBottom: '0.25rem',
              }}
            >
              <span
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  color: 'var(--color-gray-800)',
                }}
              >
                {cat.label}
              </span>
              <span
                style={{
                  fontSize: '0.6875rem',
                  color: 'var(--color-gray-400)',
                  fontWeight: 400,
                }}
              >
                ({cat.badge}) — {cat.fields.length} fields
              </span>
            </div>

            {/* Field rows */}
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

            {/* Profile data note */}
            {showNote && (
              <p
                style={{
                  fontSize: '0.6875rem',
                  color: 'var(--color-gray-400)',
                  fontStyle: 'italic',
                  marginTop: '0.125rem',
                  paddingLeft: '1.375rem',
                  lineHeight: 1.4,
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
