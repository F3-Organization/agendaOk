import { useEffect, type ReactNode } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ModalProps {
  onClose?: () => void;
  children: ReactNode;
  maxWidth?: string;
  className?: string;
}

export const Modal = ({ onClose, children, maxWidth = 'max-w-lg', className }: ModalProps) => {
  useEffect(() => {
    if (!onClose) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/75 backdrop-blur-md animate-in fade-in duration-200"
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={cn(
          'relative w-full bg-surface border border-outline-variant/25 rounded-2xl',
          'shadow-[0_24px_80px_-12px_rgba(0,0,0,0.22),0_8px_24px_-4px_rgba(0,0,0,0.1)]',
          'dark:shadow-[0_24px_80px_-12px_rgba(0,0,0,0.6),0_8px_24px_-4px_rgba(0,0,0,0.3)]',
          'animate-in fade-in zoom-in-95 duration-200',
          maxWidth,
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
};
