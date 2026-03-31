import React from 'react';
import Logo from '../components/Logo.jsx';
import CTAButton from '../components/CTAButton.jsx';
import Chart from '../components/Chart.jsx';

function MetricRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-3.5 border-b border-border-light">
      <span className="text-sm text-foreground-muted">
        {label}
      </span>
      <span className="text-base font-semibold text-foreground">
        {value}
      </span>
    </div>
  );
}


export default function DashboardPage({ config, onHome }) {
  const { dashboard30Day } = config;

  const handleBookCall = () => {
    if (dashboard30Day.ctaLink && dashboard30Day.ctaLink !== '#') {
      window.open(dashboard30Day.ctaLink, '_blank');
    }
  };

  return (
    <div className="min-h-screen flex flex-col max-w-[1100px] mx-auto w-full px-12">
      <header className="py-2.5 mb-6">
        <Logo variant="mark" onClick={onHome} />
      </header>

      <main className="flex-1">
        <h2 className="text-2xl font-bold mb-2">
          Projected 30-Day Results
        </h2>
        <p className="text-sm text-foreground-faint mb-8">
          Based on $150K monthly budget
        </p>

        {/* Metrics */}
        <div className="border border-border rounded-lg p-6 mb-8">
          <MetricRow
            label="New active users (first transaction)"
            value={dashboard30Day.activeUsers.toLocaleString()}
          />
          <MetricRow
            label="Total referrals sent"
            value={dashboard30Day.totalReferralsSent.toLocaleString()}
          />
          <MetricRow
            label="Total spend"
            value={'$' + dashboard30Day.totalSpend.toLocaleString()}
          />
          <MetricRow
            label="CAC"
            value={'$' + dashboard30Day.cac.toLocaleString()}
          />
          <MetricRow
            label="ROI"
            value={dashboard30Day.roi + 'x'}
          />
          <MetricRow
            label="Fraud saved"
            value={'$' + dashboard30Day.fraudSaved.toLocaleString()}
          />
        </div>

        {/* Chart */}
        <div className="border border-border rounded-lg p-6 mb-8">
          <h3 className="text-base font-semibold mb-4">
            Cumulative Active Users (30 Days)
          </h3>
          <div>
            {(() => {
              const chartData = dashboard30Day.dailyData;
              const maxVal = Math.max(...chartData);
              return (
                <Chart
                  data={chartData}
                  padding={{ left: 45 }}
                  maxValue={maxVal}
                  xLabels={[
                    { value: 'Day 1', at: 1 },
                    { value: 'Day 7', at: 7 },
                    { value: 'Day 14', at: 14 },
                    { value: 'Day 21', at: 21 },
                    { value: 'Day 30', at: 30 },
                  ]}
                  yLabels={[0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(maxVal * f))}
                  gridlines="from-labels"
                  fill={{ color: 'var(--color-brand)', opacity: 0.07 }}
                  tooltip={false}
                />
              );
            })()}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pt-4">
          <CTAButton variant="brand" onClick={handleBookCall}>
            {dashboard30Day.ctaText}
          </CTAButton>
        </div>
      </main>
    </div>
  );
}
