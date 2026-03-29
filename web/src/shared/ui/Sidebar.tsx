import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, 
  Calendar, 
  MessageCircle, 
  CreditCard, 
  Settings, 
  Globe, 
  LogOut, 
  Zap
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuthStore } from '../../features/auth/auth.store';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Sidebar = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const navigation = [
    { name: t('common.dashboard'), href: '/dashboard', icon: LayoutDashboard },
    { name: t('common.appointments'), href: '/appointments', icon: Calendar },
    { name: t('common.whatsapp'), href: '/whatsapp', icon: MessageCircle },
    { name: t('common.subscription'), href: '/subscription', icon: CreditCard },
    { name: t('common.settings'), href: '/settings', icon: Settings },
  ];

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'pt' ? 'en' : 'pt';
    i18n.changeLanguage(nextLang);
  };

  return (
    <aside className="w-80 h-screen bg-surface-dim border-r border-outline-variant flex flex-col sticky top-0">
      <div className="p-8">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 rounded-xl bg-pulse-gradient flex items-center justify-center shadow-lg shadow-primary-dim/20">
            <Zap className="w-6 h-6 text-primary-foreground fill-current" />
          </div>
          <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-pulse-gradient">ConfirmaZap</h1>
        </div>

        <nav className="space-y-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium group",
                  isActive 
                    ? "bg-primary/10 text-primary shadow-sm" 
                    : "text-muted-foreground hover:bg-surface-high hover:text-foreground"
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5 transition-transform duration-300",
                  isActive ? "scale-110" : "group-hover:scale-110"
                )} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-8 space-y-6">
        <div className="p-4 rounded-2xl bg-surface-high/50 border border-outline-variant/30 group hover:border-primary/20 transition-all">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-surface-low border border-outline-variant/50 flex items-center justify-center font-bold text-primary group-hover:scale-110 transition-transform">
              {user?.name?.[0] || 'U'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold truncate">{user?.name || 'User'}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{user?.role || 'Free Plan'}</span>
            </div>
            <button 
              onClick={() => logout()}
              className="ml-auto p-2 rounded-lg hover:bg-surface-low text-muted-foreground hover:text-red-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        <button 
          onClick={toggleLanguage}
          className="flex items-center gap-3 px-4 py-2 w-full rounded-lg text-xs font-bold uppercase tracking-widest text-muted-foreground hover:bg-surface-high hover:text-primary transition-all"
        >
          <Globe className="w-4 h-4" />
          {i18n.language === 'pt' ? 'English' : 'Português'}
        </button>

        <button className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm font-medium text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-all group">
          <LogOut className="w-4 h-4" />
          {t('common.signOut')}
        </button>
      </div>
    </aside>
  );
};
