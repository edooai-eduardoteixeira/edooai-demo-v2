import React from 'react';
import { cn } from '../lib/utils';
import Logo from '../components/Logo.jsx';
import CTAButton from '../components/CTAButton.jsx';
import HeroVisual from '../components/HeroVisual.jsx';

export default function LandingPage({ config, onNext, onConnect, onHome }) {
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
          <div className="mt-6">
            <button
              onClick={onConnect}
              className="inline-flex items-center gap-2 p-0 rounded-sm text-[15px] font-medium text-foreground-muted cursor-pointer transition-colors duration-150 ease-out hover:text-foreground focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
            >
              {landing.connectCtaText}
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </main>

        <HeroVisual className="absolute bottom-0 right-0 hidden lg:block" />
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
