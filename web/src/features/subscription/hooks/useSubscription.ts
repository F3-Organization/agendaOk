import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { subscriptionService } from '../subscription.service';
import { authService } from '../../auth/auth.service';

export const useSubscription = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const prevStatusRef = useRef<string | undefined>(undefined);

  const SUPPORT_WHATSAPP = import.meta.env.VITE_SUPPORT_WHATSAPP;

  const { data: subStatus, isLoading: isStatusLoading } = useQuery({
    queryKey: ['subscription-status'],
    queryFn: subscriptionService.getStatus,
    refetchInterval: (query) => {
      // Polling a cada 10s se estiver pendente
      return query.state.data?.status === 'PENDING' ? 10000 : false;
    }
  });

  const isMissingBillingInfo = !subStatus?.taxId || !subStatus?.whatsappNumber;

  const { data: paymentHistory, isLoading: isHistoryLoading } = useQuery({
    queryKey: ['subscription-payments'],
    queryFn: subscriptionService.getPaymentHistory,
    refetchInterval: subStatus?.status === 'PENDING' ? 10000 : false,
  });

  useEffect(() => {
    // Detectar transição de PENDING para ACTIVE
    if (prevStatusRef.current === 'PENDING' && subStatus?.status === 'ACTIVE') {
      toast.success(t('subscription.billing.successTitle'), {
        duration: 8000,
        position: 'top-center',
      });
      setShowSuccessBanner(true);
      // Ocultar banner após 30 segundos
      setTimeout(() => setShowSuccessBanner(false), 30000);
    }
    prevStatusRef.current = subStatus?.status;
  }, [subStatus?.status, t]);

  const checkoutMutation = useMutation({
    mutationFn: subscriptionService.createCheckout,
    onSuccess: (data) => {
      // Navega para a página de resumo própria em vez de redirecionar direto
      navigate('/checkout', {
        state: {
          checkoutUrl: data.url,
          planName: data.planName,
          amount: data.amount,
          billingCycle: 'MONTHLY'
        }
      });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || t('common.error');
      toast.error(message);
    }
  });

  const updateBillingConfigMutation = useMutation({
    mutationFn: authService.updateConfig,
    onSuccess: () => {
      toast.success(t('subscription.billing.infoSaved'));
      setShowBillingModal(false);
      // Após salvar, dispara o checkout se for o plano PRO
      checkoutMutation.mutate();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t('common.error'));
    }
  });

  const handleUpdateBillingInfo = async (data: { taxId: string; whatsappNumber: string }) => {
    await updateBillingConfigMutation.mutateAsync(data);
  };

  const handlePlanAction = (planId: string) => {
    if (planId === 'PRO') {
      if (isMissingBillingInfo) {
        setShowBillingModal(true);
        return;
      }

      if (subStatus?.status === 'PENDING' && subStatus.checkoutUrl) {
        navigate('/checkout', {
          state: {
            checkoutUrl: subStatus.checkoutUrl,
            planName: subStatus.planName || t('subscription.plans.pro.name'),
            amount: subStatus.amount || 4990,
            billingCycle: 'MONTHLY'
          }
        });
      } else {
        checkoutMutation.mutate();
      }
    } else if (planId === 'ENTERPRISE') {
      const message = encodeURIComponent(t('subscription.enterpriseMessage'));
      window.open(`https://wa.me/${SUPPORT_WHATSAPP}?text=${message}`, '_blank');
    }
  };

  const handleDownloadPdf = async (paymentId: string) => {
    try {
      await subscriptionService.downloadInvoicePdf(paymentId);
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error(t('common.error'));
    }
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
      disabled: false,
      cta: subStatus?.plan === 'PRO'
        ? t('common.currentPlan')
        : subStatus?.status === 'PENDING'
          ? t('common.completePayment')
          : t('common.connect')
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

  return {
    subStatus,
    paymentHistory,
    isStatusLoading,
    isHistoryLoading,
    showSuccessBanner,
    plans,
    checkoutMutation,
    handlePlanAction,
    handleDownloadPdf,
    setShowSuccessBanner,
    isMissingBillingInfo,
    showBillingModal,
    setShowBillingModal,
    handleUpdateBillingInfo,
    updateBillingConfigMutation
  };
};
