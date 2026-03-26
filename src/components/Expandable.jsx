import React, { useState } from 'react';
import { cn } from '../lib/utils';

export default function Expandable({ title, children, className }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn('border border-gray-200 rounded-lg overflow-hidden', className)}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 text-sm font-semibold text-gray-800"
      >
        {title}
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className={cn(
            'transition-transform duration-200 ease-out',
            open && 'rotate-180'
          )}
        >
          <path
            d="M4 6l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <div
        className="overflow-hidden transition-[max-height] duration-400 ease-out"
        style={{ maxHeight: open ? '2000px' : '0' }}
      >
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
