import { useState, useCallback, useLayoutEffect, useRef, useId } from 'react';

/**
 * Reusable chart component that enforces the Vincor design system.
 *
 * Defaults (always enforced):
 * - Brand-colored line (var(--color-brand), 2.5px stroke)
 * - Axis labels (11px Inter, var(--text-tertiary)) — physically 11px regardless of chart size
 * - X-axis baseline (var(--border-light))
 * - Dashed gridlines (var(--border-light))
 * - Endpoint dot (brand, 3.5px) with optional label
 * - Hover tooltip (dark bg, white text, crosshair)
 * - Chart title (13px semibold, var(--text-secondary))
 *
 * Font sizes are measured in physical pixels, not viewBox units.
 * A ResizeObserver measures the container and adjusts SVG font sizes
 * so they always render at the design-system spec regardless of
 * chart dimensions or container width.
 *
 * Opt-in features:
 * - fill: area fill under line
 * - dashed: render line as dashed
 * - threshold: learning phase split with annotations
 */

// --- Design tokens (from DESIGN.md) ---
const TOKENS = {
  line: { color: 'var(--color-brand)', width: 2.5 },
  axis: { fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-family)' },
  baseline: { color: 'var(--border-light)' },
  gridline: { color: 'var(--border-light)', dash: '4,4' },
  endpoint: { radius: 3.5, color: 'var(--color-brand)' },
  tooltip: {
    bg: 'var(--text-primary)',
    text: 'white',
    fontSize: 11,
    fontWeight: 600,
    radius: 4,
    dotRadius: 4,
    dotStroke: 'white',
    dotStrokeWidth: 2,
    crosshairColor: 'var(--color-gray-300)',
    crosshairDash: '3,3',
  },
  title: { fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'var(--font-family)' },
  preLine: { color: '#A89E94', dash: '6,4', opacity: 0.6, width: 2 },
  thresholdLine: { color: '#A89E94', dash: '4,4', opacity: 0.6 },
  thresholdLabel: { fontSize: 11, fontFamily: 'var(--font-family)' },
};

const DEFAULT_PADDING = { top: 10, right: 0, bottom: 40, left: 28 };
const DEFAULT_HEIGHT = 210;
const VIEWBOX_WIDTH = 828; // Fixed for all charts — guarantees identical font rendering
const DEFAULT_GRIDLINE_COUNT = 2;

function computePoints(data, chartLeft, chartTop, chartW, chartH, maxVal) {
  return data.map((v, i) => ({
    x: chartLeft + (i / Math.max(data.length - 1, 1)) * chartW,
    y: chartTop + chartH - (v / maxVal) * chartH,
  }));
}

function buildPath(points) {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
}

function buildAreaPath(pathD, lastX, firstX, bottom) {
  return `${pathD} L${lastX},${bottom} L${firstX},${bottom} Z`;
}

function resolveXLabels(xLabels, data, chartLeft, chartW) {
  if (!xLabels || xLabels.length === 0) return [];
  if (typeof xLabels[0] === 'string') {
    if (xLabels.length === 1) {
      return [{ label: xLabels[0], x: chartLeft, anchor: 'start' }];
    }
    if (xLabels.length === 2) {
      return [
        { label: xLabels[0], x: chartLeft, anchor: 'start' },
        { label: xLabels[1], x: chartLeft + chartW, anchor: 'end' },
      ];
    }
    return xLabels.map((label, i) => ({
      label,
      x: chartLeft + (i / (xLabels.length - 1)) * chartW,
      anchor: i === 0 ? 'start' : i === xLabels.length - 1 ? 'end' : 'middle',
    }));
  }
  return xLabels.map((item) => ({
    label: String(item.value),
    x: chartLeft + ((item.at - 1) / Math.max(data.length - 1, 1)) * chartW,
    anchor: 'middle',
  }));
}

