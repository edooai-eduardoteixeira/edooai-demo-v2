import React, { useEffect, useState, useRef, useCallback } from 'react';
import Logo from '../components/Logo.jsx';
import CTAButton from '../components/CTAButton.jsx';
import AnimatedNumber from '../components/AnimatedNumber.jsx';
import Tooltip from '../components/Tooltip.jsx';
import { useProjections } from '../hooks/useProjections.js';
import tl from '../styles/StrategyTimeline.module.css';

/* ───────── KPI Card ───────── */
function KPICard({ label, children }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: '120px',
        padding: '1rem',
        backgroundColor: 'var(--accent-subtle)',
        borderRadius: 'var(--radius-lg)',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: 'var(--font-size-xs)',
          fontWeight: 500,
          color: 'var(--text-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '0.375rem',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 'var(--font-size-xl)',
          fontWeight: 700,
          color: 'var(--text-primary)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ───────── Operations Cycle Step ───────── */
function CycleStep({ step, index, total }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        padding: '0.75rem 0',
        borderBottom: index < total - 1 ? '1px solid var(--border-light)' : 'none',
      }}
    >
      <span
        style={{
          fontSize: 'var(--font-size-sm)',
          fontWeight: 700,
          color: 'var(--text-primary)',
          minWidth: '70px',
          flexShrink: 0,
        }}
      >
        {step.name}
      </span>
      <span
        style={{
          fontSize: 'var(--font-size-sm)',
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
        }}
      >
        {step.description}
      </span>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════
   Main Page Component
   ═════════════════════════════════════════════════════════ */
