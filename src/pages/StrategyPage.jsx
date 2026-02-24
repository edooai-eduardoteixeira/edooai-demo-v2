import React, { useState } from 'react';
import Logo from '../components/Logo.jsx';
import CTAButton from '../components/CTAButton.jsx';
import JourneyPipeline from '../components/JourneyPipeline.jsx';
import AnimatedNumber from '../components/AnimatedNumber.jsx';
import Badge from '../components/Badge.jsx';
import Expandable from '../components/Expandable.jsx';
import { useProjections } from '../hooks/useProjections.js';

function StrategyCard({ strategy, variant }) {
  return (
    <div
      style={{
        flex: 1,
        border: '1px solid var(--color-gray-200)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <Badge variant={variant}>{strategy.name}</Badge>
      </div>
      <h3
        style={{
          fontSize: 'var(--font-size-lg)',
          fontWeight: 700,
          marginBottom: '1rem',
          color: 'var(--color-gray-900)',
        }}
      >
        {strategy.headline}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <InfoRow label="Target" value={strategy.target} />
        <InfoRow label="Success metric" value={strategy.successMetric} />
        <InfoRow
          label="Qualification"
          value={`${strategy.qualificationBehavioral}. With profile data: ${strategy.qualificationWithProfile}.`}
        />
        <InfoRow
          label="Reward"
          value={`$${strategy.rewardPerSide}/side · ${strategy.rewardTypes.join(' or ')} (${strategy.abTestNote})`}
        />
        <InfoRow label="Basis" value={strategy.basis} />
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <span
        style={{
          fontSize: 'var(--font-size-xs)',
          fontWeight: 600,
          color: 'var(--color-gray-500)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </span>
      <p
        style={{
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-gray-700)',
          marginTop: '0.125rem',
          lineHeight: 1.5,
        }}
      >
        {value}
      </p>
    </div>
  );
}

function MetricCard({ label, children }) {
  return (
    <div
      style={{
        flex: 1,
        padding: '1.25rem',
        backgroundColor: 'var(--color-gray-50)',
        borderRadius: 'var(--radius-lg)',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: 'var(--font-size-xs)',
          fontWeight: 500,
          color: 'var(--color-gray-500)',
          marginBottom: '0.5rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 'var(--font-size-3xl)',
          fontWeight: 700,
          color: 'var(--color-black)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default function StrategyPage({ config, onNext }) {
  const { strategies, budgetSlider, projections: projData, journeyInference, strategyBreakdown150K, perUserROIExample, executionPlan } = config;

  const [budget, setBudget] = useState(budgetSlider.default);
  const proj = useProjections(projData, budget);

  const pipelineAnnotations = {
    0: { text: 'Quick Win — redemption triggers here', variant: 'quickwin' },
    2: { text: 'Look-a-Like — redemption triggers here', variant: 'lookalike' },
  };

  const formatCurrency = (val) => '$' + val.toLocaleString('en-US');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header
        style={{
          padding: '1.5rem 3rem',
          borderBottom: '1px solid var(--color-gray-100)',
        }}
      >
        <Logo />
      </header>

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          padding: '2rem 3rem 6rem',
          maxWidth: '1100px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        {/* Section 1: Journey Pipeline + Strategy Overview */}
        <section style={{ marginBottom: '3rem' }}>
          <h2
            style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 700,
              marginBottom: '1.5rem',
            }}
          >
            Strategy Proposal
          </h2>

          {/* Journey Pipeline */}
          <div style={{ marginBottom: '2rem' }}>
            <JourneyPipeline
              stages={journeyInference.stages}
              visibleCount={journeyInference.stages.length}
              annotations={pipelineAnnotations}
              conversionLabels={{ 1: '34% convert within 90 days' }}
              showManagementBracket
            />
          </div>

          {/* Strategy Cards */}
          <div className="strategy-cards" style={{ display: 'flex', gap: '1.5rem' }}>
            <StrategyCard strategy={strategies.quickWin} variant="quickwin" />
            <StrategyCard strategy={strategies.lookALike} variant="lookalike" />
          </div>
        </section>

        {/* Section 2: Budget Slider + Projections */}
        <section style={{ marginBottom: '3rem' }}>
          <h3
            style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: 700,
              marginBottom: '1.5rem',
            }}
          >
            Set your monthly budget cap
          </h3>

          {/* Slider */}
          <div style={{ marginBottom: '2rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.75rem',
              }}
            >
              <span
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-gray-500)',
                }}
              >
                {formatCurrency(budgetSlider.min)}
              </span>
              <span
                style={{
                  fontSize: 'var(--font-size-2xl)',
                  fontWeight: 700,
                  color: 'var(--color-black)',
                }}
              >
                <AnimatedNumber
                  value={budget}
                  prefix="$"
                  duration={200}
                />
              </span>
              <span
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-gray-500)',
                }}
              >
                {formatCurrency(budgetSlider.max)}
              </span>
            </div>
            <input
              type="range"
              min={budgetSlider.min}
              max={budgetSlider.max}
              step={budgetSlider.step}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              style={{
                width: '100%',
                height: '6px',
                appearance: 'none',
                backgroundColor: 'var(--color-gray-200)',
                borderRadius: '3px',
                outline: 'none',
                cursor: 'pointer',
                accentColor: 'var(--color-black)',
              }}
            />
          </div>

          {/* Projections */}
          <div className="metric-cards" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <MetricCard label="Total new users acquired">
              <AnimatedNumber value={proj.newUsers} duration={300} />
            </MetricCard>
            <MetricCard label="Total projected spend">
              <AnimatedNumber value={proj.spend} prefix="$" duration={300} />
            </MetricCard>
            <MetricCard label="Blended CAC">
              <AnimatedNumber value={proj.cac} prefix="$" duration={300} />
            </MetricCard>
          </div>

          <p
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-gray-500)',
              lineHeight: 1.6,
            }}
          >
            Projections based on your historical data (34% sign-up to first
            transaction rate, 90-day window). Once campaigns launch, Edoo
            recalculates daily based on actual performance.
          </p>
        </section>

        {/* Section 3: Expandable Details */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Expandable title="View Full Strategy Detail">
            <StrategyDetailContent
              breakdown={strategyBreakdown150K}
              strategies={strategies}
              roiExample={perUserROIExample}
              budget={budget}
            />
          </Expandable>
          <Expandable title="View Execution Plan">
            <ExecutionPlanContent plan={executionPlan} />
          </Expandable>
        </section>
      </main>

      {/* Bottom Bar */}
      <div
        style={{
          position: 'sticky',
          bottom: 0,
          borderTop: '1px solid var(--color-gray-200)',
          backgroundColor: 'var(--color-white)',
          padding: '1.25rem 3rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem',
        }}
        className="bottom-bar"
      >
        <CTAButton onClick={onNext}>Launch Campaigns</CTAButton>
        <p
          style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-gray-400)',
          }}
        >
          In production, this triggers autonomous execution. In this demo, we'll
          show you projected 30-day results.
        </p>
      </div>
    </div>
  );
}

