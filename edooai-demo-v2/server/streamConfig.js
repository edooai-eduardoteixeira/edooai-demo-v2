export const neobankStreamConfig = {
  phase1: [
    {
      type: 'text',
      text: 'Analyzing event sequences across 847,000 customers...',
      duration: 2000,
    },
    { type: 'pause', duration: 1500 },
    {
      type: 'text',
      text: 'Identified 18 unique event types. Extracting common paths...',
      duration: 1500,
    },
    { type: 'pause', duration: 2000 },
    {
      type: 'text',
      text: 'Canonical user journey detected. 82% of customers follow this path:',
      duration: 1500,
    },
    { type: 'pause', duration: 1000 },
    { type: 'action', action: 'animatePipeline' },
    { type: 'pause', duration: 500 },
    {
      type: 'text',
      text: '4 stages identified. Mapped to standard fintech lifecycle milestones.',
      duration: 1000,
    },
  ],
  phase2: [
    {
      type: 'text',
      text: 'Calculating conversion rates between key milestones...',
      duration: 1500,
    },
    { type: 'pause', duration: 2000 },
    {
      type: 'text',
      text: 'Analyzing the last 90 days of data for users who entered the journey.',
      duration: 1500,
    },
    { type: 'pause', duration: 1500 },
    { type: 'action', action: 'annotateConversion' },
    {
      type: 'text',
      text: 'For every 100 referred users who sign up, approximately 34 complete their first transaction within 90 days.',
      duration: 2000,
    },
    { type: 'pause', duration: 1000 },
    {
      type: 'text',
      text: 'Reward pricing implication: A $40 sign-up reward implies ~$118 effective cost per first transaction ($40 ÷ 0.34). This validates a $100–$200 reward range for deeper engagement goals.',
      duration: 2500,
    },
    { type: 'pause', duration: 1000 },
    {
      type: 'text',
      text: 'Journey analysis complete. Generating strategy.',
      duration: 1000,
    },
  ],
};
