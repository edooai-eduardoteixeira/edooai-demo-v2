import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../lib/utils';

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

  return (
    <span
      ref={triggerRef}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      className={cn(
        'relative cursor-help',
        underline && visible && 'underline decoration-dashed decoration-foreground-faint underline-offset-[3px] decoration-1'
      )}
    >
      {children}
      {visible && (
        <span
          ref={tipRef}
          className="fixed max-w-[280px] px-3 py-2 text-xs leading-normal text-foreground-muted bg-surface border border-border rounded-sm shadow-lg z-[9999] pointer-events-none animate-tooltip-fade-in"
          style={{ top: pos.top, left: pos.left }}
        >
          {text}
        </span>
      )}
    </span>
  );
}
