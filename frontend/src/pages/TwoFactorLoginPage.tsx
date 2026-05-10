import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Lock, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '../shared/ui/Button';
import { Input } from '../shared/ui/Input';
import { Card } from '../shared/ui/Card';
import { authService } from '../features/auth/auth.service';
import { useAuthStore } from '../features/auth/auth.store';

const TwoFactorSchema = z.object({
  code: z.string().length(6, { message: 'Code must be exactly 6 digits' }).regex(/^\d+$/, { message: 'Code must contain only numbers' }),
});

type TwoFactorInput = z.infer<typeof TwoFactorSchema>;

export const TwoFactorLoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const tempToken = location.state?.tempToken;

  useEffect(() => {
    if (!tempToken) {
      console.error('[TwoFactorLoginPage] No tempToken found in state, redirecting to login');
      navigate('/login');
    }
  }, [tempToken, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TwoFactorInput>({
    resolver: zodResolver(TwoFactorSchema),
  });

  const onVerify = async (data: TwoFactorInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.verify2FA(tempToken, data.code);
      
      setAuth(response.user!, response.token!);
      navigate('/select-company');
    } catch (err: any) {
      setError(err.response?.data?.error || t('settings.twoFactorLogin.invalidCode'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!tempToken) return null;

  return (
    <div className="min-h-screen grid lg:grid-cols-2 selection:bg-primary/20 selection:text-primary overflow-hidden relative">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] -z-10 pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[40%] bg-secondary/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

      {/* Hero Section */}
      <div className="hidden lg:flex flex-col justify-center p-16 xl:p-24 relative overflow-hidden bg-surface-dim/30 border-r border-outline-variant/30">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary-dim text-xs font-bold tracking-widest uppercase mb-8">
            <ShieldCheck className="w-3 h-3 fill-current" />
            SECURE ACCESS
          </div>
          
          <h1 className="text-6xl xl:text-7xl font-extrabold tracking-tighter leading-[0.9] mb-8 text-transparent bg-clip-text bg-gradient-to-br from-foreground to-foreground/50">
            {t('settings.twoFactorLogin.title')}
          </h1>
          
          <p className="text-xl text-muted-foreground leading-relaxed mb-12 font-medium">
            {t('settings.twoFactorLogin.subtitle')}
          </p>
        </div>
      </div>

      {/* Form Section */}
      <div className="flex items-center justify-center p-8 lg:p-16">
        <Card variant="glass" className="w-full max-w-md p-10 border-outline-variant/50 relative overflow-hidden">
          <div className="mb-10 flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-pulse-gradient flex items-center justify-center shadow-2xl shadow-primary-dim/40 mb-6">
              <Lock className="w-6 h-6 text-primary-foreground fill-current" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight mb-2 text-center text-foreground">
              {t('settings.twoFactorLogin.title')}
            </h2>
            <p className="text-muted-foreground text-sm font-medium text-center">
              {t('settings.twoFactorLogin.subtitle')}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium animate-shake text-center">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <form className="space-y-4" onSubmit={handleSubmit(onVerify)}>
              <div className="relative">
                <Input
                  {...register('code')}
                  label={t('common.verificationCode')}
                  placeholder={t('settings.twoFactorLogin.placeholder')}
                  className="pl-10 text-center text-2xl tracking-[0.5em] font-mono"
                  error={errors.code?.message}
                  maxLength={6}
                  autoComplete="one-time-code"
                  inputMode="numeric"
                />
                <ShieldCheck className="absolute left-3 top-[38px] w-4 h-4 text-muted-foreground" />
              </div>

              <Button 
                type="submit"
                className="w-full h-12 text-sm font-bold tracking-wide uppercase group" 
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {t('settings.twoFactorLogin.verifyButton')}
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground font-medium">
              <button 
                type="button" 
                className="text-primary hover:text-primary-dim font-bold underline transition-colors decoration-2 underline-offset-4"
                onClick={() => navigate('/login')}
              >
                {t('common.backToLogin')}
              </button>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
