const neobank = {
  // Vertical Metadata
  vertical: 'neobank',
  companyType: 'Mid-sized US neobank',
  companyStage: 'Series B\u2013C',
  totalCustomers: 847000,

  // Screen 1 — Landing Page
  landing: {
    headline: 'Turn your best customers into your best acquisition channel.',
    subheadline:
      'Edoo AI is an autonomous agent that runs your referral program \u2014 from data analysis to campaign execution.',
    ctaText: 'Connect Your Data',
    valueProps: [
      'Analyzes your customer data to find the right referrers.',
      'Designs and runs campaigns autonomously.',
      'Optimizes daily based on real performance.',
    ],
    credibilityLine: 'Built for growth teams at high-growth fintechs.',
  },

  // Screen 2 — Data Connection
  connection: {
    group1: {
      label: 'CRM & Marketing',
      dataDirection: 'Read + Send',
      whyLine: 'To identify your customers and send them referrals',
      platforms: ['Segment', 'Braze', 'Klaviyo', 'HubSpot', 'Customer.io'],
      defaultPlatform: 'Braze',
      fieldsProvided: [
        {
          category: 'REQUIRED DATA',
          fields: [
            { framework: 'Unique customer ID' },
            { framework: 'Customer name' },
            { framework: 'Contact information (opt-in for e-mail, phone, or push notification)' },
          ],
        },
        {
          category: 'OPTIONAL DATA',
          fields: [
            { framework: 'Customer address' },
            { framework: 'Customer since' },
          ],
        },
      ],
    },
    group2: {
      label: 'Data Warehouse',
      dataDirection: 'Read only',
      whyLine: 'To understand what they buy and how active they are',
      platforms: ['Snowflake', 'BigQuery', 'Redshift', 'Databricks', 'Synapse'],
      defaultPlatform: 'Snowflake',
      fieldsProvided: [
        {
          category: 'REQUIRED DATA',
          fields: [
            { framework: 'Transactions (date, SKU, amount)' },
          ],
        },
      ],
    },
    group3: {
      label: 'Support & Feedback',
      dataDirection: 'Read only',
      whyLine: 'To know who\u2019s happy \u2014 and who isn\u2019t',
      platforms: ['Zendesk', 'Intercom', 'Delighted'],
      defaultPlatform: 'Zendesk',
      fieldsProvided: [
        {
          category: 'OPTIONAL DATA',
          fields: [
            { framework: 'Customer ratings' },
            { framework: 'Support tickets' },
          ],
        },
      ],
    },
    requiredFieldCount: 4,
    bottomBarSummary:
      '2 sources connected \u00b7 847,000 customer records \u00b7 4 of 4 required fields detected',
  },

  // ─── Screen 3 — Customer Offer Allocation ───

  // Single strategy
  strategy: {
    name: 'Maximize New Active Users',
    goal: 'Get as many referred users as possible to complete their first transaction',
    successMetric: 'Referee completes first transaction',
    rewardPerSide: 75,
    rewardTotal: 150,
    rewardTypes: ['Account Credit', 'Cashback'],
    offerWindowDays: 14,
  },

  // Budget
  budgetSlider: {
    min: 50000,
    max: 1000000,
    step: 10000,
    default: 150000,
  },

  recommendedBudget: {
    amount: 150000,
    rationale: 'Based on your 847K customers, we recommend $150K/month',
  },

  budgetAnnotation:
    'Edoo AI prioritizes highest-ROI customers first \u2014 CAC expected to increase with budget',

  // Projections — single strategy, diminishing returns
  // CAC monotonically increases, ROI monotonically decreases, conv rate decreases
  projections: [
    { budget: 50000,   activeUsers: 95,   cac: 526,  convRate: 4.8, roi: 1.8, fraudSaved: 14000 },
    { budget: 100000,  activeUsers: 180,  cac: 556,  convRate: 4.4, roi: 1.6, fraudSaved: 28000 },
    { budget: 150000,  activeUsers: 260,  cac: 577,  convRate: 4.0, roi: 1.5, fraudSaved: 42000 },
    { budget: 250000,  activeUsers: 400,  cac: 625,  convRate: 3.6, roi: 1.3, fraudSaved: 68000 },
    { budget: 500000,  activeUsers: 680,  cac: 735,  convRate: 3.2, roi: 1.2, fraudSaved: 125000 },
    { budget: 1000000, activeUsers: 1050, cac: 952,  convRate: 2.8, roi: 1.1, fraudSaved: 220000 },
  ],

  // Redemption journey — the "how"
  redemptionJourney: [
    {
      step: 'Referral Ask',
      recipient: 'Referrer',
      whatHappens: 'Edoo selects the right customer at the right moment and sends a personalized referral ask.',
      edooDecides: 'Channel (push, email, SMS, WhatsApp), timing (peak engagement moment), message variant',
      reward: '$75 for you when your friend makes their first transaction',
    },
    {
      step: 'Invite Landing',
      recipient: 'Referee',
      whatHappens: 'Referee lands on a personalized page with the referral offer.',
      edooDecides: 'Landing page variant, reward framing, urgency signals',
      reward: null,
    },
    {
      step: 'Sign-up & KYC',
      recipient: 'Referee',
      whatHappens: 'Referee completes registration and identity verification.',
      edooDecides: 'Nudge timing, reminder channel, friction-reduction messaging',
      reward: null,
    },
    {
      step: 'First Transaction',
      recipient: 'Referee',
      whatHappens: 'Referee makes their first transaction \u2014 this is the success event.',
      edooDecides: 'Activation nudge timing, reward reminder, transaction encouragement',
      reward: 'Reward triggered for both parties on completion',
    },
    {
      step: 'Reward Credited',
      recipient: 'Both',
      whatHappens: 'Both referrer and referee receive their reward.',
      edooDecides: 'Reward type (account credit, cashback)',
      reward: '$75 credited to each',
    },
  ],

  // Preview cards
  refereePreview: {
    referrer: {
      headline: 'Know someone who\u2019d love us?',
      body: 'Share your personal link \u2014 you both get $75 when your friend makes their first transaction.',
      rewardDisplay: '$75',
      rewardLabel: 'for you & your friend',
      ctaText: 'Share My Link',
      channel: 'Push notification',
      rewardOptions: ['$75 Account Credit', '$75 Cashback'],
      giftOptions: ['$75 Account Credit', '$75 Cashback'],
    },
    referee: {
      headline: 'Sarah invited you!',
      body: 'Open an account and make your first transaction \u2014 you both get $75.',
      rewardDisplay: '$75',
      rewardLabel: 'after your first transaction',
      ctaText: 'Claim My $75',
      channel: 'Personalized landing page',
    },
  },

  // Expandable offer details (the "deep dive" from v1)
  offerDetails: {
    rewardStructure: '$75 per side ($150 total per successful conversion). Paid only when referee completes first transaction.',
    rewardTypes: 'Account Credit vs. Cashback \u2014 A/B tested per user',
    targeting: 'Customers ranked by expected ROI: (propensity to refer \u00d7 expected referee conversion \u00d7 LTV) minus reward cost. Top-ranked activated first.',
    personalization: [
      'Channel: per user\u2019s most responsive channel (email, push, SMS, WhatsApp)',
      'Timing: peak engagement time per user (inferred from historical activity)',
      'Message: 2 variants A/B tested, winner scaled',
      'Reward type: Account Credit vs. Cashback, personalized per user preference signals',
    ],
    offerWindow: 'Referee has 14 days from invite to complete first transaction. Expired offers free budget back to the pool.',
  },

  // Execution — daily operations cycle
  operationsCycle: {
    summary: 'Edoo runs a continuous daily cycle to acquire new active users within your budget.',
    steps: [
      {
        name: 'Rank',
        description: 'Score all eligible customers by expected ROI: (propensity to refer \u00d7 expected referee conversion \u00d7 LTV) minus reward cost. Ranked highest to lowest.',
      },
      {
        name: 'Allocate',
        description: 'Given today\u2019s remaining budget, select top-N customers to activate. Outstanding offers in flight count against budget.',
      },
      {
        name: 'Activate',
        description: 'Send personalized referral asks \u2014 right channel, right time, right message, right offer. Each activation is a budget commitment.',
      },
      {
        name: 'Monitor',
        description: 'Track the full funnel in real-time: referral sends, invite opens, sign-ups, KYC completions, first transactions. Flag anomalies.',
      },
      {
        name: 'Close',
        description: 'When a referee completes their first transaction, credit rewards to both parties. When an offer expires, free budget back to the pool.',
      },
      {
        name: 'Learn',
        description: 'Update models with today\u2019s data \u2014 which customers converted, which offers worked, which channels performed. Tomorrow\u2019s ranking uses today\u2019s results.',
      },
    ],
    dailyRamp: [
      { days: '1\u20137', activeUsersPerDay: 5, note: 'Small initial cohort, learning' },
      { days: '8\u201321', activeUsersPerDay: 12, note: 'Scaling based on early data' },
      { days: '22\u201330', activeUsersPerDay: 18, note: 'Optimized allocation' },
    ],
    budgetPacing:
      'Daily budget target = monthly budget \u00f7 remaining days. Edoo adjusts for day-of-week patterns and offer expiration timing. If daily performance exceeds expectations, Edoo accelerates. If underperforming, it conserves.',
    offerLifecycle:
      'Each offer has a 14-day window. Multiple offers are in flight simultaneously at different stages. Expired offers free budget back to the allocation pool. This is ongoing portfolio management.',
  },

  // Risk management
  riskManagement: {
    pacing: {
      label: 'Pacing & spend limits',
      description: 'Daily and weekly spend limits prevent front-loading. Budget lasts the full month.',
    },
    offerLiability: {
      label: 'Offer liability',
      description: 'Offers issued but not yet redeemed are financial commitments. Edoo tracks outstanding exposure and caps it.',
    },
    rewardTracking: {
      label: 'Reward commitment tracking',
      description: 'Committed rewards vs. paid rewards \u2014 the gap is your financial exposure at any moment. Edoo keeps this visible and capped.',
    },
    anomalyDetection: {
      label: 'Anomaly detection',
      description: 'Pattern-based detection when results indicate something is off \u2014 unexpected conversion drops, spend spikes, behavioral shifts. Auto-pauses affected segments.',
    },
    fraud: [
      {
        type: 'Fake Identity',
        scale: 'Individual \u00b7 manual \u00b7 small scale',
        description:
          'One person creates fake accounts to self-refer. Includes account cycling \u2014 open, earn reward, go dormant, repeat as a \u201cnew\u201d referee elsewhere.',
        whyItMatters:
          'Highest-volume type. Each instance is small, but it is constant and compounds over time.',
        signals: [
          'Device fingerprint persistence across accounts',
          'IP / network correlation',
          'Behavioral biometrics (navigation patterns, timing)',
          'KYC data overlap detection',
          'Account-then-dormancy cycling patterns',
        ],
        response:
          'Reward held pre-payout. Both accounts flagged. Fingerprint cluster blacklisted for future matches.',
      },
      {
        type: 'Organized Fraud Rings',
        scale: 'High volume \u00b7 coordinated',
        description:
          'Groups \u2014 human, bot, or both \u2014 that systematically extract referral rewards. Closed referral loops, bot-farmed signups, or paid workers completing minimum qualifying actions.',
        whyItMatters:
          'Can drain significant budget in days. Damage concentrates before detection if not caught early.',
        signals: [
          'Network graph analysis (closed loops, star patterns, isolated clusters)',
          'Velocity anomalies (batch-like signup / activation timing)',
          'Shared infrastructure markers (IP ranges, device similarity, email patterns)',
          'Bot signals (session duration, navigation speed, headless browser detection)',
        ],
        response:
          'Entire cluster frozen simultaneously \u2014 not one-by-one. Pattern fed back into model. Escalation triggered.',
      },
      {
        type: 'Attribution Abuse',
        scale: 'Medium volume \u00b7 invisible until measured',
        description:
          'Referrer posts their code or link publicly \u2014 Reddit, coupon sites, social media. Real people sign up using the code, but the referrer had zero influence on their decision. You pay referral rewards for what would have been free organic acquisition.',
        whyItMatters:
          'Not fraud in the traditional sense \u2014 the referee is real, the transaction is genuine. But the economic damage is identical: budget spent with no incremental value.',
        signals: [
          'Referral channel classification (personal share via SMS / email vs. public broadcast)',
          'Referrer volume anomalies (normal: 2\u20135 conversions, broadcaster: 50+)',
          'Link appearance on known coupon / deal sites',
          'Click-to-signup timing (personal referrals are fast, broadcast pickups are delayed and scattered)',
        ],
        response:
          'Attribution downweighted or rejected for broadcast-originated signups. Per-referrer reward cap enforced. Referral codes monitored on public surfaces.',
      },
    ],
    fraudSummary:
      'Three different adversary profiles, three different detection strategies. Edoo runs all three continuously \u2014 rewards are never released until signals clear.',
  },

  // Approval scope
  approvalScope:
    'You\u2019re approving the budget and the goal. Edoo handles customer selection, timing, channel, messaging, and rewards autonomously.',

  // ─── Screen 4 — Dashboard (30-day projected results) ───

  dashboard30Day: {
    activeUsers: 260,
    totalReferralsSent: 6500,
    totalSpend: 150000,
    cac: 577,
    roi: 1.5,
    fraudSaved: 42000,
    chartPhases: [
      { label: 'Learning', days: '1\u20137', note: 'Small cohort' },
      { label: 'Scaling', days: '8\u201321', note: 'Acceleration' },
      { label: 'Optimized', days: '22\u201330', note: 'Peak efficiency' },
    ],
    ctaText: 'Book a Call',
    ctaLink: '#',
    // S-curve daily data points (cumulative active users, building to 260)
    dailyData: [
      5, 10, 16, 22, 29, 37, 45,
      56, 68, 82, 97, 113, 130, 147,
      162, 176, 189, 200, 210, 219, 227,
      234, 239, 244, 248, 251, 254, 256, 258, 260,
    ],
  },
};

export default neobank;
