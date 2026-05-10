import { HTMLAttributes, forwardRef } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'base' | 'glass' | 'accent';
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'base', ...props }, ref) => {
    const variants = {
      base: 'bg-surface-low border border-outline-variant',
      glass: 'glass-card',
      accent: 'bg-surface-container border border-primary/20 shadow-lg shadow-primary/5',
    };

    return (
      <div
        ref={ref}
        className={cn('rounded-xl transition-all', variants[variant], className)}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';

export { Card };
