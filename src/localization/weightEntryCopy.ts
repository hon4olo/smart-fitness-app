import type { SupportedLocale } from './messages';

export const getWeightEntryCopy = (locale: SupportedLocale) => ({
  cancel: locale === 'ru' ? 'Отмена' : 'Cancel',
  invalidWeight: locale === 'ru' ? 'Введите корректный вес.' : 'Enter a valid weight.',
  save: locale === 'ru' ? 'Сохранить вес' : 'Save weight',
  title: locale === 'ru' ? 'Добавить вес' : 'Add weight',
  weightLabel: (unit: string) =>
    locale === 'ru' ? `Вес (${unit})` : `Weight (${unit})`,
});

export type WeightEntryCopy = ReturnType<typeof getWeightEntryCopy>;
