# Vincor Demo — Number Consistency Plan
Branch: `demo-numbers`
Source: 19-problem inventory (Class A cohort maturation, Class B parallel data sources, Class C period & boundary, Class D viz, plus 8 originals).
Constraint: front-end is non-negotiable. Engine doesn't need to be perfect. Demo must remain interactive.
Outside voice (Codex GPT-5.4) ran and found 11 plan-level gaps; 4 substantive tensions resolved with the user, several locked as side-fixes.

## CURRENT STATE — Session handoff (2026-04-27)

**Branch state**: `demo-numbers`, 13 commits ahead of `main`, clean working tree, pushed to origin.

**Stages 1–5 complete and visually QA'd by user**:
- S1 — Foundation (`d049d9a`)
- S2 — Numeric side channels eliminated (`8f3de5b`)
- S3 — Funnel monotonic, ROI/fraud sensible (`a730237` + `cb0cbc7`)
- S4 — Period & boundary handling (`c01b9e6` + `0ef78f0` + `ed74c8e`)
- ROAS uses real reward cost (`6f84f03`)
- Spent uses real reward cost; Pacing deferred (`1153289`)
- S5 — Engine extended to 90 days, UI horizon 60 (`9bde8bd`)

**S6 in progress** — consolidated final stage with 12 items. **2 of 12 complete**:
- ✅ Item 1 — Static-Rules ROAS plumbed + rule cleaned (`9046ed1`, `3051fc3`). Static now = agentic with eff locked at effFloor only. Day 1 parity holds.
- ✅ Item 6 — Chart axes windowed to range selector + tick-step Y-axis (`a3a86d6`).

**Verified state**:
- `npm run verify-metrics`: 94/94 passing
- `npm run snapshot:diff`: identical to `scripts/snapshots/post-s5.json`
- `npx vite build`: clean

**Where we left off**: Item 1 and Item 6 done. Next 1:1 discussion is **Item 2 — Audience pools (P5 + codex finding F)**. User wants 1:1 walkthrough: I bring proposal, user decides, I execute. **Do not bundle items**.

## S6 Items — full status

The following 12 items are S6's complete scope (everything previously deferred is folded in). Walk one at a time.

