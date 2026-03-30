# Engine v4 Spec — Agent-Based Projection Engine

> Source of truth for the projection engine rebuild and dashboard data requirements.
> The engine simulates an AI agent that makes daily decisions about referral outreach.
> Every number in the demo must be traceable to a rule, a decision, or a learning.

---

## 1. Core Concept

The engine is **not a calculator**. It simulates an **AI agent** that operates a referral program daily. Each day, the agent:

1. Decides **who** to create new offers for
2. Decides **what reward** to assign each offer
3. Decides **which channel** to use (SMS, Push, Email, In-App Banner)
4. Manages **outstanding offers** (follow-ups, reminders)
5. **Learns** from results and adjusts strategy

The guardrails are the agent's **rulebook** — they define what it CAN and CANNOT do. The budget is the agent's **spending limit**. The learning is the agent's **intelligence** — what makes it better than a human running the program manually.

---

## 2. Customer Segments

Three segments based on referral propensity (0–100% probability scale):

| Segment | Description | Characteristics |
|---------|-------------|-----------------|
| **High propensity** | Likely to refer with minimal nudge | Engaged, high tenure, high NPS, active in-app |
| **Medium propensity** | Needs the right offer/timing | Moderate engagement, responds to incentives |
| **Low propensity** | Needs strong incentive to convert | Low engagement, rarely opens comms, needs high reward |

**No one is "non-viable"** if they pass the eligibility filters. Everyone has a probability. The agent's job is to learn these probabilities and allocate efficiently.

**Day 1**: Agent doesn't know who belongs where. Treats everyone as medium.
**Day 30**: Agent has a model. Knows segments, allocates accordingly.

### Segment sizing (demo assumptions for 847K total customers)

These percentages should be defined in config and are approximate:

- Eligible after audience protection filters: ~50% → ~424K
- Of eligible: ~25% high propensity, ~50% medium, ~25% low
- Agent discovers this distribution over time (starts with uniform assumption)

---

## 3. Guardrails → Engine Effects

### 3.1 Audience Protection (WHO can be contacted)

These are **hard exclusions**. The agent cannot override them.

| Filter | Default | Engine effect |
|--------|---------|---------------|
| Opted-out users | Always excluded (locked) | Removes from eligible pool |
| Low NPS | Score ≤ 6 excluded | Removes from eligible pool |
| Active support tickets | Excluded | Removes from eligible pool |
| Fraud-flagged accounts | Excluded | Removes from eligible pool |
| Compliance holds | Excluded | Removes from eligible pool |
| Account too new | < 60 days excluded | Removes from eligible pool |
| Inactive accounts | > 90 days no activity excluded | Removes from eligible pool |

**For the demo**: Each filter removes a percentage of the total customer base. These percentages are config values. Changing a filter threshold (e.g., NPS from 6 to 4) changes the eligible pool size, which flows through to all downstream calculations.

**Missing guardrail?** Consider: "Recently contacted by another campaign" — avoids conflicting with other marketing efforts.

### 3.2 Customer Fatigue (HOW people are treated)

These constrain the agent's **outreach frequency**.

| Rule | Default | Engine effect |
|------|---------|---------------|
| Max touchpoints per stage | 2 | Agent can contact each person max 2 times while they're in a given funnel stage |
| Minimum rest period | 2 days | Must wait 2 days between touchpoints to same person |
| Offer window | 14 days | Offer expires after 14 days. Person re-enters pool (with cooldown?) |

**Daily contactable capacity** is derived from these rules:
- Each person occupies a "slot" for up to `offer_window` days
- During that window, they can receive up to `max_touchpoints` messages, spaced by `rest_period`
- After expiry (no conversion), person re-enters the eligible pool

**Key question resolved**: When an offer expires, the person goes back to the pool. The agent can issue a new offer with a potentially different reward and strategy. This is the "shift without confusing the user" mechanism.

**In-App Banner has its own fatigue**: Banner space competes with other in-app messaging. The agent must respect banner-specific frequency limits.

### 3.3 Financial Controls (HOW money is controlled)

These constrain the agent's **daily spending**.

| Rule | Default | Engine effect |
|------|---------|---------------|
| Daily invite cap | Auto (derived from budget) | Max new offers per day. Prevents front-loading. |
| Max outstanding offers | budget × 2 | Hard limit on total $ exposure from unexpired offers. Pauses if hit. |
| Spend anomaly pause | daily_pace × 5 | Emergency brake if conversions spike suspiciously. |

