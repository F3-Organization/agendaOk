import { useTranslation } from 'react-i18next';
import {
  Check,
  ArrowRight,
  CreditCard,
  Calendar,
  History,
  Download,
  Zap,
  Star,
  ShieldEllipsis,
  Loader2,
  FileX,
  Banknote,
  Smartphone,
  QrCode,
} from 'lucide-react';
import { PageLayout } from '../shared/ui/PageLayout';
import { Card } from '../shared/ui/Card';
import { Button } from '../shared/ui/Button';
import { useSubscription } from '../features/subscription/hooks/useSubscription';
import { BillingInfoModal } from '../features/subscription/components/BillingInfoModal';
import { formatCurrency, formatDate } from '../shared/utils/formatters';
import type { PaymentMethod } from '../features/subscription/subscription.service';

function PaymentMethodBadge({ method, methods }: { method?: string | null; methods: PaymentMethod[] }) {
  if (!method) return <span className="text-muted-foreground/40 text-xs">—</span>;
  const found = methods.find(m => m.code === method);
  const label = found?.name ?? method;
  const code = method.toUpperCase();
  const isPix = code.includes('PIX');
  const isBoleto = code.includes('BOLETO');
  const Icon = isPix ? QrCode : isBoleto ? Banknote : Smartphone;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-surface-high/60 border border-outline-variant/30 text-muted-foreground">
      <Icon className="w-3 h-3 shrink-0" />
      {label}
    </span>
  );
}

