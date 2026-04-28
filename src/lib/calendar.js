/**
 * calendar.js — UI-side mapping between engine "Day N" and calendar dates.
 *
 * The engine itself is date-agnostic (it simulates N days starting at Day 1).
 * The dashboard maps Day N onto a real calendar so the strip can speak in
 * monthly terms (MTD spend, projected month-end Pacing).
 *
 * DAY_ONE is hardcoded for demo determinism (numbers don't drift day-to-day).
 *
 * See docs/METRIC_MODEL.md §M1.3, §M1.4.
 */

// Day 1 of the engine maps to April 1, 2026. Picked because:
//   - April has 30 days → Day 30 = April 30 = clean month boundary at the
//     30-day day-stop the dashboard uses.
//   - Day 60 = May 30; engine runs to Day 90 = June 29, so we always have
//     enough projected days to cover "remainder of current calendar month"
//     for any selectedDay ∈ [1, 60].
export const DAY_ONE = new Date(2026, 3, 1);

const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Day N (1-indexed) → Date object (calendar date). */
export function dateForDay(dayN) {
  const d = new Date(DAY_ONE);
  d.setDate(d.getDate() + (dayN - 1));
  return d;
}

/** Date → Day N (1-indexed). Inverse of dateForDay. */
export function dayForDate(date) {
  const ms = date.getTime() - DAY_ONE.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24)) + 1;
}

/** Calendar days in the month containing `date`. */
function daysInMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

/**
 * Month bounds in engine-Day-N space for the calendar month containing Day N.
 *
 * Example with DAY_ONE = April 1, 2026:
 *   monthBoundsForDay(15) → { firstDayN: 1,  lastDayN: 30, daysInMonth: 30, monthLabel: 'April' }
 *   monthBoundsForDay(31) → { firstDayN: 31, lastDayN: 61, daysInMonth: 31, monthLabel: 'May' }
 *   monthBoundsForDay(60) → { firstDayN: 31, lastDayN: 61, daysInMonth: 31, monthLabel: 'May' }
 */
export function monthBoundsForDay(dayN) {
  const date = dateForDay(dayN);
  const firstOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const inMonth = daysInMonth(date);
  const firstDayN = dayForDate(firstOfMonth);
  return {
    firstDayN,
    lastDayN: firstDayN + inMonth - 1,
    daysInMonth: inMonth,
    monthLabel: MONTH_LABELS[date.getMonth()],
  };
}
