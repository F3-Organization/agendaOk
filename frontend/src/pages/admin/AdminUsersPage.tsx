import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Users, Search, Loader2, Eye, UserCog, Crown, Mail, Globe, Shield, ChevronLeft, ChevronRight, Building2 } from 'lucide-react';
import { AdminLayout } from '../../shared/ui/AdminLayout';
import { Card } from '../../shared/ui/Card';
import { Button } from '../../shared/ui/Button';
import { adminService, type AdminUser } from '../../features/admin/admin.service';
import { useAuthStore } from '../../features/auth/auth.store';
import { useNavigate } from 'react-router-dom';

export const AdminUsersPage = () => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'pt' ? 'pt-BR' : 'en-US';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [editPlan, setEditPlan] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, page],
    queryFn: () => adminService.listUsers({ search, page, limit: 15 }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: { plan?: string; role?: string } }) =>
      adminService.updateUser(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setSelectedUser(null);
    },
  });

  const impersonateMutation = useMutation({
    mutationFn: (id: string) => adminService.impersonateUser(id),
    onSuccess: (data) => {
      setAuth({ ...data.user, config: null }, data.token);
      navigate('/select-company');
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{t('admin.users.title')}</h1>
            <p className="text-sm text-muted-foreground font-medium mt-1">
              {t('admin.users.registered', { count: data?.pagination.total ?? 0 })}
            </p>
          </div>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('admin.users.searchPlaceholder')}
              className="w-full pl-11 pr-4 py-3 bg-surface-low border border-outline-variant/30 rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          <Button type="submit" className="px-6">{t('admin.users.search')}</Button>
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
                    <th className="text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-6 py-4">{t('admin.users.user')}</th>
                    <th className="text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-4 py-4">{t('admin.users.plan')}</th>
                    <th className="text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-4 py-4">{t('admin.users.companies')}</th>
                    <th className="text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-4 py-4">{t('admin.users.auth')}</th>
                    <th className="text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-4 py-4">{t('admin.users.registration')}</th>
                    <th className="text-right text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-6 py-4">{t('admin.users.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.users.map((user) => (
                    <tr key={user.id} className="border-b border-outline-variant/10 hover:bg-surface-high/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-foreground">{user.name}</p>
                              {user.role === 'ADMIN' && <Shield className="w-3.5 h-3.5 text-red-500" />}
                            </div>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                          user.subscription?.plan === 'PRO'
                            ? 'bg-primary/20 text-primary'
                            : 'bg-surface-high text-muted-foreground'
                        }`}>
                          {user.subscription?.plan ?? 'FREE'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm font-semibold text-foreground">{user.companiesCount}</span>
                      </td>
                      <td className="px-4 py-4">
                        {user.authMethod === 'google' ? (
                          <Globe className="w-4 h-4 text-blue-500" title="Google" />
                        ) : (
                          <Mail className="w-4 h-4 text-muted-foreground" title="Email" />
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString(locale)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setSelectedUser(user); setEditPlan(user.subscription?.plan ?? 'FREE'); }}
                            className="p-2 rounded-lg hover:bg-surface-high text-muted-foreground hover:text-primary transition-colors"
                            title={t('admin.users.details')}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => impersonateMutation.mutate(user.id)}
                            disabled={impersonateMutation.isPending}
                            className="p-2 rounded-lg hover:bg-surface-high text-muted-foreground hover:text-amber-500 transition-colors"
                            title={t('admin.users.impersonate')}
                          >
                            <UserCog className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data && data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-outline-variant/30">
                <p className="text-xs text-muted-foreground">
                  {t('admin.users.page', { page: data.pagination.page, totalPages: data.pagination.totalPages })}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                    className="gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" /> {t('admin.users.previous')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={page >= data.pagination.totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="gap-1"
                  >
                    {t('admin.users.next')} <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* User Detail Modal */}
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSelectedUser(null)} />
            <div className="relative w-full max-w-md bg-surface-high border border-outline-variant/20 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-outline-variant/30">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                    {selectedUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">{selectedUser.name}</h2>
                    <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('admin.users.role')}</label>
                    <p className="text-sm font-semibold mt-1">{selectedUser.role}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('admin.users.auth')}</label>
                    <p className="text-sm font-semibold mt-1 capitalize">{selectedUser.authMethod}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">2FA</label>
                    <p className="text-sm font-semibold mt-1">{selectedUser.twoFactorEnabled ? t('admin.users.twoFactorActive') : t('admin.users.twoFactorInactive')}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('admin.users.companies')}</label>
                    <p className="text-sm font-semibold mt-1">{selectedUser.companiesCount}</p>
                  </div>
                </div>

                {selectedUser.companies.length > 0 && (
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('admin.users.companies')}</label>
                    <div className="mt-2 space-y-1">
                      {selectedUser.companies.map(c => (
                        <div key={c.id} className="flex items-center gap-2 text-sm text-foreground bg-surface-low/50 px-3 py-2 rounded-lg">
                          <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                          {c.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Change Plan */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('admin.users.changePlan')}</label>
                  <div className="flex gap-2 mt-2">
                    {['FREE', 'PRO'].map(plan => (
                      <button
                        key={plan}
                        onClick={() => setEditPlan(plan)}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${
                          editPlan === plan
                            ? 'bg-primary/10 border-primary/30 text-primary'
                            : 'bg-surface-low border-outline-variant/20 text-muted-foreground hover:border-primary/20'
                        }`}
                      >
                        {plan === 'PRO' && <Crown className="w-3 h-3 inline mr-1" />}
                        {plan}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-outline-variant/30 flex justify-end gap-3 bg-surface-low/50">
                <Button variant="ghost" onClick={() => setSelectedUser(null)}>{t('admin.users.cancel')}</Button>
                <Button
                  onClick={() => updateMutation.mutate({ id: selectedUser.id, updates: { plan: editPlan } })}
                  disabled={updateMutation.isPending || editPlan === (selectedUser.subscription?.plan ?? 'FREE')}
                  className="min-w-[100px]"
                >
                  {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('admin.users.save')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