**Daily invite cap** is the ad-network daily budget cap. It equals `remainingBudget / remainingDays` adjusted by conversion expectations.

**Max outstanding offers** constrains total exposure: if many offers are outstanding (issued but not yet converted or expired), the agent slows down to avoid over-committing the budget.

### 3.4 Fraud Prevention (deterministic rules, NOT for the agent)

These are **payment-layer rules**. The agent doesn't make fraud decisions — the system catches fraud at conversion/payment time.

| Rule | Default | Engine effect on projection |
|------|---------|---------------------------|
| Self-referral blocker | Standard | Reduces fraudulent conversions (modeled as % of conversions rejected) |
| Suspicious escrow | 3 in 24h → hold 7 days | Delays payment (not modeled in 30-day projection) |
| Link hijacking limit | 5 per link | Caps payouts per referral link |
| Network & botnet shield | Aggressive | Reduces fraudulent conversions |

**Fraud saved** = conversions rejected by these rules × avg reward. This is now grounded in actual rules, not a flat percentage of budget.

### 3.5 Safeguards (KILL SWITCH — external)

Not modeled in the engine. This is a manual override for when something goes wrong. The dashboard should show it exists (trust signal), but the projection doesn't simulate it.

---

## 4. The Offer Lifecycle

```
ELIGIBLE POOL
    │
    ▼
[Agent selects customer] ──→ NEW OFFER CREATED
    │                         • Reward tier assigned (from pre-approved options)
    │                         • Channel selected (SMS/Push/Email/In-App)
    │                         • Personalized message crafted
    │                         • Offer window starts (14 days)
    │
    ▼
OFFER OUTSTANDING ◄──────── Agent manages follow-ups
    │                         • Has customer shared? → different follow-up
    │                         • Hasn't shared? → reminder via different channel
    │                         • Max touchpoints and rest period respected
    │                         • Cannot change reward mid-offer
    │
    ├──→ CUSTOMER SHARES referral link
    │         │
    │         ▼
    │    REFEREE FUNNEL
    │         │ Sign-up → KYC → First Transaction (reward trigger)
    │         │ Agent tracks progression, acts on funnel events
    │         │
    │         ├──→ CONVERSION (referee hits reward trigger)
    │         │         • Referrer + referee both get rewards
    │         │         • Fraud check at payment
    │         │         • Referrer may re-enter pool as higher-propensity
    │         │
    │         └──→ DROP-OFF (referee abandons funnel)
    │                   • Offer still open for referrer to share again
    │
    └──→ OFFER EXPIRES (14 days, no conversion)
              • Customer re-enters eligible pool
              • Agent can issue new offer with different strategy
              • Learnings from this offer inform next attempt
```

### What counts as a "conversion"

Referee completes the reward trigger (first transaction for neobank). This is when the cost is incurred.

### Shares we don't see

P2P sharing (word of mouth, screen share, etc.) is invisible. We track: link copied, link shared via tracked channels, referee click, sign-up, KYC, transaction. Some conversions will appear "from nowhere" — that's organic lift from the program.

---

## 5. The Daily Loop

Each day, the agent executes this cycle:

### Step 1: Assess available pool

```
availablePool = eligiblePool
              - customersWithOutstandingOffers
              - customersInCooldownAfterExpiry
              - customersAtFatigueLimit
```

### Step 2: Determine daily capacity

```
dailyNewOfferCap = min(
  financialControls.dailyInviteCap,           // financial guardrail
  availablePool × maxDailyReachRate,           // pool constraint
  outstandingOffersHeadroom                    // max outstanding $ guardrail
)
```

### Step 3: Score and rank available customers

Agent ranks customers by expected ROI:
```
expectedROI(customer) = P(conversion | segment, channel, reward) × revenuePerConversion
                      - rewardCost × P(conversion)
```

Day 1: P(conversion) is uniform estimate. Ranking is near-random.
Day 15: P(conversion) is segment-informed. Ranking is data-driven.

### Step 4: Allocate offers (confidence-driven)

```
offersToday = min(dailyNewOfferCap, confidenceTarget)

confidenceTarget = maxCapacity × currentEfficiency
```

