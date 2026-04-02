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
  RefreshCw,
  Shield,
  Save,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { PageLayout } from '../shared/ui/PageLayout';
import { Card } from '../shared/ui/Card';
import { Button } from '../shared/ui/Button';
import { Input } from '../shared/ui/Input';
import { apiClient } from '../shared/api/api-client';

export const SettingsPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
      setSuccessMessage("Configurações salvas com sucesso!");
      setTimeout(() => setSuccessMessage(null), 3000);
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
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      whatsappNumber: formData.get('whatsappNumber') as string,
      taxId: formData.get('taxId') as string,
      silentWindowStart: formData.get('silentWindowStart') as string,
      silentWindowEnd: formData.get('silentWindowEnd') as string,
      syncEnabled: formData.get('syncEnabled') === 'on',
    };
    updateMutation.mutate(data);
  };

  return (
    <PageLayout 
      title={t('settings.title', 'Configurações')} 
      subtitle={t('settings.subtitle', 'Gerencie seus dados de perfil e preferências do sistema')}
    >
      <form onSubmit={handleSubmit} className="max-w-4xl space-y-8">
        {/* Profile Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <User className="w-5 h-5" />
            <h2 className="text-xl font-bold tracking-tight">Perfil Profissional</h2>
          </div>
          
          <Card variant="glass" className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    name="name" 
                    defaultValue={userConfig?.name} 
                    className="pl-10" 
                    placeholder="Seu nome completo"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    name="email" 
                    type="email" 
                    defaultValue={userConfig?.email} 
                    className="pl-10" 
                    placeholder="exemplo@email.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">CPF / CNPJ</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    name="taxId" 
                    defaultValue={userConfig?.taxId} 
                    className="pl-10" 
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">WhatsApp de Contato</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    name="whatsappNumber" 
                    defaultValue={userConfig?.whatsappNumber} 
                    className="pl-10" 
                    placeholder="11999999999"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground px-1 italic">
                  Para alertas administrativos e notificações de sistema.
                </p>
              </div>
            </div>
          </Card>
        </section>

        {/* Automation Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Bell className="w-5 h-5" />
            <h2 className="text-xl font-bold tracking-tight">Automação & Silêncio</h2>
          </div>
          
          <Card variant="glass" className="p-8 space-y-8">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-low border border-outline-variant/30">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold tracking-tight">Sincronização Ativa</h3>
                  <p className="text-xs text-muted-foreground">Habilite ou desabilite a automação total com o Google Calendar</p>
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
                  <h3 className="text-sm font-bold tracking-wide">Janela de Silêncio</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Defina o horário em que o sistema NÃO enviará mensagens automáticas pelo WhatsApp para seus clientes.
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground pl-1">Início</label>
                  <Input 
                    name="silentWindowStart" 
                    type="time" 
                    defaultValue={userConfig?.silentWindowStart} 
                    className="bg-surface-low border-outline-variant/30"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground pl-1">Término</label>
                  <Input 
                    name="silentWindowEnd" 
                    type="time" 
                    defaultValue={userConfig?.silentWindowEnd} 
                    className="bg-surface-low border-outline-variant/30"
                  />
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Action Footer */}
        <div className="sticky bottom-8 flex items-center justify-between p-6 bg-surface-bright/80 backdrop-blur-xl rounded-3xl border border-outline-variant/30 shadow-2xl shadow-black/50 z-10 transition-all">
          <div className="flex items-center gap-3">
             {successMessage ? (
               <div className="flex items-center gap-2 text-green-400 animate-in fade-in slide-in-from-left-4">
                 <CheckCircle2 className="w-5 h-5" />
                 <span className="text-sm font-bold">{successMessage}</span>
               </div>
             ) : (
               <p className="text-xs text-muted-foreground flex items-center gap-2">
                 <Shield className="w-4 h-4" />
                 Seus dados estão protegidos e criptografados
               </p>
             )}
          </div>
          
          <Button 
            type="submit" 
            className="px-8 shadow-xl shadow-primary/20 group gap-2"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5 transition-transform group-hover:scale-110" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </form>
    </PageLayout>
  );
};
