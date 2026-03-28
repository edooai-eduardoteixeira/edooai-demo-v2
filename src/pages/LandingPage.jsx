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

      {/* Hero */}
      <section className="pt-20 relative">
        <main className="max-w-[660px] w-full">
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
            {landing.subheadline.split('. ').map((sentence, i, arr) => (
              <React.Fragment key={i}>
                {i > 0 && <><br className="hidden lg:block" />{' '}</>}
                {sentence}{i < arr.length - 1 ? '.' : ''}
              </React.Fragment>
            ))}
          </p>
          <CTAButton variant="brand" onClick={onNext}>{landing.ctaText}</CTAButton>
        </main>

        {/* Variation A: centered */}
        <div className="absolute top-1/2 -translate-y-1/2 right-0 hidden lg:flex flex-col items-center gap-2">
          <span className="text-[11px] font-semibold tracking-[0.05em] text-foreground-faint uppercase">A. Centered</span>
          <HeroVisual />
        </div>
      </section>

      {/* Variation B: bottom-aligned to CTA */}
      <section className="pt-10 relative">
        <main className="max-w-[660px] w-full">
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
            {landing.subheadline.split('. ').map((sentence, i, arr) => (
              <React.Fragment key={i}>
                {i > 0 && <><br className="hidden lg:block" />{' '}</>}
                {sentence}{i < arr.length - 1 ? '.' : ''}
              </React.Fragment>
            ))}
          </p>
          <CTAButton variant="brand" onClick={onNext}>{landing.ctaText}</CTAButton>
        </main>

        <div className="absolute bottom-0 right-0 hidden lg:flex flex-col items-center gap-2">
          <span className="text-[11px] font-semibold tracking-[0.05em] text-foreground-faint uppercase">B. Bottom-aligned</span>
          <HeroVisual />
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
