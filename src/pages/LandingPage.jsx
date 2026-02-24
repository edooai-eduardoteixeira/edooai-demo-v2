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
          padding: '4rem 3rem',
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
            gap: '1rem',
          }}
        >
          {landing.valueProps.map((prop, i) => (
            <p
              key={i}
              style={{
                fontSize: 'var(--font-size-base)',
                color: 'var(--color-gray-600)',
                paddingLeft: '1rem',
                borderLeft: '2px solid var(--color-gray-300)',
              }}
            >
              {prop}
            </p>
          ))}
          <p
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-gray-400)',
              marginTop: '1rem',
            }}
          >
            {landing.credibilityLine}
          </p>
        </div>
      </section>
    </div>
  );
}
