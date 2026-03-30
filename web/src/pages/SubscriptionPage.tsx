import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
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
  FileX
} from 'lucide-react';
import { PageLayout } from '../shared/ui/PageLayout';
import { Card } from '../shared/ui/Card';
import { Button } from '../shared/ui/Button';
import { subscriptionService } from '../features/subscription/subscription.service';

export const SubscriptionPage = () => {
  const { t } = useTranslation();

  const { data: subStatus, isLoading: isStatusLoading } = useQuery({
    queryKey: ['subscription-status'],
    queryFn: subscriptionService.getStatus,
  });

  const { data: paymentHistory, isLoading: isHistoryLoading } = useQuery({
    queryKey: ['subscription-payments'],
    queryFn: subscriptionService.getPaymentHistory,
  });

  const checkoutMutation = useMutation({
    mutationFn: subscriptionService.createCheckout,
    onSuccess: (data) => {
      window.open(data.url, '_blank');
    },
  });

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return '-';
    // DD/MM/AAAA format as requested
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount / 100);
  };

  const handleDownloadPdf = (paymentId: string) => {
    const url = subscriptionService.getInvoicePdfUrl(paymentId);
    window.open(url, '_blank');
  };

  const plans = [
    {
      id: 'FREE',
      name: t('subscription.plans.standard.name'),
      price: 'R$ 0',
      description: t('subscription.plans.standard.description'),
      features: [
        `100 ${t('subscription.features.monthlyConfirmations')}`,
        `1 ${t('subscription.features.whatsappDevices')}`,
        t('subscription.features.support'),
        t('subscription.features.reporting')
      ],
      current: subStatus?.plan === 'FREE' || !subStatus,
      cta: subStatus?.plan === 'FREE' ? t('common.currentPlan') : t('common.connect')
    },
    {
      id: 'PRO',
      name: t('subscription.plans.pro.name'),
      price: 'R$ 49',
      description: t('subscription.plans.pro.description'),
      features: [
        t('subscription.features.unlimitedConfirmations'),
        `3 ${t('subscription.features.whatsappDevicesPlural')}`,
        t('subscription.features.prioritySupport'),
        t('subscription.features.apiAccess'),
        t('subscription.features.branding')
      ],
      current: subStatus?.plan === 'PRO',
      cta: subStatus?.plan === 'PRO' ? t('common.currentPlan') : t('common.connect')
    },
    {
      id: 'ENTERPRISE',
      name: t('subscription.plans.enterprise.name'),
      price: t('subscription.plans.enterprise.customPrice'),
      description: t('subscription.plans.enterprise.description'),
      features: [
        t('subscription.features.unlimitedConfirmations'),
        t('subscription.features.dedicatedManager'),
        t('subscription.features.onPremise')
      ],
      current: subStatus?.plan === 'ENTERPRISE',
      cta: t('common.contactSales')
    }
  ];

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
              disabled={plan.current || checkoutMutation.isPending}
              onClick={() => plan.id === 'PRO' && checkoutMutation.mutate()}
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
                     <td className="px-8 py-6 font-bold text-sm">{formatAmount(payment.amount)}</td>
                     <td className="px-8 py-6">
                       <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border ${
                         payment.status === 'PAID' 
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
            <Button className="h-14 px-8 min-w-[200px]" variant="primary">
               {t('subscription.enterpriseCta.button')}
               <Zap className="w-4 h-4 ml-2 fill-current" />
            </Button>
         </div>
      </div>
    </PageLayout>
  );
};
