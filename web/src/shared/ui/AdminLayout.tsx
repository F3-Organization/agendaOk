import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Building2, ArrowLeft, Shield } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/admin/users', icon: Users, label: 'Usuários' },
  { path: '/admin/companies', icon: Building2, label: 'Empresas' },
];

export const AdminLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-outline-variant/30 bg-surface-dim/30 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-outline-variant/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-tight text-foreground">Admin Panel</h1>
              <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest">Super Admin</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = item.path === '/admin' 
              ? location.pathname === '/admin'
              : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-surface-high/50'
                }`}
              >
                <item.icon className={`w-4.5 h-4.5 ${isActive ? 'text-primary' : ''}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Back to panel */}
        <div className="p-4 border-t border-outline-variant/30">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-surface-high/50 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Painel
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
};
