import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Zap, ArrowRight, Lock, Key, Loader2, Mail } from 'lucide-react';
import { Button } from '../shared/ui/Button';
import { Input } from '../shared/ui/Input';
import { Card } from '../shared/ui/Card';
import { authService } from '../features/auth/auth.service';
import { useAuthStore } from '../features/auth/auth.store';
import { VerifyRegistrationInputSchema, type VerifyRegistrationInput } from '@shared/schemas/auth.schema';

export const EmailVerificationPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((state) => state.setAuth);
  const setCompanies = useAuthStore((state) => state.setCompanies);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const email = location.state?.email || '';

  useEffect(() => {
    if (!email) {
      navigate('/login');
    }
  }, [email, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyRegistrationInput>({
    resolver: zodResolver(VerifyRegistrationInputSchema),
    defaultValues: {
      email: email,
    }
  });

  const onVerify = async (data: VerifyRegistrationInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.verifyRegistration(data);
      setAuth(response.user!, response.token!);
      if (response.companies) setCompanies(response.companies);
      navigate(response.companies && response.companies.length > 0 ? '/select-company' : '/create-company');
    } catch (err: any) {
      setError(err.response?.data?.error || t('common.verificationFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 selection:bg-primary/20 selection:text-primary overflow-hidden relative">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] -z-10 pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[40%] bg-secondary/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

      {/* Hero Section */}
      <div className="hidden lg:flex flex-col justify-center p-16 xl:p-24 relative overflow-hidden bg-surface-dim/30 border-r border-outline-variant/30">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary-dim text-xs font-bold tracking-widest uppercase mb-8">
            <Zap className="w-3 h-3 fill-current" />
            {t('login.v2Live')}
          </div>
          
          <h1 className="text-6xl xl:text-7xl font-extrabold tracking-tighter leading-[0.9] mb-8 text-transparent bg-clip-text bg-gradient-to-br from-foreground to-foreground/50">
            {t('login.automateWhatsApp')} <br />
            {t('login.engagement')}
          </h1>
          
          <p className="text-xl text-muted-foreground leading-relaxed mb-12 font-medium">
            {t('login.heroDescription')}
          </p>
        </div>
      </div>

      {/* Form Section */}
      <div className="flex items-center justify-center p-8 lg:p-16">
        <Card variant="glass" className="w-full max-w-md p-10 border-outline-variant/50 relative overflow-hidden">
          <div className="mb-10 flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-pulse-gradient flex items-center justify-center shadow-2xl shadow-primary-dim/40 mb-6">
              <Mail className="w-6 h-6 text-primary-foreground" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight mb-2 text-center">
              {t('common.verifyEmail')}
            </h2>
            <p className="text-muted-foreground text-sm font-medium text-center">
              {t('common.verificationCodeSent')} <span className="text-foreground font-bold">{email}</span>
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium animate-shake text-center">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit(onVerify)}>
            <div className="relative">
              <Input
                {...register('code')}
                label={t('common.verificationCode')}
                placeholder="123456"
                className="pl-10 tracking-[0.5em] text-center font-bold text-xl"
                maxLength={6}
                error={errors.code?.message as string}
              />
              <Key className="absolute left-3 top-[38px] w-4 h-4 text-muted-foreground" />
            </div>

            <div className="relative">
              <Input
                {...register('password')}
                label={t('common.newPassword')}
                type="password"
                placeholder="••••••••"
                className="pl-10"
                error={errors.password?.message as string}
              />
              <Lock className="absolute left-3 top-[38px] w-4 h-4 text-muted-foreground" />
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
                  {t('common.verifyAndComplete')}
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground font-medium">
            {t('common.didntReceiveCode')}{' '}
            <button 
              type="button" 
              className="text-primary hover:text-primary-dim font-bold underline transition-colors decoration-2 underline-offset-4"
              onClick={() => navigate('/login')}
            >
              {t('common.backToLogin')}
            </button>
          </p>

          <div className="mt-12 flex items-center justify-center gap-6 opacity-30 text-[10px] font-bold tracking-widest uppercase">
            <a href="#" className="hover:text-foreground transition-colors">{t('common.privacyPolicy')}</a>
            <a href="#" className="hover:text-foreground transition-colors">{t('common.termsOfService')}</a>
          </div>
        </Card>
      </div>
    </div>
  );
};
