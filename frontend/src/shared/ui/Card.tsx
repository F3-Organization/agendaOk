import { forwardRef, type HTMLAttributes } from 'react';
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
      base: 'bg-surface border border-outline-variant/25 shadow-card',
      glass: 'bg-surface border border-outline-variant/25 shadow-card-md',
      accent: 'bg-surface border border-primary/20 shadow-card-md',
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
