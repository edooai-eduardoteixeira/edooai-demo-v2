/**
 * Decision generator for the Live Decisions feed.
 * Produces a daily briefing structure, not a flat log.
 *
 * 5 agent decision types (judgment only, no guardrail events):
 *   daily_plan  — campaign-level briefing for the day
 *   contact     — agent contacted a customer (4 sub-decisions: message, tier, channel, timing)
 *   follow_up   — agent sent a follow-up within fatigue constraints
 *   holdback    — agent decided NOT to contact (with re-entry timing)
 *   recommendation — agent suggests changing a guardrail based on data
 */

const FIRST_NAMES = [
  'Gina', 'David', 'Sarah', 'Marcus', 'Elena', 'James', 'Priya', 'Carlos',
  'Michelle', 'Ryan', 'Aisha', 'Tyler', 'Kenji', 'Laura', 'Andre', 'Nina',
  'Omar', 'Rachel', 'Wei', 'Sofia', 'Daniel', 'Megan', 'Raj', 'Hannah',
  'Luis', 'Emma', 'Tariq', 'Julia', 'Nathan', 'Yuki', 'Alexandra', 'Ben',
  'Fatima', 'Chris', 'Ingrid', 'Sean', 'Amara', 'Patrick', 'Lena', 'Victor',
  'Tanya', 'Keith', 'Zara', 'Greg', 'Maya', 'Tom', 'Diana', 'Aaron',
];

const LAST_INITIALS = [
  'M', 'K', 'L', 'R', 'S', 'T', 'P', 'W', 'J', 'C',
  'B', 'N', 'D', 'G', 'H', 'F', 'A', 'V', 'Z', 'O',
];

const MESSAGE_APPROACHES = [
  'social proof', 'reward-led', 'urgency', 'personal milestone', 'community',
];

// Simple seeded PRNG (mulberry32)
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickName(rng) {
  return `${FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)]} ${LAST_INITIALS[Math.floor(rng() * LAST_INITIALS.length)]}.`;
}

function pickTime(rng) {
  return { hour: 8 + Math.floor(rng() * 10), minute: Math.floor(rng() * 60) };
}

function pickChannel(rng) {
  const r = rng();
  return r < 0.40 ? 'push' : r < 0.72 ? 'email' : r < 0.90 ? 'sms' : 'in-app';
}

function pickTier(rng, tierDistribution) {
  if (!tierDistribution) return 0;
  const roll = rng();
  let cum = 0;
  for (let i = 0; i < tierDistribution.length; i++) {
    cum += tierDistribution[i];
    if (roll < cum) return i;
  }
  return 0;
}

// ─── Contact reasoning ───────────────────────────────────────────────
function buildContactReasoning(rng, { channel, tierIndex, hour, minute }) {
  const nps = 7 + Math.floor(rng() * 3);
  const tenure = 90 + Math.floor(rng() * 400);
  const pastReferrals = Math.floor(rng() * 4);
  const txLast30 = 2 + Math.floor(rng() * 8);
  const channelRate = 40 + Math.floor(rng() * 35);

  const whyPerson = pastReferrals > 0
    ? `${pastReferrals} prior referral${pastReferrals > 1 ? 's' : ''}, NPS ${nps}, ${txLast30} transactions in last 30 days`
    : `NPS ${nps}, ${txLast30} transactions in last 30 days, ${tenure}-day tenure`;

  const whyChannel = `${channel} — ${channelRate}% open rate for this segment`;

  const tierReasons = [
    'organic candidate, no incentive needed',
    'light incentive, moderate propensity',
    'standard incentive, reward drives conversion',
    'max incentive, high LTV justifies cost',
  ];

  return `${whyPerson}. ${whyChannel}. Tier ${tierIndex + 1}: ${tierReasons[tierIndex] || tierReasons[0]}.`;
}

// ─── Follow-up reasoning ─────────────────────────────────────────────
function buildFollowUpReasoning(rng, { channel, funnelStage }) {
  const daysSince = 1 + Math.floor(rng() * 4);
  const stageText = funnelStage === 'link_shared'
    ? `link shared ${daysSince}d ago, referee hasn't signed up`
    : `no referral shared after ${daysSince}d`;
  return `${stageText}. ${channel} follow-up — rest period cleared, within touchpoint limit (2 of 2 per stage).`;
}

