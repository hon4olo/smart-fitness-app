import type { SupportedLocale } from './messages';

export type PluralForms = {
  one: string;
  few?: string;
  many?: string;
  other: string;
};

type PluralCategory = 'one' | 'few' | 'many' | 'other';

const localeTags: Record<SupportedLocale, string> = {
  en: 'en-US',
  ru: 'ru-RU',
};

const selectFallbackPluralCategory = (
  locale: SupportedLocale,
  count: number,
): PluralCategory => {
  if (locale === 'en') {
    return count === 1 ? 'one' : 'other';
  }

  if (!Number.isInteger(count)) return 'other';

  const absoluteCount = Math.abs(count);
  const mod10 = absoluteCount % 10;
  const mod100 = absoluteCount % 100;

  if (mod10 === 1 && mod100 !== 11) return 'one';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'few';
  if (mod10 === 0 || mod10 >= 5 || (mod100 >= 11 && mod100 <= 14)) return 'many';
  return 'other';
};

const selectPluralCategory = (
  locale: SupportedLocale,
  count: number,
): PluralCategory => {
  const PluralRulesConstructor =
    typeof Intl !== 'undefined' && typeof Intl.PluralRules === 'function'
      ? Intl.PluralRules
      : null;

  if (PluralRulesConstructor) {
    try {
      const category = new PluralRulesConstructor(localeTags[locale]).select(count);
      if (category === 'one' || category === 'few' || category === 'many') return category;
      return 'other';
    } catch {
      // Some Hermes release runtimes expose Intl without PluralRules data.
    }
  }

  return selectFallbackPluralCategory(locale, count);
};

export const selectPluralForm = (
  locale: SupportedLocale,
  count: number,
  forms: PluralForms,
): string => {
  const category = selectPluralCategory(locale, count);

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
