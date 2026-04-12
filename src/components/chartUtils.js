/**
 * Shared chart utilities — constants, monotone interpolation, layout helpers.
 *
 * Consumers: Chart.jsx, StackedBarChart.jsx, StackedAreaChart.jsx, CohortBar.jsx
 */

// --- Design tokens (from DESIGN.md) ---
export const TOKENS = {
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

// Fixed-pixel margins for axis label zones (on 4px grid, CSS pixels).
// Applied as CSS padding on the chart wrapper div — NOT as SVG viewBox padding.
// This is the D3 margin convention: labels live outside the data area.
export const CHART_MARGIN = { top: 8, right: 8, bottom: 24, left: 36 };
export const LEGEND_HEIGHT = 24;
export const DEFAULT_HEIGHT = 210;
export const VIEWBOX_WIDTH = 828;
export const BAR_RADIUS_PX = 6; // rounded-sm (6px) — convert to viewBox units via pxPerUnit

// --- Monotone cubic interpolation (Fritsch-Carlson) ---
export function buildMonotonePath(points) {
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

export function computePoints(data, chartLeft, chartTop, chartW, chartH, maxVal) {
  return data.map((v, i) => ({
    x: chartLeft + (i / Math.max(data.length - 1, 1)) * chartW,
    y: chartTop + chartH - (v / maxVal) * chartH,
  }));
}

export function buildAreaPath(curveD, lastX, firstX, bottom) {
  return `${curveD}L${lastX},${bottom}L${firstX},${bottom}Z`;
}

export function formatCompact(val) {
  const rounded = Math.round(val);
  if (rounded >= 1000) {
    const k = Math.round(rounded / 1000);
    return `${k}k`;
  }
  return String(rounded);
}

/**
 * Compute a "nice" Y-axis ceiling for a given max value.
 * Returns a clean round number ≥ maxVal that produces readable mid-ticks.
 * Works for any scale: single digits, hundreds, thousands, millions.
 */
export function niceYMax(maxVal) {
  if (maxVal <= 0) return 10;
  // Find the order of magnitude, then round up to a nice multiple
  const magnitude = Math.pow(10, Math.floor(Math.log10(maxVal)));
  const normalized = maxVal / magnitude; // 1.0 – 9.99
  // Pick the next nice number: 1, 2, 5, 10
  let nice;
  if (normalized <= 1) nice = 1;
  else if (normalized <= 2) nice = 2;
  else if (normalized <= 5) nice = 5;
  else nice = 10;
  return nice * magnitude;
}

/**
 * Generate X-axis day ticks appropriate for the data length.
 * Returns an array of day numbers (1-indexed) with ~3-4 evenly spaced ticks.
 */
export function dayXTicks(dataLen) {
  if (dataLen <= 1) return [1];
  if (dataLen <= 3) return [1, dataLen];
  if (dataLen <= 7) return [1, Math.round(dataLen / 2), dataLen];
  if (dataLen <= 15) return [1, Math.round(dataLen / 2), dataLen];
  // 16+ days: ticks at 1, then every ~10 days, ending at dataLen
  const step = dataLen <= 35 ? 10 : 20;
  const ticks = [1];
  for (let d = step; d < dataLen; d += step) ticks.push(d);
  ticks.push(dataLen);
  return ticks;
}

export function resolveXLabels(xLabels, dataLen, chartLeft, chartW) {
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

export const labelBase = {
  position: 'absolute',
  fontSize: TOKENS.axis.fontSize,
  fontFamily: 'var(--font-family)',
  color: TOKENS.axis.color,
  lineHeight: 1,
  whiteSpace: 'nowrap',
  pointerEvents: 'none',
  fontVariantNumeric: 'tabular-nums',
};

export const anchorTransform = {
  start: 'translateY(-50%)',
  end: 'translate(-100%, -50%)',
  middle: 'translate(-50%, -50%)',
};
