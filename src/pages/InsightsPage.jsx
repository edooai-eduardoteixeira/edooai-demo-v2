import React, { useEffect, useState } from 'react';
import Logo from '../components/Logo.jsx';
import CTAButton from '../components/CTAButton.jsx';
import AnimatedNumber from '../components/AnimatedNumber.jsx';
import LoadingReveal from '../components/LoadingReveal.jsx';

/*
 * InsightsPage — sits between /connect and /strategy. Shows the campaign
 * portfolio the agent composes from skills + connected data.
 *
 * Skills are the invisible knowledge layer (config-driven). Cards are
 * CAMPAIGN PROPOSALS — concrete plays the agent would run for THIS customer.
 * One customer is in one campaign at a time (audiences are mutually exclusive).
 *
 * Order of operations on mount:
 *   1. <LoadingReveal> animates 4 reasoning lines (~7.4s total)
 *   2. onReveal fires → cards mount with audienceSize=0
 *   3. onDone fires → audienceSize swaps to real value, AnimatedNumber counts up
 *   4. supporting line + CTA visible
 */
export default function InsightsPage({ config, onNext, onHome }) {
  const insights = config?.insights;

  // Defensive: if config is malformed, render nothing meaningful and bail.
  if (!insights) {
    if (typeof console !== 'undefined') {
      // eslint-disable-next-line no-console
      console.warn('InsightsPage: config.insights missing');
    }
    return (
      <div className="min-h-screen flex flex-col max-w-[1100px] mx-auto w-full px-12">
        <header className="py-2.5 mb-6">
          <Logo variant="mark" onClick={onHome} />
        </header>
      </div>
    );
  }

  const { pageTitle, dataCaption, companyContext, reasoningSteps, campaigns, supportingLine, cta } = insights;

  const [reveal, setReveal] = useState(false); // cards start mounting
  const [countUp, setCountUp] = useState(false); // numbers swap from 0 to real

  // Filter out empty campaigns defensively.
  const visibleCampaigns = (campaigns || []).filter((c) => c && c.audienceSize > 0);

  return (
    <div className="min-h-screen flex flex-col max-w-[1100px] mx-auto w-full px-12">
      <header className="py-2.5 mb-6">
        <Logo variant="mark" onClick={onHome} />
      </header>

      <main className="flex-1 animate-page-enter">
        {/* H1 + page-level data caption */}
        <h1 className="text-[28px] font-semibold tracking-tight text-foreground-muted mb-2">
          {pageTitle}
        </h1>
        {dataCaption && (
          <p className="text-[13px] text-foreground-faint mb-6">
            {dataCaption}
          </p>
        )}

        {/* Composition theater */}
        {reasoningSteps && reasoningSteps.length > 0 && (
          <div className="mb-8">
            <LoadingReveal
              steps={reasoningSteps}
              onReveal={() => setReveal(true)}
              onDone={() => setCountUp(true)}
            />
          </div>
        )}

        {/* Existing-program strip — reveals AFTER the loading sequence so it
            feels ingested by the agent, not pre-filled. Computed-context recipe. */}
        {reveal && companyContext && (
          <div className="bg-accent-subtle rounded-lg py-3 px-4 mb-8 text-[13px] text-foreground-muted leading-[1.6] animate-page-enter">
            <span className="text-[11px] font-semibold tracking-[0.05em] text-foreground-faint uppercase">
              {companyContext.label}
            </span>
            {companyContext.items && companyContext.items.length > 0 && (
              <span className="ml-3">
                {companyContext.items.join(', ')}
              </span>
            )}
          </div>
        )}

        {/* Campaign cards — fade in once LoadingReveal starts collapsing */}
        {reveal && visibleCampaigns.length > 0 && (
          <div
            className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8 animate-page-enter"
          >
            {visibleCampaigns.map((c) => (
              <CampaignCard key={c.id} campaign={c} countUp={countUp} />
            ))}
          </div>
        )}

        {/* Supporting line + CTA — centered to match /strategy */}
        {reveal && (
          <div className="animate-page-enter text-center mb-12">
            {supportingLine && (
              <p className="text-[13px] text-foreground-faint leading-[1.5] mb-4 max-w-[640px] mx-auto">
                {supportingLine}
              </p>
            )}
            {cta && (
              <CTAButton variant="brand" onClick={onNext}>
                {cta.text}
                <span aria-hidden className="ml-1">→</span>
              </CTAButton>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

/* ─── Campaign card ─── */
function CampaignCard({ campaign, countUp }) {
  const { name, audienceSize, segmentLabel, invite, reward } = campaign;

  // Start at 0; flip to real value when countUp goes true → AnimatedNumber animates.
  const [animatedValue, setAnimatedValue] = useState(0);
  useEffect(() => {
    if (countUp) setAnimatedValue(audienceSize);
  }, [countUp, audienceSize]);

  return (
    <article className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden p-6 flex flex-col gap-5">
      {/* Title — one-word goal */}
      <h3 className="text-[17px] font-semibold text-foreground tracking-[-0.01em] leading-tight">
        {name}
      </h3>

      {/* Invite */}
      {invite && (
        <CardRow label="Invite">
          <div className="text-[13px] text-foreground-muted leading-[1.5]">
            {invite}
          </div>
        </CardRow>
      )}

      {/* Audience — hero proof */}
      <CardRow label="Audience">
        <div
          className="text-[32px] font-bold text-foreground leading-none tabular-nums"
          aria-label={`${audienceSize.toLocaleString('en-US')} ${segmentLabel || 'customers'}`}
        >
          ~<AnimatedNumber value={animatedValue} />
        </div>
        {segmentLabel && (
          <div className="text-[12px] text-foreground-faint mt-1">
            {segmentLabel}
          </div>
        )}
      </CardRow>

      {/* Reward */}
      {reward && (
        <CardRow label="Reward">
          <div className="text-[13px] text-foreground-muted leading-[1.5]">
            {reward}
          </div>
        </CardRow>
      )}
    </article>
  );
}

/* Uppercase-label recipe (DESIGN.md) wrapping a value. */
function CardRow({ label, children }) {
  return (
    <div>
      <div className="text-[11px] font-semibold tracking-[0.05em] text-foreground-faint uppercase mb-1">
        {label}
      </div>
      {children}
    </div>
  );
}
