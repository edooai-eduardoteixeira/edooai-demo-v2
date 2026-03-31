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

function parsePhases(phases, dataLength) {
  const parsed = (phases || []).map((phase) => {
    const parts = phase.days.split(/[–\u2013-]/);
    return { startDay: parseInt(parts[0]), endDay: parseInt(parts[1] || parts[0]), label: phase.label };
  });
  const boundaries = [];
  for (let i = 0; i < parsed.length - 1; i++) {
    boundaries.push(parsed[i].endDay);
  }
  const labels = parsed.map((p) => ({
    midDay: (p.startDay + p.endDay) / 2,
    label: p.label,
  }));
  return { boundaries, labels };
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
          <div className="flex justify-center max-w-[700px]">
            {(() => {
              const chartData = dashboard30Day.dailyData;
              const maxVal = Math.max(...chartData);
              const { boundaries, labels } = parsePhases(dashboard30Day.chartPhases, chartData.length);
              return (
                <Chart
                  data={chartData}
                  height={280}
                  aspectRatio={700 / 280}
                  padding={{ top: 30, right: 20, bottom: 50, left: 60 }}
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
                >
                  {({ chartW, chartTop, chartH }) => (
                    <>
                      {boundaries.map((day, i) => {
                        const x = ((day - 1) / (chartData.length - 1)) * chartW;
                        return (
                          <line
                            key={`b-${i}`}
                            x1={x} y1={chartTop}
                            x2={x} y2={chartTop + chartH}
                            stroke="var(--color-gray-300)"
                            strokeWidth="1"
                            strokeDasharray="4,4"
                          />
                        );
                      })}
                      {labels.map(({ midDay, label }, i) => {
                        const x = ((midDay - 1) / (chartData.length - 1)) * chartW;
                        return (
                          <text
                            key={`l-${i}`}
                            x={x} y={chartTop - 8}
                            textAnchor="middle"
                            fontSize="11"
                            fontWeight="500"
                            fill="var(--text-tertiary)"
                            fontFamily="var(--font-family)"
                          >
                            {label}
                          </text>
                        );
                      })}
                    </>
                  )}
                </Chart>
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