export default function StrategyBuilderPage({ config, onNext }) {
  const {
    strategy,
    budgetSlider,
    recommendedBudget,
    budgetAnnotation,
    projections: projData,
    operationsCycle,
    riskManagement,
    approvalScope,
  } = config;

  /* ── Budget + projections ── */
  const [budget, setBudget] = useState(budgetSlider.default);
  const proj = useProjections(projData, budget);

  /* ── Progressive reveal ── */
  const [showResult, setShowResult] = useState(false);
  const [showJourney, setShowJourney] = useState(false);
  const [showExecution, setShowExecution] = useState(false);
  const [showRisk, setShowRisk] = useState(false);
  const [showCTA, setShowCTA] = useState(false);

  /* ── Timeline dropdown state ── */
  const [s1Combo, setS1Combo] = useState({ msg: 'ask', ch: 'push' });
  const [s3Combo, setS3Combo] = useState({ msg: 'success', ch: 'push' });
  const [openDD, setOpenDD] = useState(null);
  const timelineRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (timelineRef.current && !e.target.closest(`.${tl.dropdownWrap}`)) {
        setOpenDD(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const selectCombo = (step, msg, ch) => {
    if (step === 's1') setS1Combo({ msg, ch });
    else setS3Combo({ msg, ch });
    setOpenDD(null);
  };

  const comboLabel = (msg, ch) =>
    msg.charAt(0).toUpperCase() + msg.slice(1) + ' \u00b7 ' + ch.charAt(0).toUpperCase() + ch.slice(1).toLowerCase();

  const [lines, setLines] = useState([]);
  const [currentText, setCurrentText] = useState('');

  const cancelRef = useRef(false);
  const hasStartedRef = useRef(false);

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const streamText = useCallback(async (text, duration) => {
    const charDelay = duration / text.length;
    let built = '';
    for (let i = 0; i < text.length; i++) {
      if (cancelRef.current) return;
      built += text[i];
      setCurrentText(built);
      await new Promise((r) => setTimeout(r, charDelay));
    }
    setLines((prev) => [...prev, text]);
    setCurrentText('');
  }, []);

  const runReveal = useCallback(async () => {
    await streamText('Analyzing your data to propose Referral Strategy and Execution Plan...', 1600);
    await sleep(400);
    if (cancelRef.current) return;

    setShowResult(true);
    await sleep(500);
    if (cancelRef.current) return;

    setShowJourney(true);
    await sleep(400);
    if (cancelRef.current) return;

    setShowExecution(true);
    await sleep(400);
    if (cancelRef.current) return;

    setShowRisk(true);
    await sleep(300);
    if (cancelRef.current) return;

    setShowCTA(true);
  }, [streamText]);

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    cancelRef.current = false;
    runReveal();
    return () => {
      cancelRef.current = true;
    };
  }, []);

  const formatCurrency = (val) => '$' + val.toLocaleString('en-US');

  /* ═══════ RENDER ═══════ */
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header
        style={{
          padding: '1.5rem 3rem',
          borderBottom: '1px solid var(--border-light)',
        }}
      >
        <Logo />
      </header>

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          padding: '2rem 3rem 6rem',
          maxWidth: '1100px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        {/* ── Streaming text ── */}
        <div style={{ minHeight: '50px', marginBottom: '1.5rem' }}>
          {lines.map((line, i) => (
            <p
              key={i}
              style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                margin: 0,
                marginBottom: '4px',
              }}
            >
              {line}
            </p>
          ))}
          {currentText && (
            <p
              style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              {currentText}
              <span
                style={{
                  display: 'inline-block',
                  width: '2px',
                  height: '1em',
                  backgroundColor: 'var(--text-secondary)',
                  marginLeft: '2px',
                  animation: 'blink 1s step-end infinite',
                  verticalAlign: 'text-bottom',
                }}
              />
            </p>
          )}
        </div>

        {/* ════════════════════════════════════════════
            SECTION 1 — Result + Budget (one unit)
            ════════════════════════════════════════════ */}
        {showResult && (
          <section
            style={{
              marginBottom: '3rem',
              animation: 'fadeIn 0.4s ease forwards',
            }}
          >
            {/* Primary result */}
            <div
              style={{
                textAlign: 'center',
                padding: '2rem 0 1.5rem',
              }}
            >
              <div
                style={{
                  fontSize: '3.5rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  lineHeight: 1,
                  marginBottom: '0.5rem',
                }}
              >
                <AnimatedNumber value={proj.activeUsers} duration={300} />
              </div>
              <div
                style={{
                  fontSize: 'var(--font-size-lg)',
                  color: 'var(--text-secondary)',
                  fontWeight: 500,
                }}
              >
                projected new active users in 30 days
              </div>
            </div>

            {/* KPI row */}
            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                marginBottom: '2rem',
              }}
            >
              <KPICard label="CAC">
                <AnimatedNumber value={proj.cac} prefix="$" duration={300} />
              </KPICard>
              <KPICard label="ROI">
                <span>{typeof proj.roi === 'number' ? proj.roi.toFixed(1) : proj.roi}x</span>
              </KPICard>
              <KPICard label="Conv Rate">
                <span>{typeof proj.convRate === 'number' ? proj.convRate.toFixed(1) : proj.convRate}%</span>
              </KPICard>
              <KPICard label="Fraud Saved">
                <AnimatedNumber value={proj.fraudSaved} prefix="$" duration={300} />
              </KPICard>
            </div>

            {/* Budget slider */}
            <div
              style={{
                padding: '1.5rem',
                backgroundColor: 'var(--accent-subtle)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem',
                }}
              >
                <h3
                  style={{
                    fontSize: 'var(--font-size-base)',
                    fontWeight: 700,
                    margin: 0,
                  }}
                >
                  Monthly Budget
                </h3>
                <span
                  style={{
                    fontSize: 'var(--font-size-2xl)',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                  }}
                >
                  <AnimatedNumber value={budget} prefix="$" duration={200} />
                </span>
              </div>
              <p
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--text-tertiary)',
                  margin: 0,
                  marginBottom: '1rem',
                }}
              >
                {recommendedBudget.rationale}
              </p>
              <div style={{ marginBottom: '0.75rem' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.5rem',
                  }}
                >
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
                    {formatCurrency(budgetSlider.min)}
                  </span>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
                    {formatCurrency(budgetSlider.max)}
                  </span>
                </div>
                <input
                  type="range"
                  min={budgetSlider.min}
                  max={budgetSlider.max}
                  step={budgetSlider.step}
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  style={{
                    width: '100%',
                    height: '8px',
                    appearance: 'none',
                    background: `linear-gradient(to right, var(--accent) ${((budget - budgetSlider.min) / (budgetSlider.max - budgetSlider.min)) * 100}%, var(--border) ${((budget - budgetSlider.min) / (budgetSlider.max - budgetSlider.min)) * 100}%)`,
                    borderRadius: '4px',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                />
              </div>
              <p
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--text-tertiary)',
                  margin: 0,
                  fontStyle: 'italic',
                }}
              >
                {budgetAnnotation}
              </p>
            </div>
          </section>
        )}

        {/* ════════════════════════════════════════════
            SECTION 2 — User Journey and Referral Execution
            ════════════════════════════════════════════ */}
        {showJourney && (
          <section
            ref={timelineRef}
            style={{
              marginBottom: '3rem',
              animation: 'fadeIn 0.4s ease forwards',
            }}
          >
            <h3 className={tl.sectionTitle}>User Journey and Referral Execution</h3>

            <div className={tl.timeline}>

              {/* ═══ STEP 1: Invite ═══ */}
              <div className={tl.tlStep}>
                <div className={tl.tlHeaderRow}>
                  <div className={tl.tlNumber}>1</div>
                  <span className={tl.tlLabel}>Invite</span>
                </div>
                <div className={tl.card}>
                  {/* Fields */}
                  <div className={tl.fieldsGrid}>
                    <div className={tl.fieldLabel}>Activated by</div>
                    <span className={tl.fieldVal}>All Transactions, Timing Insights</span>
                    <div className={tl.fieldLabel}>Redemption upon</div>
                    <span className={tl.fieldVal}>1st Transaction</span>
                    <div className={tl.fieldLabel}>Redemption journey</div>
                    <span className={tl.fieldVal}>Sign Up, KYC</span>
                    <div className={tl.fieldLabel}>Reward</div>
                    <span className={tl.fieldVal}>$0, $20, $50, $75</span>
                    <div className={tl.fieldLabel}>Paid as</div>
                    <span className={tl.fieldVal}>Organic, Gift Card, Coupon, Account Credit, Cashback</span>
                    <div className={tl.fieldLabel}>Tracked via</div>
                    <span className={tl.fieldVal}>Referral Link</span>
                  </div>

                  {/* Message selector + phone mockups */}
                  <div className={tl.messageBlock} style={{ position: 'relative' }}>
                    <div className={`${tl.msgHeader} ${tl.msgHeaderFloating}`}>
                      <div className={tl.dropdownWrap}>
                        <button className={tl.dropdownTrigger} onClick={() => setOpenDD(openDD === 's1' ? null : 's1')}>
                          <span>{comboLabel(s1Combo.msg, s1Combo.ch)}</span>
                          <svg className={`${tl.chevron} ${openDD === 's1' ? tl.chevronOpen : ''}`} viewBox="0 0 10 10"><path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </button>
                        <div className={`${tl.dropdownMenu} ${openDD === 's1' ? tl.dropdownMenuOpen : ''}`}>
                          {[['ask', 'push'], ['ask', 'sms'], ['ask', 'email'], ['reminder', 'push'], ['reminder', 'sms'], ['reminder', 'email']].map(([m, c]) => (
                            <button key={`${m}-${c}`} className={`${tl.dropdownItem} ${s1Combo.msg === m && s1Combo.ch === c ? tl.dropdownItemActive : ''}`} onClick={() => selectCombo('s1', m, c)}>
                              {comboLabel(m, c)}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className={tl.msgContent}>
                      {/* Ask · Push */}
                      <div className={s1Combo.msg === 'ask' && s1Combo.ch === 'push' ? '' : tl.hidden}>
                        <div className={tl.devicePhone}><div className={tl.deviceStatusbar}><span>9:41</span><span></span></div><div className={tl.deviceScreen}><div className={tl.mockupPush}><div className={tl.pushHeader}><div className={tl.pushIcon}>N</div><span className={tl.pushApp}>NeoBank</span><span className={tl.pushTime}>now</span></div><div className={tl.pushTitle}>$211 on streaming, Gina? 💸</div><div className={tl.pushBody}>Gina, you spent $211 on streaming! 💸 Claim one free month of Netflix for you now. Tap to share! 🍿</div></div></div><div className={tl.deviceHomeBar}></div></div>
                      </div>
                      {/* Ask · SMS */}
                      <div className={s1Combo.msg === 'ask' && s1Combo.ch === 'sms' ? '' : tl.hidden}>
                        <div className={tl.devicePhone}><div className={tl.deviceStatusbar}><span>9:41</span><span></span></div><div className={tl.deviceScreen}><div className={tl.mockupPush}><div className={tl.pushHeader}><div className={tl.pushIcon} style={{ background: '#34C759' }}><svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" /></svg></div><span className={tl.pushApp}>Messages</span><span className={tl.pushTime}>now</span></div><div className={tl.pushTitle}>NeoBank · 72589</div><div className={tl.pushBody}>Gina, you spent $211 on streaming! 💸 Claim one free month of Netflix for you now. Tap to share https://nflx.it/gina 🍿</div></div></div><div className={tl.deviceHomeBar}></div></div>
                      </div>
                      {/* Ask · Email */}
                      <div className={s1Combo.msg === 'ask' && s1Combo.ch === 'email' ? '' : tl.hidden}>
                        <div className={tl.devicePhone}><div className={tl.deviceStatusbar}><span>9:41</span><span></span></div><div className={tl.deviceScreen}><div className={tl.mockupPush}><div className={tl.pushHeader}><div className={tl.pushIcon} style={{ background: '#007AFF' }}><svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" /></svg></div><span className={tl.pushApp}>Mail</span><span className={tl.pushTime}>now</span></div><div className={tl.pushTitle}>Gina, let&apos;s get that $211 back? 🍿</div><div className={tl.pushBody}>Netflix for free, Gina. One for you, one for a friend. You spent $211 on streaming — let&apos;s get that back! Share with a friend and you both win 🍿</div></div></div><div className={tl.deviceHomeBar}></div></div>
                      </div>
                      {/* Reminder · Push */}
                      <div className={s1Combo.msg === 'reminder' && s1Combo.ch === 'push' ? '' : tl.hidden}>
                        <div className={tl.devicePhone}><div className={tl.deviceStatusbar}><span>9:41</span><span></span></div><div className={tl.deviceScreen}><div className={tl.mockupPush}><div className={tl.pushHeader}><div className={tl.pushIcon}>N</div><span className={tl.pushApp}>NeoBank</span><span className={tl.pushTime}>now</span></div><div className={tl.pushTitle}>Still thinking about it, Gina? 🍿</div><div className={tl.pushBody}>Your free Netflix month is still here. Share your link with a friend before it expires!</div></div></div><div className={tl.deviceHomeBar}></div></div>
                      </div>
                      {/* Reminder · SMS */}
                      <div className={s1Combo.msg === 'reminder' && s1Combo.ch === 'sms' ? '' : tl.hidden}>
                        <div className={tl.devicePhone}><div className={tl.deviceStatusbar}><span>9:41</span><span></span></div><div className={tl.deviceScreen}><div className={tl.mockupPush}><div className={tl.pushHeader}><div className={tl.pushIcon} style={{ background: '#34C759' }}><svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" /></svg></div><span className={tl.pushApp}>Messages</span><span className={tl.pushTime}>now</span></div><div className={tl.pushTitle}>NeoBank · 72589</div><div className={tl.pushBody}>Gina, your free Netflix month is still up for grabs! 🍿 Share with a friend before it expires: neo.bnk/r/gina</div></div></div><div className={tl.deviceHomeBar}></div></div>
                      </div>
                      {/* Reminder · Email */}
                      <div className={s1Combo.msg === 'reminder' && s1Combo.ch === 'email' ? '' : tl.hidden}>
                        <div className={tl.devicePhone}><div className={tl.deviceStatusbar}><span>9:41</span><span></span></div><div className={tl.deviceScreen}><div className={tl.mockupPush}><div className={tl.pushHeader}><div className={tl.pushIcon} style={{ background: '#007AFF' }}><svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" /></svg></div><span className={tl.pushApp}>Mail</span><span className={tl.pushTime}>now</span></div><div className={tl.pushTitle}>Gina, your Netflix reward is still here 🍿</div><div className={tl.pushBody}>Don&apos;t let it expire, Gina. Your free month of Netflix is still waiting — share with a friend before it&apos;s gone. One for you, one for them!</div></div></div><div className={tl.deviceHomeBar}></div></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ═══ STEP 2: Refer ═══ */}
              <div className={tl.tlStep}>
                <div className={tl.tlHeaderRow}>
                  <div className={tl.tlNumber}>2</div>
                  <span className={tl.tlLabel}>Refer</span>
                </div>
                <div className={tl.card}>
                  {/* Share sheet */}
                  <div className={tl.shareRow}>
                    <div className={tl.shareIcons}>
                      <div className={tl.shareIconWrap}>
                        <div className={tl.shareIcon} style={{ background: '#25D366' }}><svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg></div>
                        <span className={tl.shareLabel}>WhatsApp</span>
                      </div>
                      <div className={tl.shareIconWrap}>
                        <div className={tl.shareIcon} style={{ background: '#007AFF' }}><svg viewBox="0 0 24 24"><path d="M5.457 18.185C3.358 16.677 2 14.4 2 11.908 2 7.323 6.477 3.6 12 3.6s10 3.723 10 8.308-4.477 8.308-10 8.308c-1.072 0-2.1-.145-3.064-.41-.225.2-2.236 1.928-3.382 2.58-.19.107-.265-.072-.215-.242.19-.66.703-2.364 1.012-3.248-.314-.22-.618-.455-.894-.711z" /></svg></div>
                        <span className={tl.shareLabel}>Messages</span>
                      </div>
                      <div className={tl.shareIconWrap}>
                        <div className={tl.shareIcon} style={{ background: '#000000' }}><svg viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg></div>
                        <span className={tl.shareLabel}>X</span>
                      </div>
                      <div className={tl.shareIconWrap}>
                        <div className={tl.shareIcon} style={{ background: '#E4405F' }}><svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg></div>
                        <span className={tl.shareLabel}>Instagram</span>
                      </div>
                      <div className={tl.shareIconWrap}>
                        <div className={tl.shareIcon} style={{ background: '#0A66C2' }}><svg viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg></div>
                        <span className={tl.shareLabel}>LinkedIn</span>
                      </div>
                      <div className={tl.shareIconWrap}>
                        <div className={tl.shareIcon} style={{ background: 'var(--text-tertiary)' }}><svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="2.5" /><circle cx="12" cy="12" r="2.5" /><circle cx="19" cy="12" r="2.5" /></svg></div>
                        <span className={tl.shareLabel}>More</span>
                      </div>
                    </div>
                  </div>

                  {/* Gina → Paul: referral message */}
                  <div className={tl.msgContent}>
                    <div className={tl.devicePhone}>
                      <div className={tl.deviceStatusbar}><span>9:53</span><span></span></div>
                      <div className={tl.deviceScreen}><div className={tl.mockupPush}><div className={tl.pushHeader}><div className={tl.pushIcon} style={{ background: '#25D366' }}><svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg></div><span className={tl.pushApp}>WhatsApp</span><span className={tl.pushTime}>now</span></div><div className={tl.pushTitle}>Gina Miller</div><div className={tl.pushBody}>Hey, you should check out NeoBank. I&apos;m a big fan so far. Plus, if you sign up with my link, you get a month of 🍿 Netflix for free. Not a bad deal! neo.bnk/r/gina</div></div></div>
                      <div className={tl.deviceHomeBar}></div>
                    </div>
                  </div>

                  {/* Paul → Gina: response */}
                  <div className={tl.msgContent}>
                    <div className={tl.devicePhone}>
                      <div className={tl.deviceStatusbar}><span>9:57</span><span></span></div>
                      <div className={tl.deviceScreen}><div className={tl.mockupPush}><div className={tl.pushHeader}><div className={tl.pushIcon} style={{ background: '#25D366' }}><svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg></div><span className={tl.pushApp}>WhatsApp</span><span className={tl.pushTime}>now</span></div><div className={tl.pushTitle}>Paul Davis</div><div className={tl.pushBody}>Love this! Thanks for keeping me in mind, Gina 🍿</div></div></div>
                      <div className={tl.deviceHomeBar}></div>
                    </div>
                  </div>

                </div>
              </div>

              {/* ═══ STEP 3: Redeem ═══ */}
              <div className={tl.tlStep}>
                <div className={tl.tlHeaderRow}>
                  <div className={tl.tlNumber}>3</div>
                  <span className={tl.tlLabel}>Redeem</span>
                </div>
                <div className={tl.card}>
                  <div className={`${tl.messageBlock} ${tl.messageBlockTop}`}>
                    <div className={`${tl.msgHeader} ${tl.msgHeaderFloating}`}>
                      <div className={tl.dropdownWrap}>
                        <button className={tl.dropdownTrigger} onClick={() => setOpenDD(openDD === 's3' ? null : 's3')}>
                          <span>{comboLabel(s3Combo.msg, s3Combo.ch)}</span>
                          <svg className={`${tl.chevron} ${openDD === 's3' ? tl.chevronOpen : ''}`} viewBox="0 0 10 10"><path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </button>
                        <div className={`${tl.dropdownMenu} ${openDD === 's3' ? tl.dropdownMenuOpen : ''}`}>
                          {[['success', 'push'], ['success', 'sms'], ['success', 'email'], ['reminder', 'push'], ['reminder', 'sms'], ['reminder', 'email']].map(([m, c]) => (
                            <button key={`${m}-${c}`} className={`${tl.dropdownItem} ${s3Combo.msg === m && s3Combo.ch === c ? tl.dropdownItemActive : ''}`} onClick={() => selectCombo('s3', m, c)}>
                              {comboLabel(m, c)}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className={tl.msgContent}>
                      {/* Success · Push */}
                      <div className={s3Combo.msg === 'success' && s3Combo.ch === 'push' ? '' : tl.hidden}>
                        <div className={tl.devicePhone}><div className={tl.deviceStatusbar}><span>10:18</span><span></span></div><div className={tl.deviceScreen}><div className={tl.mockupPush}><div className={tl.pushHeader}><div className={tl.pushIcon}>N</div><span className={tl.pushApp}>NeoBank</span><span className={tl.pushTime}>now</span></div><div className={tl.pushTitle}>Netflix is officially unlocked! 📺</div><div className={tl.pushBody}>Nice move. Since you&apos;ve joined NeoBank, you and Gina both get a free month of Netflix. Head to the app to claim your reward and start streaming!</div></div><div className={tl.mockupPush}><div className={tl.pushHeader}><div className={tl.pushIcon}>N</div><span className={tl.pushApp}>NeoBank</span><span className={tl.pushTime}>now</span></div><div className={tl.pushTitle}>Your Netflix is on us! 🍿</div><div className={tl.pushBody}>Huge win—you and Paul both just scored a free month of Netflix. Your reward is officially unlocked and ready to use in the app. Enjoy!</div></div></div><div className={tl.deviceHomeBar}></div></div>
                      </div>
                      {/* Success · SMS */}
                      <div className={s3Combo.msg === 'success' && s3Combo.ch === 'sms' ? '' : tl.hidden}>
                        <div className={tl.devicePhone}><div className={tl.deviceStatusbar}><span>10:18</span><span></span></div><div className={tl.deviceScreen}><div className={tl.mockupPush}><div className={tl.pushHeader}><div className={tl.pushIcon} style={{ background: '#34C759' }}><svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" /></svg></div><span className={tl.pushApp}>Messages</span><span className={tl.pushTime}>now</span></div><div className={tl.pushTitle}>NeoBank · 72589</div><div className={tl.pushBody}>Nice move. Since you&apos;ve joined NeoBank, you and Gina both get a free month of Netflix. Head to the app to claim your reward and start streaming!</div></div><div className={tl.mockupPush}><div className={tl.pushHeader}><div className={tl.pushIcon} style={{ background: '#34C759' }}><svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" /></svg></div><span className={tl.pushApp}>Messages</span><span className={tl.pushTime}>now</span></div><div className={tl.pushTitle}>NeoBank · 72589</div><div className={tl.pushBody}>Huge win—you and Paul both just scored a free month of Netflix. Your reward is officially unlocked and ready to use in the app. Enjoy!</div></div></div><div className={tl.deviceHomeBar}></div></div>
                      </div>
                      {/* Success · Email */}
                      <div className={s3Combo.msg === 'success' && s3Combo.ch === 'email' ? '' : tl.hidden}>
                        <div className={tl.devicePhone}><div className={tl.deviceStatusbar}><span>10:18</span><span></span></div><div className={tl.deviceScreen}><div className={tl.mockupPush}><div className={tl.pushHeader}><div className={tl.pushIcon} style={{ background: '#007AFF' }}><svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" /></svg></div><span className={tl.pushApp}>Mail</span><span className={tl.pushTime}>now</span></div><div className={tl.pushTitle}>Netflix is officially unlocked! 📺</div><div className={tl.pushBody}>Nice move. Since you&apos;ve joined NeoBank, you and Gina both get a free month of Netflix. Head to the app to claim your reward and start streaming!</div></div><div className={tl.mockupPush}><div className={tl.pushHeader}><div className={tl.pushIcon} style={{ background: '#007AFF' }}><svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" /></svg></div><span className={tl.pushApp}>Mail</span><span className={tl.pushTime}>now</span></div><div className={tl.pushTitle}>Your Netflix is on us! 🍿</div><div className={tl.pushBody}>Huge win—you and Paul both just scored a free month of Netflix. Your reward is officially unlocked and ready to use in the app. Enjoy!</div></div></div><div className={tl.deviceHomeBar}></div></div>
                      </div>
                      {/* Reminder · Push */}
                      <div className={s3Combo.msg === 'reminder' && s3Combo.ch === 'push' ? '' : tl.hidden}>
                        <div className={tl.devicePhone}><div className={tl.deviceStatusbar}><span>10:18</span><span></span></div><div className={tl.deviceScreen}><div className={tl.mockupPush}><div className={tl.pushHeader}><div className={tl.pushIcon}>N</div><span className={tl.pushApp}>NeoBank</span><span className={tl.pushTime}>now</span></div><div className={tl.pushTitle}>Your Netflix month is waiting 🍿</div><div className={tl.pushBody}>Make your first transaction and unlock a free month of Netflix — for you and for Gina. Don&apos;t miss out!</div></div><div className={tl.mockupPush}><div className={tl.pushHeader}><div className={tl.pushIcon}>N</div><span className={tl.pushApp}>NeoBank</span><span className={tl.pushTime}>now</span></div><div className={tl.pushTitle}>Almost there, Gina! 🍿</div><div className={tl.pushBody}>Paul hasn&apos;t completed their first transaction yet. Once they do, you both unlock a free month of Netflix. Hang tight!</div></div></div><div className={tl.deviceHomeBar}></div></div>
                      </div>
                      {/* Reminder · SMS */}
                      <div className={s3Combo.msg === 'reminder' && s3Combo.ch === 'sms' ? '' : tl.hidden}>
                        <div className={tl.devicePhone}><div className={tl.deviceStatusbar}><span>10:18</span><span></span></div><div className={tl.deviceScreen}><div className={tl.mockupPush}><div className={tl.pushHeader}><div className={tl.pushIcon} style={{ background: '#34C759' }}><svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" /></svg></div><span className={tl.pushApp}>Messages</span><span className={tl.pushTime}>now</span></div><div className={tl.pushTitle}>NeoBank · 72589</div><div className={tl.pushBody}>Your free Netflix month is waiting! 🍿 Make your first transaction to unlock it — Gina gets one too. Expires in 7 days.</div></div><div className={tl.mockupPush}><div className={tl.pushHeader}><div className={tl.pushIcon} style={{ background: '#34C759' }}><svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" /></svg></div><span className={tl.pushApp}>Messages</span><span className={tl.pushTime}>now</span></div><div className={tl.pushTitle}>NeoBank · 72589</div><div className={tl.pushBody}>Almost there! Paul hasn&apos;t completed their first transaction yet. Once they do, you both unlock a free month of Netflix. Hang tight!</div></div></div><div className={tl.deviceHomeBar}></div></div>
                      </div>
                      {/* Reminder · Email */}
                      <div className={s3Combo.msg === 'reminder' && s3Combo.ch === 'email' ? '' : tl.hidden}>
                        <div className={tl.devicePhone}><div className={tl.deviceStatusbar}><span>10:18</span><span></span></div><div className={tl.deviceScreen}><div className={tl.mockupPush}><div className={tl.pushHeader}><div className={tl.pushIcon} style={{ background: '#007AFF' }}><svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" /></svg></div><span className={tl.pushApp}>Mail</span><span className={tl.pushTime}>now</span></div><div className={tl.pushTitle}>A free Netflix month, one step away 🍿</div><div className={tl.pushBody}>Almost there — one transaction is all it takes to unlock a free month of Netflix for you and Gina. Don&apos;t miss out, it expires in 7 days!</div></div><div className={tl.mockupPush}><div className={tl.pushHeader}><div className={tl.pushIcon} style={{ background: '#007AFF' }}><svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" /></svg></div><span className={tl.pushApp}>Mail</span><span className={tl.pushTime}>now</span></div><div className={tl.pushTitle}>Almost there, Gina! 🍿</div><div className={tl.pushBody}>Paul hasn&apos;t completed their first transaction yet. Once they do, you both unlock a free month of Netflix. We&apos;ll let you know!</div></div></div><div className={tl.deviceHomeBar}></div></div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </section>
        )}

        {/* ════════════════════════════════════════════
            SECTION 3 — Execution: How Edoo Operates
            ════════════════════════════════════════════ */}
        {showExecution && (
          <section
            style={{
              marginBottom: '3rem',
              animation: 'fadeIn 0.4s ease forwards',
            }}
          >
            <h3
              style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: 700,
                marginBottom: '0.25rem',
              }}
            >
              How Edoo Operates
            </h3>
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--text-tertiary)',
                marginBottom: '1.5rem',
              }}
            >
              {operationsCycle.summary}
            </p>

            {/* Daily cycle */}
            <div
              style={{
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                marginBottom: '1.5rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: '0.375rem',
                  marginBottom: '1rem',
                  flexWrap: 'wrap',
                }}
              >
                {operationsCycle.steps.map((step, i) => (
                  <React.Fragment key={i}>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        padding: '4px 10px',
                        backgroundColor: 'var(--accent-light)',
                        borderRadius: '12px',
                      }}
                    >
                      {step.name}
                    </span>
                    {i < operationsCycle.steps.length - 1 && (
                      <span style={{ fontSize: '12px', color: 'var(--border)', alignSelf: 'center' }}>
                        {'\u2192'}
                      </span>
                    )}
                  </React.Fragment>
                ))}
                <span style={{ fontSize: '12px', color: 'var(--border)', alignSelf: 'center' }}>
                  {'\u21BB'}
                </span>
              </div>

              {operationsCycle.steps.map((step, i) => (
                <CycleStep key={i} step={step} index={i} total={operationsCycle.steps.length} />
              ))}
            </div>

            {/* Expected daily ramp */}
            <div
              style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '1.5rem',
              }}
            >
              {operationsCycle.dailyRamp.map((phase, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    padding: '1rem',
                    backgroundColor: 'var(--accent-subtle)',
                    borderRadius: 'var(--radius-md)',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 600,
                      color: 'var(--text-tertiary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '0.25rem',
                    }}
                  >
                    Days {phase.days}
                  </div>
                  <div
                    style={{
                      fontSize: 'var(--font-size-xl)',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      marginBottom: '0.25rem',
                    }}
                  >
                    ~{phase.activeUsersPerDay}/day
                  </div>
                  <div
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--text-tertiary)',
                    }}
                  >
                    {phase.note}
                  </div>
                </div>
              ))}
            </div>

          </section>
        )}

        {/* ════════════════════════════════════════════
            SECTION 4 — Risk Management
            ════════════════════════════════════════════ */}
        {showRisk && (
          <section
            style={{
              marginBottom: '2rem',
              animation: 'fadeIn 0.4s ease forwards',
            }}
          >
            <h3
              style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: 700,
                marginBottom: '0.25rem',
              }}
            >
              Risk Management
            </h3>
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--text-tertiary)',
                marginBottom: '1.5rem',
              }}
            >
              How Edoo protects your budget during continuous operations.
            </p>

            {/* Two-column layout: Controls + Fraud side by side on desktop */}
            <div className="risk-layout">
              {/* Left column — Controls */}
              <div
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                }}
              >
                {riskManagement.controls.map((ctrl, i) => {
                  const displayValue = ctrl.format === 'currency'
                    ? formatCurrency(Math.round(budget * ctrl.ratio))
                    : ctrl.fixedValue;
                  return (
                    <div
                      key={ctrl.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem 1.25rem',
                        borderBottom: i < riskManagement.controls.length - 1 ? '1px solid var(--border-light)' : 'none',
                        backgroundColor: 'var(--surface)',
                      }}
                    >
                      <Tooltip text={ctrl.labelTooltip}>
                        <span
                          style={{
                            fontSize: 'var(--font-size-sm)',
                            fontWeight: 500,
                            color: 'var(--text-secondary)',
                            borderBottom: '1px dotted var(--text-tertiary)',
                          }}
                        >
                          {ctrl.label}
                        </span>
                      </Tooltip>
                      <Tooltip text={ctrl.valueTooltip}>
                        <span
                          style={{
                            fontSize: 'var(--font-size-sm)',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            padding: '2px 10px',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--accent-subtle)',
                            fontFamily: 'monospace',
                            cursor: 'help',
                          }}
                        >
                          {displayValue}
                        </span>
                      </Tooltip>
                    </div>
                  );
                })}
              </div>

              {/* Right column — Fraud Estimation */}
              <div
                style={{
                  border: '1px dashed var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.25rem',
                  backgroundColor: 'var(--surface)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Estimation label */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <span
                    className="monitoring-pulse"
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--text-tertiary)',
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 600,
                      color: 'var(--text-tertiary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Estimated
                  </span>
                </div>

                {/* Big KPI — total fraud rate */}
                <Tooltip text={riskManagement.fraudTotalTooltip}>
                  <div style={{ marginBottom: '1rem' }}>
                    <div
                      style={{
                        fontSize: 'var(--font-size-4xl)',
                        fontWeight: 700,
                        color: 'var(--text-secondary)',
                        lineHeight: 1,
                        cursor: 'help',
                      }}
                    >
                      ~{riskManagement.fraud.reduce((sum, f) => sum + f.rate, 0).toFixed(1)}%
                    </div>
                    <div
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--text-tertiary)',
                        marginTop: '0.25rem',
                      }}
                    >
                      Total fraud exposure
                    </div>
                  </div>
                </Tooltip>

                {/* Breakdown rows */}
                <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem' }}>
                  {riskManagement.fraud.map((item, i) => (
                    <Tooltip key={i} text={item.tooltip}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.375rem 0',
                          borderBottom: i < riskManagement.fraud.length - 1 ? '1px solid var(--border-light)' : 'none',
                          cursor: 'help',
                        }}
                      >
                        <span
                          style={{
                            fontSize: 'var(--font-size-xs)',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {item.type}
                        </span>
                        <span
                          style={{
                            fontSize: 'var(--font-size-sm)',
                            fontWeight: 600,
                            color: 'var(--text-secondary)',
                            fontFamily: 'monospace',
                          }}
                        >
                          {item.rate}%
                        </span>
                      </div>
                    </Tooltip>
                  ))}
                </div>

                {/* Monitoring footer */}
                <div
                  style={{
                    marginTop: 'auto',
                    paddingTop: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                  }}
                >
                  <span
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-tertiary)',
                      fontStyle: 'italic',
                    }}
                  >
                    Monitored in real-time during execution
                  </span>
                </div>
              </div>
            </div>

            {/* Policy line */}
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                margin: 0,
                marginTop: '1rem',
              }}
            >
              {riskManagement.fraudPolicy}
            </p>
          </section>
        )}
      </main>

      {/* ── Approve button (sticky bottom) ── */}
      {showCTA && (
        <div
          style={{
            position: 'sticky',
            bottom: 0,
            borderTop: '1px solid var(--border)',
            backgroundColor: 'var(--surface)',
            padding: '1.25rem 3rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <CTAButton onClick={onNext}>Launch Campaigns</CTAButton>
          <p
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--text-tertiary)',
              margin: 0,
              textAlign: 'center',
            }}
          >
            {approvalScope}
          </p>
        </div>
      )}

      <style>{`
        @keyframes blink { 50% { opacity: 0; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
