import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2, Search, Loader2, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { AdminLayout } from '../../shared/ui/AdminLayout';
import { Card } from '../../shared/ui/Card';
import { Button } from '../../shared/ui/Button';
import { adminService } from '../../features/admin/admin.service';

export const AdminCompaniesPage = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-companies', search, page],
    queryFn: () => adminService.listCompanies({ search, page, limit: 15 }),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Empresas</h1>
          <p className="text-sm text-muted-foreground font-medium mt-1">
            {data?.pagination.total ?? 0} empresas cadastradas
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome da empresa, dono ou email..."
              className="w-full pl-11 pr-4 py-3 bg-surface-low border border-outline-variant/30 rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          <Button type="submit" className="px-6">Buscar</Button>
        </form>

        {/* Table */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <Card variant="glass" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-outline-variant/30">
                    <th className="text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-6 py-4">Empresa</th>
                    <th className="text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-4 py-4">Proprietário</th>
                    <th className="text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-4 py-4">Plano</th>
                    <th className="text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-4 py-4">Profissionais</th>
                    <th className="text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-4 py-4">Criada em</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.companies.map((company) => (
                    <tr key={company.id} className="border-b border-outline-variant/10 hover:bg-surface-high/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground">{company.name}</p>
                            <p className="text-[11px] text-muted-foreground font-mono">/{company.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-semibold text-foreground">{company.owner.name}</p>
                        <p className="text-xs text-muted-foreground">{company.owner.email}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                          company.subscription?.plan === 'PRO'
                            ? 'bg-primary/20 text-primary'
                            : 'bg-surface-high text-muted-foreground'
                        }`}>
                          {company.subscription?.plan ?? 'FREE'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-sm font-semibold text-foreground">{company.professionalsCount}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs text-muted-foreground">
                          {new Date(company.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data && data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-outline-variant/30">
                <p className="text-xs text-muted-foreground">
                  Página {data.pagination.page} de {data.pagination.totalPages}
                </p>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="gap-1">
                    <ChevronLeft className="w-4 h-4" /> Anterior
                  </Button>
                  <Button variant="ghost" size="sm" disabled={page >= data.pagination.totalPages} onClick={() => setPage(p => p + 1)} className="gap-1">
                    Próxima <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};
