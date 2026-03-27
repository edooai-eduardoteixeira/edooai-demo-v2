import React from 'react';
import { cn } from '../lib/utils';
import Logo from '../components/Logo.jsx';
import CTAButton from '../components/CTAButton.jsx';

export default function LandingPage({ config, onNext, onHome }) {
  const { landing } = config;

  return (
    <div className="min-h-screen flex flex-col max-w-[1100px] mx-auto w-full px-12">
      {/* Header */}
      <header className="py-2.5 mb-6">
        <Logo variant="full" onClick={onHome} />
      </header>

      {/* Hero */}
      <section className="flex-1 flex items-center">
        <main className="max-w-[800px] w-full">
          <h1
            className={cn(
              'font-display text-[56px] font-bold text-brand',
              'leading-[1.08] tracking-[-0.02em]',
              'mb-8'
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
              'leading-[1.5] mb-10'
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
          <CTAButton variant="brand" onClick={onNext}>{landing.ctaText}</CTAButton>
        </main>
      </section>

      {/* Footer */}
      <footer className="py-6">
        <p className="text-[15px] font-normal text-foreground-faint leading-[1.5]">
          {landing.missionLine}
        </p>
      </footer>
    </div>
  );
}
