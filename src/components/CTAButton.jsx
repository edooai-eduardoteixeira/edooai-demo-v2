import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold rounded-md transition-all duration-200 ease-out leading-[1.4]',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-white hover:-translate-y-px hover:shadow-md disabled:bg-gray-300 disabled:opacity-60 disabled:cursor-not-allowed',
        brand: 'bg-brand text-white hover:-translate-y-px hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed',
        secondary: 'bg-surface text-foreground border border-border hover:bg-accent-subtle',
      },
    },
    defaultVariants: {
      variant: 'primary',
    },
  }
);

export default function CTAButton({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  className,
  style,
}) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={cn(buttonVariants({ variant }), className)}
      style={style}
    >
      {children}
    </button>
  );
}
