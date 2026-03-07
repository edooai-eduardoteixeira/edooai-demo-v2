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
    max: 300000,
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
    belowFloor: 'Below minimum delivery threshold. Not enough signal to optimize \u2014 CPA stays flat.',
    belowRec: 'Lean delivery. System optimizes slower \u2014 expect 2x the ramp time to peak CPA.',
    atRec: 'Strong signal volume for 847K eligible users. Expect full CPA optimization within this period.',
    aboveRec: 'Audience saturates above $200K/mo for this base. Incremental spend raises CPA.',
  },

  // ─── Projection Engine Parameters ───
  // All projections (daily curve, KPIs, threshold day) are computed dynamically
  // by src/engine/projectionEngine.js using these parameters.
  //
  // Model: Journey-based Allocation Calculator with Resolution Delay
  //   Supply curve: N_frontier(B) = N_max × (B / (B + B_half))^alpha  [conversion units]
  //   Journey target: totalJourneys = N_frontier / baseConvRate        [journey units]
  //   Efficiency:   eff(day, cumN) = floor + (1−floor) × timeLearning × volumeConfidence
  //   Reach quality: wider net = lower quality per contact (structural, not temporal)
  //   Distributed resolution: truncated normal distribution (no staircase)
  //   Value learning: engine finds super referrers → higher-value customers over time
  //
  // Calibrated via scripts/calibrate-engine.mjs to hit:
  //   $50K  → ~200 users, CAC ~$250, ROI ~2.0x
  //   $150K → ~500 users, CAC ~$300, ROI ~1.7x
  //   $300K → ~720 users, CAC ~$417, ROI ~1.2x
  engineParams: {
    // Audience — derived: audienceSize = totalCustomers × eligibilityRate
    totalCustomers: 847000,            // Total customer base (from data ingestion)
    eligibilityRate: 0.295,            // Fraction eligible for referral program → ~250K

    // Supply curve — theoretical max CONVERSIONS at given budget
    N_max: 5000,                       // Ceiling: max conversions at infinite budget (NOT audience size)
    B_half: 400000,                    // Budget for 50% of N_max ($)
    alpha: 1,                          // Concavity exponent (1 = Michaelis-Menten)

    // Allocation efficiency — learning dynamics
    effFloor: 0.30,                    // Min efficiency (random allocation success rate)
    timeLearnRate: 0.06,               // Speed of time-based learning (exp decay rate)
    confHalfPoint: 70,                 // Resolved conversions for 50% volume confidence

    // Conversion probabilities per journey
    baseConvRate: 0.03,                // P(conversion | well-targeted journey) for best prospects
    accidentalConvRate: 0.002,         // P(conversion | poorly-targeted journey)

    // Reach quality — conv rate decreases with budget (structural)
    reachDecayExponent: 1.0,           // How much wider reach penalizes conversion quality (calibrate)

    // Journey pacing & distributed resolution
    maxDailyReachRate: 0.03,           // Max fraction of pool contacted per day
    avgResolutionDays: 3,              // Mean of normal distribution for resolution timing
    offerExpirationDays: 14,           // Max days before offer expires (right bound of distribution)
    referrerEligibilityRate: 0.4,      // Fraction of new converts who become eligible referrers

    // Economics — value varies with engine learning (80/20 dynamic)
    baseRevenuePerUser: 250,           // Revenue per user when engine is untrained (random targeting)
    premiumRevenuePerUser: 700,        // Revenue per user when engine is fully optimized (super referrers)
    fraudRate: 0.07,                   // Fraction of spend saved by fraud detection
    minSignalVolume: 40,               // Resolved conversions for statistical significance

    // Budget guidance thresholds
    budget: {
      floor: 10000,                // Below = belowFloor guidance
      recMin: 100000,              // Below recMin = belowRec guidance
      recMax: 200000,              // Above recMax = aboveRec guidance
    },

    // ─── Guardrails Config (UI display data — does NOT change engine computation) ───
    guardrails: {
      // FEAR 1: Audience Harm
      audienceProtection: {
        label: 'Audience Protection',
        subtitle: 'Who is contacted',
        filters: [
          { id: 'opted_out', label: 'Opted-out users', locked: true,
            description: 'Users who opted out of marketing communications' },
          { id: 'low_nps', label: 'Low NPS', controlType: 'threshold', default: 6,
            description: 'Exclude NPS detractors (score \u2264 threshold)' },
          { id: 'active_support', label: 'Active support tickets', controlType: 'toggle', default: true,
            description: 'Users with open support cases' },
          { id: 'fraud_flagged', label: 'Fraud-flagged accounts', controlType: 'toggle', default: true,
            description: 'Accounts with historical fraud indicators' },
          { id: 'compliance_holds', label: 'Compliance holds', controlType: 'toggle', default: true,
            description: 'Regulatory or compliance restrictions' },
          { id: 'min_tenure', label: 'Account too new', controlType: 'threshold', default: 60,
            unit: 'days', description: 'Accounts under threshold age' },
          { id: 'inactive', label: 'Inactive accounts', controlType: 'threshold', default: 90,
            unit: 'days', description: 'No activity beyond threshold' },
        ],
      },
      // FEAR 2: Customer Fatigue
      customerFatigue: {
        label: 'Customer Fatigue',
        subtitle: 'How people are treated',
        rules: [
          { id: 'max_touchpoints', label: 'Max touchpoints per stage',
            controlType: 'integer', default: 2, range: [1, 5],
            description: 'Limits volume per user per active funnel stage. Refreshes on progression.' },
          { id: 'rest_period', label: 'Minimum rest period',
            controlType: 'duration', default: 2, options: [1, 2, 3, 5, 7], unit: 'days',
            description: 'Minimum gap between touchpoints within a stage' },
          { id: 'offer_window', label: 'Offer window',
            controlType: 'duration', default: 14, range: [1, 30], unit: 'days',
            description: 'How long each customer is in play. Maps to offerExpirationDays.' },
        ],
      },
      // FEAR 3: Financial Waste
      financialControls: {
        label: 'Financial Controls',
        subtitle: 'How money is controlled',
        rules: [
          { id: 'daily_invite_cap', label: 'Daily invite cap',
            controlType: 'integer', default: 'auto',
            description: 'Max new top-of-funnel referral requests per day. Auto-calculated from budget and assumed conversion rate.' },
          { id: 'max_outstanding', label: 'Max outstanding offers',
            controlType: 'cap', default: 'budget * 2',
            description: 'Hard limit on total $ value of unexpired links. Pauses new outreach if hit.' },
          { id: 'spend_anomaly', label: 'Spend anomaly pause',
            controlType: 'threshold', default: 'daily_pace * 5',
            description: 'If actual paid conversions spike beyond threshold in 24h, pauses new invites and alerts client.' },
        ],
      },
      // FEAR 4: Fraud
      fraudPrevention: {
        label: 'Fraud Prevention',
        subtitle: 'How fraud is handled',
        mechanisms: [
          { id: 'self_referral', label: 'Self-Referral Blocker',
            controlType: 'strictness', default: 'standard', options: ['standard', 'aggressive'],
            description: 'Standard: reject identical IP. Aggressive: reject shared devices/Wi-Fi.' },
          { id: 'suspicious_escrow', label: 'Suspicious Escrow',
            controlType: 'conditional', default: { threshold: 3, window: '24h', holdDays: 7 },
            description: 'If >N conversions in window, hold payout for X days.' },
          { id: 'link_hijacking', label: 'Link Hijacking Limit',
            controlType: 'threshold', default: 5,
            description: 'Max payouts per referral link. Auto-invalidates after cap.' },
          { id: 'network_shield', label: 'Network & Botnet Shield',
            controlType: 'strictness', default: 'aggressive', options: ['standard', 'aggressive'],
            description: 'Standard: reject datacenter/TOR/proxy IPs. Aggressive: add behavioral cluster detection.' },
        ],
        footer: 'Rewards held until signals clear.',
      },
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
