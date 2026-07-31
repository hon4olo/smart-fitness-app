import type { SupportedLocale } from './messages';

const getLocaleTag = (locale: SupportedLocale): string =>
  locale === 'ru' ? 'ru-RU' : 'en-US';

export const formatLocalizedNumber = (
  value: number,
  locale: SupportedLocale,
  maximumFractionDigits = 1,
): string =>
  new Intl.NumberFormat(getLocaleTag(locale), {
    maximumFractionDigits,
  }).format(value);

export const formatLocalizedDateTime = (
  value: string | number | Date,
  locale: SupportedLocale,
): string =>
  new Intl.DateTimeFormat(getLocaleTag(locale), {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
