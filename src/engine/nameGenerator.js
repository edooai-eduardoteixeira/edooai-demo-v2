/**
 * Deterministic decision generator for the dashboard feed.
 * Uses a seeded PRNG so the same day + index always produces the same record.
 *
 * Each decision includes REASONING — the agent's logic connecting
 * customer data → strategy config → guardrails → action.
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
  const firstName = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)];
  const lastInitial = LAST_INITIALS[Math.floor(rng() * LAST_INITIALS.length)];
  return `${firstName} ${lastInitial}.`;
}

function pickTime(rng) {
  return { hour: 8 + Math.floor(rng() * 10), minute: Math.floor(rng() * 60) };
}

function pickChannel(rng) {
  const r = rng();
  return r < 0.45 ? 'push' : r < 0.80 ? 'email' : 'sms';
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

// ─── Reasoning builders ──────────────────────────────────────────────
// Each builds reasoning from the customer context + agent logic.
// The reasoning answers: why THIS person, why THIS channel, why THIS tier, why NOW.

function buildContactReasoning(rng, { channel, tierIndex, time, day }) {
  const nps = 7 + Math.floor(rng() * 3);
  const tenure = 90 + Math.floor(rng() * 400);
  const pastReferrals = Math.floor(rng() * 4);
  const txLast30 = 2 + Math.floor(rng() * 8);
  const channelOpenRate = 40 + Math.floor(rng() * 35);

  // Why this person: customer profile signals
  const whyPerson = pastReferrals > 0
    ? `${pastReferrals} prior referral${pastReferrals > 1 ? 's' : ''}, NPS ${nps}, ${txLast30} transactions in last 30 days`
    : `NPS ${nps}, ${txLast30} transactions in last 30 days, ${tenure}-day tenure`;

  // Why this channel: data-driven channel selection
  const whyChannel = `${channel} selected — ${channelOpenRate}% open rate for this customer's segment`;

  // Why this tier: reward matches conversion difficulty
  const tierReasons = [
    'organic candidate — high propensity, no incentive needed',
    'light incentive — moderate propensity, small nudge sufficient',
    'standard incentive — lower propensity segment, reward drives conversion',
    'max incentive — hard-to-convert segment, high expected LTV justifies cost',
  ];
  const whyTier = `Tier ${tierIndex + 1}: ${tierReasons[tierIndex] || tierReasons[0]}`;

  return [whyPerson, whyChannel, whyTier].join('. ') + '.';
}

function buildReminderReasoning(rng, { channel, day }) {
  const daysSinceContact = 1 + Math.floor(rng() * 4);
  const sharedLink = rng() > 0.4;
  const touchpoint = sharedLink ? 'link shared but referee inactive' : 'no share yet after first contact';
  const guardrail = `Within fatigue guardrail: touchpoint ${sharedLink ? 2 : 2} of max 2 per stage`;

  return `${touchpoint} (${daysSinceContact}d since contact). ${guardrail}. ${channel} re-engagement — rest period cleared.`;
}

function buildHoldbackReasoning(rng, { day }) {
  const reasons = [
    () => {
      const ticketDay = Math.max(1, day - Math.floor(rng() * 5));
      return {
        short: `Open support ticket since Day ${ticketDay}`,
        full: `Active support case opened Day ${ticketDay}. Audience protection guardrail: customers with open tickets are excluded. Will re-evaluate when ticket closes.`,
      };
    },
    () => {
      const nps = 3 + Math.floor(rng() * 3);
      return {
        short: `NPS score ${nps} — below threshold`,
        full: `NPS score ${nps}, below the configured threshold of 6. Contacting detractors risks negative brand association. Customer excluded until next NPS survey.`,
      };
    },
    () => {
      const daysAgo = 1 + Math.floor(rng() * 2);
      return {
        short: `Contacted ${daysAgo} days ago — rest period active`,
        full: `Last contacted ${daysAgo} day${daysAgo > 1 ? 's' : ''} ago. Customer fatigue guardrail: minimum 2-day rest period between touchpoints. Next eligible contact: Day ${day + (2 - daysAgo)}.`,
      };
    },
    () => ({
      short: 'Account flagged for compliance review',
      full: 'Compliance hold active on this account. Guardrail: all marketing communications paused until hold is lifted by compliance team.',
    }),
    () => {
      const inactiveDays = 90 + Math.floor(rng() * 30);
      return {
        short: `Inactive for ${inactiveDays} days`,
        full: `No activity for ${inactiveDays} days, exceeding the 90-day inactivity threshold. Contacting inactive customers has <0.1% conversion rate. Excluded from outreach pool.`,
      };
    },
    () => ({
      short: 'Already has active offer in flight',
      full: 'Customer has an unexpired referral offer (sent 3 days ago). Financial controls guardrail: max 1 outstanding offer per customer. Will re-enter pool if offer expires without conversion.',
    }),
  ];

  const picked = reasons[Math.floor(rng() * reasons.length)]();
  return picked;
}

function buildConversionReasoning(rng, { tierIndex, contactedDay, day }) {
  const channel = pickChannel(rng);
  const shareDay = contactedDay + 1 + Math.floor(rng() * 2);
  const signupDay = shareDay + Math.floor(rng() * 2);
  const txAmount = 15 + Math.floor(rng() * 80);

  return `Full journey: contacted Day ${contactedDay} via ${channel} → referral shared Day ${shareDay} → referee signed up Day ${signupDay} → first transaction ($${txAmount}) today. Tier ${tierIndex + 1} reward approved — both parties credited.`;
}

function buildRewardBlockReasoning(rng) {
  const reasons = [
    '3 conversions from this referrer in 24 hours. Suspicious escrow guardrail triggered: hold payout for 7 days. If signals clear, reward releases automatically.',
    'Referee device fingerprint matches referrer\'s IP range. Self-referral blocker (standard mode): identical network detected. Reward held pending manual review.',
    'Referral link used 6 times, exceeding the 5-payout cap. Link auto-invalidated. Existing approved conversions unaffected — this new conversion held for review.',
  ];
  return reasons[Math.floor(rng() * reasons.length)];
}

/**
 * Generate a full set of decisions for a given day.
 */
