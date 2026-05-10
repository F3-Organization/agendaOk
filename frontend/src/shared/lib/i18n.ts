import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { pt } from '../i18n/locales/pt';
import { en } from '../i18n/locales/en';

// ── Versionamento de Cache ────────────────────────────────────────────
// Incremente esta versão sempre que as traduções mudarem significativamente.
// Isso invalida o cache do localStorage do LanguageDetector, forçando
// re-detecção do idioma e evitando que o browser sirva dados stale.
const I18N_VERSION = '1';
const STORAGE_KEY = `i18nextLng_v${I18N_VERSION}`;

// Limpar chaves de versões anteriores para evitar lixo no localStorage
if (typeof window !== 'undefined') {
  Object.keys(localStorage)
    .filter(k => k.startsWith('i18nextLng') && k !== STORAGE_KEY)
    .forEach(k => localStorage.removeItem(k));
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      pt: { translation: pt },
      en: { translation: en },
    },
    fallbackLng: 'pt',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: STORAGE_KEY,
    },
  });

export default i18n;
