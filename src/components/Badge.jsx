import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center px-3 py-1 text-[11px] font-semibold rounded-full whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'bg-gray-100 text-gray-700',
        required: 'bg-gray-900 text-white',
        optional: 'bg-gray-100 text-gray-600',
        success: 'bg-gray-900 text-white',
        quickwin: 'bg-gray-50 text-gray-800 border border-gray-800',
        lookalike: 'bg-gray-50 text-gray-800 border border-gray-800',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export default function Badge({ children, variant = 'default', className }) {
  return (
    <span className={cn(badgeVariants({ variant }), className)}>
      {children}
    </span>
  );
}
