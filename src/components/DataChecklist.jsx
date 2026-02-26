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
        alignItems: 'center',
        minHeight: '36px',
        gap: '10px',
        padding: '6px 12px',
        borderRadius: 'var(--radius-sm)',
        backgroundColor: checked && checkVisible ? 'var(--accent-light)' : 'transparent',
        cursor: 'default',
        userSelect: 'none',
        transition: 'background-color var(--transition-base)',
      }}
    >
      {/* Status indicator */}
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          flexShrink: 0,
          fontSize: '10px',
          fontWeight: 700,
          border: checked && checkVisible
            ? '1.5px solid var(--success)'
            : '1.5px solid var(--border)',
          backgroundColor: checked && checkVisible ? '#d1fae5' : 'transparent',
          color: checked && checkVisible ? '#065f46' : 'var(--text-tertiary)',
          transition: 'all var(--transition-base)',
        }}
      >
        {checked && checkVisible ? '✓' : ''}
      </span>

      {/* Field label */}
      <span
        style={{
          fontSize: '14px',
          fontWeight: checked ? 500 : 400,
          color: checked ? 'var(--text-primary)' : 'var(--text-tertiary)',
          flex: 1,
          minWidth: 0,
          lineHeight: 1.4,
          transition: 'color var(--transition-base)',
        }}
      >
        {field.framework}
      </span>

      {/* Source label */}
      {source && (
        <span
          style={{
            fontSize: '11px',
            color: 'var(--text-tertiary)',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            flexShrink: 0,
            opacity: sourceVisible ? 1 : 0,
            padding: '2px 8px',
            backgroundColor: 'var(--accent-subtle)',
            borderRadius: 'var(--radius-full)',
            transition: 'opacity var(--transition-base)',
          }}
        >
          {source}
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

  // Count checked fields
  const totalFields = categories.reduce((sum, cat) => sum + cat.fields.length, 0);
  const checkedCount = Object.keys(checkedFields).length;

  return (
    <div
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        boxShadow: 'var(--shadow-sm)',
        height: 'fit-content',
        position: 'sticky',
        top: '24px',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            Data Requirements
          </span>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: checkedCount > 0 ? 'var(--success)' : 'var(--text-tertiary)',
              transition: 'color var(--transition-base)',
            }}
          >
            {checkedCount}/{totalFields}
          </span>
        </div>
        {/* Progress bar */}
        <div
          style={{
            height: '4px',
            borderRadius: '2px',
            backgroundColor: 'var(--border-light)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${totalFields > 0 ? (checkedCount / totalFields) * 100 : 0}%`,
              backgroundColor: checkedCount === totalFields && checkedCount > 0 ? 'var(--success)' : 'var(--accent)',
              borderRadius: '2px',
              transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1), background-color var(--transition-slow)',
            }}
          />
        </div>
      </div>

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
                paddingBottom: '8px',
                marginBottom: '4px',
                borderBottom: '1px solid var(--border-light)',
                backgroundColor: isHighlighted
                  ? 'var(--accent-light)'
                  : 'transparent',
                borderRadius: '4px',
                padding: isHighlighted ? '4px 8px 8px 8px' : '0 0 8px 0',
                transition: 'background-color var(--transition-slow)',
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--text-tertiary)',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
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
