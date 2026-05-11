import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  MessageCircle,
  ArrowUpRight,
  Phone,
  Loader2,
  Bot,
  Zap,
} from 'lucide-react';
import { PageLayout } from '../shared/ui/PageLayout';
import { Card } from '../shared/ui/Card';
import { Button } from '../shared/ui/Button';
import { dashboardService } from '../features/dashboard/dashboard.service';
import { authService } from '../features/auth/auth.service';
import { useState } from 'react';

export const DashboardPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showPhoneSuccess, setShowPhoneSuccess] = useState(false);

  const { data: dashboardStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardService.getStats,
  });

  const onboardingMutation = useMutation({
    mutationFn: (whatsappNumber: string) => authService.updateConfig({ whatsappNumber }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setShowPhoneSuccess(true);
      setTimeout(() => setShowPhoneSuccess(false), 3000);
    },
  });

  const statsList = [
    {
      label: t('dashboard.stats.confirmations'),
      value: dashboardStats?.totalConfirmations.toString() || '0',
      icon: CheckCircle2,
      change: dashboardStats?.confirmationsChange || '+0%',
      color: 'text-green-400'
    },
    {
      label: t('dashboard.stats.conversionRate'),
      value: dashboardStats?.conversionRate || '0%',
      icon: ArrowUpRight,
      change: dashboardStats?.conversionRateChange || '+0%',
      color: 'text-primary'
    },
    {
      label: t('dashboard.stats.replies'),
      value: dashboardStats?.managedReplies.toString() || '0',
      icon: MessageCircle,
      change: dashboardStats?.repliesChange || '+0%',
      color: 'text-secondary'
    },
  ];

  return (
    <PageLayout
      title={t('dashboard.title')}
      subtitle={t('dashboard.subtitle')}
    >
      {dashboardStats?.whatsappNumberMissing && (
        <Card variant="glass" className="mb-8 p-6 bg-primary/5 border-primary/20 border-2">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight">{t('dashboard.onboarding.phoneTitle')}</h2>
                <p className="text-sm text-muted-foreground">{t('dashboard.onboarding.phoneDescription')}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              {showPhoneSuccess ? (
                <div className="flex items-center gap-2 text-green-400 font-bold animate-in fade-in slide-in-from-right-4">
                  <CheckCircle2 className="w-5 h-5" />
                  {t('dashboard.onboarding.phoneSuccess')}
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder={t('dashboard.onboarding.phonePlaceholder')}
                    className="flex-1 md:w-64 bg-surface-low border border-outline-variant/30 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary/50"
                    id="onboarding-whatsapp"
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      const input = document.getElementById('onboarding-whatsapp') as HTMLInputElement;
                      if (input && input.value.length >= 10) {
                        onboardingMutation.mutate(input.value);
                      }
                    }}
                    disabled={onboardingMutation.isPending}
                  >
                    {onboardingMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('dashboard.onboarding.phoneButton')}
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {statsList.map((stat, i) => (
          <Card key={i} variant="glass" className="p-8 group hover:scale-[1.02] transition-all cursor-default min-w-0">
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 rounded-xl bg-surface-low border border-outline-variant/50 flex items-center justify-center group-hover:border-primary/30 transition-colors">
                <stat.icon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              {stat.change && (
                <span className={`text-xs font-bold px-2 py-1 rounded-full bg-surface-low border border-outline-variant/30 ${stat.color}`}>
                  {stat.change}
                </span>
              )}
            </div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">{stat.label}</h3>
            <p className="text-4xl font-extrabold tracking-tighter">{stat.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card variant="base" className="p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bot className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight">{t('dashboard.bot.title')}</h3>
              <p className="text-sm text-muted-foreground">{t('dashboard.bot.subtitle')}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            {t('dashboard.bot.description')}
          </p>
          <Button variant="secondary" className="w-full" onClick={() => window.location.href = '/bot-config'}>
            {t('dashboard.bot.button')}
          </Button>
        </Card>

        <Card variant="accent" className="p-8 relative overflow-hidden group">
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-xl bg-primary-dim flex items-center justify-center mb-6 shadow-xl shadow-primary-dim/40">
              <Zap className="w-6 h-6 text-primary-foreground fill-current" />
            </div>
            <h3 className="text-xl font-bold tracking-tight mb-3">{t('dashboard.whatsapp.title')}</h3>
            <p className="text-sm text-foreground/80 leading-relaxed mb-8">
              {t('dashboard.whatsapp.description')}
            </p>
            <Button
              className="w-full text-xs font-bold tracking-widest uppercase py-3 group-hover:scale-[1.02] transition-transform"
              onClick={() => window.location.href = '/whatsapp'}
            >
              {t('dashboard.whatsapp.button')}
            </Button>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
};
