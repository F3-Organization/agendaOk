import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle2,
  ShieldCheck,
  Lock,
  CreditCard,
  Zap,
  Calendar,
  FileText,
  ArrowRight,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { PageLayout } from '../shared/ui/PageLayout';
import { Card } from '../shared/ui/Card';
import { Button } from '../shared/ui/Button';

export const CheckoutPage: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Dados passados via state do roteador
  const { checkoutUrl, planName, amount, billingCycle } = location.state || {};

  useEffect(() => {
    if (!checkoutUrl) {
      navigate('/subscription');
    }
  }, [checkoutUrl, navigate]);

  const handleConfirmPayment = () => {
    setLoading(true);
    // Simula uma pequena transição de segurança antes do redirecionamento
    setTimeout(() => {
      window.location.href = checkoutUrl;
    }, 800);
  };

  if (!checkoutUrl) return null;

  return (
    <PageLayout
      title={t('checkout.title')}
      subtitle={t('checkout.subtitle')}
    >
      <div className="max-w-6xl mx-auto relative group/page">
        {/* Animated background lights specific to checkout for premium feel */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full pointer-events-none animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-secondary/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/subscription')}
            className="group flex items-center gap-2 hover:gap-3"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            {t('checkout.backButton')}
          </Button>
        </div>

        <main className="grid grid-cols-1 lg:grid-cols-[1.2fr,1fr] gap-8 items-start">
          {/* Coluna 1: Layout de Resumo */}
          <section className="space-y-6">
            <Card variant="glass" className="p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl -mr-16 -mt-16 group-hover:bg-primary/20 transition-colors" />

              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
                <div>
                  <span className="text-primary text-[10px] font-bold tracking-widest uppercase mb-2 block">
                    {t('checkout.selectedPlan')}
                  </span>
                  <h3 className="text-3xl font-extrabold tracking-tight">
                    {planName || 'ConfirmaZap Pro'}
                  </h3>
                </div>
                <div className="text-right w-full sm:w-auto">
                  <div className="text-4xl font-black tracking-tighter">
                    R$ {(amount / 100).toFixed(2).replace('.', ',')}
                  </div>
                  <div className="text-muted-foreground text-sm font-medium">
                    {billingCycle === 'ANNUALLY' ? t('checkout.perYear') : t('checkout.perMonth')}
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-10">
                <div className="flex items-center gap-3 text-foreground/90">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm font-medium">{t('checkout.unlimitedNotifications')}</span>
                </div>
                <div className="flex items-center gap-3 text-foreground/90">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm font-medium">{t('checkout.googleSync')}</span>
                </div>
                <div className="flex items-center gap-3 text-foreground/90">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm font-medium">{t('checkout.fiscalAutomation')}</span>
                </div>
              </div>

              <Button
                onClick={handleConfirmPayment}
                disabled={loading}
                size="lg"
                className="w-full h-16 text-lg font-bold shadow-2xl shadow-primary-dim/20"
              >
                {loading ? (
                  <span className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t('checkout.loadingButton')}
                  </span>
                ) : (
                  <span className="flex items-center gap-3">
                    {t('checkout.confirmButton')}
                    <ArrowRight className="w-5 h-5" />
                  </span>
                )}
              </Button>
            </Card>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4 flex flex-col items-center text-center gap-2 bg-surface-low/30">
                <ShieldCheck className="text-green-400 w-6 h-6" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  {t('checkout.sslSecure')}
                </span>
              </Card>
              <Card className="p-4 flex flex-col items-center text-center gap-2 bg-surface-low/30">
                <Lock className="text-primary w-6 h-6" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  {t('checkout.cloudEncrypted')}
                </span>
              </Card>
              <Card className="p-4 flex flex-col items-center text-center gap-2 bg-surface-low/30">
                <CreditCard className="text-foreground w-6 h-6" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  {t('checkout.recurringBilling')}
                </span>
              </Card>
            </div>
          </section>

          {/* Coluna 2: Detalhes e Próximos Passos */}
          <aside className="space-y-6 lg:mt-8">
            <Card variant="base" className="p-8 bg-surface-low/40 border-outline-variant/30">
              <h4 className="text-xl font-bold tracking-tight mb-8">
                {t('checkout.nextSteps.title')}
              </h4>

              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="shrink-0 w-12 h-12 rounded-2xl bg-surface-high border border-outline-variant/50 flex items-center justify-center text-primary">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm mb-1">{t('checkout.nextSteps.activationTitle')}</h5>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {t('checkout.nextSteps.activationDesc')}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="shrink-0 w-12 h-12 rounded-2xl bg-surface-high border border-outline-variant/50 flex items-center justify-center text-secondary">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm mb-1">{t('checkout.nextSteps.syncTitle')}</h5>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {t('checkout.nextSteps.syncDesc')}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="shrink-0 w-12 h-12 rounded-2xl bg-surface-high border border-outline-variant/50 flex items-center justify-center text-primary-dim">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm mb-1">{t('checkout.nextSteps.invoiceTitle')}</h5>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {t('checkout.nextSteps.invoiceDesc')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-outline-variant/20 text-center">
                <p className="text-[10px] text-muted-foreground mb-4 uppercase tracking-[0.2em] font-bold">
                  {t('checkout.securePaymentFooter')}
                </p>
                <div className="flex justify-center items-center gap-6 opacity-80">
                  <span className="font-black text-lg tracking-tighter text-foreground italic">
                    Abacate<span className="text-primary">Pay</span>
                  </span>
                  <div className="flex gap-4 items-center">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-primary" />
                      <span className="font-bold text-[9px] uppercase tracking-widest text-primary">
                        {t('checkout.paymentCreditCard')}
                      </span>
                    </div>
                    <div className="w-px h-4 bg-outline-variant" />
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-secondary rounded-[4px] flex items-center justify-center">
                        <Zap className="w-2.5 h-2.5 text-secondary-foreground fill-current" />
                      </div>
                      <span className="font-bold text-[9px] uppercase tracking-widest text-secondary">
                        {t('checkout.paymentPix')}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="mt-6 text-[9px] text-muted-foreground/60 leading-relaxed max-w-xs mx-auto">
                  {t('checkout.footerNote')}
                </p>
              </div>
            </Card>
          </aside>
        </main>
      </div>
    </PageLayout>
  );
};
