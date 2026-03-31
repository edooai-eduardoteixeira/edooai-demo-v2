import { useState, useCallback, useId, useRef, useEffect, useLayoutEffect } from 'react';

/**
 * Reusable chart component that enforces the Vincor design system.
 *
 * All text labels are rendered as HTML (not SVG text) so font sizes
 * are always in CSS pixels — guaranteed 11px regardless of chart
 * dimensions or container width.
 *
 * Supports multi-series via the `series` prop. The legacy `data` prop
 * is normalized into `series` internally so all rendering shares one
 * code path.
 *
 * The SVG handles only visual elements: lines, areas, gradients, dots.
 */

// --- Design tokens (from DESIGN.md) ---
const TOKENS = {
  line: { color: 'var(--color-brand)', width: 2 },
  axis: { fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-family)' },
  gridline: { color: 'var(--border-light)', dash: '4,4', opacity: 0.45 },
  endpoint: { radius: 3.5, color: 'var(--color-brand)' },
  tooltip: {
    bg: 'var(--text-primary)',
    text: 'white',
    fontSize: 11,
    fontWeight: 600,
    radius: 8,
    dotRadius: 4,
    dotFill: 'white',
    dotStroke: 'var(--color-brand)',
    dotStrokeWidth: 2,
    crosshairColor: 'var(--color-gray-300)',
    crosshairDash: '3,3',
    shadow: { dx: 0, dy: 2, blur: 8, opacity: 0.18 },
  },
  title: { fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'var(--font-family)' },
  preLine: { color: '#A89E94', dash: '6,4', opacity: 0.6, width: 2 },
  thresholdLine: { color: '#A89E94', dash: '4,4', opacity: 0.6 },
  thresholdLabel: { fontSize: 11, fontFamily: 'var(--font-family)' },
  annotation: { color: 'var(--color-brand)', radius: 2.5, outerRadius: 6, outerOpacity: 0.15 },
  marker: { color: 'var(--color-foreground-faint)', width: 1, dash: '2,3', opacity: 0.4 },
};

const DEFAULT_PADDING = { top: 10, right: 20, bottom: 40, left: 28 };
const DEFAULT_HEIGHT = 210;
const VIEWBOX_WIDTH = 828;
const DEFAULT_GRIDLINE_COUNT = 2;

// --- Monotone cubic interpolation (Fritsch-Carlson) ---
function buildMonotonePath(points) {
  if (points.length < 2) return points.length === 1 ? `M${points[0].x},${points[0].y}` : '';
  if (points.length === 2) return `M${points[0].x},${points[0].y}L${points[1].x},${points[1].y}`;

  const n = points.length;
  const dx = [];
  const dy = [];
  const m = [];

  for (let i = 0; i < n - 1; i++) {
    dx.push(points[i + 1].x - points[i].x);
    dy.push(points[i + 1].y - points[i].y);
    m.push(dy[i] / dx[i]);
  }

  const tangents = [m[0]];
  for (let i = 1; i < n - 1; i++) {
    if (m[i - 1] * m[i] <= 0) {
      tangents.push(0);
    } else {
      tangents.push(3 * (dx[i - 1] + dx[i]) / ((2 * dx[i] + dx[i - 1]) / m[i - 1] + (dx[i] + 2 * dx[i - 1]) / m[i]));
    }
  }
  tangents.push(m[n - 2]);

  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < n - 1; i++) {
    const cp1x = points[i].x + dx[i] / 3;
    const cp1y = points[i].y + tangents[i] * dx[i] / 3;
    const cp2x = points[i + 1].x - dx[i] / 3;
    const cp2y = points[i + 1].y - tangents[i + 1] * dx[i] / 3;
    d += `C${cp1x},${cp1y},${cp2x},${cp2y},${points[i + 1].x},${points[i + 1].y}`;
  }
  return d;
}

