import type {
  SafetyRecoveryIssueSeverity,
  SafetyRecoveryRestrictionAction,
  SafetyRecoveryStatus,
  SafetyRecoveryViewModel,
} from '@/features/coach/safetyRecoveryViewModel';
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

export const getSafetyRecoveryReviewCopy = (locale: SupportedLocale) => {
  const actionLabels: Record<SafetyRecoveryRestrictionAction, string> = {
    monitor: locale === 'ru' ? 'Наблюдать' : 'Monitor',
    reduce_load: locale === 'ru' ? 'Снизить нагрузку' : 'Reduce load',
    avoid_movement: locale === 'ru' ? 'Исключить движение' : 'Avoid movement',
    pause_training: locale === 'ru' ? 'Приостановить тренировки' : 'Pause training',
  };
  const issueSeverityLabels: Record<SafetyRecoveryIssueSeverity, string> = {
    input_required: locale === 'ru' ? 'Нужны данные' : 'Input required',
    warning: locale === 'ru' ? 'Предупреждение' : 'Warning',
    modify: locale === 'ru' ? 'Модификация' : 'Modify',
    hard_block: locale === 'ru' ? 'Блокировка' : 'Hard block',
  };
  const readinessStatusLabels: Record<SafetyRecoveryStatus, string> = {
    ready: locale === 'ru' ? 'Готово' : 'Ready',
    needs_input: locale === 'ru' ? 'Нужны данные' : 'Needs input',
    modify: locale === 'ru' ? 'Нужна модификация' : 'Modify',
    blocked: locale === 'ru' ? 'Тренировка заблокирована' : 'Blocked',
  };
  const resultCopy: Record<SafetyRecoveryStatus, { title: string; message: string }> = {
    blocked: {
      title: locale === 'ru' ? 'Тренировка приостановлена' : 'Training paused',
      message:
        locale === 'ru'
          ? 'Активное ограничение явно требует приостановить тренировки. Анализ не может одобрить рекомендацию к тренировке.'
          : 'An active limitation was explicitly marked to pause training. This review cannot approve a training recommendation.',
    },
    needs_input: {
      title: locale === 'ru' ? 'Нужны данные о восстановлении' : 'Recovery input required',
      message:
        locale === 'ru'
          ? 'Для продолжения детерминированного анализа нужна актуальная проверка с достаточным количеством показателей восстановления.'
          : 'A recent check-in with enough recovery signals is required before the deterministic review can continue.',
    },
    modify: {
      title: locale === 'ru' ? 'Тренировку следует изменить' : 'Training should be modified',
      message:
        locale === 'ru'
          ? 'Детерминированный анализ рекомендует снизить нагрузку или исключить затронутые движения.'
          : 'The deterministic review recommends reducing load or excluding affected movement patterns.',
    },
    ready: {
      title: locale === 'ru' ? 'Готовность к обычной тренировке' : 'Ready for normal training',
      message:
        locale === 'ru'
          ? 'Доступные данные о восстановлении не активировали детерминированное снижение нагрузки или жёсткую блокировку.'
          : 'The available self-reported recovery data did not trigger a deterministic load reduction or hard block.',
    },
  };

  const viewModelCopy = (viewModel: SafetyRecoveryViewModel) => {
    if (viewModel.kind === 'pending') {
      return {
        title: locale === 'ru' ? 'Анализ выполняется' : 'Review in progress',
        message:
          locale === 'ru'
            ? 'Синхронизированные ограничения и проверки восстановления проходят валидацию.'
            : 'Synchronized limitations and recovery check-ins are being validated.',
      };
    }
    if (viewModel.kind === 'failed') {
      return {
        title: locale === 'ru' ? 'Не удалось прочитать результат' : 'Review unavailable',
        message:
          locale === 'ru'
            ? 'Результат не прошёл безопасную локальную проверку или анализ завершился ошибкой.'
            : 'The result did not pass safe local validation or the review could not be completed.',
      };
    }
    return resultCopy[viewModel.readiness.status];
  };

  const issueCopy = (code: string) => {
    if (code === 'RECOVERY_CHECK_IN_REQUIRED') {
      return {
        title: locale === 'ru' ? 'Нужна проверка восстановления' : 'Recovery check-in required',
        message:
          locale === 'ru'
            ? 'Для анализа нужна актуальная проверка восстановления.'
            : 'A recent recovery check-in is required.',
      };
    }
    if (code === 'LIMITATION_MOVEMENT_AVOIDANCE_REQUIRED') {
      return {
        title: locale === 'ru' ? 'Нужно исключить движение' : 'Movement avoidance required',
        message:
          locale === 'ru'
            ? 'Указанные движения необходимо исключить из тренировки.'
            : 'The listed movement patterns must be excluded.',
      };
    }
    return {
      title: locale === 'ru' ? 'Результат проверки' : 'Review finding',
      message:
        locale === 'ru'
          ? 'Анализ вернул типизированное ограничение. Проверьте уровень серьёзности и связанные данные.'
          : 'The review returned a typed finding. Check its severity and related data.',
    };
  };

  return {
    actionLabels,
    issueSeverityLabels,
    readinessStatusLabels,
    resultCopy,
    viewModelCopy,
    issueCopy,
    back: locale === 'ru' ? 'Назад' : 'Back',
    title: locale === 'ru' ? 'Безопасность и восстановление' : 'Safety & Recovery',
    subtitle:
      locale === 'ru'
        ? 'Детерминированная готовность по самооценке'
        : 'Deterministic self-reported readiness',
    deterministic: locale === 'ru' ? 'Детерминированный' : 'Deterministic',
    checkingCapability:
      locale === 'ru' ? 'Проверка возможностей backend' : 'Checking backend capability',
    available: locale === 'ru' ? 'Safety Recovery v5 доступен' : 'Safety Recovery v5 available',
    unavailable: locale === 'ru' ? 'Safety Recovery недоступен' : 'Safety Recovery unavailable',
    readinessReview: locale === 'ru' ? 'Анализ готовности' : 'Readiness review',
    introduction:
      locale === 'ru'
        ? 'Backend анализирует синхронизированные ограничения и проверки восстановления, указанные пользователем. Он не ставит диагноз, не читает заметки в свободной форме и не применяет изменения автоматически.'
        : 'The backend evaluates synchronized self-reported limitations and recovery check-ins. It does not diagnose a condition, read free-text notes, or apply changes automatically.',
    preparing:
      locale === 'ru' ? 'Подготовка аккаунта и данных восстановления…' : 'Preparing account and recovery data…',
    signInRequired: locale === 'ru' ? 'Требуется вход' : 'Sign in required',
    signInBody:
      locale === 'ru'
        ? 'Safety & Recovery использует только записи, синхронизированные с защищённым backend-аккаунтом.'
        : 'Safety & Recovery reads only records synchronized to your protected backend account.',
    signIn: locale === 'ru' ? 'Войти' : 'Sign in',
    reviewPeriod: locale === 'ru' ? 'Период анализа' : 'Review period',
    days: (count: number, formatted: string) =>
      locale === 'ru'
        ? `${formatted} ${pluralRu(count, ['день', 'дня', 'дней'])}`
        : `${formatted} day${count === 1 ? '' : 's'}`,
    runReview: locale === 'ru' ? 'Запустить анализ готовности' : 'Run readiness review',
    capabilityHint:
      locale === 'ru'
        ? 'Кнопка остаётся недоступной, пока авторизованный backend не вернёт точный safety-контракт v5.'
        : 'This control remains disabled until the authenticated backend returns the exact capability v5 safety contract.',
    requestError: locale === 'ru' ? 'Ошибка запроса' : 'Request error',
    requestErrorBody:
      locale === 'ru'
        ? 'Safety & Recovery не смог завершить запрос. Повторите попытку после проверки подключения и синхронизации.'
        : 'Safety & Recovery could not complete the request. Try again after checking connectivity and synchronization.',
    runStatusLabels: {
      queued: locale === 'ru' ? 'В очереди' : 'Queued',
      running: locale === 'ru' ? 'Выполняется' : 'Running',
      completed: locale === 'ru' ? 'Завершено' : 'Completed',
      rejected: locale === 'ru' ? 'Отклонено' : 'Rejected',
      failed: locale === 'ru' ? 'Ошибка' : 'Failed',
    } as Record<string, string>,
    recommendedLoad: locale === 'ru' ? 'Рекомендуемая нагрузка' : 'Recommended load',
    recoverySignals: locale === 'ru' ? 'Показатели восстановления' : 'Recovery signals',
    readinessStatus: locale === 'ru' ? 'Статус готовности' : 'Readiness status',
    latestCheckIn: locale === 'ru' ? 'Последняя проверка' : 'Latest check-in',
    notAvailable: locale === 'ru' ? 'Недоступно' : 'Not available',
    hoursAgo: (count: number, formatted: string) =>
      locale === 'ru'
        ? `${formatted} ${pluralRu(count, ['час', 'часа', 'часов'])} назад`
        : `${formatted} h ago`,
    explicitConfirmation:
      locale === 'ru' ? 'Явное подтверждение' : 'Explicit confirmation',
    required: locale === 'ru' ? 'Требуется' : 'Required',
    notRequired: locale === 'ru' ? 'Не требуется' : 'Not required',
    automaticApplication:
      locale === 'ru' ? 'Автоматическое применение' : 'Automatic application',
    neverApproved: locale === 'ru' ? 'Никогда не одобрено' : 'Never approved',
    activeRestrictions: locale === 'ru' ? 'Активные ограничения' : 'Active restrictions',
    maximumAffectedLoad: (percent: string) =>
      locale === 'ru'
        ? `максимальная затронутая нагрузка ${percent}%`
        : `maximum affected load ${percent}%`,
    movements: locale === 'ru' ? 'Движения' : 'Movements',
    reviewFindings: locale === 'ru' ? 'Результаты анализа' : 'Review findings',
    noFindings:
      locale === 'ru'
        ? 'Детерминированные результаты по восстановлению или ограничениям не возвращены.'
        : 'No deterministic recovery or limitation findings were returned.',
    snapshotSaved:
      locale === 'ru'
        ? 'Сохранено для проверки безопасности и восстановления перед тренировкой.'
        : 'Saved for the pre-workout Safety & Recovery check.',
    snapshotFailed:
      locale === 'ru'
        ? 'Анализ завершён, но локальный снимок перед тренировкой сохранить не удалось.'
        : 'Review completed, but the local pre-workout snapshot could not be saved.',
    disclaimer:
      locale === 'ru'
        ? 'Результат основан на данных самооценки и не является медицинским диагнозом или рекомендацией по лечению.'
        : 'This product result is based on self-reported data and is not a medical diagnosis or treatment recommendation.',
  };
};

export type SafetyRecoveryReviewCopy = ReturnType<typeof getSafetyRecoveryReviewCopy>;
