import { forwardRef, type SelectHTMLAttributes, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  label?: string;
  icon?: ReactNode;
  wrapperClassName?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, wrapperClassName, error, label, icon, children, ...props }, ref) => {
    return (
      <div className={cn('flex flex-col gap-2', wrapperClassName)}>
        {label && (
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
            {label}
          </label>
        )}
        <div className={cn('relative', className)}>
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              {icon}
            </span>
          )}
          <select
            ref={ref}
            className={cn(
              'w-full h-12 rounded-lg bg-surface border border-outline-variant/25 py-2 text-sm text-foreground transition-all focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/8 disabled:cursor-not-allowed disabled:opacity-50 shadow-card appearance-none cursor-pointer',
              icon ? 'pl-9 pr-10' : 'px-4 pr-10',
              error && 'border-red-400/60 focus:border-red-400/60 focus:ring-red-500/5',
            )}
            {...props}
          >
            {children}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 pointer-events-none" />
        </div>
        {error && (
          <span className="text-xs text-red-400 font-medium ml-1">
            {error}
          </span>
        )}
      </div>
    );
  },
);

Select.displayName = 'Select';

export { Select };
