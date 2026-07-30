import type { SupportedLocale } from './messages';

export const getWorkoutSafetyGateCopy = (locale: SupportedLocale) => ({
  back: locale === 'ru' ? 'Назад' : 'Back',
  continueDespiteHardBlock:
    locale === 'ru' ? 'Продолжить несмотря на блокировку' : 'Continue despite hard block',
  enterWorkout: locale === 'ru' ? 'Перейти к тренировке' : 'Enter workout',
  openSafetyRecovery:
    locale === 'ru' ? 'Открыть безопасность и восстановление' : 'Open Safety & Recovery',
});

export type WorkoutSafetyGateCopy = ReturnType<typeof getWorkoutSafetyGateCopy>;
