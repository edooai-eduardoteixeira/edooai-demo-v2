const neobank = {
  // Vertical Metadata
  vertical: 'neobank',
  companyType: 'Mid-sized US neobank',
  companyStage: 'Series B\u2013C',
  totalCustomers: 847000,

  // Screen 1 — Landing Page
  landing: {
    headline: 'Turn your best customers into your growth engine.',
    subheadline:
      'Stop competing for expensive ads while your most powerful channel is untapped. We operate your referrals end-to-end to deliver active customers at a fraction of your CAC.',
    ctaText: 'Start Now',
    missionLine: 'On a mission to scale distribution for the best products on earth.',
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
    max: 500000,
    step: 5000,
    default: 150000,
  },

  // Recommended budget range — personalized per customer base
  // Computed from: audience_size × saturation_curve × frequency guardrails
  recommendedBudget: {
    min: 100000,
    max: 200000,
    amount: 150000,
    rationale: 'Based on your 847K customers, we recommend $150K/month',
  },

  // Guidance messages — Head of Growth language, dynamic per budget level
  budgetGuidance: {
    belowFloor: 'Below minimum delivery threshold. Not enough signal to optimize — CPA stays flat.',
    belowRec: 'Lean delivery. System optimizes slower — expect 2x the ramp time to peak CPA.',
    atRec: 'Strong signal volume for 847K eligible users. Expect full CPA optimization within this period.',
    aboveRec: 'Audience saturates above $200K/mo for this base. Incremental spend raises CPA.',
  },

  // ─── Projection Engine Parameters ───
  // All projections (daily curve, KPIs, threshold day) are computed dynamically
  // by src/engine/projectionEngine.js using these parameters.
  engineParams: {
    learningCAC: 400,              // Starting CAC before any optimization ($)
    optimizedCAC: 100,             // Best achievable CAC at full confidence ($)
    audienceSize: 250000,          // Total reachable users for referral program
    fraudRate: 0.07,               // Fraction of spend saved by fraud detection
    avgRevenuePerUser: 500,        // Revenue per activated user (for ROI calc)
    baseConvRate: 4.8,            // Base conversion rate (%)
    minSignalVolume: 325,         // Cumulative conversions for statistical significance (calibrated: floor≈$75K at D21)
    diminishing: {
      // difficulty = 1 + scale * (dailyBudget/audience)^curve
      // Produces U-shaped CAC: minimum in recommended range, rises above recMax
      // Calibrated for audienceSize=250K: difficulty($75K)=1.03, difficulty($150K)=1.09, difficulty($500K)=1.44
      scale: 16.5,
      curve: 1.34,
    },
    confidence: {
      volumeHalfPoint: 12,        // Cumulative conversions for 50% volume confidence
      timeHalfPoint: 3,           // Days for 50% time confidence
      volumeWeight: 0.6,          // Relative weight of volume vs time
      timeWeight: 0.4,
    },
    budget: {
      floor: 75000,               // Below = belowFloor guidance
      recMin: 100000,             // Below recMin = belowRec guidance
      recMax: 200000,             // Above recMax = aboveRec guidance
    },
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
  },

  // Risk management
  riskManagement: {
    controls: [
      {
        key: 'dailySpendCap',
        label: 'Daily spend cap',
        ratio: 1 / 30,
        format: 'currency',
        labelTooltip: 'Daily budget target adjusts for day-of-week patterns and offer expiration timing. Accelerates when outperforming, conserves when under.',
        valueTooltip: 'Budget \u00f7 remaining days',
      },
      {
        key: 'weeklySpendCap',
        label: 'Weekly spend cap',
        ratio: 0.25,
        format: 'currency',
        labelTooltip: 'Weekly ceiling prevents front-loading. Budget lasts the full month even if early cohorts convert fast.',
        valueTooltip: '25% of monthly budget',
      },
      {
        key: 'outstandingExposure',
        label: 'Outstanding exposure',
        ratio: 0.40,
        format: 'currency',
        labelTooltip: 'Offers issued but not yet redeemed are financial commitments. This cap limits how much can be in flight at once.',
        valueTooltip: '40% of monthly budget',
      },
      {
        key: 'offerWindow',
        label: 'Offer expiration',
        fixedValue: '14 days',
        labelTooltip: 'Referee has 14 days to complete first transaction. Expired offers free budget back to the allocation pool.',
        valueTooltip: 'Fixed window per offer',
      },
      {
        key: 'anomalyPause',
        label: 'Anomaly auto-pause',
        fixedValue: 'On',
        labelTooltip: 'Pattern-based detection for unexpected conversion drops, spend spikes, or behavioral shifts. Auto-pauses affected segments.',
        valueTooltip: 'Triggered by anomaly detection models',
      },
    ],
    fraud: [
      {
        type: 'Suspicious Individuals',
        rate: 2.1,
        tooltip: 'Fake accounts self-referring. Detected via device fingerprint + KYC overlap + dormancy cycling patterns.',
      },
      {
        type: 'Fraud Rings',
        rate: 0.4,
        tooltip: 'Organized groups extracting rewards. Detected via graph analysis + velocity anomalies + shared infrastructure markers.',
      },
      {
        type: 'Attribution Abuse',
        rate: 1.3,
        tooltip: 'Referral codes posted publicly. Detected via channel classification + referrer volume caps + click-to-signup timing.',
      },
    ],
    fraudTotalTooltip: 'Combined estimated fraud exposure across all detection categories. Based on industry benchmarks and your customer profile.',
    fraudPolicy: 'Rewards held until signals clear.',
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
