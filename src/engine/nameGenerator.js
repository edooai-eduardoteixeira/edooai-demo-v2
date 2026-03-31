/**
 * Deterministic decision generator for the dashboard feed.
 * Uses a seeded PRNG so the same day + index always produces the same record.
 *
 * Decision types:
 *   contact    — Agent contacted a customer (with channel, tier, timing reasoning)
 *   reminder   — Agent sent a follow-up (referral shared but referee hasn't acted)
 *   holdback   — Agent decided NOT to contact (support ticket, low NPS, fatigue)
 *   conversion — A referee completed first transaction (reward paid)
 *   reward_blocked — Suspicious pattern, reward held in escrow
 *   expiration_batch — Consolidated: N offers expired (one reasoning, covers all)
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

const CHANNELS = ['push', 'email', 'sms'];

const HOLDBACK_REASONS = [
  'Open support ticket since Day {d}',
  'NPS score 4 — below threshold',
  'Contacted 2 days ago — rest period active',
  'Account flagged for compliance review',
  'Inactive for 95 days — exceeds threshold',
  'Already has active offer in flight',
];

const REWARD_BLOCK_REASONS = [
  '3 conversions in 24h from same referrer — escrow pending',
  'Referee IP matches referrer device — self-referral check',
  'Referral link used 6 times — exceeds cap, under review',
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

/**
 * Generate a full set of decisions for a given day.
 * Returns a mix of decision types reflecting what the agent actually does.
 */
export function generateDayDecisions({ day, count, seed = 42, tierDistribution, outcomes }) {
  const rng = mulberry32(seed * 10000 + day * 777);
  const decisions = [];
  let id = day * 1000;

  // Distribution of decision types per day
  // Contacts are the majority, but include other types
  const contactCount = Math.max(4, Math.round(count * 0.45));
  const reminderCount = Math.max(1, Math.round(count * 0.15));
  const holdbackCount = Math.max(1, Math.round(count * 0.12));
  const conversionCount = Math.max(0, Math.round(count * 0.10));
  const rewardBlockCount = day >= 5 ? Math.max(0, Math.round(count * 0.03)) : 0;
  // Expiration batch is always 1 entry (covers many)
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
    });
  }

  // --- Reminders ---
  for (let i = 0; i < reminderCount; i++) {
    const time = pickTime(rng);
    const sharedLink = rng() > 0.4;
    decisions.push({
      id: id++,
      type: 'reminder',
      name: pickName(rng),
      day,
      ...time,
      channel: pickChannel(rng),
      detail: sharedLink
        ? 'Referral link shared — referee hasn\'t signed up yet'
        : 'No referral shared yet — 2nd touchpoint',
    });
  }

  // --- Holdbacks (decision NOT to contact) ---
  for (let i = 0; i < holdbackCount; i++) {
    const time = pickTime(rng);
    const reasonTemplate = HOLDBACK_REASONS[Math.floor(rng() * HOLDBACK_REASONS.length)];
    const reason = reasonTemplate.replace('{d}', Math.max(1, day - Math.floor(rng() * 5)));
    decisions.push({
      id: id++,
      type: 'holdback',
      name: pickName(rng),
      day,
      ...time,
      reason,
    });
  }

  // --- Conversions ---
  const actualConversions = Math.min(conversionCount, Math.ceil((outcomes?.convertedRate || 0.05) * count * 3));
  for (let i = 0; i < actualConversions; i++) {
    const time = pickTime(rng);
    const tierIndex = pickTier(rng, tierDistribution);
    decisions.push({
      id: id++,
      type: 'conversion',
      name: pickName(rng),
      day,
      ...time,
      tierIndex,
      tierLabel: `Tier ${tierIndex + 1}`,
      contactedDay: Math.max(1, day - 1 - Math.floor(rng() * 5)),
    });
  }

  // --- Reward blocks ---
  for (let i = 0; i < rewardBlockCount; i++) {
    const time = pickTime(rng);
    const reason = REWARD_BLOCK_REASONS[Math.floor(rng() * REWARD_BLOCK_REASONS.length)];
    decisions.push({
      id: id++,
      type: 'reward_blocked',
      name: pickName(rng),
      day,
      ...time,
      reason,
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
    });
  }

  // Sort by time
  decisions.sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute));
  return decisions;
}

// Legacy export for backward compat
export function generateDecision({ day, index, seed = 42, tierDistribution, outcomes }) {
  const decisions = generateDayDecisions({ day, count: index + 1, seed, tierDistribution, outcomes });
  return decisions[decisions.length - 1];
}
