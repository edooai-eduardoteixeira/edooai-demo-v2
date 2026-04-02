# TODOS

## Dashboard

- [ ] **Add projection line to hero graph**
  **Priority:** P1
  **What:** Add a secondary dashed line to the hero chart showing the projected/expected trajectory alongside the actual cumulative curve. This gives the Head of Growth a visual "on track vs behind" signal directly in the chart.
  **How:** Use the multi-series support already in Chart.jsx. Reference the "Static Rules" dashed line in the Agentic vs Static Execution graph (ComparisonChart) for the design pattern — same approach: a second series with `dashed: true`, lighter color, thinner width. The projection line would show linear interpolation to the 30-day target.
  **Why:** The GOAL PROGRESS health tile says "Running X% Behind" but the hero chart only shows actual results. Adding the projection line makes the gap visible at a glance — the distance between the two lines IS the "behind" amount.
  **Depends on:** Current health row implementation (merged in this PR).

## Completed
