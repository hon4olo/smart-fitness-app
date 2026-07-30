import type { SupportedLocale } from './messages';

export const getWorkoutSafetyGateCopy = (locale: SupportedLocale) => ({
  acknowledgement:
    locale === 'ru'
      ? 'Я ознакомился с результатом и понимаю, что приложение не изменит упражнения, подходы, повторы или нагрузку автоматически.'
      : 'I reviewed this result and understand that the app will not automatically change the exercises, sets, reps, or load.',
  back: locale === 'ru' ? 'Назад' : 'Back',
  continueDespiteHardBlock:
    locale === 'ru' ? 'Продолжить несмотря на блокировку' : 'Continue despite hard block',
  enterWorkout: locale === 'ru' ? 'Перейти к тренировке' : 'Enter workout',
  limitations: locale === 'ru' ? 'Ограничения' : 'Limitations',
  openSafetyRecovery:
    locale === 'ru' ? 'Открыть безопасность и восстановление' : 'Open Safety & Recovery',
  recoveryCheckIn:
    locale === 'ru' ? 'Проверка восстановления' : 'Recovery check-in',
});

export type WorkoutSafetyGateCopy = ReturnType<typeof getWorkoutSafetyGateCopy>;
