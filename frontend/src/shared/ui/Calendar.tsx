import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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
  
  const monthName = viewDate.toLocaleString('pt-BR', { month: 'long' });
  const year = viewDate.getFullYear();

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
      date: new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, prevMonthDays - i)
    });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      day: i,
      month: 'current',
      date: new Date(viewDate.getFullYear(), viewDate.getMonth(), i)
    });
  }

  const remainingCells = 42 - days.length;
  for (let i = 1; i <= remainingCells; i++) {
    days.push({
      day: i,
      month: 'next',
      date: new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, i)
    });
  }

  const isSelected = (date: Date) => {
    return selectedDate && 
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const isPast = (date: Date) => {
    if (!minDate) return false;
    const compare = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
    const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return target < compare;
  };

  return (
    <div className={cn("p-4 bg-transparent select-none", className)}>
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary/70">
          {monthName} <span className="text-muted-foreground/30 font-normal">{year}</span>
        </h3>
        <div className="flex gap-2">
          <button 
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground/60 transition-all border border-transparent hover:border-white/10 active:scale-95"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button 
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground/60 transition-all border border-transparent hover:border-white/10 active:scale-95"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
          <div key={`${d}-${i}`} className="text-[9px] font-black uppercase text-muted-foreground/40 text-center py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((item, i) => {
          const past = isPast(item.date);
          return (
            <button
              key={i}
              type="button"
              disabled={past}
              onClick={() => onSelect(item.date)}
              className={cn(
                "relative h-8 w-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all duration-300",
                item.month === 'current' ? "text-foreground" : "text-muted-foreground/10",
                isSelected(item.date) 
                  ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(190,157,255,0.4)] scale-110 z-10" 
                  : "hover:bg-white/5 hover:scale-105 active:scale-95",
                isToday(item.date) && !isSelected(item.date) && "text-primary border border-primary/20 bg-primary/5",
                past && "opacity-20 cursor-not-allowed hover:bg-transparent hover:scale-100"
              )}
            >
              {item.day}
            </button>
          );
        })}
      </div>
    </div>
  );
};
