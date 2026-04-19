import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  Building2
} from 'lucide-react';
import { PageLayout } from '../shared/ui/PageLayout';
import { Card } from '../shared/ui/Card';
import { Button } from '../shared/ui/Button';
import { Input } from '../shared/ui/Input';
import { apiClient } from '../shared/api/api-client';
import { useAuthStore } from '../features/auth/auth.store';

export const CompanySettingsPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const selectedCompany = useAuthStore((state) => state.selectedCompany);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
      showSuccess(t('company.settings.messages.saveSuccess', 'Configurações salvas com sucesso!'));
    },
    onError: (error: any) => {
      showError(error.response?.data?.error || t('company.settings.messages.saveError', 'Erro ao salvar configurações'));
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
      title={t('company.settings.title', 'Configurações da Empresa')}
      subtitle={selectedCompany?.name ?? t('company.settings.subtitle', 'Gerencie as configurações da sua empresa')}
    >
      <div className="max-w-4xl mx-auto space-y-24 pb-40 relative">
        <div className="absolute top-0 -right-20 w-80 h-80 bg-primary/10 rounded-full blur-[100px] -z-10 pointer-events-none" />
        <div className="absolute bottom-40 -left-20 w-80 h-80 bg-primary-dim/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

        <form onSubmit={handleSubmit} className="space-y-24">
          {/* WhatsApp Section */}
          <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="space-y-2 px-1">
              <div className="flex items-center gap-3 text-primary">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                  <Phone className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-black tracking-tight">{t('company.settings.whatsapp.title', 'WhatsApp')}</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl opacity-70">
                {t('company.settings.whatsapp.description', 'Configure o número de WhatsApp e as janelas de silêncio para esta empresa.')}
              </p>
            </div>

            <Card variant="glass" className="p-8 space-y-8 border-white/5">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.3em] ml-1">
                  {t('company.settings.whatsapp.numberLabel', 'Número do WhatsApp')}
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
                    <h3 className="font-black text-lg tracking-tight">{t('settings.automation.syncTitle', 'Sincronização Ativa')}</h3>
                    <p className="text-xs text-muted-foreground/60 mt-0.5 font-medium">{t('settings.automation.syncDesc', 'Habilite ou desabilite a automação total com o Google Calendar')}</p>
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
                  {t('settings.automation.silentWindow', 'Janela de Silêncio')}
                </div>

                <div className="flex flex-col lg:flex-row gap-12 items-center">
                  <div className="flex-1 space-y-4">
                    <p className="text-xs text-muted-foreground/50 leading-relaxed italic border-l-4 border-primary/20 pl-6 py-2">
                      {t('settings.automation.silentWindowDesc', 'Defina o horário em que o sistema NÃO enviará mensagens automáticas pelo WhatsApp para seus clientes.')}
                    </p>
                  </div>

                  <div className="flex-1 flex items-center gap-6 p-6 rounded-xl bg-black/30 border border-white/5 shadow-inner">
                    <div className="flex-1 space-y-3">
                      <label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 flex items-center gap-2 ml-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                        {t('settings.automation.start', 'Início')}
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
                        {t('settings.automation.end', 'Término')}
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
                <h2 className="text-2xl font-black tracking-tight">{t('company.settings.billing.title', 'Cobrança')}</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl opacity-70">
                {t('company.settings.billing.description', 'Dados fiscais e informações do plano desta empresa.')}
              </p>
            </div>

            <Card variant="glass" className="p-8 space-y-8 border-white/5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.3em] ml-1">
                    {t('settings.profile.taxId', 'CPF / CNPJ')}
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
                    {t('company.settings.billing.planLabel', 'Plano Atual')}
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
                    {t('settings.messages.savePreferences', 'Salvar Preferências')}
                  </>
                )}
              </Button>
            </div>
          </section>
        </form>

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
                  {t('company.settings.islandTitle', 'Configurações da Empresa')}
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
