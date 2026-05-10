import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  RefreshCw, 
  ShieldCheck, 
  HelpCircle, 
  ChevronRight,
  Loader2,
  XCircle,
  CheckCircle2,
  PartyPopper,
  ArrowRight,
  BellRing,
  Moon,
  Save
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '../shared/ui/PageLayout';
import { Card } from '../shared/ui/Card';
import { Button } from '../shared/ui/Button';
import { whatsappService, type WhatsAppQR } from '../features/whatsapp/whatsapp.service';
import { authService } from '../features/auth/auth.service';
import { useAuthStore } from '../features/auth/auth.store';
import { Input } from '../shared/ui/Input';

export const WhatsAppPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [qrData, setQrData] = useState<WhatsAppQR | null>(null);

  const { data: statusData } = useQuery({
    queryKey: ['whatsapp-status'],
    queryFn: whatsappService.getStatus,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'CONNECTED' ? false : 5000;
    }
  });

  const isConnected = statusData?.status === 'CONNECTED';

  const connectMutation = useMutation({
    mutationFn: whatsappService.connect,
    onSuccess: (data) => {
      setQrData(data);
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: whatsappService.disconnect,
    onSuccess: () => {
      setQrData(null);
      queryClient.invalidateQueries({ queryKey: ['whatsapp-status'] });
    },
  });

  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setAuth);
  const token = useAuthStore((state) => state.token);

  const [silentWindowStart, setSilentWindowStart] = useState(user?.config?.silentWindowStart || '22:00');
  const [silentWindowEnd, setSilentWindowEnd] = useState(user?.config?.silentWindowEnd || '08:00');

  const updateConfigMutation = useMutation({
    mutationFn: authService.updateConfig,
    onSuccess: () => {
      if (user && token) {
        setUser({
          ...user,
          config: {
            ...user.config!,
            silentWindowStart,
            silentWindowEnd
          }
        }, token);
      }
      queryClient.invalidateQueries({ queryKey: ['whatsapp-status'] });
    },
  });

  useEffect(() => {
    if (!isConnected) {
      connectMutation.mutate();
    }
  }, []);

  useEffect(() => {
    if (user?.config) {
      setSilentWindowStart(user.config.silentWindowStart);
      setSilentWindowEnd(user.config.silentWindowEnd);
    }
  }, [user?.config]);

  return (
    <PageLayout 
      title={t('whatsapp.title')} 
      subtitle={t('whatsapp.subtitle')}
    >
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
        {/* Left: Connection Steps */}
        <div className="lg:col-span-3 space-y-12 pr-6">
          <div className="space-y-8">
            <h2 className="text-3xl font-bold tracking-tight mb-8">{t('whatsapp.stepsTitle')}</h2>
            <div className="space-y-6">
              {(t('whatsapp.steps', { returnObjects: true }) as string[]).map((step: string, i: number) => (
                <div key={i} className="flex gap-6 group">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-surface-low border border-outline-variant/50 flex items-center justify-center font-bold text-primary group-hover:border-primary/40 transition-colors">
                    {i + 1}
                  </div>
                  <p className="text-lg text-foreground/80 font-medium leading-relaxed pt-1 group-hover:text-foreground transition-colors">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <Card variant="glass" className="p-8 border-primary/20 bg-primary/5 flex items-start gap-5 overflow-hidden group border border-outline-variant">
            <div className="absolute top-[-50%] right-[-10%] w-[200px] h-[200px] bg-primary/10 rounded-full blur-[60px] -z-10 group-hover:scale-110 transition-transform" />
            <ShieldCheck className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
            <div>
              <h4 className="text-lg font-bold tracking-tight mb-2">{t('whatsapp.security.title')}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('whatsapp.security.description')}
              </p>
            </div>
          </Card>

          <footer className="flex items-center gap-6 text-sm text-muted-foreground pt-4">
            <button className="flex items-center gap-2 hover:text-primary transition-colors font-semibold group">
              <HelpCircle className="w-4 h-4" />
              {t('whatsapp.help')}
              <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </button>
          </footer>
        </div>

        {/* Right: QR Code Visualizer or Success View */}
        <div className="lg:col-span-2 sticky top-[120px]">
          {isConnected ? (
            <Card variant="glass" className="p-10 text-center relative overflow-hidden flex flex-col items-center border-2 border-green-500/30 bg-green-500/5 min-h-[450px] justify-center animate-in fade-in zoom-in duration-700">
               <div className="absolute inset-0 bg-radial-gradient from-green-500/10 to-transparent blur-3xl rounded-full scale-110 -z-10" />
               
               <div className="relative mb-8">
                  <div className="absolute inset-0 bg-green-500 blur-2xl opacity-20 animate-pulse" />
                  <div className="w-24 h-24 rounded-full bg-green-500/20 border border-green-500/50 flex items-center justify-center relative">
                    <PartyPopper className="w-12 h-12 text-green-400" />
                  </div>
               </div>

               <h3 className="text-3xl font-black tracking-tighter mb-4 text-green-100">
                  {t('whatsapp.successTitle')}
               </h3>
               
               <p className="text-muted-foreground leading-relaxed mb-10 max-w-[280px]">
                  {t('whatsapp.successDescription')}
               </p>

               <div className="space-y-4 w-full">
                  <Button 
                    variant="primary" 
                    className="w-full h-14 gap-3 text-sm font-bold tracking-widest uppercase shadow-xl shadow-green-500/20"
                    onClick={() => navigate('/')}
                  >
                    {t('whatsapp.startAutomating')}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    className="w-full text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all uppercase tracking-widest"
                    onClick={() => disconnectMutation.mutate()}
                  >
                    {t('common.disconnect')}
                  </Button>
               </div>
            </Card>
          ) : (
            <Card variant="glass" className="p-10 text-center relative overflow-hidden flex flex-col items-center border border-outline-variant min-h-[450px]">
              {/* Pulsing Back Glow */}
              <div className="absolute inset-0 bg-radial-gradient from-primary/5 to-transparent blur-3xl rounded-full scale-150 -z-10" />
              
              <div className="w-full aspect-square bg-white p-6 rounded-2xl shadow-2xl shadow-black mb-10 flex items-center justify-center relative group">
                {connectMutation.isPending ? (
                  <div className="flex flex-col items-center gap-4 text-slate-900">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                    <span className="text-xs font-bold uppercase tracking-widest text-[#0F172A]">{t('whatsapp.generatingQR')}</span>
                  </div>
                ) : qrData?.base64 ? (
                  <div className="w-full h-full relative">
                    <img 
                      src={qrData.base64} 
                      alt={t('whatsapp.qrCodeAlt')}
                      className="w-full h-full object-contain"
                    />
                    {/* Expiration Overlay */}
                    <div 
                      className="absolute inset-0 bg-white/60 backdrop-blur-[2px] rounded-2xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer text-slate-900"
                      onClick={() => connectMutation.mutate()}
                    >
                      <RefreshCw className="w-10 h-10 animate-spin-slow mb-4" />
                      <span className="text-xs font-bold tracking-widest uppercase">{t('whatsapp.clickToRefresh')}</span>
                    </div>
                  </div>
                ) : connectMutation.isError ? (
                  <div className="flex flex-col items-center gap-4 text-red-500">
                    <XCircle className="w-12 h-12" />
                    <span className="text-xs font-bold uppercase tracking-widest">{t('whatsapp.failedLoadQR')}</span>
                    <Button variant="ghost" size="sm" onClick={() => connectMutation.mutate()}>{t('common.retry')}</Button>
                  </div>
                ) : (
                   <div className="flex flex-col items-center gap-4 text-green-500">
                    <CheckCircle2 className="w-12 h-12" />
                    <span className="text-xs font-bold uppercase tracking-widest">{t('whatsapp.connected')}</span>
                    <Button variant="ghost" size="sm" onClick={() => disconnectMutation.mutate()} className="text-red-400 hover:text-red-500">{t('common.disconnect')}</Button>
                  </div>
                )}
              </div>

              <div className="space-y-4 w-full">
                {!qrData?.base64 && !connectMutation.isPending && !connectMutation.isError ? (
                   <div className="pt-6">
                      <Button 
                        variant="primary" 
                        className="w-full h-12 gap-2 text-xs font-bold tracking-widest uppercase"
                        onClick={() => connectMutation.mutate()}
                      >
                        {t('whatsapp.connectButton')}
                      </Button>
                   </div>
                ) : (
                  <>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center justify-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      {t('whatsapp.waitingScan')}
                    </p>
                    <h3 className="text-xl font-bold tracking-tight">{t('whatsapp.expiresIn')} <span className="text-primary-dim">45s</span></h3>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-[200px] mx-auto">
                      {t('whatsapp.cantScan')}{' '}
                      <span className="text-primary cursor-pointer hover:underline font-bold">{t('whatsapp.mobileAppLink')}</span>{' '}
                      {t('whatsapp.instead')}
                    </p>
                    
                    <div className="pt-6">
                      <Button 
                        variant="secondary" 
                        className="w-full h-12 gap-2 text-xs font-bold tracking-widest uppercase group"
                        onClick={() => connectMutation.mutate()}
                        disabled={connectMutation.isPending}
                      >
                        {connectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />}
                        {t('whatsapp.regenerate')}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Notification Settings Section */}
      <div className="mt-20">
        <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <BellRing className="w-6 h-6 text-primary" />
            </div>
            <div>
                <h2 className="text-2xl font-bold tracking-tight">{t('whatsapp.config.title')}</h2>
                <p className="text-muted-foreground">{t('whatsapp.config.silentWindowDescription')}</p>
            </div>
        </div>

        <Card variant="glass" className="p-8 border border-outline-variant relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 group-hover:bg-primary/10 transition-colors" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-primary mb-2">
                        <Moon className="w-4 h-4" />
                        {t('whatsapp.config.silentWindow')}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input 
                            type="time" 
                            label={t('whatsapp.config.start')}
                            value={silentWindowStart}
                            onChange={(e) => setSilentWindowStart(e.target.value)}
                        />
                        <Input 
                            type="time" 
                            label={t('whatsapp.config.end')}
                            value={silentWindowEnd}
                            onChange={(e) => setSilentWindowEnd(e.target.value)}
                        />
                    </div>
                </div>

                <div className="md:col-span-2 flex justify-end">
                    <Button 
                        variant="primary" 
                        className="h-12 px-8 gap-2 font-bold tracking-widest uppercase shadow-lg shadow-primary/20"
                        onClick={() => updateConfigMutation.mutate({ silentWindowStart, silentWindowEnd })}
                        disabled={updateConfigMutation.isPending}
                    >
                        {updateConfigMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        {t('whatsapp.config.save')}
                    </Button>
                </div>
            </div>

            {updateConfigMutation.isSuccess && (
                <div className="mt-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
                    <CheckCircle2 className="w-4 h-4" />
                    {t('whatsapp.config.success')}
                </div>
            )}
        </Card>
      </div>
    </PageLayout>
  );
};
