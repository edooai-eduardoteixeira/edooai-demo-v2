/**
 * animation.js — pure helpers for the dashboard's live operations animation.
 *
 * Drives the Day 1 → Day 60 progression over 90 seconds with per-chart
 * pursuit (each chart lerps continuously toward its current target;
 * targets update at staggered phase moments within each day so the
 * cascading "audience first → outcomes last" perception is preserved).
 *
 * See docs/PLAN-numbers-consistency.md "Item 5 — Live operations animation".
 */

export const ANIMATION_TOTAL_MS = 90_000;     // 90 seconds end-to-end
export const ANIMATION_TOTAL_DAYS = 60;       // Day 1 .. Day 60
export const MS_PER_DAY = ANIMATION_TOTAL_MS / ANIMATION_TOTAL_DAYS; // 1500ms

// Per-chart phase offsets (fraction of the day at which each chart's target
// switches from prev-day value to curr-day value). Cascading order:
// audience first, middle funnel stages cascade, outcomes resolve last.
export const PHASES = {
  audience:  0.10,  // 150ms into the day
  outreach:  0.10,  // synced with audience
  contacted: 0.10,  // top of funnel = audience-side event
  engaged:   0.20,
  referred:  0.30,
  reached:   0.40,
  signedUp:  0.50,
  active:    0.60,
  kpis:      0.65,  // outcomes resolve last
  hero:      0.65,
  convRate:  0.10,  // synced with audience
};

// Lerp rate at 60Hz. 10% per frame ≈ 117ms half-life → reaches 95% in ~500ms,
// 99.8% in ~1s. Frame-rate-aware via lerp(displayed, target, dt).
export const LERP_RATE_60HZ = 0.10;
const FRAME_MS_60HZ = 1000 / 60;

/** Pure: given elapsed ms, return the current day index (1..60), clamped. */
export function dayFromElapsed(elapsedMs) {
  if (elapsedMs <= 0) return 1;
  const day = Math.floor(elapsedMs / MS_PER_DAY) + 1;
  return Math.min(ANIMATION_TOTAL_DAYS, Math.max(1, day));
}

/** Pure: fraction (0..1) of how far into the current day we are. */
export function withinDayProgress(elapsedMs) {
  if (elapsedMs <= 0) return 0;
  const day = dayFromElapsed(elapsedMs);
  if (day >= ANIMATION_TOTAL_DAYS && elapsedMs >= ANIMATION_TOTAL_MS) return 1;
  const dayStartMs = (day - 1) * MS_PER_DAY;
  return Math.min(1, Math.max(0, (elapsedMs - dayStartMs) / MS_PER_DAY));
}

/** Pure: cubic ease-out. */
export function easeOutCubic(t) {
  const x = Math.min(1, Math.max(0, t));
  return 1 - Math.pow(1 - x, 3);
}

/**
 * Pure: frame-rate-aware lerp. Approaches `target` from `displayed` with
 * a per-frame closure rate of LERP_RATE_60HZ at 60Hz. `dt` is the time since
 * the last frame in ms — compensates for variable frame rate.
 */
export function lerp(displayed, target, dt) {
  if (target === displayed) return target;
  const frames = (dt > 0 ? dt : FRAME_MS_60HZ) / FRAME_MS_60HZ;
  const factor = 1 - Math.pow(1 - LERP_RATE_60HZ, frames);
  return displayed + (target - displayed) * factor;
}

/** Pure: choose target value based on phase gating within the day. */
export function targetForPhase(prevValue, currValue, withinDay, phase) {
  return withinDay >= phase ? currValue : prevValue;
}

/** Whether the animation has finished (elapsed has passed total duration). */
export function isAnimationComplete(elapsedMs) {
  return elapsedMs >= ANIMATION_TOTAL_MS;
}
