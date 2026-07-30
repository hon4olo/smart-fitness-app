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

export const getSafetyRecoveryPreflightCopy = (locale: SupportedLocale) => ({
  back: locale === 'ru' ? 'Назад' : 'Back',
  title: locale === 'ru' ? 'Безопасность и восстановление' : 'Safety & Recovery',
  subtitle:
    locale === 'ru'
      ? 'Подготовьте синхронизированные данные перед анализом'
      : 'Prepare synchronized data before review',
  readiness: {
    missing_check_in: {
      title: locale === 'ru' ? 'Нужна проверка восстановления' : 'Recovery check-in required',
      message:
        locale === 'ru'
          ? 'Добавьте минимум два явно указанных показателя восстановления перед запросом анализа готовности.'
          : 'Add at least two explicit recovery signals before requesting a readiness review.',
    },
    stale_check_in: {
      title: locale === 'ru' ? 'Проверка восстановления устарела' : 'Recovery check-in is stale',
      message:
        locale === 'ru'
          ? 'Последняя проверка старше 72 часов. Добавьте актуальную проверку перед анализом.'
          : 'The latest check-in is older than 72 hours. Add a current check-in before reviewing.',
    },
    insufficient_signals: {
      title: locale === 'ru' ? 'Нужно больше показателей восстановления' : 'More recovery signals required',
      message:
        locale === 'ru'
          ? 'В последней локальной проверке меньше двух пригодных показателей.'
          : 'The latest local check-in has fewer than two usable signals.',
    },
    ready: {
      title: locale === 'ru' ? 'Локальные данные готовы' : 'Local data is ready',
      message:
        locale === 'ru'
          ? 'Последняя проверка актуальна и содержит достаточно явно указанных показателей восстановления.'
          : 'The latest check-in is recent and contains enough explicit recovery signals.',
    },
  },
  readyBadge: locale === 'ru' ? 'ГОТОВО' : 'READY',
  inputBadge: locale === 'ru' ? 'НУЖНЫ ДАННЫЕ' : 'INPUT',
  latestSignals: locale === 'ru' ? 'Последние показатели' : 'Latest signals',
  activeLimitations: locale === 'ru' ? 'Активные ограничения' : 'Active limitations',
  latestCheckIn: locale === 'ru' ? 'Последняя проверка' : 'Latest check-in',
  notAvailable: locale === 'ru' ? 'Недоступно' : 'Not available',
  checkInAge: locale === 'ru' ? 'Возраст проверки' : 'Check-in age',
  hours: (count: number, formatted: string) =>
    locale === 'ru'
      ? `${formatted} ${pluralRu(count, ['час', 'часа', 'часов'])}`
      : `${formatted} hour${count === 1 ? '' : 's'}`,
  resolvedLimitations: locale === 'ru' ? 'Решённые ограничения' : 'Resolved limitations',
  addCheckIn: locale === 'ru' ? 'Добавить проверку восстановления' : 'Add recovery check-in',
  addAnotherCheckIn:
    locale === 'ru' ? 'Добавить ещё одну проверку восстановления' : 'Add another recovery check-in',
  manageLimitations:
    locale === 'ru' ? 'Управлять ограничениями тренировок' : 'Manage training limitations',
  syncGate: locale === 'ru' ? 'Проверка синхронизации' : 'Synchronization gate',
  syncGateBody:
    locale === 'ru'
      ? 'Backend-анализ использует синхронизированные записи, а не неотправленные локальные изменения. Перед началом анализа необходимо отправить ожидающие операции и разрешить конфликты.'
      : 'The backend review reads synchronized records, not unsent local changes. Pending or conflicted records must be resolved before the review starts.',
  account: locale === 'ru' ? 'Аккаунт' : 'Account',
  signedIn: locale === 'ru' ? 'Вход выполнен' : 'Signed in',
  signInRequired: locale === 'ru' ? 'Требуется вход' : 'Sign in required',
  syncStatus: locale === 'ru' ? 'Статус синхронизации' : 'Sync status',
  syncLabels: {
    idle: locale === 'ru' ? 'готово' : 'idle',
    syncing: locale === 'ru' ? 'выполняется' : 'syncing',
    success: locale === 'ru' ? 'завершена' : 'success',
    error: locale === 'ru' ? 'ошибка' : 'error',
    offline: locale === 'ru' ? 'нет подключения' : 'offline',
    conflict: locale === 'ru' ? 'конфликт' : 'conflict',
  } as Record<string, string>,
  pendingOperations: locale === 'ru' ? 'Ожидающие операции' : 'Pending operations',
  conflicts: locale === 'ru' ? 'Конфликты' : 'Conflicts',
  syncIssue:
    locale === 'ru'
      ? 'Синхронизация временно недоступна. Локальные данные сохранены.'
      : 'Sync is temporarily unavailable. Local data is preserved.',
  syncAttemptCompleted:
    locale === 'ru'
      ? 'Попытка синхронизации завершена. Проверьте статус ниже.'
      : 'Synchronization attempt completed. Review the status below.',
  syncAttemptFailed:
    locale === 'ru'
      ? 'Не удалось завершить синхронизацию. Локальные данные сохранены.'
      : 'Synchronization could not be completed. Local data is preserved.',
  signIn: locale === 'ru' ? 'Войти' : 'Sign in',
  synchronize: locale === 'ru' ? 'Синхронизировать записи' : 'Synchronize records',
  reviewTitle:
    locale === 'ru' ? 'Детерминированный анализ готовности' : 'Deterministic readiness review',
  reviewBody:
    locale === 'ru'
      ? 'Анализ может рекомендовать обычную тренировку, модификацию, дополнительные данные или блокировку. Он не ставит диагноз и не применяет изменения к тренировке автоматически.'
      : 'The review can recommend normal training, modification, more input, or a block. It never diagnoses a condition or applies workout changes automatically.',
  continueReview:
    locale === 'ru' ? 'Продолжить анализ готовности' : 'Continue to readiness review',
  requirementsHint:
    locale === 'ru'
      ? 'Чтобы продолжить, выполните требования к локальным данным и синхронизации выше.'
      : 'Complete the local data and synchronization requirements above to continue.',
});

export type SafetyRecoveryPreflightCopy = ReturnType<typeof getSafetyRecoveryPreflightCopy>;
