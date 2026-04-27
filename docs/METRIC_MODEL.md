# Metric Model

Canonical definition of every number that appears on the dashboard.

This is the **single source of truth**. If a value renders in `DashboardPage.jsx`,
it must be defined here and produced by `src/lib/metrics.js`. JSX never computes
numbers — only formats them.

## Conventions

### Time bases

Each metric is anchored to one of:

- **Cumulative (resolution-time)** — count of events that have *been observed* through Day N. Includes activations from cohorts contacted earlier, now resolving.
- **Cohort-anchored (terminal)** — for the cohort *contacted* on Day N, what does that cohort eventually deliver. Independent of how much time has passed since contact.
- **Daily (resolution-time)** — events that resolved on Day N. Diff of cumulative.
- **Daily (generation-time)** — events generated on Day N (offers sent, journeys started). Independent of when conversions later resolve.
- **Period-windowed** — sum or aggregate over the trailing N-day window ending at the selected day, where N is the user's `dateRange` selection (7d / 30d).
- **Point-in-time (state)** — current value at Day N (e.g., remaining pool, lifecycle band membership). Not cumulative.

A metric's time base does not change when the user switches days. The user's selection picks *which day's value* to read from a series whose semantics are fixed.

### Domain note: cost flows through conversion

In this product, contact cost is approximately zero. Cost is incurred at conversion (the reward paid to referrer + referee). So:
- CAC denominator is `cumulative active users` (resolutions).
- CAC numerator is `cumulative reward cost` (paid only on resolved conversions).
- CAC is well-defined whenever any user has activated. At Day 1 with zero activations, CAC = 0/0 → display "—".

### Edge case display policy

When a metric is undefined (zero denominator, insufficient window, prior period clipped), `metrics.js` returns `null`. JSX renders `null` as `"—"`.

When a metric is well-defined but zero (e.g., zero fraud saved on Day 1 because zero spend), `metrics.js` returns `0`. JSX renders normally.

The distinction matters: `0` says "we know it's zero." `null` says "we don't have data to tell you."

### Cohort maturation note (Class A)

Several metrics have a real choice between resolution-time and cohort-anchored bases. For these, the displayed time base is documented per metric. Common pattern:

- Funnel stages are **cumulative resolution-time** — "what has actually happened by Day N." This makes them feel live.
- Conversion rate overlay is **cohort-anchored terminal** — "what fraction of the cohort contacted on Day N eventually converted." This isolates targeting quality from maturation.

This means the funnel and the conversion overlay answer different questions on the same screen. That is intentional and stated.

### Stage status convention

Each metric has a status:
- **S1** — current behavior preserved exactly (refactor only). Includes any bugs.
- **S1→Sn** — the stage at which the definition changes; before that, S1 captures current behavior.

S1's job is *no behavior change*. Later stages replace specific entries.

---

## Region 1 — Campaign Health Row + Suggested Change Strip

### M1.1 Delivery state

- **Surfaces**: `CampaignHealthRow` label ("Learning" / "Limited by Budget" / "Acquiring Customers")
- **Time base**: point-in-time (state), Day N
- **Derivation**:
  - "Learning" if `selectedDay <= projection.thresholdDay`
  - else "Limited by Budget" if `dayData.capHit`
  - else "Acquiring Customers"
- **Engine source**: `projection.thresholdDay`, `dayData.capHit`
- **Status**: S1 — preserve exactly.

### M1.2 Budget

- **Surfaces**: budget button (`$X/mo`)
- **Time base**: point-in-time (input)
- **Derivation**: `projection.budget` (set by user via slider; defaults to `config.recommendedBudget.amount` ?? 150_000)
- **Status**: S1 — preserve. (S5 confirms semantics: monthly budget renews; Day 60 = 2 months of operation at the same rate.)

### M1.3 Spent (period)

- **Surfaces**: "Spent" `$X` strip
- **Time base**: period-windowed, ending at selected day
- **Derivation**: `dayData.cumulativeSpend - days[startIdx-1].cumulativeSpend` where `startIdx = max(0, endIdx - dateRange + 1)` and `endIdx = selectedDay - 1`. If `startIdx == 0`, subtract 0.
- **Engine source**: `days[i].cumulativeSpend`
- **Edge cases**: Day 1 with 30d window → period collapses to 1 day; current behavior shows that 1-day spend. Status quo for S1; revisited in S4.
- **Status**: S1 — preserve.

