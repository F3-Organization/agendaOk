import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bot,
  Save,
  Loader2,
  ToggleLeft,
  ToggleRight,
  MapPin,
  FileText,
  MessageSquare,
  Sparkles,
  ListChecks,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  Scissors,
  Dumbbell,
  Building,
  UtensilsCrossed,
  MoreHorizontal,
} from 'lucide-react';
import { PageLayout } from '../shared/ui/PageLayout';
import { Card } from '../shared/ui/Card';
import { Button } from '../shared/ui/Button';
import { professionalService, type BotConfig } from '../features/company/professional.service';

const BUSINESS_TYPES = [
  { value: 'clinic', label: 'Clínica / Consultório', icon: Stethoscope },
  { value: 'salon', label: 'Salão / Barbearia', icon: Scissors },
  { value: 'studio', label: 'Estúdio / Academia', icon: Dumbbell },
  { value: 'office', label: 'Escritório / Coworking', icon: Building },
  { value: 'restaurant', label: 'Restaurante', icon: UtensilsCrossed },
  { value: 'other', label: 'Outro', icon: MoreHorizontal },
];

export const BotConfigPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<BotConfig>({});
  const [newService, setNewService] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const { data: config, isLoading } = useQuery({
    queryKey: ['bot-config'],
    queryFn: professionalService.getBotConfig,
  });

  useEffect(() => {
    if (config) {
      setForm(config);
    }
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: professionalService.updateBotConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bot-config'] });
      showToast('success', 'Configurações salvas com sucesso!');
    },
    onError: () => {
      showToast('error', 'Erro ao salvar configurações.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(form);
  };

  const addService = () => {
    if (newService.trim()) {
      setForm({
        ...form,
        servicesOffered: [...(form.servicesOffered || []), newService.trim()],
      });
      setNewService('');
    }
  };

  const removeService = (index: number) => {
    setForm({
      ...form,
      servicesOffered: (form.servicesOffered || []).filter((_, i) => i !== index),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PageLayout
      title={t('botConfig.title', 'Configuração do Bot')}
      subtitle={t('botConfig.subtitle', 'Personalize o bot de atendimento da sua empresa no WhatsApp.')}
    >
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-16 pb-32">
        {/* Enable Toggle */}
        <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Card variant="glass" className="p-8 border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                  <Bot className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="font-black text-lg tracking-tight">
                    {t('botConfig.enable.title', 'Bot de Autoatendimento')}
                  </h3>
                  <p className="text-xs text-muted-foreground/60 mt-0.5 font-medium max-w-md">
                    {t('botConfig.enable.description', 'Quando ativado, o bot responderá automaticamente mensagens dos clientes no WhatsApp usando inteligência artificial.')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setForm({ ...form, botEnabled: !form.botEnabled })}
                className="transition-transform hover:scale-110"
              >
                {form.botEnabled ? (
                  <ToggleRight className="w-10 h-10 text-green-500" />
                ) : (
                  <ToggleLeft className="w-10 h-10 text-muted-foreground" />
                )}
              </button>
            </div>

            {!form.botEnabled && (
              <div className="mt-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-xs text-yellow-500 font-medium">
                  ⚠️ O bot está desativado. As mensagens serão tratadas apenas pelo sistema de confirmação por palavras-chave.
                </p>
              </div>
            )}
          </Card>
        </section>

        {/* Business Details */}
        <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          <div className="space-y-2 px-1">
            <div className="flex items-center gap-3 text-primary">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                <FileText className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-black tracking-tight">
                {t('botConfig.business.title', 'Detalhes da Empresa')}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl opacity-70">
              {t('botConfig.business.description', 'Essas informações serão usadas pelo bot para responder perguntas sobre sua empresa.')}
            </p>
          </div>

          <Card variant="glass" className="p-8 space-y-8 border-white/5">
            {/* Business Type */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.3em] ml-1">
                Tipo de Negócio
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {BUSINESS_TYPES.map(bt => {
                  const Icon = bt.icon;
                  const isSelected = form.businessType === bt.value;
                  return (
                    <button
                      key={bt.value}
                      type="button"
                      onClick={() => setForm({ ...form, businessType: isSelected ? '' : bt.value })}
                      className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left text-sm font-medium transition-all duration-200 ${
                        isSelected
                          ? 'bg-primary/15 border-primary/40 text-primary shadow-lg shadow-primary/5'
                          : 'bg-black/30 border-white/5 text-muted-foreground hover:border-white/15 hover:bg-black/50'
                      }`}
                    >
                      <Icon className={`w-4.5 h-4.5 shrink-0 ${isSelected ? 'text-primary' : 'text-muted-foreground/50'}`} />
                      <span className="truncate">{bt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Business Description */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.3em] ml-1">
                Descrição do Negócio
              </label>
              <textarea
                value={form.businessDescription || ''}
                onChange={(e) => setForm({ ...form, businessDescription: e.target.value })}
                rows={4}
                placeholder="Ex: Clínica especializada em cardiologia e clínica geral, atendendo pacientes há mais de 10 anos com equipe multidisciplinar..."
                className="w-full px-4 py-3 bg-black/40 border border-white/5 rounded-lg text-sm focus:outline-none focus:border-primary/30 transition-colors resize-none"
              />
            </div>

            {/* Address */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.3em] ml-1 flex items-center gap-2">
                <MapPin className="w-3 h-3" /> Endereço
              </label>
              <input
                value={form.address || ''}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Rua Exemplo, 123 — Centro, São Paulo/SP"
                className="w-full px-4 py-3 bg-black/40 border border-white/5 rounded-lg text-sm focus:outline-none focus:border-primary/30 transition-colors"
              />
            </div>
          </Card>
        </section>

        {/* Services */}
        <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
          <div className="space-y-2 px-1">
            <div className="flex items-center gap-3 text-primary">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                <ListChecks className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-black tracking-tight">
                {t('botConfig.services.title', 'Serviços Oferecidos')}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl opacity-70">
              {t('botConfig.services.description', 'Liste os serviços que sua empresa oferece. O bot usará isso para orientar os clientes.')}
            </p>
          </div>

          <Card variant="glass" className="p-8 space-y-6 border-white/5">
            <div className="flex gap-3">
              <input
                value={newService}
                onChange={(e) => setNewService(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addService())}
                placeholder="Ex: Consulta cardiológica, Limpeza dental, Corte de cabelo..."
                className="flex-1 px-4 py-3 bg-black/40 border border-white/5 rounded-lg text-sm focus:outline-none focus:border-primary/30 transition-colors"
              />
              <Button type="button" onClick={addService} disabled={!newService.trim()} className="gap-2 px-6">
                <Plus className="w-4 h-4" />
                Adicionar
              </Button>
            </div>

            {form.servicesOffered && form.servicesOffered.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {form.servicesOffered.map((service, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full group"
                  >
                    <span className="text-sm font-semibold text-primary">{service}</span>
                    <button
                      type="button"
                      onClick={() => removeService(i)}
                      className="p-0.5 rounded-full hover:bg-red-500/20 text-primary hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground/40 italic">Nenhum serviço cadastrado.</p>
            )}
          </Card>
        </section>

        {/* Bot Personality */}
        <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          <div className="space-y-2 px-1">
            <div className="flex items-center gap-3 text-primary">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-black tracking-tight">
                {t('botConfig.personality.title', 'Personalidade do Bot')}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl opacity-70">
              {t('botConfig.personality.description', 'Defina como o bot se comunica com seus clientes.')}
            </p>
          </div>

          <Card variant="glass" className="p-8 space-y-8 border-white/5">
            {/* Greeting */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.3em] ml-1 flex items-center gap-2">
                <Sparkles className="w-3 h-3" /> Saudação Inicial
              </label>
              <textarea
                value={form.botGreeting || ''}
                onChange={(e) => setForm({ ...form, botGreeting: e.target.value })}
                rows={3}
                placeholder="Ex: Olá! 😊 Bem-vindo à Clínica Saúde Total! Posso ajudá-lo a agendar uma consulta, verificar horários disponíveis ou tirar dúvidas."
                className="w-full px-4 py-3 bg-black/40 border border-white/5 rounded-lg text-sm focus:outline-none focus:border-primary/30 transition-colors resize-none"
              />
              <p className="text-[10px] text-muted-foreground/40 ml-1">
                Esta mensagem será enviada quando um novo cliente entrar em contato.
              </p>
            </div>

            {/* Instructions */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.3em] ml-1">
                Instruções Adicionais
              </label>
              <textarea
                value={form.botInstructions || ''}
                onChange={(e) => setForm({ ...form, botInstructions: e.target.value })}
                rows={4}
                placeholder="Ex: Sempre pergunte se é a primeira consulta do paciente. Informe que estacionamento é gratuito. Não agende consultas para sábado à tarde..."
                className="w-full px-4 py-3 bg-black/40 border border-white/5 rounded-lg text-sm focus:outline-none focus:border-primary/30 transition-colors resize-none"
              />
              <p className="text-[10px] text-muted-foreground/40 ml-1">
                Regras especiais que o bot deve seguir nas conversas. Use linguagem natural.
              </p>
            </div>
          </Card>
        </section>

        {/* Save */}
        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            disabled={saveMutation.isPending}
            className="h-14 px-12 group gap-4 shadow-2xl shadow-primary/20 text-xs font-black tracking-[0.3em] uppercase transition-all hover:scale-[1.03] active:scale-95 bg-primary text-primary-dim rounded-xl"
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <Save className="w-6 h-6 fill-current" />
                Salvar Configurações
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-10 duration-500">
          <div className={`flex items-center gap-4 px-8 py-5 rounded-2xl border shadow-2xl backdrop-blur-xl ${
            toast.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="text-sm font-bold">{toast.message}</span>
          </div>
        </div>
      )}
    </PageLayout>
  );
};
