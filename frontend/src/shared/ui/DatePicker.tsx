import { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { Calendar } from './Calendar';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DatePickerProps {
  value?: string; // ISO String
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  required?: boolean;
  placeholder?: string;
  align?: 'left' | 'right';
  minDate?: Date;
}

export const DatePicker = ({ value, onChange, label, error, required, placeholder, align = 'left', minDate }: DatePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const date = value ? new Date(value) : null;
  const [selectedDate, setSelectedDate] = useState<Date | null>(date);
  
  const initialTime = date ? 
    { h: date.getHours(), m: date.getMinutes() } : 
    { h: 9, m: 0 };
    
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

  const handleSelectDate = (d: Date) => {
    const newDate = new Date(d.getFullYear(), d.getMonth(), d.getDate(), selectedHour, selectedMinute);
    setSelectedDate(newDate);
    onChange(newDate.toISOString());
  };

  const updateTime = (h: number, m: number) => {
    setSelectedHour(h);
    setSelectedMinute(m);
    if (selectedDate) {
      const newDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), h, m);
      setSelectedDate(newDate);
      onChange(newDate.toISOString());
    }
  };

  // Close on click outside
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
    if (!selectedDate) return placeholder || 'Selecionar data e hora';
    const timeStr = `${selectedHour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;
    return `${selectedDate.toLocaleDateString('pt-BR')} às ${timeStr}`;
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const isTimeDisabled = (h: number, m: number) => {
    if (!minDate || !selectedDate) return false;
    
    // Check if selected date is same day as minDate
    const isSameDay = selectedDate.getDate() === minDate.getDate() &&
                     selectedDate.getMonth() === minDate.getMonth() &&
                     selectedDate.getFullYear() === minDate.getFullYear();
    
    if (!isSameDay) return false;

    // Compare hours/minutes
    if (h < minDate.getHours()) return true;
    if (h === minDate.getHours() && m < minDate.getMinutes()) return true;
    
    return false;
  };

  return (
    <div className="flex flex-col gap-2 w-full relative" ref={containerRef}>
      {label && (
        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
          {label} {required && <span className="text-primary">*</span>}
        </label>
      )}
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-12 w-full items-center justify-between rounded-xl bg-surface-low border border-outline-variant/30 px-4 py-2 text-sm transition-all hover:border-primary/30 text-left cursor-pointer",
          isOpen && "ring-2 ring-primary/20 border-primary/40 bg-surface-container",
          error && "border-red-500/50 ring-red-500/10",
          !selectedDate && "text-muted-foreground/40"
        )}
      >
        <div className="flex items-center gap-3">
          <CalendarIcon className={cn("w-4 h-4", selectedDate ? "text-primary" : "text-muted-foreground/40")} />
          <span className="font-semibold">{formatDisplay()}</span>
        </div>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground/30 transition-transform duration-300", isOpen && "rotate-180")} />
      </button>

      {error && (
        <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider ml-1">
          {error}
        </span>
      )}

      {isOpen && (
        <div className={cn(
          "absolute top-full z-[100] mt-1.5 p-1 bg-[#141f38]/95 backdrop-blur-2xl border border-white/10 rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-top-2 duration-300 flex flex-col md:flex-row overflow-hidden",
          align === 'left' ? "left-0" : "right-0"
        )}>
          <div className="flex flex-col">
             <Calendar 
              selectedDate={selectedDate || undefined} 
              onSelect={handleSelectDate}
              minDate={minDate}
              className="border-none bg-transparent shadow-none w-[260px]" 
            />
          </div>
          
          <div className="w-full md:w-[130px] border-t md:border-t-0 md:border-l border-white/5 flex">
            {/* Hours */}
            <div className="flex-1 flex flex-col pt-4 px-1">
              <span className="text-[8px] font-black uppercase text-center mb-3 text-primary/40">H</span>
              <div className="flex-1 overflow-y-auto no-scrollbar max-h-[220px] space-y-0.5 px-1 py-1">
                {hours.map(h => {
                  const disabled = isTimeDisabled(h, selectedMinute);
                  return (
                    <button
                      key={h}
                      type="button"
                      disabled={disabled}
                      onClick={() => updateTime(h, selectedMinute)}
                      className={cn(
                        "w-full py-1.5 rounded-lg text-[11px] font-bold transition-all",
                        selectedHour === h 
                          ? "bg-primary text-primary-foreground shadow-[0_0_10px_rgba(190,157,255,0.3)]" 
                          : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                        disabled && "opacity-20 cursor-not-allowed hover:bg-transparent"
                      )}
                    >
                      {h.toString().padStart(2, '0')}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Minutes */}
            <div className="flex-1 flex flex-col pt-4 px-1 border-l border-white/5">
              <span className="text-[8px] font-black uppercase text-center mb-3 text-primary/40">M</span>
              <div className="flex-1 overflow-y-auto no-scrollbar max-h-[220px] space-y-0.5 px-1 py-1">
                {minutes.map(m => {
                  const disabled = isTimeDisabled(selectedHour, m);
                  return (
                    <button
                      key={m}
                      type="button"
                      disabled={disabled}
                      onClick={() => updateTime(selectedHour, m)}
                      className={cn(
                        "w-full py-1.5 rounded-lg text-[11px] font-bold transition-all",
                        selectedMinute === m 
                          ? "bg-primary text-primary-foreground shadow-[0_0_10px_rgba(190,157,255,0.3)]" 
                          : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                        disabled && "opacity-20 cursor-not-allowed hover:bg-transparent"
                      )}
                    >
                      {m.toString().padStart(2, '0')}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