### M1.4 Pacing

- **Surfaces**: "Pacing ~$X/mo" strip
- **Time base**: derived rate, normalized to monthly
- **Derivation**: `(dayData.cumulativeSpend / selectedDay) * 30` rounded.
- **Edge cases**: `selectedDay == 0` → 0 (UI never selects Day 0).
- **Status**: S1 — preserve. (S5 confirms: extends naturally to Day 60 since rate is daily-spend-extrapolated-to-monthly.)

### M1.5 Suggested change action

- **Surfaces**: `SuggestedChangeStrip`'s "Suggested change: {action}" text
- **Time base**: point-in-time (latest available recommendation at or before selected day)
- **Derivation**: scan `briefings[d]` from `selectedDay` down to 1, return first `briefings[d].recommendation.action` found.
- **Engine source (S2 onward)**: `projection.agentRecommendations[]` — per-day array, each entry computed using only `agentic.days.slice(0, day)` (no future leakage).
- **Status**: S1 — preserve hardcoded fabricated text. ✅ **S2 — replaced.** Now uses `agentRecommendations[selectedDay - 1]`, scanning back to find the most recent non-null rec. Briefings layer + nameGenerator.js deleted.

---

## Region 2 — Block 1 Left: KPI selector + hero chart

### M2.1–M2.4 KPI period values

For each KPI in {`activeUsers`, `cac`, `roi`, `fraudSaved`}:

- **Surfaces**: KPI card big number
- **Time base**: period-windowed
- **Derivation**: `getPeriodKPI(days, selectedDay, dateRange, key)` (see DashboardPage.jsx:174–221 for the formula per key).
  - `activeUsers`: sum of `dailyFunnel.activeUser` over period
  - `cac`: period spend / period users; 0 if users == 0
  - `roi`: period value / period spend (ratio, 1 decimal); 0 if spend == 0
  - `fraudSaved`: period spend × terminal-day fraud rate
- **Engine source**: `days[i].dailyFunnel.activeUser`, `days[i].cumulativeSpend`, `days[i].cumulativeValue`, `days[lastIdx].kpiCumulative.fraudSaved`.
- **Edge cases**: Period < dateRange because `selectedDay < dateRange`. Current behavior: returns smaller-window value. Status quo for S1; S4 either labels actual window or returns null.
- **Status**: S1 — preserve. **S3** — pin time-base + ensure tie-out with hero chart. **S4** — handle period-window-shrink display honesty.

### M2.5–M2.8 KPI deltas

For each KPI, the delta vs prior period:

- **Surfaces**: small ↑X% / ↓X% next to KPI card big number
- **Time base**: period-windowed (current period vs preceding period of same length)
- **Derivation**: `priorValue = getPeriodKPI(days, selectedDay - dateRange, dateRange, key)`; `deltaPct = ((value - priorValue) / priorValue) × 100`. Hidden when `selectedDay <= dateRange` (no prior period exists) or when `priorValue <= 0` or `deltaPct == 0`.
- **Edge cases**: when prior window clips to fewer days than current (e.g., Day 8 with 7d range), the delta inflates. Current behavior: still shown.
- **Status**: S1 — preserve. **S4** — return null when prior period < dateRange; UI shows "—".

### M2.9 Hero chart series — activeUsers

- **Surfaces**: line chart of daily active users
- **Time base**: daily resolution-time
- **Derivation**: `projection.dailyCurve.slice(0, currentDay)` (resolved per day)
- **Engine source**: `dailyCurve[i]`
- **Status**: S1 — preserve.

### M2.10 Hero chart series — CAC (stacked bar)

- **Surfaces**: stacked bars per day, segments [referrer, referee]
- **Time base**: daily generation-time (cost incurred when offer is paid out)
- **Derivation**: `days.slice(0, currentDay).map(d => [d.dailyReferrerCost, d.dailyRefereeCost])`
- **Pinned definition (S3)**: this chart shows the **daily reward cost breakdown** ($ per day, referrer + referee). The KPI card above shows **average cost per acquisition** ($ per resolved active user, period-windowed). Both are legitimate views — the units intentionally differ, the label "CAC" applies to the period-windowed ratio, and the chart's stacked-bar legend ("Referrer", "Referee") communicates that the chart is a cost decomposition, not a per-user ratio.
- The two reconcile by construction: cumulative reward cost (sum of daily breakdown) divided by cumulative active users equals period CAC when period covers full history.
- **Status**: S1 — preserve. ✅ **S3 — pinned.** Front-end unchanged (stacked bar retained). Documented as "cost breakdown" view; no unit confusion to fix.

