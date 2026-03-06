import React, { useState, useEffect, useRef, useCallback } from 'react';
import s from '../styles/WhatUsersSee.module.css';

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
    <div className={s.notif}>
      <div className={s.notifHead}>
        <div className={s.notifIcon} style={c.bg ? { background: c.bg } : undefined}>
          {c.icon}
        </div>
        <span className={s.notifApp}>{c.app}</span>
        <span className={s.notifTime}>now</span>
      </div>
      <div className={s.notifTitle}>{title}</div>
      <div className={s.notifBody}>{body}</div>
    </div>
  );
}

/* ── WhatsApp notification (Refer section) ── */
function WANotif({ name, body }) {
  return (
    <div className={s.notif}>
      <div className={s.notifHead}>
        <div className={s.notifIcon} style={{ background: '#25D366' }}>{WA_ICON}</div>
        <span className={s.notifApp}>WhatsApp</span>
        <span className={s.notifTime}>now</span>
      </div>
      <div className={s.notifTitle}>{name}</div>
      <div className={s.notifBody}>{body}</div>
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
  const [inviteMinH, setInviteMinH] = useState(0);
  const [redeemGinaMinH, setRedeemGinaMinH] = useState(0);
  const [redeemPaulMinH, setRedeemPaulMinH] = useState(0);

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
    };
    measure();
    // Re-measure on resize
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  });

  return (
    <>
      <h3 className={s.sectionTitle}>What Users See</h3>

      <div className={s.timeline}>
        {/* ═══ INVITE ═══ */}
        <div className={s.inviteRow}>
          <div className={`${s.inviteText} ${s.timelineNode}`}>
            <div className={s.phaseName}>Invite</div>
            <div className={s.phaseDesc}>Engage your users</div>
          </div>
          <div className={s.inviteCardArea}>
            <div
              className={s.carouselWrap}
              onMouseEnter={invite.onMouseEnter}
              onMouseLeave={invite.onMouseLeave}
            >
              <div className={s.card}>
                <div
                  ref={inviteBodyRef}
                  className={`${s.cardBody} ${s.carouselBody} ${invite.fading ? s.carouselBodyFading : ''}`}
                  style={inviteMinH ? { minHeight: inviteMinH } : undefined}
                >
                  {inviteMsg && <Notif ch={inviteV.c} title={inviteMsg.t} body={inviteMsg.b} />}
                </div>
              </div>
              <div className={s.carouselNav}>
                <div className={s.carouselDots}>
                  {INVITE_VARIANTS.map((_, i) => (
                    <button
                      key={i}
                      className={`${s.carouselDot} ${i === invite.idx ? s.carouselDotActive : ''}`}
                      onClick={() => invite.jumpTo(i)}
                    />
                  ))}
                </div>
                <div className={s.carouselLabel}>{invite.label}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ REFER ═══ */}
        <div className={s.referRow}>
          <div className={`${s.referText} ${s.timelineNode}`}>
            <div className={s.phaseName}>Refer</div>
            <div className={s.phaseDesc}>Share with friends</div>
          </div>
          <div className={s.referCardArea}>
            <div className={s.referStack}>
              {/* Gina — back layer */}
              <div className={s.referCardGina}>
                <div className={s.card}>
                  <div className={s.cardBody}>
                    <WANotif
                      name="Gina Miller"
                      body="Hey Paul, check out NeoBank. I've been using and it's awesome—plus we both get free Netflix 🍿 neo.bnk/gina"
                    />
                  </div>
                </div>
              </div>
              {/* Paul — front layer, overlaps Gina */}
              <div className={s.referCardPaul}>
                <div className={s.card}>
                  <div className={s.cardBody}>
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
        <div className={s.journeyWrap}>
          <div className={s.journeyRow}>
            <div className={s.journeyStep}>
              <div className={s.journeyDot} />
              <div className={s.journeyName}>Sign Up</div>
            </div>
            <div className={s.journeyLine} />
            <div className={s.journeyStep}>
              <div className={s.journeyDot} />
              <div className={s.journeyName}>KYC</div>
            </div>
            <div className={s.journeyLine} />
            <div className={`${s.journeyStep} ${s.journeyTrigger}`}>
              <div className={s.journeyDot} />
              <div className={s.journeyName}>1st Transaction</div>
            </div>
          </div>
        </div>

        {/* ═══ REDEEM — overlapping cards ═══ */}
        <div className={s.redeemRow}>
          <div className={`${s.redeemText} ${s.timelineNode}`}>
            <div className={s.phaseName}>Redeem</div>
            <div className={s.phaseDesc}>Both sides get rewarded</div>
          </div>
          <div
            className={s.redeemCardArea}
            onMouseEnter={redeem.onMouseEnter}
            onMouseLeave={redeem.onMouseLeave}
          >
            <div className={s.redeemStack}>
              {/* Gina — back layer, has carousel */}
              <div className={`${s.redeemCardBack} ${s.carouselWrap}`}>
                <div className={s.card}>
                  <div
                    ref={redeemGinaRef}
                    className={`${s.cardBody} ${s.carouselBody} ${redeem.fading ? s.carouselBodyFading : ''}`}
                    style={redeemGinaMinH ? { minHeight: redeemGinaMinH } : undefined}
                  >
                    {redeemReferrer && (
                      <Notif ch={redeemV.c} title={redeemReferrer.t} body={redeemReferrer.b} />
                    )}
                  </div>
                </div>
              </div>
              {/* Paul — front layer */}
              <div className={s.redeemCardFront}>
                <div className={s.card}>
                  <div
                    ref={redeemPaulRef}
                    className={`${s.cardBody} ${s.carouselBody} ${redeem.fading ? s.carouselBodyFading : ''}`}
                    style={redeemPaulMinH ? { minHeight: redeemPaulMinH } : undefined}
                  >
                    {redeemReferee && (
                      <Notif ch={redeemV.c} title={redeemReferee.t} body={redeemReferee.b} />
                    )}
                  </div>
                </div>
              </div>
            </div>
            {/* Redeem nav — outside stack so mobile layout works */}
            <div className={s.carouselNav}>
              <div className={s.carouselDots}>
                {REDEEM_VARIANTS.map((_, i) => (
                  <button
                    key={i}
                    className={`${s.carouselDot} ${i === redeem.idx ? s.carouselDotActive : ''}`}
                    onClick={() => redeem.jumpTo(i)}
                  />
                ))}
              </div>
              <div className={s.carouselLabel}>{redeem.label}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
