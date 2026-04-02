import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  User,
  Mail,
  Phone,
  FileText,
  Bell,
  BellOff,
  Clock,
  RefreshCw,
  Shield,
  ShieldCheck,
  Lock,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  X,
  QrCode,
  Copy,
  ArrowRight
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { PageLayout } from '../shared/ui/PageLayout';
import { Card } from '../shared/ui/Card';
import { Button } from '../shared/ui/Button';
import { Input } from '../shared/ui/Input';
import { apiClient } from '../shared/api/api-client';

export const SettingsPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [setupData, setSetupData] = useState<{ otpauthUrl: string; secret: string } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 5000);
  };

  const { data: userConfig, isLoading } = useQuery({
    queryKey: ['user-config'],
    queryFn: async () => {
      const response = await apiClient.get('/user/config');
      return response.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiClient.patch('/user/config', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-config'] });
      showSuccess("Configurações salvas com sucesso!");
    },
    onError: (error: any) => {
      showError(error.response?.data?.error || "Erro ao salvar configurações");
    }
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiClient.post('/user/change-password', data);
    },
    onSuccess: () => {
      showSuccess("Senha alterada com sucesso!");
      // Reset password fields if needed, but since it's a separate card, we might just handle it via state
    },
    onError: (error: any) => {
      showError(error.response?.data?.error || "Erro ao alterar senha");
    }
  });

  const toggle2FAMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const response = await apiClient.post('/user/toggle-2fa', { enabled });
      return response.data;
    },
    onSuccess: (data, enabled) => {
      queryClient.invalidateQueries({ queryKey: ['user-config'] });
      if (enabled && data.otpauthUrl) {
        setSetupData(data);
        setIsSetupModalOpen(true);
      } else {
        showSuccess(enabled ? "2FA habilitado com sucesso!" : "2FA desabilitado.");
      }
    },
    onError: (error: any) => {
      showError(error.response?.data?.error || "Erro ao configurar 2FA");
    }
  });

  const verify2FAMutation = useMutation({
    mutationFn: async (token: string) => {
      await apiClient.post('/user/verify-2fa', { token });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-config'] });
      setIsSetupModalOpen(false);
      setSetupData(null);
      setVerificationCode('');
      showSuccess("2FA verificado e ativado com sucesso!");
    },
    onError: (error: any) => {
      showError(error.response?.data?.error || "Código inválido. Tente novamente.");
    }
  });

  const setPasswordMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiClient.post('/user/set-password', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-config'] });
      showSuccess("Senha definida com sucesso!");
    },
    onError: (error: any) => {
      showError(error.response?.data?.error || "Erro ao definir senha");
    }
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
      syncEnabled: formData.get('syncEnabled') === 'on'
    };

    if (rawData.name) data.name = rawData.name as string;
    if (rawData.email) data.email = rawData.email as string;
    if (rawData.whatsappNumber) data.whatsappNumber = rawData.whatsappNumber as string;
    if (rawData.taxId) data.taxId = rawData.taxId as string;
    if (rawData.silentWindowStart) data.silentWindowStart = rawData.silentWindowStart as string;
    if (rawData.silentWindowEnd) data.silentWindowEnd = rawData.silentWindowEnd as string;

    updateMutation.mutate(data);
  };

  const handlePasswordChange = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (newPassword !== confirmPassword) {
      showError("As senhas não coincidem");
      return;
    }

    if (userConfig?.hasPassword) {
      if (!currentPassword) {
        showError("Senha atual é obrigatória");
        return;
      }
      changePasswordMutation.mutate({ currentPassword, newPassword, confirmPassword });
    } else {
      setPasswordMutation.mutate({ newPassword, confirmPassword });
    }
    
    e.currentTarget.reset();
  };

  return (
    <PageLayout
      title={t('settings.title', 'Configurações')}
      subtitle={t('settings.subtitle', 'Gerencie seus dados de perfil e preferências do sistema')}
    >
      <div className="max-w-4xl mx-auto space-y-24 pb-40 relative">
        {/* Decorative Background Accents */}
        <div className="absolute top-0 -right-20 w-80 h-80 bg-primary/10 rounded-full blur-[100px] -z-10 pointer-events-none" />
        <div className="absolute bottom-40 -left-20 w-80 h-80 bg-primary-dim/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

        <form onSubmit={handleSubmit} className="space-y-24">
          {/* Profile Section */}
          <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="space-y-2 px-1">
              <div className="flex items-center gap-3 text-primary">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                  <User className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-black tracking-tight">{t('settings.profile.title', 'Perfil Profissional')}</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl opacity-70">
                {t('settings.profile.description')}
              </p>
            </div>

            <Card variant="glass" className="p-8 space-y-8 border-white/5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.3em] ml-1">{t('settings.profile.fullName', 'Nome Completo')}</label>
                  <div className="relative group/input">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within/input:text-primary transition-colors" />
                    <Input
                      name="name"
                      defaultValue={userConfig?.name}
                      className="pl-12 h-12 bg-black/40 border-white/5 focus:bg-black/60 focus:border-primary/30 transition-all rounded-lg font-medium"
                      placeholder={t('settings.profile.placeholders.fullName', 'Seu nome completo')}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.3em] ml-1">{t('settings.profile.email', 'E-mail')}</label>
                  <div className="relative group/input">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within/input:text-primary transition-colors" />
                    <Input
                      name="email"
                      type="email"
                      defaultValue={userConfig?.email}
                      className="pl-12 h-12 bg-black/40 border-white/5 focus:bg-black/60 focus:border-primary/30 transition-all rounded-lg font-medium"
                      placeholder={t('settings.profile.placeholders.email', 'exemplo@email.com')}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.3em] ml-1">{t('settings.profile.taxId', 'CPF / CNPJ')}</label>
                  <div className="relative group/input">
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within/input:text-primary transition-colors" />
                    <Input
                      name="taxId"
                      defaultValue={userConfig?.taxId}
                      className="pl-12 h-12 bg-black/40 border-white/5 focus:bg-black/60 focus:border-primary/30 transition-all rounded-lg font-medium"
                      placeholder={t('settings.profile.placeholders.taxId', '000.000.000-00')}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.3em] ml-1">{t('settings.profile.whatsapp', 'WhatsApp de Contato')}</label>
                  <div className="relative group/input">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within/input:text-primary transition-colors" />
                    <Input
                      name="whatsappNumber"
                      defaultValue={userConfig?.whatsappNumber}
                      className="pl-12 h-12 bg-black/40 border-white/5 focus:bg-black/60 focus:border-primary/30 transition-all rounded-lg font-medium"
                      placeholder={t('settings.profile.placeholders.whatsapp', '11999999999')}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground/40 px-2 italic font-medium">
                    {t('settings.profile.whatsappHint', 'Para alertas administrativos e notificações de sistema.')}
                  </p>
                </div>
              </div>
            </Card>
          </section>

          {/* Automation Section */}
          <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
            <div className="space-y-2 px-1">
              <div className="flex items-center gap-3 text-primary">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                  <Bell className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-black tracking-tight">{t('settings.automation.title', 'Automação & Silêncio')}</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl opacity-70">
                {t('settings.automation.description')}
              </p>
            </div>

            <Card variant="glass" className="p-8 space-y-10 border-white/5">
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
                    defaultChecked={userConfig?.syncEnabled}
                    className="w-12 h-6 rounded-full bg-white/5 appearance-none cursor-pointer relative checked:bg-primary transition-all border border-white/10 after:content-[''] after:absolute after:top-1 after:left-1 after:w-4 after:h-4 after:rounded-full after:bg-white after:transition-all checked:after:translate-x-6 shadow-inner"
                  />
                </div>
              </div>

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
                          defaultValue={userConfig?.silentWindowStart}
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
                          defaultValue={userConfig?.silentWindowEnd}
                          className="pl-12 bg-black/30 border-white/5 focus:bg-black/60 focus:border-primary/30 transition-all font-black text-lg h-12 rounded-lg"
                        />
                      </div>
                    </div>
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
                {updateMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Save className="w-6 h-6 fill-current" /> {t('settings.messages.savePreferences', 'Salvar Preferências')}</>}
              </Button>
            </div>
          </section>
        </form>

        <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent w-full" />

        {/* Security Section */}
        <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 pb-20">
          <div className="space-y-2 px-1">
            <div className="flex items-center gap-3 text-primary">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-black tracking-tight">{t('settings.security.title', 'Segurança & Privacidade')}</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl opacity-70">
              {t('settings.security.description')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-10 gap-10">
            {/* Password Section */}
            <div className="md:col-span-4">
              <Card variant="glass" className="p-8 h-full border-white/5 flex flex-col justify-between hover:border-orange-500/20 transition-all duration-700 group/pwd">
                <div className="space-y-8">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 group-hover/pwd:scale-110 transition-transform shadow-xl ring-1 ring-orange-500/20">
                      <KeyRound className="w-7 h-7" />
                    </div>
                    <h3 className="font-black text-lg tracking-tight">{userConfig?.hasPassword ? t('settings.security.changePassword', 'Alterar Senha') : t('settings.security.setPassword', 'Definir Senha')}</h3>
                  </div>

                  <form onSubmit={handlePasswordChange} className="space-y-6">
                    {userConfig?.hasPassword && (
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 pl-2">{t('settings.security.currentPassword', 'Senha Atual')}</label>
                        <div className="relative group/input">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 group-focus-within/input:text-orange-400 transition-colors" />
                          <Input
                            name="currentPassword"
                            type="password"
                            className="pl-12 h-12 bg-black/40 border-white/5 focus:bg-orange-500/5 focus:border-orange-500/30 transition-all rounded-lg"
                            placeholder={t('settings.security.passwordPlaceholder', '••••••••')}
                            required={userConfig?.hasPassword}
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 pl-2">{t('settings.security.newPassword', 'Nova Senha')}</label>
                      <div className="relative group/input">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 group-focus-within/input:text-orange-400 transition-colors" />
                        <Input
                          name="newPassword"
                          type="password"
                          className="pl-12 h-12 bg-black/40 border-white/5 focus:bg-orange-500/5 focus:border-orange-500/30 transition-all rounded-lg"
                          placeholder={t('settings.security.newPasswordHint', 'Mínimo 6 caracteres')}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 pl-2">{t('settings.security.confirmPassword', 'Confirmar Nova Senha')}</label>
                      <div className="relative group/input">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 group-focus-within/input:text-orange-400 transition-colors" />
                        <Input
                          name="confirmPassword"
                          type="password"
                          className="pl-12 h-12 bg-black/40 border-white/5 focus:bg-orange-500/5 focus:border-orange-500/30 transition-all rounded-lg"
                          placeholder={t('settings.security.passwordPlaceholder', '••••••••')}
                          required
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      variant="ghost"
                      className="w-full mt-6 border border-white/10 hover:bg-orange-500/10 hover:text-orange-400 transition-all font-black uppercase text-[10px] tracking-[0.3em] h-12 shadow-inner rounded-xl"
                    >
                      {changePasswordMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : userConfig?.hasPassword ? t('settings.security.updatePassword', 'Atualizar Senha') : t('settings.security.setPassword', 'Definir Senha')}
                    </Button>
                  </form>
                </div>
              </Card>
            </div>

            {/* 2FA Section */}
            <div className="md:col-span-6">
              <Card variant="accent" className="p-10 h-full relative overflow-hidden group/2fa shadow-3xl border-primary/20 rounded-2xl">
                <div className="absolute top-0 right-0 w-80 h-80 bg-primary/20 rounded-full blur-[100px] -z-0 translate-x-1/3 -translate-y-1/3 opacity-30 group-hover/2fa:opacity-60 transition-opacity duration-1000" />
                
                <div className="relative z-10 flex flex-col h-full justify-between gap-12">
                  <div className="space-y-10">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-xl bg-primary-dim flex items-center justify-center text-primary-foreground shadow-2xl ring-1 ring-white/30 transform group-hover/2fa:rotate-6 transition-transform">
                        <ShieldCheck className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="font-black text-xl tracking-tight leading-tight">{t('settings.security.twoFactor', 'Autenticação em Duas Etapas')}</h3>
                        <div className="flex items-center gap-3 mt-2.5">
                          <div className={`w-2.5 h-2.5 rounded-full shadow-[0_0_12px] animate-pulse ${userConfig?.twoFactorEnabled ? 'bg-emerald-400 shadow-emerald-400/60' : 'bg-red-400 shadow-red-400/60'}`} />
                          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground/40 font-mono">
                            {userConfig?.twoFactorEnabled ? t('settings.security.twoFactorActive', 'Ativo') : t('settings.security.twoFactorInactive', 'Desativado')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-foreground/70 leading-relaxed max-w-xl italic border-l-4 border-primary/40 pl-8">
                      {t('settings.security.twoFactorDesc', 'Adicione uma camada extra de segurança à sua conta. Ao ativar, você precisará de um código do seu aplicativo autenticador para fazer login.')}
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="p-6 rounded-xl bg-black/50 border border-white/5 flex items-center justify-between shadow-inner group/status">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.3em]">{t('settings.security.twoFactorStatus', 'Status da Segurança')}</span>
                        <p className="text-sm font-bold tracking-tight text-foreground/80">{userConfig?.twoFactorEnabled ? 'Proteção TOTP Ativa' : 'Segurança Vulnerável'}</p>
                      </div>
                      <button
                        onClick={() => toggle2FAMutation.mutate(!userConfig?.twoFactorEnabled)}
                        className={`w-14 h-7 rounded-full transition-all relative p-1 shadow-inner ${userConfig?.twoFactorEnabled ? 'bg-emerald-500/80' : 'bg-white/5 border border-white/10'}`}
                        disabled={toggle2FAMutation.isPending}
                      >
                        <div className={`w-5 h-5 rounded-full bg-white shadow-2xl transition-all duration-500 transform ${userConfig?.twoFactorEnabled ? 'translate-x-7' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    {userConfig?.twoFactorEnabled && (
                      <Button 
                        variant="ghost" 
                        className="w-full text-xs uppercase tracking-[0.4em] font-black h-14 border-primary/20 text-primary hover:bg-primary/20 hover:scale-[1.02] transition-all bg-primary/10 rounded-xl ring-1 ring-primary/20"
                        onClick={() => toggle2FAMutation.mutate(true)}
                      >
                        {t('settings.security.setupScanner', 'Configurar Autenticador')}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Setup 2FA Modal */}
        {isSetupModalOpen && setupData && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/40 backdrop-blur-xl animate-in fade-in duration-700">
            <Card variant="glass" className="w-full max-w-lg p-10 relative shadow-[0_0_150px_rgba(0,0,0,0.9)] border-primary/30 animate-in zoom-in-95 duration-500 rounded-3xl max-h-[85vh] overflow-y-auto">
              <button 
                onClick={() => setIsSetupModalOpen(false)}
                className="absolute top-10 right-10 p-4 rounded-2xl hover:bg-white/10 text-muted-foreground/40 hover:text-foreground transition-all active:scale-90"
              >
                <X className="w-8 h-8" />
              </button>

              <div className="text-center space-y-12">
                <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto ring-1 ring-primary/30 shadow-3xl pulse-glow">
                  <QrCode className="w-12 h-12" />
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-3xl font-black tracking-tighter italic uppercase underline decoration-primary/40 underline-offset-12">CONFIGURAR TOKEN</h3>
                  <p className="text-xs text-muted-foreground/60 leading-relaxed px-10 font-medium italic">
                    Escaneie o código com o seu app de autenticação favorito (Google, Authy ou Microsoft).
                  </p>
                </div>

                <div className="bg-white p-8 rounded-2xl inline-block shadow-[0_30px_80px_rgba(255,255,255,0.1)] mx-auto relative group scale-105 border-primary/10 border-4">
                  <div className="absolute inset-0 bg-primary/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <QRCodeSVG value={setupData.otpauthUrl} size={220} level="H" />
                </div>

                <div className="space-y-8">
                  <div className="p-4 rounded-xl bg-black/60 border border-white/5 flex items-center justify-between gap-6 shadow-inner group/secret">
                    <div className="flex flex-col items-start gap-1.5 overflow-hidden">
                      <span className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground/30">KEY MANUAL</span>
                      <code className="text-sm font-mono text-primary font-black tracking-[0.25em] truncate w-full">
                        {setupData.secret}
                      </code>
                    </div>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(setupData.secret);
                        showSuccess("Código copiado!");
                      }}
                      className="p-4 rounded-xl bg-primary/20 text-primary-dim hover:text-primary transition-all active:scale-75 shadow-lg shrink-0"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-5">
                    <label className="text-[11px] font-black uppercase tracking-[0.5em] text-muted-foreground/40 block text-center">
                      CÓDIGO DE 6 DÍGITOS
                    </label>
                    <Input 
                      placeholder="000 000"
                      className="text-center text-4xl tracking-[0.6em] font-black h-20 bg-black/60 border-white/10 rounded-xl focus:border-primary/50 placeholder:opacity-20"
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>

                  <Button 
                    className="w-full h-16 text-sm font-black uppercase tracking-[0.4em] gap-5 shadow-3xl shadow-primary/40 bg-primary text-primary-dim rounded-xl hover:scale-[1.02] active:scale-95 transition-all"
                    disabled={verificationCode.length !== 6 || verify2FAMutation.isPending}
                    onClick={() => verify2FAMutation.mutate(verificationCode)}
                  >
                    {verify2FAMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <><CheckCircle2 className="w-6 h-6" /> ATIVAR SEGURANÇA</>}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

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
                <Shield className="w-6 h-6 fill-current opacity-80" />
              </div>
              <div className="flex flex-col">
                <p className="text-xs text-foreground font-black uppercase tracking-[0.4em] opacity-80 italic">
                  {t('settings.security.centerTitle', 'Central de Segurança')}
                </p>
                <p className="text-[10px] text-muted-foreground/40 font-black uppercase tracking-[0.25em] mt-1 font-mono">
                  AES-256 ENCRYPTION ACTIVE
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};