### M2.11 Hero chart series — ROI / fraudSaved (line)

- **Surfaces**: daily line chart
- **Time base**: daily — but computed via cumulative diff in current code
- **Derivation (S3 onward)**: per-metric formulas, no more cumulative-ratio diff:
  - **ROI per day** = `(cumulativeValue[d] - cumulativeValue[d-1]) / (cumulativeSpend[d] - cumulativeSpend[d-1])` — proper daily ratio.
  - **fraudSaved per day** = `cumulative.fraudSaved[d] - cumulative.fraudSaved[d-1]` — daily increment (engine accumulates fraud saved as `cumSpend × fraudRate`).
  - **activeUsers per day** = `dailyCurve[d]` — already correct, unchanged.
- The hero chart is now consistent with the KPI card: daily ROI values, when summed weighted by daily spend, equal the period ROI shown in the KPI card. Same for fraudSaved.
- **Status**: S1 — preserve buggy fallback path. ✅ **S3 — done.** Each KPI's daily series defined explicitly and matches the period-windowed value semantics.

### M2.12 Hero chart static baseline (ROAS only)

- **Surfaces**: dashed gray line labeled "Static Rules"
- **Time base**: daily (matches whatever the agentic series is showing)
- **Derivation**: `agenticSlice.map(v => Math.round(v * 0.7 * 10) / 10)` — placeholder × 0.7
- **Engine source**: ⚠ engine ALREADY computes `projection.staticBaseline` via `runSimulation({ staticMode: true })`, but the chart ignores it.
- **Status**: S1 — preserve placeholder. **S6** — use real `projection.staticBaseline` data.

### M2.13 Y-axis label values

- **Surfaces**: gridline labels (e.g., "5,000" / "10,000")
- **Time base**: derived from chart data
- **Derivation**: `niceYMax(max(slice))` and `[yMax * 0.5, yMax]`. Returns no labels when max is 0.
- **Status**: S1 — preserve.

---

## Region 3 — Block 1 Right: Referral Funnel

The funnel has 6 stages but the engine produces 4. S1 captures current invented multipliers; S3 fixes them.

### M3.1 Contacted

- **Time base**: cumulative resolution-time
- **Derivation**: `dayData.funnelCumulative.contacted`
- **Status**: S1 — preserve. Engine value, no change in any stage.

### M3.2 Engaged

- **Time base**: cumulative resolution-time
- **Derivation (S3 onward)**: `Math.round((contacted + referred) / 2)` — structural midpoint between adjacent engine cumulative stages.
- At engine `baseShareRate = 0.55` this lands ~77% of contacted (close to the prior hardcoded 0.77 multiplier) but properly responds to engine state changes (efficiency lifts effective share rate → referred rises → midpoint shifts).
- Monotonic by construction: Contacted ≥ Engaged ≥ Referred always holds.
- **Status**: S1 — preserve hardcoded 0.77. ✅ **S3 — done.** Engine-derived midpoint, no magic constant.

### M3.3 Referred

- **Time base**: cumulative resolution-time
- **Derivation**: `dayData.funnelCumulative.referralSent`
- **Status**: S1 — preserve. Engine value, no change.

### M3.4 Reached

- **Time base**: cumulative resolution-time
- **Derivation (S3 onward)**: `Math.round((referred + signedUp) / 2)` — structural midpoint between adjacent engine cumulative stages.
- Reached now means "referrals that landed in front of the recipient" — strictly bounded by Referred above and SignedUp below.
- Monotonic by construction: Referred ≥ Reached ≥ SignedUp always holds. The impossible Reached > Referred state is structurally unreachable.
- **Status**: S1 — preserve buggy 1.4×. ✅ **S3 — done.** Midpoint replaces × 1.4. Funnel monotonicity invariant enforced and verified across all 30 days.

### M3.5 Signed Up

- **Derivation**: `dayData.funnelCumulative.signedUp`
- **Status**: S1 — preserve.

### M3.6 Active User

