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
    <div className="flex h-screen overflow-hidden overflow-x-hidden bg-background text-foreground selection:bg-primary/20 selection:text-primary w-full">
      <Sidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 border-b border-outline-variant bg-surface-dim/50 backdrop-blur-md z-30">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-pulse-gradient flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-foreground fill-current" />
              </div>
              <span className="font-bold tracking-tight text-transparent bg-clip-text bg-pulse-gradient">ConfirmaZap</span>
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
          <header className="p-4 sm:p-10 pb-0">
            {title && (
              <div className="w-full">
                <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl lg:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/70">
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

          <div className="p-4 sm:p-10 w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