export const SubscriptionPage = () => {
  const { t } = useTranslation();
  const {
    subStatus,
    paymentHistory,
    paymentMethods,
    isStatusLoading,
    isHistoryLoading,
    showSuccessBanner,
    plans,
    checkoutMutation,
    handlePlanAction,
    handleDownloadPdf,
    setShowSuccessBanner,
    showBillingModal,
    setShowBillingModal,
    handleUpdateBillingInfo,
    updateBillingConfigMutation
  } = useSubscription();

  const messageCount = subStatus?.messageCount ?? 0;
  const isUnlimited = subStatus?.messageLimit === null || subStatus?.messageLimit === undefined;
  const messageLimit = subStatus?.messageLimit;
  const isAtLimit = !isUnlimited && messageLimit != null && messageCount >= messageLimit;

  if (isStatusLoading) {
    return (
      <PageLayout title={t('subscription.title')} subtitle={t('subscription.subtitle')}>
        <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">{t('subscription.billing.loadingStatus')}</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={t('subscription.title')}
      subtitle={t('subscription.subtitle')}
    >
      {showSuccessBanner && (
        <Card variant="glass" className="mb-8 p-6 border-emerald-500/30 bg-emerald-500/5 items-center flex gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
            <Check className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-emerald-500 leading-tight">
              {t('subscription.billing.successTitle')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('subscription.billing.successDescription')}
            </p>
          </div>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setShowSuccessBanner(false)}>
            {t('common.close')}
          </Button>
        </Card>
      )}

      {subStatus?.status === 'PENDING' && !showSuccessBanner && (
        <Card variant="glass" className="mb-8 p-6 border-yellow-500/30 bg-yellow-500/5 items-center flex gap-4">
          <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
            <Loader2 className="w-6 h-6 text-yellow-500 animate-spin" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-yellow-500 leading-tight">
              {t('subscription.billing.pendingTitle')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('subscription.billing.pendingDescription')}
            </p>
          </div>
        </Card>
      )}

      {/* Usage Progress Section */}
      {subStatus && (
        <Card variant="glass" className="mb-12 p-8 border border-primary/20 overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent -z-10" />
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1 w-full uppercase">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${isAtLimit ? 'bg-red-500/10 border-red-500/20' : 'bg-primary/10 border-primary/20'}`}>
                    <Zap className={`w-5 h-5 ${isAtLimit ? 'text-red-400' : 'text-primary'}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black tracking-widest leading-none mb-1">{t('subscription.usage.title')}</h3>
                    <p className="text-[10px] text-muted-foreground font-bold tracking-wide italic lowercase opacity-70">
                      * {t('subscription.usage.messageLimit')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-black tracking-tighter ${isAtLimit ? 'text-red-400' : 'text-foreground'}`}>
                    {messageCount}
                  </span>
                  <span className="text-[10px] font-bold tracking-widest opacity-40 ml-1">
                    {isUnlimited ? '/ ∞' : `/ ${messageLimit} ${t('subscription.usage.sent')}`}
                  </span>
                </div>
              </div>

              {!isUnlimited && (
                <div className="h-4 w-full bg-black/40 rounded-full overflow-hidden border border-outline-variant/30 relative p-[3px]">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out relative group-hover:brightness-110 ${isAtLimit
                        ? 'bg-gradient-to-r from-red-600 to-red-400 shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                        : 'bg-gradient-to-r from-primary-dim to-primary'
                      }`}
                    style={{ width: `${Math.min((messageCount / (messageLimit!)) * 100, 100)}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse-slow rounded-full" />
                  </div>
                </div>
              )}
            </div>

            {subStatus.plan === 'FREE' && (
              <div className="shrink-0 w-full md:w-auto">
                <Button
                  variant={isAtLimit ? 'primary' : 'secondary'}
                  className={`w-full md:w-auto h-14 px-10 text-[10px] font-black tracking-[0.2em] uppercase shadow-2xl transition-all ${isAtLimit ? 'shadow-red-500/20 active:scale-95' : 'shadow-primary/10'}`}
                  onClick={() => checkoutMutation.mutate()}
                  disabled={checkoutMutation.isPending}
                >
                  {checkoutMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-3 h-3 mr-3 fill-current" />}
                  {t('subscription.usage.upgradeButton')}
                  <ArrowRight className="w-3 h-3 ml-3 opacity-50 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-16">
        {plans.map((plan, i) => (
          <Card
            key={i}
            variant={plan.current ? 'accent' : 'glass'}
            className={`p-10 flex flex-col relative overflow-hidden group shadow-2xl transition-all border border-outline-variant ${plan.current ? 'ring-2 ring-primary scale-[1.02] z-10' : 'opacity-80 hover:opacity-100 hover:scale-[1.01]'}`}
          >
            {plan.current && (
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary-dim text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5">
                <Star className="w-3 h-3 fill-current" />
                {t('common.activePlan')}
              </div>
            )}

            <div className="mb-10">
              <h3 className="text-2xl font-bold tracking-tight mb-2 flex items-center gap-2">
                {plan.name}
                {plan.id === 'ENTERPRISE' && <ShieldEllipsis className="w-5 h-5 text-muted-foreground" />}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {plan.description}
              </p>
            </div>

            <div className="mb-10 flex items-baseline gap-1">
              <span className="text-5xl font-extrabold tracking-tighter">{plan.price}</span>
              {(plan.id !== 'ENTERPRISE' && plan.price !== 'R$ 0') && <span className="text-muted-foreground font-semibold">{t('subscription.pricing.perMonth')}</span>}
            </div>

            <div className="space-y-4 mb-12 flex-1">
              {plan.features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3 text-sm font-medium">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${plan.current ? 'bg-primary/20' : 'bg-surface-low border border-outline-variant/30'}`}>
                    <Check className={`w-3 h-3 ${plan.current ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  {feature}
                </div>
              ))}
            </div>

            <Button
              variant={plan.current ? 'primary' : 'secondary'}
              className={`w-full py-4 text-xs font-bold tracking-widest uppercase transition-all ${plan.current ? 'shadow-xl shadow-primary-dim/30' : ''}`}
              disabled={plan.current || (plan as any).disabled || checkoutMutation.isPending}
              onClick={() => handlePlanAction(plan.id)}
            >
              {checkoutMutation.isPending && plan.id === 'PRO' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {plan.cta}
              {!plan.current && <ArrowRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />}
            </Button>
          </Card>
        ))}
      </div>

      {/* Payment History Section */}
      <h2 className="text-3xl font-bold tracking-tight mb-8">{t('subscription.billing.title')}</h2>
      <Card variant="base" className="overflow-hidden bg-surface-dim/30 border border-outline-variant">
        <div className="p-8 border-b border-outline-variant/20 flex justify-between items-center group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-low flex items-center justify-center border border-outline-variant/50 group-hover:bg-primary/5 group-hover:border-primary/20 transition-all">
              <History className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight">{t('subscription.billing.recentInvoices')}</h3>
              <p className="text-xs text-muted-foreground">{t('subscription.billing.subtitle')}</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          {isHistoryLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
              <p className="text-xs text-muted-foreground">{t('subscription.billing.loadingHistory')}</p>
            </div>
          ) : paymentHistory && paymentHistory.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-high/50 border-b border-outline-variant/20">
                <tr>
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('subscription.billing.invoiceId')}</th>
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('subscription.billing.date')}</th>
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('subscription.billing.amount')}</th>
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hidden sm:table-cell">Método</th>
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('subscription.billing.status')}</th>
                  <th className="px-8 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {paymentHistory.map((payment, i) => (
                  <tr key={i} className="group hover:bg-surface-high/50 transition-all">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-surface-low border border-outline-variant/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-muted-foreground">
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-sm tracking-tight group-hover:translate-x-[-12px] lg:group-hover:translate-x-0 transition-transform">
                          {payment.id.split('-')[0].toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        {formatDate(payment.paidAt || payment.createdAt)}
                      </span>
                    </td>
                    <td className="px-8 py-6 font-bold text-sm">{formatCurrency(payment.amount)}</td>
                    <td className="px-8 py-6 hidden sm:table-cell">
                      <PaymentMethodBadge method={payment.paymentMethod} methods={paymentMethods} />
                    </td>
                    <td className="px-8 py-6">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border ${payment.status === 'PAID'
                          ? 'bg-green-500/10 border-green-500/20 text-green-400'
                          : payment.status === 'PENDING'
                            ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/10 border-red-500/20 text-red-400'
                        }`}>
                        {payment.status === 'PAID' ? t('subscription.billing.paid') : payment.status}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      {payment.status === 'PAID' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDownloadPdf(payment.id)}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          {t('subscription.billing.downloadPdf')}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-center px-4">
              <div className="w-16 h-16 rounded-2xl bg-surface-low flex items-center justify-center mb-4 border border-outline-variant/30">
                <FileX className="w-8 h-8 text-muted-foreground/30" />
              </div>
              <h4 className="text-lg font-bold tracking-tight mb-1">{t('subscription.billing.noPayments')}</h4>
              <p className="text-sm text-muted-foreground max-w-xs">{t('subscription.billing.noPaymentsDescription')}</p>
            </div>
          )}
        </div>
      </Card>

      <div className="mt-12 p-8 rounded-3xl bg-surface-container border border-primary/20 relative overflow-hidden group">
        <div className="absolute inset-0 bg-pulse-gradient opacity-[0.03] -z-10 group-hover:opacity-[0.05] transition-opacity" />
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          <div className="max-w-xl text-center md:text-left">
            <h4 className="text-xl font-bold tracking-tight mb-2">{t('subscription.enterpriseCta.title')}</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('subscription.enterpriseCta.description')}
            </p>
          </div>
          <Button
            className="h-14 px-8 min-w-[200px]"
            variant="primary"
            onClick={() => handlePlanAction('ENTERPRISE')}
          >
            {t('subscription.enterpriseCta.button')}
            <Zap className="w-4 h-4 ml-2 fill-current" />
          </Button>
        </div>
      </div>

      <BillingInfoModal
        isOpen={showBillingModal}
        onClose={() => setShowBillingModal(false)}
        onSave={handleUpdateBillingInfo}
        isLoading={updateBillingConfigMutation.isPending}
        initialData={{
          taxId: subStatus?.taxId,
          whatsappNumber: subStatus?.whatsappNumber
        }}
      />
    </PageLayout>
  );
};
