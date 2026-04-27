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
- **Derivation (S4 post-QA)**: period sum of daily increments of `cumulativeRewardCost` — actual reward payouts on resolved conversions. Same domain principle as CAC and ROAS: cost flows through conversion, not contact.
- **Engine source**: `days[i].cumulativeRewardCost`
- **Edge cases**: When `selectedDay < dateRange`, period collapses to available days.
- **Status**: ✅ **S4 — fixed.** Was using `cumulativeSpend` (budget allocation, $5K/day flat). Now uses real reward payouts.

### M1.4 Pacing

- **Surfaces**: "Pacing ~$X/mo" strip
- **Time base**: derived rate, normalized to monthly
- **Derivation (current — KNOWN BROKEN)**: `(dayData.cumulativeSpend / selectedDay) * 30` rounded. Uses budget allocation (`cumulativeSpend = budget/30 × days`), not real spend. So Pacing always ≈ budget. Lies.
- **Status**: **DEFERRED.** Proper Pacing requires calendar-aware logic (current month length 28/29/30/31, days elapsed in this calendar month, projection for remaining days). The engine has projection capability (the strategy page uses it) so the data is available — but binding it to a calendar month + handling the engine's variable horizon (S5 lifts to 90 days) is its own design effort. **Not touched in S4** to avoid shipping an approximation we'd refactor. See "Deferred items" section in plan-numbers-consistency.md.

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
- **Period KPI formulas (S4 post-QA)** — aligned with chart's daily values for clean tie-out:
  - **activeUsers** = Σ daily activeUser over period (additive)
  - **CAC** = Σ daily reward cost / Σ daily users (weighted ratio, uses `cumulativeRewardCost`, not `cumulativeSpend`; matches engine's notion of CAC at projectionEngine.js line 304)
  - **ROAS** = Σ daily value / Σ daily reward cost (weighted ratio). Spend = actual reward payouts on resolved conversions, NOT `budget/30 × days` allocation. Aligns with the domain model: cost flows through conversion, not contact.
  - **fraudSaved** = Σ daily fraudSaved increments (additive)
- **Edge cases**: When `selectedDay < dateRange`, the period naturally collapses to whatever days exist. The value is still a valid period sum/ratio. No UI badge — the daily chart already shows the data extent.
- **Status**: S1 — preserve. ✅ **S3 — done** (time-base pinned, hero chart tie-out at full history). ✅ **S4 — done** (period formulas aligned with chart; tie-outs verified at any window).

### M2.5–M2.8 KPI deltas

For each KPI, the delta vs prior period:

- **Surfaces**: small ↑X% / ↓X% next to KPI card big number
- **Time base**: period-windowed (current period vs preceding period of same length)
- **Derivation**: `priorValue = getPeriodKPI(days, selectedDay - dateRange, dateRange, key)`; `deltaPct = ((value - priorValue) / priorValue) × 100`. Hidden when `selectedDay <= dateRange` (no prior period exists) or when `priorValue <= 0` or `deltaPct == 0`.
- **Delta rule (S4 post-QA, GA-style)**: Show delta whenever a prior period with positive value exists. Compute against whatever prior data is available (clipped or not) — matches Google Analytics "Compare to previous period" behavior. Show 0% as 0% (don't hide). Return null only when there is literally no prior period (`selectedDay <= dateRange`) or `priorValue == 0`.
- **Status**: S1 — preserve. ✅ **S4 — done.** Always-visible delta with honest values; consistent UX across ranges.

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
- **Chart**: stacked bar of daily unit cost — `[dailyReferrerCost, dailyRefereeCost]` per day in $. The two segments are the per-conversion reward components.
- **Tie-out to KPI card** (S4 post-QA): KPI CAC = Σ daily reward paid / Σ daily resolved users, where daily reward paid = unit cost × daily users. The chart shows unit cost (varies day-to-day with efficiency); the KPI is the users-weighted average of those daily unit costs. The KPI formula was corrected to use `cumulativeRewardCost` increments (matching engine's notion of CAC at projectionEngine.js:304), not budget allocation.
- **Status**: S1 — preserve. ✅ **S4 — KPI math reconciled with chart**, chart unchanged.

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
- **Time base**: daily (matches the agentic series — daily ROAS = day's value / day's reward cost)
- **Derivation (S6 onward)**: same daily ROAS formula applied to `projection.staticBaseline.days[]`.
- **The clean rule (S6 fix)**: `staticMode = true` locks `efficiency = effFloor`. THAT IS THE ONLY DIFFERENCE. Revenue per user, tier costs, everything else use the same formula in both modes — they just receive a frozen `eff` in static.
  - Day 1 in agentic: `eff = effFloor` (no learning has happened yet) → revenue per user = `base + (premium - base) × effFloor` → identical to static
  - Day N in agentic: `eff` improves toward 0.85+ → revenue per user climbs → diverges from static
  - At every day, static stays at the eff = effFloor baseline; agentic measures the value of learning
- **What the line represents**: same operation Vincor would run, but with the agent's targeting frozen at the baseline. The gap between the lines is the value of learning.
- **Status**: S1 — preserve placeholder × 0.7. ✅ **S6 — done.** (a) Real engine staticMode plumbed through. (b) Engine rule cleaned up — was previously locking BOTH eff AND `effectiveRevenuePerUser` independently, which broke Day 1 parity. Now eff-lock is the sole differentiator. Day 1 agentic === Day 1 static, divergence reflects only learning.
- **Note**: tweaking the static-mode rule further (e.g., using a worse-than-floor efficiency for stronger contrast) is a separate design decision, deferred. The current rule is now structurally clean.

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
- **P17 (boundary cohorts)**: at the right edge of the engine's 30-day horizon, lifecycle bands carry boundary cohorts misleadingly (e.g., Day 1 cohort with 30-day offer expiration sits in "Engaged" right up to Day 30 with no transition into "Cooling Off"). Documented; structural fix arrives in S5 when engine extends to 90 days and offer expirations land within the visible UI horizon.
- **Status**: S1 — preserve. **S5** — engine extension fixes the boundary cohort artifact. **S6** — locked decoration: move whole series to `src/fixtures/audiencePools.js` (fixed-shape time series), or document that it's engine-generated decoration only.

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

### MX.0 Chart axes (S6 windowing)

All three time-series charts (Hero KPI, Audience Overview, Daily Outreach) shift from "full history through selectedDay" to "windowed view: last `dateRange` days ending at selectedDay, clipped to start at Day 1 if `selectedDay < dateRange`." This matches the period-windowing semantics of the KPI cards.

- **X-axis**: shows day numbers across the windowed range (e.g., Day 60 + 30d → axis labels at 31, 40, 50, 60)
- **Y-axis**: max derived from data within the window only. Auto-rescales when the user changes day-stop or range.
- **Y-axis nice ceiling**: standard tick-step algorithm (`niceYMax`). Picks step size targeting ~5 ticks across the data range, rounds step to 1/2/5 × 10^n, applies 5% headroom. Adapts to any range without tier lists.

### MX.1 Day clamp

- **Behavior (S5 onward)**: `effectiveDay = Math.min(selectedDay, ENGINE_MAX_DAYS)` where `ENGINE_MAX_DAYS = 60` (UI horizon). Engine internally simulates 90 days (60 visible + 30-day buffer for cohort maturation and offer expiration).
- **Effect**: Day 60 now shows actual Day 60 engine data — funnel, KPIs, audience, charts all reflect 60 days of operation. Cohorts contacted at Day 60 are fully simulated through Day 90, so the conversion-rate overlay and lifecycle bands are not truncated at the horizon edge.
- **Budget semantics**: budget represents a monthly allocation, renewing each month. Engine continues using `dailySpend = budget / 30`, so cumulative engine spend at Day 60 = 2 × monthly budget; at Day 90 = 3 × monthly budget. The "Spent" strip uses `cumulativeRewardCost` (real reward payouts) regardless.
- **Status**: ✅ **S5 — done.** P2 (Day 60 silent clamp) fixed. P17 (lifecycle bands carry boundary cohorts misleadingly) resolved structurally — offer expirations within 30-day window now land inside the visible 60-day UI horizon.

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
