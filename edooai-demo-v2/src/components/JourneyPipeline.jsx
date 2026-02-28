import React, { useState, useEffect } from 'react';
import Badge from './Badge.jsx';

function formatNumber(n) {
  return n.toLocaleString('en-US');
}

const fillColors = ['#111', '#333', '#555', '#777'];

function StageCard({ stage, index, visible, annotation, animateFill }) {
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
        transition: 'opacity 0.4s ease, transform 0.4s ease',
        width: '200px',
        minWidth: '160px',
        flexShrink: 1,
      }}
    >
      {annotation && (
        <div style={{ marginBottom: '8px', opacity: 1, transition: 'opacity 0.3s ease' }}>
          <Badge variant={annotation.variant}>{annotation.text}</Badge>
        </div>
      )}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E5E5',
          borderRadius: '8px',
          padding: '16px',
          textAlign: 'center',
          width: '100%',
          height: '140px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
        }}
      >
        <div
          style={{
            fontSize: '14px',
            fontWeight: 700,
            color: '#111',
            textAlign: 'left',
          }}
        >
          {stage.name}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div
            style={{
              fontSize: '26px',
              fontWeight: 700,
              color: '#111',
              lineHeight: 1.2,
            }}
          >
            {formatNumber(stage.users)}
          </div>
          <div
            style={{
              fontSize: '12px',
              color: '#999',
              marginTop: '2px',
            }}
          >
            {stage.percentage}% of base
          </div>
        </div>
        <div
          style={{
            width: '100%',
            height: '6px',
            backgroundColor: '#EEEEEE',
            borderRadius: '3px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${fillWidth}%`,
              height: '100%',
              backgroundColor: fillColors[index] || '#777',
              borderRadius: '3px',
              transition: 'width 0.4s ease',
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
        transition: 'opacity 0.2s ease',
        width: '24px',
        flexShrink: 0,
        alignSelf: 'center',
      }}
    >
      {conversionLabel && (
        <div
          style={{
            fontSize: '12px',
            color: '#999',
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
            backgroundColor: '#CCCCCC',
          }}
        />
        <span
          style={{
            color: '#999',
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
              transition: 'opacity 0.3s ease',
            }}
          >
            <span style={{ fontSize: '18px', fontWeight: 700, color: '#111' }}>
              {conversionAnnotation.rate}
            </span>
            <span style={{ fontSize: '12px', color: '#888', marginLeft: '6px' }}>
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
            backgroundColor: 'var(--color-gray-50)',
            border: '1px dashed var(--color-gray-300)',
            borderRadius: '8px',
            textAlign: 'center',
            fontSize: '14px',
            color: 'var(--color-gray-600)',
          }}
        >
          Edoo AI manages the referred user's journey end-to-end through this window.
        </div>
      )}
    </div>
  );
}
