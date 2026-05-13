import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Calendar,
  MessageCircle,
  CreditCard,
  Settings,
  Building2,
  Users,
  Bot,
} from 'lucide-react';

export interface NavItem {
  labelKey: string;
  labelFallback: string;
  href: string;
  icon: LucideIcon;
}

export interface NavSection {
  /** i18n key for the section header (e.g. "sidebar.sections.main") */
  labelKey?: string;
  /** Fallback label if i18n key is missing */
  labelFallback?: string;
  items: NavItem[];
}

/**
 * Navigation sections for OWNER/ADMIN users.
 * Grouped semantically: overview → tools → account.
 */
export const ownerNavSections: NavSection[] = [
  {
    labelKey: 'sidebar.sections.overview',
    labelFallback: 'Visão geral',
    items: [
      { labelKey: 'common.dashboard', labelFallback: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { labelKey: 'common.appointments', labelFallback: 'Agendamentos', href: '/appointments', icon: Calendar },
    ],
  },
  {
    labelKey: 'sidebar.sections.tools',
    labelFallback: 'Ferramentas',
    items: [
      { labelKey: 'professionals.title', labelFallback: 'Profissionais', href: '/professionals', icon: Users },
      { labelKey: 'botConfig.nav', labelFallback: 'Bot IA', href: '/bot-config', icon: Bot },
      { labelKey: 'common.whatsapp', labelFallback: 'WhatsApp', href: '/whatsapp', icon: MessageCircle },
    ],
  },
  {
    labelKey: 'sidebar.sections.account',
    labelFallback: 'Conta',
    items: [
      { labelKey: 'common.subscription', labelFallback: 'Assinatura', href: '/subscription', icon: CreditCard },
      { labelKey: 'company.settings.navLabel', labelFallback: 'Empresa', href: '/company/settings', icon: Building2 },
      { labelKey: 'common.settings', labelFallback: 'Configurações', href: '/settings', icon: Settings },
    ],
  },
];

/**
 * Navigation sections for PROFESSIONAL users.
 */
export const professionalNavSections: NavSection[] = [
  {
    items: [
      { labelKey: 'common.appointments', labelFallback: 'Agendamentos', href: '/appointments', icon: Calendar },
    ],
  },
];
