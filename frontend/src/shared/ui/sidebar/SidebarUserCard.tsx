import { LogOut } from 'lucide-react';
import { useAuthStore } from '../../../features/auth/auth.store';

export const SidebarUserCard = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  return (
    <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/25 group hover:border-primary/20 transition-all">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-surface-high border border-outline-variant/25 flex items-center justify-center font-bold text-primary group-hover:scale-110 transition-transform">
          {user?.name?.[0] || 'U'}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-bold truncate">{user?.name || 'User'}</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {user?.role || 'Free Plan'}
          </span>
        </div>
        <button
          onClick={() => logout()}
          className="ml-auto p-2 rounded-lg hover:bg-surface-low text-muted-foreground hover:text-red-400 transition-colors"
          title="Sair"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
