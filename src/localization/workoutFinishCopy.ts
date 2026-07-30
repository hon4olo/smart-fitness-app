import type { SupportedLocale } from './messages';

const pluralRu = (
  count: number,
  forms: [one: string, few: string, many: string],
) => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
};

export const getWorkoutFinishCopy = (locale: SupportedLocale) => ({
  backToWorkouts: locale === 'ru' ? 'К тренировкам' : 'Back to Workouts',
  discard: locale === 'ru' ? 'Удалить тренировку' : 'Discard workout',
  home: locale === 'ru' ? 'Главная' : 'Home',
  save: locale === 'ru' ? 'Сохранить' : 'Save',
  saved: locale === 'ru' ? 'Тренировка сохранена' : 'Workout saved',
  sets: (count: number, formatted: string) =>
    locale === 'ru'
      ? `${formatted} ${pluralRu(count, ['подход', 'подхода', 'подходов'])}`
      : `${formatted} ${count === 1 ? 'set' : 'sets'}`,
});

export type WorkoutFinishCopy = ReturnType<typeof getWorkoutFinishCopy>;