- **Derivation**: `dayData.funnelCumulative.activeUser`
- **Status**: S1 — preserve. **S3** — invariant: equals `KPI card.activeUsers` source for the same period.

### Funnel monotonicity invariant (post-S3)

`Contacted ≥ Engaged ≥ Referred ≥ Reached ≥ SignedUp ≥ Active`

Today, `Reached > Referred` violates this on every day. Asserted in `verify-metrics.mjs` only after S3.

---

## Region 4 — Block 2 Left: Audience Overview

### M4.1–M4.3 Eligible bands (Advocates / Persuadable / Passive)

- **Surfaces**: stacked area
- **Time base**: point-in-time per day, series length = currentDay
- **Derivation**: `propensityHealth.highEligible / medEligible / lowEligible` (each an array per day).
- **Engine source**: `computePropensityHealth` in projectionEngine.js:1033, which uses hardcoded depletion coefficients (×2.2, ×0.85, ×0.35) and a replenish factor over the cumulative `funnelCumulative.contacted`.
- **Note**: codex finding F. The whole *time series* is fabricated by the depletion math, not just the 30/45/25 starting split. Calling pools "decoration" is a partial fix; the time-series shape is also fake.
- **Status**: S1 — preserve. **S6** — locked decoration: move whole series to `src/fixtures/audiencePools.js` (fixed-shape time series), or document that it's engine-generated decoration only.

### M4.4 Conversion rate overlay

- **Surfaces**: line on right Y-axis labeled "Conversion rate"
- **Time base**: cohort-anchored terminal (each day shows the terminal conversion rate of the cohort *contacted* on that day)
- **Derivation**: `effectivenessData.dailyConversionRate.slice(0, currentDay)` — engine's `cohort.convRate` (= `cumResolved / contacted` with cumResolved over 14-day cohort window).
- **Pinned definition (S3)**: each x-axis day shows the *terminal conversion rate of the cohort first contacted on that day* (cumulative resolutions ÷ cohort.contacted, summed over the 14-day cohort window). This isolates targeting quality from elapsed time.
- **Known truncation artifact**: late cohorts (within ~14 days of engine horizon) cannot fully resolve before the 30-day truncation in `pendingConversions`. The line slopes downward at the right edge for that reason, not because the agent's targeting got worse. Documented; structural fix in S5.
- **Status**: ✅ **S3 — definition pinned.** **S5** — engine extension to 90 days eliminates the truncation; Day 1–60 cohorts all fully resolvable in their 14-day window.

---

## Region 5 — Block 2 Right: Campaign list + Daily Outreach

### M5.1 Campaign list

- **Surfaces**: cards with `c.title`, `c.contactCount`, plus expanded details (`whyRefer`, `channel`, `reward`, `example`)
- **Time base**: point-in-time (campaigns active on Day N)
- **Derivation**: `briefings[selectedDay].dailyPlan.campaigns[]`
- **Engine source (S2 onward)**: `src/fixtures/campaigns.js` owns identity (id, title, copy, color, weight, startsDay, endsDay). `metrics.js` derives `contactCount` per campaign as `round(dayData.journeysToday × campaign.share)` where share is the campaign's fixture weight normalized over active campaigns that day.
- **Status**: S1 — preserve. ✅ **S2 — done.** Roster stable. Colors locked to ID. nameGenerator.js deleted.

### M5.2 Daily Outreach stacked bar

- **Surfaces**: stacked bar per day, one segment per active campaign
- **Time base**: daily generation-time (contacts per campaign per day)
- **Derivation**: 
  ```
  for each day d in 1..effectiveDay:
    dayCampaigns = briefings[d].dailyPlan.campaigns
    paddedSegments = pad(dayCampaigns.map(c => c.contactCount), maxCampaignsAcrossDays)
  ```
- **Color assignment (S2 onward)**: each campaign carries its color in the fixture. Stack segments are ordered by fixture order (not lineup growth), so a campaign keeps its color whether it appears as segment 0 or segment 4.
- **Engine source (S2 onward)**: `metrics.computeDailyOutreach` — per day d, per campaign c: `round(d.journeysToday × c.share)` where c.share = 0 if campaign isn't active on that day.
- **Status**: S1 — preserve. ✅ **S2 — done.** Stable colors. No more "campaign disappeared/reappeared" visual.

### M5.3 Operations decomposition (newContacts vs followUps)

