import { computeProjection } from '../src/engine/projectionEngine.js';
import config from '../src/config/neobank.js';

/* ── sparkPoints: must match the version in StrategyBuilderPage.jsx ── */
function sparkPoints(arr, invert = false, bounds = null) {
  if (!arr || arr.length === 0 || !bounds) return '2,8 38,8';
  let start = 0;
  while (start < arr.length && arr[start] === 0) start++;
  const data = arr.slice(start);
  if (data.length < 2) return '2,8 38,8';
  const logMin = Math.log(bounds[0] + 1);
  const logMax = Math.log(bounds[1] + 1);
  const logRange = logMax - logMin || 1;
  return data
    .filter((_, i) => i % 5 === 0 || i === data.length - 1)
    .map((v, i, sampled) => {
      const x = 2 + (i / (sampled.length - 1)) * 36;
      const norm = Math.max(0, Math.min(1, (Math.log(v + 1) - logMin) / logRange));
      const y = invert ? 2 + norm * 12 : 14 - norm * 12;
      return x.toFixed(1) + ',' + y.toFixed(1);
    })
    .join(' ');
}

const { engineParams, budgetSlider } = config;

// Compute global bounds (same as component useMemo)
const lo = computeProjection({ budget: budgetSlider.min, params: engineParams });
const hi = computeProjection({ budget: budgetSlider.max, params: engineParams });
const union = (a, b) => [Math.min(...a, ...b), Math.max(...a, ...b)];
const cumOf = (d) => d.reduce((acc, v) => { acc.push((acc.at(-1) || 0) + v); return acc; }, []);
const refBounds = {
  cac: union(lo.kpiCurves.cac, hi.kpiCurves.cac),
  roi: union(lo.kpiCurves.roi, hi.kpiCurves.roi),
  convRate: union(lo.kpiCurves.convRate, hi.kpiCurves.convRate),
  fraudSaved: union(lo.kpiCurves.fraudSaved, hi.kpiCurves.fraudSaved),
  cumUsers: union(cumOf(lo.dailyCurve), cumOf(hi.dailyCurve)),
};

console.log('Global bounds:', JSON.stringify(refBounds, null, 2));

for (const budget of [50000, 150000, 500000]) {
  const proj = computeProjection({ budget, params: engineParams });
  const cum = proj.dailyCurve.reduce((acc, v) => { acc.push((acc.at(-1) || 0) + v); return acc; }, []);

  console.log(`\n=== $${budget/1000}K ===`);
  console.log('  Headline:', sparkPoints(cum, false, refBounds.cumUsers));
  console.log('  CAC:     ', sparkPoints(proj.kpiCurves.cac, true, refBounds.cac));
  console.log('  ROI:     ', sparkPoints(proj.kpiCurves.roi, false, refBounds.roi));
  console.log('  ConvRate:', sparkPoints(proj.kpiCurves.convRate, false, refBounds.convRate));
  console.log('  Fraud:   ', sparkPoints(proj.kpiCurves.fraudSaved, false, refBounds.fraudSaved));
}
