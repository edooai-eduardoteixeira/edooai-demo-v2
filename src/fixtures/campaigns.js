/**
 * Stable campaign roster fixture.
 *
 * See docs/METRIC_MODEL.md §M5.1 — campaigns own identity (id, title, copy)
 * and a stable share-of-voice weight. Engine totals are split across the
 * roster via these weights; campaign IDs/colors stay stable across days.
 *
 * Roster is aligned with /insights' three campaign archetypes
 * (Reactivation / Advocacy / Activation) so the same campaigns appear on
 * both pages, only at different stages of the run. A fourth campaign,
 * Promoter Push, is composed by the agent around day 20 once enough
 * Zendesk signal has accumulated to identify high-CSAT customers.
 *
 * Color assignment is by campaign ID, not by stack position, so a campaign's
 * color is preserved as the lineup grows over time.
 *
 * Each campaign carries membership math (initialPool + dailyDelta and, for
 * Promoter Push, startDay/startPool). Day-1 pools match /insights audience
 * exactly. Daily deltas are tuned so the sum across all four campaigns
 * grows by the audience model's external acquisition rate (≈667/day),
 * keeping the right-list total in agreement with the left-side audience
 * graph at every day.
 */

export const CAMPAIGNS = [
  {
    id: 'reactivation',
    type: 'specific',
    title: 'Reactivation',
    crmChannel: 'Email',
    inAppPlacement: null,
    rewardChip: '$75 / $50',
    example:
      'Maria, your last transfer to Mexico was 6 weeks ago. 👋 Bring a friend along — you get $75, they get $50. felix.com/maria',
    color: 'var(--color-data-5)',
    weight: 4.5,
    startsDay: 1,
    endsDay: null,
    initialPool: 198400,
    dailyDelta: -500,
  },
  {
    id: 'advocacy',
    type: 'transactional',
    title: 'Advocacy',
    crmChannel: 'WhatsApp',
    inAppPlacement: 'Post-Transaction',
    rewardChip: '$50 / $25',
    example:
      'Carlos, you just sent $200 to your mom in Guadalajara. 💸 Your friends could too — you get $50, they get $25. felix.com/carlos',
    color: 'var(--color-data-4)',
    weight: 3.0,
    startsDay: 1,
    endsDay: null,
    initialPool: 149200,
    dailyDelta: 1417,         // gains R+Act graduates + external acquisition
    carveAtDay: 20,           // 25K members carved out to Promoter Push at day 20
    carveAmount: 25000,
  },
  {
    id: 'activation',
    type: 'specific',
    title: 'Activation',
    crmChannel: 'WhatsApp',
    inAppPlacement: 'Onboarding Success',
    rewardChip: '$10 / $20',
    example:
      'Sofia, welcome to Felix. Make your first transfer with a friend’s invite — you get $20, they get $10. felix.com/sofia',
    color: 'var(--color-data-3)',
    weight: 1.5,
    startsDay: 1,
    endsDay: null,
    initialPool: 75900,
    dailyDelta: -250,
  },
  {
    id: 'promoter-push',
    type: 'transactional',
    title: 'Promoter Push',
    crmChannel: 'WhatsApp',
    inAppPlacement: null,
    rewardChip: '$0 / $10',
    example:
      'Diego, glad we got your money home fast. ⭐ Share with a friend — they get a $10 welcome on us. felix.com/diego',
    color: 'var(--color-data-2)',
    weight: 1.0,
    startsDay: 20,
    endsDay: null,
    initialPool: 0,
    startPool: 25000,         // jumps to 25K when it activates at day 20
    dailyDelta: 0,            // holds steady through day 60
  },
];

/**
 * Active campaigns on a given day, with normalized share weights.
 * Each campaign carries its stable id/color, plus a `share` (0..1) that
 * sums to 1.0 across the active roster on that day.
 */
export function activeCampaigns(day) {
  const active = CAMPAIGNS.filter(c =>
    day >= c.startsDay && (c.endsDay == null || day <= c.endsDay)
  );
  const totalWeight = active.reduce((s, c) => s + c.weight, 0) || 1;
  return active.map(c => ({
    ...c,
    share: c.weight / totalWeight,
  }));
}

/**
 * Campaign membership at a given day.
 *
 * Formula:
 *   Before startsDay → 0
 *   On/after startsDay → (startPool ?? initialPool) + dailyDelta × (day - startsDay)
 *   Minus carveAmount if day ≥ carveAtDay (one-time internal transfer to
 *   another campaign — used for Advocacy → Promoter Push at day 20).
 *
 * Day-1 values match /insights audience pool. Day-60 values sum to the
 * eligible audience total at that day (initial 423,500 + 667 × 59).
 */
export function campaignMembership(c, day) {
  if (day < c.startsDay) return 0;
  const base = c.startPool != null ? c.startPool : c.initialPool;
  const delta = c.dailyDelta || 0;
  let val = base + delta * (day - c.startsDay);
  if (c.carveAtDay && day >= c.carveAtDay) {
    val -= c.carveAmount || 0;
  }
  return Math.max(0, Math.round(val));
}
