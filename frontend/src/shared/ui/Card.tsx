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
      base: 'bg-white border border-outline-variant shadow-card',
      glass: 'bg-white border border-outline-variant shadow-card-md',
      accent: 'bg-white border border-primary/20 shadow-card-md',
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
