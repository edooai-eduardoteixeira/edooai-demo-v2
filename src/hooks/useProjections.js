import { useMemo } from 'react';

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function useProjections(projections, budget) {
  return useMemo(() => {
    // Find the two nearest data points for interpolation
    const sorted = [...projections].sort((a, b) => a.budget - b.budget);

    // Clamp budget to range
    const min = sorted[0].budget;
    const max = sorted[sorted.length - 1].budget;
    const clampedBudget = Math.max(min, Math.min(max, budget));

    // Exact match
    const exact = sorted.find((p) => p.budget === clampedBudget);
    if (exact) return exact;

    // Find surrounding data points
    let lower = sorted[0];
    let upper = sorted[sorted.length - 1];

    for (let i = 0; i < sorted.length - 1; i++) {
      if (clampedBudget >= sorted[i].budget && clampedBudget <= sorted[i + 1].budget) {
        lower = sorted[i];
        upper = sorted[i + 1];
        break;
      }
    }

    // Interpolate all numeric fields
    const t = (clampedBudget - lower.budget) / (upper.budget - lower.budget);
    const result = { budget: clampedBudget };

    for (const key of Object.keys(lower)) {
      if (key === 'budget') continue;
      if (typeof lower[key] === 'number' && typeof upper[key] === 'number') {
        result[key] = Math.round(lerp(lower[key], upper[key], t));
      }
    }

    return result;
  }, [projections, budget]);
}
