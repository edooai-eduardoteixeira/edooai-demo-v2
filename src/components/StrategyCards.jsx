import React, { useState, useRef, useEffect } from 'react';
import s from '../styles/StrategyDrawer.module.css';

/* ═══════════════════════════════════════════
   Strategy & Guardrails — Card + Drawer System
   v10 Production Implementation
   ═══════════════════════════════════════════ */

/* ── Ordered drawer keys for navigation ── */
const DRAWER_ORDER = ['invite', 'rewards', 'redemption', 'fatigue', 'budget', 'fraud'];

/* ── Icons ── */
const ChevronRight = ({ className }) => (
  <svg className={className} width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M11 3L3 11M3 3L11 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const ChevronUp = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M10 9L7 6L4 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
const ChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M4 5L7 8L10 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
const Sparkle = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M8 0L9.8 6.2L16 8L9.8 9.8L8 16L6.2 9.8L0 8L6.2 6.2L8 0Z" fill="#3b5bdb"/></svg>
);
const CheckIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5L4 7L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
const XSmall = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M7.5 2.5L2.5 7.5M2.5 2.5L7.5 7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
);
const PlusSmall = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 2V8M2 5H8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
);

/* ══════════════════════════════════════
   Primitive Components
   ══════════════════════════════════════ */

/* ── Toggle ── */
const Toggle = ({ on, onChange }) => (
  <div className={`${s.toggleTrack} ${on ? s.on : s.off}`} onClick={() => onChange && onChange(!on)}>
    <div className={s.toggleKnob} />
  </div>
);

