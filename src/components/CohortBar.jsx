import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { TOKENS, DEFAULT_PADDING, LEGEND_HEIGHT, formatCompact } from './chartUtils.js';

/**
 * Single vertical stacked bar showing cohort composition of the Engaged band
 * at a given selectedDay. Each segment = one cohort's engaged count.
 *
 * Uses shared DEFAULT_PADDING for alignment with adjacent charts:
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
        color: colors[Math.min(i, colors.length - 1)],
      });
    }
  }

  const totalEngaged = segments.reduce((sum, s) => sum + s.value, 0);
  const padTop = DEFAULT_PADDING.top;
  const padBottom = DEFAULT_PADDING.bottom;
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
          ...(cssHeight ? { height: cssHeight } : { flex: 1 }),
          position: 'relative',
          minHeight: 0,
        }}
      >
        {dims && (
          <svg
            width={svgW}
            height={svgH}
            style={{ display: 'block' }}
          >
            {/* Empty space background (subtle) */}
            <rect
              x={barX}
              y={barY}
              width={barW}
              height={emptyHeight}
              rx={2}
              fill="var(--border-light)"
              opacity={0.3}
            />

            {/* Stacked segments */}
            {rects.map((r, i) => (
              <rect
                key={r.startDay}
                x={r.x}
                y={r.y}
                width={r.width}
                height={Math.max(0, r.height)}
                fill={r.color}
                opacity={animated ? 0.7 : 0}
                rx={i === rects.length - 1 ? 2 : 0}
                style={{
                  transition: `opacity 300ms ease-out ${i * 30}ms`,
                  cursor: 'pointer',
                }}
                onMouseEnter={() => setHoveredSegment(r)}
                onMouseLeave={() => setHoveredSegment(null)}
              />
            ))}
          </svg>
        )}

        {/* Total label above bar */}
        {animated && totalEngaged > 0 && (
          <span
            className="absolute text-[11px] text-tertiary tabular-nums leading-none pointer-events-none"
            style={{
              left: '50%',
              top: 0,
              transform: 'translateX(-50%)',
              fontFamily: 'var(--font-family)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {formatCompact(totalEngaged)}
          </span>
        )}

        {/* Day label below bar */}
        {animated && (
          <span
            className="absolute text-[11px] text-tertiary tabular-nums leading-none pointer-events-none"
            style={{
              left: '50%',
              bottom: 0,
              transform: 'translateX(-50%)',
              fontFamily: 'var(--font-family)',
            }}
          >
            Day {selectedDay}
          </span>
        )}

        {/* Tooltip */}
        {hoveredSegment && (
          <div
            style={{
              position: 'absolute',
              left: svgW + 4,
              top: hoveredSegment.y,
              fontSize: TOKENS.tooltip.fontSize,
              fontWeight: TOKENS.tooltip.fontWeight,
              fontFamily: 'var(--font-family)',
              color: TOKENS.tooltip.text,
              background: TOKENS.tooltip.bg,
              borderRadius: TOKENS.tooltip.radius,
              padding: '4px 8px',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              boxShadow: `${TOKENS.tooltip.shadow.dx}px ${TOKENS.tooltip.shadow.dy}px ${TOKENS.tooltip.shadow.blur}px rgba(0,0,0,${TOKENS.tooltip.shadow.opacity})`,
              zIndex: 10,
              lineHeight: 1.3,
            }}
          >
            <div>Day {hoveredSegment.startDay} cohort</div>
            <div>{formatCompact(hoveredSegment.value)} engaged</div>
          </div>
        )}
      </div>
    </>
  );
}
