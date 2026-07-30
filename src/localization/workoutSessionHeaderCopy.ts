import type { SupportedLocale } from './messages';

export const getWorkoutSessionHeaderCopy = (locale: SupportedLocale) => ({
  nextExercise: (exerciseName: string) =>
    locale === 'ru' ? `Далее: ${exerciseName}` : `Next: ${exerciseName}`,
  progressAccessibility: (percent: string) =>
    locale === 'ru' ? `Выполнено: ${percent}%` : `${percent} percent complete`,
});

export type WorkoutSessionHeaderCopy = ReturnType<typeof getWorkoutSessionHeaderCopy>;
