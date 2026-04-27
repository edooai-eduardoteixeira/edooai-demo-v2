/**
 * capture-snapshot.mjs — captures every visible dashboard number to a JSON fixture.
 *
 * Used as the regression baseline for Stage 1 of the number-consistency plan:
 *   1. Run BEFORE refactoring DashboardPage.jsx → captures pre-refactor truth
 *      (including known bugs like Day 60 clamp, funnel monotonicity violations,
 *      static baseline × 0.7 placeholder).
 *   2. Run AFTER refactoring → diff must be empty. Any difference = behavior change.
 *
 * The snapshot covers:
 *   - All 4 day stops (1, 10, 30, 60)
 *   - Both date ranges (7, 30)
 *   - All 4 KPI selections (activeUsers, cac, roi, fraudSaved) for hero chart
 *
 * Usage:
 *   node scripts/capture-snapshot.mjs > .context/snapshots/SNAPSHOT.json
 *   # diff:
 *   node scripts/capture-snapshot.mjs | diff .context/snapshots/SNAPSHOT.json -
 */

import { computeDashboardProjection } from '../src/engine/projectionEngine.js';
import {
  computeDashboardMetrics,
  computeHeroChartForKPI,
  KPI_KEYS,
} from '../src/lib/metrics.js';
import neobank from '../src/config/neobank.js';

// ─── Fixed inputs for deterministic capture ─────────────────────────────
const BUDGET = 150_000;
const DAY_STOPS = [1, 10, 30, 60];
const DATE_RANGES = [7, 30];
const PARAMS = neobank.engineParams;

// ─── Capture ────────────────────────────────────────────────────────────
const projection = computeDashboardProjection({ budget: BUDGET, params: PARAMS });

const snapshot = {
  meta: {
    budget: BUDGET,
    dayStops: DAY_STOPS,
    dateRanges: DATE_RANGES,
    kpiKeys: KPI_KEYS,
    schemaVersion: 1,
  },
  cells: {},
};

for (const selectedDay of DAY_STOPS) {
  for (const dateRange of DATE_RANGES) {
    const baseKey = `day=${selectedDay}|range=${dateRange}`;
    const metrics = computeDashboardMetrics(projection, { selectedDay, dateRange });

    snapshot.cells[baseKey] = {
      effectiveDay: metrics.effectiveDay,
      campaignHealth: metrics.campaignHealth,
      suggestedChange: metrics.suggestedChange ? {
        title: metrics.suggestedChange.title,
        action: metrics.suggestedChange.action,
        observation: metrics.suggestedChange.observation,
      } : null,
      kpiCards: metrics.kpiCards.map(c => ({
        key: c.key,
        label: c.label,
        value: c.value,
        deltaPct: c.deltaPct,
        showDelta: c.showDelta,
        isGood: c.isGood,
      })),
      funnel: metrics.funnel,
      audienceOverview: metrics.audienceOverview ? {
        bands: metrics.audienceOverview.bands,
        convRateOverlay: metrics.audienceOverview.convRateOverlay,
      } : null,
      campaignList: metrics.campaignList.map(c => ({
        id: c.id,
        title: c.title,
        contactCount: c.contactCount,
        channel: c.channel,
        reward: c.reward,
      })),
      dailyOutreach: {
        paddedData: metrics.dailyOutreach.paddedData,
        latestCampaignTitles: metrics.dailyOutreach.latestCampaigns.map(c => c.title),
        maxTotal: metrics.dailyOutreach.maxTotal,
      },
    };

    for (const kpi of KPI_KEYS) {
      const heroKey = `${baseKey}|kpi=${kpi}`;
      const hero = computeHeroChartForKPI(projection, kpi, metrics.effectiveDay);
      snapshot.cells[heroKey] = {
        kind: hero.kind,
        ...(hero.kind === 'stacked'
          ? { cacData: hero.cacData, maxVal: hero.maxVal }
          : {
              slice: hero.slice,
              staticSlice: hero.staticSlice,
              maxVal: hero.maxVal,
              isROAS: hero.isROAS,
              hasData: hero.hasData,
            }),
      };
    }
  }
}

// Stable JSON output — keys sorted, deterministic
function stableStringify(obj) {
  return JSON.stringify(obj, Object.keys(obj).sort ? null : null, 2);
}

// Sort keys recursively for byte-stable output
function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === 'object') {
    const out = {};
    for (const k of Object.keys(value).sort()) {
      out[k] = sortKeys(value[k]);
    }
    return out;
  }
  return value;
}

console.log(JSON.stringify(sortKeys(snapshot), null, 2));
