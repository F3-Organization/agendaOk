import { pt } from "./locales/pt";
import { en } from "./locales/en";

export type Locale = "pt" | "en";
export type TranslationKey = keyof typeof pt;

const translations: Record<Locale, Record<string, string>> = { pt, en };

/**
 * Translates a key to the given locale with optional interpolation.
 *
 * @example
 * t("pt", "company.limitReached", { planName: "FREE", maxCompanies: "1" })
 * // → "Limite de empresas atingido. O plano FREE permite até 1 empresa(s)."
 */
export function t(
    locale: Locale,
    key: TranslationKey,
    params?: Record<string, string | number>
): string {
    const dict = translations[locale] || translations.pt;
    let message = dict[key] || translations.pt[key] || key;

    if (params) {
        for (const [k, v] of Object.entries(params)) {
            message = message.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
        }
    }

    return message;
}

/**
 * Extracts the preferred locale from an Accept-Language header.
 * Returns "en" if the header contains "en" as a primary language, otherwise "pt".
 */
export function parseLocale(acceptLanguage?: string): Locale {
    if (!acceptLanguage) return "pt";

    const normalized = acceptLanguage.toLowerCase();

    // Check for explicit English preference before Portuguese
    // Accept-Language: en-US,en;q=0.9,pt-BR;q=0.8
    const parts = normalized.split(",").map((p) => {
        const [lang, qStr] = p.trim().split(";q=");
        const q = qStr ? parseFloat(qStr) : 1.0;
        return { lang: lang.trim(), q };
    });

    parts.sort((a, b) => b.q - a.q);

    const topLang = parts[0]?.lang || "";

    if (topLang.startsWith("en")) return "en";
    return "pt";
}
