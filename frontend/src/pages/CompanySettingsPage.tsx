import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Phone,
  FileText,
  Bell,
  BellOff,
  Clock,
  RefreshCw,
  CreditCard,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Building2,
  Trash2,
  Pencil
} from 'lucide-react';
import { PageLayout } from '../shared/ui/PageLayout';
import { Card } from '../shared/ui/Card';
import { Button } from '../shared/ui/Button';
import { Input } from '../shared/ui/Input';
import { apiClient } from '../shared/api/api-client';
import { companyService } from '../features/company/company.service';
import { useAuthStore } from '../features/auth/auth.store';

export const CompanySettingsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const selectedCompany = useAuthStore((state) => state.selectedCompany);
  const companies = useAuthStore((state) => state.companies);
  const setCompanies = useAuthStore((state) => state.setCompanies);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [companyName, setCompanyName] = useState(selectedCompany?.name ?? '');

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 5000);
  };

  const { data: companyConfig, isLoading } = useQuery({
    queryKey: ['company-config', selectedCompany?.id],
    queryFn: async () => {
      const response = await apiClient.get('/user/config');
      return response.data;
    },
    enabled: !!selectedCompany,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiClient.patch('/user/config', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-config', selectedCompany?.id] });
      showSuccess(t('company.settings.messages.saveSuccess'));
    },
    onError: (error: any) => {
      showError(error.response?.data?.error || t('company.settings.messages.saveError'));
    },
  });

  const renameMutation = useMutation({
    mutationFn: async (name: string) => {
      await companyService.update(selectedCompany!.id, name);
    },
    onSuccess: () => {
      // Update local store
      const updated = companies.map(c => c.id === selectedCompany!.id ? { ...c, name: companyName } : c);
      setCompanies(updated);
      useAuthStore.setState({ selectedCompany: { ...selectedCompany!, name: companyName } });
      setIsEditingName(false);
      showSuccess(t('company.settings.messages.renameSuccess'));
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || t('company.settings.messages.renameError'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await companyService.delete(selectedCompany!.id);
    },
    onSuccess: () => {
      const remaining = companies.filter(c => c.id !== selectedCompany!.id);
      setCompanies(remaining);
      useAuthStore.setState({ selectedCompany: null });
      navigate(remaining.length > 0 ? '/select-company' : '/create-company');
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || t('company.settings.messages.deleteError'));
      setShowDeleteConfirm(false);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const rawData = Object.fromEntries(formData.entries());

    const data: any = {
      syncEnabled: formData.get('syncEnabled') === 'on',
    };

    if (rawData.whatsappNumber) data.whatsappNumber = rawData.whatsappNumber as string;
    if (rawData.taxId) data.taxId = rawData.taxId as string;
    if (rawData.silentWindowStart) data.silentWindowStart = rawData.silentWindowStart as string;
    if (rawData.silentWindowEnd) data.silentWindowEnd = rawData.silentWindowEnd as string;

    updateMutation.mutate(data);
  };

  return (
    <PageLayout
      title={t('company.settings.title')}
      subtitle={selectedCompany?.name ?? t('company.settings.subtitle')}
    >
      <div className="max-w-4xl mx-auto space-y-24 pb-40 relative">
        <div className="absolute top-0 -right-20 w-80 h-80 bg-primary/10 rounded-full blur-[100px] -z-10 pointer-events-none" />
        <div className="absolute bottom-40 -left-20 w-80 h-80 bg-primary-dim/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

        {/* Company Identity Section */}
        <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="space-y-2 px-1">
            <div className="flex items-center gap-3 text-primary">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                <Building2 className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-black tracking-tight">{t('company.settings.identity.title')}</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl opacity-70">
              {t('company.settings.identity.description')}
            </p>
          </div>

          <Card variant="glass" className="p-8 space-y-6 border-white/5">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.3em] ml-1">
                {t('company.settings.identity.nameLabel')}
              </label>
              {isEditingName ? (
                <div className="flex gap-3">
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="h-12 bg-black/40 border-white/5 focus:bg-black/60 focus:border-primary/30 transition-all rounded-lg font-medium flex-1"
                  />
                  <Button
                    onClick={() => renameMutation.mutate(companyName)}
                    disabled={renameMutation.isPending || !companyName.trim()}
                    className="h-12 px-6 bg-primary text-primary-dim rounded-lg"
                  >
                    {renameMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => { setIsEditingName(false); setCompanyName(selectedCompany?.name ?? ''); }}
                    className="h-12 px-4 rounded-lg"
                  >
                    {t('common.cancel')}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between h-12 px-4 rounded-lg bg-black/40 border border-white/5">
                  <span className="font-bold text-foreground">{selectedCompany?.name}</span>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="text-muted-foreground/40 hover:text-primary transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </Card>
        </section>

        <form onSubmit={handleSubmit} className="space-y-24">
          {/* WhatsApp Section */}
          <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="space-y-2 px-1">
              <div className="flex items-center gap-3 text-primary">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                  <Phone className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-black tracking-tight">{t('company.settings.whatsapp.title')}</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl opacity-70">
                {t('company.settings.whatsapp.description')}
              </p>
            </div>

            <Card variant="glass" className="p-8 space-y-8 border-white/5">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.3em] ml-1">
                  {t('company.settings.whatsapp.numberLabel')}
                </label>
                <div className="relative group/input">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within/input:text-primary transition-colors" />
                  <Input
                    name="whatsappNumber"
                    defaultValue={companyConfig?.whatsappNumber}
                    className="pl-12 h-12 bg-black/40 border-white/5 focus:bg-black/60 focus:border-primary/30 transition-all rounded-lg font-medium"
                    placeholder="11999999999"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-6 rounded-xl bg-black/30 border border-white/5 shadow-inner group/sync">
                <div className="flex gap-6">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover/sync:rotate-180 transition-transform duration-1000 shadow-xl">
                    <RefreshCw className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg tracking-tight">{t('settings.automation.syncTitle')}</h3>
                    <p className="text-xs text-muted-foreground/60 mt-0.5 font-medium">{t('settings.automation.syncDesc')}</p>
                  </div>
                </div>
                <div className="flex items-center scale-110 pr-2">
                  <input
                    type="checkbox"
                    name="syncEnabled"
                    defaultChecked={companyConfig?.syncEnabled}
                    className="w-12 h-6 rounded-full bg-white/5 appearance-none cursor-pointer relative checked:bg-primary transition-all border border-white/10 after:content-[''] after:absolute after:top-1 after:left-1 after:w-4 after:h-4 after:rounded-full after:bg-white after:transition-all checked:after:translate-x-6 shadow-inner"
                  />
                </div>
              </div>

              {/* Silent Window */}
              <div className="space-y-8">
                <div className="flex items-center gap-3 px-1 font-black tracking-[0.4em] text-muted-foreground/40 text-[9px] uppercase">
                  <BellOff className="w-4 h-4" />
                  {t('settings.automation.silentWindow')}
                </div>

                <div className="flex flex-col lg:flex-row gap-12 items-center">
                  <div className="flex-1 space-y-4">
                    <p className="text-xs text-muted-foreground/50 leading-relaxed italic border-l-4 border-primary/20 pl-6 py-2">
                      {t('settings.automation.silentWindowDesc')}
                    </p>
                  </div>

                  <div className="flex-1 flex items-center gap-6 p-6 rounded-xl bg-black/30 border border-white/5 shadow-inner">
                    <div className="flex-1 space-y-3">
                      <label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 flex items-center gap-2 ml-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                        {t('settings.automation.start')}
                      </label>
                      <div className="relative group/input">
                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 group-focus-within/input:text-primary transition-colors" />
                        <Input
                          name="silentWindowStart"
                          type="time"
                          defaultValue={companyConfig?.silentWindowStart}
                          className="pl-12 bg-black/30 border-white/5 focus:bg-black/60 focus:border-primary/30 transition-all font-black text-lg h-12 rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-center pt-8 opacity-20">
                      <ArrowRight className="w-5 h-5 text-primary" />
                    </div>

                    <div className="flex-1 space-y-3">
                      <label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 flex items-center gap-2 ml-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                        {t('settings.automation.end')}
                      </label>
                      <div className="relative group/input">
                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 group-focus-within/input:text-primary transition-colors" />
                        <Input
                          name="silentWindowEnd"
                          type="time"
                          defaultValue={companyConfig?.silentWindowEnd}
                          className="pl-12 bg-black/30 border-white/5 focus:bg-black/60 focus:border-primary/30 transition-all font-black text-lg h-12 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </section>

          {/* Billing Section */}
          <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
            <div className="space-y-2 px-1">
              <div className="flex items-center gap-3 text-primary">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-black tracking-tight">{t('company.settings.billing.title')}</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl opacity-70">
                {t('company.settings.billing.description')}
              </p>
            </div>

            <Card variant="glass" className="p-8 space-y-8 border-white/5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.3em] ml-1">
                    {t('settings.profile.taxId')}
                  </label>
                  <div className="relative group/input">
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within/input:text-primary transition-colors" />
                    <Input
                      name="taxId"
                      defaultValue={companyConfig?.taxId}
                      className="pl-12 h-12 bg-black/40 border-white/5 focus:bg-black/60 focus:border-primary/30 transition-all rounded-lg font-medium"
                      placeholder="000.000.000-00"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.3em] ml-1">
                    {t('company.settings.billing.planLabel')}
                  </label>
                  <div className="flex items-center h-12 px-4 rounded-lg bg-black/40 border border-white/5">
                    <Building2 className="w-4 h-4 text-muted-foreground/40 mr-3" />
                    <span className={`text-sm font-black uppercase tracking-widest ${
                      selectedCompany?.subscription?.plan === 'PRO' ? 'text-primary' : 'text-muted-foreground'
                    }`}>
                      {selectedCompany?.subscription?.plan ?? 'FREE'}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="h-14 px-12 group gap-4 shadow-2xl shadow-primary/20 text-xs font-black tracking-[0.3em] uppercase transition-all hover:scale-[1.03] active:scale-95 bg-primary text-primary-dim rounded-xl"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <Save className="w-6 h-6 fill-current" />
                    {t('settings.messages.savePreferences')}
                  </>
                )}
              </Button>
            </div>
          </section>
        </form>

        {/* Danger Zone */}
        <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <div className="space-y-2 px-1">
            <div className="flex items-center gap-3 text-red-400">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center border border-red-500/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-black tracking-tight">{t('company.settings.danger.title')}</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl opacity-70">
              {t('company.settings.danger.description')}
            </p>
          </div>

          <Card variant="glass" className="p-8 border-red-500/10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-foreground">{t('company.settings.danger.deleteTitle')}</h3>
                <p className="text-sm text-muted-foreground/60 mt-1">
                  {t('company.settings.danger.deleteDescription')}
                </p>
              </div>
              {!showDeleteConfirm ? (
                <Button
                  variant="ghost"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="h-10 px-6 border border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs font-bold tracking-widest uppercase rounded-lg"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('company.settings.danger.deleteButton')}
                </Button>
              ) : (
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="h-10 px-4 text-xs font-bold uppercase rounded-lg"
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    onClick={() => deleteMutation.mutate()}
                    disabled={deleteMutation.isPending}
                    className="h-10 px-6 bg-red-500 hover:bg-red-600 text-white text-xs font-bold tracking-widest uppercase rounded-lg"
                  >
                    {deleteMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      t('company.settings.danger.confirmDelete')
                    )}
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </section>

        {/* Global Notifications Island */}
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-8 px-12 py-7 glass-island z-[50] animate-in fade-in slide-in-from-bottom-20 duration-1000 ring-2 ring-white/5 group shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
          {successMessage ? (
            <div className="flex items-center gap-4 text-emerald-400">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 drop-shadow-[0_0_12px_rgba(16,185,129,1)]" />
              </div>
              <span className="text-lg font-black tracking-tighter uppercase italic">{successMessage}</span>
            </div>
          ) : errorMessage ? (
            <div className="flex items-center gap-4 text-red-400">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 drop-shadow-[0_0_12px_rgba(239,68,68,1)]" />
              </div>
              <span className="text-lg font-black tracking-tighter uppercase italic">{errorMessage}</span>
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 rounded-[1.25rem] bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500 shadow-xl">
                <Bell className="w-6 h-6 opacity-80" />
              </div>
              <div className="flex flex-col">
                <p className="text-xs text-foreground font-black uppercase tracking-[0.4em] opacity-80 italic">
                  {t('company.settings.islandTitle')}
                </p>
                <p className="text-[10px] text-muted-foreground/40 font-black uppercase tracking-[0.25em] mt-1 font-mono">
                  {selectedCompany?.name ?? ''}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};
