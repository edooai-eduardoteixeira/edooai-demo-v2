import { computeProjection } from '../src/engine/projectionEngine.js';
import config from '../src/config/neobank.js';

function sparkPointsOLD(arr, invert = false) {
  if (!arr || arr.length === 0) return '2,8 38,8';
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  const range = max - min || 1;
  return arr
    .filter((_, i) => i % 5 === 0 || i === arr.length - 1)
    .map((v, i, sampled) => {
      const x = 2 + (i / (sampled.length - 1)) * 36;
      const norm = (v - min) / range;
      const y = invert ? 2 + norm * 12 : 14 - norm * 12;
      return x.toFixed(1) + ',' + y.toFixed(1);
    })
    .join(' ');
}

function sparkPointsNEW(arr, invert = false) {
  if (!arr || arr.length === 0) return '2,8 38,8';

  let start = 0;
  while (start < arr.length && arr[start] === 0) start++;
  const data = arr.slice(start);
  if (data.length < 2) return '2,8 38,8';

  const logs = data.map((v) => Math.log(v + 1));
  const logMin = Math.min(...logs);
  const logMax = Math.max(...logs);
  const logRange = logMax - logMin || 1;

  return data
    .filter((_, i) => i % 5 === 0 || i === data.length - 1)
    .map((v, i, sampled) => {
      const x = 2 + (i / (sampled.length - 1)) * 36;
      const norm = (Math.log(v + 1) - logMin) / logRange;
      const y = invert ? 2 + norm * 12 : 14 - norm * 12;
      return x.toFixed(1) + ',' + y.toFixed(1);
    })
    .join(' ');
}

const { engineParams } = config;

for (const budget of [50000, 150000, 500000]) {
  const proj = computeProjection({ budget, params: engineParams });
  console.log(`\n=== $${budget/1000}K budget ===`);

  for (const [label, curve, inv] of [
    ['CAC', proj.kpiCurves.cac, true],
    ['ROI', proj.kpiCurves.roi, false],
    ['ConvRate', proj.kpiCurves.convRate, false],
    ['FraudSaved', proj.kpiCurves.fraudSaved, false],
  ]) {
    const old = sparkPointsOLD(curve, inv);
    const nw = sparkPointsNEW(curve, inv);
    const changed = old !== nw ? ' *** CHANGED' : '';
    console.log(`${label} OLD: ${old}`);
    console.log(`${label} NEW: ${nw}${changed}`);
  }

  const cum = proj.dailyCurve.reduce((acc, v) => { acc.push((acc.length ? acc[acc.length - 1] : 0) + v); return acc; }, []);
  const old = sparkPointsOLD(cum);
  const nw = sparkPointsNEW(cum);
  const changed = old !== nw ? ' *** CHANGED' : '';
  console.log(`Headline OLD: ${old}`);
  console.log(`Headline NEW: ${nw}${changed}`);
}
