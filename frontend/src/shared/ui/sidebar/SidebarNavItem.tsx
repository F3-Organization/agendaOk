import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/cn';
import type { NavItem } from './sidebar.config';

interface SidebarNavItemProps {
  item: NavItem;
  onNavigate?: () => void;
}

export const SidebarNavItem = ({ item, onNavigate }: SidebarNavItemProps) => {
  const { t } = useTranslation();
  const location = useLocation();
  const isActive = location.pathname === item.href;
  const Icon = item.icon;

  return (
    <Link
      to={item.href}
      onClick={onNavigate}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium group',
        isActive
          ? 'bg-primary/8 text-primary shadow-card'
          : 'text-muted-foreground hover:bg-surface-container hover:text-foreground'
      )}
    >
      <Icon
        className={cn(
          'w-5 h-5 transition-transform duration-300',
          isActive ? 'scale-110' : 'group-hover:scale-110'
        )}
      />
      {t(item.labelKey, item.labelFallback)}
    </Link>
  );
};