export function generateDayDecisions({ day, count, seed = 42, tierDistribution, outcomes }) {
  const rng = mulberry32(seed * 10000 + day * 777);
  const decisions = [];
  let id = day * 1000;

  const contactCount = Math.max(4, Math.round(count * 0.45));
  const reminderCount = Math.max(1, Math.round(count * 0.15));
  const holdbackCount = Math.max(1, Math.round(count * 0.12));
  const conversionCount = Math.max(0, Math.round(count * 0.10));
  const rewardBlockCount = day >= 5 ? Math.max(0, Math.round(count * 0.03)) : 0;
  const hasExpirations = day >= 3;

  // --- Contacts ---
  for (let i = 0; i < contactCount; i++) {
    const tierIndex = pickTier(rng, tierDistribution);
    const channel = pickChannel(rng);
    const time = pickTime(rng);
    decisions.push({
      id: id++,
      type: 'contact',
      name: pickName(rng),
      day,
      ...time,
      channel,
      tierIndex,
      tierLabel: `Tier ${tierIndex + 1}`,
      reasoning: buildContactReasoning(rng, { channel, tierIndex, time, day }),
    });
  }

  // --- Reminders ---
  for (let i = 0; i < reminderCount; i++) {
    const channel = pickChannel(rng);
    const time = pickTime(rng);
    const sharedLink = rng() > 0.4;
    decisions.push({
      id: id++,
      type: 'reminder',
      name: pickName(rng),
      day,
      ...time,
      channel,
      detail: sharedLink
        ? 'Referral link shared — referee hasn\'t signed up yet'
        : 'No referral shared yet — 2nd touchpoint',
      reasoning: buildReminderReasoning(rng, { channel, day }),
    });
  }

  // --- Holdbacks ---
  for (let i = 0; i < holdbackCount; i++) {
    const time = pickTime(rng);
    const { short, full } = buildHoldbackReasoning(rng, { day });
    decisions.push({
      id: id++,
      type: 'holdback',
      name: pickName(rng),
      day,
      ...time,
      reason: short,
      reasoning: full,
    });
  }

  // --- Conversions ---
  const actualConversions = Math.min(conversionCount, Math.ceil((outcomes?.convertedRate || 0.05) * count * 3));
  for (let i = 0; i < actualConversions; i++) {
    const time = pickTime(rng);
    const tierIndex = pickTier(rng, tierDistribution);
    const contactedDay = Math.max(1, day - 1 - Math.floor(rng() * 5));
    decisions.push({
      id: id++,
      type: 'conversion',
      name: pickName(rng),
      day,
      ...time,
      tierIndex,
      tierLabel: `Tier ${tierIndex + 1}`,
      contactedDay,
      reasoning: buildConversionReasoning(rng, { tierIndex, contactedDay, day }),
    });
  }

  // --- Reward blocks ---
  for (let i = 0; i < rewardBlockCount; i++) {
    const time = pickTime(rng);
    decisions.push({
      id: id++,
      type: 'reward_blocked',
      name: pickName(rng),
      day,
      ...time,
      reason: buildRewardBlockReasoning(rng).split('.')[0],
      reasoning: buildRewardBlockReasoning(rng),
    });
  }

  // --- Expiration batch ---
  if (hasExpirations) {
    const expiredCount = Math.max(3, Math.round(count * 0.8));
    decisions.push({
      id: id++,
      type: 'expiration_batch',
      day,
      hour: 17,
      minute: 0,
      count: expiredCount,
      reasoning: `${expiredCount} offers reached the 14-day expiration window without conversion. Budget freed back to pool for reallocation. These customers re-enter the eligible pool after a rest period.`,
    });
  }

  decisions.sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute));
  return decisions;
}

// Legacy export
export function generateDecision({ day, index, seed = 42, tierDistribution, outcomes }) {
  const decisions = generateDayDecisions({ day, count: index + 1, seed, tierDistribution, outcomes });
  return decisions[decisions.length - 1];
}
