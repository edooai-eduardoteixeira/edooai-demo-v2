import React, { useState, useEffect } from 'react';
import Badge from './Badge.jsx';

function formatNumber(n) {
  return n.toLocaleString('en-US');
}

const fillColors = ['var(--accent)', 'var(--color-gray-700)', 'var(--color-gray-600)', 'var(--color-gray-500)'];

function StageCard({ stage, index, visible, annotation, animateFill, hideNumbers }) {
  const [fillWidth, setFillWidth] = useState(0);

  useEffect(() => {
    if (visible && animateFill) {
      const timer = setTimeout(() => {
        setFillWidth(stage.percentage);
      }, 50);
      return () => clearTimeout(timer);
    } else if (visible) {
      setFillWidth(stage.percentage);
    }
  }, [visible, animateFill, stage.percentage]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(-20px)',
        transition: 'opacity var(--transition-slow), transform var(--transition-slow)',
        width: '200px',
        minWidth: '160px',
        flexShrink: 1,
      }}
    >
      {annotation && (
        <div style={{ marginBottom: '8px', opacity: 1, transition: 'opacity var(--transition-slow)' }}>
          <Badge variant={annotation.variant}>{annotation.text}</Badge>
        </div>
      )}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          textAlign: 'center',
          width: '100%',
          height: hideNumbers ? '90px' : '140px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          style={{
            fontSize: '14px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            textAlign: 'left',
          }}
        >
          {stage.name}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {!hideNumbers && (
            <div
              style={{
                fontSize: '24px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                lineHeight: 1.2,
              }}
            >
              {formatNumber(stage.users)}
            </div>
          )}
          <div
            style={{
              fontSize: hideNumbers ? '20px' : '12px',
              fontWeight: hideNumbers ? 700 : 400,
              color: hideNumbers ? 'var(--text-primary)' : 'var(--text-tertiary)',
              marginTop: '2px',
            }}
          >
            {stage.percentage}%{!hideNumbers && ' of base'}
          </div>
        </div>
        <div
          style={{
            width: '100%',
            height: '6px',
            backgroundColor: 'var(--color-gray-200)',
            borderRadius: '3px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${fillWidth}%`,
              height: '100%',
              backgroundColor: fillColors[index] || 'var(--color-gray-500)',
              borderRadius: '3px',
              transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
        </div>
      </div>
    </div>
  );
}

function Connector({ visible, conversionLabel }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: visible ? 1 : 0,
        transition: 'opacity var(--transition-base)',
        width: '24px',
        flexShrink: 0,
        alignSelf: 'center',
      }}
    >
      {conversionLabel && (
        <div
          style={{
            fontSize: '12px',
            color: 'var(--text-tertiary)',
            whiteSpace: 'nowrap',
            marginBottom: '4px',
          }}
        >
          {conversionLabel}
        </div>
      )}
      <div
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            flex: 1,
            height: '2px',
            backgroundColor: 'var(--color-gray-300)',
          }}
        />
        <span
          style={{
            color: 'var(--text-tertiary)',
            fontSize: '16px',
            lineHeight: 1,
            marginLeft: '-2px',
          }}
        >
          ›
        </span>
      </div>
    </div>
  );
}

export default function JourneyPipeline({
  stages,
  visibleCount = 0,
  annotations = {},
  conversionLabels = {},
  conversionAnnotation = null,
  animateFill = false,
  editable = false,
  onRename,
  showManagementBracket = false,
  hideNumbers = false,
}) {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          width: '100%',
          maxWidth: '872px',
          margin: '0 auto',
          position: 'relative',
        }}
      >
        {stages.map((stage, i) => (
          <React.Fragment key={i}>
            <StageCard
              stage={stage}
              index={i}
              visible={i < visibleCount}
              annotation={annotations[i]}
              animateFill={animateFill}
              hideNumbers={hideNumbers}
            />
            {i < stages.length - 1 && (
              <Connector
                visible={i + 1 < visibleCount}
                conversionLabel={conversionLabels[i]}
              />
            )}
          </React.Fragment>
        ))}
        {conversionAnnotation && (
          <div
            style={{
              position: 'absolute',
              top: '-40px',
              left: '50%',
              transform: 'translateX(-50%)',
              textAlign: 'center',
              opacity: 1,
              transition: 'opacity var(--transition-slow)',
            }}
          >
            <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {conversionAnnotation.rate}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginLeft: '6px' }}>
              {conversionAnnotation.label}
            </span>
          </div>
        )}
      </div>
      {showManagementBracket && (
        <div
          style={{
            marginTop: '1rem',
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--accent-subtle)',
            border: '1px dashed var(--border)',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center',
            fontSize: '14px',
            color: 'var(--text-secondary)',
          }}
        >
          Edoo AI manages the referred user's journey end-to-end through this window.
        </div>
      )}
    </div>
  );
}
