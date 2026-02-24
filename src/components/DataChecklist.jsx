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
        height: '36px',
        gap: '0.4rem',
        padding: '0 0',
        cursor: 'default',
        userSelect: 'none',
      }}
    >
      {/* Green checkmark — only visible when checked */}
      <span
        style={{
          width: '16px',
          flexShrink: 0,
          fontSize: '13px',
          lineHeight: 1,
          opacity: checked && checkVisible ? 1 : 0,
          color: '#34C759',
          transition: 'opacity 200ms ease',
        }}
      >
        ✓
      </span>

      {/* Field label */}
      <span
        style={{
          fontSize: '14px',
          fontWeight: 400,
          color: checked ? '#333' : '#BBB',
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
            fontSize: '12px',
            color: '#999',
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
        backgroundColor: '#fff',
        border: '1px solid #E8E8E8',
        borderRadius: '10px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        padding: '22px 24px',
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
              marginTop: ci > 0 ? '24px' : 0,
            }}
          >
            {/* Category header — v1 section label */}
            <div
              style={{
                marginBottom: '12px',
                backgroundColor: isHighlighted
                  ? 'rgba(0,0,0,0.03)'
                  : 'transparent',
                borderRadius: '4px',
                padding: isHighlighted ? '2px 6px' : '0',
                transition: 'background-color 300ms ease',
              }}
            >
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#888',
                  textTransform: 'uppercase',
                  letterSpacing: '1.2px',
                }}
              >
                {cat.label}
              </span>
            </div>

            {/* Field rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
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
          </div>
        );
      })}
    </div>
  );
}
