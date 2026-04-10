import { useState, useCallback, useId, useRef, useEffect, useLayoutEffect } from 'react';
import {
  TOKENS, CHART_MARGIN, DEFAULT_HEIGHT, VIEWBOX_WIDTH,
  buildMonotonePath, computePoints, buildAreaPath, formatCompact,
  resolveXLabels, labelBase, anchorTransform,
} from './chartUtils.js';

/**
 * Reusable chart component that enforces the Vincor design system.
 *
 * All text labels are rendered as HTML (not SVG text) so font sizes
 * are always in CSS pixels — guaranteed 11px regardless of chart
 * dimensions or container width.
 *
 * Label positioning uses fixed CSS pixels (D3 margin convention):
 * - CHART_MARGIN creates padding zones around the SVG for axis labels
 * - SVG viewBox starts at 0,0 — data fills the entire SVG element
 * - Labels are absolutely positioned in the CSS padding zones
 * - Pixel positions derived from measured SVG width (uniform scaling)
 *
 * Supports multi-series via the `series` prop. The legacy `data` prop
 * is normalized into `series` internally so all rendering shares one
 * code path.
 *
 * The SVG handles only visual elements: lines, areas, gradients, dots.
 */

const DEFAULT_GRIDLINE_COUNT = 2;

export default function Chart({
  data,
  series: seriesProp,
  title,
  height: heightProp = DEFAULT_HEIGHT,
  cssHeight,
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
  const [svgDims, setSvgDims] = useState(null);
  const containerRef = useRef(null);
  const chartAreaRef = useRef(null);
  const svgRef = useRef(null);
  const uid = useId();
  const safeId = uid.replace(/:/g, '_');

  // Measure the SVG content area (chart area div's content box = SVG pixel size)
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

  // Compute viewBox height: match container aspect ratio when cssHeight is set
  const viewBoxH = (cssHeight && svgDims)
    ? svgDims.height / svgDims.width * VIEWBOX_WIDTH
    : heightProp;

  // Scale factor: SVG px per viewBox unit (uniform scaling with "meet")
  const pxPerUnit = svgDims ? svgDims.width / VIEWBOX_WIDTH : 0;

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

  // Data fills the entire SVG viewBox — padding is CSS-level
  const chartLeft = 0;
  const chartTop = 0;
  const chartW = VIEWBOX_WIDTH;
  const chartH = viewBoxH;
  const chartBottom = viewBoxH;

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

  const viewBox = `0 0 ${VIEWBOX_WIDTH} ${viewBoxH}`;
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

  // Chart area style: CSS padding creates label zones around the SVG
  const chartAreaStyle = {
    position: 'relative',
    paddingLeft: CHART_MARGIN.left,
    paddingRight: CHART_MARGIN.right,
    paddingTop: title ? Math.max(CHART_MARGIN.top, 30) : CHART_MARGIN.top,
    paddingBottom: CHART_MARGIN.bottom,
    ...(cssHeight ? { flex: 1, minHeight: 0 } : {}),
  };

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

      {/* Chart area — CSS padding creates axis label zones, SVG fills content area */}
      <div ref={chartAreaRef} style={chartAreaStyle}>
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
                  <rect x={chartLeft} y="0" width={threshX - chartLeft} height={viewBoxH} />
                </clipPath>
                <clipPath id={`${safeId}-clipPost`}>
                  <rect x={threshX} y="0" width={chartLeft + chartW - threshX} height={viewBoxH} />
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
                strokeDasharray={series[0]?.dashed ? '6,4' : `${pathLen}`}
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

        {/* ── HTML labels: fixed pixel positioning (D3 margin convention) ── */}

        {/* Y-axis labels — in the left padding zone */}
        {yLabelItems.map((item, i) => (
          <span
            key={`y-${i}`}
            style={{
              ...labelBase,
              left: CHART_MARGIN.left - 8,
              top: CHART_MARGIN.top + item.y * pxPerUnit,
              transform: 'translate(-100%, -50%)',
            }}
          >
            {formatCompact(item.val)}
          </span>
        ))}

        {/* X-axis labels — in the bottom padding zone */}
        {clampedXLabels.map((item, i) => (
          <span
            key={`x-${i}`}
            style={{
              ...labelBase,
              left: CHART_MARGIN.left + item.x * pxPerUnit,
              bottom: 5,
              transform: item.anchor === 'end' ? 'translateX(-100%)' : item.anchor === 'middle' ? 'translateX(-50%)' : 'none',
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
              left: CHART_MARGIN.left + (threshX - 8) * pxPerUnit,
              top: CHART_MARGIN.top + (chartTop + 8) * pxPerUnit,
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
              left: CHART_MARGIN.left + (threshX - 8) * pxPerUnit,
              top: CHART_MARGIN.top + (chartTop + 20) * pxPerUnit,
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
              left: CHART_MARGIN.left + (lastPt.x - 14) * pxPerUnit,
              top: CHART_MARGIN.top + Math.max(10, lastPt.y - 10) * pxPerUnit,
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
                left: CHART_MARGIN.left + hoveredDay.x * pxPerUnit,
                top: CHART_MARGIN.top + tipY * pxPerUnit,
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
