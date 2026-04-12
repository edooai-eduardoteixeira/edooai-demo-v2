import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { TOKENS, CHART_MARGIN, VIEWBOX_WIDTH, DEFAULT_HEIGHT, labelBase, formatCompact } from './chartUtils.js';

/**
 * Stacked bar chart component following Vincor design system.
 *
 * Uses the D3 margin convention (same as Chart.jsx):
 * - CSS padding on the chart area div creates label zones
 * - SVG viewBox starts at 0,0 — bars fill the entire SVG element
 * - HTML labels positioned in fixed CSS pixels
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
  xLabels,
  yLabels,
  gridlines = true,
  formatTooltip,
  formatValue = formatCompact,
  legend,
  categorical = false, // When true, x-labels center under bars by index (not continuous scale)
  hoverHighlight = false, // When true, hovered bar lightens (like funnel) instead of dimming others
}) {
  const [hoveredBar, setHoveredBar] = useState(null);
  const [animated, setAnimated] = useState(false);
  const [svgDims, setSvgDims] = useState(null);
  const chartAreaRef = useRef(null);
  const svgRef = useRef(null);

  // Measure SVG content area (always — needed for pixel label positioning)
  useLayoutEffect(() => {
    const el = chartAreaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const w = rect.width - CHART_MARGIN.left - CHART_MARGIN.right;
    const h = rect.height - CHART_MARGIN.top - CHART_MARGIN.bottom;
    if (w > 0 && h > 0) {
      setSvgDims({ width: w, height: h });
    }
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        setSvgDims({ width, height });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const viewBoxH = (cssHeight && svgDims)
    ? svgDims.height / svgDims.width * VIEWBOX_WIDTH
    : heightProp;

  const pxPerUnit = svgDims ? svgDims.width / VIEWBOX_WIDTH : 0;

  // Entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Data fills entire SVG — padding is CSS-level
  const chartLeft = 0;
  const chartTop = 0;
  const chartW = VIEWBOX_WIDTH;
  const chartH = viewBoxH;
  const chartBottom = viewBoxH;

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

  // Mouse tracking — use SVGPoint for accurate mapping with meet aspect ratio
  const handleMouseMove = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());

    let found = null;
    for (let i = 0; i < bars.length; i++) {
      const bx = chartLeft + i * totalSlotWidth;
      if (svgP.x >= bx && svgP.x < bx + totalSlotWidth) {
        found = i;
        break;
      }
    }
    setHoveredBar(found);
  }, [bars.length, chartLeft, totalSlotWidth]);

  const handleMouseLeave = useCallback(() => setHoveredBar(null), []);

  // Resolve x-axis labels
  // Categorical: labels center under each bar by index
  // Time-series: labels positioned on continuous scale via `at`
  const resolvedXLabels = (xLabels || []).map((item, idx) => ({
    label: String(item.value),
    x: categorical
      ? chartLeft + idx * totalSlotWidth + totalSlotWidth / 2
      : chartLeft + ((item.at - 1) / Math.max(n - 1, 1)) * chartW,
  }));

  // Resolve y-axis gridlines
  const resolvedYLabels = yLabels || [];
  const gridlineValues = gridlines === 'from-labels' ? resolvedYLabels : [];

  // Tooltip data
  const tooltipData = hoveredBar !== null ? data[hoveredBar] : null;
  const tooltipBar = hoveredBar !== null ? bars[hoveredBar] : null;

  const viewBox = `0 0 ${VIEWBOX_WIDTH} ${viewBoxH}`;

  // Chart area style: CSS padding creates label zones
  const chartAreaStyle = {
    position: 'relative',
    paddingLeft: CHART_MARGIN.left,
    paddingRight: CHART_MARGIN.right,
    paddingTop: CHART_MARGIN.top,
    paddingBottom: CHART_MARGIN.bottom,
    ...(cssHeight ? { flex: 1, minHeight: 0 } : {}),
  };

  return (
    <div style={cssHeight ? { height: cssHeight, display: 'flex', flexDirection: 'column' } : {}}>
      {/* Legend (inline styles — matches Chart.jsx / StackedAreaChart.jsx) */}
      {legend && segments && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px 16px',
            marginBottom: 6,
            justifyContent: 'flex-end',
          }}
        >
          {[...segments].reverse().map((seg, i) => (
            <span
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11,
                fontFamily: 'var(--font-family)',
                color: 'var(--text-tertiary)',
                lineHeight: 1,
                whiteSpace: 'nowrap',
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: seg.color,
                  flexShrink: 0,
                }}
              />
              {seg.label}
            </span>
          ))}
        </div>
      )}

      {/* Chart area — CSS padding creates axis label zones */}
      <div ref={chartAreaRef} style={chartAreaStyle}>
        <svg
          ref={svgRef}
          viewBox={viewBox}
          preserveAspectRatio="xMidYMid meet"
          style={{ width: '100%', height: cssHeight ? '100%' : 'auto', display: 'block' }}
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
          {bars.map((bar, barIdx) => {
            const isHovered = hoveredBar === barIdx;
            const hasSomeHover = hoveredBar !== null;
            // hoverHighlight mode: hovered bar lightens (like funnel hover:bg-accent-light)
            // default mode: non-hovered bars dim to 0.4 opacity
            const groupOpacity = hoverHighlight
              ? 1
              : (hasSomeHover && !isHovered ? 0.4 : 1);
            const barFill = (segIdx) => {
              const base = segments[segIdx]?.color || 'var(--color-brand)';
              if (hoverHighlight && isHovered) return 'var(--accent-light)';
              return base;
            };

            return (
            <g
              key={barIdx}
              style={{
                opacity: groupOpacity,
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
                    fill={barFill(segIdx)}
                    rx={isTop ? BAR_RADIUS : 0}
                    ry={isTop ? BAR_RADIUS : 0}
                    style={{
                      transformOrigin: `${r.x + r.width / 2}px ${chartBottom}px`,
                      transform: animated ? 'scaleY(1)' : 'scaleY(0)',
                      transition: `transform ${ANIMATION_DURATION}ms ease-out ${barIdx * ANIMATION_STAGGER}ms, fill 150ms ease`,
                    }}
                  />
                );
              })}
            </g>
            );
          }
          ))}

          {/* Hover hit zone */}
          <rect
            x={chartLeft}
            y={chartTop}
            width={chartW}
            height={chartH}
            fill="transparent"
            style={{ cursor: 'crosshair' }}
          />
        </svg>

        {/* Y-axis labels (HTML — fixed pixel positioning) */}
        {resolvedYLabels.map((val, i) => {
          const y = chartBottom - (val / maxVal) * chartH;
          return (
            <span
              key={i}
              style={{
                ...labelBase,
                left: CHART_MARGIN.left - 8,
                top: CHART_MARGIN.top + y * pxPerUnit,
                transform: 'translate(-100%, -50%)',
              }}
            >
              {formatValue(val)}
            </span>
          );
        })}

        {/* X-axis labels (HTML — fixed pixel positioning) */}
        {resolvedXLabels.map((item, i) => (
          <span
            key={i}
            style={{
              ...labelBase,
              left: CHART_MARGIN.left + item.x * pxPerUnit,
              bottom: 5,
              transform: 'translateX(-50%)',
            }}
          >
            {item.label}
          </span>
        ))}

        {/* Tooltip */}
        {hoveredBar !== null && tooltipData && tooltipBar && (
          <Tooltip
            bar={tooltipBar}
            data={tooltipData}
            segments={segments}
            index={hoveredBar}
            formatTooltip={formatTooltip}
            formatValue={formatValue}
            chartBottom={chartBottom}
            pxPerUnit={pxPerUnit}
            viewBoxH={viewBoxH}
          />
        )}
      </div>
    </div>
  );
}

function Tooltip({ bar, data, segments, index, formatTooltip, formatValue, chartBottom, pxPerUnit, viewBoxH }) {
  const centerX = bar.rects[0].x + bar.rects[0].width / 2;
  const topY = chartBottom - bar.total;

  const leftPx = CHART_MARGIN.left + centerX * pxPerUnit;
  const topPx = CHART_MARGIN.top + topY * pxPerUnit;

  // Flip tooltip below if too close to top
  const flipBelow = (topY / viewBoxH) * 100 < 20;
  const flipTopPx = CHART_MARGIN.top + (topY + bar.total * 0.5) * pxPerUnit;

  const total = data.values.reduce((a, b) => a + b, 0);

  return (
    <div
      className="absolute pointer-events-none z-10"
      style={{
        left: leftPx,
        top: flipBelow ? flipTopPx : topPx,
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
            <span className="ml-auto font-semibold">{formatValue(data.values[si])}</span>
          </div>
        ))}
        <div className="border-t border-white/20 mt-1.5 pt-1.5 flex justify-between font-bold">
          <span>Total</span>
          <span>{formatValue(total)}</span>
        </div>
      </div>
    </div>
  );
}
