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

### M1.3 Spent MTD

- **Surfaces**: "Spent MTD" `$X` strip
- **Time base**: month-to-date (calendar month containing selected day)
- **Derivation (S6 items 4+7)**: `dayData.cumulativeRewardCost − days[firstDayOfMonth − 2].cumulativeRewardCost` rounded, clamped ≥ 0. Uses actual reward payouts on resolved conversions. Calendar boundaries from `monthBoundsForDay(selectedDay)` in `src/lib/calendar.js`.
- **Engine source**: `days[i].cumulativeRewardCost`
- **Calendar anchor**: `DAY_ONE = April 1, 2026` (hardcoded for demo determinism). Day 30 = April 30, Day 31 = May 1, Day 60 = May 30.
- **Edge cases**: At `selectedDay = firstDayN` (start of new month) Spent MTD shows one day's reward — visible "reset" between Day 30 → Day 31 is the intended calendar story.
- **Status**: ✅ **S6 items 4+7 — fixed.** Was period-windowed (7d/30d), creating mixed time bases on the strip. Now monthly to match Budget and Pacing — strip tells one coherent budget-health story.

### M1.4 Pacing

- **Surfaces**: "Pacing ~$X/mo" strip
- **Time base**: projected total for current calendar month
- **Derivation (S6 items 4+7)**: `days[lastDayOfMonth − 1].cumulativeRewardCost − days[firstDayOfMonth − 2].cumulativeRewardCost` rounded, clamped ≥ 0. The engine's deterministic projection of total reward cost across the entire calendar month. Equivalent to Spent MTD + projected remainder.
- **Engine source**: `days[i].cumulativeRewardCost` (engine runs to Day 90; lastDayOfMonth ≤ 61 for selectedDay ≤ 60, so always available).
- **Behavior**:
  - **Within a month**: Pacing is constant. The deterministic engine already knows where it'll land; without engine-side drift (planned in S7), there's no daily signal to react to. Pacing is a benchmark, not a journey — the chart underneath shows movement.
  - **Month boundary**: Pacing jumps when `selectedDay` crosses from one calendar month to the next (e.g., Day 30 → Day 31: $108K → $212K with default $150K budget). This IS the engine's honest forecast for the new month given current audience state.
  - **End of month**: at `selectedDay = lastDayN`, Pacing equals Spent MTD exactly (no projection left to add).
- **Known artifacts** (engine-side, will resolve when S7 lands):
  - **May overshoot**: with default $150K budget, the engine projects $212K for May because daily reward cost is not capped at `budget/30`; once audience scales (Day 31+), daily reward exceeds the $5K/day pace. Pacing surfaces this honestly. S7 (engine main-path refactor) is expected to enforce budget caps and audience pool capacity.
  - **31-day month variance**: even when capped, May has 31 days vs the engine's 30-day-basis budget — a fully on-track agent would still pace ~3.3% above budget in 31-day months. This is real-world honest, not a bug.
- **Status**: ✅ **S6 items 4+7 — fixed.** Was `(cumulativeSpend / selectedDay) × 30` which mechanically equaled Budget (cumulativeSpend = budget/30 × days). Strip stopped lying; now reflects engine's actual projected month-end spend.

### M1.5 Suggested change action

- **Surfaces**: `SuggestedChangeStrip`'s "Suggested change: {action}" text
- **Time base**: point-in-time (latest available recommendation at or before selected day)
- **Derivation**: scan `projection.agentRecommendations[]` from index `selectedDay − 1` back to 0, return the first non-null entry. Each entry was computed using only data ≤ that day (no future leakage).
- **Engine source**: `projection.agentRecommendations[]` (built in `projectionEngine.js` from `deriveAgentRecommendation(agentic.days.slice(0, idx + 1), params, budget)`).
- **Status**: ✅ **S2 — done.** Briefings layer + nameGenerator.js deleted.
- **Known gap (Item 3 pending)**: at any reasonable budget, `deriveAgentRecommendation` rarely surfaces a recommendation (the engine only proposes budget changes, and budget in the recommended range produces null). The strip is empty most of the time at default budget. Open product question on what to surface instead.

---

## Region 2 — Block 1 Left: KPI selector + hero chart

### M2.1–M2.4 KPI period values

