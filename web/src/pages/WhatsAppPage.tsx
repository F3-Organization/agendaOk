import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  RefreshCw, 
  ShieldCheck, 
  HelpCircle, 
  ChevronRight,
  Loader2,
  XCircle,
  CheckCircle2
} from 'lucide-react';
import { PageLayout } from '../shared/ui/PageLayout';
import { Card } from '../shared/ui/Card';
import { Button } from '../shared/ui/Button';
import { whatsappService, type WhatsAppQR } from '../features/whatsapp/whatsapp.service';

export const WhatsAppPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [qrData, setQrData] = useState<WhatsAppQR | null>(null);

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

  useEffect(() => {
    connectMutation.mutate();
  }, []);

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

        {/* Right: QR Code Visualizer */}
        <div className="lg:col-span-2 sticky top-[120px]">
          <Card variant="glass" className="p-10 text-center relative overflow-hidden flex flex-col items-center border border-outline-variant">
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
        </div>
      </div>
    </PageLayout>
  );
};
