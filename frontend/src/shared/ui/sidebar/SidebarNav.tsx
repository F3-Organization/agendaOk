import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { cn } from '../../utils/cn';
import { SidebarNavItem } from './SidebarNavItem';
import type { NavSection } from './sidebar.config';

interface SidebarNavProps {
  sections: NavSection[];
  isAdmin?: boolean;
  onNavigate?: () => void;
}

export const SidebarNav = ({ sections, isAdmin, onNavigate }: SidebarNavProps) => {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <nav className="space-y-5">
      {sections.map((section, sectionIdx) => (
        <div key={sectionIdx}>
          {/* Section header */}
          {section.labelKey && (
            <p className="px-4 mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50 select-none">
              {t(section.labelKey, section.labelFallback)}
            </p>
          )}

          <div className="space-y-1">
            {section.items.map((item) => (
              <SidebarNavItem
                key={item.href}
                item={item}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Admin link */}
      {isAdmin && (
        <div>
          <p className="px-4 mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50 select-none">
            Admin
          </p>
          <Link
            to="/admin"
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium group',
              location.pathname.startsWith('/admin')
                ? 'bg-red-500/10 text-red-500 shadow-sm'
                : 'text-muted-foreground hover:bg-surface-container hover:text-red-400'
            )}
          >
            <Shield
              className={cn(
                'w-5 h-5 transition-transform duration-300',
                location.pathname.startsWith('/admin') ? 'scale-110' : 'group-hover:scale-110'
              )}
            />
            Admin Panel
          </Link>
        </div>
      )}
    </nav>
  );
};
