import { useTranslation } from 'react-i18next';
import { AlertTriangle, Zap, ArrowRight, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from './Button';

interface UsageBannerProps {
  plan: string;
  count: number;
}

export const UsageBanner = ({ plan, count }: UsageBannerProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const safeCount = Number(count) || 0;

  if (plan !== 'FREE' || safeCount < 40) return null;

  const isLimitReached = safeCount >= 50;

  return (
    <div className={`transition-all duration-500 border-b backdrop-blur-md sticky top-0 z-[100] ${
      isLimitReached 
        ? 'bg-red-500/10 border-red-500/20 text-red-200' 
        : 'bg-primary/10 border-primary/20 text-primary-dim'
    }`}>
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-6 md:px-10">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            isLimitReached ? 'bg-red-500/20' : 'bg-primary/20'
          }`}>
            {isLimitReached ? <Lock className="w-4 h-4 shadow-[0_0_10px_rgba(239,68,68,0.5)]" /> : <AlertTriangle className="w-4 h-4" />}
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight leading-tight">
              {isLimitReached 
                ? t('subscription.usage.limitReachedTitle') 
                : t('subscription.usage.limitWarningTitle', { count: 50 - safeCount })}
            </p>
            <p className="text-[10px] opacity-70 font-medium tracking-tight truncate max-w-[200px] sm:max-w-none">
              {isLimitReached 
                ? t('subscription.usage.limitReachedDesc') 
                : t('subscription.usage.limitWarningDesc')}
            </p>
          </div>
        </div>

        <Button 
          size="sm" 
          variant={isLimitReached ? 'primary' : 'secondary'}
          className={`group h-8 text-[9px] font-black tracking-[0.1em] uppercase shadow-lg shadow-black/20 ${isLimitReached ? 'shadow-red-500/20 px-6' : 'px-4'}`}
          onClick={() => navigate('/subscription')}
        >
          <Zap className={`w-3 h-3 mr-2 ${isLimitReached ? 'fill-current' : ''}`} />
          {t('subscription.usage.upgradeButton')}
          <ArrowRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </div>
  );
};
