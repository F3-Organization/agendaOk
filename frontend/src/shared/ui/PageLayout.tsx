import { useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Menu, Zap } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { subscriptionService } from '../../features/subscription/subscription.service';
import { UsageBanner } from './UsageBanner';

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export const PageLayout = ({ children, title, subtitle }: PageLayoutProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: status } = useQuery({
    queryKey: ['subscription-status'],
    queryFn: subscriptionService.getStatus,
  });

  return (
    <div className="flex h-screen overflow-hidden overflow-x-hidden bg-surface-low text-foreground selection:bg-primary/15 selection:text-primary w-full">
      <Sidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 border-b border-outline-variant/25 bg-surface z-30 shadow-card">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-pulse-gradient flex items-center justify-center shadow-card">
                <Zap className="w-5 h-5 text-white fill-current" />
              </div>
              <span className="font-bold tracking-tight text-primary">ConfirmaZap</span>
          </div>
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="p-2 rounded-lg hover:bg-surface-high transition-colors"
          >
            <Menu className="w-6 h-6 text-muted-foreground" />
          </button>
        </header>

        {status && <UsageBanner plan={status.plan} count={status.messageCount} />}
        <main className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar relative">
          <header className="p-4 sm:p-10 pb-0 animate-in fade-in slide-in-from-bottom-3 duration-500">
            {title && (
              <div className="w-full">
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
                  {title}
                </h1>
                {subtitle && (
                  <p className="mt-4 text-lg text-muted-foreground font-medium max-w-2xl leading-relaxed">
                    {subtitle}
                  </p>
                )}
              </div>
            )}
          </header>

          <div className="p-4 sm:p-10 w-full animate-in fade-in duration-500 delay-100">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
