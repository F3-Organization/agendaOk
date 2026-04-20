import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { subscriptionService, type Plan } from '../subscription.service';
import { authService } from '../../auth/auth.service';

export const useSubscription = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const prevStatusRef = useRef<string | undefined>(undefined);

  const SUPPORT_WHATSAPP = import.meta.env.VITE_SUPPORT_WHATSAPP;

  const { data: plans = [], isLoading: isPlansLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: subscriptionService.getPlans,
    staleTime: 5 * 60 * 1000,
  });

  const { data: subStatus, isLoading: isStatusLoading, isFetching: isStatusFetching } = useQuery({
    queryKey: ['subscription-status'],
    queryFn: subscriptionService.getStatus,
    refetchInterval: (query) => {
      // Polling a cada 10s se estiver pendente
      return query.state.data?.status === 'PENDING' ? 10000 : false;
    }
  });

  // Só considera faltando se já carregou os dados e eles realmente não existem
  const isMissingBillingInfo = !isStatusLoading && !isStatusFetching && (!subStatus?.taxId || !subStatus?.whatsappNumber);

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
    onSuccess: async () => {
      toast.success(t('subscription.billing.infoSaved'));
      
      // Invalida e força o refetch imediato do status para garantir que isMissingBillingInfo seja atualizado
      await queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
      await queryClient.refetchQueries({ queryKey: ['subscription-status'] });
      
      setShowBillingModal(false);
      
      // Após salvar e atualizar o estado local, dispara o checkout se for o plano PRO
      checkoutMutation.mutate();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t('common.error'));
    }
  });

  const handleUpdateBillingInfo = async (data: { taxId: string; whatsappNumber: string }) => {
    await updateBillingConfigMutation.mutateAsync(data);
  };

  const handlePlanAction = (planSlug: string) => {
    const plan = plans.find(p => p.slug === planSlug);

    if (plan?.isPurchasable) {
      if (isStatusLoading || isStatusFetching) return;

      if (isMissingBillingInfo) {
        setShowBillingModal(true);
        return;
      }

      if (subStatus?.status === 'PENDING' && subStatus.checkoutUrl) {
        navigate('/checkout', {
          state: {
            checkoutUrl: subStatus.checkoutUrl,
            planName: subStatus.planName || plan.name,
            amount: subStatus.amount || plan.priceInCents,
            billingCycle: 'MONTHLY'
          }
        });
      } else {
        checkoutMutation.mutate();
      }
    } else if (plan && !plan.isPurchasable && plan.slug !== 'FREE') {
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

  const mappedPlans = plans.map((plan: Plan) => {
    const isCurrent = subStatus?.plan === plan.slug || (!subStatus && plan.slug === 'FREE');
    const priceDisplay = plan.priceInCents === 0
      ? 'R$ 0'
      : `R$ ${Math.floor(plan.priceInCents / 100)}`;

    let cta: string;
    if (isCurrent) {
      cta = t('common.currentPlan');
    } else if (plan.isPurchasable) {
      cta = subStatus?.status === 'PENDING' ? t('common.completePayment') : t('common.connect');
    } else {
      cta = plan.slug === 'FREE' ? t('common.currentPlan') : t('common.contactSales');
    }

    return {
      id: plan.slug,
      name: plan.name,
      price: priceDisplay,
      description: plan.description || '',
      features: plan.features,
      messageLimit: plan.messageLimit,
      isPurchasable: plan.isPurchasable,
      current: isCurrent,
      cta,
    };
  });

  return {
    subStatus,
    paymentHistory,
    isStatusLoading: isStatusLoading || isPlansLoading,
    isHistoryLoading,
    showSuccessBanner,
    plans: mappedPlans,
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

