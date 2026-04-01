# Step 1 Handover — Dashboard Wireframe & Initial Implementation

> This document summarizes what was accomplished in the first Claude Code conversation
> working on the engine-v4-spec plan. A new CC conversation should use this document
> + the original plan (docs/active/engine-v4-spec.md) to replan next steps.

Branch: `claude/dashboard-wireframe-LuE7a`
Date: 2026-03-31
Original plan: https://github.com/eduardofteixeira/demo-v2/blob/docs/engine-v4-spec/docs/active/engine-v4-spec.md

---

## What was accomplished

### Step 1: Dashboard Wireframe — DONE (exceeded scope)

The plan asked for a wireframe description + engine output schema. We went further and
built a working wireframe with real engine data. Key decisions made:

**Information architecture (locked):**
- 3-position narrative flow: Results → Learnings → Decisions
- Each position answers a question that raises the next:
  1. "What did I get?" → "Why are results improving?" → "What is the agent doing?"
- Full-width container (`px-6`, no `max-w` cap) — intentionally breaks the shared
  container convention for the dashboard only

**Position 1 — Results (top, one unified card):**
- KPI selector tabs (Active Users, CAC, ROI, Fraud Saved) controlling a hero chart
- Clicking a KPI tab shows that metric's 30-day trend
- Referral Funnel (vertical, FunnelChart component) — middle column
- Funnel Performance / cohort chart — right column
- Layout: 60% hero / 20% funnel / 20% cohort, side by side
- Y-axis on cohort chart shows % conversion rate (not raw numbers)
- One card wraps all elements, vertical dividers between columns

**Position 2 — Learnings (left column below):**
- Agentic vs Static comparison chart with milestone annotations
- Agent Insight card was created then DELETED (redundant with Live Decisions feed)
- All actionable insights now live in the Live Decisions feed

**Position 3 — Decisions (right column below):**
- Live Decisions feed as daily briefing with drill-down (see below)
- Guardrail Recommendation as separate card below the feed

**Live Decisions information architecture (locked, design doc approved):**
- Feed = agent decisions only (judgment). No guardrail events (deterministic).
- Daily briefing structure, not a flat log
- Default view: daily plan headline + collapsible category counts
- Click to drill into individual decisions with reasoning
- 5 agent decision types: daily_plan, contact, follow_up, holdback, guardrail_recommendation
- Scrollable history: all days up to selected day, most recent first, with date headers
- "Yesterday's learnings" category: what user actions taught the agent
- Guardrail recommendation: separate from feed, underneath it, with Approve/Dismiss buttons

**Annotations ↔ Daily shifts connection (locked):**
- Learning annotations on the Agentic vs Static chart (Day 8: signal, Day 10: value,
  Day 19: divergence) are connected to the Live Decisions daily plan shifts
- On annotation days, the strategy shift narrative matches the annotation's insight
- This creates a coherent story: the chart shows inflection points, the feed explains
  what operational decision caused each one

### Step 2: Update Guardrails Config — NOT DONE

We added a few config params to `neobank.js` (baseShareRate, signupRate,
industryCACBenchmark) but did NOT do the full guardrails update from the spec, **nor did we fully evaluate the if the existing guardarails are the must-have ones**:
- Filter percentages per audience protection rule
- Segment distribution (10/20/70 → 20/40/40)
- Base conversion rates per segment (High 4%, Medium 2%, Low 0.5%)
- Channel effectiveness multipliers per segment
- These are all defined in the spec but not implemented in the engine

**This is the next major step.** The current engine uses v3 parameters with v4
extensions bolted on. The spec's Section 2-3 guardrail definitions need to be
implemented properly, but **before implementation the logic needs to be stress-tested, as we did not fully evaluate the if the existing guardarails are the must-have ones.**

### Step 3: Build the Engine — PARTIALLY DONE (simplified)

**What exists (`src/engine/projectionEngine.js`):**
- `computeDashboardProjection()` extends v3 with: funnel stages, cohort tracking,
  static baseline, learning annotations, daily briefings
- Per-day data: funnelCumulative, kpiCumulative, efficiency, tierDistribution, etc.
- Cohort tracking: per-start-day resolution curves over 14 days
- Static baseline: same engine with efficiency locked at floor (no learning)
- Learning annotations: derived from actual engine data (signal threshold, tier
  optimization, value learning, divergence point)

**What exists (`src/engine/nameGenerator.js`):**
- `generateDayBriefing()` produces structured daily briefings
- 4 decision categories with reasoning: contacts, follow-ups, holdbacks, learnings
- Strategy shift narratives connected to learning annotations
- Conditional guardrail recommendation (Day 30 only, placeholder)

**What's oversimplified and needs proper implementation:**
- The engine is still the v3 projection model. It does NOT simulate the agent's
  daily loop as described in the spec's Section 5
