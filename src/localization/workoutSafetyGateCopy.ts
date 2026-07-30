import type { SupportedLocale } from './messages';

export const getWorkoutSafetyGateCopy = (locale: SupportedLocale) => ({
  back: locale === 'ru' ? 'Назад' : 'Back',
  openSafetyRecovery:
    locale === 'ru' ? 'Открыть безопасность и восстановление' : 'Open Safety & Recovery',
});

export type WorkoutSafetyGateCopy = ReturnType<typeof getWorkoutSafetyGateCopy>;
