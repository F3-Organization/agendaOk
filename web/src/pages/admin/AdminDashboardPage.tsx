import { useQuery } from '@tanstack/react-query';
import { Users, Building2, Briefcase, CalendarDays, TrendingUp, DollarSign, Loader2 } from 'lucide-react';
import { AdminLayout } from '../../shared/ui/AdminLayout';
import { Card } from '../../shared/ui/Card';
import { adminService } from '../../features/admin/admin.service';

const KPICard = ({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string | number; sub?: string; color: string }) => (
  <Card variant="glass" className="p-6 hover:scale-[1.02] transition-transform">
    <div className="flex items-start justify-between mb-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      {sub && <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-surface-high px-2 py-1 rounded-md">{sub}</span>}
    </div>
    <p className="text-3xl font-extrabold tracking-tight text-foreground">{value}</p>
    <p className="text-xs text-muted-foreground font-medium mt-1">{label}</p>
  </Card>
);

export const AdminDashboardPage = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminService.getStats,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  const planCounts: Record<string, number> = {};
  stats?.subscriptionsByPlan?.forEach(s => {
    planCounts[`${s.plan}_${s.status}`] = parseInt(s.count);
  });

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground font-medium mt-1">Visão geral da plataforma ConfirmaZap</p>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            icon={Users}
            label="Total de Usuários"
            value={stats?.totalUsers ?? 0}
            color="bg-blue-500/10 border-blue-500/20 text-blue-500"
          />
          <KPICard
            icon={Building2}
            label="Total de Empresas"
            value={stats?.totalCompanies ?? 0}
            color="bg-purple-500/10 border-purple-500/20 text-purple-500"
          />
          <KPICard
            icon={Briefcase}
            label="Profissionais"
            value={stats?.totalProfessionals ?? 0}
            color="bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
          />
          <KPICard
            icon={CalendarDays}
            label="Agendamentos"
            value={stats?.totalAppointments ?? 0}
            color="bg-amber-500/10 border-amber-500/20 text-amber-500"
          />
        </div>

        {/* Revenue & Subscriptions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card variant="glass" className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Receita Estimada (MRR)</h3>
                <p className="text-xs text-muted-foreground">Baseado em assinaturas ativas PRO</p>
              </div>
            </div>
            <p className="text-4xl font-extrabold tracking-tight text-green-500">
              R$ {(stats?.estimatedMRR ?? 0).toFixed(2).replace('.', ',')}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {stats?.activeProSubscriptions ?? 0} assinaturas PRO ativas
            </p>
          </Card>

          <Card variant="glass" className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Crescimento (30 dias)</h3>
                <p className="text-xs text-muted-foreground">Novos registros por dia</p>
              </div>
            </div>
            <div className="flex items-end gap-1 h-24">
              {(stats?.recentUsers ?? []).map((day, i) => {
                const count = parseInt(day.count);
                const maxCount = Math.max(...(stats?.recentUsers ?? []).map(d => parseInt(d.count)), 1);
                const height = Math.max((count / maxCount) * 100, 4);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 group">
                    <span className="text-[9px] font-mono text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      {count}
                    </span>
                    <div
                      className="w-full bg-primary/30 hover:bg-primary/60 rounded-t transition-all duration-200 min-w-[4px]"
                      style={{ height: `${height}%` }}
                      title={`${day.date}: ${count} registros`}
                    />
                  </div>
                );
              })}
            </div>
            {(stats?.recentUsers?.length ?? 0) === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8">Nenhum dado nos últimos 30 dias</p>
            )}
          </Card>
        </div>

        {/* Subscriptions Breakdown */}
        <Card variant="glass" className="p-6">
          <h3 className="font-bold text-sm mb-4">Assinaturas por Plano</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {stats?.subscriptionsByPlan?.map((item, i) => (
              <div key={i} className="p-4 rounded-xl bg-surface-high/50 border border-outline-variant/20">
                <span className={`inline-block text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mb-2 ${
                  item.plan === 'PRO' ? 'bg-primary/20 text-primary' : 'bg-surface-high text-muted-foreground'
                }`}>
                  {item.plan}
                </span>
                <p className="text-2xl font-extrabold">{item.count}</p>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{item.status}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
};
