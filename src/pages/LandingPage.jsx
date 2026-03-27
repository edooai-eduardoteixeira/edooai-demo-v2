import React, { useState } from 'react';
import { cn } from '../lib/utils';
import Logo from '../components/Logo.jsx';
import CTAButton from '../components/CTAButton.jsx';

export default function LandingPage({ config, onNext, onHome }) {
  const { landing } = config;
  const [iconSize, setIconSize] = useState(7);
  const [iconGap, setIconGap] = useState(1.5);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header style={{ padding: '10px 48px' }}>
        <Logo variant="full" onClick={onHome} iconSize={iconSize} iconGap={iconGap} />
      </header>

      {/* ── TEMPORARY: Icon size/gap tester ── */}
      <div style={{
        position: 'fixed', bottom: 20, right: 20, zIndex: 9999,
        background: 'white', borderRadius: 12, padding: '16px 20px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid var(--border)',
        fontSize: 12, fontFamily: 'var(--font-family)', minWidth: 200,
      }}>
        <div style={{ fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>Logo Sizing</div>
        <div style={{ marginBottom: 4, color: 'var(--text-tertiary)', fontSize: 11 }}>Icon size: {iconSize * 4}px</div>
        <input type="range" min="5" max="10" step="0.5" value={iconSize} onChange={e => setIconSize(Number(e.target.value))} style={{ width: '100%' }} />
        <div style={{ marginTop: 8, marginBottom: 4, color: 'var(--text-tertiary)', fontSize: 11 }}>Gap: {iconGap * 4}px</div>
        <input type="range" min="0.5" max="3" step="0.5" value={iconGap} onChange={e => setIconGap(Number(e.target.value))} style={{ width: '100%' }} />
      </div>

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
