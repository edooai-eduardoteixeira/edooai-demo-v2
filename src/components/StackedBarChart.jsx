import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { cn } from '../lib/utils';
import { TOKENS, DEFAULT_PADDING, VIEWBOX_WIDTH, DEFAULT_HEIGHT, formatCompact } from './chartUtils.js';

/**
 * Stacked bar chart component following Vincor design system.
 *
 * Text labels rendered as HTML (not SVG) for consistent 11px sizing.
 * SVG handles only bars, gridlines, and hover overlays.
 */

const BAR_RADIUS = 2;
const GAP_RATIO = 0.25; // gap = 25% of bar width
const ANIMATION_DURATION = 400;
const ANIMATION_STAGGER = 15;

export default function StackedBarChart({
  data,
  segments,
  maxValue,
  cssHeight,
  height: heightProp = DEFAULT_HEIGHT,
  padding: paddingProp,
  xLabels,
  yLabels,
  gridlines = true,
  formatTooltip,
  legend,
}) {
  const [hoveredBar, setHoveredBar] = useState(null);
  const [animated, setAnimated] = useState(false);
  const [containerDims, setContainerDims] = useState(null);
  const chartAreaRef = useRef(null);
  const svgRef = useRef(null);

  // Measure container for cssHeight mode (same pattern as Chart.jsx)
  useLayoutEffect(() => {
    if (!cssHeight) return;
    const el = chartAreaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      setContainerDims({ width: rect.width, height: rect.height });
    }
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        setContainerDims({ width, height });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [cssHeight]);

  const height = (cssHeight && containerDims)
    ? containerDims.height / containerDims.width * VIEWBOX_WIDTH
    : heightProp;

  // Entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const padding = { ...DEFAULT_PADDING, ...paddingProp };
  const chartLeft = padding.left;
  const chartTop = padding.top;
  const chartW = VIEWBOX_WIDTH - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const chartBottom = chartTop + chartH;

  const n = data.length;
  const maxVal = maxValue || Math.max(...data.map(d => d.values.reduce((a, b) => a + b, 0)), 1);

  // Bar geometry
  const totalSlotWidth = chartW / Math.max(n, 1);
  const gap = Math.max(totalSlotWidth * GAP_RATIO, 2);
  const barWidth = totalSlotWidth - gap;

  // Compute bar rects
  const bars = data.map((d, i) => {
    const x = chartLeft + i * totalSlotWidth + gap / 2;
    let yOffset = 0;
    const rects = d.values.map((val, si) => {
      const barH = (val / maxVal) * chartH;
      const y = chartBottom - yOffset - barH;
      yOffset += barH;
      return { x, y, width: barWidth, height: barH, segmentIndex: si };
    });
    return { rects, total: yOffset, index: i };
  });

  // Mouse tracking for tooltip
  const handleMouseMove = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * VIEWBOX_WIDTH;

    // Find which bar index the mouse is over
    let found = null;
    for (let i = 0; i < bars.length; i++) {
      const bx = chartLeft + i * totalSlotWidth;
      if (svgX >= bx && svgX < bx + totalSlotWidth) {
        found = i;
        break;
      }
    }
    setHoveredBar(found);
  }, [bars.length, chartLeft, totalSlotWidth]);

  const handleMouseLeave = useCallback(() => setHoveredBar(null), []);

  // Resolve x-axis labels
  const resolvedXLabels = (xLabels || []).map((item) => ({
    label: String(item.value),
    x: chartLeft + ((item.at - 1) / Math.max(n - 1, 1)) * chartW,
  }));

  // Resolve y-axis gridlines
  const resolvedYLabels = yLabels || [];
  const gridlineValues = gridlines === 'from-labels' ? resolvedYLabels : [];

  // Tooltip data
  const tooltipData = hoveredBar !== null ? data[hoveredBar] : null;
  const tooltipBar = hoveredBar !== null ? bars[hoveredBar] : null;

  return (
    <div className="relative w-full" style={cssHeight ? { height: cssHeight } : undefined}>
      {/* Legend */}
      {legend && segments && (
        <div className="flex items-center justify-end gap-4 mb-1">
          {segments.map((seg, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span
                className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: seg.color }}
              />
              <span className="text-[11px] text-foreground-muted">{seg.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Chart area */}
      <div
        ref={chartAreaRef}
        className="relative w-full"
        style={cssHeight ? { height: `calc(${cssHeight} - ${legend ? 24 : 0}px)` } : undefined}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VIEWBOX_WIDTH} ${height}`}
          preserveAspectRatio="none"
          className={cn('block w-full', cssHeight ? 'h-full' : undefined)}
          style={!cssHeight ? { height: heightProp } : undefined}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Gridlines */}
          {gridlineValues.map((val, i) => {
            if (val === 0) return null;
            const y = chartBottom - (val / maxVal) * chartH;
            return (
              <line
                key={i}
                x1={chartLeft}
                y1={y}
                x2={chartLeft + chartW}
                y2={y}
                stroke={TOKENS.gridline.color}
                strokeDasharray={TOKENS.gridline.dash}
                opacity={TOKENS.gridline.opacity}
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}

          {/* Bars */}
          {bars.map((bar, barIdx) => (
            <g
              key={barIdx}
              style={{
                opacity: hoveredBar !== null && hoveredBar !== barIdx ? 0.4 : 1,
                transition: 'opacity 150ms ease',
              }}
            >
              {bar.rects.map((r, segIdx) => {
                const isTop = segIdx === segments.length - 1;
                return (
                  <rect
                    key={segIdx}
                    x={r.x}
                    y={r.y}
                    width={r.width}
                    height={Math.max(r.height, 0)}
                    fill={segments[segIdx]?.color || 'var(--color-brand)'}
                    rx={isTop ? BAR_RADIUS : 0}
                    ry={isTop ? BAR_RADIUS : 0}
                    style={{
                      transformOrigin: `${r.x + r.width / 2}px ${chartBottom}px`,
                      transform: animated ? 'scaleY(1)' : 'scaleY(0)',
                      transition: `transform ${ANIMATION_DURATION}ms ease-out ${barIdx * ANIMATION_STAGGER}ms`,
                    }}
                  />
                );
              })}
            </g>
          ))}

          {/* Hover hit zone (transparent overlay for stable mouse events) */}
          <rect
            x={chartLeft}
            y={chartTop}
            width={chartW}
            height={chartH}
            fill="transparent"
            style={{ cursor: 'crosshair' }}
          />
        </svg>

        {/* Y-axis labels (HTML for consistent 11px sizing) */}
        {resolvedYLabels.map((val, i) => {
          const y = chartBottom - (val / maxVal) * chartH;
          const pctTop = `${(y / height) * 100}%`;
          return (
            <span
              key={i}
              className="absolute text-[11px] text-tertiary tabular-nums leading-none pointer-events-none"
              style={{
                left: 0,
                top: pctTop,
                transform: 'translateY(-50%)',
                fontFamily: 'var(--font-family)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              ${formatCompact(val)}
            </span>
          );
        })}

        {/* X-axis labels (HTML) */}
        {resolvedXLabels.map((item, i) => {
          const pctLeft = `${(item.x / VIEWBOX_WIDTH) * 100}%`;
          return (
            <span
              key={i}
              className="absolute text-[11px] text-tertiary tabular-nums leading-none pointer-events-none"
              style={{
                left: pctLeft,
                bottom: 0,
                transform: 'translateX(-50%)',
                fontFamily: 'var(--font-family)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {item.label}
            </span>
          );
        })}

        {/* Tooltip */}
        {hoveredBar !== null && tooltipData && tooltipBar && (
          <Tooltip
            bar={tooltipBar}
            data={tooltipData}
            segments={segments}
            index={hoveredBar}
            formatTooltip={formatTooltip}
            chartTop={chartTop}
            chartBottom={chartBottom}
            chartLeft={chartLeft}
            chartW={chartW}
            viewboxWidth={VIEWBOX_WIDTH}
            viewboxHeight={height}
          />
        )}
      </div>
    </div>
  );
}

function Tooltip({ bar, data, segments, index, formatTooltip, chartTop, chartBottom, chartLeft, chartW, viewboxWidth, viewboxHeight }) {
  const centerX = bar.rects[0].x + bar.rects[0].width / 2;
  const topY = chartBottom - bar.total;

  // Position tooltip above the bar
  const pctLeft = (centerX / viewboxWidth) * 100;
  const pctTop = (topY / viewboxHeight) * 100;

  // Flip tooltip below if too close to top
  const flipBelow = pctTop < 20;

  const total = data.values.reduce((a, b) => a + b, 0);

  return (
    <div
      className="absolute pointer-events-none z-10"
      style={{
        left: `${pctLeft}%`,
        top: flipBelow ? `${((topY + bar.total * 0.5) / viewboxHeight) * 100}%` : `${pctTop}%`,
        transform: `translate(-50%, ${flipBelow ? '8px' : '-100%'}) translateY(${flipBelow ? '0' : '-8px'})`,
      }}
    >
      <div
        className="rounded-md shadow-lg px-3 py-2 min-w-[120px]"
        style={{
          backgroundColor: TOKENS.tooltip.bg,
          color: TOKENS.tooltip.text,
          fontSize: TOKENS.tooltip.fontSize,
          fontWeight: TOKENS.tooltip.fontWeight,
        }}
      >
        <div className="text-white/60 mb-1.5">Day {index + 1}</div>
        {segments.map((seg, si) => (
          <div key={si} className="flex items-center gap-1.5 mb-0.5">
            <span
              className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: seg.color }}
            />
            <span className="text-white/80">{seg.label}</span>
            <span className="ml-auto font-semibold">${data.values[si]}</span>
          </div>
        ))}
        <div className="border-t border-white/20 mt-1.5 pt-1.5 flex justify-between font-bold">
          <span>Total</span>
          <span>${total}</span>
        </div>
      </div>
    </div>
  );
}
