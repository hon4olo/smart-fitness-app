import type { SupportedLocale } from './messages';

export const getExerciseMediaCopy = (locale: SupportedLocale) => ({
  accessibilityLabel: (exerciseName: string) =>
    locale === 'ru' ? `Медиа упражнения «${exerciseName}»` : `${exerciseName} exercise media`,
  unavailable: locale === 'ru' ? 'Медиа недоступно' : 'No media available',
});

export type ExerciseMediaCopy = ReturnType<typeof getExerciseMediaCopy>;
