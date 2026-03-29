import { useTranslation } from 'react-i18next';
import { Zap, ArrowRight } from 'lucide-react';
import { Button } from '../shared/ui/Button';
import { Input } from '../shared/ui/Input';
import { Card } from '../shared/ui/Card';

export const LoginPage = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen grid lg:grid-cols-2 selection:bg-primary/20 selection:text-primary overflow-hidden relative">
      {/* Decorative Orbs */}
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
            {t('login.heroTitle').split('.').length > 1 ? (
              <>
                {t('login.heroTitle').split(' ').slice(0, 3).join(' ')} <br />
                {t('login.heroTitle').split(' ').slice(3, 5).join(' ')} <br />
                <span className="text-primary-dim">{t('login.heroTitle').split(' ').slice(5).join(' ')}</span>
              </>
            ) : t('login.heroTitle')}
          </h1>
          
          <p className="text-xl text-muted-foreground leading-relaxed mb-12 font-medium">
            {t('login.heroSubtitle')}
          </p>

          <footer className="flex items-center gap-8 mt-12 opacity-40 grayscale transition-all hover:grayscale-0 hover:opacity-100">
            <span className="text-xs font-bold tracking-widest uppercase">{t('login.trustedBy')}</span>
          </footer>
        </div>
      </div>

      {/* Form Section */}
      <div className="flex items-center justify-center p-8 lg:p-16">
        <Card variant="glass" className="w-full max-w-md p-10 border-outline-variant/50 relative overflow-hidden">
          <div className="mb-10 flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-pulse-gradient flex items-center justify-center shadow-2xl shadow-primary-dim/40 mb-6">
              <Zap className="w-6 h-6 text-primary-foreground fill-current" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight mb-2">{t('common.welcomeBack')}</h2>
            <p className="text-muted-foreground text-sm font-medium">
              {t('common.pleaseEnterDetails')}
            </p>
          </div>

          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-4">
              <Input
                label={t('common.email')}
                type="email"
                placeholder="felipe@example.com"
                required
              />
              <div className="space-y-1">
                <Input
                  label={t('common.password')}
                  type="password"
                  placeholder="••••••••"
                  required
                />
                <div className="flex justify-end px-1">
                  <button type="button" className="text-xs text-primary hover:text-primary-dim font-semibold transition-colors">
                    {t('common.forgotPassword')}
                  </button>
                </div>
              </div>
            </div>

            <Button 
              className="w-full h-12 text-sm font-bold tracking-wide uppercase" 
              size="lg"
              onClick={() => window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/auth/google`}
            >
              {t('common.signIn')}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-outline-variant/30"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-widest">
                <span className="bg-transparent px-2 text-muted-foreground font-semibold">{t('login.limitedAccess')}</span>
              </div>
            </div>

            <p className="text-center text-sm text-muted-foreground font-medium">
              {t('common.dontHaveAccount')}{' '}
              <button type="button" className="text-primary hover:text-primary-dim font-bold underline transition-colors decoration-2 underline-offset-4">
                {t('common.requestAccess')}
              </button>
            </p>
          </form>

          <div className="mt-12 flex items-center justify-center gap-6 opacity-30 text-[10px] font-bold tracking-widest uppercase">
            <a href="#" className="hover:text-foreground transition-colors">{t('common.privacyPolicy')}</a>
            <a href="#" className="hover:text-foreground transition-colors">{t('common.termsOfService')}</a>
          </div>
        </Card>
      </div>
    </div>
  );
};