For each KPI in {`activeUsers`, `cac`, `roi`, `fraudSaved`}:

- **Surfaces**: KPI card big number
- **Time base**: period-windowed
- **Derivation**: `computePeriodKPI(days, selectedDay, dateRange, key)` in `src/lib/metrics.js`. Per-key formulas listed in the "Period KPI formulas" sub-bullet below.
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
- **Derivation (S4, GA-style)**: `priorValue = computePeriodKPI(days, selectedDay − dateRange, dateRange, key)`; `deltaPct = ((value − priorValue) / priorValue) × 100`. Show delta whenever a prior period with positive value exists. Compute against whatever prior data is available (clipped at start of history is fine). Show 0% as 0% (don't hide). Return null only when there is literally no prior period (`selectedDay − dateRange < 1`) or `priorValue == 0`.
- **Status**: ✅ **S4 — done.** Always-visible delta with honest values; consistent UX across ranges.

### M2.9 Hero chart series — activeUsers

- **Surfaces**: line chart of daily active users
- **Time base**: daily resolution-time, windowed to `[startDay..endDay]` per the dateRange selector (S6.6)
- **Derivation**: `projection.dailyCurve[i]` for `i ∈ [startIdx..endIdx)` where `startIdx = startDay − 1` and `endIdx = endDay` (computed from `computeWindow(currentDay, dateRange)`).
- **Engine source**: `dailyCurve[i]` (length = engine horizon).
- **Status**: ✅ S6.6 — windowed to range selector.

### M2.10 Hero chart series — CAC (stacked bar)

- **Surfaces**: stacked bars per day, segments [referrer, referee]
- **Time base**: daily generation-time (cost incurred when offer is paid out), windowed to `[startDay..endDay]` per the dateRange selector (S6.6)
- **Derivation**: `days.slice(startIdx, endIdx).map(d => [d.dailyReferrerCost, d.dailyRefereeCost])` where `startIdx, endIdx` come from `computeWindow(currentDay, dateRange)`.
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

- **Time base**: period-windowed (S6 Item 2 close-out — was previously cumulative resolution-time)
- **Derivation**: `funnelCumulative.contacted @ selectedDay − funnelCumulative.contacted @ (startDay − 1)` where `startDay = max(1, selectedDay − dateRange + 1)`. Period sum of contacts over the visible window.
- **Why period-windowed**: aligns with KPI cards and audience chart (which are also period-aware). At Day 60 + 30d, "Contacted" reflects Days 31–60, not Days 1–60. Tied out with KPI activeUsers === funnel.Active at every (day × range) combo.
- **Status**: S1 cumulative → ✅ **S6 Item 2 close-out — period-windowed.**

### M3.2 Engaged

- **Time base**: period-windowed (derived from period-windowed Contacted and Referred)
- **Derivation (S3 onward)**: `Math.round((contacted + referred) / 2)` — structural midpoint between adjacent stages.
- At engine `baseShareRate = 0.55` this lands ~77% of contacted (close to the prior hardcoded 0.77 multiplier) but properly responds to engine state changes (efficiency lifts effective share rate → referred rises → midpoint shifts).
- Monotonic by construction: Contacted ≥ Engaged ≥ Referred always holds.
- **Status**: S1 — preserve hardcoded 0.77. ✅ **S3 — done.** Engine-derived midpoint, no magic constant.

### M3.3 Referred

- **Time base**: period-windowed (Item 2 close-out)
- **Derivation**: period delta of `funnelCumulative.referralSent` over the windowed range.
- **Status**: ✅ S6 Item 2 close-out — period-windowed.

### M3.4 Reached

- **Time base**: period-windowed (derived from period-windowed Referred and SignedUp)
- **Derivation (S3 onward)**: `Math.round((referred + signedUp) / 2)` — structural midpoint between adjacent stages.
- Reached now means "referrals that landed in front of the recipient" — strictly bounded by Referred above and SignedUp below.
- Monotonic by construction: Referred ≥ Reached ≥ SignedUp always holds. The impossible Reached > Referred state is structurally unreachable.
- **Status**: S1 — preserve buggy 1.4×. ✅ **S3 — done.** Midpoint replaces × 1.4. Funnel monotonicity invariant enforced and verified across all 30 days.

### M3.5 Signed Up

- **Time base**: period-windowed (Item 2 close-out)
- **Derivation**: period delta of `funnelCumulative.signedUp` over the windowed range.

### M3.6 Active User

- **Time base**: period-windowed (Item 2 close-out)
- **Derivation**: period delta of `funnelCumulative.activeUser` over the windowed range.
- **Invariant**: `KPI card.activeUsers === funnel.Active` at *every* (day × range) combo (verified in `verify-metrics.mjs §9.6`).

### Funnel monotonicity invariant (post-S3)

`Contacted ≥ Engaged ≥ Referred ≥ Reached ≥ SignedUp ≥ Active`

Holds by construction: Engaged and Reached are midpoints between adjacent engine-cumulative stages (which are themselves monotonically non-increasing through the funnel). Asserted in `verify-metrics.mjs` for every day in 1..60.

---

## Region 4 — Block 2 Left: Audience Overview

### M4.1–M4.3 Eligible bands (Advocates / Persuadable / Passive)

- **Surfaces**: stacked area
- **Time base**: point-in-time per day, series length = currentDay (windowed per dateRange selector)
- **Derivation (S6 Item 2 v3)**: `propensityHealth.highEligible / medEligible / lowEligible` from `computeAudienceModel`. Integrated observer of the engine funnel — every per-segment movement ties to engine cohort outputs.
- **Model**: bands shown = total per segment minus users currently blocked by `rest_period` guardrail. Per-day update:
  1. **Acquisition** → Advocate: external (`externalAcquisitionPerMonth / 30` per day, other-channel new active users) + internal (engine's `dailyFunnel.activeUser` — referees who transacted today).
  2. **Contacts** distributed across segments by `agentContactMix`. Contacts do NOT remove users from segment; just block them from re-contact for `rest_period` days.
  3. **Promotions** at engine "Referred" event: `dailyFunnel.referralSent` distributed across origin segments by `(agentContactMix × segmentEngageMultiplier)` weights. Promoted users move from origin → Advocate.
  4. **Demotions**: contacted-not-engaged subset (engaged ≈ midpoint(contacted, referred); per-segment non-engagement rate = 1 − engagement_rate × engageMultiplier_seg) added to demotion pool. Pool drains at `demotionMonthlyRate` (default 33%/mo). Adv→Per, Per→Pas, Pas→exits eligible.
- **Tied to engine via** (verified in `verify-metrics.mjs` §10):
  - Audience promotions over any period === engine cumulative `referralSent` over same period (hard equality, not approximate)
  - Audience internal acquisition over any period === engine cumulative `activeUser` over same period
  - At zero budget: zero promotions, zero internal acq (no contacts → no refers → no actives)
  - Higher budget grows Advocate band more than zero budget
- **Why this is integrated, not parallel**: every dashboard number derives from a single source — engine's funnel events. If the funnel says X people referred, the audience chart shows X new advocates. Same event, two views. No parallel math.
- **Config params** (`engineParams` in `config/neobank.js`):
  - `externalAcquisitionPerMonth`: 20000 (other-channel new active users → Advocate)
  - `segmentShares`: { high: 0.30, med: 0.45, low: 0.25 } (initial pool composition)
  - `agentContactMix`: { high: 0.65, med: 0.25, low: 0.10 } (contact priority)
  - `segmentEngageMultiplier`: { high: 1.30, med: 0.55, low: 0.20 } (engagement rate by segment; weighted avg ≈ 1.0 under contactMix)
  - `demotionMonthlyRate`: 0.33 (33%/mo of non-engaged subset → next-lower segment)
  - `min_tenure` guardrail default → 0 (rule remains configurable; no default waiting period for new active users)
- **Codex finding F (resolved)**: time series driven by real engine state + named tunable params. Out: hardcoded propensity multipliers (×2.2, ×0.85, ×0.35) and replenish factor. In: integrated bookkeeping with hard tie-outs to funnel events.
- **P17 (boundary cohorts) — resolved**: S5 extended engine to 90 days (60-day UI horizon + 30-day buffer). All cohorts fully resolve within the engine.
- **Status**: ✅ **S6 Item 2 v3 — done.** Integrated audience flow model. P5 + codex finding F resolved.
- **NOT in scope (deferred to S7+)**:
  - Engine main-path refactor (Michaelis-Menten supply curve untouched)
  - Engine respecting audience pool capacity (today: contact volume independent of pool depletion; OK in our budget range — 12–31% pool utilization at default to high budget)
  - Per-channel fatigue guardrails (push / email / SMS / in-app modeled separately)
  - Per-segment funnel intermediate stage rates (Engaged / Reached differentiation by segment)

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
- **Derivation**: `computeCampaignList(projection, effectiveDay)` in `metrics.js`. For each active campaign on Day N: `contactCount = round(dayData.journeysToday × campaign.share)` (campaign-card display only — not the same allocation as the Daily Outreach chart, which uses largest-remainder).
- **Engine source**: `src/fixtures/campaigns.js` owns identity (id, title, copy, color, weight, startsDay, endsDay). `metrics.js` reads `dayData.journeysToday` from the engine and the campaign's normalized share over active campaigns that day.
- **Status**: ✅ **S2 — done.** Roster stable. Colors locked to ID. nameGenerator.js deleted.

### M5.2 Daily Outreach stacked bar

- **Surfaces**: stacked bar per day, one segment per active campaign
- **Time base**: daily generation-time (contacts per campaign per day), windowed to `[startDay..endDay]` per the dateRange selector (S6.6)
- **Derivation (S6 Item 2 close-out)**: per-day **largest-remainder allocation**. For each day d in window:
  - `target = d.dailyFunnel.contacted` (engine's rounded daily total)
  - `rawShares` = each segment's share on day d (0 if campaign not active that day)
  - `exact = rawShares.map(s => target × s)`; `floors = floor(exact)`
  - Distribute remaining `target − Σ floors` to segments by largest fractional part
  - Result: integer per-campaign counts whose sum exactly equals `target` (no per-campaign rounding drift)
- **Color assignment**: each campaign carries its color in the fixture. Stack segments are ordered by fixture order (not lineup growth), so a campaign keeps its color whether it appears as segment 0 or segment 4.
- **Engine source**: `dailyFunnel.contacted` (the engine's authoritative daily contact count) + `src/fixtures/campaigns.js` for shares.
- **Tie-out invariants** (verified in `verify-metrics.mjs §11`):
  - Σ campaigns per day === `engine.dailyFunnel.contacted` at every day (hard equality)
  - Σ daily outreach across period === `funnel.Contacted` at every (day × range) combo
- **Status**: ✅ **S2** stable colors / fixture roster. ✅ **S6.6** windowed. ✅ **S6 Item 2 close-out** exact tie-out via largest-remainder.

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
- `days[]` — per-day records (length = engine horizon, currently 90 — UI horizon 60 + 30-day buffer for cohort maturation)
- `dailyCurve[]` — daily resolved per day (length = engine horizon, 90)
- `cohorts{}` — per-cohort tracking: contacted, totalReferralSent, totalSignedUp, totalResolved, convRate, cumulativeResolved, resolutionByDay
- `propensityHealth` — audience flow model output (highEligible/medEligible/lowEligible per day, plus `_totalPromotions` and `_totalInternalAcq` for tie-out tests)
- `effectivenessData` — daily conversion rate overlay (cohort-anchored)
- `staticBaseline` — engine's staticMode result, used by the M2.12 dashed line on the ROAS hero chart
- `agentRecommendation` (top-level, kept for back-compat) and `agentRecommendations[]` (per-day array used by M1.5 Suggested Change)
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
| 4 | Eligible bands | preserve | — | — | — | — | integrated audience model v3 (acquisition + promotion + demotion, ties to engine) |
| 4 | Conv rate overlay | preserve | — | pin definition | — | extension fixes truncation | — |
| 5 | Campaign list | preserve | stable roster fixture | — | — | — | — |
| 5 | Daily outreach | preserve | stable colors | — | — | — | — |
| 5 | Ops decomposition | preserve linear ramp | engine-derived follow-up rate | — | — | — | — |
| X | Day clamp | preserve | — | — | — | removed | — |

S1 produces `metrics.js` that mimics the current behavior exactly. Regression gate: pre-refactor snapshot equals post-refactor snapshot, byte for byte.