// ─── Holdback reasoning ──────────────────────────────────────────────
function buildHoldback(rng, { day }) {
  const reasons = [
    () => {
      const ticketDay = Math.max(1, day - Math.floor(rng() * 5));
      return {
        reason: `Open support ticket since Day ${ticketDay}`,
        reasoning: `Active support case opened Day ${ticketDay}. Audience protection: customers with open tickets excluded. Will re-evaluate when ticket closes.`,
        reenter: 'When ticket closes',
      };
    },
    () => {
      const nps = 3 + Math.floor(rng() * 3);
      return {
        reason: `NPS score ${nps} — below threshold`,
        reasoning: `NPS ${nps}, below configured threshold of 6. Contacting detractors risks brand damage. Excluded until next NPS survey.`,
        reenter: 'Next NPS survey',
      };
    },
    () => {
      const daysAgo = 1 + Math.floor(rng() * 2);
      return {
        reason: `Contacted ${daysAgo}d ago — rest period`,
        reasoning: `Last contacted ${daysAgo} day${daysAgo > 1 ? 's' : ''} ago. Fatigue guardrail: 2-day minimum rest between touchpoints. Next eligible: Day ${day + (2 - daysAgo)}.`,
        reenter: `Day ${day + (2 - daysAgo)}`,
      };
    },
    () => ({
      reason: 'Compliance hold active',
      reasoning: 'Compliance hold on this account. All marketing paused until hold is lifted.',
      reenter: 'When hold is lifted',
    }),
    () => ({
      reason: 'Active offer in flight',
      reasoning: 'Customer has an unexpired referral offer (sent 3 days ago). Max 1 outstanding offer per customer. Will re-enter if offer expires.',
      reenter: 'When current offer resolves',
    }),
  ];
  return reasons[Math.floor(rng() * reasons.length)]();
}

// ─── Strategy shift narratives ───────────────────────────────────────
function buildStrategyShift(rng, { day, efficiency }) {
  if (day <= 1) return 'Initial targeting: broad exploration across all eligible segments.';
  if (day <= 5) return 'Early data collection. Broad targeting with slight bias toward high-NPS customers.';

  const shifts = [
    `High-tenure segment (+${Math.floor(rng() * 15 + 5)}% allocation) after Day ${day - 1} showed ${(1.5 + rng()).toFixed(1)}x conversion rate for 6+ month customers.`,
    `Shifted channel mix: push notifications up ${Math.floor(rng() * 10 + 8)}% — outperforming email ${(1.8 + rng() * 0.5).toFixed(1)}x for customers with 5+ monthly transactions.`,
    `Tier 1 (organic) allocation increased to ${Math.floor(15 + rng() * 10)}% — identified ${Math.floor(500 + rng() * 2000)} customers who convert without incentive.`,
    `Targeting accuracy at ${Math.round(efficiency * 100)}% (up from 30% baseline). Concentrating outreach on segments with highest observed conversion rates.`,
    `Morning send window (9-11am) showing ${Math.floor(rng() * 20 + 15)}% higher open rates. Reallocating ${Math.floor(rng() * 30 + 20)}% of daily contacts to this window.`,
  ];
  return shifts[Math.floor(rng() * shifts.length)];
}

/**
 * Generate a daily briefing with categorized decisions.
 *
 * Returns: {
 *   dailyPlan: { ... },
 *   contacts: [ ... ],
 *   followUps: [ ... ],
 *   holdbacks: [ ... ],
 *   conversions: [ ... ],
 *   recommendation: { ... } | null,
 * }
 */
