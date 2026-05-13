import { Zap, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuthStore } from '../../../features/auth/auth.store';
import { CompanySwitcher } from '../CompanySwitcher';
import { SidebarNav } from './SidebarNav';
import { SidebarFooter } from './SidebarFooter';
import { ownerNavSections, professionalNavSections } from './sidebar.config';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const user = useAuthStore((state) => state.user);
  const isProfessional = user?.role === 'PROFESSIONAL';
  const isAdmin = user?.role === 'ADMIN';

  const sections = isProfessional ? professionalNavSections : ownerNavSections;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-300"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'w-72 h-screen bg-surface border-r border-outline-variant/25 flex flex-col fixed inset-y-0 left-0 z-50 transition-transform duration-300 transform lg:translate-x-0 lg:sticky lg:top-0 shadow-card',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="p-8 flex-1 overflow-y-auto no-scrollbar">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pulse-gradient flex items-center justify-center shadow-card-md">
                <Zap className="w-6 h-6 text-white fill-current" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-primary">ConfirmaZap</h1>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="lg:hidden p-2 rounded-lg hover:bg-surface-container text-muted-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Company switcher */}
          <div className="mb-8">
            <CompanySwitcher />
          </div>

          {/* Navigation */}
          <SidebarNav
            sections={sections}
            isAdmin={isAdmin}
            onNavigate={onClose}
          />
        </div>

        {/* Footer: user card + toggles */}
        <SidebarFooter />
      </aside>
    </>
  );
};
