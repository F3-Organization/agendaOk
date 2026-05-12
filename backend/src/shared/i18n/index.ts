import { pt } from "./locales/pt";
import { en } from "./locales/en";

export type Locale = "pt" | "en";

/** Flattens a nested object into dot-notation keys: { auth: { x: "y" } } → { "auth.x": "y" } */
function flatten(obj: Record<string, unknown>, prefix = ""): Record<string, string> {
    const result: Record<string, string> = {};

    for (const [key, value] of Object.entries(obj)) {
        const path = prefix ? `${prefix}.${key}` : key;

        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
            Object.assign(result, flatten(value as Record<string, unknown>, path));
        } else {
            result[path] = String(value);
        }
    }

    return result;
}

const flatPt = flatten(pt);
const flatEn = flatten(en);

const translations: Record<Locale, Record<string, string>> = {
    pt: flatPt,
    en: flatEn,
};

export type TranslationKey = keyof typeof flatPt;

/**
 * Translates a key to the given locale with optional interpolation.
 *
 * @example
 * t("pt", "company.limitReached", { planName: "FREE", maxCompanies: "1" })
 * // → "Limite de empresas atingido. O plano FREE permite até 1 empresa(s)."
 */
export function t(
    locale: Locale,
    key: string,
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