export function generateDayBriefing({ day, dayData, prevDayData, seed = 42, tierDistribution }) {
  const rng = mulberry32(seed * 10000 + day * 777);

  const contactCount = dayData?.journeysToday || 1788;
  const eligibleCount = dayData?.funnelCumulative?.contacted
    ? Math.round(dayData.remainingPool + contactCount)
    : 423500;
  const budgetToday = dayData?.cumulativeSpend
    ? Math.round((dayData.cumulativeSpend - (prevDayData?.cumulativeSpend || 0)))
    : 5000;
  const efficiency = dayData?.efficiency || 0.3;

  // Daily plan
  const dailyPlan = {
    contactCount,
    eligibleCount,
    budgetToday,
    strategyShift: buildStrategyShift(rng, { day, efficiency }),
  };

  // Sample contacts (~12)
  const sampleContactCount = Math.min(12, Math.max(4, Math.round(contactCount * 0.007)));
  const contacts = [];
  for (let i = 0; i < sampleContactCount; i++) {
    const tierIndex = pickTier(rng, tierDistribution);
    const channel = pickChannel(rng);
    const time = pickTime(rng);
    const messageApproach = MESSAGE_APPROACHES[Math.floor(rng() * MESSAGE_APPROACHES.length)];
    contacts.push({
      id: day * 1000 + i,
      name: pickName(rng),
      channel,
      tierIndex,
      tierLabel: `Tier ${tierIndex + 1}`,
      messageApproach,
      ...time,
      reasoning: buildContactReasoning(rng, { channel, tierIndex, ...time }),
    });
  }

  // Follow-ups (~4)
  const followUps = [];
  const followUpCount = day >= 2 ? Math.min(4, Math.max(1, Math.round(sampleContactCount * 0.3))) : 0;
  for (let i = 0; i < followUpCount; i++) {
    const channel = pickChannel(rng);
    const time = pickTime(rng);
    const funnelStage = rng() > 0.4 ? 'link_shared' : 'no_share';
    followUps.push({
      id: day * 1000 + 100 + i,
      name: pickName(rng),
      channel,
      funnelStage,
      funnelStageLabel: funnelStage === 'link_shared' ? 'Link shared, referee inactive' : 'No referral shared yet',
      ...time,
      reasoning: buildFollowUpReasoning(rng, { channel, funnelStage }),
    });
  }

  // Holdbacks (~3)
  const holdbacks = [];
  const holdbackCount = Math.min(3, Math.max(1, Math.round(sampleContactCount * 0.25)));
  for (let i = 0; i < holdbackCount; i++) {
    const time = pickTime(rng);
    const hb = buildHoldback(rng, { day });
    holdbacks.push({
      id: day * 1000 + 200 + i,
      name: pickName(rng),
      ...time,
      ...hb,
    });
  }

  // Conversions (from engine data, shown as outcomes)
  const resolvedToday = dayData?.resolvedToday || 0;
  const conversions = [];
  const convCount = Math.min(5, resolvedToday);
  for (let i = 0; i < convCount; i++) {
    const contactedDay = Math.max(1, day - 1 - Math.floor(rng() * 5));
    const tierIndex = pickTier(rng, tierDistribution);
    const channel = pickChannel(rng);
    const txAmount = 15 + Math.floor(rng() * 80);
    conversions.push({
      id: day * 1000 + 300 + i,
      name: pickName(rng),
      tierIndex,
      tierLabel: `Tier ${tierIndex + 1}`,
      contactedDay,
      channel,
      txAmount,
    });
  }

  // Recommendation (rare — only when data supports it, from engine)
  // For now: null. The AgentInsight component handles this.
  // Will be moved here in a future iteration.
  const recommendation = null;

  return {
    day,
    dailyPlan,
    contacts,
    followUps,
    holdbacks,
    conversions,
    recommendation,
  };
}

// Legacy exports for backward compat
export function generateDayDecisions({ day, count, seed = 42, tierDistribution, outcomes }) {
  const briefing = generateDayBriefing({ day, seed, tierDistribution });
  // Flatten to legacy format
  const all = [
    ...briefing.contacts.map(c => ({ ...c, type: 'contact', day })),
    ...briefing.followUps.map(f => ({ ...f, type: 'follow_up', day })),
    ...briefing.holdbacks.map(h => ({ ...h, type: 'holdback', day })),
    ...briefing.conversions.map(c => ({ ...c, type: 'conversion', day })),
  ];
  all.sort((a, b) => (a.hour * 60 + a.minute) - (b.hour * 60 + b.minute));
  return all;
}

export function generateDecision({ day, index, seed = 42, tierDistribution, outcomes }) {
  const decisions = generateDayDecisions({ day, count: index + 1, seed, tierDistribution, outcomes });
  return decisions[decisions.length - 1];
}
