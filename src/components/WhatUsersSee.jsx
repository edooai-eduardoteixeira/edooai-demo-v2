import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '../lib/utils';

/* ── Channel config ── */
const CH = {
  push: {
    icon: <span style={{ fontSize: '11px', fontWeight: 700 }}>N</span>,
    bg: '',
    app: 'NeoBank',
  },
  sms: {
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
      </svg>
    ),
    bg: '#34C759',
    app: 'Messages',
  },
  email: {
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
      </svg>
    ),
    bg: '#007AFF',
    app: 'Mail',
  },
};

const WA_ICON = (
  <svg viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

/* ── Invite notification data ── */
const ACT = {
  ask: {
    push: {
      t: 'Free Netflix for you and a friend \u{1F37F}',
      b: 'Gina, you spent $211 on streaming! \u{1F4B8} Claim one free month of Netflix for you now. Tap to share!',
    },
    sms: {
      t: 'NeoBank \u00b7 72589',
      b: 'Gina, you spent $211 on streaming! \u{1F4B8} Claim one free month of Netflix for you now. Tap to share https://nflx.it/gina \u{1F37F}',
    },
    email: {
      t: "Gina, let\u2019s get that $211 back? \u{1F37F}",
      b: "Netflix for free, Gina. One for you, one for a friend. You spent $211 on streaming \u2014 let\u2019s get that back! Share with a friend and you both win!",
    },
  },
  reminder: {
    push: {
      t: 'Still thinking about it, Gina? \u{1F37F}',
      b: 'Your free Netflix month is still here. Share your link with a friend before it expires!',
    },
    sms: {
      t: 'NeoBank \u00b7 72589',
      b: "Gina, your free Netflix month is still up for grabs! \u{1F37F} Share with a friend before it expires: neo.bnk/r/gina",
    },
    email: {
      t: 'Gina, your Netflix reward is still here \u{1F37F}',
      b: "Don\u2019t let it expire, Gina. Your free month of Netflix is still waiting \u2014 share with a friend before it\u2019s gone. One for you, one for them!",
    },
  },
};

/* ── Redeem notification data ── */
const RWD = {
  success: {
    referee: {
      push: {
        t: 'Netflix is officially unlocked! \u{1F4FA}',
        b: "Nice move. Since you\u2019ve joined NeoBank, you and Gina both get a free month of Netflix. Head to the app to claim your reward and start streaming!",
      },
      sms: {
        t: 'NeoBank \u00b7 72589',
        b: "Nice move. Since you\u2019ve joined NeoBank, you and Gina both get a free month of Netflix. Head to the app to claim your reward and start streaming!",
      },
      email: {
        t: 'Netflix is officially unlocked! \u{1F4FA}',
        b: "Nice move. Since you\u2019ve joined NeoBank, you and Gina both get a free month of Netflix. Head to the app to claim your reward and start streaming!",
      },
    },
    referrer: {
      push: {
        t: 'Your Netflix is on us! \u{1F37F}',
        b: "Huge win\u2014you and Paul both just scored a free month of Netflix. Your reward is officially unlocked and ready to use in the app. Enjoy!",
      },
      sms: {
        t: 'NeoBank \u00b7 72589',
        b: "Huge win\u2014you and Paul both just scored a free month of Netflix. Your reward is officially unlocked and ready to use in the app. Enjoy!",
      },
      email: {
        t: 'Your Netflix is on us! \u{1F37F}',
        b: "Huge win\u2014you and Paul both just scored a free month of Netflix. Your reward is officially unlocked and ready to use in the app. Enjoy!",
      },
    },
  },
  reminder: {
    referee: {
      push: {
        t: 'Your Netflix month is waiting \u{1F37F}',
        b: "Make your first transaction and unlock a free month of Netflix \u2014 for you and for Gina. Don\u2019t miss out!",
      },
      sms: {
        t: 'NeoBank \u00b7 72589',
        b: "Your free Netflix month is waiting! \u{1F37F} Make your first transaction to unlock it \u2014 Gina gets one too. Expires in 7 days.",
      },
      email: {
        t: 'A free Netflix month, one step away \u{1F37F}',
        b: "Almost there \u2014 one transaction is all it takes to unlock a free month of Netflix for you and Gina. Don\u2019t miss out, it expires in 7 days!",
      },
    },
    referrer: {
      push: {
        t: 'Almost there, Gina! \u{1F37F}',
        b: "Paul hasn\u2019t completed their first transaction yet. Once they do, you both unlock a free month of Netflix. Hang tight!",
      },
      sms: {
        t: 'NeoBank \u00b7 72589',
        b: "Almost there! Paul hasn\u2019t completed their first transaction yet. Once they do, you both unlock a free month of Netflix. Hang tight!",
      },
      email: {
        t: 'Almost there, Gina! \u{1F37F}',
        b: "Paul hasn\u2019t completed their first transaction yet. Once they do, you both unlock a free month of Netflix. We\u2019ll let you know!",
      },
    },
  },
};

/* ── Notification component ── */
function Notif({ ch, title, body }) {
  const c = CH[ch];
  return (
    <div className="rounded-lg bg-surface p-[8px_10px]">
      <div className="flex items-center gap-1.5 mb-1">
        <div
          className="w-5 h-5 rounded-sm bg-foreground flex items-center justify-center text-[11px] font-bold text-white shrink-0 [&_svg]:w-3 [&_svg]:h-3 [&_svg]:fill-white"
          style={c.bg ? { background: c.bg } : undefined}
        >
          {c.icon}
        </div>
        <span className="text-xs font-semibold text-foreground-muted">{c.app}</span>
        <span className="text-[11px] text-foreground-faint ml-auto">{c.time || 'now'}</span>
      </div>
      <div className="text-sm font-semibold mb-0.5 overflow-hidden text-ellipsis whitespace-nowrap">{title}</div>
      <div className="text-[13px] text-foreground-muted leading-[1.4] line-clamp-4">{body}</div>
    </div>
  );
}

/* ── WhatsApp notification (Refer section) ── */
function WANotif({ name, body }) {
  return (
    <div className="rounded-lg bg-surface p-[8px_10px]">
      <div className="flex items-center gap-1.5 mb-1">
        <div className="w-5 h-5 rounded-sm flex items-center justify-center text-[11px] font-bold text-white shrink-0 [&_svg]:w-3 [&_svg]:h-3 [&_svg]:fill-white" style={{ background: '#25D366' }}>{WA_ICON}</div>
        <span className="text-xs font-semibold text-foreground-muted">WhatsApp</span>
        <span className="text-[11px] text-foreground-faint ml-auto">now</span>
      </div>
      <div className="text-sm font-semibold mb-0.5 overflow-hidden text-ellipsis whitespace-nowrap">{name}</div>
      <div className="text-[13px] text-foreground-muted leading-[1.4] line-clamp-4">{body}</div>
    </div>
  );
}

/* ── Carousel variant definitions ── */
const INVITE_VARIANTS = [
  { m: 'ask', c: 'push', label: 'Ask \u00b7 Push' },
  { m: 'ask', c: 'sms', label: 'Ask \u00b7 SMS' },
  { m: 'ask', c: 'email', label: 'Ask \u00b7 Email' },
  { m: 'reminder', c: 'push', label: 'Reminder \u00b7 Push' },
  { m: 'reminder', c: 'sms', label: 'Reminder \u00b7 SMS' },
  { m: 'reminder', c: 'email', label: 'Reminder \u00b7 Email' },
];

const REDEEM_VARIANTS = [
  { m: 'success', c: 'push', label: 'Success \u00b7 Push' },
  { m: 'success', c: 'sms', label: 'Success \u00b7 SMS' },
  { m: 'success', c: 'email', label: 'Success \u00b7 Email' },
  { m: 'reminder', c: 'push', label: 'Reminder \u00b7 Push' },
  { m: 'reminder', c: 'sms', label: 'Reminder \u00b7 SMS' },
  { m: 'reminder', c: 'email', label: 'Reminder \u00b7 Email' },
];

/* ══════════════════════════════
   CAROUSEL HOOK
   Auto-rotating, dot-nav, crossfade, hover-pause
   ══════════════════════════════ */
function useCarousel(variants, interval = 3500) {
  const [idx, setIdx] = useState(0);
  const [fading, setFading] = useState(false);
  const hoveredRef = useRef(false);
  const timerRef = useRef(null);
  const pendingRef = useRef(null);

  const startTimer = useCallback(() => {
    clearInterval(timerRef.current);
    if (!hoveredRef.current) {
      timerRef.current = setInterval(() => {
        setFading(true);
        pendingRef.current = setTimeout(() => {
          setIdx((prev) => (prev + 1) % variants.length);
          setFading(false);
        }, 200);
      }, interval);
    }
  }, [variants.length, interval]);

  const jumpTo = useCallback(
    (target) => {
      if (target === idx) return;
      clearInterval(timerRef.current);
      clearTimeout(pendingRef.current);
      setFading(true);
      pendingRef.current = setTimeout(() => {
        setIdx(target);
        setFading(false);
        startTimer();
      }, 200);
    },
    [idx, startTimer]
  );

  const onMouseEnter = useCallback(() => {
    hoveredRef.current = true;
    clearInterval(timerRef.current);
  }, []);

  const onMouseLeave = useCallback(() => {
    hoveredRef.current = false;
    startTimer();
  }, [startTimer]);

  useEffect(() => {
    startTimer();
    return () => {
      clearInterval(timerRef.current);
      clearTimeout(pendingRef.current);
    };
  }, [startTimer]);

  return { idx, fading, jumpTo, onMouseEnter, onMouseLeave, label: variants[idx].label };
}

/* ══════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════ */
export default function WhatUsersSee() {
  /* ── Invite carousel ── */
  const invite = useCarousel(INVITE_VARIANTS, 3500);
  const inviteV = INVITE_VARIANTS[invite.idx];
  const inviteMsg = ACT[inviteV.m]?.[inviteV.c];

  /* ── Redeem carousel ── */
  const redeem = useCarousel(REDEEM_VARIANTS, 3500);
  const redeemV = REDEEM_VARIANTS[redeem.idx];
  const redeemReferrer = RWD[redeemV.m]?.referrer?.[redeemV.c];
  const redeemReferee = RWD[redeemV.m]?.referee?.[redeemV.c];

  /* ── Height locking via ref measurement ── */
  const inviteBodyRef = useRef(null);
  const redeemGinaRef = useRef(null);
  const redeemPaulRef = useRef(null);
  const timelineRef = useRef(null);
  const circle1Ref = useRef(null);
  const circle3Ref = useRef(null);
  const [inviteMinH, setInviteMinH] = useState(0);
  const [redeemGinaMinH, setRedeemGinaMinH] = useState(0);
  const [redeemPaulMinH, setRedeemPaulMinH] = useState(0);
  const [lineTop, setLineTop] = useState(0);
  const [lineHeight, setLineHeight] = useState(0);

  useEffect(() => {
    // Measure after first render
    const measure = () => {
      if (inviteBodyRef.current) {
        const h = inviteBodyRef.current.scrollHeight;
        setInviteMinH((prev) => Math.max(prev, h));
      }
      if (redeemGinaRef.current) {
        const h = redeemGinaRef.current.scrollHeight;
        setRedeemGinaMinH((prev) => Math.max(prev, h));
      }
      if (redeemPaulRef.current) {
        const h = redeemPaulRef.current.scrollHeight;
        setRedeemPaulMinH((prev) => Math.max(prev, h));
      }
      if (timelineRef.current && circle1Ref.current && circle3Ref.current) {
        const container = timelineRef.current.getBoundingClientRect();
        const r1 = circle1Ref.current.getBoundingClientRect();
        const r3 = circle3Ref.current.getBoundingClientRect();
        const c1Center = r1.top - container.top + r1.height / 2;
        const c3Center = r3.top - container.top + r3.height / 2;
        setLineTop(c1Center);
        setLineHeight(c3Center - c1Center);
      }
    };
    measure();
    // Re-measure on resize
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  });

  return (
    <>
      <h3 className="text-[32px] font-semibold tracking-[-0.02em] text-foreground-muted mb-10 max-[860px]:text-[22px] max-[860px]:mb-8">
        What Users See
      </h3>

      <div ref={timelineRef} className="relative">
        {/* Timeline vertical line — connects circle 1 center to circle 3 center */}
        {lineHeight > 0 && (
          <div className="absolute left-[13px] w-0.5 bg-border z-[1] max-[860px]:hidden" style={{ top: lineTop, height: lineHeight }} />
        )}

        {/* ═══ INVITE ═══ */}
        <div className="flex items-start gap-12 mb-10 max-[860px]:flex-col max-[860px]:gap-5">
          <div className="flex-[0_0_240px] pt-5 relative pl-12 max-[860px]:pl-0 max-[860px]:flex-none">
            {/* Timeline numbered circle */}
            <div ref={circle1Ref} className="absolute left-0 top-5 w-7 h-7 rounded-full bg-foreground-faint text-white flex items-center justify-center text-[13px] font-semibold z-[2] max-[860px]:hidden">1</div>
            <div className="text-[28px] font-bold tracking-[-0.03em] leading-[1.1] text-foreground max-[860px]:text-2xl">Invite</div>
          </div>
          <div className="flex-1 flex flex-col items-start">
            <div
              className="max-w-[400px]"
              onMouseEnter={invite.onMouseEnter}
              onMouseLeave={invite.onMouseLeave}
            >
              <div className="rounded-lg border-none bg-surface overflow-hidden transition-[box-shadow,transform] duration-200 ease-in-out hover:shadow-md hover:-translate-y-px" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 0 1px rgba(0,0,0,0.06)' }}>
                <div
                  ref={inviteBodyRef}
                  className="p-2.5"
                  style={{
                    transition: 'opacity 200ms ease',
                    opacity: invite.fading ? 0 : 1,
                    ...(inviteMinH ? { minHeight: inviteMinH } : {}),
                  }}
                >
                  {inviteMsg && <Notif ch={inviteV.c} title={inviteMsg.t} body={inviteMsg.b} />}
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2.5 px-1">
                <div className="flex gap-1.5">
                  {INVITE_VARIANTS.map((_, i) => (
                    <button
                      key={i}
                      className={cn(
                        'w-1.5 h-1.5 rounded-full bg-border border-none p-0 cursor-pointer transition-[background,transform] duration-200',
                        'hover:bg-foreground-faint',
                        i === invite.idx && 'bg-foreground-muted scale-[1.3]'
                      )}
                      onClick={() => invite.jumpTo(i)}
                    />
                  ))}
                </div>
                <div className="text-xs font-medium text-foreground-faint transition-opacity duration-200 min-w-[100px]">{invite.label}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ REFER ═══ */}
        <div className="flex items-start gap-12 mb-10 max-[860px]:flex-col max-[860px]:gap-5">
          <div className="flex-[0_0_240px] pt-5 relative pl-12 max-[860px]:pl-0 max-[860px]:flex-none">
            {/* Timeline numbered circle */}
            <div className="absolute left-0 top-5 w-7 h-7 rounded-full bg-foreground-faint text-white flex items-center justify-center text-[13px] font-semibold z-[2] max-[860px]:hidden">2</div>
            <div className="text-[28px] font-bold tracking-[-0.03em] leading-[1.1] text-foreground max-[860px]:text-2xl">Refer</div>
          </div>
          <div className="flex-1 relative min-h-[220px] max-[860px]:justify-start">
            <div className="relative max-w-[700px]">
              {/* Gina — back layer */}
              <div className="relative z-[1] w-[380px] max-w-[380px]">
                <div className="rounded-lg border-none bg-surface overflow-hidden transition-[box-shadow,transform] duration-200 ease-in-out hover:shadow-md hover:-translate-y-px" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 0 1px rgba(0,0,0,0.06)' }}>
                  <div className="p-2.5">
                    <WANotif
                      name="Gina Miller"
                      body="Hey Paul, check out NeoBank. I've been using and it's awesome—plus we both get free Netflix 🍿 neo.bnk/gina"
                    />
                  </div>
                </div>
              </div>
              {/* Paul — front layer, overlaps Gina */}
              <div className="absolute top-[78%] left-[285px] z-[2] w-[380px] max-w-[380px] max-[860px]:relative max-[860px]:top-0 max-[860px]:left-0 max-[860px]:mt-4">
                <div className="rounded-lg border-none bg-surface overflow-hidden transition-[box-shadow,transform] duration-200 ease-in-out hover:shadow-md hover:-translate-y-px" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 0 1px rgba(0,0,0,0.06)' }}>
                  <div className="p-2.5">
                    <WANotif
                      name="Paul Davis"
                      body="Love this! Thanks for keeping me in mind, Gina 🍿"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ REFEREE JOURNEY — horizontal pill stepper ═══ */}
        <div className="relative mb-10">
          <div className="inline-flex items-center gap-0 ml-12 py-1.5 px-3.5 bg-surface rounded-[20px] relative z-[2] max-[860px]:ml-0 max-[860px]:flex-wrap max-[860px]:gap-1.5">
            <div className="flex items-center gap-[5px]">
              <div className="w-[5px] h-[5px] rounded-full bg-border shrink-0" />
              <div className="text-xs font-medium text-foreground-faint whitespace-nowrap">Sign Up</div>
            </div>
            <div className="w-5 h-px bg-border shrink-0 mx-1.5" />
            <div className="flex items-center gap-[5px]">
              <div className="w-[5px] h-[5px] rounded-full bg-border shrink-0" />
              <div className="text-xs font-medium text-foreground-faint whitespace-nowrap">KYC</div>
            </div>
            <div className="w-5 h-px bg-border shrink-0 mx-1.5" />
            <div className="flex items-center gap-[5px]">
              <div className="w-[5px] h-[5px] rounded-full bg-brand shrink-0 shadow-[0_0_0_2px_rgba(107,29,42,0.15)]" />
              <div className="text-xs font-semibold text-brand whitespace-nowrap">1st Transaction</div>
            </div>
          </div>
        </div>

        {/* ═══ REDEEM — overlapping cards ═══ */}
        <div className="flex items-start gap-12 max-[860px]:flex-col max-[860px]:gap-5">
          <div className="flex-[0_0_240px] pt-5 relative pl-12 max-[860px]:pl-0 max-[860px]:flex-none">
            {/* Timeline numbered circle */}
            <div ref={circle3Ref} className="absolute left-0 top-5 w-7 h-7 rounded-full bg-foreground-faint text-white flex items-center justify-center text-[13px] font-semibold z-[2] max-[860px]:hidden">3</div>
            <div className="text-[28px] font-bold tracking-[-0.03em] leading-[1.1] text-foreground max-[860px]:text-2xl">Redeem</div>
          </div>
          <div
            className="flex-1 relative min-h-[280px]"
            onMouseEnter={redeem.onMouseEnter}
            onMouseLeave={redeem.onMouseLeave}
          >
            <div className="relative max-w-[700px]">
              {/* Gina — back layer, has carousel */}
              <div className="relative z-[1] w-[380px] max-w-[380px]">
                <div className="rounded-lg border-none bg-surface overflow-hidden transition-[box-shadow,transform] duration-200 ease-in-out hover:shadow-md hover:-translate-y-px" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 0 1px rgba(0,0,0,0.06)' }}>
                  <div
                    ref={redeemGinaRef}
                    className="p-2.5"
                    style={{
                      transition: 'opacity 200ms ease',
                      opacity: redeem.fading ? 0 : 1,
                      ...(redeemGinaMinH ? { minHeight: redeemGinaMinH } : {}),
                    }}
                  >
                    {redeemReferrer && (
                      <Notif ch={redeemV.c} title={redeemReferrer.t} body={redeemReferrer.b} />
                    )}
                  </div>
                </div>
              </div>
              {/* Paul — front layer */}
              <div className="absolute top-[78%] left-[285px] z-[2] w-[380px] max-w-[380px] max-[860px]:relative max-[860px]:top-0 max-[860px]:left-0 max-[860px]:mt-4">
                <div className="rounded-lg border-none bg-surface overflow-hidden transition-[box-shadow,transform] duration-200 ease-in-out hover:shadow-md hover:-translate-y-px" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 0 1px rgba(0,0,0,0.06)' }}>
                  <div
                    ref={redeemPaulRef}
                    className="p-2.5"
                    style={{
                      transition: 'opacity 200ms ease',
                      opacity: redeem.fading ? 0 : 1,
                      ...(redeemPaulMinH ? { minHeight: redeemPaulMinH } : {}),
                    }}
                  >
                    {redeemReferee && (
                      <Notif ch={redeemV.c} title={redeemReferee.t} body={redeemReferee.b} />
                    )}
                  </div>
                </div>
              </div>
            </div>
            {/* Redeem nav — outside stack so mobile layout works */}
            <div className="flex items-center gap-3 mt-2.5 px-1">
              <div className="flex gap-1.5">
                {REDEEM_VARIANTS.map((_, i) => (
                  <button
                    key={i}
                    className={cn(
                      'w-1.5 h-1.5 rounded-full bg-border border-none p-0 cursor-pointer transition-[background,transform] duration-200',
                      'hover:bg-foreground-faint',
                      i === redeem.idx && 'bg-foreground-muted scale-[1.3]'
                    )}
                    onClick={() => redeem.jumpTo(i)}
                  />
                ))}
              </div>
              <div className="text-xs font-medium text-foreground-faint transition-opacity duration-200 min-w-[100px]">{redeem.label}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