| # | Item | Status |
|---|---|---|
| 1 | Static-Rules ROAS line | ✅ done (`9046ed1` + `3051fc3`) |
| 2 | Audience pools (P5 + codex finding F) | ✅ done — v3 integrated model with hard tie-outs to engine |
| 3 | Day 1–~18 SuggestedChange empty under default budget (P13) | pending — needs UX decision |
| 4+7 | Calendar-aware Pacing + health-bar semantics (bundled) | ✅ done (`3f08de4`, PR #155) — DAY_ONE = April 1 2026; Spent MTD + projected-month-end Pacing; engine date-agnostic |
| 5 | Additional day stops (40, 50) | pending |
| 6 | X-axis tied to range selector + tick-step Y-axis | ✅ done (`a3a86d6`) |
| 8 | CAC chart Day 1 readability (P18) | ❌ deferred — already in §"NOT in scope"; was a duplicate listing |
| 9 | Briefings null silent vanish (P19) | pending — verify-and-dismiss only (folded into #12) |
| 10 | Re-verify cohort decisions post-S5 (M4.4) | pending — verification only |
| 11 | Final METRIC_MODEL.md read-through | pending |
| 12 | Final `/qa-only` regression sweep + totality sweep | pending |

**S6 net items remaining**: 7 (was 10 — Items 4+7 bundled & shipped; Item 8 deferred to backlog).

## Item 2 — locked spec v3 (2026-04-27, integrated audience model)

> **Supersedes** the prior v1 lock (cooldown-bucket model, available+inFlow bands, decay-based segment movement). v3 makes the audience model an integrated observer of the engine's funnel — three views (Audience / Funnel / Outcomes) of one flow, no parallel narratives.

### The model in plain language

**Three propensity segments**: Advocate, Persuadable, Passive. Initial composition 30/45/25 of the eligible base (~424k).

**Pool grows two ways** (both → Advocate):
- **External acquisition**: 20k/month (acquired new active customers from outside channels, e.g. paid media, organic; they've already had the AHA moment).
- **Internal acquisition**: each new "Active" event from the funnel (referee transacted) → Advocate.

**Pool shrinks one way**:
- **Passive exits eligible**: only via demotion below — opted-out, churned, deeply disengaged.

**Segments move via two events**:
- **Promotion** at funnel "Referred" event: a contacted user who *sends a referral* (regardless of whether the referee converts) → moves to Advocate.
- **Demotion** at the drop-off from "Contacted" to "Engaged": of the *contacted-not-engaged subset*, 33%/month move down one segment. Adv→Per, Per→Pas, Pas→exits. Never-contacted users don't decay.

**Bands shown** = total per segment *minus* users currently blocked by fatigue guardrails (rest_period, max_touchpoints per stage, campaign window). All numbers from the guardrails config — no hardcoded numbers.

### Why this is integrated, not parallel

The audience model is a *faithful observer* of engine outputs. Every cross-chart number ties out:
- Audience promotions over period = engine "Referred" delta over same period.
- Audience internal acquisition over period = engine "Active" delta over same period.
- Audience demotions per segment over period are derived from engine's per-cohort (Contacted − Engaged).

If the funnel says X people referred, the audience chart will show X new advocates. Same event, two views.

### Files touched

| File | Change |
|---|---|
| `src/engine/projectionEngine.js` | Replace current `computeAudienceModel` with v3 (segment bookkeeping driven by engine cohort outputs; no internal cooldown bucket) |
| `src/config/neobank.js` | Update params (see below). Set `min_tenure` guardrail default to 0. |
| `scripts/verify-metrics.mjs` | Replace Item-2 invariants with new tie-out tests |
| `scripts/snapshots/post-s6-item2.json` | Regenerate (intentional — bands shift) |
| `docs/METRIC_MODEL.md` | Rewrite §M4.1–M4.3 to reflect v3 |

### Config params

```
externalAcquisitionPerMonth: 20000              // → Advocate
segmentShares:               { adv: 0.30, per: 0.45, pas: 0.25 }   // initial pool composition
agentContactMix:             { adv: 0.65, per: 0.25, pas: 0.10 }   // contact priority
segmentEngageMultiplier:     { adv: 1.30, per: 0.55, pas: 0.20 }   // splits engaged/refer/active across segments; weighted avg ≈ 1.0 under contactMix
demotionMonthlyRate:         0.33               // 33%/mo of non-engaged subset → next-lower segment
```

`min_tenure` guardrail default: `60 → 0`. Rule remains configurable; default is "no waiting period." (User-confirmed: 60 was unintended; should default off.)

### Tie-out tests in verify-metrics.mjs

1. **Band non-negativity**: every (day × segment) is `≥ 0`.
2. **Day-1 composition**: bands match `totalEligible × segmentShares` ± rounding.
3. **Promotion tie-out**: sum of audience-model promotions over any period = engine's "Referred" delta over same period (within 1% rounding tolerance).
4. **Internal acquisition tie-out**: sum of audience-model internal acquisitions = engine's "Active" delta over same period.
5. **Demotion sanity**: zero budget → zero promotions → zero demotions (no contacts → no non-engagement). Pool grows only from external acq.
6. **Pool conservation**: `total(t) = total(0) + (external + internal acquisitions) − (Pas exits)`. No contact-driven losses.
7. **Window invariant preserved**: bands length matches dateRange at all (day × range) combos including clipped windows.

### Expected snapshot impact

Bands intentionally shift again (this is the third regeneration of `post-s6-item2.json`). Directional expectations to verify after running:
- **Advocate** band trends *up* over 60 days (external + internal acquisition feed it; demotion takes only from non-engaged subset)
- **Persuadable** band drifts based on Adv decay arriving + Per decay leaving + no inflow now
- **Passive** band shrinks slowly via Pas-exit
- **Total pool** grows roughly linearly from acquisition; budget level affects only the segment composition, not the total

### NOT in scope (Item 2)

- Engine main-path refactor (Michaelis-Menten supply curve untouched; engine's contact/refer/signup/active math unchanged).
- Per-segment funnel intermediate stage rates (Engaged, Reached differentiation by segment).
- Visualizing fatigue-blocked users as a separate state on the chart.
- Showing campaign-specific outreach views beyond what already exists.

### Failure modes

| Mode | Test? | Handling | Visible? |
|---|---|---|---|
| Demotion produces negative band | Verify-metrics #1 | `Math.max(0, ...)` clamp | No |
| Audience promotion ≠ engine Referred | Verify-metrics #3 | Hard fail (CI) | Yes |
| External acq dominates at low budget (Advocate explodes) | Spike-test post-build | Calibrate `externalAcquisitionPerMonth` | Subtle visual |
| Demotion rate too aggressive (segment empties) | Verify-metrics #1, spike-test | Calibrate `demotionMonthlyRate` | Visible |

### Out-of-the-build calibration loop (after first build, before commit)

After implementation, re-run the multi-budget spike test (zero / 50K / 150K / 300K / 500K) and check:
- Advocate band trajectory across budgets — does higher budget visibly grow Advocates faster?
- Total pool growth rate — does it feel like a believable 2026 neobank?
- Demotion volume — are non-engaged users shrinking the segments at a plausible rate?

Tune params (likely `externalAcquisitionPerMonth`, possibly `agentContactMix` and `demotionMonthlyRate`) until business story is honest. Document final values in METRIC_MODEL.md.

### Estimated effort

- Engine rewrite: ~90 min
- Config + verify-metrics tests: ~30 min
- Snapshot regen + docs: ~15 min
- Calibration loop: ~30 min
- Total: ~3 hours work, single session.

## Item 5 — Live operations animation (2026-04-28, locked spec)

> Re-scoped from "add Day 40, 50 stops" to a real animation feature. Goal: dashboard tells the operations story in motion, not as a still snapshot.

### What changes for the user

**1. Dashboard plays itself on arrival.** User lands → animation starts at Day 1 → progresses to Day 60 over **90 seconds** → stops. No play button, no speed controls.

**2. Day selector replaced.** Today: four buttons (Day 1 / 10 / 30 / 60). New: a continuous **day slider** spanning 1–60 with a "Day N" legend showing the current day.

**3. Within each day** (1.5 seconds), three visual beats reflect how operations actually unfold:
- **Beat 1 (0.0–0.5s)** — Audience bands move + Daily Outreach bar grows + Funnel "Contacted" updates. **All synced.** Top-of-funnel event from three views.
- **Beat 2 (0.4–1.25s)** — middle funnel stages flow as a wave: Engaged → Referred → Reached → SignedUp, each starting ~0.15s after the previous.
- **Beat 3 (1.15–1.5s)** — Funnel "Active" + all KPI cards + Hero chart update. **All synced.** Bottom-of-funnel = outcomes, same event.

**4. Manual day-slider touch stops animation at that day.** User can then freely scrub. No auto-resume.

**5. Budget slider change restarts animation from Day 1** with new numbers. Clean restart, no splicing.

**6. At Day 60: stops and stays there.** No looping.

### What does NOT change

- Engine math: untouched. Animation is purely a UI reveal of existing engine outputs.
- Numbers shown on any given day: identical to today. We're just unveiling them in motion.
- All other dashboard interactions (KPI selector, period selector, drawers).
- Snapshot tests: the final state at Day 60 should match the current Day 60 snapshot byte-for-byte.

### Files touched (engineering-only — user can skip)

- `src/pages/DashboardPage.jsx` — animation state machine + day slider component + transition coordination.
- Likely chart components (`StackedAreaChart.jsx`, `FunnelChart.jsx`, `StackedBarChart.jsx`, `Chart.jsx`) — staggered transition timing per beat.
- `docs/METRIC_MODEL.md` §MX.1 — note slider replaces buttons.

### Tests

- New verify-metrics: nothing breaks (all existing 105 tests still pass; final-day numbers unchanged).
- New behavioral checks: animation increments day over time; manual slider stops it; budget change restarts; halts at Day 60.
- Snapshot at Day 60 unchanged.

### Risks (eng-review refinements baked in)

- **Animation jank**: 60 day-transitions × multiple chart re-renders. At 0.67Hz day-stepping, no concern.
- **Chart transitions**: current chart components render fixed values, no value tweening. Solved via centralized interpolation in DashboardPage (computes per-beat interpolated values from prev-day → current-day, passes to charts as plain data — charts stay dumb).
- **HeroChart re-mount footgun**: `key={selectedKPI-currentDay}` would force a fresh mount each day, killing animation continuity. Fixed: drop `currentDay` from the key, keep `selectedKPI` only.
- **Timer drift over 90s**: avoid `setInterval`. Use `requestAnimationFrame` with absolute time math (`elapsed = now − animationStart`). Self-correcting.
- **Slider source ambiguity**: distinguish animation-driven vs user-driven `selectedDay` updates via a ref (`sourceRef.current = 'animation' | 'user'`). User-touch clears the animation timer.
- **Budget change reset**: useEffect on `[budget]` resets animation state to Day 1 + restarts.
- **StrictMode double-mount in dev**: cleanup function in useEffect cancels prior RAF loop.
- **Tab backgrounded**: browser throttles RAF; deferred (acceptable for demo, not a blocker).

### NOT in scope

- Sub-day numerical animation. The engine produces whole-day numbers; we animate the *appearance* of those numbers in 3 beats. We don't simulate intra-day micro-events.
- Pause / play controls beyond touching the slider.
- Speed adjustment.
- Looping back to Day 1.
- Mid-animation budget splice (we chose the restart approach).
- Adding extra day stops 40, 50 (the original scope of Item 5 — replaced by the slider, which spans every day).

### Effort

~3–5 hours, including animation polish and tests.

## Item 2 close-out plan (2026-04-27)

**Goal**: every dashboard number cohort-traceable and exactly tied. After this work, picking any day and following the cohort through the funnel uses real engine numbers, not aggregate-ratio estimates.

### Step 1 — Per-cohort funnel tracking
Engine today tracks per-cohort: `contacted`, `cumulativeResolved`, `totalResolved`, `convRate`. Extend so each cohort also tracks `totalReferralSent` and `totalSignedUp` (events attributable to it).

**Attribution method (refinement from eng-review)**: proportional cohort allocation. Each day's aggregate funnel event (referralSent, signedUp) is distributed across cohorts proportional to `cohort.contacted` weight at the time the cohort was opened. Aggregate ties out exactly to engine cumulative totals. No timing-distribution approximation needed for the trust use case (which cares about per-cohort totals, not day-by-day timing within the cohort).

**Horizon edge (documented)**: cohorts contacted in the late portion of the engine simulation (e.g., Day 80+) may have funnel events resolving past Day 90 (engine horizon). Their totals will under-count. Cohorts within the UI horizon (Days 1–60) are unaffected since the engine extends to Day 90.

**File**: `src/engine/projectionEngine.js` (cohort state during simulation loop). New per-cohort accumulators: `cohort.totalReferralSent`, `cohort.totalSignedUp`.

**Verification (refined)**: 4 verify-engine invariants:
1. Σ `cohort.totalReferralSent` across all cohorts === engine cumulative `referralSent` at horizon
2. Σ `cohort.totalSignedUp` across all cohorts === engine cumulative `signedUp` at horizon
3. **Per-cohort sanity**: `cohort.totalReferralSent ≤ cohort.contacted` for every cohort
4. **Per-cohort sanity**: `cohort.totalSignedUp ≤ cohort.totalReferralSent` for every cohort
5. **Edge case**: zero-contacted cohort → all stages zero (no divide-by-zero or NaN)

### Step 2 — Daily-outreach rounding fix (per-day allocation)
Replace independent per-campaign rounding with per-day largest-remainder allocation: each day, sum of campaign contacts === engine's `dailyFunnel.contacted` exactly; campaigns split that total without independent rounding.

**File**: `computeDailyOutreach` in `src/lib/metrics.js`.

**Verification (refined)**: 2 verify-metrics invariants:
1. Σ campaigns at every day === `engine.dailyFunnel.contacted` at that day (hard equality, all 60 days)
2. **Edge case**: day with zero active campaigns → zero allocation (no division-by-zero in largest-remainder)

The Σ-period === funnel.Contacted at every (day × range) tie-out follows from invariant #1.

### Step 3 — Refresh validation walkthrough
Update `.context/validate-numbers.html` with REAL per-cohort numbers for Day 20 (not aggregate-ratio estimates). All five funnel stages cohort-traceable end-to-end.

### Step 4 — Tie-out invariants
verify-metrics.mjs additions:
- Σ daily outreach === funnel.Contacted at every (day × range) (Step 2)
- Σ across cohorts of cohort.totalReferralSent at Day N === engine cumulative referralSent at Day N (Step 1)
- Σ across cohorts of cohort.totalSignedUp at Day N === engine cumulative signedUp at Day N (Step 1)

KPI activeUsers === funnel.Active already verified (existing test).

### Step 5 — Commit Item 2 v3 + close-out

### Files touched
- `src/engine/projectionEngine.js` (Step 1)
- `src/lib/metrics.js` (Step 2)
- `scripts/verify-engine.mjs` (Step 1 invariants)
- `scripts/verify-metrics.mjs` (Step 2 + Step 4 invariants)
- `scripts/snapshots/post-s6-item2.json` (regenerate after Step 2)
- `docs/METRIC_MODEL.md` (note per-cohort tracking)
- `.context/validate-numbers.html` (refresh with real cohort numbers)

### Out of scope
- S7 (engine main-path refactor — segments cause outcomes; daily outreach pulled from audience pool capacity). Separate stage; starter prompt at `.context/s7-starter-prompt.md`.
- Channel modeling.
- Per-segment funnel intermediate stages (Engaged/Reached differentiation by segment).

### Risk
Step 1 touches engine cohort state. New invariants protect against regressions; verify-engine should still pass (additive change, no math modification). Step 2 is local to metrics.js, low risk.

### Effort
~75–90 min.

## Eng review additions (2026-04-27)

Second-pass eng review of the S6 scope flagged the following gaps. Each is folded
into the relevant item below.

**Per-item additions:**
- **Item 2** — fixture must be length 90 (engine horizon), not 60 (UI horizon), to
  survive a future engine extension. Add bands-sum invariant to verify-metrics.mjs:
  at every day, advocates+persuadable+passive ≈ totalEligible ± 1 (rounding).
  Confirm window-length invariant still holds post-fixture (Day 60×30d, Day 60×7d,
  Day 5×30d clipped).
- **Item 3** — the "Day 30 empty" framing was wrong. With default budget ($150K)
  and `minSignalVolume = 100`, the strip is empty Days 1–~18, not just Day 30.
  Fix needs an explicit UX decision: (a) show a "still learning" placeholder for
  pre-significance days, or (b) leave the strip absent and treat that as honest.
  Pick one before walking. New invariant: SuggestedChangeStrip renders something
  for every day in 1..60, OR is intentionally hidden by a documented rule.
- **Items 4+7 (bundled)** — engine has no calendar input today. Decision before
  walking: (i) add a `currentDate` param to engine, OR (ii) compute Pacing in
  metrics.js using a calendar helper + `dayData.cumulativeRewardCost`. Add a
  REGRESSION test: pacing must not equal budget mechanically (today's bug). Add
  coherence invariant: at well-paced steady-state, period-Spent normalized to
  monthly ≈ Budget ≈ Pacing.
- **Item 5** — extend snapshot grid and verify-metrics day sweep to include Day
  40 and Day 50 under all dateRanges. No new logic, but the coverage extension
  is part of the item.
- **Item 9** — collapse to a single verify-metrics check ("Block 2 Right renders
  at every day×range combo") and dismiss. Fold into Item 12.
- **Item 10** — verify convRate overlay is monotonic non-decreasing at Day 60
  (no truncation kink). Spot-check from snapshot suggests this passes already
  post-S5; confirm and document.
- **Item 12** — add a *totality sweep* to verify-metrics.mjs: every metric
  section (kpiCards, funnel, audienceOverview, campaignList, dailyOutreach,
  suggestedChange, campaignHealth) is non-null at every (day, range) combo
  in 1..60 × {7, 30}. This catches future P13/P19-class regressions.

**Cross-cutting**: items 3, 4+7, 5 all touch DashboardPage.jsx. They serialize
naturally — no parallel worktrees needed for the rest of S6.

## Workflow (locked)

User explicitly chose this workflow at S6 kickoff:
- Items walked **one at a time, 1:1**.
- For each item: agent brings proposal with options, trade-offs, recommendation. **Wait for user decision before executing.**
- Don't bundle multiple items. Don't make unauthorized scope expansions (lesson from S4 polish).
- After execution: short QA prompt, user confirms, move to next item.

## Important guardrails (from session)

- **Front-end is non-negotiable**. Don't change visual layouts/charts without explicit approval. (S4 polish unauthorized CAC chart change was reverted in `ed74c8e`.)
- **Don't ship approximations we'd refactor.** User explicitly rejected option A for Pacing in S4 because it would have been refactored later.
- **Listen for "we don't know what the rule is"** — user expects me to read engine code and explain rules clearly, not assume. (Item 1 had this — explained the engine's staticMode rule before plumbing.)
- **Skip verbose summaries.** User asked: "no need to keep saying [what's not changed]" — concise QA prompts only.
- `.context/` is gitignored (Conductor convention). Plan and notes here survive within the workspace but not via git.

## Stage map

```
S1 ─ Foundation: metric model + derivation module + widened snapshot gate
   │
   ▼
S2 ─ Numeric side channels eliminated (campaign roster, follow-up, ops, dead generators)
   │
   ├─────┬─────┬─────┐
   ▼     ▼     ▼     ▼
S3      S4   S5    (parallel after S2)
Funnel  Per/ Day 60+
KPI tie boun budget recalib
        dary
   │     │     │
   └─────┴─────┴────┐
                    ▼
                   S6 ─ Recommendations & polish
```

Each stage independently shippable + verifiable. S3/S4/S5 can run in parallel worktrees after S2 lands.

---

## Stage 1 — Foundation

**Goal**: every visible number routes through a single derivation module. No behavioral change yet.

**Scope**
- Write `docs/METRIC_MODEL.md`. For every visible number: meaning, time-base (resolution-time vs cohort-anchored — hybrid per metric), derivation formula, edge-case policy (display "—" when insufficient data), domain note (cost flows through conversion, not contact, so CAC well-defined whenever any user has activated).
- Build `src/lib/metrics.js`. Pure functions. JSDoc points at METRIC_MODEL.md sections. Inputs: engine projection + fixtures + day + period. Outputs: every displayed metric.
- Refactor `src/pages/DashboardPage.jsx`. Remove all hardcoded multipliers (0.77, 1.4, 0.35, 0.7). All numbers read from `metrics.js`. `useMemo` at component top.
- Add `scripts/verify-metrics.mjs` matching `verify-engine.mjs` pattern.
- **Two-phase snapshot gate** (widened):
  - Pre-refactor: capture every visible number across the WHOLE dashboard at Days 1, 10, 30, 60 × all 4 KPIs × all date ranges. Includes: KPI cards, hero chart, funnel stages, audience bands, conversion overlay, campaign cards, daily outreach chart, recommendation strip, spent/pacing strip, lifecycle bands. Includes known-buggy values (Day 60 == Day 30 clamp, funnel monotonicity violations) — labeled as such.
  - Post-refactor: regenerate. Diff must be empty.
  - Subsequent stages: each fix replaces specific snapshot entries with intentional new values.
- Side fix: `verify-engine.mjs:128` audience check is wrong — correct it.

**Verification gate**
- `npm run verify-metrics` passes
- Snapshot diff empty
- Manual QA: dashboard at 4 day stops × 4 KPIs × 3 date ranges, byte-identical to pre-refactor screenshots

**Out of scope for S1**: no behavior changes. Refactor only.

---

## Stage 2 — Numeric side channels eliminated

**Goal**: `metrics.js` is the only source of UI-consumed numbers. Delete parallel truths.

**Scope**
- Stable campaign roster fixture: `src/fixtures/campaigns.js`. Fields: `id`, `name`, `color`, `weight`, `startsDay`, `endsDay`. Stable across days; no name-generator-driven churn.
- `nameGenerator.js` decoupled from numeric output. Campaign contact counts come from `metrics.js` (engine totals × stable weights), not heuristic weights in nameGenerator.
- Follow-up rate redefined: function of engine state (`efficiency`, `unresolvedCohortSize`), not `(day/30) × 0.35`. Documented in METRIC_MODEL.md.
- Operations decomposition wired through: `newContacts + followUps ≡ daily total` invariant honored in metrics.js and verified.
- **Delete dead narrative generators**: `briefings.contacts`, `briefings.learnings`, `briefings.followUps`, `briefings.holdbacks`, `briefings.conversions`, the `shifts` array, `buildContactReasoning`, `channelInsights`. None of these surface in the dashboard. Their generation in `nameGenerator.js` is a fabricated-numbers landmine.
- Day 30 recommendation strip: replace hardcoded "$50 credit outperforms $75 credit, 3.2x better, $12k/mo savings" with engine's `agentRecommendation`, **constrained to data ≤ selected day** (no future leakage).

**Verification gate**
- Invariants in `verify-metrics.mjs`: campaign IDs stable across days; weights sum to 1.0; `newContacts + followUps ≡ ops.total`.
- Visual: same campaign carries same color from Day 1 to Day 60.
- Code: grep for fabricated numeric strings in nameGenerator.js returns nothing.

---

## Stage 3 — Funnel & KPI tie-out

**Goal**: solve P1, P7, P9, P10, P11. Numbers across the funnel and KPI cards reconcile.

**Scope**
- Engine exposure: extend `dayData` per-day record with `effectiveShareRate` and `qualityFactor` (~5 LOC in projectionEngine.js).
- Funnel stages defined with monotonic non-increasing chain:
  - Contacted = engine cumulative
  - Engaged = Contacted × `effectiveShareRate` (real engine value, not 0.77)
  - Referred = engine cumulative
  - Reached redefined as something downstream of Referred (e.g., "referrals delivered to recipient" — fraction of Referred, not 1.4×)
  - SignedUp = engine cumulative
  - Active = engine cumulative
- Conversion rate overlay: pinned definition in METRIC_MODEL.md. Cohort-anchored terminal rate (so the line reflects targeting quality, not maturation).
- KPI tie-out: `KPI card.activeUsers` reads from same `metrics.js` function the funnel reads from. Same for CAC denominator.
- Hero chart vs KPI card: both compute from the same time-base per metric (documented).

**Verification gate**
- Invariant: `Contacted ≥ Engaged ≥ Referred ≥ Reached ≥ SignedUp ≥ Active` for every day in 1..60.
- Equality: `KPI card.activeUsers === sum(funnel.daily.activeUser)` over period.
- Manual QA: switch between KPIs at Day 30, verify hero chart aggregates to KPI card value.

---

## Stage 4 — Period & boundary handling

**Goal**: solve P15, P16, P17. Edge cases display "—" honestly.

**Scope**
- Prior-period delta returns `null` (UI shows "—") when prior window < dateRange.
- Period window labels reflect actual window when clipped (e.g., "7d (showing 3d)" at Day 3).
- Lifecycle bands handle horizon-edge cohorts honestly (after S5, with engine to 90, this resolves naturally).

**Verification gate**
- Sweep: Days 1..60 × dateRanges × KPIs. Zero NaN. Zero Infinity. No deltas with denominator < dateRange.

---

## Stage 5 — Day 60 horizon + budget recalibration

**Goal**: solve P2. Day 60 shows real differentiated data.

**Scope**
- Hardcoded `30` purged across `projectionEngine.js:109, 208, 447, 807, 1097` and `DashboardPage.jsx:550`. Replace with `params.horizonDays` (default 90).
- Engine MAX_DAYS extended: 30 → 90. UI horizon stays 60.
- **Budget semantics locked**: budget renews monthly. `dailySpend = budget / 30` continues; cumulative spend at Day 60 = 2× monthly budget. Spend strip and Pacing strip continue showing monthly rate.
- **Codex finding #9 fix**: `budgetRealizationFactor` in `neobank.js:162` was calibrated for 30 days. Recalibrate for the new horizon, OR confirm via verify-engine that current value still produces plausible curves at 60/90.
- Spike-first: try the extension; if late-day numbers go weird, fall back to derivation extrapolation for Day 31–60. Decision branch documented at start of S5.

**Verification gate**
- `runProjection({ horizonDays: 90 })` produces no NaN at any day.
- KPI curves: cumulative monotonic, daily within plausible bounds.
- Day 60 selected ≠ Day 30 selected.
- Spike eyeball: Days 30, 45, 60, 75, 89 — plausible terminal values, no oscillation.
- Budget invariant: `cumulativeSpend(60) ≈ 2 × cumulativeSpend(30)` ± realization factor.

---

## Stage 6 — Recommendations & polish

**Goal**: solve P5, P6, P12, agentRecommendation tie-up.

**Scope**
- **P5 audience pools**: locked as decoration. Pool sizes from `src/fixtures/audiencePools.js`. **But also**: codex finding #5 — the audience time series is driven by depletion coefficients in `projectionEngine.js:1055`, not just pool composition. Either move the time series fully to fixtures (decoration), OR document that the engine drives the time series and pool sizes are decoration-only on top. Decision in S6: probably move the whole chart to fixture-driven for cleanliness.
- **P6 conversion rate**: definition pinned in METRIC_MODEL.md (cohort-anchored, terminal). Already done in S3 — S6 is final review.
- **P12 static baseline**: plumb real `runSimulation({ staticMode: true })` result through `metrics.computeStaticBaseline`. Remove `× 0.7` placeholder.
- **agentRecommendation**: now consumed by Day 30 strip per S2. S6 finalizes by ensuring it's also constrained to ≤ selected day everywhere it might surface (defense in depth).
- Final manual QA pass.

**Verification gate**
- Static baseline line ≠ agentic × 0.7 (placeholder removed).
- agentRecommendation never references future days when surfaced at any selected day.
- Audience pool sums to 100% at every day; matches stated "decoration" framing.

---

## NOT in scope (explicit deferrals)

- **P18** — CAC stacked-bar hero chart unreadable below Day ~7. Visualization issue, not data consistency. Reason: not blocking the demo's number story. Add to follow-up backlog.
- **P19** — Block 2 Right vanishes silently if briefings null. Robustness, not consistency. After S2 deletes most briefing structure, this is moot or trivial. If still relevant after S2, defer.
- **Engine recalibration beyond budgetRealizationFactor** — if S5's spike reveals deeper engine issues at 60/90 days, derivation extrapolation is the fallback, not engine rework.
- **TypeScript / test framework introduction** — project uses verification scripts; matching that idiom keeps diff minimal.
- **Visual design changes** — this plan touches no styling, no layout, no copy beyond removing fabricated numbers.

### Deferred (added during S4 QA, awaiting separate planning)

- **Calendar-aware Pacing.** The "Pacing ~$X/mo" strip should reflect:
  (i) current calendar month length (28/29/30/31), (ii) days actually
  elapsed in this calendar month, (iii) projected reward cost for remaining
  calendar days. The engine has projection capability (strategy page uses
  it) but binding it to a real calendar month + handling the engine's
  variable horizon (S5 lifts to 90 days) is its own design effort.
  Not touched in S4 to avoid shipping an approximation we'd refactor.
- **Additional day stops** (e.g., 40, 50 between current 30 and 60).
  Tied to the same calendar/horizon question as Pacing. Not urgent;
  flagged for the same separate plan.
- **Dynamic X-axis on charts beyond Day 30.** Already partially solved:
  S5's engine extension to 90 days will let `dayXTicks(effectiveDay)`
  produce Day 1..60 labels naturally. Verify in S5 QA.
- **Static-Rules ROAS line — improve the rule.** Currently the dashed
  "Static Rules" line on the ROAS hero chart is computed as
  `agenticValue × 0.7`, a placeholder. The engine already runs
  `runSimulation({ staticMode: true })` and exposes the result as
  `projection.staticBaseline`, but the UI ignores it. S6 plumbs the real
  staticMode result through. Confirmed user-requested at S4 close.
- **X-axis tied to 7d/30d range selector.** Currently the X-axis on hero
  chart, audience overview, and daily outreach goes from Day 1 to selectedDay.
  Should instead show the *visible window* matching the range selector:
  - Day 60 + 30d range → X-axis Days 31..60
  - Day 60 + 7d range → X-axis Days 54..60
  - Day 30 + 30d range → X-axis Days 1..30 (current behavior)
  Applies to all 3 dashboard charts. Affects how data is sliced AND how
  X-labels render. Coupled to the health-bar question below.
- **Health-bar coherence with windowed view.** If the X-axis becomes
  range-windowed, the health-bar's three metrics need consistent semantics:
  - Spent: already period-windowed (consistent with new X-axis)
  - Budget: monthly value (independent of selector — stays as-is?)
  - Pacing: also monthly basis — needs the calendar-aware refactor
    (already deferred above)
  Plan together with the X-axis windowing change so the dashboard tells
  one coherent story.
- **Re-verify cohort decisions post-S5.** S3 pinned the conversion-rate
  overlay definition as "cohort terminal rate" (cumulative resolutions ÷
  contacted, over 14-day cohort window). S5 extended engine to 90 days,
  which should eliminate the truncation artifact for cohorts up to Day 60.
  Re-walk the M4.4 definition and visual after S5 to confirm the line
  reflects targeting quality without cohort-maturation artifacts.

---

## What already exists (don't rebuild)

- Engine primitives (`contacted`, `referralSent`, `signedUp`, `activeUser`, `cohortConvRate`, `efficiency`, `effectiveShareRate`) — correct, just expose what's internal
- `runSimulation({ staticMode: true })` — already runs, ignored by UI (S6 plumbs it)
- `agentRecommendation` — computed but unused (S2 surfaces it constrained)
- `verify-engine.mjs` pattern — `check()` helper, pass/fail, exit code; reuse for `verify-metrics.mjs`
- All UI components (Day selector, KPI selector, hero chart, funnel, audience stack, campaign cards) — built; refactor reads from new module

---

## Worktree parallelization

| Stage | Depends on | Module footprint | Parallel-safe |
|---|---|---|---|
| S1 | — | `src/lib/`, `src/pages/DashboardPage.jsx`, `scripts/`, `docs/` | No (foundation) |
| S2 | S1 | `src/engine/nameGenerator.js`, `src/fixtures/`, `src/lib/metrics.js` | No (depends on S1, modifies metrics.js) |
| S3 | S2 | `src/engine/projectionEngine.js` (small), `src/lib/metrics.js`, `src/pages/DashboardPage.jsx` (funnel section) | Yes after S2 |
| S4 | S2 | `src/lib/metrics.js`, `src/pages/DashboardPage.jsx` (KPI/period section) | Yes after S2 |
| S5 | S2 | `src/engine/projectionEngine.js` (broad), `src/config/neobank.js`, `src/pages/DashboardPage.jsx` (constants) | Conflicts with S3 (both touch projectionEngine.js) |
| S6 | S2 | `src/lib/metrics.js`, `src/pages/DashboardPage.jsx` (recommendations + audience) | Yes after S2; conflicts with S4 (both touch DashboardPage.jsx) |

**Execution order**:
- Lane 1 (sequential): S1 → S2
- Lane 2 (parallel after S2): S3 (engine + funnel) and S4 (period/boundary) — minor DashboardPage.jsx merge work
- Lane 3 (after S5 lands or in parallel with S3 if engineer is careful): S5
- Lane 4 (after S2, can overlap with S4): S6

**Conflict flags**: S3 + S5 both touch `projectionEngine.js`. S4 + S6 both touch `DashboardPage.jsx` recommendation/period sections. Coordinate or sequence those pairs.

---

## Failure modes (per stage)

| Stage | Realistic failure | Test? | Error handling? | User-visible? |
|---|---|---|---|---|
| S1 | Snapshot regression diff non-empty | ✓ verify-metrics | yes (gate fails) | no — gate fails before merge |
| S2 | Campaign weights drift, total ≠ engine total | ✓ invariant | yes | no |
| S3 | Funnel violates monotonicity at edge day | ✓ invariant | yes | no |
| S4 | NaN slips through period sum | ✓ sweep | display "—" | yes — explicit "—" |
| S5 | Engine produces oscillating curves at Day 80+ | ✓ spike | fallback to derivation | no (fallback) |
| S6 | Audience pool sum ≠ 100% | ✓ invariant | yes | no |

No critical gaps (no failure mode without both test and error handling).

---

## Resolved cross-model tensions

| Tension | Resolution |
|---|---|
| A — Budget semantics at Day 60+ | Budget renews monthly. Day 60 = 2 months of spend. (S5) |
| B — nameGenerator parallel numeric source | S2 reordered to be prerequisite to S3 onward. |
| C — Snapshot gate captures bugs as truth | Two-phase gate. Pre-refactor includes known bugs. Stages explicitly fix labeled entries. |
| D — Briefing fabricated numbers | Most are dead code; delete in S2. Only Day 30 strip surfaces; replace with constrained agentRecommendation. |

## Locked side-fixes (no separate decision)

- Constrain `agentRecommendation` to data ≤ selected day (no future leakage)
- Recalibrate `budgetRealizationFactor` for 90-day horizon in S5
- Fix `verify-engine.mjs:128` wrong audience check in S1
- Address audience time-series depletion coefficients in S6 (pool decoration is bigger than just sizes)

---

## Completion summary

- **Step 0 Scope Challenge**: scope reduced — P18, P19 deferred; P5 = decoration
- **Architecture Review**: 6 issues, 4 with explicit decisions (locked), 2 trivial (locked without question)
- **Code Quality Review**: 2 decisions (doc location, edge case display) — locked A/A
- **Test Review**: coverage diagram produced; verify-metrics.mjs adopted as project idiom; widened two-phase snapshot gate as S1 critical regression test
- **Performance Review**: no issues
- **Outside Voice (Codex)**: ran; 11 findings; 4 substantive tensions resolved with user; 4 side-fixes locked
- **NOT in scope**: P18, P19, engine deep recalibration, TypeScript intro
- **What already exists**: engine primitives, staticMode, agentRecommendation, verify pattern
- **Parallelization**: 4 lanes, S1→S2 sequential, S3/S4/S6 parallel after S2 with flagged conflicts

---

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | — |
| Codex Review | `/codex review` | Independent 2nd opinion | 1 | issues_found | 11 findings, 4 tensions resolved + 4 side-fixes locked |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | clean | 8 issues across sections, all resolved or locked |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | — | — |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | — |

**VERDICT:** ENG CLEARED — ready to implement. Recommend running implementation in stage order; do not start S2 before S1's snapshot gate is green.
