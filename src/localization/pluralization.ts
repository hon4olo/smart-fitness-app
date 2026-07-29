import type { SupportedLocale } from './messages';

export type PluralForms = {
  one: string;
  few?: string;
  many?: string;
  other: string;
};

type PluralCategory = 'one' | 'few' | 'many' | 'other';

const selectEnglishCategory = (count: number): PluralCategory =>
  count === 1 ? 'one' : 'other';

const selectRussianCategory = (count: number): PluralCategory => {
  const absoluteCount = Math.abs(count);
  if (!Number.isInteger(absoluteCount)) return 'other';

  const modulo10 = absoluteCount % 10;
  const modulo100 = absoluteCount % 100;

  if (modulo10 === 1 && modulo100 !== 11) return 'one';
  if (modulo10 >= 2 && modulo10 <= 4 && (modulo100 < 12 || modulo100 > 14)) {
    return 'few';
  }
  return 'many';
};

const selectCategory = (locale: SupportedLocale, count: number): PluralCategory =>
  locale === 'ru' ? selectRussianCategory(count) : selectEnglishCategory(count);

export const selectPluralForm = (
  locale: SupportedLocale,
  count: number,
  forms: PluralForms,
): string => {
  const category = selectCategory(locale, count);

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
