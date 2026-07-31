import type { SupportedLocale } from './messages';

export const getWorkoutSafetyGateCopy = (locale: SupportedLocale) => ({
  acknowledgement:
    locale === 'ru'
      ? 'Я ознакомился с результатом и понимаю, что приложение не изменит упражнения, подходы, повторы или нагрузку автоматически.'
      : 'I reviewed this result and understand that the app will not automatically change the exercises, sets, reps, or load.',
  affectedLoadUpTo: (percent: string) =>
    locale === 'ru' ? `затронутая нагрузка до ${percent}%` : `affected load up to ${percent}%`,
  back: locale === 'ru' ? 'Назад' : 'Back',
  continueDespiteHardBlock:
    locale === 'ru' ? 'Продолжить несмотря на блокировку' : 'Continue despite hard block',
  disclaimer:
    locale === 'ru'
      ? 'Безопасность и восстановление использует синхронизированные данные самооценки. Результат не является медицинским диагнозом или рекомендацией по лечению.'
      : 'Safety & Recovery uses synchronized self-reported product data. It is not a medical diagnosis or treatment recommendation.',
  enterWorkout: locale === 'ru' ? 'Перейти к тренировке' : 'Enter workout',
  limitations: locale === 'ru' ? 'Ограничения' : 'Limitations',
  loadingReview: locale === 'ru' ? 'Загрузка анализа…' : 'Loading review…',
  loadingStatus: locale === 'ru' ? 'Загрузка' : 'Loading',
  noReviewStatus: locale === 'ru' ? 'Нет анализа' : 'No review',
  notSpecified: locale === 'ru' ? 'Не указано' : 'Not specified',
  openSafetyRecovery:
    locale === 'ru' ? 'Открыть безопасность и восстановление' : 'Open Safety & Recovery',
  recoveryCheckIn:
    locale === 'ru' ? 'Проверка восстановления' : 'Recovery check-in',
  restrictions: locale === 'ru' ? 'Ограничения' : 'Restrictions',
  reviewFindings: locale === 'ru' ? 'Результаты анализа' : 'Review findings',
  reviewMissing: {
    title: locale === 'ru' ? 'Нет актуального анализа' : 'No current Safety & Recovery review',
    message:
      locale === 'ru'
        ? 'Можно продолжить, но для этой тренировки нет актуального детерминированного анализа текущего аккаунта.'
        : 'You can continue, but there is no current account-scoped deterministic review for this workout.',
  },
  reviewStale: {
    title: locale === 'ru' ? 'Анализ устарел' : 'Safety & Recovery review is stale',
    message:
      locale === 'ru'
        ? 'Данные восстановления или ограничения изменились либо проверка стала слишком старой. Рекомендуется запустить новый анализ.'
        : 'Recovery data or limitations changed, or the reviewed check-in is too old. Run a new review before continuing when possible.',
  },
  reviewUnavailable: {
    title: locale === 'ru' ? 'Анализ недоступен' : 'Review unavailable',
    message:
      locale === 'ru'
        ? 'Безопасный локальный статус анализа определить не удалось.'
        : 'A safe local review status could not be determined.',
  },
  reviewUnavailableStatus: locale === 'ru' ? 'Недоступно' : 'Unavailable',
  reviewedLoadCeiling:
    locale === 'ru' ? 'Проверенный предел нагрузки' : 'Reviewed load ceiling',
  sessionContext:
    locale === 'ru'
      ? 'Эта проверка привязана к текущей тренировке. При возврате к этой сессии повторное подтверждение не потребуется.'
      : 'This check is attached to the current workout session. Returning to this session will not request the same acknowledgement again.',
  snapshotLoadError:
    locale === 'ru'
      ? 'Сохранённый анализ безопасности и восстановления загрузить не удалось.'
      : 'The saved Safety & Recovery review could not be loaded.',
  staleStatus: locale === 'ru' ? 'Устарело' : 'Stale',
  structuredRestrictions:
    locale === 'ru' ? 'Структурированные ограничения' : 'Structured restrictions',
  subtitle:
    locale === 'ru'
      ? 'Подтверждение безопасности и восстановления'
      : 'Safety & Recovery acknowledgement',
  title: locale === 'ru' ? 'Перед тренировкой' : 'Before your workout',
  updateReview: locale === 'ru' ? 'Обновить анализ' : 'Update the review',
  updateReviewBody:
    locale === 'ru'
      ? 'Добавьте актуальные данные восстановления или ограничения, синхронизируйте их и снова запустите детерминированный анализ.'
      : 'Add current recovery data or limitations, synchronize them, and run the deterministic review again before continuing.',
  workout: locale === 'ru' ? 'Тренировка' : 'Workout',
});

export type WorkoutSafetyGateCopy = ReturnType<typeof getWorkoutSafetyGateCopy>;
