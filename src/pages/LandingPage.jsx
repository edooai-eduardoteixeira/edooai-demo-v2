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
          padding: '24px 48px',
          borderBottom: '1px solid var(--color-gray-100)',
        }}
      >
        <Logo />
      </header>

      {/* Hero */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '58px 48px 80px',
          maxWidth: '792px',
          margin: '0 auto',
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontSize: '48px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: 1.08,
            letterSpacing: '-0.03em',
            marginBottom: '40px',
          }}
        >
          {landing.headline}
        </h1>
        <p
          style={{
            fontSize: '22px',
            fontWeight: 400,
            color: 'var(--text-secondary)',
            lineHeight: 1.45,
            marginBottom: '48px',
            maxWidth: '600px',
          }}
        >
          {landing.subheadline}
        </p>
        <CTAButton onClick={onNext}>{landing.ctaText}</CTAButton>
      </main>

      {/* Footer */}
      <footer
        style={{
          padding: '32px 48px',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontSize: '15px',
            fontWeight: 400,
            color: 'var(--text-tertiary)',
            lineHeight: 1.5,
          }}
        >
          {landing.missionLine}
        </p>
      </footer>
    </div>
  );
}
