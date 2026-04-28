/**
 * pursuitMetrics.js — per-chart pursuit lerp toward staggered targets.
 *
 * Each animated value pursues a target that switches from prev-day value to
 * curr-day value at the chart's assigned phase moment within each day.
 * The displayed value lerps continuously toward the target; staggered phases
 * give the cascading "audience first → outcomes last" perception while
 * keeping continuous motion globally (no synchronized stop-and-go windows).
 *
 * State (the "displayed" object) is mutated in place across frames so the
 * pursuit accumulates over time. Caller (DashboardPage) holds the ref and
 * passes it on every frame.
 *
 * See docs/PLAN-numbers-consistency.md "Item 5 — Live operations animation"
 * and src/lib/animation.js for phase offsets and lerp formula.
 */

import { PHASES, lerp, targetForPhase } from './animation.js';

const ZERO_AUDIENCE = { advocates: [], persuadable: [], passive: [] };

/** Initial displayed-metrics shape — zeros where appropriate, taking sizing
 *  hints from the first computed metrics. */
export function createDisplayedMetrics(initial) {
  if (!initial) return null;
  return {
    audienceOverview: initial.audienceOverview ? {
      ...initial.audienceOverview,
      bands: {
        advocates:   (initial.audienceOverview.bands?.advocates   || []).map(() => 0),
        persuadable: (initial.audienceOverview.bands?.persuadable || []).map(() => 0),
        passive:     (initial.audienceOverview.bands?.passive     || []).map(() => 0),
      },
      convRateOverlay: (initial.audienceOverview.convRateOverlay || []).map(() => 0),
    } : initial.audienceOverview,
    dailyOutreach: initial.dailyOutreach ? {
      ...initial.dailyOutreach,
      paddedData: (initial.dailyOutreach.paddedData || []).map(row => row.map(() => 0)),
    } : initial.dailyOutreach,
    funnel: (initial.funnel || []).map(s => ({ ...s, value: 0 })),
    kpiCards: (initial.kpiCards || []).map(c => ({ ...c, value: 0 })),
  };
}

/**
 * "Effective prev" for a slot when prev's array is shorter than curr's:
 * extend with prev's last value (Solution A — no valley at the rightmost
 * slot during warmup days). When prev is empty/null, fall back to 0.
 */
function effectivePrevAt(prevArr, idx) {
  if (!Array.isArray(prevArr) || prevArr.length === 0) return 0;
  if (idx < prevArr.length) return prevArr[idx];
  return prevArr[prevArr.length - 1];
}

/** Pursue a single value toward its phase-gated target. */
function pursueValue(displayedVal, prevVal, currVal, withinDay, phase, dt) {
  const target = targetForPhase(prevVal, currVal, withinDay, phase);
  return lerp(displayedVal, target, dt);
}

/** Pursue an array of values element-by-element. */
function pursueArray(displayedArr, prevArr, currArr, withinDay, phase, dt) {
  if (!Array.isArray(currArr)) return currArr;
  // Resize displayed to match curr's length, preserving existing displayed
  // values; new slots start at the effective prev (extends trend, no valley).
  const len = currArr.length;
  if (!Array.isArray(displayedArr) || displayedArr.length !== len) {
    const grown = new Array(len);
    for (let i = 0; i < len; i++) {
      if (Array.isArray(displayedArr) && i < displayedArr.length) {
        grown[i] = displayedArr[i];
      } else {
        // New slot — seed at effective prev so the lerp starts smoothly.
        grown[i] = effectivePrevAt(prevArr, i);
      }
    }
    displayedArr = grown;
  }
  const out = displayedArr;
  for (let i = 0; i < len; i++) {
    const prevVal = effectivePrevAt(prevArr, i);
    out[i] = pursueValue(out[i], prevVal, currArr[i], withinDay, phase, dt);
  }
  return out;
}

/** Pursue a 2D matrix (paddedData per-day per-segment). Last day's row is
 *  the only one that actively tweens (per-day bars are independent). */
