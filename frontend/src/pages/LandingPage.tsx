import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Zap, Check, ArrowRight, Calendar, MessageSquare, BarChart3, ShieldCheck, ZapOff, Sparkles, Bot, Brain, Clock, Users, MessageCircle, Send } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Button } from '../shared/ui/Button';
import { Card } from '../shared/ui/Card';
import { useAuthStore } from '../features/auth/auth.store';
import { subscriptionService } from '../features/subscription/subscription.service';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* ── Floating Chat Bubble Visual ── */
const ChatBubble = ({ children, align = 'left', delay = '0s' }: { children: React.ReactNode; align?: 'left' | 'right'; delay?: string }) => (
  <div
    className={cn(
      "max-w-[280px] px-4 py-3 rounded-2xl text-sm leading-relaxed animate-fade-in-up",
      align === 'left'
        ? 'bg-surface-high/80 border border-outline-variant/20 rounded-bl-sm self-start'
        : 'bg-gradient-to-br from-primary/90 to-primary-dim/90 text-white rounded-br-sm self-end'
    )}
    style={{ animationDelay: delay }}
  >
    {children}
  </div>
);

/* ── Hero Chat Demo ── */
const HeroChatDemo = () => (
  <div className="relative w-full max-w-md mx-auto">
    {/* Phone frame */}
    <div className="bg-surface-container/80 rounded-3xl border border-outline-variant/30 shadow-2xl shadow-primary/10 overflow-hidden backdrop-blur-sm">
      {/* WhatsApp header */}
      <div className="bg-surface-high/90 px-5 py-4 flex items-center gap-3 border-b border-outline-variant/20">
        <div className="w-10 h-10 rounded-full bg-pulse-gradient flex items-center justify-center shadow-lg">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">ConfirmaZap Bot</p>
          <p className="text-[10px] text-green-400 font-medium">● online</p>
        </div>
      </div>

      {/* Chat messages */}
      <div className="p-5 space-y-3 flex flex-col min-h-[320px]">
        <ChatBubble align="right" delay="0.2s">
          Olá, quero marcar uma consulta com a Dra. Ana para terça-feira 🙏
        </ChatBubble>
        <ChatBubble align="left" delay="0.8s">
          <span className="flex items-center gap-1.5 text-primary-dim font-bold text-[10px] uppercase tracking-wider mb-1">
            <Sparkles className="w-3 h-3" /> Bot IA
          </span>
          Olá! 😊 A Dra. Ana tem os seguintes horários disponíveis na terça:
          <br /><br />
          🕐 09:00 — 09:30<br />
          🕐 11:00 — 11:30<br />
          🕐 15:00 — 15:30<br />
          <br />
          Qual horário é melhor para você?
        </ChatBubble>
        <ChatBubble align="right" delay="1.4s">
          15h por favor!
        </ChatBubble>
        <ChatBubble align="left" delay="2s">
          <span className="flex items-center gap-1.5 text-primary-dim font-bold text-[10px] uppercase tracking-wider mb-1">
            <Sparkles className="w-3 h-3" /> Bot IA
          </span>
          ✅ Consulta agendada!<br />
          <br />
          📋 Dra. Ana Silva<br />
          📅 Terça, 22 de abril<br />
          🕐 15:00 — 15:30<br />
          <br />
          Enviaremos um lembrete no dia. Até lá! 💜
        </ChatBubble>
      </div>

      {/* Input area */}
      <div className="px-4 py-3 border-t border-outline-variant/20 flex items-center gap-2">
        <div className="flex-1 bg-surface-low/50 rounded-full px-4 py-2.5 text-xs text-muted-foreground/40">
          Digite uma mensagem...
        </div>
        <div className="w-9 h-9 rounded-full bg-pulse-gradient flex items-center justify-center">
          <Send className="w-4 h-4 text-white" />
        </div>
      </div>
    </div>

    {/* Decorative glow */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-primary/8 rounded-full blur-[100px] -z-10 pointer-events-none" />
  </div>
);

export const LandingPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const { data: apiPlans = [] } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: subscriptionService.getPlans,
    staleTime: 5 * 60 * 1000,
  });

  const freePlan = apiPlans.find(p => p.slug === 'FREE');
  const proPlan = apiPlans.find(p => p.slug === 'PRO');
  const freePrice = freePlan ? 'R$ 0' : 'R$ 0';
  const proPrice = proPlan ? `R$ ${Math.floor(proPlan.priceInCents / 100)}` : 'R$ 49';
  const freeFeatures = freePlan?.features ?? [];
  const proFeatures = proPlan?.features ?? [];

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
            <button onClick={() => scrollToSection('ai-bot')} className="text-muted-foreground hover:text-foreground transition-colors">
              Bot IA
            </button>
            <button onClick={() => scrollToSection('features')} className="text-muted-foreground hover:text-foreground transition-colors">
              {t('landing.footerProduct')}
            </button>
            <button onClick={() => scrollToSection('pricing')} className="text-muted-foreground hover:text-foreground transition-colors">
              {t('landing.pricingTitle')}
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* Language Switcher */}
            <div className="flex items-center bg-surface-high/50 rounded-lg p-1 border border-outline-variant/30 mr-2">
              <button 
                onClick={() => i18n.changeLanguage('pt')} 
                className={cn(
                  "px-2 py-1 rounded text-[10px] font-bold uppercase transition-all",
                  i18n.language === 'pt' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                PT
              </button>
              <button 
                onClick={() => i18n.changeLanguage('en')} 
                className={cn(
                  "px-2 py-1 rounded text-[10px] font-bold uppercase transition-all",
                  i18n.language === 'en' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                EN
              </button>
            </div>

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
      <section className="relative pt-16 pb-24 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Copy */}
          <div className="flex flex-col items-start">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pulse-gradient/10 border border-primary/20 text-primary-dim text-[10px] font-bold tracking-widest uppercase mb-8">
              <Bot className="w-3.5 h-3.5" />
              {t('landing.multiTenantTitle')}
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-foreground to-foreground/40 max-w-2xl" style={{ paddingBottom: '0.2em', lineHeight: 1.15 }}>
              {t('landing.heroTitle')}
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-10 font-medium max-w-xl mt-6">
              {t('landing.heroSubtitle')}
            </p>

            <div className="flex flex-col sm:flex-row items-start gap-6">
              <Button size="lg" className="h-14 px-10 text-sm font-bold tracking-wide uppercase group shadow-2xl shadow-primary-dim/30" onClick={() => navigate('/login')}>
                {t('landing.ctaStartNow')}
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <div className="text-sm font-bold tracking-widest uppercase text-muted-foreground/60 transition-colors hover:text-muted-foreground flex items-center h-14">
                {t('landing.ctaNoCard')}
              </div>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-4 mt-12 pt-8 border-t border-outline-variant/20 w-full">
              <div className="flex -space-x-2">
                {['🩺', '💇‍♀️', '🧘‍♀️', '🏋️'].map((emoji, i) => (
                  <div key={i} className="w-9 h-9 rounded-full bg-surface-high border-2 border-background flex items-center justify-center text-sm">
                    {emoji}
                  </div>
                ))}
              </div>
              <div>
                <div className="text-xs font-bold text-foreground">+200 profissionais</div>
                <div className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-wider">já automatizam com IA</div>
              </div>
            </div>
          </div>

          {/* Right: Chat Demo */}
          <div className="hidden lg:block">
            <HeroChatDemo />
          </div>
        </div>
      </section>

      {/* AI Bot Hero Section */}
      <section id="ai-bot" className="py-28 px-6 bg-surface-container-low/30 border-y border-outline-variant/30 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/15 rounded-full blur-[120px] -z-10" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-secondary/10 rounded-full blur-[100px] -z-10" />
        
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary-dim text-[10px] font-bold tracking-widest uppercase mb-6">
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              POWERED BY GOOGLE GEMINI
            </div>
            <h2 className="text-4xl md:text-6xl font-extrabold tracking-tighter mb-6" style={{ lineHeight: 1.15 }}>
              {t('landing.aiBotSectionTitle')}
            </h2>
            <p className="text-xl text-muted-foreground font-medium leading-relaxed">
              {t('landing.aiBotSectionSubtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1: Natural Language */}
            <Card variant="glass" className="p-10 border-outline-variant/40 hover:border-primary/30 transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[60px] group-hover:bg-primary/15 transition-colors -z-10" />
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-8 border border-primary/20 group-hover:bg-primary/20 transition-colors">
                <Brain className="w-7 h-7 text-primary-dim" />
              </div>
              <h3 className="text-xl font-bold mb-3 tracking-tight">{t('landing.aiBotFeature1Title')}</h3>
              <p className="text-muted-foreground leading-relaxed font-medium text-sm">
                {t('landing.aiBotFeature1Desc')}
              </p>
            </Card>

            {/* Feature 2: Knows Business */}
            <Card variant="glass" className="p-10 border-outline-variant/40 hover:border-primary/30 transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full blur-[60px] group-hover:bg-secondary/15 transition-colors -z-10" />
              <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mb-8 border border-secondary/20 group-hover:bg-secondary/20 transition-colors">
                <Users className="w-7 h-7 text-secondary" />
              </div>
              <h3 className="text-xl font-bold mb-3 tracking-tight">{t('landing.aiBotFeature2Title')}</h3>
              <p className="text-muted-foreground leading-relaxed font-medium text-sm">
                {t('landing.aiBotFeature2Desc')}
              </p>
            </Card>

            {/* Feature 3: 24/7 */}
            <Card variant="glass" className="p-10 border-outline-variant/40 hover:border-primary/30 transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[60px] group-hover:bg-primary/15 transition-colors -z-10" />
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-8 border border-primary/20 group-hover:bg-primary/20 transition-colors">
                <Clock className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3 tracking-tight">{t('landing.aiBotFeature3Title')}</h3>
              <p className="text-muted-foreground leading-relaxed font-medium text-sm">
                {t('landing.aiBotFeature3Desc')}
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter mb-4">
              {t('landing.featuresTitle')}
            </h2>
            <p className="text-xl text-muted-foreground font-medium max-w-2xl">
              {t('landing.featuresSubtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* AI Bot Feature - highlighted */}
            <Card variant="glass" className="p-8 border-primary/30 bg-primary/5 hover:scale-105 transition-transform group col-span-1 lg:col-span-2 lg:row-span-1">
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 rounded-2xl bg-pulse-gradient flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary-dim/20">
                  <Bot className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-3 tracking-tight">{t('landing.aiBotTitle')}</h3>
                  <p className="text-muted-foreground leading-relaxed font-medium">
                    {t('landing.aiBotDesc')}
                  </p>
                </div>
              </div>
            </Card>

            <Card variant="glass" className="p-8 border-outline-variant/40 hover:scale-105 transition-transform group">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 border border-primary/20 group-hover:bg-primary/20 transition-colors">
                <Calendar className="w-6 h-6 text-primary-dim" />
              </div>
              <h3 className="text-lg font-bold mb-2 tracking-tight">{t('landing.calendarSyncTitle')}</h3>
              <p className="text-muted-foreground leading-relaxed font-medium text-sm">
                {t('landing.calendarSyncDesc')}
              </p>
            </Card>

            <Card variant="glass" className="p-8 border-outline-variant/40 hover:scale-105 transition-transform group">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-6 border border-secondary/20 group-hover:bg-secondary/20 transition-colors">
                <MessageSquare className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-lg font-bold mb-2 tracking-tight">{t('landing.whatsappAutoTitle')}</h3>
              <p className="text-muted-foreground leading-relaxed font-medium text-sm">
                {t('landing.whatsappAutoDesc')}
              </p>
            </Card>

            <Card variant="glass" className="p-8 border-outline-variant/40 hover:scale-105 transition-transform group col-span-1 lg:col-span-2">
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20 group-hover:bg-primary/20 transition-colors">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2 tracking-tight">{t('landing.dashboardTitle')}</h3>
                  <p className="text-muted-foreground leading-relaxed font-medium text-sm">
                    {t('landing.dashboardDesc')}
                  </p>
                </div>
              </div>
            </Card>

            {/* Multi-tenant */}
            <Card variant="glass" className="p-8 border-outline-variant/40 hover:scale-105 transition-transform group col-span-1 lg:col-span-2">
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20 group-hover:bg-primary/20 transition-colors">
                  <ShieldCheck className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2 tracking-tight">{t('landing.multiTenantTitle')}</h3>
                  <p className="text-muted-foreground leading-relaxed font-medium text-sm">
                    {t('landing.multiTenantDesc')}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-28 px-6 bg-surface-dim/30 border-y border-outline-variant/30">
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
                  <span className="text-6xl font-extrabold tracking-tighter">{freePrice}</span>
                  <span className="text-muted-foreground font-bold tracking-widest uppercase text-[10px]">{t('subscription.pricing.perMonth')}</span>
                </div>
              </div>

              <ul className="space-y-5 mb-12 flex-1">
                {freeFeatures.length > 0 ? freeFeatures.map((feature, i) => (
                  <li key={i} className="flex items-center gap-4 text-sm font-medium">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" /> {feature}
                  </li>
                )) : (
                  <>
                    <li className="flex items-center gap-4 text-sm font-medium">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" /> {t('landing.plans.remindersPerMonth')}
                    </li>
                    <li className="flex items-center gap-4 text-sm font-medium">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" /> {t('landing.calendarSyncTitle')}
                    </li>
                    <li className="flex items-center gap-4 text-sm font-medium opacity-20 grayscale">
                      <ZapOff className="w-4 h-4 flex-shrink-0" /> {t('landing.plans.aiBotFeature')}
                    </li>
                    <li className="flex items-center gap-4 text-sm font-medium opacity-20 grayscale">
                      <ZapOff className="w-4 h-4 flex-shrink-0" /> {t('landing.plans.professionalMgmt')}
                    </li>
                  </>
                )}
              </ul>

              <Button variant="secondary" className="w-full h-14 font-bold tracking-widest uppercase text-xs" onClick={() => navigate('/login')}>
                {t('landing.ctaStartNow')}
              </Button>
            </Card>

            {/* Pro Plan */}
            <Card variant="glass" className="p-12 border-primary/20 relative flex flex-col bg-pulse-gradient/5">
              <div className="absolute top-0 right-12 px-5 py-2 bg-pulse-gradient rounded-b-2xl text-[10px] font-extrabold tracking-[3px] uppercase text-white shadow-xl shadow-primary-dim/20">
                RECOMENDADO
              </div>
              <div className="mb-10">
                <h3 className="text-2xl font-bold tracking-tight mb-2 uppercase text-[10px] text-primary-dim tracking-[5px]">{t('landing.plans.pro')}</h3>
                <div className="mt-8 flex items-baseline gap-1">
                  <span className="text-6xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-primary-dim to-primary-container" style={{ paddingBottom: '0.05em' }}>{proPrice}</span>
                  <span className="text-muted-foreground font-bold tracking-widest uppercase text-[10px]">{t('subscription.pricing.perMonth')}</span>
                </div>
              </div>

              <ul className="space-y-5 mb-12 flex-1">
                {proFeatures.length > 0 ? proFeatures.map((feature, i) => (
                  <li key={i} className="flex items-center gap-4 text-sm font-medium">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" /> {feature}
                  </li>
                )) : (
                  <>
                    <li className="flex items-center gap-4 text-sm font-bold text-primary-dim italic">
                      <Sparkles className="w-4 h-4 fill-current flex-shrink-0" /> Everything in Free, plus:
                    </li>
                    <li className="flex items-center gap-4 text-sm font-medium">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" /> {t('landing.plans.unlimitedReminders')}
                    </li>
                    <li className="flex items-center gap-4 text-sm font-medium">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" /> {t('landing.plans.aiBotFeature')}
                    </li>
                    <li className="flex items-center gap-4 text-sm font-medium">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" /> {t('landing.plans.professionalMgmt')}
                    </li>
                  </>
                )}
              </ul>

              <Button className="w-full h-14 font-bold tracking-widest uppercase text-xs shadow-2xl shadow-primary-dim/30" onClick={() => navigate('/login')}>
                {t('landing.ctaStartNow')}
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-28 px-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-primary/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary-dim text-[10px] font-bold tracking-widest uppercase mb-8">
            <Bot className="w-3.5 h-3.5" />
            PRONTO PARA COMEÇAR?
          </div>
          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tighter mb-6" style={{ lineHeight: 1.15 }}>
            Deixe a IA cuidar<br />da sua recepção.
          </h2>
          <p className="text-xl text-muted-foreground font-medium mb-10 max-w-2xl mx-auto">
            Configure em 5 minutos. Nenhum cartão necessário. Seu bot começa a atender hoje.
          </p>
          <Button size="lg" className="h-16 px-14 text-base font-bold tracking-wide uppercase group shadow-2xl shadow-primary-dim/30" onClick={() => navigate('/login')}>
            {t('landing.ctaStartNow')}
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
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
                {t('landing.heroSubtitle').slice(0, 100)}...
              </p>
              <span className="text-[10px] font-bold tracking-widest uppercase text-primary-dim block">{t('landing.multiTenantTitle')}</span>
            </div>
            
            <div className="hidden md:block" />

            <div>
              <h4 className="text-[10px] font-bold tracking-[3px] uppercase mb-8 text-muted-foreground/60">{t('landing.footerProduct')}</h4>
              <ul className="space-y-4 text-sm text-muted-foreground font-medium uppercase tracking-wider">
                <li><button onClick={() => scrollToSection('ai-bot')} className="hover:text-primary transition-colors">Bot IA</button></li>
                <li><button onClick={() => scrollToSection('features')} className="hover:text-primary transition-colors">Features</button></li>
                <li><button onClick={() => scrollToSection('pricing')} className="hover:text-primary transition-colors">Pricing</button></li>
              </ul>
            </div>

            <div>
              <h4 className="text-[10px] font-bold tracking-[3px] uppercase mb-8 text-muted-foreground/60">{t('landing.footerLegal')}</h4>
              <ul className="space-y-4 text-sm text-muted-foreground font-medium uppercase tracking-wider">
                <li><button onClick={() => navigate('/privacy')} className="hover:text-primary transition-colors">{t('common.privacyPolicy')}</button></li>
                <li><button onClick={() => navigate('/terms')} className="hover:text-primary transition-colors">{t('common.termsOfService')}</button></li>
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

      {/* CSS for animations */}
      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out both;
        }
      `}</style>
    </div>
  );
};
