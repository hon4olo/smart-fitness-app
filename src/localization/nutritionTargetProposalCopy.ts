import type { SupportedLocale } from './messages';

export const getNutritionTargetProposalCopy = (locale: SupportedLocale) => {
  const isRussian = locale === 'ru';
  const guardrailLabels = {
    valid: isRussian ? 'Допустимо' : 'Valid',
    modify: isRussian ? 'Нужна корректировка' : 'Needs adjustment',
    blocked: isRussian ? 'Заблокировано' : 'Blocked',
  } as const;

  return {
    back: isRussian ? 'Назад' : 'Back',
    title: isRussian ? 'Предложение целевых значений' : 'Target Proposal',
    subtitle: isRussian ? 'Детерминированные ограничения' : 'Deterministic guardrails',
    preview: isRussian ? 'Предпросмотр' : 'Preview',
    explicitConfirmation: isRussian
      ? 'Требуется явное подтверждение'
      : 'Explicit confirmation required',
    reconciliationTitle: isRussian
      ? 'Корректировка макросов без изменения калорий'
      : 'Calorie-neutral macro reconciliation',
    reconciliationBody: isRussian
      ? 'Проверяет соответствие 4Б + 4У + 9Ж текущей цели калорий и предлагает минимальную корректировку макросов. Калории не повышаются и не снижаются на основании наблюдаемого питания.'
      : 'Checks 4P + 4C + 9F against the current calorie target and proposes the smallest macro correction. It never raises or lowers calories from observed eating behaviour.',
    preparing: isRussian ? 'Подготовка синхронизированных данных…' : 'Preparing synchronized data…',
    signInRequired: isRussian ? 'Требуется вход' : 'Sign in required',
    signIn: isRussian ? 'Войти' : 'Sign in',
    validationPeriod: isRussian ? 'Период проверки' : 'Validation period',
    days: (count: number, formatted: string) =>
      isRussian
        ? `${formatted} ${count % 10 === 1 && count % 100 !== 11 ? 'день' : count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 12 || count % 100 > 14) ? 'дня' : 'дней'}`
        : `${formatted} day${count === 1 ? '' : 's'}`,
    generate: isRussian ? 'Сформировать безопасное предложение' : 'Generate guarded proposal',
    requirements: isRussian
      ? 'Нужно минимум три дня с записями и активная синхронизированная цель. Применение допустимого результата запускает backend-проверку ревизии и обычную синхронизацию.'
      : 'Requires at least three tracked days and an active synchronized target. Applying a valid result triggers backend revision checks and then normal sync pull.',
    requestError: isRussian ? 'Ошибка запроса' : 'Request error',
    requestFailed: isRussian
      ? 'Nutrition Coach не смог сформировать предложение. Проверьте подключение и синхронизацию, затем повторите попытку.'
      : 'Nutrition Coach could not generate the proposal. Check connectivity and synchronization, then try again.',
    applyFailed: isRussian
      ? 'Не удалось применить предложение. Сформируйте новое предложение и повторите попытку.'
      : 'The proposal could not be applied. Generate a new proposal and try again.',
    current: isRussian ? 'Текущие' : 'Current',
    proposed: isRussian ? 'Предлагаемые' : 'Proposed',
    proteinShort: isRussian ? 'Б' : 'P',
    carbsShort: isRussian ? 'У' : 'C',
    fatsShort: isRussian ? 'Ж' : 'F',
    pendingTitle: isRussian ? 'Предложение формируется' : 'Proposal in progress',
    pendingMessage: isRussian
      ? 'Синхронизированные записи питания и целевые значения проходят детерминированную проверку.'
      : 'Synchronized nutrition records and targets are being validated deterministically.',
    failedTitle: isRussian ? 'Предложение недоступно' : 'Proposal unavailable',
    failedMessage: isRussian
      ? 'Результат не прошёл безопасную локальную проверку или запрос завершился ошибкой.'
      : 'The result did not pass safe local validation or the request could not be completed.',
    rejectedTitle: isRussian ? 'Предложение отклонено' : 'Proposal rejected',
    rejectedMessage: isRussian
      ? 'Детерминированная политика не разрешила изменение целевых значений.'
      : 'The deterministic policy did not allow a target change.',
    proposalTitle: isRussian ? 'Проверенное предложение' : 'Validated proposal',
    proposalMessage: isRussian
      ? 'Значения рассчитаны из синхронизированной активной цели и применяются только после явного подтверждения.'
      : 'Values were calculated from the synchronized active target and apply only after explicit confirmation.',
    guardrail: isRussian ? 'Ограничение' : 'Guardrail',
    guardrailLabel: (status: keyof typeof guardrailLabels) => guardrailLabels[status],
    mathValidation: isRussian ? 'Проверка расчёта' : 'Math validation',
    before: isRussian ? 'До' : 'Before',
    after: isRussian ? 'После' : 'After',
    mismatch: isRussian ? 'расхождение' : 'mismatch',
    issueMessage: isRussian
      ? 'Предложение содержит типизированное ограничение. Проверьте статус и сформируйте новое предложение после исправления исходных данных.'
      : 'The proposal contains a typed guardrail finding. Review the status and generate a new proposal after correcting the source data.',
    applied: isRussian ? 'Применено' : 'Applied',
    appliedBody: (revision: number, date: string) =>
      isRussian
        ? `Backend создал ревизию ${revision} ${date}. Запрошена обычная синхронизация.`
        : `Backend revision ${revision} was created ${date}. A normal sync pull was requested.`,
    notApplied: isRussian ? 'Не применено' : 'Not applied',
    notAppliedBody: isRussian
      ? 'Backend повторно загрузит текущую цель, сравнит её ревизию с предложением и снова выполнит ограничения перед записью.'
      : 'The backend will reload the current target, compare its revision with this proposal and rerun guardrails before writing.',
    applyValidated: isRussian ? 'Применить проверенную цель' : 'Apply validated target',
    applyTitle: isRussian ? 'Применить изменения целевых значений?' : 'Apply nutrition target changes?',
    applyBody: (energy: string, protein: string, carbs: string, fats: string) =>
      isRussian
        ? `Калории останутся на уровне ${energy}. Макросы изменятся на Б ${protein}, У ${carbs}, Ж ${fats}. Backend отклонит изменение, если цель устарела.`
        : `Calories stay at ${energy}. Macros will change to P ${protein}, C ${carbs}, F ${fats}. The backend will reject the change if the target is stale.`,
    cancel: isRussian ? 'Отмена' : 'Cancel',
    apply: isRussian ? 'Применить' : 'Apply',
  };
};

export type NutritionTargetProposalCopy = ReturnType<typeof getNutritionTargetProposalCopy>;