Low confidence → fewer offers (learning, testing).
High confidence → more offers (scaling what works).
Daily budget cap is the hard ceiling.

For each offer:
- Assign segment-optimal reward tier (from pre-approved tiers)
- Select channel based on segment (high propensity → in-app banner; low → push/SMS)
- Generate personalized message variant (for A/B testing)

### Step 5: Manage outstanding offers

For each outstanding offer:
- Check funnel status (shared? referee signed up? etc.)
- If touchpoints remaining and rest period satisfied → send follow-up
- Select follow-up channel (may differ from initial)
- Personalize follow-up message based on status

### Step 6: Process conversions

- Referees who hit reward trigger today → count as conversions
- Apply fraud rules (reject suspicious ones)
- Pay rewards (or escrow if flagged)
- Converted referrers → may re-enter pool with higher propensity score

### Step 7: Learn and re-plan

- Update segment models: which profiles converted?
- Update channel effectiveness: which channel worked for which segment?
- Update reward efficiency: which tier converted which segment?
- Update message effectiveness: which variant performed better?
- **Do NOT plan for the full remaining period** — plan only tomorrow based on today's learnings

### Step 8: Record daily log

Output a rich decision record for the dashboard (see Section 7).

---

## 6. The Learning Model

### What the agent learns

The agent runs like an **A/B testing machine**. It clusters customers, tests varied strategies, measures results, and optimizes.

| Variable | Day 1 (no data) | Day 30 (learned) |
|----------|----------------|-------------------|
| **Who converts** | Uniform probability across segments | Segment-specific conversion rates |
| **Best reward per segment** | Blended average tier | Optimized: Tier 2 for high propensity, Tier 4 for low |
| **Best channel per segment** | Even distribution | High propensity → in-app banner; Low → push/email |
| **Message effectiveness** | Random variant | Winning variants identified per segment |

### How learning works mechanically

```
efficiency(day) = effFloor + (1 - effFloor) × learningFactor(day)

learningFactor(day) = f(cumulativeConversions, daysSinceStart)
```

The learning affects:
1. **Conversion rate**: improves as agent targets better customers
2. **Tier efficiency**: decreases average reward cost as agent stops over-rewarding easy converts
3. **Channel mix**: shifts to higher-performing channels per segment

### Learning constraints

- Agent only learns from **resolved outcomes** (conversions, expirations)
- Offers in flight don't provide signal until they resolve
- Learning is **gradual** — no single day produces a revolution
- Agent re-plans daily, not long-term — short feedback loops

### What makes this "Why Vincor, not DIY"

A manual referral program would:
- Send the same reward to everyone (no tier optimization)
- Use one channel for all (no channel selection)
- Never learn who converts (no targeting improvement)
- Never test messages (no A/B optimization)

The dashboard must show the **delta** between "what a static program would produce" vs "what the agent produces." This is the ROI of intelligence.

---

## 7. Dashboard Data Requirements

The engine must output a **daily decision log** that the dashboard consumes.

### Per-day output schema

```javascript
{
  day: 12,

  // Pool state
  eligiblePool: 424000,
  availableToday: 389000,       // after fatigue, outstanding, cooldown
  outstandingOffers: 35000,

  // Agent decisions
  newOffersCreated: 2800,
  followUpsSent: 1200,

  // Segment breakdown
  segments: {
    high:   { offers: 1400, tier: 'Tier 2', channel: 'in-app',  convRate: 0.042 },
    medium: { offers: 1000, tier: 'Tier 3', channel: 'push',    convRate: 0.025 },
    low:    { offers: 400,  tier: 'Tier 4', channel: 'email',   convRate: 0.012 },
  },

  // Outcomes
  conversions: 85,
  fraudRejected: 3,
  offersExpired: 180,

  // Financials
  rewardsPaid: 7200,
  remainingBudget: 142000,
  dailyCap: 8500,
  capHit: false,                // true when agent wanted to spend more but was capped

  // Learning
  efficiency: 0.52,
  topInsight: "High-tenure customers convert 3.2x better via in-app banner",
  tierShift: "Moved 15% of medium segment from Tier 3 to Tier 2 (same conv rate, lower cost)",
  channelShift: "Push → in-app for high segment (+18% open rate)",

  // Cumulative
  cumulativeUsers: 890,
  cumulativeSpend: 58000,
  cac: 65,
  roi: 2.8,
}
```

