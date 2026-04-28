/**
 * Stable campaign roster fixture.
 *
 * See docs/METRIC_MODEL.md §M5.1 — campaigns own identity (id, title, copy)
 * and a stable share-of-voice weight. Engine totals are split across the
 * roster via these weights; campaign IDs/colors stay stable across days.
 *
 * Stage 2 of the number-consistency plan: this fixture replaces the
 * day-dependent maturity-weighted allocation that lived in nameGenerator.js,
 * which made the campaign roster (and chart colors) churn day-to-day.
 *
 * Color assignment is by campaign ID, not by stack position, so a campaign's
 * color is preserved as the lineup grows over time.
 */

export const CAMPAIGNS = [
  {
    id: 'p2p-nonuser',
    type: 'specific',
    title: 'Sent money to non-user',
    whyRefer: 'Their friend would get the money instantly with the app. Referral solves the friction they just hit.',
    example: 'Push: "Sarah would get this instantly with the app. Invite her — you both get $15."',
    channel: 'push',
    reward: '$15 both-get',
    color: 'var(--color-data-5)',
    weight: 4.0,
    startsDay: 1,
    endsDay: null,
  },
  {
    id: 'highly-rated',
    type: 'transactional',
    title: 'Rated support highly',
    whyRefer: 'Satisfaction is fresh. The moment right after a great experience is when people recommend naturally.',
    example: 'Email: "Glad we could help! Know someone who’d love banking this way? You both get $10."',
    channel: 'email',
    reward: '$10 credit',
    color: 'var(--color-data-4)',
    weight: 1.5,
    startsDay: 1,
    endsDay: null,
  },
  {
    id: 'seasonal-promo',
    type: 'promo',
    title: 'Always-on referral offer',
    whyRefer: 'Catches customers who refer on their own timeline, not ours. Broadens reach beyond triggered moments.',
    example: 'In-app: "Refer a friend, you both get $10. Share your link anytime."',
    channel: 'in-app',
    reward: '$10 both-get',
    color: 'var(--color-data-1)',
    weight: 0.5,
    startsDay: 1,
    endsDay: null,
  },
  {
    id: 'first-deposit',
    type: 'specific',
    title: 'First paycheck deposited',
    whyRefer: 'They just committed to fee-free banking. Their friends are still paying fees they no longer pay.',
    example: 'Email: "You’re saving on fees now. Your friends could too — share and you both get $10."',
    channel: 'email',
    reward: '$10 credit',
    color: 'var(--color-data-3)',
    weight: 3.5,
    startsDay: 10,
    endsDay: null,
  },
  {
    id: 'cashback-milestone',
    type: 'specific',
    title: 'Saved on cashback this month',
    whyRefer: 'The savings are fresh and tangible. Friends would get the same cashback from day one.',
    example: 'Push: "You saved $47 this month. Give your friends the same deal — plus $5 bonus for you."',
    channel: 'push',
    reward: '$5 bonus cashback',
    color: 'var(--color-data-2)',
    weight: 3.0,
    startsDay: 30,
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