export default function Chart({
  data,
  title,
  height = DEFAULT_HEIGHT,
  padding: paddingProp,
  maxValue,
  xLabels,
  yLabels = 'auto',
  gridlines = true,
  fill,
  dashed = false,
  threshold,
  tooltip = true,
  formatTooltip,
  endpointLabel,
}) {
  const [hoveredDay, setHoveredDay] = useState(null);
  const [containerWidth, setContainerWidth] = useState(null);
  const containerRef = useRef(null);
  const uid = useId();
  const safeId = uid.replace(/:/g, '_');

  // Measure container width synchronously before paint (useLayoutEffect)
  // then track resizes via ResizeObserver.
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // Synchronous read — available before browser paints
    setContainerWidth(el.getBoundingClientRect().width);
    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const padding = { ...DEFAULT_PADDING, ...paddingProp };
  if (title) padding.top = Math.max(padding.top, 30);

  const chartLeft = 0;
  const chartTop = padding.top;
  const chartW = VIEWBOX_WIDTH - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const chartBottom = chartTop + chartH;

  // pxScale: multiply a CSS-pixel value by this to get the equivalent viewBox units.
  // VIEWBOX_WIDTH is fixed (828) for all charts, so the only variable is container width.
  // This guarantees identical font sizes across all Chart instances.
  const pxScale = containerWidth ? VIEWBOX_WIDTH / containerWidth : 1;
  const px = (cssPixels) => cssPixels * pxScale;

  const maxVal = maxValue != null ? maxValue : Math.max(...data) * 1.08;
  const points = computePoints(data, chartLeft, chartTop, chartW, chartH, maxVal);
  const pathD = buildPath(points);
  const lastPt = points[points.length - 1];
  const lastVal = data[data.length - 1];

  const hasThreshold = threshold && threshold.at != null;
  const threshX = hasThreshold
    ? chartLeft + (threshold.at / Math.max(data.length - 1, 1)) * chartW
    : null;

  const resolvedXLabels = resolveXLabels(xLabels, data, chartLeft, chartW);

  // Y labels
  let yLabelItems = [];
  if (yLabels === 'auto') {
    yLabelItems = [
      { val: 0, y: chartBottom },
      { val: Math.round(maxVal), y: chartTop },
    ];
  } else if (Array.isArray(yLabels)) {
    yLabelItems = yLabels.map((val) => ({
      val,
      y: chartBottom - (val / maxVal) * chartH,
    }));
  }

  // Gridlines — "from-labels" aligns with y-labels, otherwise evenly spaced interior lines
  const gridlineItems = [];
  if (gridlines === 'from-labels') {
    yLabelItems.forEach((item) => {
      if (item.val > 0) gridlineItems.push(item.y);
    });
  } else {
    const gridlineCount = gridlines === true ? DEFAULT_GRIDLINE_COUNT : typeof gridlines === 'number' ? gridlines : 0;
    for (let i = 1; i <= gridlineCount; i++) {
      const frac = i / (gridlineCount + 1);
      gridlineItems.push(chartTop + chartH * (1 - frac));
    }
  }

  const viewBox = `${-padding.left} 0 ${VIEWBOX_WIDTH} ${height}`;

  const handleMouseMove = useCallback(
    (e) => {
      if (!tooltip) return;
      const svg = e.currentTarget.closest('svg');
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
      const idx = Math.round(((svgP.x - chartLeft) / chartW) * (data.length - 1));
      const clamped = Math.max(0, Math.min(data.length - 1, idx));
      setHoveredDay({
        index: clamped,
        value: data[clamped],
        x: points[clamped].x,
        y: points[clamped].y,
      });
    },
    [tooltip, chartLeft, chartW, data, points],
  );

  const handleMouseLeave = useCallback(() => setHoveredDay(null), []);

  const tooltipText = hoveredDay
    ? formatTooltip
      ? formatTooltip(hoveredDay.index, hoveredDay.value)
      : `${hoveredDay.value}`
    : '';

  return (
    <div ref={containerRef}>
      <svg
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet"
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        <defs>
          {/* Area fill gradient (opt-in) */}
          {fill && (
            <linearGradient
              id={`${safeId}-areaFill`}
              x1="0"
              y1={chartTop}
              x2="0"
              y2={chartBottom}
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor={fill.color || 'var(--color-brand)'} stopOpacity={fill.opacity || 0.07} />
              <stop offset="60%" stopColor={fill.color || 'var(--color-brand)'} stopOpacity={(fill.opacity || 0.07) * 0.35} />
              <stop offset="100%" stopColor={fill.color || 'var(--color-brand)'} stopOpacity={0} />
            </linearGradient>
          )}

          {/* Threshold-specific gradients and clips */}
          {hasThreshold && (
            <>
              {threshold.preFill && (
                <linearGradient
                  id={`${safeId}-preFill`}
                  x1="0"
                  y1={chartTop}
                  x2="0"
                  y2={chartBottom}
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0%" stopColor={threshold.preFill.color || '#A89E94'} stopOpacity={threshold.preFill.opacity || 0.12} />
                  <stop offset="60%" stopColor={threshold.preFill.color || '#A89E94'} stopOpacity={(threshold.preFill.opacity || 0.12) * 0.4} />
                  <stop offset="100%" stopColor={threshold.preFill.color || '#A89E94'} stopOpacity={0} />
                </linearGradient>
              )}
              {threshold.strokeGradient && (
                <linearGradient
                  id={`${safeId}-strokeGrad`}
                  x1={threshX}
                  y1="0"
                  x2={chartLeft + chartW}
                  y2="0"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0%" stopColor={threshold.preStyle?.color || TOKENS.preLine.color} />
                  <stop offset="40%" stopColor="var(--color-brand)" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="var(--color-brand)" />
                </linearGradient>
              )}
              <clipPath id={`${safeId}-clipPre`}>
                <rect x={chartLeft} y="0" width={threshX - chartLeft} height={height} />
              </clipPath>
              <clipPath id={`${safeId}-clipPost`}>
                <rect x={threshX} y="0" width={chartLeft + chartW - threshX} height={height} />
              </clipPath>
            </>
          )}
        </defs>

        {/* Title */}
        {title && (
          <text
            x={chartLeft}
            y={chartTop - px(12)}
            fontSize={px(TOKENS.title.fontSize)}
            fontWeight={TOKENS.title.fontWeight}
            fill={TOKENS.title.color}
            fontFamily={TOKENS.title.fontFamily}
          >
            {title}
          </text>
        )}

        {/* Gridlines */}
        {gridlineItems.map((y, i) => (
          <line
            key={`grid-${i}`}
            x1={hasThreshold ? threshX : chartLeft}
            y1={y}
            x2={chartLeft + chartW}
            y2={y}
            stroke={TOKENS.gridline.color}
            strokeWidth="1"
            strokeDasharray={TOKENS.gridline.dash}
          />
        ))}

        {/* X-axis baseline */}
        <line
          x1={chartLeft}
          y1={chartBottom}
          x2={chartLeft + chartW}
          y2={chartBottom}
          stroke={TOKENS.baseline.color}
          strokeWidth="1"
        />

        {/* Y-axis labels */}
        {yLabelItems.map((item, i) => (
          <text
            key={`y-${i}`}
            x={-px(6)}
            y={item.y < chartTop + 5 ? item.y + px(14) : item.y + px(4)}
            fontSize={px(TOKENS.axis.fontSize)}
            fill={TOKENS.axis.color}
            textAnchor="end"
            fontFamily={TOKENS.axis.fontFamily}
          >
            {Math.round(item.val)}
          </text>
        ))}

        {/* X-axis labels */}
        {resolvedXLabels.map((item, i) => (
          <text
            key={`x-${i}`}
            x={item.x}
            y={chartBottom + px(20)}
            fontSize={px(TOKENS.axis.fontSize)}
            fill={TOKENS.axis.color}
            textAnchor={item.anchor}
            fontFamily={TOKENS.axis.fontFamily}
          >
            {item.label}
          </text>
        ))}

        {/* --- Area fills --- */}
        {hasThreshold && threshold.preFill && (
          <path
            d={buildAreaPath(pathD, lastPt.x, points[0].x, chartBottom)}
            fill={`url(#${safeId}-preFill)`}
            clipPath={`url(#${safeId}-clipPre)`}
          />
        )}
        {hasThreshold && fill && (
          <path
            d={buildAreaPath(pathD, lastPt.x, points[0].x, chartBottom)}
            fill={`url(#${safeId}-areaFill)`}
            clipPath={`url(#${safeId}-clipPost)`}
          />
        )}
        {!hasThreshold && fill && (
          <path
            d={buildAreaPath(pathD, lastPt.x, points[0].x, chartBottom)}
            fill={`url(#${safeId}-areaFill)`}
          />
        )}

        {/* --- Line --- */}
        {hasThreshold ? (
          <>
            {/* Pre-threshold: dashed warm taupe */}
            <path
              d={pathD}
              fill="none"
              stroke={threshold.preStyle?.color || TOKENS.preLine.color}
              strokeWidth={threshold.preStyle?.width || TOKENS.preLine.width}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={threshold.preStyle?.dashed !== false ? (threshold.preStyle?.dash || TOKENS.preLine.dash) : undefined}
              opacity={threshold.preStyle?.opacity ?? TOKENS.preLine.opacity}
              clipPath={`url(#${safeId}-clipPre)`}
            />
            {/* Post-threshold: solid brand (or gradient) */}
            <path
              d={pathD}
              fill="none"
              stroke={threshold.strokeGradient ? `url(#${safeId}-strokeGrad)` : TOKENS.line.color}
              strokeWidth={TOKENS.line.width}
              strokeLinecap="round"
              strokeLinejoin="round"
              clipPath={`url(#${safeId}-clipPost)`}
            />
          </>
        ) : (
          <path
            d={pathD}
            fill="none"
            stroke={TOKENS.line.color}
            strokeWidth={TOKENS.line.width}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={dashed ? '6,4' : undefined}
          />
        )}

        {/* Threshold dashed vertical line + labels */}
        {hasThreshold && (
          <>
            <line
              x1={threshX}
              y1={chartTop}
              x2={threshX}
              y2={chartBottom}
              stroke={TOKENS.thresholdLine.color}
              strokeWidth="1"
              strokeDasharray={TOKENS.thresholdLine.dash}
              opacity={TOKENS.thresholdLine.opacity}
            />
            {threshold.label && (
              <text
                x={threshX - px(8)}
                y={chartTop + px(16)}
                fontSize={px(TOKENS.thresholdLabel.fontSize)}
                fill={TOKENS.axis.color}
                fontFamily={TOKENS.thresholdLabel.fontFamily}
                fontWeight="500"
                textAnchor="end"
              >
                {threshold.label}
              </text>
            )}
            {threshold.sublabel && (
              <text
                x={threshX - px(8)}
                y={chartTop + px(28)}
                fontSize={px(TOKENS.thresholdLabel.fontSize)}
                fill={TOKENS.axis.color}
                fontFamily={TOKENS.thresholdLabel.fontFamily}
                fontWeight="400"
                opacity="0.6"
                textAnchor="end"
              >
                {threshold.sublabel}
              </text>
            )}
          </>
        )}

        {/* Hover overlay */}
        {tooltip && (
          <rect
            x={chartLeft}
            y={chartTop}
            width={chartW}
            height={chartH}
            fill="transparent"
            style={{ cursor: 'crosshair' }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          />
        )}

        {/* Tooltip */}
        {hoveredDay && (
          <>
            <line
              x1={hoveredDay.x}
              y1={chartTop}
              x2={hoveredDay.x}
              y2={chartBottom}
              stroke={TOKENS.tooltip.crosshairColor}
              strokeWidth="1"
              strokeDasharray={TOKENS.tooltip.crosshairDash}
            />
            <circle
              cx={hoveredDay.x}
              cy={hoveredDay.y}
              r={TOKENS.tooltip.dotRadius}
              fill={TOKENS.tooltip.bg}
              stroke={TOKENS.tooltip.dotStroke}
              strokeWidth={TOKENS.tooltip.dotStrokeWidth}
            />
            {(() => {
              const charW = px(6.5);
              const textLen = tooltipText.length * charW + px(16);
              const boxW = Math.max(textLen, px(48));
              const boxX = Math.max(
                -padding.left,
                Math.min(chartLeft + chartW - boxW, hoveredDay.x - boxW / 2),
              );
              return (
                <>
                  <rect
                    x={boxX}
                    y={hoveredDay.y - px(32)}
                    width={boxW}
                    height={px(22)}
                    rx={TOKENS.tooltip.radius}
                    fill={TOKENS.tooltip.bg}
                  />
                  <text
                    x={boxX + boxW / 2}
                    y={hoveredDay.y - px(17)}
                    fontSize={px(TOKENS.tooltip.fontSize)}
                    fontWeight={TOKENS.tooltip.fontWeight}
                    fill={TOKENS.tooltip.text}
                    textAnchor="middle"
                    fontFamily={TOKENS.axis.fontFamily}
                  >
                    {tooltipText}
                  </text>
                </>
              );
            })()}
          </>
        )}

        {/* Endpoint dot */}
        <circle
          cx={lastPt.x}
          cy={lastPt.y}
          r={TOKENS.endpoint.radius}
          fill={TOKENS.endpoint.color}
        />

        {/* Endpoint label */}
        {endpointLabel && (
          <text
            x={lastPt.x - px(14)}
            y={Math.max(px(10), lastPt.y - px(10))}
            fontSize={px(TOKENS.axis.fontSize)}
            fill={TOKENS.endpoint.color}
            fontWeight="600"
            textAnchor="end"
            fontFamily={TOKENS.axis.fontFamily}
          >
            {endpointLabel(lastVal)}
          </text>
        )}
      </svg>
    </div>
  );
}
