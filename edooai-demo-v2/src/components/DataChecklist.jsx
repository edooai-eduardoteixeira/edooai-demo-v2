import React, { useState, useEffect, useRef } from 'react';

function CheckItem({ field, checked, source }) {
  const [sourceVisible, setSourceVisible] = useState(false);
  const [checkVisible, setCheckVisible] = useState(false);
  const prevChecked = useRef(checked);

  useEffect(() => {
    if (checked && !prevChecked.current) {
      const timer = setTimeout(() => {
        setCheckVisible(true);
        setSourceVisible(true);
      }, 50);
      return () => clearTimeout(timer);
    }
    if (checked) {
      setCheckVisible(true);
      setSourceVisible(true);
    }
    prevChecked.current = checked;
  }, [checked]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        minHeight: '32px',
        gap: '0.5rem',
        padding: '10px 12px',
        borderRadius: 'var(--radius-sm)',
        backgroundColor: 'transparent',
        cursor: 'default',
        userSelect: 'none',
        marginTop: '3px',
        transition: 'background-color 200ms ease',
      }}
    >
      {/* Status indicator: ○ waiting → ✓ connected */}
      <span
        style={{
          width: '14px',
          flexShrink: 0,
          fontSize: '0.75rem',
          lineHeight: 1,
          color: checked && checkVisible ? 'var(--color-green-600)' : 'var(--text-tertiary)',
          transition: 'color 200ms ease',
        }}
      >
        {checked && checkVisible ? '✓' : '○'}
      </span>

      {/* Field label — single line, single style */}
      <span
        style={{
          fontSize: '0.875rem',
          fontWeight: 500,
          color: checked ? 'var(--text-primary)' : 'var(--text-tertiary)',
          flex: 1,
          minWidth: 0,
          lineHeight: 1.5,
          transition: 'color 200ms ease',
        }}
      >
        {field.framework}
      </span>

      {/* Source label — fades in when checked */}
      {source && (
        <span
          style={{
            fontSize: '0.75rem',
            color: 'var(--text-tertiary)',
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
  highlightedCategories,
}) {
  const { connection } = config;

  const categories = [
    {
      label: 'REQUIRED DATA',
      fields: [
        ...(connection.group1.fieldsProvided.find((c) => c.category === 'REQUIRED DATA')?.fields || []),
        ...(connection.group2.fieldsProvided.find((c) => c.category === 'REQUIRED DATA')?.fields || []),
      ],
    },
    {
      label: 'OPTIONAL DATA',
      fields: [
        ...(connection.group1.fieldsProvided.find((c) => c.category === 'OPTIONAL DATA')?.fields || []),
        { framework: 'How they found you' },
        ...(connection.group3.fieldsProvided.find((c) => c.category === 'OPTIONAL DATA')?.fields || []),
      ],
    },
  ];

  const highlighted = highlightedCategories || [];

  return (
    <div
      style={{
        backgroundColor: 'var(--color-gray-50)',
        border: '1px solid var(--color-gray-200)',
        borderRadius: 'var(--radius-lg)',
        padding: '28px 32px',
        boxShadow: 'var(--shadow-inset-sm)',
        height: 'fit-content',
        position: 'sticky',
        top: '2rem',
      }}
    >
      {categories.map((cat, ci) => {
        const isHighlighted = highlighted.includes(cat.label);

        return (
          <div
            key={ci}
            style={{
              marginBottom: ci < categories.length - 1 ? '24px' : 0,
            }}
          >
            {/* Category header */}
            <div
              style={{
                paddingBottom: '10px',
                marginBottom: '8px',
                borderBottom: '1px solid var(--border)',
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
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  letterSpacing: '0.06em',
                }}
              >
                {cat.label}
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
          </div>
        );
      })}
    </div>
  );
}
