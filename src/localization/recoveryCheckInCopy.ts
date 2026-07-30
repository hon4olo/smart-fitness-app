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

export const getRecoveryCheckInCopy = (locale: SupportedLocale) => ({
  back: locale === 'ru' ? 'Назад' : 'Back',
  title: locale === 'ru' ? 'Проверка восстановления' : 'Recovery check-in',
  subtitle:
    locale === 'ru'
      ? 'Самооценка показателей для детерминированного анализа'
      : 'Self-reported signals for deterministic review',
  currentStatus: locale === 'ru' ? 'Текущее состояние' : 'Current status',
  latestSaved: locale === 'ru' ? 'Последняя сохранённая запись' : 'Latest saved check-in',
  none: locale === 'ru' ? 'нет' : 'none',
  unknownTime: locale === 'ru' ? 'неизвестное время' : 'Unknown time',
  syncStatus: (status: string, pending: string) =>
    locale === 'ru'
      ? `Синхронизация: ${status} · ожидающих операций: ${pending}`
      : `Sync: ${status} · pending operations: ${pending}`,
  syncLabels: {
    idle: locale === 'ru' ? 'готово' : 'idle',
    syncing: locale === 'ru' ? 'выполняется' : 'syncing',
    success: locale === 'ru' ? 'завершена' : 'success',
    error: locale === 'ru' ? 'ошибка' : 'error',
    offline: locale === 'ru' ? 'нет подключения' : 'offline',
  } as Record<string, string>,
  syncIssue:
    locale === 'ru'
      ? 'Синхронизация временно недоступна. Локальные данные сохранены.'
      : 'Sync is temporarily unavailable. Local data is preserved.',
  todaySignals: locale === 'ru' ? 'Сегодняшние показатели' : 'Today’s signals',
  signalsExplanation:
    locale === 'ru'
      ? 'Заполните минимум два поля. Высокие значения усталости, болезненности, стресса и влияния боли означают большее нарушение восстановления. Высокие значения качества сна и готовности означают лучшее восстановление.'
      : 'Add at least two fields. Higher fatigue, soreness, stress, and pain interference mean more disruption. Higher sleep quality and readiness mean better recovery.',
  sleepDuration: locale === 'ru' ? 'Продолжительность сна' : 'Sleep duration',
  sleepDurationHelper: locale === 'ru' ? 'От 0 до 24 часов' : 'Hours from 0 to 24',
  sleepDurationAccessibility:
    locale === 'ru' ? 'Продолжительность сна в часах' : 'Sleep duration in hours',
  sleepQuality: locale === 'ru' ? 'Качество сна' : 'Sleep quality',
  fatigue: locale === 'ru' ? 'Усталость' : 'Fatigue',
  soreness: locale === 'ru' ? 'Мышечная болезненность' : 'Soreness',
  stress: locale === 'ru' ? 'Стресс' : 'Stress',
  painInterference: locale === 'ru' ? 'Влияние боли' : 'Pain interference',
  readiness: locale === 'ru' ? 'Готовность' : 'Readiness',
  veryPoorToVeryGood:
    locale === 'ru' ? '1 = очень плохо · 5 = очень хорошо' : '1 = very poor · 5 = very good',
  lowToMaximum:
    locale === 'ru' ? '1 = низко · 5 = максимум' : '1 = low · 5 = maximum',
  noneToMaximum:
    locale === 'ru' ? '0 = нет · 5 = максимум' : '0 = none · 5 = maximum',
  veryLowToVeryHigh:
    locale === 'ru' ? '1 = очень низко · 5 = очень высоко' : '1 = very low · 5 = very high',
  clear: locale === 'ru' ? 'Очистить' : 'Clear',
  clearField: (label: string) =>
    locale === 'ru' ? `Очистить поле «${label}»` : `Clear ${label}`,
  scoreAccessibility: (label: string, score: number) => `${label}: ${score}`,
  selectedSignals: (count: number, formatted: string) =>
    locale === 'ru'
      ? `Выбрано: ${formatted} ${pluralRu(count, ['показатель', 'показателя', 'показателей'])} из 7`
      : `Selected signals: ${formatted} / 7`,
  save: locale === 'ru' ? 'Сохранить проверку восстановления' : 'Save recovery check-in',
  openReview:
    locale === 'ru' ? 'Открыть анализ безопасности и восстановления' : 'Open Safety & Recovery review',
  openReviewHint:
    locale === 'ru'
      ? 'Открывает детерминированный анализ готовности и восстановления'
      : 'Opens the deterministic Safety and Recovery readiness review',
  boundary: locale === 'ru' ? 'Ограничения' : 'Boundary',
  boundaryBody:
    locale === 'ru'
      ? 'Это самооценка, а не диагноз. Анализ не может автоматически применять изменения к тренировке. На этом экране не собираются медицинские заметки в свободной форме.'
      : 'These are self-reported inputs, not a diagnosis. The review cannot automatically apply workout changes. Free-text medical notes are not collected on this screen.',
  savedAndSynced:
    locale === 'ru'
      ? 'Проверка восстановления сохранена и синхронизирована.'
      : 'Recovery check-in saved and synchronized.',
  savedLocallyRetry:
    locale === 'ru'
      ? 'Проверка сохранена локально. Синхронизация повторится при восстановлении подключения.'
      : 'Recovery check-in saved locally. Sync will retry when available.',
  savedSignals: (count: number, formatted: string) =>
    locale === 'ru'
      ? `Локально сохранено ${formatted} ${pluralRu(count, ['показатель', 'показателя', 'показателей'])}.`
      : `Saved ${formatted} recovery signal${count === 1 ? '' : 's'} locally.`,
  localValidationFailed:
    locale === 'ru'
      ? 'Проверка восстановления не прошла локальную валидацию.'
      : 'The recovery check-in did not pass local validation.',
  validation: {
    sleepRange:
      locale === 'ru'
        ? 'Продолжительность сна должна быть от 0 до 24 часов.'
        : 'Sleep duration must be between 0 and 24 hours.',
    minimumSignals:
      locale === 'ru'
        ? 'Перед сохранением добавьте минимум два показателя восстановления.'
        : 'Add at least two recovery signals before saving.',
    timestamp:
      locale === 'ru'
        ? 'Время проверки восстановления некорректно.'
        : 'The check-in timestamp is invalid.',
  },
});

export type RecoveryCheckInCopy = ReturnType<typeof getRecoveryCheckInCopy>;