function pursueMatrix(displayedMatrix, prevMatrix, currMatrix, withinDay, phase, dt) {
  if (!Array.isArray(currMatrix)) return currMatrix;
  const rows = currMatrix.length;
  if (!Array.isArray(displayedMatrix) || displayedMatrix.length !== rows) {
    // Resize: new rows seeded with zeros (new bars grow from 0 — bars are
    // independent, no "valley" concern).
    const grown = new Array(rows);
    for (let r = 0; r < rows; r++) {
      if (Array.isArray(displayedMatrix) && r < displayedMatrix.length) {
        grown[r] = displayedMatrix[r];
      } else {
        grown[r] = currMatrix[r].map(() => 0);
      }
    }
    displayedMatrix = grown;
  }
  for (let r = 0; r < rows; r++) {
    const cols = currMatrix[r].length;
    if (!Array.isArray(displayedMatrix[r]) || displayedMatrix[r].length !== cols) {
      const newRow = new Array(cols);
      for (let c = 0; c < cols; c++) {
        newRow[c] = (Array.isArray(displayedMatrix[r]) && c < displayedMatrix[r].length)
          ? displayedMatrix[r][c] : 0;
      }
      displayedMatrix[r] = newRow;
    }
    const prevRow = Array.isArray(prevMatrix) && r < prevMatrix.length ? prevMatrix[r] : null;
    for (let c = 0; c < cols; c++) {
      const prevVal = prevRow && c < prevRow.length ? prevRow[c] : 0;
      displayedMatrix[r][c] = pursueValue(displayedMatrix[r][c], prevVal, currMatrix[r][c], withinDay, phase, dt);
    }
  }
  return displayedMatrix;
}

const FUNNEL_PHASES = {
  Contacted:    PHASES.contacted,
  Engaged:      PHASES.engaged,
  Referred:     PHASES.referred,
  Reached:      PHASES.reached,
  'Signed Up':  PHASES.signedUp,
  'Active User': PHASES.active,
};

/**
 * Pursue all animated metric values one frame closer to their staggered
 * targets. `displayed` is mutated in place; the returned object is the
 * same ref with updated values. Pass-through for non-animated fields.
 */
export function pursueMetrics(displayed, prev, curr, withinDay, dt) {
  if (!curr) return curr;
  if (!displayed) displayed = createDisplayedMetrics(curr);

  // Audience bands — phase 0.10
  if (curr.audienceOverview) {
    const prevAudience = prev?.audienceOverview;
    const dispAudience = displayed.audienceOverview || {};
    dispAudience.bands = dispAudience.bands || ZERO_AUDIENCE;
    dispAudience.bands.advocates = pursueArray(
      dispAudience.bands.advocates,
      prevAudience?.bands?.advocates,
      curr.audienceOverview.bands.advocates,
      withinDay, PHASES.audience, dt
    );
    dispAudience.bands.persuadable = pursueArray(
      dispAudience.bands.persuadable,
      prevAudience?.bands?.persuadable,
      curr.audienceOverview.bands.persuadable,
      withinDay, PHASES.audience, dt
    );
    dispAudience.bands.passive = pursueArray(
      dispAudience.bands.passive,
      prevAudience?.bands?.passive,
      curr.audienceOverview.bands.passive,
      withinDay, PHASES.audience, dt
    );
    dispAudience.convRateOverlay = pursueArray(
      dispAudience.convRateOverlay,
      prevAudience?.convRateOverlay,
      curr.audienceOverview.convRateOverlay,
      withinDay, PHASES.convRate, dt
    );
    // Pass-through fields (startDay, endDay, totals)
    dispAudience.startDay = curr.audienceOverview.startDay;
    dispAudience.endDay = curr.audienceOverview.endDay;
    dispAudience.totals = curr.audienceOverview.totals;
    displayed.audienceOverview = dispAudience;
  }

  // Daily Outreach — phase 0.10
  if (curr.dailyOutreach) {
    displayed.dailyOutreach = displayed.dailyOutreach || {};
    displayed.dailyOutreach.paddedData = pursueMatrix(
      displayed.dailyOutreach.paddedData,
      prev?.dailyOutreach?.paddedData,
      curr.dailyOutreach.paddedData,
      withinDay, PHASES.outreach, dt
    );
    displayed.dailyOutreach.latestCampaigns = curr.dailyOutreach.latestCampaigns;
    displayed.dailyOutreach.maxTotal = curr.dailyOutreach.maxTotal;
    displayed.dailyOutreach.startDay = curr.dailyOutreach.startDay;
    displayed.dailyOutreach.endDay = curr.dailyOutreach.endDay;
  }

  // Funnel — each stage uses its assigned phase
  if (Array.isArray(curr.funnel)) {
    const prevByLabel = new Map((prev?.funnel || []).map(s => [s.label, s.value]));
    if (!Array.isArray(displayed.funnel) || displayed.funnel.length !== curr.funnel.length) {
      displayed.funnel = curr.funnel.map(s => ({ ...s, value: 0 }));
    }
    for (let i = 0; i < curr.funnel.length; i++) {
      const stage = curr.funnel[i];
      const phase = FUNNEL_PHASES[stage.label] ?? PHASES.audience;
      const prevVal = prevByLabel.get(stage.label) ?? 0;
      const dispStage = displayed.funnel[i];
      dispStage.label = stage.label;
      dispStage.time = stage.time;
      dispStage.group = stage.group;
      dispStage.value = pursueValue(dispStage.value, prevVal, stage.value, withinDay, phase, dt);
    }
  }

  // KPI cards — phase 0.65
  if (Array.isArray(curr.kpiCards)) {
    const prevByKey = new Map((prev?.kpiCards || []).map(c => [c.key, c.value]));
    if (!Array.isArray(displayed.kpiCards) || displayed.kpiCards.length !== curr.kpiCards.length) {
      displayed.kpiCards = curr.kpiCards.map(c => ({ ...c, value: 0 }));
    }
    for (let i = 0; i < curr.kpiCards.length; i++) {
      const card = curr.kpiCards[i];
      const prevVal = prevByKey.get(card.key) ?? 0;
      const dispCard = displayed.kpiCards[i];
      // Carry over delta/format fields verbatim
      dispCard.key = card.key;
      dispCard.label = card.label;
      dispCard.betterWhen = card.betterWhen;
      dispCard.deltaPct = card.deltaPct;
      dispCard.isPositive = card.isPositive;
      dispCard.isGood = card.isGood;
      dispCard.showDelta = card.showDelta;
      dispCard.value = pursueValue(dispCard.value, prevVal, card.value, withinDay, PHASES.kpis, dt);
    }
  }

  // Pass-through fields — not animated
  displayed.effectiveDay = curr.effectiveDay;
  displayed.dayData = curr.dayData;
  displayed.campaignHealth = curr.campaignHealth;
  displayed.suggestedChange = curr.suggestedChange;
  displayed.campaignList = curr.campaignList;

  return displayed;
}

