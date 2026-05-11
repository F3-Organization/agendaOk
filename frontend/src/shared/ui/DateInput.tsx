import { useState, useRef, useEffect } from 'react';
import { CalendarDays, ChevronDown, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Calendar } from './Calendar';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDate } from '../utils/formatters';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DateInputProps {
  value?: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  placeholder?: string;
  align?: 'left' | 'right';
  clearable?: boolean;
}

export const DateInput = ({
  value,
  onChange,
  placeholder,
  align = 'left',
  clearable = true,
}: DateInputProps) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedDate = value ? new Date(`${value}T12:00:00`) : null;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    onChange(`${y}-${m}-${d}`);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex h-10 w-40 items-center justify-between rounded-xl bg-surface border border-outline-variant/20 px-3 text-sm transition-all hover:border-primary/40 cursor-pointer gap-2',
          isOpen && 'ring-2 ring-primary/20 border-primary/50',
          !selectedDate && 'text-muted-foreground/50',
        )}
      >
        <CalendarDays
          className={cn('w-3.5 h-3.5 shrink-0', selectedDate ? 'text-primary' : 'text-muted-foreground/40')}
        />
        <span className="flex-1 text-left truncate text-xs font-semibold">
          {selectedDate ? formatDate(selectedDate) : (placeholder || t('datePicker.selectDate'))}
        </span>
        {clearable && selectedDate ? (
          <X
            className="w-3.5 h-3.5 shrink-0 text-muted-foreground/40 hover:text-foreground transition-colors"
            onClick={handleClear}
          />
        ) : (
          <ChevronDown
            className={cn('w-3.5 h-3.5 shrink-0 text-muted-foreground/30 transition-transform duration-200', isOpen && 'rotate-180')}
          />
        )}
      </button>

      {isOpen && (
        <div
          className={cn(
            'absolute top-full z-[100] mt-2',
            'bg-surface border border-outline-variant/20',
            'rounded-2xl shadow-[0_20px_60px_-10px_rgba(0,0,0,0.18),0_4px_16px_-4px_rgba(0,0,0,0.08)]',
            'dark:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.5),0_4px_16px_-4px_rgba(0,0,0,0.3)]',
            align === 'left' ? 'left-0' : 'right-0',
          )}
        >
          <Calendar
            selectedDate={selectedDate || undefined}
            onSelect={handleSelect}
            className="w-[256px] p-4"
          />
        </div>
      )}
    </div>
  );
};