function StrategyDetailContent({ breakdown, strategies, roiExample, budget }) {
  const formatBudget = (v) => '$' + (v / 1000).toFixed(0) + 'K';

  return (
    <div>
      <h4
        style={{
          fontSize: 'var(--font-size-sm)',
          fontWeight: 600,
          marginBottom: '1rem',
          color: 'var(--color-gray-700)',
        }}
      >
        Per-Strategy Breakdown at Current Budget ({formatBudget(budget)})
      </h4>

      {/* Breakdown Table */}
      <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          <thead>
            <tr style={{ borderBottom: '2px solid var(--color-gray-200)' }}>
              <th style={thStyle}></th>
              <th style={thStyle}>Quick Win</th>
              <th style={thStyle}>Look-a-Like</th>
            </tr>
          </thead>
          <tbody>
            <tr style={trStyle}>
              <td style={tdLabelStyle}>Eligible referrers</td>
              <td style={tdStyle}>{breakdown.quickWin.eligibleReferrers.toLocaleString()}</td>
              <td style={tdStyle}>{breakdown.lookALike.eligibleReferrers.toLocaleString()}</td>
            </tr>
            <tr style={trStyle}>
              <td style={tdLabelStyle}>Projected referrals sent</td>
              <td style={tdStyle}>{breakdown.quickWin.projectedReferralsSent.toLocaleString()}</td>
              <td style={tdStyle}>{breakdown.lookALike.projectedReferralsSent.toLocaleString()}</td>
            </tr>
            <tr style={trStyle}>
              <td style={tdLabelStyle}>Projected conversions</td>
              <td style={tdStyle}>{breakdown.quickWin.projectedConversions.toLocaleString()} {breakdown.quickWin.conversionUnit}</td>
              <td style={tdStyle}>{breakdown.lookALike.projectedConversions.toLocaleString()} {breakdown.lookALike.conversionUnit}</td>
            </tr>
            <tr style={trStyle}>
              <td style={tdLabelStyle}>Reward per conversion</td>
              <td style={tdStyle}>${breakdown.quickWin.rewardPerConversion} total (${strategies.quickWin.rewardPerSide}/side x 2)</td>
              <td style={tdStyle}>${breakdown.lookALike.rewardPerConversion} total (${strategies.lookALike.rewardPerSide}/side x 2)</td>
            </tr>
            <tr style={trStyle}>
              <td style={tdLabelStyle}>Projected spend</td>
              <td style={tdStyle}>${breakdown.quickWin.projectedSpend.toLocaleString()}</td>
              <td style={tdStyle}>${breakdown.lookALike.projectedSpend.toLocaleString()}</td>
            </tr>
            <tr style={trStyle}>
              <td style={tdLabelStyle}>Allocation</td>
              <td style={tdStyle}>{breakdown.quickWin.allocationPercent}% of eligible users</td>
              <td style={tdStyle}>{breakdown.lookALike.allocationPercent}% of eligible users</td>
            </tr>
          </tbody>
        </table>
        <p
          style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-gray-400)',
            marginTop: '0.75rem',
            fontStyle: 'italic',
          }}
        >
          Note: Remaining budget (~${(breakdown.reservedBudget / 1000).toFixed(0)}K of the budget) is {breakdown.reservedNote.toLowerCase()}.
        </p>
      </div>

      {/* A/B Test Variables */}
      <h4
        style={{
          fontSize: 'var(--font-size-sm)',
          fontWeight: 600,
          marginBottom: '0.75rem',
          color: 'var(--color-gray-700)',
        }}
      >
        A/B Test Variables
      </h4>
      <ul style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)', lineHeight: 1.8, paddingLeft: '1.25rem', marginBottom: '2rem' }}>
        <li>Quick Win: Coupon vs. Account Credit x 2 message variants = 4 combinations.</li>
        <li>Look-a-Like: Cashback vs. Account Credit x 2 message variants = 4 combinations.</li>
        <li>Timing: Quick Win sends within 24h of eligibility detection. Look-a-Like sends at peak engagement time per user (inferred from historical activity patterns).</li>
        <li>Channel: Per user's most responsive channel (email, push, SMS, WhatsApp).</li>
      </ul>

      {/* Per-User ROI Example */}
      <h4
        style={{
          fontSize: 'var(--font-size-sm)',
          fontWeight: 600,
          marginBottom: '0.75rem',
          color: 'var(--color-gray-700)',
        }}
      >
        Per-User ROI Ranking Example
      </h4>
      <div
        style={{
          backgroundColor: 'var(--color-gray-50)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem',
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-gray-700)',
          lineHeight: 1.7,
          marginBottom: '1rem',
        }}
      >
        <p>
          User #{roiExample.userId}: Eligible for both strategies.
        </p>
        <p>
          Quick Win: ${roiExample.quickWin.costPerSide}/side x 2 = ${roiExample.quickWin.totalCost} total cost,{' '}
          {(roiExample.quickWin.successProbability * 100).toFixed(0)}% success probability.
          Expected cost per conversion: ${roiExample.quickWin.totalCost} / {roiExample.quickWin.successProbability.toFixed(2)} = ${roiExample.quickWin.expectedCostPerConversion}.
        </p>
        <p>
          Look-a-Like: ${roiExample.lookALike.costPerSide}/side x 2 = ${roiExample.lookALike.totalCost} total cost,{' '}
          {(roiExample.lookALike.successProbability * 100).toFixed(0)}% success probability.
          Expected cost per conversion: ${roiExample.lookALike.totalCost} / {roiExample.lookALike.successProbability.toFixed(2)} = ${roiExample.lookALike.expectedCostPerConversion}.
        </p>
        <p style={{ fontWeight: 600 }}>
          Assigned to: {roiExample.assignedTo} ({roiExample.reason}).
        </p>
      </div>
      <p
        style={{
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-gray-400)',
          fontStyle: 'italic',
        }}
      >
        {roiExample.note}
      </p>

      {/* Current Allocation Logic */}
      <h4
        style={{
          fontSize: 'var(--font-size-sm)',
          fontWeight: 600,
          marginTop: '1.5rem',
          marginBottom: '0.75rem',
          color: 'var(--color-gray-700)',
        }}
      >
        Current Allocation Logic
      </h4>
      <p
        style={{
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-gray-600)',
          lineHeight: 1.7,
        }}
      >
        Each eligible user is evaluated for both strategies. The system calculates expected cost per
        conversion: total reward cost divided by estimated success probability. Users are assigned to the
        strategy with the lower expected cost per conversion. At ${(budget / 1000).toFixed(0)}K budget:{' '}
        {breakdown.quickWin.allocationPercent}% of eligible users assigned to Quick Win (higher volume,
        lower cost), {breakdown.lookALike.allocationPercent}% to Look-a-Like (lower volume, higher value).
        This ratio shifts daily as campaign performance data comes in.
      </p>
    </div>
  );
}