- Customer segments (high/medium/low propensity) are NOT modeled — the engine
  uses a single blended conversion rate
- Channel effectiveness per segment is NOT modeled
- Message personalization / A/B testing is NOT modeled
- The decision generator produces synthetic decisions, not engine-derived ones.
  In the real engine, decisions should come FROM the simulation, not be generated
  separately
- Fraud detection is a flat percentage, not rule-based as spec describes
- Per-day schema (spec Section 7) with segment breakdowns is NOT implemented
- The "A/B testing machine" learning model (spec Section 6) is NOT implemented —
  current learning is a simple efficiency curve

**This is the biggest remaining work.** Steps 3a-3d from the spec need to be built
as described: pool/capacity, offer lifecycle, learning layer, daily decision log. **Before building, the logic needs to be stress-tested to ensure it's accuracy before implementation.**

### Step 4: Build the Dashboard — PARTIALLY DONE (wireframe level)

**What exists (`src/pages/DashboardPage.jsx`):**
- Working dashboard with all 3 positions rendering real engine data
- Day selector (Day 1/10/20/30) updates all positions
- KPI selector tabs controlling hero chart
- FunnelChart component (vertical bars with sqrt scaling)
- Chart component (standardized, with cssHeight support for flexible sizing)
- Cohort chart with % Y-axis and legend
- Agentic vs Static comparison chart with annotations
- Live Decisions feed with daily briefing structure and drill-down
- Guardrail Recommendation card below feed

**What exists (components, from another CC conversation):**
- `src/components/Chart.jsx` — standardized chart with series, legend, cssHeight,
  annotations, markers, tooltips. HTML text overlays for consistent 11px sizing.
- `src/components/FunnelChart.jsx` — vertical funnel with sqrt bar scaling

**What needs design polish:**
- Final visual polish pass on all components
- Responsive behavior (currently optimized for ~1440px viewport)
- The cohort chart + funnel share a narrow 40% column and may need height adjustment
- Design system compliance check against DESIGN.md
- Final design polish in general — the current wireframe is good enough to build the evolve the plan, but it's not the final, polished version. 

---

## Open Problems (identified but not solved)

These were identified during the wireframe work and deferred to separate CC conversations:

### 1. Campaign-Level Summary (from Step 2d)

The dashboard has no campaign-level summary. The funnel shows 424K → 36K contacted
(8.4%) and a Head of Growth asks "why so few?" The daily plan explains today's slice
but not the 30-day strategy. A proper campaign-level summary is needed.

**Status:** Prompt written for a separate CC conversation. Not implemented.

### 2. Cohort vs Cash-Basis Reconciliation (from Step 2e)

The cohort chart is the only non-cash-basis element. Reconciling it with cash-basis
KPIs is hard for users. The cohort rate should either reconcile with cash-basis for
the user, forecast cash-basis results, or both.

**Status:** Combined with the campaign-level summary problem. Prompt written for a
separate CC conversation. Not implemented.

### 3. Pipeline Indicator (from Step 2f)

"303 offers in flight" was removed from the funnel (caused a visual bug). It currently
doesn't appear anywhere. The pipeline is the bridge between cash-basis and cohort views.
Its home depends on where the campaign-level summary lands.

**Status:** Deferred to the same conversation as problems 1 and 2.

---

## Key Files Modified

| File | What changed |
|------|-------------|
| `src/pages/DashboardPage.jsx` | Full dashboard with 3-position narrative layout |
| `src/engine/projectionEngine.js` | `computeDashboardProjection()` with v4 extensions |
| `src/engine/nameGenerator.js` | `generateDayBriefing()` with 5 decision types + reasoning |
| `src/config/neobank.js` | Added baseShareRate, signupRate, industryCACBenchmark |
| `src/components/Chart.jsx` | Standardized chart (done in separate CC conversation) |
| `src/components/FunnelChart.jsx` | Vertical funnel (done in separate CC conversation) |
| `DESIGN.md` | Renamed from DESIGN_GUIDELINES.md, added chart/funnel specs |

## Design Documents

- Live Decisions IA design doc: `~/.gstack/projects/eduardofteixeira-demo-v2/root-claude-dashboard-wireframe-LuE7a-design-20260331-195155.md`

## What to Do Next

1. **Replan**: understand what was the original goal and plan; compare with what is already done; and replan. The original plan didn't intend to be a static, gigantic plan. It was a first guideline. 
2. **Solve the campaign-level summary + cohort reconciliation + pipeline indicator**
   (one connected problem, prompts already written)
3. **Update guardrails config** (Step 2 of the plan — filter percentages, segment
   distribution, per-segment conversion rates and channel effectiveness)
4. **Rebuild the engine** (Step 3 of the plan — the real agent simulation with
   segments, daily loop, offer lifecycle, proper learning model)
5. **Final design polish** on the dashboard after engine produces real data