function computePoints(data, chartLeft, chartTop, chartW, chartH, maxVal) {
  return data.map((v, i) => ({
    x: chartLeft + (i / Math.max(data.length - 1, 1)) * chartW,
    y: chartTop + chartH - (v / maxVal) * chartH,
  }));
}

function buildAreaPath(curveD, lastX, firstX, bottom) {
  return `${curveD}L${lastX},${bottom}L${firstX},${bottom}Z`;
}

function formatCompact(val) {
  const rounded = Math.round(val);
  if (rounded >= 1000) {
    const k = rounded / 1000;
    return k % 1 === 0 ? `${k}k` : `${k.toFixed(1)}k`;
  }
  return String(rounded);
}

function resolveXLabels(xLabels, dataLen, chartLeft, chartW) {
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
    x: chartLeft + ((item.at - 1) / Math.max(dataLen - 1, 1)) * chartW,
    anchor: 'middle',
  }));
}

function toLeft(svgX, padLeft) {
  return `${((svgX + padLeft) / VIEWBOX_WIDTH) * 100}%`;
}
function toTop(svgY, h) {
  return `${(svgY / h) * 100}%`;
}

const labelBase = {
  position: 'absolute',
  fontSize: TOKENS.axis.fontSize,
  fontFamily: 'var(--font-family)',
  color: TOKENS.axis.color,
  lineHeight: 1,
  whiteSpace: 'nowrap',
  pointerEvents: 'none',
  fontVariantNumeric: 'tabular-nums',
};

const anchorTransform = {
  start: 'translateY(-50%)',
  end: 'translate(-100%, -50%)',
  middle: 'translate(-50%, -50%)',
};

