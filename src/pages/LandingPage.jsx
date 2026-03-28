import React from 'react';
import { cn } from '../lib/utils';
import Logo from '../components/Logo.jsx';
import CTAButton from '../components/CTAButton.jsx';
import HeroVisual from '../components/HeroVisual.jsx';

export default function LandingPage({ config, onNext, onHome }) {
  const { landing } = config;

  return (
    <div className="min-h-screen flex flex-col max-w-[1100px] mx-auto w-full px-12">
      {/* Header */}
      <header className="py-2.5 mb-6">
        <Logo variant="full" onClick={onHome} />
      </header>

      {/* Hero — text left, visual right */}
      <section className="pt-20 flex items-start gap-16">
        <main className="max-w-[800px] w-full">
          <h1
            className={cn(
              'font-display text-[56px] font-bold text-brand',
              'leading-[1.08] tracking-[-0.02em]',
              'mb-8'
            )}
          >
            {landing.headline}
          </h1>
          <p
            className={cn(
              'text-[22px] font-medium text-foreground',
              'leading-[1.5] mb-10'
            )}
          >
            {landing.subheadline}
          </p>
          <CTAButton variant="brand" onClick={onNext}>{landing.ctaText}</CTAButton>
        </main>

        <HeroVisual className="shrink-0 hidden lg:flex" />
      </section>

      <div className="flex-1" />

      {/* Footer */}
      <footer className="py-6">
        <p className="text-[15px] font-normal text-foreground-faint leading-[1.5]">
          {landing.missionLine}
        </p>
      </footer>
    </div>
  );
}
