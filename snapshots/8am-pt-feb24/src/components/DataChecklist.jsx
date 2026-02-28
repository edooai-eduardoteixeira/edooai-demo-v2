import React, { useState, useEffect, useRef } from 'react';

function CheckItem({ field, checked, source }) {
  const hasNote = field.business && field.business.length > 0;
  const [sourceVisible, setSourceVisible] = useState(false);
  const prevChecked = useRef(checked);

  useEffect(() => {
    if (checked && !prevChecked.current) {
      // Fade in the "via Source" text after a brief delay
      const timer = setTimeout(() => setSourceVisible(true), 50);
      return () => clearTimeout(timer);
    }
    if (checked) setSourceVisible(true);
    prevChecked.current = checked;
  }, [checked]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        height: '30px',
        gap: '0.5rem',
        padding: '0 0.25rem',
      }}
    >
      {/* Checkbox */}
      <div
        style={{
          width: '16px',
          height: '16px',
          borderRadius: '3px',
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
          transition: 'all 200ms ease',
        }}
      >
        {checked && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d="M2 5l2 2 4.5-4.5"
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
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          flex: 1,
          minWidth: 0,
          lineHeight: 1.3,
          transition: 'color 200ms ease',
        }}
      >
        <span
          style={{
            fontWeight: 600,
            color: checked ? 'var(--color-gray-900)' : '#666',
            transition: 'color 200ms ease',
          }}
        >
          {field.framework}
        </span>
        {hasNote && (
          <span
            style={{
              color: checked ? '#888' : '#999',
              fontWeight: 400,
              transition: 'color 200ms ease',
            }}
          >
            {' '}&middot; {field.business}
          </span>
        )}
      </span>

      {/* Source label — fades in when checked */}
      {source && (
        <span
          style={{
            fontSize: '0.6875rem',
            color: 'var(--color-gray-400)',
            fontWeight: 400,
            whiteSpace: 'nowrap',
            flexShrink: 0,
            opacity: sourceVisible ? 1 : 0,
            transition: 'opacity 200ms ease',
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
  highlightedCategories,
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

  const highlighted = highlightedCategories || [];

  return (
    <div
      style={{
        backgroundColor: '#F8F8F8',
        borderRadius: '8px',
        padding: '20px 24px',
        height: 'fit-content',
        position: 'sticky',
        top: '2rem',
      }}
    >
      <h3
        style={{
          fontSize: '0.9375rem',
          fontWeight: 700,
          marginBottom: '1.25rem',
          color: 'var(--color-gray-900)',
        }}
      >
        Data Requirements
      </h3>

      {categories.map((cat, ci) => {
        const isProfile = cat.label === 'Customer Profile';
        const showNote = isProfile && profileNote;
        const isHighlighted = highlighted.includes(cat.label);

        return (
          <div
            key={ci}
            style={{
              marginBottom: ci < categories.length - 1 ? '20px' : 0,
            }}
          >
            {/* Category header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '0.375rem',
                paddingBottom: '6px',
                marginBottom: '4px',
                borderBottom: '1px solid #EAEAEA',
                backgroundColor: isHighlighted
                  ? 'rgba(0,0,0,0.03)'
                  : 'transparent',
                borderRadius: '4px',
                padding: isHighlighted ? '2px 6px 6px 6px' : '0 0 6px 0',
                transition: 'background-color 300ms ease',
              }}
            >
              <span
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: 'var(--color-gray-900)',
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
                  marginTop: '4px',
                  paddingLeft: '1.5rem',
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
