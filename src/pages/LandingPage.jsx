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
          padding: '20px 48px',
          borderBottom: '1px solid var(--color-gray-100)',
        }}
      >
        <Logo />
      </header>

      {/* Hero */}
      <section
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 48px',
        }}
      >
        <main
          style={{
            textAlign: 'center',
            maxWidth: '900px',
            width: '100%',
          }}
        >
          <h1
            style={{
              fontSize: '48px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.08,
              letterSpacing: '-0.03em',
              maxWidth: '792px',
              margin: '0 auto 48px',
            }}
          >
            {landing.headline.split('customers ').length > 1 ? (
              <>
                {landing.headline.split('customers ')[0]}customers
                <br className="br-desktop" />{' '}
                {landing.headline.split('customers ')[1]}
              </>
            ) : (
              landing.headline
            )}
          </h1>
          <p
            style={{
              fontSize: '22px',
              fontWeight: 500,
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              marginBottom: '56px',
            }}
          >
            {landing.subheadline}
          </p>
          <CTAButton onClick={onNext}>{landing.ctaText}</CTAButton>
        </main>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: '24px 48px',
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
