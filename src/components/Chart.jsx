import { useState, useCallback, useRef, useId } from 'react';

/**
 * Reusable chart component that enforces the Vincor design system.
 *
 * All text labels are rendered as HTML (not SVG text) so font sizes
 * are always in CSS pixels — guaranteed 11px regardless of chart
 * dimensions or container width.
 *
 * The SVG handles only visual elements: lines, areas, gradients, dots.
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
const VIEWBOX_WIDTH = 828;
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

// Convert SVG viewBox coordinate to CSS percentage position within the wrapper
function toLeft(svgX, padLeft) {
  return `${((svgX + padLeft) / VIEWBOX_WIDTH) * 100}%`;
}
function toTop(svgY, h) {
  return `${(svgY / h) * 100}%`;
}

// Base style for all HTML text labels — guarantees fixed CSS-pixel font sizes
const labelBase = {
  position: 'absolute',
  fontSize: TOKENS.axis.fontSize,
  fontFamily: 'var(--font-family)',
  color: TOKENS.axis.color,
  lineHeight: 1,
  whiteSpace: 'nowrap',
  pointerEvents: 'none',
};

const anchorTransform = {
  start: 'translateY(-50%)',
  end: 'translate(-100%, -50%)',
  middle: 'translate(-50%, -50%)',
};

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
  const uid = useId();
  const safeId = uid.replace(/:/g, '_');

  const padding = { ...DEFAULT_PADDING, ...paddingProp };
  if (title) padding.top = Math.max(padding.top, 30);

  const chartLeft = 0;
  const chartTop = padding.top;
  const chartW = VIEWBOX_WIDTH - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const chartBottom = chartTop + chartH;

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

  // Gridlines
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
    <div style={{ position: 'relative' }}>
      {/* ── SVG: visual elements only (no text) ── */}
      <svg
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet"
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        <defs>
          {fill && (
            <linearGradient
              id={`${safeId}-areaFill`}
              x1="0" y1={chartTop} x2="0" y2={chartBottom}
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor={fill.color || 'var(--color-brand)'} stopOpacity={fill.opacity || 0.07} />
              <stop offset="60%" stopColor={fill.color || 'var(--color-brand)'} stopOpacity={(fill.opacity || 0.07) * 0.35} />
              <stop offset="100%" stopColor={fill.color || 'var(--color-brand)'} stopOpacity={0} />
            </linearGradient>
          )}

          {hasThreshold && (
            <>
              {threshold.preFill && (
                <linearGradient
                  id={`${safeId}-preFill`}
                  x1="0" y1={chartTop} x2="0" y2={chartBottom}
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
                  x1={threshX} y1="0" x2={chartLeft + chartW} y2="0"
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

        {/* Gridlines */}
        {gridlineItems.map((y, i) => (
          <line
            key={`grid-${i}`}
            x1={hasThreshold ? threshX : chartLeft}
            y1={y} x2={chartLeft + chartW} y2={y}
            stroke={TOKENS.gridline.color} strokeWidth="1"
            strokeDasharray={TOKENS.gridline.dash}
          />
        ))}

        {/* X-axis baseline */}
        <line
          x1={chartLeft} y1={chartBottom}
          x2={chartLeft + chartW} y2={chartBottom}
          stroke={TOKENS.baseline.color} strokeWidth="1"
        />

        {/* Area fills */}
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

        {/* Line */}
        {hasThreshold ? (
          <>
            <path
              d={pathD} fill="none"
              stroke={threshold.preStyle?.color || TOKENS.preLine.color}
              strokeWidth={threshold.preStyle?.width || TOKENS.preLine.width}
              strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray={threshold.preStyle?.dashed !== false ? (threshold.preStyle?.dash || TOKENS.preLine.dash) : undefined}
              opacity={threshold.preStyle?.opacity ?? TOKENS.preLine.opacity}
              clipPath={`url(#${safeId}-clipPre)`}
            />
            <path
              d={pathD} fill="none"
              stroke={threshold.strokeGradient ? `url(#${safeId}-strokeGrad)` : TOKENS.line.color}
              strokeWidth={TOKENS.line.width}
              strokeLinecap="round" strokeLinejoin="round"
              clipPath={`url(#${safeId}-clipPost)`}
            />
          </>
        ) : (
          <path
            d={pathD} fill="none"
            stroke={TOKENS.line.color} strokeWidth={TOKENS.line.width}
            strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray={dashed ? '6,4' : undefined}
          />
        )}

        {/* Threshold vertical line */}
        {hasThreshold && (
          <line
            x1={threshX} y1={chartTop} x2={threshX} y2={chartBottom}
            stroke={TOKENS.thresholdLine.color} strokeWidth="1"
            strokeDasharray={TOKENS.thresholdLine.dash}
            opacity={TOKENS.thresholdLine.opacity}
          />
        )}

        {/* Hover overlay */}
        {tooltip && (
          <rect
            x={chartLeft} y={chartTop}
            width={chartW} height={chartH}
            fill="transparent" style={{ cursor: 'crosshair' }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          />
        )}

        {/* Tooltip visuals (SVG — crosshair, dot, pill, text) */}
        {hoveredDay && (
          <>
            <line
              x1={hoveredDay.x} y1={chartTop}
              x2={hoveredDay.x} y2={chartBottom}
              stroke={TOKENS.tooltip.crosshairColor} strokeWidth="1"
              strokeDasharray={TOKENS.tooltip.crosshairDash}
            />
            <circle
              cx={hoveredDay.x} cy={hoveredDay.y}
              r={TOKENS.tooltip.dotRadius}
              fill={TOKENS.tooltip.bg}
              stroke={TOKENS.tooltip.dotStroke}
              strokeWidth={TOKENS.tooltip.dotStrokeWidth}
            />
            {(() => {
              const textLen = tooltipText.length * 6.5 + 16;
              const boxW = Math.max(textLen, 48);
              const boxX = Math.max(
                -padding.left,
                Math.min(chartLeft + chartW - boxW, hoveredDay.x - boxW / 2),
              );
              return (
                <>
                  <rect
                    x={boxX} y={hoveredDay.y - 32}
                    width={boxW} height={22}
                    rx={TOKENS.tooltip.radius} fill={TOKENS.tooltip.bg}
                  />
                  <text
                    x={boxX + boxW / 2} y={hoveredDay.y - 17}
                    fontSize={TOKENS.tooltip.fontSize}
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
          cx={lastPt.x} cy={lastPt.y}
          r={TOKENS.endpoint.radius} fill={TOKENS.endpoint.color}
        />
      </svg>

      {/* ── HTML labels: always 11px CSS pixels, no SVG scaling ── */}

      {/* Y-axis labels */}
      {yLabelItems.map((item, i) => (
        <span
          key={`y-${i}`}
          style={{
            ...labelBase,
            left: toLeft(-6, padding.left),
            top: toTop(item.y, height),
            transform: 'translate(-100%, -50%)',
          }}
        >
          {Math.round(item.val)}
        </span>
      ))}

      {/* X-axis labels */}
      {resolvedXLabels.map((item, i) => (
        <span
          key={`x-${i}`}
          style={{
            ...labelBase,
            left: toLeft(item.x, padding.left),
            top: toTop(chartBottom + 12, height),
            transform: anchorTransform[item.anchor],
          }}
        >
          {item.label}
        </span>
      ))}

      {/* Threshold labels */}
      {hasThreshold && threshold.label && (
        <span
          style={{
            ...labelBase,
            left: toLeft(threshX - 8, padding.left),
            top: toTop(chartTop + 8, height),
            transform: 'translate(-100%, -50%)',
            fontWeight: 500,
          }}
        >
          {threshold.label}
        </span>
      )}
      {hasThreshold && threshold.sublabel && (
        <span
          style={{
            ...labelBase,
            left: toLeft(threshX - 8, padding.left),
            top: toTop(chartTop + 20, height),
            transform: 'translate(-100%, -50%)',
            opacity: 0.6,
          }}
        >
          {threshold.sublabel}
        </span>
      )}

      {/* Endpoint label */}
      {endpointLabel && (
        <span
          style={{
            ...labelBase,
            left: toLeft(lastPt.x - 14, padding.left),
            top: toTop(Math.max(10, lastPt.y - 10), height),
            transform: 'translate(-100%, -50%)',
            color: TOKENS.endpoint.color,
            fontWeight: 600,
          }}
        >
          {endpointLabel(lastVal)}
        </span>
      )}
    </div>
  );
}
