import { useMemo } from 'react';
import { computeProjection } from '../engine/projectionEngine.js';

/**
 * React hook that runs the projection engine for a given budget.
 * Returns all computed values: KPIs, daily curve, threshold, guidance state.
 *
 * @param {Object} engineParams - Engine parameters from config (config.engineParams)
 * @param {number} budget - Current budget value from slider
 * @returns {Object} Projection results
 */
export function useProjections(engineParams, budget) {
  return useMemo(() => {
    if (!engineParams) return null;
    return computeProjection({ budget, params: engineParams });
  }, [engineParams, budget]);
}
