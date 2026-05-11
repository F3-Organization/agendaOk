import { useState, useRef, useEffect } from 'react';
import { CalendarDays, Clock, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Calendar } from './Calendar';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDateTime } from '../utils/formatters';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DatePickerProps {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  required?: boolean;
  placeholder?: string;
  align?: 'left' | 'right';
  minDate?: Date;
}

export const DatePicker = ({
  value,
  onChange,
  label,
  error,
  required,
  placeholder,
  align = 'left',
  minDate,
}: DatePickerProps) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hourListRef = useRef<HTMLDivElement>(null);
  const minuteListRef = useRef<HTMLDivElement>(null);

  const date = value ? new Date(value) : null;
  const [selectedDate, setSelectedDate] = useState<Date | null>(date);
  const initialTime = date ? { h: date.getHours(), m: date.getMinutes() } : { h: 9, m: 0 };
  const [selectedHour, setSelectedHour] = useState(initialTime.h);
  const [selectedMinute, setSelectedMinute] = useState(initialTime.m);

  useEffect(() => {
    if (value) {
      const d = new Date(value);
      setSelectedDate(d);
      setSelectedHour(d.getHours());
      setSelectedMinute(d.getMinutes());
    }
  }, [value]);

  // Scroll selected time into center when picker opens
  useEffect(() => {
    if (!isOpen) return;
    const scrollToCenter = (ref: React.RefObject<HTMLDivElement | null>, index: number) => {
      if (!ref.current) return;
      const itemH = 34;
      ref.current.scrollTop = Math.max(0, index * itemH - ref.current.clientHeight / 2 + itemH / 2);
    };
    const raf = requestAnimationFrame(() => {
      scrollToCenter(hourListRef, selectedHour);
      scrollToCenter(minuteListRef, selectedMinute);
    });
    return () => cancelAnimationFrame(raf);
  }, [isOpen, selectedHour, selectedMinute]);

  const handleSelectDate = (d: Date) => {
    const newDate = new Date(d.getFullYear(), d.getMonth(), d.getDate(), selectedHour, selectedMinute);
    setSelectedDate(newDate);
    onChange(newDate.toISOString());
  };

  const updateTime = (h: number, m: number) => {
    setSelectedHour(h);
    setSelectedMinute(m);
    if (selectedDate) {
      const newDate = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        h,
        m,
      );
      setSelectedDate(newDate);
      onChange(newDate.toISOString());
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDisplay = () => {
    if (!selectedDate) return placeholder || t('datePicker.placeholder', 'Selecionar data e hora');
    return formatDateTime(selectedDate);
  };

  const isTimeDisabled = (h: number, m: number) => {
    if (!minDate || !selectedDate) return false;
    const isSameDay =
      selectedDate.getDate() === minDate.getDate() &&
      selectedDate.getMonth() === minDate.getMonth() &&
      selectedDate.getFullYear() === minDate.getFullYear();
    if (!isSameDay) return false;
    if (h < minDate.getHours()) return true;
    if (h === minDate.getHours() && m < minDate.getMinutes()) return true;
    return false;
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  return (
    <div className="flex flex-col gap-2 w-full relative" ref={containerRef}>
      {label && (
        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
          {label} {required && <span className="text-primary">*</span>}
        </label>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex h-12 w-full items-center justify-between rounded-xl bg-surface-low border border-outline-variant/30 px-4 text-sm transition-all hover:border-primary/40 text-left cursor-pointer',
          isOpen && 'ring-2 ring-primary/20 border-primary/50 bg-surface-container',
          error && 'border-destructive/50 ring-destructive/10',
          !selectedDate && 'text-muted-foreground/40',
        )}
      >
        <div className="flex items-center gap-3">
          <CalendarDays
            className={cn('w-4 h-4 shrink-0', selectedDate ? 'text-primary' : 'text-muted-foreground/35')}
          />
          <span className={cn('font-semibold truncate', selectedDate ? 'text-foreground' : 'text-muted-foreground/40')}>
            {formatDisplay()}
          </span>
        </div>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-muted-foreground/30 shrink-0 transition-transform duration-200',
            isOpen && 'rotate-180',
          )}
        />
      </button>

      {error && (
        <span className="text-[10px] text-destructive font-bold uppercase tracking-wider ml-1">
          {error}
        </span>
      )}

      {/* Popup */}
      {isOpen && (
        <div
          className={cn(
            'absolute top-full z-[100] mt-2',
            'bg-surface border border-outline-variant/20',
            'rounded-2xl shadow-[0_20px_60px_-10px_rgba(0,0,0,0.18),0_4px_16px_-4px_rgba(0,0,0,0.08)]',
            'dark:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.5),0_4px_16px_-4px_rgba(0,0,0,0.3)]',
            'overflow-hidden flex flex-col md:flex-row',
            align === 'left' ? 'left-0' : 'right-0',
          )}
        >
          {/* Calendar */}
          <div className="p-3 pt-4">
            <Calendar
              selectedDate={selectedDate || undefined}
              onSelect={handleSelectDate}
              minDate={minDate}
              className="w-[256px]"
            />
          </div>

          {/* Time picker */}
          <div className="flex flex-col border-t md:border-t-0 md:border-l border-outline-variant/15 w-full md:w-[128px]">
            {/* Header with live time display */}
            <div className="px-4 py-3 border-b border-outline-variant/10 bg-surface-dim/40">
              <div className="flex items-center gap-1.5 mb-1">
                <Clock className="w-3 h-3 text-primary/50" />
                <span className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/40">
                  {t('datePicker.time', 'Horário')}
                </span>
              </div>
              <p className="text-xl font-bold text-foreground tabular-nums leading-none">
                {String(selectedHour).padStart(2, '0')}
                <span className="text-muted-foreground/30 mx-0.5">:</span>
                {String(selectedMinute).padStart(2, '0')}
              </p>
            </div>

            {/* H / M columns */}
            <div className="flex flex-1">
              {/* Hours */}
              <div className="flex-1 flex flex-col">
                <span className="text-[8px] font-bold uppercase tracking-wider text-center text-muted-foreground/30 pt-2 pb-1.5">
                  H
                </span>
                <div
                  ref={hourListRef}
                  className="overflow-y-auto no-scrollbar flex-1 max-h-[176px] px-1.5 pb-2 space-y-px"
                >
                  {hours.map((h) => {
                    const disabled = isTimeDisabled(h, selectedMinute);
                    return (
                      <button
                        key={h}
                        type="button"
                        disabled={disabled}
                        onClick={() => updateTime(h, selectedMinute)}
                        className={cn(
                          'w-full h-[34px] rounded-lg text-xs font-semibold transition-all duration-100',
                          selectedHour === h
                            ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                            : 'text-muted-foreground hover:bg-surface-container hover:text-foreground',
                          disabled && 'opacity-20 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground',
                        )}
                      >
                        {String(h).padStart(2, '0')}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="w-px bg-outline-variant/10 my-2" />

              {/* Minutes */}
              <div className="flex-1 flex flex-col">
                <span className="text-[8px] font-bold uppercase tracking-wider text-center text-muted-foreground/30 pt-2 pb-1.5">
                  M
                </span>
                <div
                  ref={minuteListRef}
                  className="overflow-y-auto no-scrollbar flex-1 max-h-[176px] px-1.5 pb-2 space-y-px"
                >
                  {minutes.map((m) => {
                    const disabled = isTimeDisabled(selectedHour, m);
                    return (
                      <button
                        key={m}
                        type="button"
                        disabled={disabled}
                        onClick={() => updateTime(selectedHour, m)}
                        className={cn(
                          'w-full h-[34px] rounded-lg text-xs font-semibold transition-all duration-100',
                          selectedMinute === m
                            ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                            : 'text-muted-foreground hover:bg-surface-container hover:text-foreground',
                          disabled && 'opacity-20 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground',
                        )}
                      >
                        {String(m).padStart(2, '0')}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
