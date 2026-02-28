import React from 'react';
import Logo from '../components/Logo.jsx';
import CTAButton from '../components/CTAButton.jsx';

export default function LandingPage({ config, onNext }) {
  const { landing } = config;

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

      {/* Hero — Above Fold */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '6rem 3rem',
          maxWidth: '800px',
          margin: '0 auto',
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontSize: 'var(--font-size-5xl)',
            fontWeight: 700,
            color: 'var(--color-black)',
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            marginBottom: '1.5rem',
          }}
        >
          {landing.headline}
        </h1>
        <p
          style={{
            fontSize: 'var(--font-size-xl)',
            color: 'var(--color-gray-600)',
            lineHeight: 1.6,
            marginBottom: '2.5rem',
            maxWidth: '600px',
          }}
        >
          {landing.subheadline}
        </p>
        <CTAButton onClick={onNext}>{landing.ctaText}</CTAButton>
      </main>

      {/* Below Fold — Value Props */}
      <section
        style={{
          padding: '4rem 3rem',
          borderTop: '1px solid var(--color-gray-100)',
          backgroundColor: 'var(--color-gray-50)',
        }}
      >
        <div
          style={{
            maxWidth: '800px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          {landing.valueProps.map((prop, i) => (
            <p
              key={i}
              style={{
                fontSize: 'var(--font-size-lg)',
                color: 'var(--color-gray-700)',
                fontWeight: 500,
                paddingLeft: '1.25rem',
                borderLeft: '3px solid var(--color-gray-900)',
                lineHeight: 1.5,
              }}
            >
              {prop}
            </p>
          ))}
          <p
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-gray-500)',
              marginTop: '1.5rem',
              fontWeight: 500,
            }}
          >
            {landing.credibilityLine}
          </p>
        </div>
      </section>
    </div>
  );
}
