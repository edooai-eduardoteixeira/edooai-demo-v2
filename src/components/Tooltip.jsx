import React, { useState, useRef, useEffect } from 'react';

export default function Tooltip({ text, children }) {
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

  return (
    <span
      ref={triggerRef}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      style={{ position: 'relative', cursor: 'help' }}
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
            color: 'var(--color-white)',
            backgroundColor: 'var(--color-gray-800)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-md)',
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
