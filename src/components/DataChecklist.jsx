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
        minHeight: '28px',
        gap: '0.4rem',
        padding: '2px 0.25rem',
        cursor: 'default',
        userSelect: 'none',
      }}
    >
      {/* Green checkmark — only visible when checked */}
      <span
        style={{
          width: '14px',
          flexShrink: 0,
          fontSize: '0.75rem',
          lineHeight: 1,
          opacity: checked && checkVisible ? 1 : 0,
          color: '#2D8A4E',
          transition: 'opacity 200ms ease',
        }}
      >
        ✓
      </span>

      {/* Field label — single line, single style */}
      <span
        style={{
          fontSize: '0.8125rem',
          fontWeight: 500,
          color: checked ? '#333' : '#999',
          flex: 1,
          minWidth: 0,
          lineHeight: 1.4,
          transition: 'color 200ms ease',
        }}
      >
        {field.framework}
      </span>

      {/* Source label — fades in when checked */}
      {source && (
        <span
          style={{
            fontSize: '0.6875rem',
            color: '#888',
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
        backgroundColor: '#F8F8F8',
        borderRadius: '8px',
        padding: '20px 24px',
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
              marginBottom: ci < categories.length - 1 ? '20px' : 0,
            }}
          >
            {/* Category header */}
            <div
              style={{
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
