import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { TOKENS, CHART_MARGIN, LEGEND_HEIGHT, labelBase, formatCompact } from './chartUtils.js';

/**
 * Single vertical stacked bar showing cohort composition of the Engaged band
 * at a given selectedDay. Each segment = one cohort's engaged count.
 *
 * Uses shared CHART_MARGIN for alignment with adjacent charts:
 * - top/bottom padding matches Chart.jsx / StackedBarChart.jsx
 * - reserveLegendSpace adds LEGEND_HEIGHT spacer when sibling has a legend
 *
 * Stacked bottom-to-top: oldest cohort at bottom, newest at top.
 */

export default function CohortBar({ cohortWaves, selectedDay, maxVal, colors, cssHeight, reserveLegendSpace }) {
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
    return (
      <>
        {reserveLegendSpace && <div style={{ height: LEGEND_HEIGHT }} />}
        <div ref={containerRef} style={cssHeight ? { height: cssHeight } : { height: 200 }} />
      </>
    );
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
        // Stable color: use absolute wave index (i), not filtered position
        color: colors[i % colors.length],
        waveIndex: i,
      });
    }
  }

  const totalEngaged = segments.reduce((sum, s) => sum + s.value, 0);
  const padTop = CHART_MARGIN.top;
  const padBottom = CHART_MARGIN.bottom;
  const barH = dims ? dims.height - padTop - padBottom : 200;
  const barW = dims ? Math.min(dims.width - padTop * 2, 60) : 40;
  const barX = dims ? (dims.width - barW) / 2 : padTop;
  const barY = padTop;

  // Scale: bar fills proportional to totalEngaged / maxVal
  const fillHeight = maxVal > 0 ? (totalEngaged / maxVal) * barH : 0;
  const emptyHeight = barH - fillHeight;

  // Build segments bottom-to-top
  let cumY = barY + barH; // start at bottom
  const rects = segments.map((seg, i) => {
    const segHeight = maxVal > 0 ? (seg.value / maxVal) * barH : 0;
    cumY -= segHeight;
    return {
      ...seg,
      x: barX,
      y: cumY,
      width: barW,
      height: segHeight,
      index: i,
    };
  });

  const svgW = dims?.width || 80;
  const svgH = dims?.height || 200;

  return (
    <>
      {reserveLegendSpace && <div className="mb-1.5" style={{ height: LEGEND_HEIGHT - 6 }} />}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          position: 'relative',
          minHeight: 0,
        }}
      >
        {/* Total label above bar */}
        {dims && totalEngaged > 0 && (
          <span
            style={{
              ...labelBase,
              left: '50%',
              top: Math.max(0, barY + emptyHeight - 14),
              transform: 'translateX(-50%)',
            }}
          >
            {formatCompact(totalEngaged)}
          </span>
        )}

        {dims && (
          <svg
            width={svgW}
            height={svgH}
            style={{ display: 'block' }}
          >
            {/* Stacked segments */}
            {rects.map((r, i) => (
              <rect
                key={r.startDay}
                x={r.x}
                y={r.y}
                width={r.width}
                height={Math.max(0, r.height)}
                fill={r.color}
                opacity={animated ? (hoveredSegment ? (hoveredSegment.startDay === r.startDay ? 0.9 : 0.4) : 0.7) : 0}
                rx={i === rects.length - 1 ? 2 : 0}
                style={{
                  transition: `opacity 200ms ease-out`,
                  cursor: 'pointer',
                }}
                onMouseEnter={() => setHoveredSegment(r)}
                onMouseLeave={() => setHoveredSegment(null)}
              />
            ))}
          </svg>
        )}

        {/* Day label below bar — positioned to align with X-axis labels in adjacent charts */}
        {dims && (
          <span
            style={{
              ...labelBase,
              left: '50%',
              bottom: 5,
              transform: 'translateX(-50%)',
            }}
          >
            {selectedDay}
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
                <span
                  style={{
                    display: 'inline-block',
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: seg.color,
                    flexShrink: 0,
                  }}
                />
                <span style={{ color: 'rgba(255,255,255,0.8)' }}>Day {seg.startDay}</span>
                <span style={{ marginLeft: 'auto', fontWeight: 600 }}>{formatCompact(seg.value)}</span>
              </div>
            ))}
            <div
              style={{
                borderTop: '1px solid rgba(255,255,255,0.2)',
                marginTop: 4,
                paddingTop: 4,
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 700,
              }}
            >
              <span>Total</span>
              <span>{formatCompact(totalEngaged)}</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
