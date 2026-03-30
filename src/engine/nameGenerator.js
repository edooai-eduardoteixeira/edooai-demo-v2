/**
 * Deterministic name generator for synthetic decision log entries.
 * Uses a seeded PRNG so the same day + index always produces the same name.
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

/**
 * Generate a synthetic decision record for the decision feed.
 * Deterministic: same (day, index, seed) → same record.
 */
export function generateDecision({ day, index, seed = 42, tierDistribution, outcomes }) {
  const rng = mulberry32(seed * 10000 + day * 100 + index);

  const firstName = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)];
  const lastInitial = LAST_INITIALS[Math.floor(rng() * LAST_INITIALS.length)];
  const name = `${firstName} ${lastInitial}.`;

  // Time: business hours 8am-6pm, weighted toward mid-morning and early afternoon
  const hourBase = 8 + Math.floor(rng() * 10);
  const minute = Math.floor(rng() * 60);

  // Channel: weighted by effectiveness
  const channelRoll = rng();
  const channel = channelRoll < 0.45 ? 'push' : channelRoll < 0.80 ? 'email' : 'sms';

  // Tier: based on day's tier distribution
  let tierIndex = 0;
  if (tierDistribution) {
    const tierRoll = rng();
    let cumulative = 0;
    for (let i = 0; i < tierDistribution.length; i++) {
      cumulative += tierDistribution[i];
      if (tierRoll < cumulative) {
        tierIndex = i;
        break;
      }
    }
  }

  // Outcome: based on provided outcome probabilities
  let outcome = 'expired';
  let resolvedDay = null;
  let referralSentDay = null;
  let signedUpDay = null;

  if (outcomes) {
    const outcomeRoll = rng();
    if (outcomeRoll < outcomes.convertedRate) {
      outcome = 'converted';
      // Resolution delay: 1-7 days typically
      const delay = 1 + Math.floor(rng() * Math.min(7, 30 - day));
      resolvedDay = day + delay;
      referralSentDay = day + Math.max(1, Math.floor(delay * 0.3));
      signedUpDay = day + Math.max(1, Math.floor(delay * 0.6));
    } else if (outcomeRoll < outcomes.convertedRate + outcomes.pendingRate) {
      outcome = 'pending';
      referralSentDay = rng() < 0.6 ? day + 1 : null;
    }
  }

  return {
    id: day * 1000 + index,
    name,
    day,
    hour: hourBase,
    minute,
    channel,
    tierIndex,
    outcome,
    resolvedDay,
    referralSentDay,
    signedUpDay,
  };
}

/**
 * Generate a batch of decisions for a given day.
 * count: number of decisions to generate (sample of total journeys).
 */
export function generateDayDecisions({ day, count, seed = 42, tierDistribution, outcomes }) {
  const decisions = [];
  for (let i = 0; i < count; i++) {
    decisions.push(generateDecision({ day, index: i, seed, tierDistribution, outcomes }));
  }
  // Sort by time
  decisions.sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute));
  return decisions;
}