export default function Chart({
  data,
  series: seriesProp,
  title,
  height: heightProp = DEFAULT_HEIGHT,
  cssHeight,
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
  annotations,
  marker,
  legend,
}) {
  const [hoveredDay, setHoveredDay] = useState(null);
  const [animated, setAnimated] = useState(false);
  const [containerDims, setContainerDims] = useState(null);
  const containerRef = useRef(null);
  const chartAreaRef = useRef(null);
  const svgRef = useRef(null);
  const uid = useId();
  const safeId = uid.replace(/:/g, '_');

  // Measure the chart area (inner div) when cssHeight is used
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

  // Compute viewBox height: match container aspect ratio when cssHeight is set
  const height = (cssHeight && containerDims)
    ? containerDims.height / containerDims.width * VIEWBOX_WIDTH
    : heightProp;

  // --- Normalize data/series into a single series array ---
  const series = seriesProp
    ? seriesProp
    : data
      ? [{ data, color: TOKENS.line.color, width: TOKENS.line.width, dashed, label: undefined, opacity: 1 }]
      : [{ data: [], color: TOKENS.line.color, width: TOKENS.line.width, label: undefined, opacity: 1 }];

  const primaryData = series[0]?.data || [];
  const primaryLen = primaryData.length;

  // Entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const padding = { ...DEFAULT_PADDING, ...paddingProp };
  if (title) padding.top = Math.max(padding.top, 30);

  const chartLeft = 0;
  const chartTop = padding.top;
  const chartW = VIEWBOX_WIDTH - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const chartBottom = chartTop + chartH;

  // Auto-compute maxValue from ALL series
  const maxVal = maxValue != null
    ? maxValue
    : Math.max(...series.flatMap((s) => s.data || []), 0) * 1.08;

  // Compute points and paths for every series
  const allSeriesPoints = series.map((s) =>
    computePoints(s.data || [], chartLeft, chartTop, chartW, chartH, maxVal),
  );
  const allSeriesPaths = allSeriesPoints.map((pts) => buildMonotonePath(pts));

  const primaryPoints = allSeriesPoints[0] || [];
  const primaryPathD = allSeriesPaths[0] || '';
  const lastPt = primaryPoints[primaryPoints.length - 1];
  const lastVal = primaryData[primaryData.length - 1];

  const hasThreshold = threshold && threshold.at != null;
  const threshX = hasThreshold
    ? chartLeft + (threshold.at / Math.max(primaryLen - 1, 1)) * chartW
    : null;

  const resolvedXLabels = resolveXLabels(xLabels, primaryLen, chartLeft, chartW);

  // Filter x-labels to only those within the primary data range
  const clampedXLabels = resolvedXLabels.filter((item) => {
    return item.x >= chartLeft && item.x <= chartLeft + chartW;
  });

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
  const pathLen = chartW * 1.2;

  // Marker
  const hasMarker = marker && marker.at != null;
  const markerX = hasMarker
    ? chartLeft + (marker.at / Math.max(primaryLen - 1, 1)) * chartW
    : null;

  // Hover handler — computes values for ALL series at hovered index
  const handleMouseMove = useCallback(
    (e) => {
      if (!tooltip) return;
      const svg = e.currentTarget.closest('svg');
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
      const idx = Math.round(((svgP.x - chartLeft) / chartW) * (primaryLen - 1));
      const clamped = Math.max(0, Math.min(primaryLen - 1, idx));

      const seriesValues = series.map((s, si) => ({
        value: (s.data || [])[clamped],
        color: s.color || TOKENS.line.color,
        label: s.label,
        y: allSeriesPoints[si]?.[clamped]?.y,
      }));

      setHoveredDay({
        index: clamped,
        value: primaryData[clamped],
        x: primaryPoints[clamped].x,
        y: primaryPoints[clamped].y,
        seriesValues,
      });
    },
    [tooltip, chartLeft, chartW, primaryData, primaryPoints, series, allSeriesPoints, primaryLen],
  );

  const handleMouseLeave = useCallback(() => setHoveredDay(null), []);

  return (
    <div
      ref={containerRef}
      style={{
        ...(cssHeight ? { height: cssHeight, display: 'flex', flexDirection: 'column' } : {}),
      }}
    >
      {/* Legend (HTML — normal flow, above chart) */}
      {legend && series.length > 1 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px 16px',
            marginBottom: 6,
            justifyContent: 'flex-end',
          }}
        >
          {series.map((s, i) => (
            s.label ? (
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
                    backgroundColor: s.color || TOKENS.line.color,
                    flexShrink: 0,
                  }}
                />
                {s.label}
              </span>
            ) : null
          ))}
        </div>
      )}

      {/* Chart area — flex:1 when cssHeight is set so SVG takes remaining space after legend */}
      <div ref={chartAreaRef} style={cssHeight ? { flex: 1, minHeight: 0, position: 'relative' } : { position: 'relative' }}>
        <svg
          ref={svgRef}
          viewBox={viewBox}
          preserveAspectRatio="xMidYMid meet"
          style={{ width: '100%', height: cssHeight ? '100%' : 'auto', display: 'block' }}
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
              opacity={TOKENS.gridline.opacity}
            />
          ))}

          {/* Area fills (primary series only) */}
          {hasThreshold && threshold.preFill && primaryPoints.length >= 2 && (
            <path
              d={buildAreaPath(primaryPathD, lastPt.x, primaryPoints[0].x, chartBottom)}
              fill={`url(#${safeId}-preFill)`}
              clipPath={`url(#${safeId}-clipPre)`}
              style={{ opacity: animated ? 1 : 0, transition: 'opacity 300ms ease-out' }}
            />
          )}
          {hasThreshold && fill && primaryPoints.length >= 2 && (
            <path
              d={buildAreaPath(primaryPathD, lastPt.x, primaryPoints[0].x, chartBottom)}
              fill={`url(#${safeId}-areaFill)`}
              clipPath={`url(#${safeId}-clipPost)`}
              style={{ opacity: animated ? 1 : 0, transition: 'opacity 300ms ease-out' }}
            />
          )}
          {!hasThreshold && fill && primaryPoints.length >= 2 && (
            <path
              d={buildAreaPath(primaryPathD, lastPt.x, primaryPoints[0].x, chartBottom)}
              fill={`url(#${safeId}-areaFill)`}
              style={{ opacity: animated ? 1 : 0, transition: 'opacity 300ms ease-out' }}
            />
          )}

          {/* Secondary series lines (rendered before primary so primary sits on top) */}
          {series.slice(1).map((s, si) => {
            const idx = si + 1;
            const pts = allSeriesPoints[idx];
            const pathD = allSeriesPaths[idx];
            if (!pts || pts.length < 2) return null;
            return (
              <path
                key={`series-${idx}`}
                d={pathD}
                fill="none"
                stroke={s.color || TOKENS.line.color}
                strokeWidth={s.width || TOKENS.line.width}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={s.dotted ? '2,3' : s.dashed ? '6,4' : undefined}
                opacity={s.opacity ?? 1}
                style={{ opacity: animated ? (s.opacity ?? 1) : 0, transition: 'opacity 500ms ease-out' }}
              />
            );
          })}

          {/* Primary series line with draw animation */}
          {primaryPoints.length >= 2 && (
            hasThreshold ? (
              <g style={{ opacity: animated ? 1 : 0, transition: 'opacity 500ms ease-out' }}>
                <path
                  d={primaryPathD} fill="none"
                  stroke={threshold.preStyle?.color || TOKENS.preLine.color}
                  strokeWidth={threshold.preStyle?.width || TOKENS.preLine.width}
                  strokeLinecap="round" strokeLinejoin="round"
                  strokeDasharray={threshold.preStyle?.dashed !== false ? (threshold.preStyle?.dash || TOKENS.preLine.dash) : undefined}
                  opacity={threshold.preStyle?.opacity ?? TOKENS.preLine.opacity}
                  clipPath={`url(#${safeId}-clipPre)`}
                />
                <path
                  d={primaryPathD} fill="none"
                  stroke={threshold.strokeGradient ? `url(#${safeId}-strokeGrad)` : (series[0]?.color || TOKENS.line.color)}
                  strokeWidth={series[0]?.width || TOKENS.line.width}
                  strokeLinecap="round" strokeLinejoin="round"
                  clipPath={`url(#${safeId}-clipPost)`}
                />
              </g>
            ) : (
              <path
                d={primaryPathD} fill="none"
                stroke={series[0]?.color || TOKENS.line.color}
                strokeWidth={series[0]?.width || TOKENS.line.width}
                strokeLinecap="round" strokeLinejoin="round"
                strokeDasharray={series[0]?.dashed ? '6,4' : (animated ? 'none' : `${pathLen}`)}
                strokeDashoffset={animated ? 0 : pathLen}
                style={{ transition: animated ? 'stroke-dashoffset 600ms ease-out' : 'none' }}
              />
            )
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

          {/* Marker vertical dashed line */}
          {hasMarker && (
            <line
              x1={markerX} y1={chartTop} x2={markerX} y2={chartBottom}
              stroke={TOKENS.marker.color}
              strokeWidth={TOKENS.marker.width}
              strokeDasharray={TOKENS.marker.dash}
              opacity={TOKENS.marker.opacity}
            />
          )}

          {/* Annotations on primary series */}
          {annotations && annotations.map((ann, i) => {
            const ai = ann.at;
            if (ai < 0 || ai >= primaryPoints.length) return null;
            const pt = primaryPoints[ai];
            return (
              <g key={`ann-${i}`}>
                <circle cx={pt.x} cy={pt.y} r={TOKENS.annotation.outerRadius}
                  fill={TOKENS.annotation.color} opacity={TOKENS.annotation.outerOpacity} />
                <circle cx={pt.x} cy={pt.y} r={TOKENS.annotation.radius}
                  fill={TOKENS.annotation.color} />
              </g>
            );
          })}

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

          {/* Tooltip visuals (SVG: crosshair + hover dots) */}
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
                fill={TOKENS.tooltip.dotFill}
                stroke={TOKENS.tooltip.dotStroke}
                strokeWidth={TOKENS.tooltip.dotStrokeWidth}
              />
            </>
          )}

          {/* Endpoint dot (primary series only) */}
          {lastPt && (
            <circle
              cx={lastPt.x} cy={lastPt.y}
              r={TOKENS.endpoint.radius} fill={TOKENS.endpoint.color}
              style={{ opacity: animated ? 1 : 0, transition: 'opacity 200ms ease-out 400ms' }}
            />
          )}
        </svg>

        {/* ── HTML labels: always 11px CSS pixels ── */}

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
            {formatCompact(item.val)}
          </span>
        ))}

        {/* X-axis labels */}
        {clampedXLabels.map((item, i) => (
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
        {endpointLabel && lastPt && (
          <span
            style={{
              ...labelBase,
              left: toLeft(lastPt.x - 14, padding.left),
              top: toTop(Math.max(10, lastPt.y - 10), height),
              transform: 'translate(-100%, -50%)',
              color: TOKENS.endpoint.color,
              fontWeight: 600,
              opacity: animated ? 1 : 0,
              transition: 'opacity 200ms ease-out 400ms',
            }}
          >
            {endpointLabel(lastVal)}
          </span>
        )}

        {/* Tooltip label (HTML — multi-series aware) */}
        {hoveredDay && (() => {
          const hasMultipleSeries = series.length > 1;
          const tooltipAboveY = hoveredDay.y - (hasMultipleSeries ? 20 + series.length * 18 : 28);
          const tooltipBelowY = hoveredDay.y + 18;
          const flipBelow = tooltipAboveY < chartTop - 5;
          const tipY = flipBelow ? tooltipBelowY : tooltipAboveY;

          const tooltipContent = hasMultipleSeries ? hoveredDay.seriesValues : null;
          const tooltipText = !hasMultipleSeries
            ? (formatTooltip ? formatTooltip(hoveredDay.index, hoveredDay.value) : `${hoveredDay.value}`)
            : null;

          return (
            <span
              style={{
                position: 'absolute',
                left: toLeft(hoveredDay.x, padding.left),
                top: toTop(tipY, height),
                transform: 'translate(-50%, -50%)',
                fontSize: TOKENS.tooltip.fontSize,
                fontWeight: TOKENS.tooltip.fontWeight,
                fontFamily: 'var(--font-family)',
                color: TOKENS.tooltip.text,
                background: TOKENS.tooltip.bg,
                borderRadius: TOKENS.tooltip.radius,
                padding: hasMultipleSeries ? '6px 10px' : '4px 10px',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                boxShadow: `${TOKENS.tooltip.shadow.dx}px ${TOKENS.tooltip.shadow.dy}px ${TOKENS.tooltip.shadow.blur}px rgba(0,0,0,${TOKENS.tooltip.shadow.opacity})`,
                lineHeight: 1,
                display: hasMultipleSeries ? 'flex' : undefined,
                flexDirection: hasMultipleSeries ? 'column' : undefined,
                gap: hasMultipleSeries ? 4 : undefined,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {hasMultipleSeries
                ? tooltipContent.map((sv, si) => {
                  const displayVal = formatTooltip
                    ? formatTooltip(hoveredDay.index, sv.value)
                    : sv.value != null ? `${sv.value}` : '—';
                  return (
                    <span
                      key={si}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        lineHeight: 1.3,
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: sv.color,
                          flexShrink: 0,
                        }}
                      />
                      <span>{sv.label ? `${sv.label}: ` : ''}{displayVal}</span>
                    </span>
                  );
                })
                : tooltipText}
            </span>
          );
        })()}
      </div>
    </div>
  );
}
