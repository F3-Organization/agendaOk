import { useState, useRef, useEffect, type ReactNode } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  value?: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  error?: string;
  icon?: ReactNode;
  disabled?: boolean;
  className?: string;
  align?: 'left' | 'right';
}

const Select = ({
  value,
  onChange,
  options,
  placeholder,
  label,
  error,
  icon,
  disabled,
  className,
  align = 'left',
}: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optValue: string) => {
    onChange(optValue);
    setIsOpen(false);
  };

  return (
    <div className={cn('flex flex-col gap-2', className)} ref={containerRef}>
      {label && (
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
          {label}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'flex h-12 w-full items-center justify-between rounded-lg bg-surface border border-outline-variant/25 px-4 text-sm text-foreground transition-all shadow-card cursor-pointer',
            'hover:border-primary/40 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/8',
            isOpen && 'border-primary/50 ring-4 ring-primary/8',
            error && 'border-red-400/60 focus:border-red-400/60 focus:ring-red-500/5',
            disabled && 'cursor-not-allowed opacity-50',
            icon ? 'pl-9' : 'pl-4',
          )}
        >
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              {icon}
            </span>
          )}
          <span className={cn('flex-1 text-left truncate', !selected && 'text-muted-foreground/60')}>
            {selected ? selected.label : (placeholder ?? '')}
          </span>
          <ChevronDown
            className={cn(
              'w-4 h-4 text-muted-foreground/40 shrink-0 transition-transform duration-200 ml-2',
              isOpen && 'rotate-180',
            )}
          />
        </button>

        {isOpen && (
          <div
            className={cn(
              'absolute top-full z-[100] mt-1.5 w-full min-w-[160px]',
              'bg-surface border border-outline-variant/20 rounded-xl',
              'shadow-[0_8px_32px_-4px_rgba(0,0,0,0.12),0_2px_8px_-2px_rgba(0,0,0,0.06)]',
              'dark:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.4),0_2px_8px_-2px_rgba(0,0,0,0.2)]',
              'overflow-hidden py-1',
              align === 'right' && 'right-0 left-auto',
            )}
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                disabled={opt.disabled}
                onClick={() => handleSelect(opt.value)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors text-left',
                  opt.value === value
                    ? 'bg-primary/8 text-primary font-semibold'
                    : 'text-foreground hover:bg-surface-container',
                  opt.disabled && 'opacity-40 cursor-not-allowed',
                )}
              >
                <span>{opt.label}</span>
                {opt.value === value && <Check className="w-3.5 h-3.5 shrink-0" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <span className="text-xs text-red-400 font-medium ml-1">{error}</span>
      )}
    </div>
  );
};

Select.displayName = 'Select';

export { Select };