### Dashboard "Why Vincor" moments

The dashboard should highlight these insights over the 30-day period:

1. **"The agent stopped wasting Tier 4 on customers who would convert with Tier 2"**
   → Show: avg reward cost decreasing from $95 → $78 over 30 days

2. **"The agent found that in-app banners convert 2x better for engaged customers"**
   → Show: channel mix shifting, conversion rate improving

3. **"The agent identified that 60% of your conversions come from 20% of your customer base"**
   → Show: segment concentration, targeting precision improving

4. **"A static program would have acquired 1,200 users. The agent acquired 2,200."**
   → Show: side-by-side comparison, same budget, intelligence vs no intelligence

5. **"The agent respected your fatigue rules while maximizing output"**
   → Show: no customer contacted more than 2x, 2-day rest periods maintained, yet conversions grew

---

## 8. What's Missing / Needs Resolution

### Guardrails to add or refine

- [ ] **Post-expiry cooldown**: When an offer expires, how long before the person can receive a new offer? Currently undefined.
- [ ] **Channel-specific fatigue**: In-app banner competes with other in-app messaging. Separate fatigue rules per channel? Or one global limit?
- [ ] **Cross-campaign exclusion**: "Recently contacted by another campaign" — should the agent respect other marketing activities?
- [ ] **Reward trigger definition**: Currently "first transaction." Should this be configurable? (e.g., KYC completion, first deposit, etc.)

### Engine parameters to define

- [ ] Filter percentages for each audience protection rule (what % of 847K does each filter remove?)
- [ ] Segment distribution assumptions (currently proposed: 25/50/25 — needs validation)
- [ ] Base conversion rates per segment (before learning)
- [ ] Channel effectiveness multipliers per segment
- [ ] Learning speed parameters (how fast does the agent improve?)

### Dashboard questions

- [ ] Do we show the static vs agent comparison on the dashboard? Or is it implicit?
- [ ] How granular should the daily log be? Per-segment per-channel per-day? Or summary level?
- [ ] Should the dashboard show individual "decisions" or aggregate patterns?

---

## 9. Execution Plan

### Principle: Dashboard-first, engine-scoped-by-what's-shown

The dashboard is the product. The engine exists to feed the dashboard. We design the dashboard first, then build only the engine data the dashboard actually needs. No over-engineering, no under-engineering.

**No open-ended validation checkpoints.** Each step has a hard deliverable and a done-when. Build, test, commit, move on. If something feels wrong later, fix it then — not before.

---

### Step 1: Dashboard wireframe

Design what the user sees. This scopes everything else.

- Propose 3-5 dashboard sections with rough content
- For each section: what data it shows, what "aha moment" it delivers
- List exactly what data the engine must output for each section
- **Done when**: data requirements list is written down. That list IS the engine scope.
- **Deliverable**: wireframe description + engine output schema

### Step 2: Update guardrails config

Lock the rules that constrain the engine.

- Update `neobank.js` guardrails with filter percentages (what % each filter removes)
- Add missing guardrails from Section 8
- Remove or fix guardrails that don't make sense
- **Done when**: config is committed. Eligible pool can be computed from filters.
- **Deliverable**: updated `neobank.js`, committed

### Step 3: Build the engine

Build the engine to produce the data the dashboard needs (from Step 1). Built in layers, each committed independently:

**3a — Pool and capacity**: Eligible pool from filter chain. Daily contactable capacity from fatigue rules. Outstanding offers tracking.
- **Done when**: changing a guardrail value changes the pool/capacity numbers. Committed.

**3b — Offer lifecycle and daily funnel**: New offers, follow-ups, expirations, conversions. Budget pacing (ad network model).
- **Done when**: engine produces a 30-day daily funnel. Sum of daily = total users. CAC = budget / users. Committed.

**3c — Learning layer**: Segment discovery, tier optimization, channel mix improvement. Confidence-driven pacing.
- **Done when**: daily curve shows learning ramp. Day 1 < Day 30. Committed.

**3d — Daily decision log**: Rich per-day output matching the schema from Step 1.
- **Done when**: engine output matches what the dashboard needs. Committed.

### Step 4: Build the dashboard

Consume the engine's daily logs. Show the intelligence story. Answer "Why Vincor, not DIY?"

- **Done when**: dashboard page renders with real engine data. Committed.
