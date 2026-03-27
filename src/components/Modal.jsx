import React from 'react';
import { cn } from '../lib/utils';

/**
 * Modal — brand-consistent overlay dialog.
 *
 * Props:
 *   onClose    — called on backdrop click or X button
 *   wide       — if true, max-w-[680px] instead of max-w-[440px]
 *   children   — modal content
 *   className  — additional classes on the modal box
 */
export default function Modal({ onClose, wide = false, children, className }) {
  return (
    <div
      className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center animate-fade-in"
      onClick={onClose}
    >
      <div
        className={cn(
          'bg-surface rounded-xl pt-10 px-8 pb-6 w-[calc(100%-32px)] shadow-xl animate-modal-slide relative',
          wide ? 'max-w-[680px]' : 'max-w-[440px]',
          className
        )}
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-sm cursor-pointer text-foreground-faint transition-all duration-150 ease-out hover:bg-accent-subtle hover:text-foreground"
          onClick={onClose}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M11 3L3 11M3 3L11 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        {children}
      </div>
    </div>
  );
}

/**
 * Modal.Header — icon + title + subtitle row
 */
Modal.Header = function ModalHeader({ icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      {icon}
      <div>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {subtitle && <p className="text-xs text-foreground-faint mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
};

/**
 * Modal.Footer — confirm button + security notice
 */
Modal.Footer = function ModalFooter({ children, securityText = 'Your credentials are encrypted and never stored on our servers.' }) {
  return (
    <div className="mt-5">
      {children}
      <div className="flex items-center gap-2 text-[11px] text-foreground-faint pt-4 border-t border-border-light mt-4">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
          <path d="M8 1a4 4 0 00-4 4v3H3a1 1 0 00-1 1v5a1 1 0 001 1h10a1 1 0 001-1V9a1 1 0 00-1-1h-1V5a4 4 0 00-4-4zm-2 4a2 2 0 114 0v3H6V5z" fill="currentColor" />
        </svg>
        {securityText}
      </div>
    </div>
  );
};
