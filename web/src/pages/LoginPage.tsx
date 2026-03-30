import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Zap, ArrowRight, Mail, Lock, User as UserIcon, Loader2 } from 'lucide-react';
import { Button } from '../shared/ui/Button';
import { Input } from '../shared/ui/Input';
import { Card } from '../shared/ui/Card';
import { authService } from '../features/auth/auth.service';
import { useAuthStore } from '../features/auth/auth.store';
import { LoginInputSchema, RegisterInputSchema, type LoginInput, type RegisterInput } from '@shared/schemas/auth.schema';

export const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register: loginRegister,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginInputSchema),
  });

  const {
    register: signupRegister,
    handleSubmit: handleSignupSubmit,
    formState: { errors: signupErrors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterInputSchema),
  });

  const onLogin = async (data: LoginInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login(data);
      setAuth(response.user, response.token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || t('common.loginFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const onSignup = async (data: RegisterInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.register(data);
      
      if (response.status === 'PENDING_VERIFICATION') {
        navigate('/auth/verify', { state: { email: data.email } });
        return;
      }

      setAuth(response.user, response.token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || t('common.registrationFailed'));
    } finally {
      setIsLoading(false);
    }
  };


  const handleGoogleLogin = () => {
    window.location.href = authService.getAuthUrl().url;
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 selection:bg-primary/20 selection:text-primary overflow-hidden relative">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] -z-10 pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[40%] bg-secondary/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

      {/* Hero Section */}
      <div className="hidden lg:flex flex-col justify-center p-16 xl:p-24 relative overflow-hidden bg-surface-dim/30 border-r border-outline-variant/30">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary-dim text-xs font-bold tracking-widest uppercase mb-8">
            < Zap className="w-3 h-3 fill-current" />
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
              <Zap className="w-6 h-6 text-primary-foreground fill-current" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight mb-2 text-center">
              {isRegister ? t('common.createAccount') : t('common.welcomeBack')}
            </h2>
            <p className="text-muted-foreground text-sm font-medium text-center">
              {isRegister 
                ? t('common.joinConfirmaZap')
                : t('common.pleaseEnterDetails')}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium animate-shake text-center">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <form 
              className="space-y-4" 
              onSubmit={isRegister ? handleSignupSubmit(onSignup) : handleLoginSubmit(onLogin)}
            >
              {isRegister && (
                <div className="relative">
                  <Input
                    {...signupRegister('name')}
                    label={t('common.fullName')}
                    placeholder="John Doe"
                    className="pl-10"
                    error={signupErrors.name?.message as string}
                  />
                  <UserIcon className="absolute left-3 top-[38px] w-4 h-4 text-muted-foreground" />
                </div>
              )}

              <div className="relative">
                <Input
                  {...(isRegister ? signupRegister('email') : loginRegister('email'))}
                  label={t('common.email')}
                  type="email"
                  placeholder="felipe@example.com"
                  className="pl-10"
                  error={(isRegister ? signupErrors.email?.message : loginErrors.email?.message) as string}
                />
                <Mail className="absolute left-3 top-[38px] w-4 h-4 text-muted-foreground" />
              </div>

              <div className="space-y-1 relative">
                <Input
                  {...(isRegister ? signupRegister('password') : loginRegister('password'))}
                  label={t('common.password')}
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  error={(isRegister ? signupErrors.password?.message : loginErrors.password?.message) as string}
                />
                <Lock className="absolute left-3 top-[38px] w-4 h-4 text-muted-foreground" />
                
                {!isRegister && (
                  <div className="flex justify-end px-1">
                    <button type="button" className="text-xs text-primary hover:text-primary-dim font-semibold transition-colors">
                      {t('common.forgotPassword')}
                    </button>
                  </div>
                )}
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
                    {isRegister ? t('common.signUp') : t('common.signIn')}
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-outline-variant/30"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-widest">
                <span className="bg-[#0a0a0c] px-4 text-muted-foreground font-semibold">
                    {t('common.orContinueWith')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <Button 
                variant="secondary" 
                className="h-12 text-xs font-bold tracking-widest uppercase border border-outline-variant/50 hover:bg-surface-high transition-all flex items-center justify-center gap-3"
                onClick={handleGoogleLogin}
                disabled={isLoading}
              >
                <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center p-1">
                   <svg viewBox="0 0 24 24" className="w-full h-full">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                   </svg>
                </div>
                Google
              </Button>
            </div>

            <p className="text-center text-sm text-muted-foreground font-medium">
              {isRegister ? t('common.alreadyHaveAccount') : t('common.dontHaveAccount')}{' '}
              <button 
                type="button" 
                className="text-primary hover:text-primary-dim font-bold underline transition-colors decoration-2 underline-offset-4"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError(null);
                }}
              >
                {isRegister ? t('common.signIn') : t('common.signUp')}
              </button>
            </p>
          </div>

          <div className="mt-12 flex items-center justify-center gap-6 opacity-30 text-[10px] font-bold tracking-widest uppercase">
            <a href="#" className="hover:text-foreground transition-colors">{t('common.privacyPolicy')}</a>
            <a href="#" className="hover:text-foreground transition-colors">{t('common.termsOfService')}</a>
          </div>
        </Card>
      </div>
    </div>
  );
};