- **Surfaces**: not directly rendered today; available via `metrics.computeOpsDecomposition(days, day)` for verify scripts and any future surface.
- **Time base**: daily generation-time
- **Derivation (S2 onward)**: 
  ```
  total = round(d.journeysToday)
  followUpRate = computeFollowUpRate(allDays, day) — see below
  followUps = round(total * followUpRate)
  newContacts = total - followUps
  ```
  `computeFollowUpRate`: 0 during a 3-day grace window after first contact, then ramps toward FOLLOW_UP_CAP (0.35) over ~30 days. Tied to engine `day` state (not to dashboard day index). Documented heuristic — the engine doesn't model repeat-contact strategy, so this is a defensible bounded function rather than a deep simulation.
- **Invariant** (verified in `verify-metrics.mjs`): `newContacts + followUps === total` for every day.
- **Status**: S1 — preserve linear ramp. ✅ **S2 — done.** Engine-derived; ramp is no longer a pure-time animation; invariant verified.

---

## Cross-cutting

### MX.1 Day clamp

- **Behavior**: `effectiveDay = Math.min(selectedDay, ENGINE_MAX_DAYS)` where `ENGINE_MAX_DAYS = 30`
- **Effect**: selecting Day 60 silently uses Day 30 data
- **Status**: S1 — preserve. **S5** — engine extends to 90 days; clamp removed.

### MX.2 Engine projection pipeline

`computeDashboardProjection({ budget, params })` is the only engine entry point used by the dashboard. It returns:
- `days[]` — per-day records
- `dailyCurve[]` — daily resolved per day (length 30)
- `dailyBriefings{}` — Day → briefing
- `propensityHealth`, `effectivenessData`, `operationsData`, `cohorts`
- `staticBaseline` (ignored by UI today)
- `agentRecommendation` (ignored by UI today)
- `thresholdDay`, scalar metrics (`activeUsers`, `cac`, `roi`, `convRate`, `fraudSaved`)

All numbers above derive from this projection.

### MX.3 Re-render coupling

`projection` is memoized on `[config, budget]`. Dashboard re-runs the engine only when budget changes or config changes. Day/KPI/dateRange selections re-derive metrics but do not re-run the engine.

`metrics.js` outputs MUST be cheap enough to recompute on any selector change without memoization (the dashboard wraps the call in `useMemo` keyed on `[projection, selectedDay, dateRange]`).

---

## Stage-by-stage summary

| Region | Metric | S1 | S2 | S3 | S4 | S5 | S6 |
|---|---|---|---|---|---|---|---|
| 1 | Delivery state | preserve | — | — | — | — | — |
| 1 | Budget | preserve | — | — | — | semantics confirmed | — |
| 1 | Spent (period) | preserve | — | — | — | extends to 60d | — |
| 1 | Pacing | preserve | — | — | — | extends to 60d | — |
| 1 | Suggested change | preserve fake | engine's `agentRecommendation` constrained | — | — | — | — |
| 2 | KPI period values | preserve | — | tie-out with hero | window honesty | — | — |
| 2 | KPI deltas | preserve | — | — | null when prior period clipped | — | — |
| 2 | Hero — activeUsers | preserve | — | — | — | extends to 60d | — |
| 2 | Hero — CAC stacked | preserve | — | reconcile units | — | — | — |
| 2 | Hero — ROI/fraud line | preserve | — | unambiguous derivation | — | — | — |
| 2 | Static baseline | preserve fake | — | — | — | — | real `staticBaseline` |
| 3 | Funnel: Engaged | preserve 0.77 | — | engine `effectiveShareRate` | — | — | — |
| 3 | Funnel: Reached | preserve 1.4× | — | redefine to satisfy monotonicity | — | — | — |
| 4 | Eligible bands | preserve | — | — | — | — | locked decoration |
| 4 | Conv rate overlay | preserve | — | pin definition | — | extension fixes truncation | — |
| 5 | Campaign list | preserve | stable roster fixture | — | — | — | — |
| 5 | Daily outreach | preserve | stable colors | — | — | — | — |
| 5 | Ops decomposition | preserve linear ramp | engine-derived follow-up rate | — | — | — | — |
| X | Day clamp | preserve | — | — | — | removed | — |

S1 produces `metrics.js` that mimics the current behavior exactly. Regression gate: pre-refactor snapshot equals post-refactor snapshot, byte for byte.
