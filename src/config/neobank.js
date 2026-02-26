const neobank = {
  // Vertical Metadata
  vertical: 'neobank',
  companyType: 'Mid-sized US neobank',
  companyStage: 'Series B–C',
  totalCustomers: 847000,

  // Screen 1 — Landing Page
  landing: {
    headline: 'Turn your best customers into your best acquisition channel.',
    subheadline:
      'Edoo AI is an autonomous agent that runs your referral program — from data analysis to campaign execution.',
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
      whyLine: "To know who\u2019s happy \u2014 and who isn\u2019t",
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
      '2 sources connected · 847,000 customer records · 4 of 4 required fields detected',
  },

  // Screen 3 — Journey & Conversion
  journeyInference: {
    uniqueEventTypes: 18,
    canonicalPathPercentage: 82,
    stages: [
      { name: 'Sign-Up', users: 847000, percentage: 100 },
      { name: 'KYC Completed', users: 612000, percentage: 72 },
      { name: 'First Transaction', users: 285000, percentage: 34 },
      { name: 'Recurring Transactions', users: 142000, percentage: 17 },
    ],
    stageCount: 4,
    milestoneCategory: 'standard fintech lifecycle milestones',
  },

  conversionAnalysis: {
    windowDays: 90,
    signupToFirstTransaction: 0.34,
    rewardPricingExample: {
      signupReward: 40,
      effectiveCostPerTransaction: 118,
      calculationNote: '$40 ÷ 0.34 = ~$118',
      validatedRange: '$100–$200',
    },
  },

  streamingText: {
    phase1: [
      {
        type: 'text',
        text: 'Scanning 847,000 customer records...',
        duration: 1500,
      },
      { type: 'pause', duration: 1500 },
      {
        type: 'text',
        text: 'Mapping how your users move from sign-up to active engagement...',
        duration: 1500,
      },
      { type: 'pause', duration: 2000 },
      {
        type: 'text',
        text: 'Found a clear pattern. 82% of your customers follow this journey:',
        duration: 1500,
      },
      { type: 'pause', duration: 1000 },
      { type: 'action', action: 'animatePipeline' },
      {
        type: 'text',
        text: '4 key stages from sign-up to repeat usage. This is how your users activate.',
        duration: 1500,
      },
    ],
    phase2: [
      {
        type: 'text',
        text: 'Calculating conversion between referral milestones...',
        duration: 1500,
      },
      { type: 'pause', duration: 1500 },
      {
        type: 'text',
        text: 'Based on the last 90 days of your data:',
        duration: 1000,
      },
      { type: 'pause', duration: 1000 },
      { type: 'action', action: 'annotateConversion' },
    ],
  },

  // Screen 4 — Strategy & Projections
  strategy: {
    name: 'Look-a-Like',
    headline: 'Clone Your Best Users',
    goal: 'Grow active customers through targeted referrals to high-probability matches',
    target: 'Most engaged existing users; acquire referees who resemble them',
    successMetric: 'Referee completes first transaction',
    successDetail: 'Hard metric — no reward on sign-up alone',
    rewardPerSide: 150,
    rewardTypes: ['Cashback', 'Account Credit'],
    timing: 'Triggered at peak engagement moments per user',
    allocation: {
      activePercent: 60,
      reservePercent: 40,
      description: 'Ranked by expected cost per active customer',
    },
  },

  budgetSlider: {
    min: 50000,
    max: 1000000,
    step: 10000,
    default: 150000,
  },

  projections: [
    { budget: 50000, newUsers: 198, spend: 49200, cac: 249, signups: 312, firstTransactions: 67, convRate: 3.2, revPerReferral: 145, roi: 1.1, fraudSaved: 18200, fraudBlocked: 156 },
    { budget: 100000, newUsers: 438, spend: 98400, cac: 225, signups: 680, firstTransactions: 149, convRate: 4.1, revPerReferral: 155, roi: 1.3, fraudSaved: 38400, fraudBlocked: 324 },
    { budget: 150000, newUsers: 684, spend: 147600, cac: 216, signups: 1050, firstTransactions: 233, convRate: 5.0, revPerReferral: 165, roi: 1.5, fraudSaved: 63454, fraudBlocked: 583 },
    { budget: 250000, newUsers: 1120, spend: 246000, cac: 220, signups: 1720, firstTransactions: 381, convRate: 4.6, revPerReferral: 160, roi: 1.4, fraudSaved: 98700, fraudBlocked: 892 },
    { budget: 500000, newUsers: 2180, spend: 492000, cac: 226, signups: 3350, firstTransactions: 741, convRate: 4.2, revPerReferral: 155, roi: 1.3, fraudSaved: 178500, fraudBlocked: 1640 },
    { budget: 1000000, newUsers: 4050, spend: 972000, cac: 240, signups: 6200, firstTransactions: 1377, convRate: 3.8, revPerReferral: 148, roi: 1.2, fraudSaved: 312000, fraudBlocked: 2890 },
  ],

  allocationDetail: {
    totalEligibleReferrers: 3080,
    activeTier: {
      referrers: 1848,
      projectedReferralsSent: 2960,
      projectedActiveCustomers: 233,
      projectedSpend: 69900,
      avgSuccessProbability: 0.42,
    },
    reserveTier: {
      referrers: 1232,
      note: 'Held in reserve — activated as budget allows or if active tier underperforms',
    },
    reservedBudget: 61200,
    reservedNote: 'Allocated for expand and optimize phases (weeks 2–4)',
    perUserExample: {
      userId: '4,821',
      costPerSide: 150,
      totalCost: 300,
      successProbability: 0.35,
      expectedCostPerConversion: 857,
      tier: 'Reserve',
      reason: 'Expected cost per active customer ($857) exceeds budget-efficient threshold',
      note: 'Success probability is per-user (based on individual behavioral signals). High-probability individuals are activated first, which is why top-tier probabilities are higher than the population average.',
    },
  },

  refereeTouchpoints: [
    {
      step: 'Referral Ask',
      channel: 'Push / Email',
      recipient: 'Referrer',
      message: 'Hey [name], share your personal link and you both get $40 when your friend signs up.',
    },
    {
      step: 'Invite Landing',
      channel: 'Link',
      recipient: 'Referee',
      message: '[Referrer name] invited you to join. Sign up and you both get $40.',
    },
    {
      step: 'Welcome & KYC',
      channel: 'Push + Email',
      recipient: 'Referee',
      message: 'Welcome! Complete your ID verification to unlock your reward.',
    },
    {
      step: 'Activation Nudge',
      channel: 'Push',
      recipient: 'Referee',
      message: 'Make your first deposit to start earning — your $40 reward is waiting.',
    },
    {
      step: 'Reward Credited',
      channel: 'Push + In-App',
      recipient: 'Both',
      message: 'Your $40 reward has been credited to your account.',
    },
  ],

  previewExperience: {
    triggers: [
      {
        label: 'Bill Payment',
        referrer: {
          headline: 'You just paid your Netflix bill!',
          body: 'Help a friend save on streaming too.',
          rewardOptions: ['1 month Netflix free', '$10 Account Credit', '$10 Cashback'],
          giftOptions: ['1 month Netflix free', '$12 Account Credit', '$12 Cashback'],
          ctaText: 'Share Now',
          channel: 'Push notification',
        },
        referee: {
          avatar: 'S',
          avatarColor: '#E91E63',
          headline: 'Sarah sent you a gift!',
          body: 'She wants you to watch Netflix free for a month.',
          giftLabel: 'FREE Netflix for 1 month',
          giftIcon: 'netflix',
          ctaText: 'Claim My Gift',
          socialProof: 'Join 10,000+ happy users',
        },
      },
      {
        label: 'Direct Deposit',
        referrer: {
          headline: 'Your paycheck just landed!',
          body: 'Know someone who deserves better banking? You both get $150.',
          rewardOptions: ['$150 Cashback', '$150 Account Credit', '$75 + Gift Card'],
          giftOptions: ['$150 Cashback', '$150 Account Credit', '$75 + Gift Card'],
          ctaText: 'Share Now',
          channel: 'Push notification',
        },
        referee: {
          avatar: 'M',
          avatarColor: '#2196F3',
          headline: 'Mike thinks you should switch!',
          body: 'Join and get $150 when you set up direct deposit.',
          giftLabel: '$150 welcome bonus',
          giftIcon: 'cash',
          ctaText: 'Claim My $150',
          socialProof: 'Join 10,000+ happy users',
        },
      },
      {
        label: 'P2P Transfer',
        referrer: {
          headline: 'You just sent money to Alex!',
          body: 'Invite more friends and you both earn $150.',
          rewardOptions: ['$150 Cashback', '$150 Account Credit', '$75 + Gift Card'],
          giftOptions: ['$150 Cashback', '$150 Account Credit', '$75 + Gift Card'],
          ctaText: 'Share Now',
          channel: 'In-app prompt',
        },
        referee: {
          avatar: 'J',
          avatarColor: '#4CAF50',
          headline: 'Jordan invited you!',
          body: 'Open an account and get $150 when you make your first transaction.',
          giftLabel: '$150 activation bonus',
          giftIcon: 'cash',
          ctaText: 'Claim My $150',
          socialProof: 'Join 10,000+ happy users',
        },
      },
    ],
  },

  executionPlan: {
    seed: {
      days: '1–7',
      description:
        'Start with the top 50 highest-ROI users per strategy. Small batch to validate assumptions and calibrate messaging.',
    },
    expand: {
      days: '8–21',
      description:
        'Based on early performance, expand to next tier of eligible users. Adjust reward amounts within ranges. A/B test results start informing allocation.',
    },
    optimize: {
      days: '22+',
      description:
        'Daily recalculation: reassign users between strategies if ROI shifts. Winning A/B combinations get more budget. Underperforming combinations paused.',
    },
    guardrail:
      'Each user stays in their assigned campaign for minimum 7 days before reassignment.',
  },

  // Screen 5 — Dashboard
  dashboard30Day: {
    totalReferralsSent: 4960,
    signups: 540,
    firstTransactions: 144,
    totalNewUsers: 684,
    totalSpend: 147600,
    blendedCAC: 216,
    chartShape: 'S-curve',
    chartPhases: [
      { label: 'Seed', days: '1–7', note: 'Slow start' },
      { label: 'Expand', days: '8–21', note: 'Acceleration' },
      { label: 'Optimize', days: '22–30', note: 'Plateau' },
    ],
    ctaText: 'Book a Call',
    ctaLink: '#',
    // S-curve daily data points (cumulative conversions)
    dailyData: [
      5, 12, 20, 30, 42, 55, 70,
      92, 120, 155, 195, 240, 290, 345,
      400, 450, 495, 535, 570, 600, 625,
      645, 655, 662, 668, 673, 677, 680, 682, 684,
    ],
  },
};

export default neobank;
