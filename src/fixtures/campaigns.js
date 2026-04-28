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
 */

export const CAMPAIGNS = [
  {
    id: 'reactivation',
    type: 'specific',
    title: 'Reactivation',
    whyRefer:
      'Lapsed customers come back when invited by a friend they trust. The social pull restarts an inactive relationship faster than any other channel.',
    example:
      'Email: "It’s been a while. Bring a friend back with you — you both get a bonus."',
    channel: 'email',
    reward: 'Both-get',
    color: 'var(--color-data-5)',
    weight: 4.5,
    startsDay: 1,
    endsDay: null,
  },
  {
    id: 'advocacy',
    type: 'transactional',
    title: 'Advocacy',
    whyRefer:
      'Active customers right after a positive transaction are 7× more likely to recommend than baseline. Catch them at the peak satisfaction moment.',
    example:
      'Push: "Sent successfully. Your friends could be next — invite them, both of you get rewarded."',
    channel: 'push',
    reward: 'Tiered referrer',
    color: 'var(--color-data-4)',
    weight: 3.0,
    startsDay: 1,
    endsDay: null,
  },
  {
    id: 'activation',
    type: 'specific',
    title: 'Activation',
    whyRefer:
      'New signups who haven’t completed a first transfer are most convertible in weeks 2–4 post-signup. Pairing welcome with a friend’s invite doubles the pull.',
    example:
      'Email: "Make your first transfer with a friend’s invite — both of you earn a welcome bonus."',
    channel: 'email',
    reward: 'Welcome + referrer',
    color: 'var(--color-data-3)',
    weight: 1.5,
    startsDay: 1,
    endsDay: null,
  },
  {
    id: 'promoter-push',
    type: 'transactional',
    title: 'Promoter Push',
    whyRefer:
      'Customers who just rated support 5 stars refer at 3× the rate of average active users. The agent identified this sub-segment after enough Zendesk signal accumulated.',
    example:
      'Email: "Glad we could help. Your friends would love this — share, both of you get rewarded."',
    channel: 'email',
    reward: 'Both-get',
    color: 'var(--color-data-2)',
    weight: 1.0,
    startsDay: 20,
    endsDay: null,
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
