import type { InputHTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, label, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2 w-full">
        {label && (
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'flex h-12 w-full rounded-lg bg-surface-low border border-outline-variant px-4 py-2 text-sm transition-all placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/5 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500/50 focus:border-red-500/40 focus:ring-red-500/5',
            className
          )}
          onClick={(e) => {
            const target = e.currentTarget;
            if (['date', 'datetime-local', 'time', 'month', 'week'].includes(target.type)) {
              try {
                target.showPicker();
              } catch (err) {
                // Fallback for browsers that don't support showPicker() yet
              }
            }
            props.onClick?.(e);
          }}
          {...props}
        />
        {error && (
          <span className="text-xs text-red-400 font-medium ml-1">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
