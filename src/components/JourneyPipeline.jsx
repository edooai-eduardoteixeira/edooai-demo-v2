import React, { useState } from 'react';
import Badge from './Badge.jsx';

function formatNumber(n) {
  return n.toLocaleString('en-US');
}

function StageCard({ stage, index, visible, annotation, editable, onRename }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(stage.name);

  const handleClick = () => {
    if (editable && !editing) {
      setEditing(true);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      setEditing(false);
      if (onRename) onRename(index, name);
    }
    if (e.key === 'Escape') {
      setName(stage.name);
      setEditing(false);
    }
  };

  const handleBlur = () => {
    setEditing(false);
    if (onRename) onRename(index, name);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.5rem',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(-20px)',
        transition: 'all 0.5s ease',
        flex: 1,
        minWidth: 0,
      }}
    >
      {annotation && (
        <div style={{ marginBottom: '0.25rem' }}>
          <Badge variant={annotation.variant}>{annotation.text}</Badge>
        </div>
      )}
      <div
        style={{
          backgroundColor: 'var(--color-white)',
          border: '1px solid var(--color-gray-200)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem 1rem',
          textAlign: 'center',
          width: '100%',
          cursor: editable ? 'text' : 'default',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
        }}
        onClick={handleClick}
      >
        {editing ? (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            autoFocus
            style={{
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
              border: 'none',
              borderBottom: '2px solid var(--color-black)',
              outline: 'none',
              textAlign: 'center',
              width: '100%',
              background: 'transparent',
              fontFamily: 'inherit',
            }}
          />
        ) : (
          <div
            style={{
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
              color: 'var(--color-gray-900)',
              marginBottom: '0.25rem',
            }}
          >
            {name}
          </div>
        )}
        <div
          style={{
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 700,
            color: 'var(--color-black)',
            lineHeight: 1.2,
          }}
        >
          {formatNumber(stage.users)}
        </div>
        <div
          style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-gray-500)',
            marginTop: '0.125rem',
          }}
        >
          {stage.percentage}% of base
        </div>
      </div>
    </div>
  );
}

function Arrow({ visible, conversionLabel }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s ease',
        padding: '0 0.25rem',
        flexShrink: 0,
        minWidth: '2rem',
      }}
    >
      {conversionLabel && (
        <div
          style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-gray-500)',
            whiteSpace: 'nowrap',
            marginBottom: '0.25rem',
          }}
        >
          {conversionLabel}
        </div>
      )}
      <svg width="24" height="12" viewBox="0 0 24 12">
        <path d="M0 6 L18 6 M14 2 L20 6 L14 10" stroke="#a3a3a3" strokeWidth="1.5" fill="none" />
      </svg>
    </div>
  );
}

export default function JourneyPipeline({
  stages,
  visibleCount = 0,
  annotations = {},
  conversionLabels = {},
  editable = false,
  onRename,
  showManagementBracket = false,
}) {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '0',
          width: '100%',
        }}
      >
        {stages.map((stage, i) => (
          <React.Fragment key={i}>
            <StageCard
              stage={stage}
              index={i}
              visible={i < visibleCount}
              annotation={annotations[i]}
              editable={editable}
              onRename={onRename}
            />
            {i < stages.length - 1 && (
              <Arrow
                visible={i + 1 < visibleCount}
                conversionLabel={conversionLabels[i]}
              />
            )}
          </React.Fragment>
        ))}
      </div>
      {showManagementBracket && (
        <div
          style={{
            marginTop: '1rem',
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--color-gray-50)',
            border: '1px dashed var(--color-gray-300)',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-gray-600)',
          }}
        >
          Edoo AI manages the referred user's journey end-to-end through this window.
        </div>
      )}
    </div>
  );
}
