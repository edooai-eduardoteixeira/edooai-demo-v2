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
    <div className="flex items-baseline min-h-8 gap-2 px-3 py-2.5 rounded-sm bg-transparent cursor-default select-none mt-1 transition-colors duration-200 ease-out">
      {/* Status indicator */}
      <span
        className={`w-3.5 shrink-0 text-xs leading-none transition-colors duration-200 ease-out ${
          checked && checkVisible ? 'text-green-600' : 'text-foreground-faint'
        }`}
      >
        {checked && checkVisible ? '✓' : '○'}
      </span>

      {/* Field label */}
      <span
        className={`text-sm font-medium flex-1 min-w-0 leading-normal transition-colors duration-200 ease-out ${
          checked ? 'text-foreground' : 'text-foreground-faint'
        }`}
      >
        {field.framework}
      </span>

      {/* Source label */}
      {source && (
        <span
          className="text-xs text-foreground-faint font-normal whitespace-nowrap shrink-0 transition-opacity duration-200 ease-out"
          style={{ opacity: sourceVisible ? 1 : 0 }}
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
    <div className="bg-accent-subtle border border-border rounded-lg shadow-inset-sm h-fit sticky top-8" style={{ padding: '28px 32px' }}>
      {categories.map((cat, ci) => {
        const isHighlighted = highlighted.includes(cat.label);

        return (
          <div
            key={ci}
            className={ci < categories.length - 1 ? 'mb-6' : ''}
          >
            {/* Category header */}
            <div
              className={`pb-2.5 mb-2 border-b border-border transition-colors duration-300 ease-out ${
                isHighlighted ? 'bg-accent-subtle rounded px-1.5 pt-0.5 pb-1.5' : 'px-0 pt-0 pb-1.5'
              }`}
            >
              <span className="text-[13px] font-semibold text-foreground-muted tracking-[0.06em]">
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
