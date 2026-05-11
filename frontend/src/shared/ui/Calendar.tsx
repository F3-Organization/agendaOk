import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getMonthName, getWeekdayHeaders } from '../utils/formatters';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CalendarProps {
  selectedDate?: Date;
  onSelect: (date: Date) => void;
  className?: string;
  minDate?: Date;
}

export const Calendar = ({ selectedDate, onSelect, className, minDate }: CalendarProps) => {
  const [viewDate, setViewDate] = useState(selectedDate || new Date());

  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const prevMonthDays = new Date(viewDate.getFullYear(), viewDate.getMonth(), 0).getDate();

  const monthName = getMonthName(viewDate);
  const year = viewDate.getFullYear();
  const weekdayHeaders = getWeekdayHeaders();

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const days = [];

  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    days.push({
      day: prevMonthDays - i,
      month: 'prev',
      date: new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, prevMonthDays - i),
    });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      day: i,
      month: 'current',
      date: new Date(viewDate.getFullYear(), viewDate.getMonth(), i),
    });
  }

  const remainingCells = 42 - days.length;
  for (let i = 1; i <= remainingCells; i++) {
    days.push({
      day: i,
      month: 'next',
      date: new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, i),
    });
  }

  const isSelected = (date: Date) =>
    selectedDate &&
    date.getDate() === selectedDate.getDate() &&
    date.getMonth() === selectedDate.getMonth() &&
    date.getFullYear() === selectedDate.getFullYear();

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isPast = (date: Date) => {
    if (!minDate) return false;
    const compare = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
    const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return target < compare;
  };

  return (
    <div className={cn('p-3 select-none', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-0.5">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground/40 leading-none mb-0.5">
            {year}
          </p>
          <h3 className="text-sm font-bold capitalize text-foreground leading-none">
            {monthName}
          </h3>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-container transition-all duration-150 active:scale-90"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-container transition-all duration-150 active:scale-90"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {weekdayHeaders.map((d, i) => (
          <div
            key={`${d}-${i}`}
            className="text-[10px] font-semibold text-muted-foreground/35 text-center py-1"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {days.map((item, i) => {
          const past = isPast(item.date);
          const selected = isSelected(item.date);
          const today = isToday(item.date);
          const otherMonth = item.month !== 'current';

          return (
            <div key={i} className="flex items-center justify-center">
              <button
                type="button"
                disabled={past || otherMonth}
                onClick={() => !otherMonth && onSelect(item.date)}
                className={cn(
                  'relative w-8 h-8 flex flex-col items-center justify-center rounded-lg text-xs transition-all duration-150',
                  // Base state
                  otherMonth
                    ? 'text-muted-foreground/20 pointer-events-none'
                    : 'text-foreground font-medium',
                  // Selected
                  selected && 'bg-primary text-primary-foreground font-bold shadow-sm scale-105',
                  // Today (not selected)
                  today && !selected && 'text-primary font-bold',
                  // Hover (current month, not selected, not past)
                  !selected && !past && !otherMonth && 'hover:bg-surface-container hover:scale-105 active:scale-95 cursor-pointer',
                  // Past
                  past && 'opacity-25 cursor-not-allowed pointer-events-none',
                )}
              >
                {item.day}
                {today && !selected && (
                  <span className="absolute bottom-[3px] left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
