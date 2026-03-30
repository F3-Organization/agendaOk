import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Zap, Check, ArrowRight, Calendar, MessageSquare, BarChart3, Globe, Shield, Sparkles, Layers, ShieldCheck, ZapOff } from 'lucide-react';
import { Button } from '../shared/ui/Button';
import { Card } from '../shared/ui/Card';
import { useAuthStore } from '../features/auth/auth.store';

const HeroVisual = () => (
  <div className="relative w-full max-w-xl mx-auto aspect-square flex items-center justify-center scale-75 md:scale-100">
    {/* Bottom Layer - Solid with Texture/Gradient */}
    <div 
      className="absolute w-80 h-80 rounded-[40px] rotate-[-25deg] skew-x-[15deg] translate-y-20 bg-pulse-gradient shadow-2xl shadow-primary/40 overflow-hidden"
      style={{
        backgroundImage: 'linear-gradient(135deg, #8b4ef7 0%, #be9dff 100%)',
      }}
    >
      <div className="absolute inset-0 opacity-40 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
      <div className="absolute inset-x-0 top-0 h-full bg-gradient-to-t from-transparent via-white/5 to-white/10" />
    </div>

    {/* Top Layer - Wireframe/Hollow */}
    <div className="absolute w-80 h-80 rounded-[40px] rotate-[-25deg] skew-x-[15deg] -translate-y-20 border-[3px] border-primary/30 bg-primary/5 backdrop-blur-sm flex items-center justify-center group overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
        <Zap className="w-24 h-24 text-primary fill-primary/20 drop-shadow-glow animate-pulse" />
        
        {/* Animated Particles inside the wireframe */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(6)].map((_, i) => (
                <div 
                    key={i}
                    className="absolute w-1 h-1 bg-primary rounded-full animate-ping opacity-20"
                    style={{
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 2}s`
                    }}
                />
            ))}
        </div>
    </div>
    
    {/* Floating Connecting Lines (Dashed) */}
    <svg className="absolute inset-0 w-full h-full -z-10 opacity-30" viewBox="0 0 500 500">
        <path d="M250,150 L250,350" stroke="currentColor" strokeWidth="2" strokeDasharray="8 8" className="text-primary-dim" />
        <path d="M150,250 L350,250" stroke="currentColor" strokeWidth="2" strokeDasharray="8 8" className="text-primary-dim" />
    </svg>
  </div>
);

export const LandingPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary overflow-x-hidden">
      {/* Background Orbs */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] -z-10 pointer-events-none animate-pulse" />
      <div className="fixed bottom-[-5%] right-[-5%] w-[40%] h-[40%] bg-secondary/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-outline-variant/30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 rounded-xl bg-pulse-gradient flex items-center justify-center shadow-lg shadow-primary-dim/20 transition-transform group-hover:scale-110">
              <Zap className="w-5 h-5 text-primary-foreground fill-current" />
            </div>
            <span className="text-xl font-extrabold tracking-tighter">ConfirmaZap</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-bold tracking-widest uppercase">
            <button onClick={() => scrollToSection('features')} className="text-muted-foreground hover:text-foreground transition-colors">
              {t('landing.footerProduct')}
            </button>
            <button onClick={() => scrollToSection('pricing')} className="text-muted-foreground hover:text-foreground transition-colors">
              {t('landing.pricingTitle')}
            </button>
            <div className="h-4 w-[1px] bg-outline-variant/50" />
            <span className="text-primary-dim">{t('landing.multiTenantTitle')}</span>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Button onClick={() => navigate('/dashboard')} variant="secondary" size="sm" className="font-bold tracking-widest uppercase text-[10px]">
                {t('common.dashboard')}
                <ArrowRight className="w-3 h-3 ml-2" />
              </Button>
            ) : (
              <Button onClick={() => navigate('/login')} className="font-bold tracking-widest uppercase text-[10px]">
                {t('common.signIn')}
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-6">
        <div className="max-w-7xl mx-auto text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pulse-gradient/10 border border-primary/20 text-primary-dim text-[10px] font-bold tracking-widest uppercase mb-10">
            <Layers className="w-3.5 h-3.5" />
            {t('landing.multiTenantTitle')}
          </div>
          
          <h1 className="text-6xl md:text-9xl font-extrabold tracking-tighter leading-[0.8] mb-10 text-transparent bg-clip-text bg-gradient-to-br from-foreground to-foreground/30 max-w-5xl mx-auto">
            {t('landing.heroTitle')}
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed mb-14 font-medium max-w-3xl mx-auto">
            {t('landing.heroSubtitle')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mb-24">
            <Button size="lg" className="h-16 px-12 text-base font-bold tracking-wide uppercase group shadow-2xl shadow-primary-dim/30" onClick={() => navigate('/login')}>
              {t('landing.ctaStartNow')}
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <div className="text-sm font-bold tracking-widest uppercase text-muted-foreground/60 transition-colors hover:text-muted-foreground">
              {t('landing.ctaTryFree')}
            </div>
          </div>

          {/* Corrected Hero Visual (3D Stack Component) */}
          <HeroVisual />
        </div>
      </section>

      {/* Multi-tenant Architecture Context Section */}
      <section className="py-32 px-6 bg-surface-container-low/30 border-y border-outline-variant/30 overflow-hidden relative">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-20 items-center">
            <div className="relative">
                <div className="absolute top-0 left-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] -z-10" />
                <h2 className="text-4xl md:text-6xl font-extrabold tracking-tighter mb-8 max-w-md">
                    {t('landing.multiTenantTitle')}
                </h2>
                <p className="text-xl text-muted-foreground font-medium leading-relaxed mb-10">
                    {t('landing.multiTenantDesc')}
                </p>
                <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-4 group">
                        <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center border border-primary/10 transition-colors group-hover:bg-primary/20">
                            <ShieldCheck className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <span className="text-sm font-bold tracking-widest uppercase mb-1 block">Data Isolation</span>
                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Independent environments for every clinic</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <Card variant="glass" className="p-1 pb-0 border-outline-variant/50 overflow-hidden">
                <div className="p-8 pb-0">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-3 h-3 rounded-full bg-red-400" />
                        <div className="w-3 h-3 rounded-full bg-amber-400" />
                        <div className="w-3 h-3 rounded-full bg-emerald-400" />
                    </div>
                    <div className="space-y-4 font-mono text-xs text-muted-foreground/60">
                        <div className="flex gap-4"><span className="text-primary-dim">CONF_TENANT_ISOLATION</span>=true</div>
                        <div className="flex gap-4"><span className="text-primary-dim">CONF_MULTI_DB</span>=active</div>
                        <div className="flex gap-4"><span className="text-primary-dim">CONF_SCALE_STRATEGY</span>=elastic</div>
                        <div className="w-full h-80 bg-surface-container mt-8 rounded-t-xl border-t border-x border-outline-variant/50 p-6">
                             <div className="w-full h-full rounded-lg border border-dashed border-outline-variant/50 flex items-center justify-center">
                                 <span className="text-[10px] uppercase tracking-widest font-bold font-display opacity-20">Monitoring Cluster_01</span>
                             </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter mb-4">
              {t('landing.featuresTitle')}
            </h2>
            <p className="text-xl text-muted-foreground font-medium max-w-2xl">
              {t('landing.featuresSubtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card variant="glass" className="p-10 border-outline-variant/40 hover:scale-105 transition-transform group">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-8 border border-primary/20 group-hover:bg-primary/20 transition-colors">
                <Calendar className="w-7 h-7 text-primary-dim" />
              </div>
              <h3 className="text-2xl font-bold mb-4 tracking-tight">{t('landing.calendarSyncTitle')}</h3>
              <p className="text-muted-foreground leading-relaxed font-medium">
                {t('landing.calendarSyncDesc')}
              </p>
            </Card>

            <Card variant="glass" className="p-10 border-outline-variant/40 hover:scale-105 transition-transform group">
              <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mb-8 border border-secondary/20 group-hover:bg-secondary/20 transition-colors">
                <MessageSquare className="w-7 h-7 text-secondary" />
              </div>
              <h3 className="text-2xl font-bold mb-4 tracking-tight">{t('landing.whatsappAutoTitle')}</h3>
              <p className="text-muted-foreground leading-relaxed font-medium">
                {t('landing.whatsappAutoDesc')}
              </p>
            </Card>

            <Card variant="glass" className="p-10 border-outline-variant/40 hover:scale-105 transition-transform group">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-8 border border-primary/20 group-hover:bg-primary/20 transition-colors">
                <BarChart3 className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4 tracking-tight">{t('landing.dashboardTitle')}</h3>
              <p className="text-muted-foreground leading-relaxed font-medium">
                {t('landing.dashboardDesc')}
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 px-6 bg-surface-dim/30 border-y border-outline-variant/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 flex flex-col items-center">
            <h2 className="text-4xl md:text-6xl font-extrabold tracking-tighter mb-4">
              {t('landing.pricingTitle')}
            </h2>
            <p className="text-xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
              {t('landing.pricingSubtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto relative">
            {/* Pulsing glow behind pricing */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/5 rounded-full blur-[140px] pointer-events-none -z-10" />

            {/* Free Plan */}
            <Card variant="glass" className="p-12 border-outline-variant/40 flex flex-col bg-surface-container-low/20">
              <div className="mb-10">
                <h3 className="text-2xl font-bold tracking-tight mb-2 uppercase text-[10px] text-muted-foreground tracking-[5px]">{t('landing.plans.free')}</h3>
                <div className="mt-8 flex items-baseline gap-1">
                  <span className="text-6xl font-extrabold tracking-tighter">$0</span>
                  <span className="text-muted-foreground font-bold tracking-widest uppercase text-[10px]">/mo</span>
                </div>
              </div>
              
              <ul className="space-y-6 mb-12 flex-1">
                <li className="flex items-center gap-4 text-sm font-medium">
                  <Check className="w-4 h-4 text-primary" /> {t('landing.plans.remindersPerMonth')}
                </li>
                <li className="flex items-center gap-4 text-sm font-medium">
                  <Check className="w-4 h-4 text-primary" /> {t('landing.calendarSyncTitle')}
                </li>
                <li className="flex items-center gap-4 text-sm font-medium opacity-20 grayscale">
                  <ZapOff className="w-4 h-4" /> {t('landing.plans.customTemplates')}
                </li>
              </ul>

              <Button variant="secondary" className="w-full h-14 font-bold tracking-widest uppercase text-xs" onClick={() => navigate('/login')}>
                {t('landing.ctaStartNow')}
              </Button>
            </Card>

            {/* Pro Plan */}
            <Card variant="glass" className="p-12 border-primary/20 relative flex flex-col bg-pulse-gradient/5">
              <div className="absolute top-0 right-12 px-5 py-2 bg-pulse-gradient rounded-b-2xl text-[10px] font-extrabold tracking-[3px] uppercase text-white shadow-xl shadow-primary-dim/20">
                ELITE
              </div>
              <div className="mb-10">
                <h3 className="text-2xl font-bold tracking-tight mb-2 uppercase text-[10px] text-primary-dim tracking-[5px]">{t('landing.plans.pro')}</h3>
                <div className="mt-8 flex items-baseline gap-1">
                  <span className="text-6xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-primary-dim to-primary-container">$49</span>
                  <span className="text-muted-foreground font-bold tracking-widest uppercase text-[10px]">/mo</span>
                </div>
              </div>
              
              <ul className="space-y-6 mb-12 flex-1">
                <li className="flex items-center gap-4 text-sm font-bold text-primary-dim italic">
                   <Sparkles className="w-4 h-4 fill-current" /> Everything in Free, plus:
                </li>
                <li className="flex items-center gap-4 text-sm font-medium">
                  <Check className="w-4 h-4 text-primary" /> {t('landing.plans.unlimitedReminders')}
                </li>
                <li className="flex items-center gap-4 text-sm font-medium">
                  <Check className="w-4 h-4 text-primary" /> {t('landing.plans.customTemplates')}
                </li>
                <li className="flex items-center gap-4 text-sm font-medium">
                  <Check className="w-4 h-4 text-primary" /> {t('landing.plans.prioritySupport')}
                </li>
              </ul>

              <Button className="w-full h-14 font-bold tracking-widest uppercase text-xs shadow-2xl shadow-primary-dim/30" onClick={() => navigate('/login')}>
                {t('landing.ctaStartNow')}
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-24 px-6 border-t border-outline-variant/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-12 mb-24">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-8">
                <div className="w-10 h-10 rounded-xl bg-pulse-gradient flex items-center justify-center shadow-lg">
                  <Zap className="w-5 h-5 text-primary-foreground fill-current" />
                </div>
                <span className="text-2xl font-extrabold tracking-tighter">ConfirmaZap</span>
              </div>
              <p className="text-muted-foreground leading-relaxed max-w-sm font-medium italic mb-2">
                {t('login.heroDescription')}
              </p>
              <span className="text-[10px] font-bold tracking-widest uppercase text-primary-dim block">{t('landing.multiTenantTitle')}</span>
            </div>
            
            <div className="hidden md:block" />

            <div>
              <h4 className="text-[10px] font-bold tracking-[3px] uppercase mb-8 text-muted-foreground/60">{t('landing.footerProduct')}</h4>
              <ul className="space-y-4 text-sm text-muted-foreground font-medium uppercase tracking-wider">
                <li><a href="#" className="hover:text-primary transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">API</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-[10px] font-bold tracking-[3px] uppercase mb-8 text-muted-foreground/60">{t('landing.footerLegal')}</h4>
              <ul className="space-y-4 text-sm text-muted-foreground font-medium uppercase tracking-wider">
                <li><a href="#" className="hover:text-primary transition-colors">{t('common.privacyPolicy')}</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">{t('common.termsOfService')}</a></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-12 border-t border-outline-variant/10 opacity-30 text-[9px] font-bold tracking-widest uppercase">
            <span>© 2026 ConfirmaZap. {t('landing.footerLegal')} Reservados.</span>
            <div className="flex gap-10">
              <a href="#" className="hover:text-foreground transition-colors">Twitter</a>
              <a href="#" className="hover:text-foreground transition-colors">LinkedIn</a>
              <a href="#" className="hover:text-foreground transition-colors">YouTube</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
