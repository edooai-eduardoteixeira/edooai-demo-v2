import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold rounded-md transition-all duration-200 ease-out leading-[1.4]',
  {
    variants: {
      variant: {
        primary: 'bg-black text-white disabled:bg-gray-300 disabled:opacity-60 disabled:cursor-not-allowed',
        brand: 'bg-brand text-white hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed',
        secondary: 'bg-white text-black border border-gray-300',
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
