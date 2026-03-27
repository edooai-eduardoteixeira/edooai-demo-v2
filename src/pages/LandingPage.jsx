import React, { useState } from 'react';
import { cn } from '../lib/utils';
import Logo from '../components/Logo.jsx';
import CTAButton from '../components/CTAButton.jsx';

export default function LandingPage({ config, onNext }) {
  const { landing } = config;
  const [logoFont, setLogoFont] = useState('inter');
  const [logoWordmark, setLogoWordmark] = useState('Vincor AI');

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header style={{ padding: '10px 48px' }}>
        <Logo
          variant="full"
          wordmark={logoWordmark}
          fontFamily={logoFont === 'playfair' ? "'Playfair Display', serif" : undefined}
          className={logoFont === 'playfair' ? 'text-xl' : undefined}
        />
      </header>

      {/* ── TEMPORARY: Logo font/name tester ── */}
      {(() => {
        const FONTS = [
          { id: 'inter', label: 'Inter (current)' },
          { id: 'playfair', label: 'Playfair Display (Didot-like)' },
        ];
        const NAMES = [
          { id: 'Vincor AI', label: 'Vincor AI' },
          { id: 'Vincor', label: 'Vincor' },
        ];
        return (
          <div style={{
            position: 'fixed', bottom: 20, right: 20, zIndex: 9999,
            background: 'white', borderRadius: 12, padding: '16px 20px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid var(--border)',
            fontSize: 12, fontFamily: 'var(--font-family)',
          }}>
            <div style={{ fontWeight: 700, marginBottom: 10, color: 'var(--text-primary)' }}>Logo Test</div>
            <div style={{ marginBottom: 8, color: 'var(--text-tertiary)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Font</div>
            {FONTS.map(f => (
              <label key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', cursor: 'pointer' }}>
                <input type="radio" name="logoFont" defaultChecked={f.id === 'inter'} onChange={() => setLogoFont(f.id)} />
                <span style={{ color: 'var(--text-secondary)' }}>{f.label}</span>
              </label>
            ))}
            <div style={{ marginTop: 10, marginBottom: 8, color: 'var(--text-tertiary)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Name</div>
            {NAMES.map(n => (
              <label key={n.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', cursor: 'pointer' }}>
                <input type="radio" name="logoName" defaultChecked={n.id === 'Vincor AI'} onChange={() => setLogoWordmark(n.id)} />
                <span style={{ color: 'var(--text-secondary)' }}>{n.label}</span>
              </label>
            ))}
          </div>
        );
      })()}

      {/* Hero */}
      <section className="flex-1 flex items-center justify-center px-[48px]">
        <main className="text-center max-w-[960px] w-full">
          <h1
            className={cn(
              'text-[48px] font-bold text-foreground',
              'leading-[1.08] tracking-[-0.03em]',
              'max-w-[792px] mx-auto mb-[48px]'
            )}
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
            className={cn(
              'text-[22px] font-medium text-foreground-muted',
              'leading-[1.5] mb-[56px]'
            )}
          >
            {landing.subheadline.split('. ').length > 1 ? (
              <>
                {landing.subheadline.split('. ')[0]}.
                <br className="br-desktop-wide" />{' '}
                {landing.subheadline.split('. ').slice(1).join('. ')}
              </>
            ) : (
              landing.subheadline
            )}
          </p>
          <CTAButton onClick={onNext}>{landing.ctaText}</CTAButton>
        </main>
      </section>

      {/* Footer */}
      <footer className="py-[24px] px-[48px] text-center">
        <p className="text-[15px] font-normal text-foreground-faint leading-[1.5]">
          {landing.missionLine}
        </p>
      </footer>
    </div>
  );
}
