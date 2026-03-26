import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../lib/utils';

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
const ChevronLeft = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M9 4L6 7L9 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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
const GearIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 8.82a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const Sparkle = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M8 0L9.8 6.2L16 8L9.8 9.8L8 16L6.2 9.8L0 8L6.2 6.2L8 0Z" fill="currentColor"/></svg>
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

/* ── Index view data ── */
const RULES_INDEX = [
  { key: 'invite', label: 'Invite', subtopics: 'Audience, Triggers, Channels' },
  { key: 'rewards', label: 'Reward', subtopics: 'Payment Method, Reward Tiers' },
  { key: 'redemption', label: 'Redemption', subtopics: 'New User Journey, Reward Trigger' },
  { key: 'fatigue', label: 'Communication Controls', subtopics: 'Reminder Frequency, Rest Period, Expiration Date' },
  { key: 'budget', label: 'Budget Protection', subtopics: 'Spend Pace, Invite Stop' },
  { key: 'fraud', label: 'Fraud Prevention', subtopics: 'Link Hijacking Limit, Self-Referral, Bot Shield, Payment Hold' },
];

/* ══════════════════════════════════════
   Primitive Components
   ══════════════════════════════════════ */

/* ── Toggle ── */
const Toggle = ({ on, onChange }) => (
  <div className={cn('w-[34px] h-5 rounded-[10px] cursor-pointer relative transition-colors duration-200 ease-out shrink-0', on ? 'bg-brand' : 'bg-gray-300')} onClick={() => onChange && onChange(!on)}>
    <div className="w-4 h-4 rounded-full bg-surface absolute top-0.5 shadow-[0_1px_3px_rgba(0,0,0,0.15)] transition-[left] duration-200 ease-out" style={{ left: on ? '16px' : '2px' }} />
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
      <div className="inline-flex items-center gap-1 py-1 px-2.5 bg-surface border border-border rounded-sm text-[13px] text-foreground-muted cursor-pointer transition-colors duration-150 ease-out max-w-[260px] hover:border-gray-400" onClick={() => setOpen(!open)}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{display}</span>
        <span style={{ color: 'var(--text-tertiary)', fontSize: 10, flexShrink: 0 }}>▾</span>
      </div>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-surface border border-border rounded-lg shadow-md z-10 min-w-[200px] py-1">
          {items.map((item, i) => (
            <div className="flex items-center gap-2 py-2 px-3.5 text-[13px] text-foreground cursor-pointer transition-colors duration-150 ease-out select-none hover:bg-accent-subtle" key={i} onClick={() => toggle(i)}>
              <div className={cn('w-4 h-4 rounded border-[1.5px] border-gray-300 flex items-center justify-center shrink-0 transition-all duration-150 ease-out', item.on && 'bg-brand border-brand')}>
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
const SingleSelect = ({ value: initial, choices, onChange }) => {
  const [val, setVal] = useState(initial);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const pick = (choice) => { setVal(choice); setOpen(false); onChange?.(choice); };

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <div className="inline-flex items-center gap-1 py-1 px-2.5 bg-surface border border-border rounded-sm text-[13px] text-foreground-muted cursor-pointer transition-colors duration-150 ease-out hover:border-gray-400" onClick={() => setOpen(!open)}>
        <span>{val}</span>
        <span style={{ color: 'var(--text-tertiary)', fontSize: 10, flexShrink: 0 }}>▾</span>
      </div>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-surface border border-border rounded-lg shadow-md z-10 min-w-[140px] py-1">
          {choices.map((choice, i) => (
            <div className={cn('flex items-center gap-2 py-2 px-3.5 text-[13px] text-foreground cursor-pointer transition-colors duration-150 ease-out select-none hover:bg-accent-subtle', choice === val && 'text-foreground font-medium')} key={i} onClick={() => pick(choice)}>
              <div className={cn('w-3.5 h-3.5 rounded-full border-[1.5px] border-gray-300 flex items-center justify-center shrink-0 transition-all duration-150 ease-out', choice === val && 'border-brand')}>
                {choice === val && <div className="w-2 h-2 rounded-full bg-brand" />}
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
      <div className="inline-flex items-center gap-1 py-1 px-2.5 bg-surface border border-border rounded-sm text-[13px] text-foreground-muted cursor-pointer transition-colors duration-150 ease-out hover:border-gray-400" onClick={() => setOpen(!open)}>
        <span>{val}</span>
        <span style={{ color: 'var(--text-tertiary)', fontSize: 10, flexShrink: 0 }}>▾</span>
      </div>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-surface border border-border rounded-lg shadow-md z-10 min-w-[140px] py-1" style={{ minWidth: 220, padding: '4px 0' }}>
          {richChoices.map((c, i) => (
            <div className={cn('flex items-center gap-2 py-2 px-3.5 text-[13px] text-foreground cursor-pointer transition-colors duration-150 ease-out select-none hover:bg-accent-subtle', c.value === val && 'text-foreground font-medium')} key={i} onClick={() => pick(c.value)} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2, padding: '8px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className={cn('w-3.5 h-3.5 rounded-full border-[1.5px] border-gray-300 flex items-center justify-center shrink-0 transition-all duration-150 ease-out', c.value === val && 'border-brand')}>
                  {c.value === val && <div className="w-2 h-2 rounded-full bg-brand" />}
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
    <div className="mb-3">
      <div className="flex items-center justify-between min-h-10 p-0" style={{ marginBottom: 6 }}>
        <span className="text-[13px] font-medium text-foreground relative cursor-default" data-tip={tip || undefined}>{label}</span>
      </div>
      <div className="flex gap-2">
        {choices.map((c) => (
          <div
            key={c.value}
            className={cn('flex-1 py-2.5 px-3 border border-border rounded-sm cursor-pointer transition-all duration-150 ease-out bg-surface hover:border-gray-300', c.value === selected && 'border-brand')}
            onClick={() => setSelected(c.value)}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className={cn('w-3.5 h-3.5 rounded-full border-[1.5px] border-gray-300 flex items-center justify-center shrink-0 transition-all duration-150 ease-out', c.value === selected && 'border-brand')}>
                {c.value === selected && <div className="w-2 h-2 rounded-full bg-brand" />}
              </div>
              <span className="text-[13px] font-medium text-foreground">{c.value}</span>
            </div>
            <div className="text-[11px] text-foreground-faint leading-[1.4] pl-[22px]">{c.desc}</div>
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
    <div className="inline-flex items-center gap-0 bg-surface border border-border rounded-sm overflow-hidden">
      <button className="w-7 h-7 flex items-center justify-center cursor-pointer text-sm text-foreground-muted transition-all duration-150 ease-out p-0 hover:bg-accent-light hover:text-foreground disabled:text-gray-300 disabled:cursor-default" onClick={dec} disabled={val <= min}>−</button>
      <span className="text-[13px] text-foreground-muted min-w-[52px] text-center px-0.5">{val}{suffix ? ` ${suffix}` : ''}</span>
      <button className="w-7 h-7 flex items-center justify-center cursor-pointer text-sm text-foreground-muted transition-all duration-150 ease-out p-0 hover:bg-accent-light hover:text-foreground disabled:text-gray-300 disabled:cursor-default" onClick={inc} disabled={val >= max}>+</button>
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
          <div className="flex items-stretch min-h-[44px]" key={i}>
            <div className="flex flex-col items-center w-5 shrink-0">
              {!isFirst && <div className="w-[1.5px] bg-border flex-1 min-h-2" />}
              <div className={cn('w-2.5 h-2.5 rounded-full border-2 border-gray-300 bg-surface shrink-0 mt-1.5', step.fixed && 'border-accent bg-accent', step.trigger && 'border-brand bg-brand')} />
              {!isLast && <div className="w-[1.5px] bg-border flex-1 min-h-2" />}
            </div>
            <div className="flex-1 flex items-center justify-between py-1.5 pl-2.5">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="text-[13px] font-medium text-foreground">{step.label}</span>
                {step.fixed && <span className="text-[9px] py-0.5 px-1.5 rounded-[3px] font-semibold tracking-[0.04em] uppercase text-foreground-faint bg-accent-light">Start</span>}
                {step.trigger && <span className="text-[9px] py-0.5 px-1.5 rounded-[3px] font-semibold tracking-[0.04em] uppercase text-brand bg-brand-light">Redeems</span>}
              </div>
              {canRemove && (
                <div className="w-5 h-5 flex items-center justify-center rounded cursor-pointer text-gray-400 transition-all duration-150 ease-out shrink-0 ml-1 hover:bg-danger-light hover:text-danger" onClick={() => removeStep(i)}><XSmall /></div>
              )}
            </div>
          </div>
        );
      })}
      {available.length > 0 && (
        <div style={{ position: 'relative' }} ref={addRef}>
          <div className="flex items-center gap-1.5 py-1 pl-[30px] text-xs text-foreground-faint cursor-pointer transition-colors duration-150 ease-out hover:text-gray-600" onClick={() => setShowAdd(!showAdd)}>
            <PlusSmall /> Add step before redemption
          </div>
          {showAdd && (
            <div className="absolute right-0 top-full mt-1 bg-surface border border-border rounded-lg shadow-md z-10 min-w-[140px] py-1" style={{ left: 30, right: 'auto', minWidth: 180 }}>
              {available.map((a, i) => (
                <div className="flex items-center gap-2 py-2 px-3.5 text-[13px] text-foreground cursor-pointer transition-colors duration-150 ease-out select-none hover:bg-accent-subtle" key={i} onClick={() => addStep(a)}>
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
          <div className="flex items-center justify-between min-h-10 p-0">
            <span className="text-[13px] font-medium text-foreground relative cursor-default">{mode.label}</span>
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
    <div className="bg-accent-subtle rounded-lg py-3 px-3.5">
      <div className="flex items-center justify-between h-8">
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>Conversion rate</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{section.conversionRate}</span>
          <span className="text-[9px] text-foreground-faint bg-accent-light px-1.5 py-px rounded-[3px] ml-1.5 tracking-[0.04em] uppercase font-medium">from data</span>
        </div>
      </div>
      <div className="flex items-center justify-between h-8">
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>Pacing intensity</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }} ref={ref}>
          <div className="inline-flex items-center gap-1 py-1 px-2.5 bg-surface border border-border rounded-sm text-[13px] text-foreground-muted cursor-pointer transition-colors duration-150 ease-out hover:border-gray-400" onClick={() => setOpen(!open)}>
            <span>{intensity}</span>
            <span style={{ color: 'var(--text-tertiary)', fontSize: 10, flexShrink: 0 }}>▾</span>
          </div>
          {open && (
            <div className="absolute right-0 top-full mt-1 bg-surface border border-border rounded-lg shadow-md z-10 min-w-[140px] py-1">
              {section.intensityChoices.map((c, i) => (
                <div className={cn('flex items-center gap-2 py-2 px-3.5 text-[13px] text-foreground cursor-pointer transition-colors duration-150 ease-out select-none hover:bg-accent-subtle', c === intensity && 'text-foreground font-medium')} key={i} onClick={() => { setIntensity(c); setOpen(false); }}>
                  <div className={cn('w-3.5 h-3.5 rounded-full border-[1.5px] border-gray-300 flex items-center justify-center shrink-0 transition-all duration-150 ease-out', c === intensity && 'border-brand')}>
                    {c === intensity && <div className="w-2 h-2 rounded-full bg-brand" />}
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
        <div className="flex items-center justify-between min-h-10 p-0" key={ri}>
          <span className="text-[13px] font-medium text-foreground relative cursor-default" data-tip={row.tip || undefined}>
            {row.label}
            {row.detail && <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 400, marginLeft: 4 }}>{row.detail}</span>}
          </span>
          {row.toggle ? (
            <Toggle on={row.on} onChange={() => toggleRow(ri)} />
          ) : row.choices ? (
            <SingleSelect value={row.value} choices={row.choices} />
          ) : (
            <span className="text-[13px] text-foreground-muted text-right">{row.value}</span>
          )}
        </div>
      ))}
      {section.summary && (
        <div className="bg-accent-subtle rounded-lg py-2.5 px-3.5 mb-1" style={{ marginTop: 8 }}>
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold text-foreground">{section.summary.value}</span>
            <span className="text-[11.5px] text-foreground-faint">{section.summary.context}</span>
          </div>
          {section.summary.note && (
            <div className="text-[11px] text-foreground-faint mt-1 leading-[1.4]">{section.summary.note}</div>
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
          { key: 'transactional', label: 'Transactional', on: true, description: 'Referral ask is triggered in post-transaction moments.' },
          { key: 'promotional', label: 'Promotional', on: true, description: 'Referral ask is AI-initiated via selected channels.' },
        ]
      },
      {
        title: 'Channels',
        type: 'multiselect-rows',
        rows: [
          { label: 'Active CRM', items: [
            { label: 'Email', on: true },
            { label: 'SMS', on: true },
            { label: 'Push Notification', on: true },
          ]},
          { label: 'In-App Placement', items: [
            { label: 'Home Screen', on: true },
            { label: 'Post-Transaction', on: true },
            { label: 'Onboarding Success', on: true },
            { label: 'Invite Menu', on: true },
            { label: 'AI Chat', on: true },
          ]},
        ]
      }
    ]
  },
  rewards: {
    title: 'Rewards Offered',
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
    sections: [
      {
        title: 'New User Journey',
        type: 'journey',
        steps: [
          { label: 'Sign Up', fixed: true },
          { label: 'KYC' },
          { label: '1st Transaction', trigger: true },
        ],
        available: ['Email Verified', 'Phone Verified', 'Profile Complete', 'Card Linked', '2nd Transaction', '3rd Transaction'],
        note: 'Steps from your data pipeline. Last step is the Reward Trigger.'
      }
    ]
  },
  fatigue: {
    title: 'Communication Controls',
    sections: [
      {
        title: 'Limits',
        type: 'rows',
        rows: [
          { label: 'Maximum Reminder Frequency', tip: 'Limits contact attempts per customer, per stage of the funnel', value: '2', choices: ['1', '2', '3', '4', '5'] },
          { label: 'Rest Period', tip: 'Cool-down between consecutive touchpoints within a stage', stepper: { value: 2, min: 1, max: 7, suffix: 'days' } },
        ],
        note: 'Touchpoint count refreshes when the user progresses to the next stage.'
      },
      {
        title: 'Expiration Date',
        type: 'rows',
        rows: [
          { label: 'Campaign ends every', tip: 'How often the campaign cycle resets', stepper: { value: 30, min: 1, max: 365, suffix: 'days' } },
          { label: 'Friend must qualify within', tip: 'Time window for the referred friend to complete qualification', stepper: { value: 7, min: 1, max: 90, suffix: 'days' } },
          { label: 'Earned reward expires in', tip: 'How long before an unclaimed reward expires', stepper: { value: 60, min: 1, max: 365, suffix: 'days' } },
        ]
      }
    ]
  },
  budget: {
    title: 'Budget Protection',
    sections: [
      {
        title: 'Spend Pace',
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
          { label: 'Invite Stop', tip: 'Auto-pause if actual paid conversions spike massively in one day.', multiplier: '5.0x', choices: ['3.0x', '5.0x', '7.0x', '10.0x'], ref: 'daily pace', result: '$25,000/day' },
        ]
      }
    ]
  },
  fraud: {
    title: 'Fraud Prevention',
    sections: [
      {
        title: 'Detection',
        type: 'detection-cards',
        rows: [
          { label: 'Self-Referral Blocker', tip: 'Detects users referring themselves', value: 'Standard', choices: [
            { value: 'Standard', desc: 'Rejects identical IP addresses.' },
            { value: 'Aggressive', desc: 'Adds device fingerprint via SDK.' }
          ]},
          { label: 'Bot Shield', tip: 'Detects coordinated fraud networks', value: 'Aggressive', choices: [
            { value: 'Standard', desc: 'Blocks known bad IPs.' },
            { value: 'Aggressive', desc: 'Adds velocity and behavior checks.' }
          ]},
        ]
      },
      {
        title: 'Payment Hold',
        type: 'conditional',
        ifRow: { label: 'Conversions', value: '3.0x', choices: ['2.5x', '3.0x', '3.5x', '4.0x', '4.5x', '5.0x'], suffix: 'in 24h' },
        thenRow: { label: 'Hold period', stepper: { value: 7, min: 1, max: 30, suffix: 'days' } },
      },
      {
        title: 'Limits',
        type: 'rows',
        rows: [
          { label: 'Link Hijacking Limit', tip: 'Max payouts per referral link. Link auto-invalidates after cap.', stepper: { value: 5, min: 1, max: 20, suffix: 'payouts/link' } },
        ]
      }
    ]
  }
};

/* ══════════════════════════════════════
   Drawer Component
   ══════════════════════════════════════ */

const Drawer = ({ blockKey, onClose, onNavigate, handleRewardChange }) => {
  const isIndex = blockKey === 'index';
  const data = (!isIndex && blockKey) ? drawerContent[blockKey] : null;
  const isOpen = isIndex || !!data;
  const currentIdx = DRAWER_ORDER.indexOf(blockKey);
  const canPrev = currentIdx > 0;
  const canNext = currentIdx < DRAWER_ORDER.length - 1;

  const goPrev = () => { if (canPrev) onNavigate(DRAWER_ORDER[currentIdx - 1]); };
  const goNext = () => { if (canNext) onNavigate(DRAWER_ORDER[currentIdx + 1]); };

  return (
    <>
      <div className={cn('fixed inset-0 bg-black/15 z-[100] transition-opacity duration-[250ms] ease-out', isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none')} onClick={onClose} />
      <div className={cn('fixed top-0 right-0 bottom-0 w-[420px] max-w-[90vw] bg-surface z-[101] transition-transform duration-300 shadow-[-8px_0_30px_rgba(0,0,0,0.08)] flex flex-col', isOpen ? 'translate-x-0' : 'translate-x-full')}>
        {isIndex && (
          <>
            <div className="py-4 px-6 pb-3.5 border-b border-border-light shrink-0">
              <div className="flex items-center justify-between mb-0.5">
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Rules and Guardrails</div>
                <div className="w-7 h-7 flex items-center justify-center cursor-pointer rounded-sm text-foreground-faint transition-colors duration-150 ease-out shrink-0 hover:bg-accent-light hover:text-foreground" onClick={onClose}><CloseIcon /></div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {RULES_INDEX.map((cat) => (
                <div key={cat.key} className="flex items-center justify-between py-3.5 px-6 border-b border-border-light cursor-pointer transition-colors duration-150 ease-out hover:bg-accent-subtle last:border-b-0" onClick={() => onNavigate(cat.key)}>
                  <div>
                    <div className="text-sm font-semibold text-foreground">{cat.label}</div>
                    <div className="text-xs text-foreground-faint mt-0.5">{cat.subtopics}</div>
                  </div>
                  <ChevronRight className="shrink-0 text-gray-400 transition-colors duration-150 ease-out" />
                </div>
              ))}
            </div>
          </>
        )}
        {data && (
          <>
            <div className="py-4 px-6 pb-3.5 border-b border-border-light shrink-0">
              <div className="flex items-center justify-between mb-0.5">
                <div>
                  <button className="flex items-center gap-1 text-xs text-foreground-faint cursor-pointer transition-colors duration-150 ease-out hover:text-foreground" onClick={() => onNavigate('index')}>
                    <ChevronLeft /> Rules
                  </button>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginTop: 4 }}>{data.title}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div className="flex items-center gap-0.5">
                    <button className="w-7 h-7 flex items-center justify-center cursor-pointer rounded-sm text-foreground-faint transition-all duration-150 ease-out p-0 hover:bg-accent-light hover:text-foreground disabled:text-gray-300 disabled:cursor-default" onClick={goPrev} disabled={!canPrev}><ChevronUp /></button>
                    <span className="text-[11px] text-foreground-faint px-1 min-w-9 text-center">{currentIdx + 1} / {DRAWER_ORDER.length}</span>
                    <button className="w-7 h-7 flex items-center justify-center cursor-pointer rounded-sm text-foreground-faint transition-all duration-150 ease-out p-0 hover:bg-accent-light hover:text-foreground disabled:text-gray-300 disabled:cursor-default" onClick={goNext} disabled={!canNext}><ChevronDown /></button>
                  </div>
                  <div className="w-7 h-7 flex items-center justify-center cursor-pointer rounded-sm text-foreground-faint transition-colors duration-150 ease-out shrink-0 hover:bg-accent-light hover:text-foreground" onClick={onClose}><CloseIcon /></div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {data.sections.map((section, si) => (
                <div className="py-3 px-6" key={`${blockKey}-${si}`}>
                  {section.title && <div className="text-[10px] text-foreground-faint tracking-[0.1em] uppercase font-semibold mb-2">{section.title}</div>}

                  {section.type === 'audience' && (
                    <AudienceSection section={section} />
                  )}

                  {section.type === 'activation-modes' && (
                    <ActivationModes modes={section.modes} />
                  )}

                  {section.type === 'multiselect-rows' && section.rows && (
                    section.rows.map((row, ri) => (
                      <div className="flex items-center justify-between min-h-10 p-0" key={ri}>
                        <span className="text-[13px] font-medium text-foreground relative cursor-default">{row.label}</span>
                        <MultiSelect items={row.items} />
                      </div>
                    ))
                  )}

                  {section.type === 'budget-pacing' && (
                    <BudgetPacing section={section} />
                  )}

                  {section.type === 'multiplier-rows' && section.rows && (
                    section.rows.map((row, ri) => (
                      <div className="flex items-center justify-between min-h-10 p-0" key={ri} style={{ minHeight: 44 }}>
                        <span className="text-[13px] font-medium text-foreground relative cursor-default" data-tip={row.tip || undefined}>{row.label}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <SingleSelect value={row.multiplier} choices={row.choices} />
                          <span className="flex items-center gap-1.5 text-xs text-foreground-faint">{row.ref} =</span>
                          <span className="text-[13px] text-foreground-muted font-medium">{row.result}</span>
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
                    <div className="bg-accent-subtle rounded-lg overflow-hidden">
                      <div className="flex items-center h-10 px-3 gap-2.5">
                        <span className="text-[9px] font-bold tracking-[0.08em] uppercase text-foreground-faint min-w-8">If</span>
                        <span className="text-[13px] font-medium text-foreground relative cursor-default" style={{ flex: 1 }}>{section.ifRow.label}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <SingleSelect value={section.ifRow.value} choices={section.ifRow.choices} />
                          {section.ifRow.suffix && <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{section.ifRow.suffix}</span>}
                        </div>
                      </div>
                      <div className="flex items-center h-10 px-3 gap-2.5">
                        <span className="text-[9px] font-bold tracking-[0.08em] uppercase text-foreground-faint min-w-8">Then</span>
                        <span className="text-[13px] font-medium text-foreground relative cursor-default" style={{ flex: 1 }}>{section.thenRow.label}</span>
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
                      {section.rows.map((row, ri) => {
                        const side = section.title?.toLowerCase().includes('referrer') ? 'referrer' : 'referee';
                        return (
                          <div className="flex items-center justify-between min-h-10 p-0" key={ri}>
                            <span className="text-[13px] font-medium text-foreground relative cursor-default" data-tip={row.tip || undefined}>{row.label}</span>
                            {row.choices ? (
                              <SingleSelect
                                value={row.value}
                                choices={row.choices}
                                onChange={(val) => handleRewardChange(side, ri, val)}
                              />
                            ) : (
                              <span className="text-[13px] text-foreground-muted text-right">{row.value}</span>
                            )}
                          </div>
                        );
                      })}
                      {section.paidAs && (
                        <div className="flex items-center justify-between min-h-10 p-0" style={{ marginTop: 4 }}>
                          <span className="text-[13px] font-medium text-foreground relative cursor-default">Payment Method</span>
                          <MultiSelect items={section.paidAs} />
                        </div>
                      )}
                    </>
                  )}

                  {section.type === 'rows' && section.rows && (
                    section.rows.map((row, ri) => (
                      <div className="flex items-center justify-between min-h-10 p-0" key={ri}>
                        <span className="text-[13px] font-medium text-foreground relative cursor-default" data-tip={row.tip || undefined}>{row.label}</span>
                        {row.stepper ? (
                          <NumericStepper value={row.stepper.value} min={row.stepper.min} max={row.stepper.max} suffix={row.stepper.suffix} />
                        ) : row.richChoices ? (
                          <RichSelect value={row.value} richChoices={row.richChoices} />
                        ) : row.choices ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <SingleSelect value={row.value} choices={row.choices} />
                            {row.suffix && <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{row.suffix}</span>}
                            {row.ref && <span className="text-[9px] text-foreground-faint bg-accent-light px-1.5 py-px rounded-[3px] ml-1.5 tracking-[0.04em] uppercase font-medium">{row.ref}</span>}
                          </div>
                        ) : row.formula ? (
                          <span className="text-[13px] text-foreground-faint font-normal">{row.value}<span className="text-[9px] text-foreground-faint bg-accent-light px-1.5 py-px rounded-[3px] ml-1.5 tracking-[0.04em] uppercase font-medium">{row.formula}</span></span>
                        ) : (
                          <span className="text-[13px] text-foreground-muted text-right">{row.value}</span>
                        )}
                      </div>
                    ))
                  )}

                  {section.type === 'summary' && section.summary && (
                    <div className="bg-accent-subtle rounded-lg py-2.5 px-3.5 mb-1">
                      {section.summary.note && (
                        <div className="text-[11px] text-foreground-faint mt-1 leading-[1.4]">{section.summary.note}</div>
                      )}
                    </div>
                  )}

                  {section.note && (
                    <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 10, lineHeight: 1.5, fontStyle: 'italic' }}>{section.note}</div>
                  )}
                </div>
              ))}

              {/* Semantic Engine — add rule via AI */}
              <div className="py-3 px-6" style={{ borderTop: '1px solid var(--border-light)' }}>
                <div className="flex items-center gap-1.5 h-10 text-[13px] text-brand cursor-pointer font-medium transition-opacity duration-150 ease-out hover:opacity-80">
                  <div className="w-[18px] h-[18px] rounded-md bg-brand-light flex items-center justify-center"><Sparkle /></div>
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
   StrategyCards (exported) — Drawer only
   ══════════════════════════════════════ */

export { GearIcon, ChevronRight };

export default function StrategyCards({ activeDrawer, onClose, onNavigate, onRewardsChange }) {
  // Track reward tier values — parse "$75" → 75
  const parseDollar = (v) => Number(String(v).replace(/[^0-9.]/g, '')) || 0;
  const [referrerTiers, setReferrerTiers] = useState([0, 20, 50, 75]);
  const [refereeTiers, setRefereeTiers] = useState([0, 10, 25, 50]);

  const handleRewardChange = (side, tierIndex, dollarValue) => {
    const val = parseDollar(dollarValue);
    if (side === 'referrer') {
      setReferrerTiers(prev => {
        const next = [...prev];
        next[tierIndex] = val;
        onRewardsChange?.({ referrerTiers: next, refereeTiers });
        return next;
      });
    } else {
      setRefereeTiers(prev => {
        const next = [...prev];
        next[tierIndex] = val;
        onRewardsChange?.({ referrerTiers, refereeTiers: next });
        return next;
      });
    }
  };

  return (
    <Drawer
      blockKey={activeDrawer}
      onClose={onClose}
      onNavigate={onNavigate}
      handleRewardChange={handleRewardChange}
    />
  );
}
