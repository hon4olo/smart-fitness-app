import type { SupportedLocale } from './messages';

export type PluralForms = {
  one: string;
  few?: string;
  many?: string;
  other: string;
};

const localeTags: Record<SupportedLocale, string> = {
  en: 'en-US',
  ru: 'ru-RU',
};

export const selectPluralForm = (
  locale: SupportedLocale,
  count: number,
  forms: PluralForms,
): string => {
  const category = new Intl.PluralRules(localeTags[locale]).select(count);

  if (category === 'one') return forms.one;
  if (category === 'few' && forms.few) return forms.few;
  if (category === 'many' && forms.many) return forms.many;
  return forms.other;
};

export const formatPlural = (
  locale: SupportedLocale,
  count: number,
  forms: PluralForms,
): string => selectPluralForm(locale, count, forms).replaceAll('{count}', String(count));
