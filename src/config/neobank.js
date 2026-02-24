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
      label: 'Customer Data & Communications',
      accessType: 'Read + Write',
      description:
        "Read to ingest customer data. Write to send referral communications through your existing channels, in your brand's voice.",
      platforms: ['Segment', 'Braze', 'Klaviyo', 'HubSpot', 'Customer.io'],
      defaultPlatform: 'Braze',
      status: 'Required',
      fieldsProvided: [
        {
          category: 'Customer Base',
          fields: [
            { framework: 'Unique Customer ID', business: 'Account Number' },
            {
              framework: 'Contact Permissions',
              business: 'Opt-in + per-channel consent',
            },
            {
              framework: 'Contact Channel',
              business: 'Email, phone, push token, or WhatsApp ID',
            },
            { framework: 'Customer Name', business: 'First + Last' },
          ],
        },
      ],
    },
    group2: {
      label: 'Transaction & Behavioral Data',
      accessType: 'Read Only',
      description:
        'Transaction history and behavioral events. If your CRM already covers these fields, this connection is optional.',
      platforms: ['Snowflake', 'BigQuery', 'Redshift', 'Databricks', 'Synapse'],
      defaultPlatform: 'Snowflake',
      status: 'Required',
      fieldsProvided: [
        {
          category: 'Transaction History',
          fields: [
            { framework: 'Recency', business: 'Last transaction date' },
            {
              framework: 'Frequency',
              business: 'Transaction count, trailing 90 days',
            },
            {
              framework: 'Monetary Value',
              business: 'Total transaction volume, trailing 90 days',
            },
            {
              framework: 'Product / SKU',
              business:
                'Transaction category: P2P, card purchase, deposit, withdrawal',
            },
          ],
        },
        {
          category: 'Behavioral Events',
          fields: [
            {
              framework: 'Event Type',
              business:
                'sign_up, kyc_completed, first_transaction, card_transaction',
            },
            { framework: 'Event Timestamp', business: 'Event Timestamp' },
            {
              framework: 'Event Sequence per User',
              business: 'Event Sequence per User',
            },
          ],
        },
      ],
    },
    group3: {
      label: 'Customer Satisfaction Signals',
      accessType: 'Read Only',
      description:
        'NPS scores, support tickets, reviews. Works without it, works better with it.',
      platforms: ['Zendesk', 'Intercom', 'Delighted'],
      defaultPlatform: 'Zendesk',
      status: 'Optional — Enrichment',
      fieldsProvided: [
        {
          category: 'Satisfaction Signals',
          fields: [
            { framework: 'NPS / CSAT Score', business: 'NPS / CSAT Score' },
            {
              framework: 'Support Ticket Count',
              business: 'Support Ticket Count',
            },
            {
              framework: 'Last Support Interaction Date',
              business: 'Last Support Interaction Date',
            },
          ],
        },
      ],
    },
    profileDataNote:
      'Not detected — strategies will use behavioral data only.',
    requiredFieldCount: 11,
    bottomBarSummary:
      '2 sources connected · 847,000 customer records · 11 of 11 required fields detected',
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
  },

  // Screen 4 — Strategy & Projections
  strategies: {
    quickWin: {
      name: 'Quick Win',
      headline: 'Maximize New Sign-Ups',
      target:
        'High-propensity referrers (users with strong social signals and recent engagement)',
      successMetric: 'Referee completes sign-up',
      qualificationBehavioral:
        'Behavioral only (profile data not connected)',
      qualificationWithProfile:
        'Sign-up + age 25–45 in target metros',
      rewardPerSide: 40,
      rewardTotal: 80,
      rewardTypes: ['Coupon', 'Account Credit'],
      abTestNote: 'A/B tested',
      basis: 'Quick-acquisition approach. Low barrier, high volume.',
      timing: 'Sends within 24h of eligibility detection',
    },
    lookALike: {
      name: 'Look-a-Like',
      headline: 'Maximize Active Users',
      target:
        'Most engaged existing users; acquire referees who resemble them',
      successMetric: 'Referee completes first transaction',
      qualificationBehavioral:
        'Behavioral only (profile data not connected)',
      qualificationWithProfile:
        '1st transaction + income bracket match',
      rewardPerSide: 150,
      rewardTotal: 300,
      rewardTypes: ['Cashback', 'Account Credit'],
      abTestNote: 'A/B tested',
      basis:
        'Clone-the-best approach. Higher barrier, higher lifetime value. Based on your 34% sign-up to first transaction conversion rate.',
      timing: 'Sends at peak engagement time per user',
    },
  },

  budgetSlider: {
    min: 50000,
    max: 1000000,
    step: 10000,
    default: 150000,
  },

  projections: [
    { budget: 50000, newUsers: 198, spend: 49200, cac: 249 },
    { budget: 100000, newUsers: 438, spend: 98400, cac: 225 },
    { budget: 150000, newUsers: 684, spend: 147600, cac: 216 },
    { budget: 250000, newUsers: 1120, spend: 246000, cac: 220 },
    { budget: 500000, newUsers: 2180, spend: 492000, cac: 226 },
    { budget: 1000000, newUsers: 4050, spend: 972000, cac: 240 },
  ],

  strategyBreakdown150K: {
    quickWin: {
      eligibleReferrers: 2400,
      projectedReferralsSent: 3600,
      projectedConversions: 540,
      conversionUnit: 'sign-ups',
      rewardPerConversion: 80,
      projectedSpend: 43200,
      allocationPercent: 78,
    },
    lookALike: {
      eligibleReferrers: 680,
      projectedReferralsSent: 1360,
      projectedConversions: 144,
      conversionUnit: 'first transactions',
      rewardPerConversion: 300,
      projectedSpend: 43200,
      allocationPercent: 22,
    },
    reservedBudget: 61200,
    reservedNote:
      'Allocated for expand and optimize phases (weeks 2–4)',
  },

  perUserROIExample: {
    userId: '4,821',
    quickWin: {
      costPerSide: 40,
      totalCost: 80,
      successProbability: 0.6,
      expectedCostPerConversion: 133,
    },
    lookALike: {
      costPerSide: 150,
      totalCost: 300,
      successProbability: 0.35,
      expectedCostPerConversion: 857,
    },
    assignedTo: 'Quick Win',
    reason: '$133 vs. $857 per conversion',
    note: "Success probability is per-user (based on individual behavioral signals), not the aggregate conversion rate. High-probability individuals are selected first, which is why per-user probabilities (60%, 35%) are higher than the population average.",
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
