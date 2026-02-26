import React from 'react';
import Logo from '../components/Logo.jsx';
import CTAButton from '../components/CTAButton.jsx';

function MetricRow({ label, value }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.875rem 0',
        borderBottom: '1px solid var(--color-gray-100)',
      }}
    >
      <span
        style={{
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-gray-600)',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 'var(--font-size-base)',
          fontWeight: 600,
          color: 'var(--color-gray-900)',
        }}
      >
        {value}
      </span>
    </div>
  );
}

function SimpleLineChart({ data, phases }) {
  const width = 700;
  const height = 280;
  const padding = { top: 30, right: 20, bottom: 50, left: 60 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxVal = Math.max(...data);
  const points = data.map((v, i) => ({
    x: padding.left + (i / (data.length - 1)) * chartW,
    y: padding.top + chartH - (v / maxVal) * chartH,
  }));

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

  const parsedPhases = (phases || []).map((phase) => {
    const parts = phase.days.split(/[–\u2013-]/);
    const startDay = parseInt(parts[0]);
    const endDay = parseInt(parts[1] || parts[0]);
    return { startDay, endDay, label: phase.label };
  });

  const boundaries = [];
  for (let i = 0; i < parsedPhases.length - 1; i++) {
    const boundaryDay = parsedPhases[i].endDay;
    boundaries.push(padding.left + ((boundaryDay - 1) / (data.length - 1)) * chartW);
  }

  const phaseLabels = parsedPhases.map((phase) => {
    const midDay = (phase.startDay + phase.endDay) / 2;
    const x = padding.left + ((midDay - 1) / (data.length - 1)) * chartW;
    return { x, label: phase.label };
  });

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ width: '100%', maxWidth: '700px' }}
    >
      <defs>
        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="black" stopOpacity="0.08" />
          <stop offset="100%" stopColor="black" stopOpacity="0" />
        </linearGradient>
      </defs>

      {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
        const y = padding.top + chartH * (1 - frac);
        const val = Math.round(maxVal * frac);
        return (
          <g key={i}>
            <line
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              stroke="#e5e5e5"
              strokeWidth="1"
            />
            <text
              x={padding.left - 10}
              y={y + 4}
              textAnchor="end"
              fill="#a3a3a3"
              fontSize="11"
              fontFamily="Inter, sans-serif"
            >
              {val}
            </text>
          </g>
        );
      })}

      {[1, 7, 14, 21, 30].map((day) => {
        const x = padding.left + ((day - 1) / (data.length - 1)) * chartW;
        return (
          <text
            key={day}
            x={x}
            y={height - 10}
            textAnchor="middle"
            fill="#a3a3a3"
            fontSize="11"
            fontFamily="Inter, sans-serif"
          >
            Day {day}
          </text>
        );
      })}

      {boundaries.map((x, i) => (
        <line
          key={`boundary-${i}`}
          x1={x}
          y1={padding.top}
          x2={x}
          y2={padding.top + chartH}
          stroke="#d4d4d4"
          strokeWidth="1"
          strokeDasharray="4,4"
        />
      ))}

      {phaseLabels.map(({ x, label }, i) => (
        <text
          key={`label-${i}`}
          x={x}
          y={padding.top - 8}
          textAnchor="middle"
          fill="#a3a3a3"
          fontSize="10"
          fontFamily="Inter, sans-serif"
          fontWeight="500"
        >
          {label}
        </text>
      ))}

      <path d={areaD} fill="url(#areaGradient)" />
      <path d={pathD} fill="none" stroke="black" strokeWidth="2.5" strokeLinejoin="round" />
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r="4"
        fill="black"
      />
    </svg>
  );
}

export default function DashboardPage({ config }) {
  const { dashboard30Day } = config;

  const handleBookCall = () => {
    if (dashboard30Day.ctaLink && dashboard30Day.ctaLink !== '#') {
      window.open(dashboard30Day.ctaLink, '_blank');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          padding: '1.5rem 3rem',
          borderBottom: '1px solid var(--color-gray-100)',
        }}
      >
        <Logo />
      </header>

      <main
        style={{
          flex: 1,
          padding: '3rem',
          maxWidth: '900px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        <h2
          style={{
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 700,
            marginBottom: '0.5rem',
          }}
        >
          Projected 30-Day Results
        </h2>
        <p
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-gray-500)',
            marginBottom: '2rem',
          }}
        >
          Based on $150K monthly budget
        </p>

        {/* Metrics */}
        <div
          style={{
            border: '1px solid var(--color-gray-200)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            marginBottom: '2rem',
          }}
        >
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
        <div
          style={{
            border: '1px solid var(--color-gray-200)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            marginBottom: '2rem',
          }}
        >
          <h3
            style={{
              fontSize: 'var(--font-size-base)',
              fontWeight: 600,
              marginBottom: '1rem',
            }}
          >
            Cumulative Active Users (30 Days)
          </h3>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <SimpleLineChart
              data={dashboard30Day.dailyData}
              phases={dashboard30Day.chartPhases}
            />
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', paddingTop: '1rem' }}>
          <CTAButton onClick={handleBookCall}>
            {dashboard30Day.ctaText}
          </CTAButton>
        </div>
      </main>
    </div>
  );
}
