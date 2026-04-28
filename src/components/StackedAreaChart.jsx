import { useState, useRef, useEffect, useLayoutEffect, useCallback, useId } from 'react';
import {
  TOKENS, CHART_MARGIN, VIEWBOX_WIDTH,
  buildMonotonePath, formatCompact, labelBase,
} from './chartUtils.js';

/**
 * Stacked area chart — renders bands between monotone cubic curves.
 *
 * Used for Customer Lifecycle (Graph 1, Block 2).
 * All text rendered as HTML with fixed pixel positioning (D3 margin convention).
 */

const BAND_STAGGER_MS = 50;
const FADE_DURATION_MS = 300;

export default function StackedAreaChart({
  bands,
  maxValue,
  cssHeight,
  xLabels,
  legend,
  formatTooltip,
  overlayLine,       // { data: [], color: '', label: '', maxValue: number } — dual Y-axis line
  axisWidth,         // S6 Item 5: fixed-width axis (= dateRange) so warmup days don't stretch
  continuousFraction = 1, // S6 Item 5 v2: slide last point's x continuously across day boundaries
}) {
  const [hoveredDay, setHoveredDay] = useState(null);
  const [animated, setAnimated] = useState(false);
  const [svgDims, setSvgDims] = useState(null);
  const chartAreaRef = useRef(null);
  const uid = useId();
  const safeId = uid.replace(/:/g, '_');

  // Entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 50);
    return () => clearTimeout(timer);
  }, []);

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

  const dataLen = bands[0]?.data?.length || 0;
  // axisWidth (S6 Item 5): when provided, x-positions span the fixed axis
  // width; data fills leftmost slots. Falls back to dataLen when not set.
  const axisDenom = Math.max((axisWidth || dataLen) - 1, 1);

  // Compute viewBox height based on container aspect ratio
  const viewBoxH = (cssHeight && svgDims)
    ? svgDims.height / svgDims.width * VIEWBOX_WIDTH
    : 210;

  const pxPerUnit = svgDims ? svgDims.width / VIEWBOX_WIDTH : 0;

  // Data fills entire SVG — padding is CSS-level
  const chartLeft = 0;
  const chartTop = 0;
  const chartW = VIEWBOX_WIDTH;
  const chartH = viewBoxH;
  const chartBottom = viewBoxH;

  // Auto-compute max from total stack if not provided
  const maxVal = maxValue != null
    ? maxValue
    : Math.max(
        ...Array.from({ length: dataLen }, (_, i) =>
          bands.reduce((sum, b) => sum + (b.data[i] || 0), 0)
        ),
        1
      ) * 1.05;

  // Compute cumulative sums bottom-to-top
  // bands[0] is bottom, bands[last] is top
  const cumulatives = [];
  for (let bi = 0; bi < bands.length; bi++) {
    const cum = new Array(dataLen);
    for (let i = 0; i < dataLen; i++) {
      const prev = bi > 0 ? cumulatives[bi - 1][i] : 0;
      cum[i] = prev + (bands[bi].data[i] || 0);
    }
    cumulatives.push(cum);
  }

  // Convert cumulative values to SVG points. axisDenom honors axisWidth;
  // continuousFraction slides the last point's x smoothly across day boundaries
  // so the area extends continuously instead of jumping by 1 slot per day.
  function toSvgPoints(values) {
    const len = values.length;
    return values.map((v, i) => {
      let x;
      if (i === len - 1 && len >= 2 && continuousFraction < 1) {
        x = chartLeft + ((i - 1 + continuousFraction) / axisDenom) * chartW;
      } else {
        x = chartLeft + (i / axisDenom) * chartW;
      }
      return { x, y: chartTop + chartH - (v / maxVal) * chartH };
    });
  }

  // Build area paths for each band
  const bandPaths = bands.map((band, bi) => {
    const topPoints = toSvgPoints(cumulatives[bi]);
    const bottomPoints = bi > 0 ? toSvgPoints(cumulatives[bi - 1]) : toSvgPoints(new Array(dataLen).fill(0));

    const topPath = buildMonotonePath(topPoints);
    const bottomReversed = [...bottomPoints].reverse();
    const bottomPath = buildMonotonePath(bottomReversed);

    // Combine: top curve forward, then bottom curve reversed
    const areaPath = topPath + 'L' + bottomReversed[0].x + ',' + bottomReversed[0].y +
      bottomPath.slice(bottomPath.indexOf('M') + 1 + `${bottomReversed[0].x},${bottomReversed[0].y}`.length) + 'Z';

    return areaPath;
  });

  // Overlay line — separate Y-axis scale (dual-axis chart)
  const hasOverlay = overlayLine && overlayLine.data && overlayLine.data.length === dataLen;
  const overlayMax = overlayLine?.maxValue || (hasOverlay ? Math.max(...overlayLine.data, 1) * 1.1 : 1);
  let overlayPath = '';
  if (hasOverlay) {
    const olen = overlayLine.data.length;
    const pts = overlayLine.data.map((v, i) => {
      let x;
      if (i === olen - 1 && olen >= 2 && continuousFraction < 1) {
        x = chartLeft + ((i - 1 + continuousFraction) / axisDenom) * chartW;
      } else {
        x = chartLeft + (i / axisDenom) * chartW;
      }
      return { x, y: chartTop + chartH - (v / overlayMax) * chartH };
    });
    overlayPath = buildMonotonePath(pts);
  }

  // X labels (axisDenom honors axisWidth for fixed-axis warmup behavior)
  const resolvedXLabels = xLabels
    ? xLabels.map((item) => ({
        label: String(item.value),
        x: chartLeft + ((item.at - 1) / axisDenom) * chartW,
        anchor: 'middle',
      }))
    : [];

  // Y labels: mid and max (no 0 — matches hero chart pattern)
  const midVal = Math.round(maxVal * 0.5);
  const yLabelItems = [
    { val: midVal, y: chartTop + chartH * 0.5 },
    { val: Math.round(maxVal), y: chartTop },
  ];

  // Gridlines
  const gridlineY = chartTop + chartH * 0.5;

  // Hover handler
  const handleMouseMove = useCallback(
    (e) => {
      const svg = e.currentTarget.closest('svg');
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
      const idx = Math.round(((svgP.x - chartLeft) / chartW) * (dataLen - 1));
      const clamped = Math.max(0, Math.min(dataLen - 1, idx));

      const values = bands.map((b, bi) => ({
        label: b.label,
        color: b.color,
        value: b.data[clamped] || 0,
      }));

      const x = chartLeft + (clamped / Math.max(dataLen - 1, 1)) * chartW;
      setHoveredDay({ index: clamped, x, values });
    },
    [chartLeft, chartW, dataLen, bands],
  );

  const handleMouseLeave = useCallback(() => setHoveredDay(null), []);

  const viewBox = `0 0 ${VIEWBOX_WIDTH} ${viewBoxH}`;

  // Chart area style: CSS padding creates label zones
  const chartAreaStyle = {
    position: 'relative',
    paddingLeft: CHART_MARGIN.left,
    paddingRight: hasOverlay ? CHART_MARGIN.left : CHART_MARGIN.right,
    paddingTop: CHART_MARGIN.top,
    paddingBottom: CHART_MARGIN.bottom,
    ...(cssHeight ? { flex: 1, minHeight: 0 } : {}),
  };

  return (
    <div style={cssHeight ? { height: cssHeight, display: 'flex', flexDirection: 'column' } : {}}>
      {/* Legend */}
      {legend && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px 16px',
            marginBottom: 6,
            justifyContent: 'flex-end',
          }}
        >
          {[...bands].reverse().map((b, i) => (
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
                  backgroundColor: b.color,
                  opacity: b.opacity || 1,
                  flexShrink: 0,
                }}
              />
              {b.label}
            </span>
          ))}
          {hasOverlay && overlayLine.label && (
            <span
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
                  width: 10,
                  height: 0,
                  borderTop: `2px solid ${overlayLine.color || 'var(--color-brand)'}`,
                  flexShrink: 0,
                }}
              />
              {overlayLine.label}
            </span>
          )}
        </div>
      )}

      {/* Chart area — CSS padding creates axis label zones */}
      <div ref={chartAreaRef} style={chartAreaStyle}>
        <svg
          viewBox={viewBox}
          preserveAspectRatio="xMidYMid meet"
          style={{ width: '100%', height: cssHeight ? '100%' : 'auto', display: 'block' }}
        >
          {/* Gridline */}
          <line
            x1={chartLeft} y1={gridlineY}
            x2={chartLeft + chartW} y2={gridlineY}
            stroke={TOKENS.gridline.color} strokeWidth="1"
            strokeDasharray={TOKENS.gridline.dash}
            opacity={TOKENS.gridline.opacity}
          />

          {/* Stacked area bands */}
          {bands.map((band, bi) => (
            <path
              key={bi}
              d={bandPaths[bi]}
              fill={band.color}
              opacity={animated ? (band.opacity || 0.7) : 0}
              style={{
                transition: `opacity ${FADE_DURATION_MS}ms ease-out ${bi * BAND_STAGGER_MS}ms`,
              }}
            />
          ))}

          {/* Overlay line — dual Y-axis (right side) */}
          {hasOverlay && (
            <path
              d={overlayPath}
              fill="none"
              stroke={overlayLine.color || 'var(--color-brand)'}
              strokeWidth="2"
              opacity={animated ? 1 : 0}
              style={{
                transition: `opacity ${FADE_DURATION_MS}ms ease-out ${bands.length * BAND_STAGGER_MS}ms`,
              }}
            />
          )}

          {/* Hover overlay */}
          <rect
            x={chartLeft} y={chartTop}
            width={chartW} height={chartH}
            fill="transparent" style={{ cursor: 'crosshair' }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          />

          {/* Crosshair */}
          {hoveredDay && (
            <line
              x1={hoveredDay.x} y1={chartTop}
              x2={hoveredDay.x} y2={chartBottom}
              stroke={TOKENS.tooltip.crosshairColor} strokeWidth="1"
              strokeDasharray={TOKENS.tooltip.crosshairDash}
            />
          )}
        </svg>

        {/* Y-axis labels (HTML — fixed pixel positioning) */}
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

        {/* X-axis labels (HTML — fixed pixel positioning) */}
        {resolvedXLabels.map((item, i) => (
          <span
            key={`x-${i}`}
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

        {/* Right Y-axis labels for overlay line (dual axis) */}
        {hasOverlay && (() => {
          const midVal = Math.round(overlayMax * 0.5);
          const items = [
            { val: midVal, y: chartTop + chartH * 0.5 },
            { val: Math.round(overlayMax), y: chartTop },
          ];
          const fmt = overlayLine.formatLabel || ((v) => `${v}%`);
          return items.map((item, i) => (
            <span
              key={`yr-${i}`}
              style={{
                ...labelBase,
                right: 0,
                top: CHART_MARGIN.top + item.y * pxPerUnit,
                transform: 'translateY(-50%)',
              }}
            >
              {fmt(item.val)}
            </span>
          ));
        })()}

        {/* Tooltip (HTML) */}
        {hoveredDay && (() => {
          const tipY = chartTop + 10;

          return (
            <span
              style={{
                position: 'absolute',
                left: CHART_MARGIN.left + hoveredDay.x * pxPerUnit,
                top: CHART_MARGIN.top + tipY * pxPerUnit,
                transform: 'translate(-50%, 0)',
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
                lineHeight: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                fontVariantNumeric: 'tabular-nums',
                zIndex: 10,
              }}
            >
              {[...hoveredDay.values].reverse().map((sv, si) => (
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
                  <span>
                    {sv.label}: {formatTooltip ? formatTooltip(hoveredDay.index, sv.value) : formatCompact(sv.value)}
                  </span>
                </span>
              ))}
            </span>
          );
        })()}
      </div>
    </div>
  );
}