function ExecutionPlanContent({ plan }) {
  const phases = [
    { label: `Seed (Days ${plan.seed.days})`, text: plan.seed.description },
    { label: `Expand (Days ${plan.expand.days})`, text: plan.expand.description },
    { label: `Optimize (Day ${plan.optimize.days})`, text: plan.optimize.description },
  ];

  return (
    <div>
      {phases.map((phase, i) => (
        <div
          key={i}
          style={{
            marginBottom: '1.5rem',
            paddingLeft: '1rem',
            borderLeft: '3px solid var(--color-gray-200)',
          }}
        >
          <h4
            style={{
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
              color: 'var(--color-gray-800)',
              marginBottom: '0.375rem',
            }}
          >
            {phase.label}
          </h4>
          <p
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-gray-600)',
              lineHeight: 1.6,
            }}
          >
            {phase.text}
          </p>
        </div>
      ))}
      <p
        style={{
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-gray-500)',
          fontStyle: 'italic',
          padding: '0.75rem',
          backgroundColor: 'var(--color-gray-50)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        Guardrail: {plan.guardrail}
      </p>
    </div>
  );
}

const thStyle = {
  textAlign: 'left',
  padding: '0.75rem',
  fontSize: 'var(--font-size-sm)',
  fontWeight: 600,
  color: 'var(--color-gray-700)',
};

const trStyle = {
  borderBottom: '1px solid var(--color-gray-100)',
};

const tdLabelStyle = {
  padding: '0.625rem 0.75rem',
  fontSize: 'var(--font-size-sm)',
  fontWeight: 500,
  color: 'var(--color-gray-600)',
};

const tdStyle = {
  padding: '0.625rem 0.75rem',
  fontSize: 'var(--font-size-sm)',
  color: 'var(--color-gray-700)',
};
