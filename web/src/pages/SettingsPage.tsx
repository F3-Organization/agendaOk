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
  Copy
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

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 5000);
  };

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

    changePasswordMutation.mutate({ currentPassword, newPassword, confirmPassword });
    e.currentTarget.reset();
  };

  return (
    <PageLayout
      title={t('settings.title', 'Configurações')}
      subtitle={t('settings.subtitle', 'Gerencie seus dados de perfil e preferências do sistema')}
    >
      <div className="max-w-4xl space-y-12 pb-24">
        {/* Profile Section */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <User className="w-5 h-5" />
              <h2 className="text-xl font-bold tracking-tight">{t('settings.profile.title', 'Perfil Profissional')}</h2>
            </div>

            <Card variant="glass" className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t('settings.profile.fullName', 'Nome Completo')}</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      name="name"
                      defaultValue={userConfig?.name}
                      className="pl-10"
                      placeholder={t('settings.profile.placeholders.fullName', 'Seu nome completo')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t('settings.profile.email', 'E-mail')}</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      name="email"
                      type="email"
                      defaultValue={userConfig?.email}
                      className="pl-10"
                      placeholder={t('settings.profile.placeholders.email', 'exemplo@email.com')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t('settings.profile.taxId', 'CPF / CNPJ')}</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      name="taxId"
                      defaultValue={userConfig?.taxId}
                      className="pl-10"
                      placeholder={t('settings.profile.placeholders.taxId', '000.000.000-00')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t('settings.profile.whatsapp', 'WhatsApp de Contato')}</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      name="whatsappNumber"
                      defaultValue={userConfig?.whatsappNumber}
                      className="pl-10"
                      placeholder={t('settings.profile.placeholders.whatsapp', '11999999999')}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground px-1 italic">
                    {t('settings.profile.whatsappHint', 'Para alertas administrativos e notificações de sistema.')}
                  </p>
                </div>
              </div>
            </Card>
          </section>

          {/* Automation Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <Bell className="w-5 h-5" />
              <h2 className="text-xl font-bold tracking-tight">{t('settings.automation.title', 'Automação & Silêncio')}</h2>
            </div>

            <Card variant="glass" className="p-8 space-y-8">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-low border border-outline-variant/30">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold tracking-tight">{t('settings.automation.syncTitle', 'Sincronização Ativa')}</h3>
                    <p className="text-xs text-muted-foreground">{t('settings.automation.syncDesc', 'Habilite ou desabilite a automação total com o Google Calendar')}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="syncEnabled"
                    defaultChecked={userConfig?.syncEnabled}
                    className="w-10 h-5 rounded-full bg-surface-high appearance-none cursor-pointer relative checked:bg-primary transition-colors border border-outline-variant/50 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:rounded-full after:bg-white after:transition-all checked:after:translate-x-5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <BellOff className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-sm font-bold tracking-wide">{t('settings.automation.silentWindow', 'Janela de Silêncio')}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t('settings.automation.silentWindowDesc', 'Defina o horário em que o sistema NÃO enviará mensagens automáticas pelo WhatsApp para seus clientes.')}
                  </p>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface-high/30 border border-outline-variant/20 shadow-inner">
                  <div className="flex-1 space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 ml-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500/50" />
                      {t('settings.automation.start', 'Início')}
                    </label>
                    <div className="relative group">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        name="silentWindowStart"
                        type="time"
                        defaultValue={userConfig?.silentWindowStart}
                        className="pl-10 bg-surface-low/50 border-outline-variant/20 focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-center pt-6">
                    <div className="w-4 h-[1px] bg-outline-variant/50" />
                  </div>

                  <div className="flex-1 space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 ml-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500/50" />
                      {t('settings.automation.end', 'Término')}
                    </label>
                    <div className="relative group">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        name="silentWindowEnd"
                        type="time"
                        defaultValue={userConfig?.silentWindowEnd}
                        className="pl-10 bg-surface-low/50 border-outline-variant/20 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
            <div className="flex justify-end">
              <Button type="submit" disabled={updateMutation.isPending} className="px-10 group gap-2 shadow-lg shadow-primary/20">
                {updateMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> {t('settings.messages.savePreferences', 'Salvar Preferências')}</>}
              </Button>
            </div>
          </section>
        </form>

        {/* Security & Privacy Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 text-primary">
            <ShieldCheck className="w-5 h-5" />
            <h2 className="text-xl font-bold tracking-tight">{t('settings.security.title', 'Segurança & Privacidade')}</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Change Password Card */}
            <Card variant="glass" className="p-8 space-y-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold tracking-tight">{t('settings.security.changePassword', 'Alterar Senha')}</h3>
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground pl-1">{t('settings.security.currentPassword', 'Senha Atual')}</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        name="currentPassword"
                        type="password"
                        className="pl-10 h-10"
                        placeholder={t('settings.security.passwordPlaceholder', '••••••••')}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground pl-1">{t('settings.security.newPassword', 'Nova Senha')}</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        name="newPassword"
                        type="password"
                        className="pl-10 h-10"
                        placeholder={t('settings.security.newPasswordHint', 'Mínimo 6 caracteres')}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground pl-1">{t('settings.security.confirmPassword', 'Confirmar Nova Senha')}</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        name="confirmPassword"
                        type="password"
                        className="pl-10 h-10"
                        placeholder={t('settings.security.passwordPlaceholder', '••••••••')}
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="ghost"
                    className="w-full mt-4 border border-outline-variant/30 hover:bg-orange-500/10 hover:text-orange-400 transition-all font-bold uppercase text-[10px] tracking-widest h-11"
                    disabled={changePasswordMutation.isPending}
                  >
                    {changePasswordMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('settings.security.updatePassword', 'Atualizar Senha')}
                  </Button>
                </form>
              </div>
            </Card>

            {/* 2FA Card */}
            <Card variant="accent" className="p-8 space-y-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -z-0 translate-x-1/2 -translate-y-1/2" />

              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-primary-dim flex items-center justify-center text-primary-foreground shadow-lg shadow-primary-dim/30">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold tracking-tight">{t('settings.security.twoFactor', 'Autenticação em Duas Etapas')}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${userConfig?.twoFactorEnabled ? 'bg-green-400' : 'bg-red-400'}`} />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          {userConfig?.twoFactorEnabled ? t('settings.security.twoFactorActive', 'Ativo') : t('settings.security.twoFactorInactive', 'Desativado')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-foreground/80 leading-relaxed mb-8">
                    {t('settings.security.twoFactorDesc', 'Adicione uma camada extra de segurança à sua conta. Ao ativar, você precisará de um código do seu aplicativo autenticador para fazer login.')}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-surface-dim/50 border border-outline-variant/20 flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('settings.security.twoFactorStatus', 'Status do 2FA')}</span>
                    <button
                      onClick={() => toggle2FAMutation.mutate(!userConfig?.twoFactorEnabled)}
                      className={`w-12 h-6 rounded-full transition-all relative p-1 ${userConfig?.twoFactorEnabled ? 'bg-green-500' : 'bg-surface-high border border-outline-variant/50'}`}
                      disabled={toggle2FAMutation.isPending}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-all ${userConfig?.twoFactorEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {userConfig?.twoFactorEnabled && (
                    <Button 
                      variant="ghost" 
                      className="w-full text-[10px] uppercase tracking-widest font-bold border-primary/20 text-primary hover:bg-primary/10"
                      onClick={() => toggle2FAMutation.mutate(true)}
                    >
                      {t('settings.security.setupScanner', 'Configurar App Autenticador')}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Setup 2FA Modal */}
        {isSetupModalOpen && setupData && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <Card variant="glass" className="w-full max-w-md p-8 relative shadow-2xl border-primary/20">
              <button 
                onClick={() => setIsSetupModalOpen(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto">
                  <QrCode className="w-8 h-8" />
                </div>
                
                <h3 className="text-xl font-bold tracking-tight">Configurar Autenticador</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Escaneie o QR Code abaixo com seu aplicativo de autenticação (Google Authenticator, Authy, etc).
                </p>

                <div className="bg-white p-4 rounded-3xl inline-block shadow-inner mx-auto mb-4">
                  <QRCodeSVG value={setupData.otpauthUrl} size={180} level="H" />
                </div>

                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-surface-low border border-outline-variant/30 flex items-center justify-between gap-4">
                    <code className="text-[10px] font-mono text-primary font-bold truncate">
                      {setupData.secret}
                    </code>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(setupData.secret);
                        showSuccess("Código copiado!");
                      }}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground block text-left ml-1">
                      Código de 6 dígitos
                    </label>
                    <Input 
                      placeholder="000000"
                      className="text-center text-2xl tracking-[1em] font-black h-14"
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>

                  <Button 
                    className="w-full h-12 font-bold uppercase tracking-widest text-xs gap-2"
                    disabled={verificationCode.length !== 6 || verify2FAMutation.isPending}
                    onClick={() => verify2FAMutation.mutate(verificationCode)}
                  >
                    {verify2FAMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verificar e Ativar"}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Global Notifications Footer */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-4 bg-surface-bright/90 backdrop-blur-xl rounded-full border border-outline-variant/30 shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-4">
          {successMessage ? (
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle2 className="w-5 h-5 shadow-sm" />
              <span className="text-sm font-extrabold tracking-tight">{successMessage}</span>
            </div>
          ) : errorMessage ? (
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle className="w-5 h-5 shadow-sm" />
              <span className="text-sm font-extrabold tracking-tight">{errorMessage}</span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-primary" />
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                {t('settings.security.centerTitle', 'Central de Segurança AgendaOk')}
              </p>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};
