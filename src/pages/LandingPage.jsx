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

      {/* Hero text */}
      <section className="pt-20">
        <main className="max-w-[560px] w-full">
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
              'text-[22px] font-medium text-foreground-muted',
              'leading-[1.5] mb-10'
            )}
          >
            {landing.subheadline}
          </p>
          <CTAButton variant="brand" onClick={onNext}>{landing.ctaText}</CTAButton>
        </main>
      </section>

      {/* Hierarchy comparison — 3 variants side by side */}
      <section className="pt-12 hidden lg:flex gap-6 justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="text-[11px] font-semibold tracking-[0.05em] text-foreground-faint uppercase">1. Data &gt; Labels</span>
          <HeroVisual variant="data-above" />
        </div>
        <div className="flex flex-col items-center gap-3">
          <span className="text-[11px] font-semibold tracking-[0.05em] text-foreground-faint uppercase">2. Labels &gt; Data</span>
          <HeroVisual variant="label-above" />
        </div>
        <div className="flex flex-col items-center gap-3">
          <span className="text-[11px] font-semibold tracking-[0.05em] text-foreground-faint uppercase">3. Data = Labels</span>
          <HeroVisual variant="equal" />
        </div>
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
