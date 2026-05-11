import i18n from '../lib/i18n';

/**
 * Returns the Intl locale string based on the current i18n language.
 * pt → pt-BR, en → en-US
 */
export const getLocale = (): string => {
  return i18n.language === 'pt' ? 'pt-BR' : 'en-US';
};

/**
 * Formats a currency value for BRL (R$).
 * @param amount Value in cents
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount / 100);
};

/**
 * Formats a date string based on the current i18n locale.
 * PT → DD/MM/AAAA  |  EN → MM/DD/YYYY
 */
export const formatDate = (dateString: string | Date | undefined | null): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString(getLocale());
};

/**
 * Formats a time string based on the current i18n locale.
 * PT → HH:mm (24h)  |  EN → h:mm AM/PM
 */
export const formatTime = (dateString: string | Date | undefined | null): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleTimeString(getLocale(), { hour: '2-digit', minute: '2-digit' });
};

/**
 * Formats date + time together.
 * PT → "12/05/2026 às 14:30"  |  EN → "05/12/2026 at 2:30 PM"
 */
export const formatDateTime = (dateString: string | Date | undefined | null): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const locale = getLocale();
  const d = date.toLocaleDateString(locale);
  const t = date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  const sep = locale === 'pt-BR' ? 'às' : 'at';
  return `${d} ${sep} ${t}`;
};

/**
 * Returns the localized month name.
 */
export const getMonthName = (date: Date): string => {
  return date.toLocaleString(getLocale(), { month: 'long' });
};

/**
 * Returns the short weekday headers for the calendar grid.
 * PT → ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
 * EN → ['S', 'M', 'T', 'W', 'T', 'F', 'S']
 */
export const getWeekdayHeaders = (): string[] => {
  const locale = getLocale();
  const base = new Date(2024, 0, 7); // Sunday Jan 7, 2024
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    return d.toLocaleDateString(locale, { weekday: 'narrow' });
  });
};

/**
 * Converts an ISO date string to `datetime-local` input value.
 */
export const toLocalInput = (iso: string): string => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/**
 * Phone number validation (Brazilian or international).
 * Accepts: 11999999999, +5511999999999
 */
export const isValidPhone = (phone: string): boolean => {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
};

/**
 * Validates that endAt is after startAt.
 */
export const isEndAfterStart = (startAt: string, endAt: string): boolean => {
  if (!startAt || !endAt) return true;
  return new Date(endAt) > new Date(startAt);
};

/**
 * Validates that a date is not in the past.
 */
export const isNotInPast = (dateString: string): boolean => {
  if (!dateString) return true;
  const date = new Date(dateString);
  const now = new Date();
  now.setSeconds(0, 0);
  return date >= now;
};
