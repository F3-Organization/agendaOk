import { useTranslation } from 'react-i18next';
import { Globe, Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../theme.store';
import { SidebarUserCard } from './SidebarUserCard';

export const SidebarFooter = () => {
  const { i18n } = useTranslation();
  const { theme, toggleTheme } = useThemeStore();

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'pt' ? 'en' : 'pt';
    i18n.changeLanguage(nextLang);
  };

  return (
    <div className="mt-auto p-8 space-y-3">
      <SidebarUserCard />

      <div className="flex gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-widest text-muted-foreground hover:bg-surface-container hover:text-primary transition-all flex-1"
          title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Language toggle */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-widest text-muted-foreground hover:bg-surface-container hover:text-primary transition-all flex-1"
        >
          <Globe className="w-4 h-4" />
          {i18n.language === 'pt' ? 'EN' : 'PT'}
        </button>
      </div>
    </div>
  );
};
