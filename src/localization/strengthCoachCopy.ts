import type { SupportedLocale } from './messages';

const pluralRu = (count: number, forms: [string, string, string]) => {
  const mod10 = Math.abs(count) % 10;
  const mod100 = Math.abs(count) % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
};

const localizedCount = (
  locale: SupportedLocale,
  count: number,
  formatted: string,
  en: [string, string],
  ru: [string, string, string],
) =>
  locale === 'ru'
    ? `${formatted} ${pluralRu(count, ru)}`
    : `${formatted} ${count === 1 ? en[0] : en[1]}`;

export const getStrengthCoachCopy = (locale: SupportedLocale) => {
  const strategyLabels: Record<string, string> = {
    deload: locale === 'ru' ? 'Разгрузка' : 'Deload',
    maintain: locale === 'ru' ? 'Сохранение нагрузки' : 'Maintain',
    progress: locale === 'ru' ? 'Прогрессия' : 'Progress',
  };
  const guardrailLabels: Record<string, string> = {
    valid: locale === 'ru' ? 'Проверка пройдена' : 'Validated',
    modify: locale === 'ru' ? 'Требуются изменения' : 'Changes required',
    blocked: locale === 'ru' ? 'Заблокировано' : 'Blocked',
  };
  const adjustmentLabels: Record<string, string> = {
    decrease: locale === 'ru' ? 'Снизить' : 'Decrease',
    maintain: locale === 'ru' ? 'Сохранить' : 'Maintain',
    increase: locale === 'ru' ? 'Повысить' : 'Increase',
  };
  const rationaleLabels: Record<string, string> = {
    high_recorded_rpe:
      locale === 'ru' ? 'Высокая фактическая нагрузка RPE' : 'High recorded RPE',
    low_recorded_rpe:
      locale === 'ru' ? 'Низкая фактическая нагрузка RPE' : 'Low recorded RPE',
    stable_performance:
      locale === 'ru' ? 'Стабильное выполнение' : 'Stable performance',
    volume_policy: locale === 'ru' ? 'Ограничение объёма' : 'Volume policy',
    limited_rpe_data:
      locale === 'ru' ? 'Недостаточно данных RPE' : 'Limited RPE data',
  };
  const caveatLabels: Record<string, string> = {
    limited_rpe_data:
      locale === 'ru'
        ? 'Часть подходов не содержит фактического RPE.'
        : 'Some completed sets do not include actual RPE.',
    source_session_only:
      locale === 'ru'
        ? 'Предложение основано прежде всего на выбранной завершённой тренировке.'
        : 'The proposal is based primarily on the selected completed workout.',
    recovery_context_not_available:
      locale === 'ru'
        ? 'Контекст восстановления для этого предложения ограничен.'
        : 'Recovery context is limited for this proposal.',
  };

  return {
    back: locale === 'ru' ? 'Назад' : 'Back',
    title: locale === 'ru' ? 'Силовой тренер' : 'Strength Coach',
    subtitle:
      locale === 'ru'
        ? 'Детерминированный анализ · контролируемый предпросмотр'
        : 'Deterministic review · guarded preview',
    preview: locale === 'ru' ? 'Предпросмотр' : 'Preview',
    providerAndConfirmationAvailable:
      locale === 'ru'
        ? 'Структурированный предпросмотр и подтверждение доступны'
        : 'Structured preview and confirmation available',
    providerAvailable:
      locale === 'ru'
        ? 'Структурированный предпросмотр доступен'
        : 'Structured preview available',
    checkingCapabilities:
      locale === 'ru' ? 'Проверка возможностей backend' : 'Checking backend capabilities',
    capabilityUnknown:
      locale === 'ru'
        ? 'Доступность AI-предпросмотра не удалось проверить'
        : 'AI preview availability could not be verified',
    providerDisabled:
      locale === 'ru'
        ? 'Структурированный предпросмотр не включён'
        : 'Structured preview is not enabled',
    validatedAnalysis:
      locale === 'ru' ? 'Проверенный анализ тренировок' : 'Validated training analysis',
    validatedBody:
      locale === 'ru'
        ? 'Экран использует синхронизированные завершённые подходы, детерминированные метрики и жёсткие guardrails. Подтверждённая strategy создаёт новый шаблон и не изменяет историю завершённых тренировок.'
        : 'This screen uses synchronized completed sets, deterministic metrics and hard guardrails. A confirmed strategy creates a new template and never changes completed workout history.',
    preparing:
      locale === 'ru'
        ? 'Подготовка аккаунта и данных тренировок…'
        : 'Preparing account and training data…',
    signInRequired: locale === 'ru' ? 'Требуется вход' : 'Sign in required',
    signInBody:
      locale === 'ru'
        ? 'Силовой тренер использует только тренировочные данные, синхронизированные с защищённым backend-аккаунтом.'
        : 'Strength Coach reads only training data synchronized to your protected backend account.',
    signIn: locale === 'ru' ? 'Войти' : 'Sign in',
    trainingContext: locale === 'ru' ? 'Контекст тренировки' : 'Training context',
    unknownDate: locale === 'ru' ? 'Дата неизвестна' : 'Unknown date',
    selectedPrimarySession: (count: number, formatted: string) =>
      locale === 'ru'
        ? `${localizedCount(locale, count, formatted, ['set', 'sets'], ['завершённый подход', 'завершённых подхода', 'завершённых подходов'])} выбрано как основная тренировка`
        : `${localizedCount(locale, count, formatted, ['completed set', 'completed sets'], ['подход', 'подхода', 'подходов'])} selected as the primary workout`,
    noCompletedWorkout:
      locale === 'ru'
        ? 'Нет доступной завершённой локальной тренировки. Сначала завершите и синхронизируйте тренировку.'
        : 'No completed local workout is available. Finish and synchronize a workout first.',
    reviewLatestWorkout:
      locale === 'ru' ? 'Проверить последнюю тренировку' : 'Review latest workout',
    proposeNextWorkout:
      locale === 'ru' ? 'Предложить следующую тренировку' : 'Propose next workout',
    generateStrategy:
      locale === 'ru' ? 'Сформировать AI-силовую strategy' : 'Generate AI Strength Strategy',
    capabilityChecking:
      locale === 'ru'
        ? 'Проверка доступности AI-силовой strategy…'
        : 'Checking whether AI Strength Strategy is enabled…',
    capabilityUnavailable:
      locale === 'ru'
        ? 'Доступность AI-силовой strategy не подтверждена. Детерминированный анализ остаётся доступным.'
        : 'AI Strength Strategy availability could not be verified. Deterministic review remains available.',
    capabilityDisabled:
      locale === 'ru'
        ? 'AI-силовая strategy не включена на этом backend.'
        : 'AI Strength Strategy is not enabled on this backend.',
    disclaimer:
      locale === 'ru'
        ? 'Детерминированное предложение зеркально сопоставляет завершённые подходы. Опциональная AI-strategy должна сопоставить каждый исходный подход ровно один раз и пройти проверки веса, повторений, RPE и общего объёма.'
        : 'The deterministic proposal mirrors completed sets. The optional AI strategy must map every source set exactly once and pass load, repetition, RPE and volume policies.',
    requestError: locale === 'ru' ? 'Ошибка запроса' : 'Request error',
    reviewFailed:
      locale === 'ru'
        ? 'Силовой тренер не смог завершить анализ. Проверьте подключение и синхронизацию.'
        : 'Strength Coach could not complete the review. Check connectivity and synchronization.',
    proposalFailed:
      locale === 'ru'
        ? 'Не удалось сформировать предложение следующей тренировки.'
        : 'The next-workout proposal could not be completed.',
    strategyFailed:
      locale === 'ru'
        ? 'Не удалось завершить предпросмотр силовой strategy.'
        : 'The Strength Strategy preview could not be completed.',
    confirmationFailed:
      locale === 'ru'
        ? 'Не удалось создать новый шаблон тренировки.'
        : 'The workout template could not be created.',
    createTemplateTitle:
      locale === 'ru' ? 'Создать шаблон тренировки?' : 'Create workout template?',
    createTemplateBody: (
      strategy: string,
      setCount: number,
      formattedSets: string,
      volume: string,
      weightUnit: string,
    ) =>
      locale === 'ru'
        ? `Создать новый шаблон «${strategy}» с ${localizedCount(locale, setCount, formattedSets, ['set', 'sets'], ['сопоставленным подходом', 'сопоставленными подходами', 'сопоставленными подходами'])} и предложенным объёмом ${volume} ${weightUnit}?\n\nЗавершённая исходная тренировка не изменится.`
        : `Create a new ${strategy} template with ${localizedCount(locale, setCount, formattedSets, ['mapped set', 'mapped sets'], ['подход', 'подхода', 'подходов'])} and ${volume} ${weightUnit} proposed volume?\n\nThe completed source workout will not be changed.`,
    cancel: locale === 'ru' ? 'Отмена' : 'Cancel',
    createTemplate: locale === 'ru' ? 'Создать шаблон' : 'Create template',
    runStatus: {
      queued: locale === 'ru' ? 'В очереди' : 'Queued',
      running: locale === 'ru' ? 'Выполняется' : 'Running',
      completed: locale === 'ru' ? 'Завершено' : 'Completed',
      rejected: locale === 'ru' ? 'Отклонено' : 'Rejected',
      failed: locale === 'ru' ? 'Ошибка' : 'Failed',
    } as Record<string, string>,
    analysisInProgressTitle: locale === 'ru' ? 'Анализ выполняется' : 'Analysis in progress',
    analysisInProgressBody:
      locale === 'ru'
        ? 'Синхронизированная история тренировок проходит детерминированную проверку.'
        : 'Your synchronized training history is being validated deterministically.',
    resultUnavailableTitle:
      locale === 'ru' ? 'Результат недоступен' : 'Result unavailable',
    resultUnavailableBody:
      locale === 'ru'
        ? 'Результат не прошёл безопасную локальную проверку или запуск завершился ошибкой.'
        : 'The result did not pass safe local validation or the run could not be completed.',
    moreDataRequiredTitle:
      locale === 'ru' ? 'Нужно больше данных' : 'More data is required',
    moreDataRequiredBody:
      locale === 'ru'
        ? 'Детерминированная проверка не одобрила результат. Завершите и синхронизируйте больше тренировочных подходов.'
        : 'Deterministic validation did not approve a result. Complete and synchronize more training sets.',
    workoutReviewTitle: locale === 'ru' ? 'Разбор тренировки' : 'Workout review',
    workoutReviewBody:
      locale === 'ru'
        ? 'Метрики рассчитаны детерминированно по синхронизированным завершённым подходам.'
        : 'Metrics were calculated deterministically from synchronized completed sets.',
    nextWorkoutProposalTitle:
      locale === 'ru' ? 'Предложение следующей тренировки' : 'Next workout proposal',
    nextWorkoutProposalBody:
      locale === 'ru'
        ? 'Предложение детерминированно построено по последней завершённой тренировке.'
        : 'A deterministic proposal was generated from the latest completed workout.',
    strategyInProgressTitle:
      locale === 'ru' ? 'Strategy формируется' : 'Strategy in progress',
    strategyInProgressBody:
      locale === 'ru'
        ? 'Исходная тренировка и детерминированные политики проходят проверку.'
        : 'The source workout and deterministic policies are being validated.',
    strategyRejectedTitle:
      locale === 'ru' ? 'Силовая strategy отклонена' : 'Strength Strategy rejected',
    strategyRejectedBody:
      locale === 'ru'
        ? 'Детерминированный pipeline отклонил strategy по типизированной политике.'
        : 'The deterministic pipeline rejected this strategy with a typed policy reason.',
    providerUnavailableTitle:
      locale === 'ru' ? 'AI-силовая strategy недоступна' : 'AI Strength Strategy unavailable',
    providerUnavailableBody:
      locale === 'ru'
        ? 'Модельный provider отключён. Детерминированный разбор и предложение следующей тренировки остаются доступными.'
        : 'The model provider is disabled. Deterministic review and next-workout proposal remain available.',
    invalidAfterRetriesTitle:
      locale === 'ru' ? 'Strategy отклонена после проверок' : 'Strategy rejected after validation',
    invalidAfterRetriesBody:
      locale === 'ru'
        ? 'Структурированное предложение не смогло пройти правила сопоставления исходных подходов и объёма за ограниченное число попыток.'
        : 'The structured proposal could not satisfy source-set and volume rules within the bounded attempts.',
    strategyPreviewTitle:
      locale === 'ru' ? 'Предпросмотр AI-силовой strategy' : 'AI Strength Strategy preview',
    strategyPreviewBody:
      locale === 'ru'
        ? 'Предложение прошло локальную типизированную проверку и детерминированные guardrails.'
        : 'The proposal passed local typed parsing and deterministic guardrails.',
    templateCreatedTitle:
      locale === 'ru' ? 'Шаблон тренировки создан' : 'Workout template created',
    templateCreatedBody:
      locale === 'ru'
        ? 'Backend повторно проверил предложение и создал новый синхронизированный шаблон. Завершённая исходная тренировка не изменена.'
        : 'The backend revalidated the proposal and created a new synchronized template. The completed source workout was not modified.',
    completedSets: locale === 'ru' ? 'Завершённые подходы' : 'Completed sets',
    totalReps: locale === 'ru' ? 'Всего повторений' : 'Total reps',
    tonnage: locale === 'ru' ? 'Общий объём' : 'Tonnage',
    averageRpe: locale === 'ru' ? 'Средний RPE' : 'Average RPE',
    guardrail: locale === 'ru' ? 'Guardrail' : 'Guardrail',
    targetRpe: locale === 'ru' ? 'целевой RPE' : 'target RPE',
    deterministicIssues: (count: number, formatted: string) =>
      locale === 'ru'
        ? `${localizedCount(locale, count, formatted, ['issue', 'issues'], ['типизированное замечание', 'типизированных замечания', 'типизированных замечаний'])}. Подробности скрыты, чтобы не показывать необработанные backend-сообщения.`
        : `${localizedCount(locale, count, formatted, ['typed finding', 'typed findings'], ['замечание', 'замечания', 'замечаний'])}. Details are bounded so raw backend messages are not displayed.`,
    previewNotApplied:
      locale === 'ru' ? 'Предпросмотр · не применено' : 'Preview · not applied',
    templateCreated: locale === 'ru' ? 'Шаблон создан' : 'Template created',
    confirmationPreviewBody:
      locale === 'ru'
        ? 'Предложение прошло проверки сопоставления исходных подходов, веса, повторений, RPE и общего объёма. Подтверждение создаёт новый шаблон и не изменяет историю тренировок.'
        : 'The proposal passed source-set, load, repetition, RPE and total-volume validation. Confirmation creates a new template and does not edit workout history.',
    confirmationUnavailableBody:
      locale === 'ru'
        ? 'Предложение прошло детерминированную проверку, но этот backend не объявляет поддержку подтверждения.'
        : 'The proposal passed deterministic validation, but this backend does not advertise confirmation support.',
    revision: locale === 'ru' ? 'Ревизия' : 'Revision',
    dataQuality: locale === 'ru' ? 'Качество данных' : 'Data quality',
    confidence: locale === 'ru' ? 'Уверенность' : 'Confidence',
    proposedVolume: locale === 'ru' ? 'Предложенный объём' : 'Proposed volume',
    volumeChange: locale === 'ru' ? 'Изменение объёма' : 'Volume change',
    mappedSets: locale === 'ru' ? 'Сопоставленные подходы' : 'Mapped sets',
    rationale: locale === 'ru' ? 'Обоснование' : 'Rationale',
    caveats: locale === 'ru' ? 'Ограничения' : 'Caveats',
    guardrailIssues: locale === 'ru' ? 'Результаты guardrail' : 'Guardrail findings',
    confirmationExplanation:
      locale === 'ru'
        ? 'Отправляются только ID запуска и новый idempotency key. Backend повторно загружает и проверяет сохранённое предложение перед созданием шаблона.'
        : 'Only the run ID and a new idempotency key are sent. The backend reloads and revalidates the saved proposal before creating the template.',
    validationAttempts: (count: number, formatted: string) =>
      localizedCount(locale, count, formatted, ['validation attempt', 'validation attempts'], ['попытка проверки', 'попытки проверки', 'попыток проверки']),
    sets: (count: number, formatted: string) =>
      localizedCount(locale, count, formatted, ['set', 'sets'], ['подход', 'подхода', 'подходов']),
    reps: (count: number, formatted: string) =>
      localizedCount(locale, count, formatted, ['rep', 'reps'], ['повторение', 'повторения', 'повторений']),
    strategyLabel: (value: string) =>
      strategyLabels[value] ?? (locale === 'ru' ? 'Силовая strategy' : 'Strength strategy'),
    guardrailLabel: (value: string) =>
      guardrailLabels[value] ?? (locale === 'ru' ? 'Статус проверки' : 'Validation status'),
    adjustmentLabel: (value: string) =>
      adjustmentLabels[value] ?? (locale === 'ru' ? 'Скорректировать' : 'Adjust'),
    dataQualityLabel: (value: string) =>
      value === 'sufficient'
        ? locale === 'ru' ? 'Достаточное' : 'Sufficient'
        : locale === 'ru' ? 'Ограниченное' : 'Limited',
    rationaleLabel: (code: string) =>
      rationaleLabels[code] ?? (locale === 'ru' ? 'Детерминированное правило нагрузки' : 'Deterministic load rule'),
    caveatLabel: (code: string) =>
      caveatLabels[code] ?? (locale === 'ru' ? 'Учитывайте индивидуальное восстановление и самочувствие.' : 'Consider individual recovery and readiness.'),
    issueLabel: (code: string, severity: string) => {
      if (code === 'source_set_mapping_invalid') {
        return locale === 'ru'
          ? 'Сопоставление исходных подходов требует исправления.'
          : 'Source-set mapping requires correction.';
      }
      if (code === 'volume_change_out_of_range') {
        return locale === 'ru'
          ? 'Изменение общего объёма выходит за допустимую границу.'
          : 'The total-volume change is outside the allowed boundary.';
      }
      if (severity === 'hard_block') {
        return locale === 'ru'
          ? 'Детерминированная проверка заблокировала предложение.'
          : 'A deterministic guardrail blocked the proposal.';
      }
      if (severity === 'modify') {
        return locale === 'ru'
          ? 'Предложение требует детерминированной корректировки.'
          : 'The proposal requires deterministic modification.';
      }
      return locale === 'ru'
        ? 'Проверьте типизированное предупреждение перед подтверждением.'
        : 'Review the typed warning before confirmation.';
    },
    rejectionCopy: (reason: string) => {
      if (reason === 'strength_model_provider_unavailable') {
        return {
          title: locale === 'ru' ? 'AI-силовая strategy недоступна' : 'AI Strength Strategy unavailable',
          message:
            locale === 'ru'
              ? 'Модельный provider отключён. Детерминированный анализ остаётся доступным.'
              : 'The model provider is disabled. Deterministic review remains available.',
        };
      }
      if (reason === 'strength_strategy_invalid_after_retries') {
        return {
          title: locale === 'ru' ? 'Strategy отклонена после проверок' : 'Strategy rejected after validation',
          message:
            locale === 'ru'
              ? 'Предложение не прошло детерминированные правила за ограниченное число попыток.'
              : 'The proposal did not satisfy deterministic rules within the bounded attempts.',
        };
      }
      return {
        title: locale === 'ru' ? 'Силовая strategy отклонена' : 'Strength Strategy rejected',
        message:
          locale === 'ru'
            ? 'Детерминированный pipeline вернул типизированное отклонение.'
            : 'The deterministic pipeline returned a typed rejection.',
      };
    },
  };
};

export type StrengthCoachCopy = ReturnType<typeof getStrengthCoachCopy>;
