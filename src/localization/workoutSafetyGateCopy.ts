import type { SupportedLocale } from './messages';

export const getWorkoutSafetyGateCopy = (locale: SupportedLocale) => ({
  back: locale === 'ru' ? 'Назад' : 'Back',
});

export type WorkoutSafetyGateCopy = ReturnType<typeof getWorkoutSafetyGateCopy>;
