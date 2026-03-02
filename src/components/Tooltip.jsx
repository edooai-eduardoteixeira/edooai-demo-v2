import React, { useState, useRef, useEffect } from 'react';

export default function Tooltip({ text, children, underline = false }) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const tipRef = useRef(null);

  useEffect(() => {
    if (visible && triggerRef.current && tipRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const tipRect = tipRef.current.getBoundingClientRect();
      const top = rect.top - tipRect.height - 8;
      const left = rect.left + rect.width / 2 - tipRect.width / 2;
      setPos({
        top: top < 4 ? rect.bottom + 8 : top,
        left: Math.max(8, Math.min(left, window.innerWidth - tipRect.width - 8)),
      });
    }
  }, [visible]);

  const triggerStyle = {
    position: 'relative',
    cursor: 'help',
  };

  if (underline) {
    triggerStyle.textDecoration = visible ? 'underline dashed' : 'none';
    triggerStyle.textDecorationColor = 'var(--text-tertiary)';
    triggerStyle.textUnderlineOffset = '3px';
    triggerStyle.textDecorationThickness = '1px';
  }

  return (
    <span
      ref={triggerRef}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      style={triggerStyle}
    >
      {children}
      {visible && (
        <span
          ref={tipRef}
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            maxWidth: '280px',
            padding: '8px 12px',
            fontSize: 'var(--font-size-xs)',
            lineHeight: 1.5,
            color: 'var(--text-secondary)',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 9999,
            pointerEvents: 'none',
            animation: 'tooltipFadeIn 150ms ease',
          }}
        >
          {text}
        </span>
      )}
    </span>
  );
}
