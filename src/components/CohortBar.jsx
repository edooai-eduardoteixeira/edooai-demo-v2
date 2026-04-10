import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { TOKENS, formatCompact } from './chartUtils.js';

/**
 * Vertical stacked bar showing cohort composition of the Engaged segment
 * at a given selectedDay. Designed as a "zoom callout" target — the parent
 * renders connecting lines from the main lifecycle chart's Engaged segment
 * to this bar.
 *
 * Stacked bottom-to-top: oldest cohort at bottom (darkest), newest at top (lightest).
 */

export default function CohortBar({ cohortWaves, selectedDay, maxVal, colors, cssHeight }) {
  const [hoveredSegment, setHoveredSegment] = useState(null);
  const [animated, setAnimated] = useState(false);
  const [dims, setDims] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      setDims({ width: rect.width, height: rect.height });
    }
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        setDims({ width, height });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (!cohortWaves || cohortWaves.length === 0 || !maxVal) {
    return <div ref={containerRef} style={cssHeight ? { height: cssHeight } : { height: 200 }} />;
  }

  // Get active cohorts at selectedDay (0-indexed)
  const dayIndex = selectedDay - 1;
  const segments = [];
  for (let i = 0; i < cohortWaves.length; i++) {
    const wave = cohortWaves[i];
    const val = wave.data[dayIndex] || 0;
    if (val > 0) {
      segments.push({
        startDay: wave.startDay,
        value: Math.round(val),
        color: colors[i % colors.length],
        waveIndex: i,
      });
    }
  }

  const totalEngaged = segments.reduce((sum, s) => sum + s.value, 0);

  // Layout: label zone at top (28px), bar fills remaining, day label at bottom (20px)
  const labelZone = 28;
  const bottomZone = 20;
  const barH = dims ? dims.height - labelZone - bottomZone : 200;
  const barW = dims ? Math.min(dims.width * 0.55, 56) : 44;
  const barX = dims ? (dims.width - barW) / 2 : 0;
  const barY = labelZone;

  // Scale: bar fills proportional to totalEngaged / maxVal
  const fillHeight = maxVal > 0 ? (totalEngaged / maxVal) * barH : 0;
  const emptyHeight = barH - fillHeight;

  // Build segments bottom-to-top
  let cumY = barY + barH;
  const rects = segments.map((seg, i) => {
    const segHeight = maxVal > 0 ? (seg.value / maxVal) * barH : 0;
    cumY -= segHeight;
    return { ...seg, x: barX, y: cumY, width: barW, height: segHeight, index: i };
  });

  const svgW = dims?.width || 80;
  const svgH = dims?.height || 200;

  return (
    <div
      ref={containerRef}
      style={{
        ...(cssHeight ? { height: cssHeight } : { flex: 1 }),
        position: 'relative',
        minHeight: 0,
      }}
    >
      {/* Header: "ENGAGED" label + total count */}
      {dims && (
        <>
          <span
            style={{
              position: 'absolute',
              left: '50%',
              top: 0,
              transform: 'translateX(-50%)',
              fontSize: 11,
              fontWeight: 600,
              fontFamily: 'var(--font-family)',
              color: 'var(--text-tertiary)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
            }}
          >
            ENGAGED
          </span>
          <span
            style={{
              position: 'absolute',
              left: '50%',
              top: 14,
              transform: 'translateX(-50%)',
              fontSize: 11,
              fontWeight: 600,
              fontFamily: 'var(--font-family)',
              color: 'var(--text-secondary)',
              fontVariantNumeric: 'tabular-nums',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
            }}
          >
            {formatCompact(totalEngaged)}
          </span>
        </>
      )}

      {dims && (
        <svg width={svgW} height={svgH} style={{ display: 'block' }}>
          {/* Stacked cohort segments */}
          {rects.map((r, i) => (
            <rect
              key={r.startDay}
              x={r.x}
              y={r.y}
              width={r.width}
              height={Math.max(0, r.height)}
              fill={r.color}
              opacity={animated ? (hoveredSegment ? (hoveredSegment.startDay === r.startDay ? 0.9 : 0.4) : 0.8) : 0}
              rx={i === rects.length - 1 ? 2 : 0}
              style={{ transition: 'opacity 200ms ease-out', cursor: 'pointer' }}
              onMouseEnter={() => setHoveredSegment(r)}
              onMouseLeave={() => setHoveredSegment(null)}
            />
          ))}

          {/* Day labels on segments (right side, only where they fit) */}
          {rects.map((r) => (
            r.height > 14 ? (
              <text
                key={`label-${r.startDay}`}
                x={r.x + r.width + 6}
                y={r.y + r.height / 2 + 4}
                fontSize="10"
                fill="var(--text-tertiary)"
                fontFamily="var(--font-family)"
                style={{ pointerEvents: 'none' }}
              >
                d{r.startDay}
              </text>
            ) : null
          ))}
        </svg>
      )}

      {/* Day label below bar */}
      {dims && (
        <span
          style={{
            position: 'absolute',
            left: '50%',
            bottom: 2,
            transform: 'translateX(-50%)',
            fontSize: 11,
            fontFamily: 'var(--font-family)',
            color: 'var(--text-tertiary)',
            fontVariantNumeric: 'tabular-nums',
            pointerEvents: 'none',
          }}
        >
          Day {selectedDay}
        </span>
      )}

      {/* Tooltip — shows ALL segments + total */}
      {hoveredSegment && (
        <div
          style={{
            position: 'absolute',
            left: svgW + 4,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: TOKENS.tooltip.fontSize,
            fontWeight: TOKENS.tooltip.fontWeight,
            fontFamily: 'var(--font-family)',
            color: TOKENS.tooltip.text,
            background: TOKENS.tooltip.bg,
            borderRadius: TOKENS.tooltip.radius,
            padding: '6px 10px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            boxShadow: `${TOKENS.tooltip.shadow.dx}px ${TOKENS.tooltip.shadow.dy}px ${TOKENS.tooltip.shadow.blur}px rgba(0,0,0,${TOKENS.tooltip.shadow.opacity})`,
            zIndex: 10,
            lineHeight: 1.4,
            minWidth: 130,
          }}
        >
          <div style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>Day {selectedDay} Cohorts</div>
          {[...segments].reverse().map((seg) => (
            <div
              key={seg.startDay}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 2,
                opacity: hoveredSegment.startDay === seg.startDay ? 1 : 0.6,
              }}
            >
              <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', backgroundColor: seg.color, flexShrink: 0 }} />
              <span style={{ color: 'rgba(255,255,255,0.8)' }}>Day {seg.startDay}</span>
              <span style={{ marginLeft: 'auto', fontWeight: 600 }}>{formatCompact(seg.value)}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', marginTop: 4, paddingTop: 4, display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
            <span>Total</span>
            <span>{formatCompact(totalEngaged)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