/**
 * Same model for hero chart. Mutates `displayed` in place. `kind` may
 * change between selectedKPI switches; reset displayed shape if it does.
 */
export function pursueHero(displayed, prevHero, currHero, withinDay, dt) {
  if (!currHero) return currHero;
  if (!displayed || displayed.kind !== currHero.kind) {
    // Shape change (KPI switched) — reset displayed to match curr structure.
    displayed = currHero.kind === 'stacked'
      ? { ...currHero, cacData: currHero.cacData.map(d => ({ ...d, values: [0, 0] })) }
      : { ...currHero, slice: currHero.slice.map(() => 0), staticSlice: currHero.staticSlice ? currHero.staticSlice.map(() => 0) : null };
  }

  if (currHero.kind === 'line') {
    displayed.slice = pursueArray(displayed.slice, prevHero?.slice, currHero.slice, withinDay, PHASES.hero, dt);
    if (currHero.staticSlice) {
      displayed.staticSlice = pursueArray(displayed.staticSlice, prevHero?.staticSlice, currHero.staticSlice, withinDay, PHASES.hero, dt);
    } else {
      displayed.staticSlice = null;
    }
  } else if (currHero.kind === 'stacked') {
    if (!Array.isArray(displayed.cacData) || displayed.cacData.length !== currHero.cacData.length) {
      displayed.cacData = currHero.cacData.map(d => ({ ...d, values: d.values.map(() => 0) }));
    }
    for (let i = 0; i < currHero.cacData.length; i++) {
      const dispVals = displayed.cacData[i].values;
      const currVals = currHero.cacData[i].values;
      const prevVals = (prevHero?.cacData && i < prevHero.cacData.length) ? prevHero.cacData[i].values : [0, 0];
      dispVals[0] = pursueValue(dispVals[0], prevVals[0] ?? 0, currVals[0], withinDay, PHASES.hero, dt);
      dispVals[1] = pursueValue(dispVals[1], prevVals[1] ?? 0, currVals[1], withinDay, PHASES.hero, dt);
    }
  }

  // Pass-through fields
  displayed.kind = currHero.kind;
  displayed.maxVal = currHero.maxVal;
  displayed.startDay = currHero.startDay;
  displayed.endDay = currHero.endDay;
  if ('isROAS' in currHero) displayed.isROAS = currHero.isROAS;
  if ('hasData' in currHero) displayed.hasData = currHero.hasData;

  return displayed;
}