/* ── MultiSelect ── */
const MultiSelect = ({ items: initialItems }) => {
  const [items, setItems] = useState(initialItems);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (idx) => {
    setItems(items.map((item, i) => i === idx ? { ...item, on: !item.on } : item));
  };

  const activeNames = items.filter(i => i.on).map(i => i.label);
  const display = activeNames.length === 0 ? 'None selected'
    : activeNames.length === items.length ? 'All'
    : activeNames.join(', ');

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <div className={s.multiselectTrigger} onClick={() => setOpen(!open)}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{display}</span>
        <span style={{ color: 'var(--text-tertiary)', fontSize: 10, flexShrink: 0 }}>▾</span>
      </div>
      {open && (
        <div className={s.multiselectDropdown}>
          {items.map((item, i) => (
            <div className={s.multiselectOption} key={i} onClick={() => toggle(i)}>
              <div className={`${s.multiselectCheck} ${item.on ? s.checked : ''}`}>
                {item.on && <CheckIcon />}
              </div>
              {item.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── SingleSelect ── */
const SingleSelect = ({ value: initial, choices }) => {
  const [val, setVal] = useState(initial);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const pick = (choice) => { setVal(choice); setOpen(false); };

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <div className={s.singleselectTrigger} onClick={() => setOpen(!open)}>
        <span>{val}</span>
        <span style={{ color: 'var(--text-tertiary)', fontSize: 10, flexShrink: 0 }}>▾</span>
      </div>
      {open && (
        <div className={s.singleselectDropdown}>
          {choices.map((choice, i) => (
            <div className={`${s.singleselectOption} ${choice === val ? s.selected : ''}`} key={i} onClick={() => pick(choice)}>
              <div className={`${s.singleselectRadio} ${choice === val ? s.selected : ''}`}>
                {choice === val && <div className={s.singleselectRadioDot} />}
              </div>
              {choice}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── RichSelect (options with descriptions) ── */
const RichSelect = ({ value: initial, richChoices }) => {
  const [val, setVal] = useState(initial);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  const pick = (v) => { setVal(v); setOpen(false); };
  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <div className={s.singleselectTrigger} onClick={() => setOpen(!open)}>
        <span>{val}</span>
        <span style={{ color: 'var(--text-tertiary)', fontSize: 10, flexShrink: 0 }}>▾</span>
      </div>
      {open && (
        <div className={s.singleselectDropdown} style={{ minWidth: 220, padding: '4px 0' }}>
          {richChoices.map((c, i) => (
            <div className={`${s.singleselectOption} ${c.value === val ? s.selected : ''}`} key={i} onClick={() => pick(c.value)} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2, padding: '8px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className={`${s.singleselectRadio} ${c.value === val ? s.selected : ''}`}>
                  {c.value === val && <div className={s.singleselectRadioDot} />}
                </div>
                <span style={{ fontWeight: 500 }}>{c.value}</span>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', paddingLeft: 22, lineHeight: 1.3 }}>{c.desc}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── SelectableCards (always-visible two-option selector with descriptions) ── */
const SelectableCards = ({ label, tip, value: initial, choices }) => {
  const [selected, setSelected] = useState(initial);
  return (
    <div className={s.selectableCardsGroup}>
      <div className={s.drawerRow} style={{ marginBottom: 6 }}>
        <span className={s.drawerRowLabel} data-tip={tip || undefined}>{label}</span>
      </div>
      <div className={s.selectableCardsRow}>
        {choices.map((c) => (
          <div
            key={c.value}
            className={`${s.selectableCard} ${c.value === selected ? s.selectableCardActive : ''}`}
            onClick={() => setSelected(c.value)}
          >
            <div className={s.selectableCardHeader}>
              <div className={`${s.selectableCardRadio} ${c.value === selected ? s.selectableCardRadioActive : ''}`}>
                {c.value === selected && <div className={s.selectableCardRadioDot} />}
              </div>
              <span className={s.selectableCardTitle}>{c.value}</span>
            </div>
            <div className={s.selectableCardDesc}>{c.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── NumericStepper ── */
const NumericStepper = ({ value: initial, min, max, suffix }) => {
  const [val, setVal] = useState(initial);
  const dec = () => setVal(v => Math.max(min, v - 1));
  const inc = () => setVal(v => Math.min(max, v + 1));
  return (
    <div className={s.stepperWrap}>
      <button className={s.stepperBtn} onClick={dec} disabled={val <= min}>−</button>
      <span className={s.stepperValue}>{val}{suffix ? ` ${suffix}` : ''}</span>
      <button className={s.stepperBtn} onClick={inc} disabled={val >= max}>+</button>
    </div>
  );
};

/* ══════════════════════════════════════
   Composite Section Components
   ══════════════════════════════════════ */

/* ── JourneySection ── */
const JourneySection = ({ section }) => {
  const [steps, setSteps] = useState(section.steps);
  const [showAdd, setShowAdd] = useState(false);
  const addRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (addRef.current && !addRef.current.contains(e.target)) setShowAdd(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const usedLabels = steps.map(st => st.label);
  const available = (section.available || []).filter(a => !usedLabels.includes(a));

  const removeStep = (idx) => {
    const updated = steps.filter((_, i) => i !== idx);
    if (updated.length > 0) {
      updated.forEach(st => st.trigger = false);
      updated[updated.length - 1].trigger = true;
    }
    setSteps([...updated]);
  };

  const addStep = (label) => {
    const newSteps = [...steps];
    const triggerIdx = newSteps.findIndex(st => st.trigger);
    newSteps.splice(triggerIdx, 0, { label });
    setSteps(newSteps);
    setShowAdd(false);
  };

  return (
    <div>
      {steps.map((step, i) => {
        const isFirst = i === 0;
        const isLast = i === steps.length - 1;
        const canRemove = !step.fixed && steps.length > 2;
        return (
          <div className={s.journeyStep} key={i}>
            <div className={s.journeyRail}>
              {!isFirst && <div className={s.journeyLine} />}
              <div className={`${s.journeyDot} ${step.fixed ? s.start : ''} ${step.trigger ? s.trigger : ''}`} />
              {!isLast && <div className={s.journeyLine} />}
            </div>
            <div className={s.journeyContent}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className={s.journeyLabel}>{step.label}</span>
                {step.fixed && <span className={`${s.journeyBadge} ${s.startBadge}`}>Start</span>}
                {step.trigger && <span className={`${s.journeyBadge} ${s.triggerBadge}`}>Redeems</span>}
              </div>
              {canRemove && (
                <div className={s.journeyRemove} onClick={() => removeStep(i)}><XSmall /></div>
              )}
            </div>
          </div>
        );
      })}
      {available.length > 0 && (
        <div style={{ position: 'relative' }} ref={addRef}>
          <div className={s.journeyAdd} onClick={() => setShowAdd(!showAdd)}>
            <PlusSmall /> Add step before redemption
          </div>
          {showAdd && (
            <div className={s.singleselectDropdown} style={{ left: 30, right: 'auto', minWidth: 180 }}>
              {available.map((a, i) => (
                <div className={s.singleselectOption} key={i} onClick={() => addStep(a)}>
                  {a}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ── ActivationModes ── */
const ActivationModes = ({ modes: initialModes }) => {
  const [modes, setModes] = useState(initialModes);
  const toggleMode = (idx) => {
    setModes(modes.map((m, i) => i === idx ? { ...m, on: !m.on } : m));
  };
  return (
    <div>
      {modes.map((mode, i) => (
        <div key={mode.key} style={{ borderTop: i > 0 ? '1px solid var(--border-light)' : 'none' }}>
          <div className={s.drawerRow}>
            <span className={s.drawerRowLabel}>{mode.label}</span>
            <Toggle on={mode.on} onChange={() => toggleMode(i)} />
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', lineHeight: 1.4, paddingBottom: 8 }}>
            {mode.description}
          </div>
        </div>
      ))}
    </div>
  );
};

/* ── BudgetPacing ── */
const BudgetPacing = ({ section }) => {
  const [intensity, setIntensity] = useState(section.intensity);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  const pct = parseInt(intensity) / 100;
  const cap = Math.round(section.baseCap * pct);
  const capDisplay = cap >= 1000 ? `~${(cap / 1000).toFixed(1).replace(/\.0$/, '')}K` : `~${cap}`;
  return (
    <div className={s.pacingBlock}>
      <div className={s.pacingRow}>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>Conversion rate</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{section.conversionRate}</span>
          <span className={s.autoBadge}>from data</span>
        </div>
      </div>
      <div className={s.pacingRow}>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>Pacing intensity</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }} ref={ref}>
          <div className={s.singleselectTrigger} onClick={() => setOpen(!open)}>
            <span>{intensity}</span>
            <span style={{ color: 'var(--text-tertiary)', fontSize: 10, flexShrink: 0 }}>▾</span>
          </div>
          {open && (
            <div className={s.singleselectDropdown}>
              {section.intensityChoices.map((c, i) => (
                <div className={`${s.singleselectOption} ${c === intensity ? s.selected : ''}`} key={i} onClick={() => { setIntensity(c); setOpen(false); }}>
                  <div className={`${s.singleselectRadio} ${c === intensity ? s.selected : ''}`}>
                    {c === intensity && <div className={s.singleselectRadioDot} />}
                  </div>
                  {c}
                </div>
              ))}
            </div>
          )}
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>→</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{capDisplay}</span>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>invites/day</span>
        </div>
      </div>
    </div>
  );
};

/* ── AudienceSection ── */
const AudienceSection = ({ section }) => {
  const [rows, setRows] = useState(section.rows);
  const toggleRow = (idx) => {
    setRows(rows.map((r, i) => i === idx ? { ...r, on: !r.on } : r));
  };

  return (
    <>
      {rows.map((row, ri) => (
        <div className={s.drawerRow} key={ri}>
          <span className={s.drawerRowLabel} data-tip={row.tip || undefined}>
            {row.label}
            {row.detail && <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 400, marginLeft: 4 }}>{row.detail}</span>}
          </span>
          {row.toggle ? (
            <Toggle on={row.on} onChange={() => toggleRow(ri)} />
          ) : row.choices ? (
            <SingleSelect value={row.value} choices={row.choices} />
          ) : (
            <span className={s.drawerRowValue}>{row.value}</span>
          )}
        </div>
      ))}
      {section.summary && (
        <div className={s.liveSummary} style={{ marginTop: 8 }}>
          <div className={s.liveSummaryTop}>
            <span className={s.liveSummaryValue}>{section.summary.value}</span>
            <span className={s.liveSummaryContext}>{section.summary.context}</span>
          </div>
          {section.summary.note && (
            <div className={s.liveSummaryNote}>{section.summary.note}</div>
          )}
        </div>
      )}
    </>
  );
};

/* ══════════════════════════════════════
   Drawer Content Data
   ══════════════════════════════════════ */

const drawerContent = {
  invite: {
    title: 'Invite',
    subtitle: 'Strategy',
    sections: [
      {
        title: 'Audience',
        type: 'audience',
        rows: [
          { label: 'Exclude NPS ≤', tip: 'Customers with NPS score at or below this threshold', value: '6', choices: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] },
          { label: 'Exclude active support tickets', tip: 'Customers with unresolved support issues', toggle: true, on: true },
          { label: 'Exclude fraud-flagged', tip: 'Accounts flagged by fraud detection systems', toggle: true, on: true },
          { label: 'Exclude compliance holds', tip: 'Accounts under regulatory or compliance review', toggle: true, on: true },
          { label: 'Min. account age', tip: 'Minimum days since account creation', value: '60 days', choices: ['30 days', '60 days', '90 days', '120 days', '180 days'] },
          { label: 'Exclude inactive accounts', tip: 'Accounts inactive beyond this threshold', value: '> 90 days', choices: ['> 30 days', '> 60 days', '> 90 days', '> 180 days', '> 365 days'] },
        ],
        summary: { value: '249,865 of 847,000', context: '29.5% eligible — as of today', note: 'Opted-out users are always excluded.' }
      },
      {
        title: 'Triggers',
        type: 'activation-modes',
        modes: [
          { key: 'transactional', label: 'Transactional', on: true, description: 'Referral ask is embedded in post-transaction moments.' },
          { key: 'promotional', label: 'Promotional', on: true, description: 'AI-initiated outreach using Timing Insights — 1:1, not scheduled blasts.' },
        ]
      }
    ]
  },
  rewards: {
    title: 'Rewards Offered',
    subtitle: 'Strategy',
    sections: [
      {
        title: 'Referrer reward',
        type: 'reward-block',
        rows: [
          { label: 'Tier 1 (organic)', tip: 'No incentive — relies on goodwill', value: '$0', choices: ['$0'] },
          { label: 'Tier 2', tip: 'Low-cost nudge for warm leads', value: '$20', choices: ['$10', '$15', '$20', '$25', '$30'] },
          { label: 'Tier 3', tip: 'Mid-range incentive for moderate intent', value: '$50', choices: ['$35', '$40', '$50', '$60', '$75'] },
          { label: 'Tier 4', tip: 'High-value offer for hard conversions', value: '$75', choices: ['$75', '$100', '$125', '$150', '$200'] },
        ],
        paidAs: [
          { label: 'Account Credit', on: true },
          { label: 'Gift Card', on: true },
          { label: 'Coupon', on: false },
          { label: 'Cashback', on: false },
        ]
      },
      {
        title: 'Referee reward',
        type: 'reward-block',
        rows: [
          { label: 'Tier 1 (organic)', tip: 'No incentive — relies on goodwill', value: '$0', choices: ['$0'] },
          { label: 'Tier 2', tip: 'Welcome bonus for new sign-ups', value: '$10', choices: ['$5', '$10', '$15', '$20', '$25'] },
          { label: 'Tier 3', tip: 'Mid-range incentive for activation', value: '$25', choices: ['$20', '$25', '$30', '$40', '$50'] },
          { label: 'Tier 4', tip: 'High-value offer for first transaction', value: '$50', choices: ['$50', '$60', '$75', '$100'] },
        ],
        paidAs: [
          { label: 'Account Credit', on: true },
          { label: 'Coupon', on: true },
          { label: 'Gift Card', on: false },
          { label: 'Cashback', on: false },
        ]
      },
      {
        title: null,
        type: 'summary',
        summary: { note: 'Tracked via Referral Link. AI selects tier per customer based on predicted conversion.' }
      }
    ]
  },
  redemption: {
    title: 'Redemption',
    subtitle: 'Strategy',
    sections: [
      {
        title: 'Referee journey',
        type: 'journey',
        steps: [
          { label: 'Sign Up', fixed: true },
          { label: 'KYC' },
          { label: '1st Transaction', trigger: true },
        ],
        available: ['Email Verified', 'Phone Verified', 'Profile Complete', 'Card Linked', '2nd Transaction', '3rd Transaction'],
        note: 'Steps from your data pipeline. Last step triggers the reward payout.'
      }
    ]
  },
  fatigue: {
    title: 'Customer Fatigue',
    subtitle: 'Guardrails',
    sections: [
      {
        title: 'Limits',
        type: 'rows',
        rows: [
          { label: 'Max touchpoints per stage', tip: 'Limits contact attempts per customer, per stage of the funnel', value: '2', choices: ['1', '2', '3', '4', '5'] },
          { label: 'Minimum rest period', tip: 'Cool-down between consecutive touchpoints within a stage', stepper: { value: 2, min: 1, max: 7, suffix: 'days' } },
          { label: 'Offer window', tip: 'How long each customer is "in play" before the offer expires', stepper: { value: 30, min: 1, max: 30, suffix: 'days' } },
        ],
        note: 'Touchpoint count refreshes when the user progresses to the next stage.'
      }
    ]
  },
  budget: {
    title: 'Budget Protection',
    subtitle: 'Guardrails',
    sections: [
      {
        title: 'Pacing',
        type: 'budget-pacing',
        conversionRate: '2.3%',
        baseCap: 1500,
        intensity: '100%',
        intensityChoices: ['50%', '75%', '80%', '90%', '100%', '110%', '125%', '150%'],
      },
      {
        title: 'Safeguards',
        type: 'multiplier-rows',
        rows: [
          { label: 'Max outstanding offers', tip: 'Total uncommitted reward liability. If hit, engine pauses new outreach.', multiplier: '2.0x', choices: ['1.5x', '2.0x', '2.5x', '3.0x', '4.0x'], ref: 'budget', result: '$300,000' },
          { label: 'Spend anomaly pause', tip: 'Auto-pause if actual paid conversions spike massively in one day.', multiplier: '5.0x', choices: ['3.0x', '5.0x', '7.0x', '10.0x'], ref: 'daily pace', result: '$25,000/day' },
        ]
      }
    ]
  },
  fraud: {
    title: 'Fraud Prevention',
    subtitle: 'Guardrails',
    sections: [
      {
        title: 'Detection',
        type: 'detection-cards',
        rows: [
          { label: 'Self-referral blocker', tip: 'Detects users referring themselves', value: 'Standard', choices: [
            { value: 'Standard', desc: 'Rejects identical IP addresses.' },
            { value: 'Aggressive', desc: 'Adds shared device and Wi-Fi detection.' }
          ]},
          { label: 'Network & botnet shield', tip: 'Detects coordinated fraud networks', value: 'Aggressive', choices: [
            { value: 'Standard', desc: 'Blocks datacenters, TOR, and high-risk proxies.' },
            { value: 'Aggressive', desc: 'Adds behavioral cluster detection.' }
          ]},
        ]
      },
      {
        title: 'Suspicious escrow',
        type: 'conditional',
        ifRow: { label: 'Conversions', value: '3.0x', choices: ['2.5x', '3.0x', '3.5x', '4.0x', '4.5x', '5.0x'], suffix: 'in 24h' },
        thenRow: { label: 'Hold period', stepper: { value: 7, min: 1, max: 30, suffix: 'days' } },
      },
      {
        title: 'Limits',
        type: 'rows',
        rows: [
          { label: 'Link hijacking limit', tip: 'Max payouts per referral link. Link auto-invalidates after cap.', stepper: { value: 5, min: 1, max: 20, suffix: 'payouts/link' } },
        ]
      }
    ]
  }
};

/* ══════════════════════════════════════
   Drawer Component
   ══════════════════════════════════════ */

const Drawer = ({ blockKey, onClose, onNavigate }) => {
  const data = blockKey ? drawerContent[blockKey] : null;
  const isOpen = !!data;
  const currentIdx = DRAWER_ORDER.indexOf(blockKey);
  const canPrev = currentIdx > 0;
  const canNext = currentIdx < DRAWER_ORDER.length - 1;

  const goPrev = () => { if (canPrev) onNavigate(DRAWER_ORDER[currentIdx - 1]); };
  const goNext = () => { if (canNext) onNavigate(DRAWER_ORDER[currentIdx + 1]); };

  return (
    <>
      <div className={`${s.drawerBackdrop} ${isOpen ? s.open : ''}`} onClick={onClose} />
      <div className={`${s.drawerPanel} ${isOpen ? s.open : ''}`}>
        {data && (
          <>
            <div className={s.drawerHeader}>
              <div className={s.drawerHeaderTop}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{data.title}</div>
                  <div className={s.drawerHeaderSub}>{data.subtitle}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div className={s.drawerNav}>
                    <button className={s.drawerNavBtn} onClick={goPrev} disabled={!canPrev}><ChevronUp /></button>
                    <span className={s.drawerNavCount}>{currentIdx + 1} / {DRAWER_ORDER.length}</span>
                    <button className={s.drawerNavBtn} onClick={goNext} disabled={!canNext}><ChevronDown /></button>
                  </div>
                  <div className={s.drawerClose} onClick={onClose}><CloseIcon /></div>
                </div>
              </div>
            </div>

            <div className={s.drawerBody}>
              {data.sections.map((section, si) => (
                <div className={s.drawerSection} key={`${blockKey}-${si}`}>
                  {section.title && <div className={s.drawerSectionTitle}>{section.title}</div>}

                  {section.type === 'audience' && (
                    <AudienceSection section={section} />
                  )}

                  {section.type === 'activation-modes' && (
                    <ActivationModes modes={section.modes} />
                  )}

                  {section.type === 'budget-pacing' && (
                    <BudgetPacing section={section} />
                  )}

                  {section.type === 'multiplier-rows' && section.rows && (
                    section.rows.map((row, ri) => (
                      <div className={s.drawerRow} key={ri} style={{ minHeight: 44 }}>
                        <span className={s.drawerRowLabel} data-tip={row.tip || undefined}>{row.label}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <SingleSelect value={row.multiplier} choices={row.choices} />
                          <span className={s.multiplierFormula}>{row.ref} =</span>
                          <span className={s.multiplierResult}>{row.result}</span>
                        </div>
                      </div>
                    ))
                  )}

                  {section.type === 'detection-cards' && section.rows && (
                    section.rows.map((row, ri) => (
                      <SelectableCards key={ri} label={row.label} tip={row.tip} value={row.value} choices={row.choices} />
                    ))
                  )}

                  {section.type === 'conditional' && (
                    <div className={s.conditionalBlock}>
                      <div className={s.conditionalRow}>
                        <span className={s.conditionalKeyword}>If</span>
                        <span className={s.drawerRowLabel} style={{ flex: 1 }}>{section.ifRow.label}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <SingleSelect value={section.ifRow.value} choices={section.ifRow.choices} />
                          {section.ifRow.suffix && <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{section.ifRow.suffix}</span>}
                        </div>
                      </div>
                      <div className={s.conditionalRow}>
                        <span className={s.conditionalKeyword}>Then</span>
                        <span className={s.drawerRowLabel} style={{ flex: 1 }}>{section.thenRow.label}</span>
                        {section.thenRow.stepper && (
                          <NumericStepper value={section.thenRow.stepper.value} min={section.thenRow.stepper.min} max={section.thenRow.stepper.max} suffix={section.thenRow.stepper.suffix} />
                        )}
                      </div>
                    </div>
                  )}

                  {section.type === 'journey' && (
                    <JourneySection section={section} />
                  )}

                  {section.type === 'reward-block' && (
                    <>
                      {section.rows.map((row, ri) => (
                        <div className={s.drawerRow} key={ri}>
                          <span className={s.drawerRowLabel} data-tip={row.tip || undefined}>{row.label}</span>
                          {row.choices ? (
                            <SingleSelect value={row.value} choices={row.choices} />
                          ) : (
                            <span className={s.drawerRowValue}>{row.value}</span>
                          )}
                        </div>
                      ))}
                      {section.paidAs && (
                        <div className={s.drawerRow} style={{ marginTop: 4 }}>
                          <span className={s.drawerRowLabel} style={{ fontSize: 10, color: 'var(--text-tertiary)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>Paid as</span>
                          <MultiSelect items={section.paidAs} />
                        </div>
                      )}
                    </>
                  )}

                  {section.type === 'rows' && section.rows && (
                    section.rows.map((row, ri) => (
                      <div className={s.drawerRow} key={ri}>
                        <span className={s.drawerRowLabel} data-tip={row.tip || undefined}>{row.label}</span>
                        {row.stepper ? (
                          <NumericStepper value={row.stepper.value} min={row.stepper.min} max={row.stepper.max} suffix={row.stepper.suffix} />
                        ) : row.richChoices ? (
                          <RichSelect value={row.value} richChoices={row.richChoices} />
                        ) : row.choices ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <SingleSelect value={row.value} choices={row.choices} />
                            {row.suffix && <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{row.suffix}</span>}
                            {row.ref && <span className={s.autoBadge}>{row.ref}</span>}
                          </div>
                        ) : row.formula ? (
                          <span className={s.drawerRowDerived}>{row.value}<span className={s.autoBadge}>{row.formula}</span></span>
                        ) : (
                          <span className={s.drawerRowValue}>{row.value}</span>
                        )}
                      </div>
                    ))
                  )}

                  {section.type === 'summary' && section.summary && (
                    <div className={s.liveSummary}>
                      {section.summary.note && (
                        <div className={s.liveSummaryNote}>{section.summary.note}</div>
                      )}
                    </div>
                  )}

                  {section.note && (
                    <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 10, lineHeight: 1.5, fontStyle: 'italic' }}>{section.note}</div>
                  )}
                </div>
              ))}

              {/* Semantic Engine — add rule via AI */}
              <div className={s.drawerSection} style={{ borderTop: '1px solid var(--border-light)' }}>
                <div className={s.addRuleBtn}>
                  <div className={s.addRulePlus}><Sparkle /></div>
                  Add rule with AI
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

/* ══════════════════════════════════════
   CardRow + StrategyCards (exported)
   ══════════════════════════════════════ */

const ConfigRow = ({ title, onClick }) => (
  <div className={s.configRow} onClick={onClick}>
    <span className={s.configRowTitle}>{title}</span>
    <ChevronRight className={s.configRowChevron} />
  </div>
);

export default function StrategyCards({ ctaButton, ctaSubtitle }) {
  const [activeDrawer, setActiveDrawer] = useState(null);
  const open = (key) => setActiveDrawer(key);
  const close = () => setActiveDrawer(null);

  return (
    <>
      <div className={s.section3Zone}>
        <div className={s.section3Inner}>
          {/* Strategy */}
          <div className={s.group}>
            <div className={s.groupLabel}>Strategy</div>
            <div className={s.configRows}>
              <ConfigRow title="Invite" onClick={() => open('invite')} />
              <ConfigRow title="Rewards Offered" onClick={() => open('rewards')} />
              <ConfigRow title="Redemption" onClick={() => open('redemption')} />
            </div>
          </div>

          {/* Guardrails */}
          <div className={s.group}>
            <div className={s.groupLabel}>Guardrails</div>
            <div className={s.configRows}>
              <ConfigRow title="Customer Fatigue" onClick={() => open('fatigue')} />
              <ConfigRow title="Budget Protection" onClick={() => open('budget')} />
              <ConfigRow title="Fraud Prevention" onClick={() => open('fraud')} />
            </div>
          </div>

          {/* CTA inside zone */}
          {ctaButton && (
            <div className={s.ctaWrap}>
              {ctaButton}
              {ctaSubtitle && <div className={s.ctaSubtitle}>{ctaSubtitle}</div>}
            </div>
          )}
        </div>
      </div>

      {/* Drawer */}
      <Drawer blockKey={activeDrawer} onClose={close} onNavigate={open} />
    </>
  );
}
