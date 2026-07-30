import type {
  CombinedCoachIssue,
  CombinedCoachStatus,
  CombinedCoachViewModel,
} from '@/features/coach/combinedCoachViewModel';

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

export const getCombinedReviewCopy = (locale: SupportedLocale) => {
  const statusLabels: Record<CombinedCoachStatus, string> = {
    ready: locale === 'ru' ? 'Готово' : 'Ready',
    modify: locale === 'ru' ? 'Нужны изменения' : 'Modify',
    needs_input: locale === 'ru' ? 'Нужны данные' : 'Needs input',
    blocked: locale === 'ru' ? 'Заблокировано' : 'Blocked',
  };
  const statusPresentation: Record<CombinedCoachStatus, { title: string; message: string }> = {
    blocked: {
      title: locale === 'ru' ? 'Объединённый анализ заблокирован' : 'Combined review blocked',
      message:
        locale === 'ru'
          ? 'Минимум один дочерний домен содержит жёсткую блокировку.'
          : 'At least one child domain contains a hard block.',
    },
    needs_input: {
      title: locale === 'ru' ? 'Нужны дополнительные данные' : 'More input required',
      message:
        locale === 'ru'
          ? 'Минимум одному дочернему домену не хватает синхронизированных данных.'
          : 'At least one child domain needs additional synchronized input.',
    },
    modify: {
      title: locale === 'ru' ? 'Проверьте модификации' : 'Review modifications',
      message:
        locale === 'ru'
          ? 'Объединённый анализ доступен с детерминированными корректировками.'
          : 'The combined review is available with deterministic modifications.',
    },
    ready: {
      title: locale === 'ru' ? 'Объединённый анализ готов' : 'Combined review ready',
      message:
        locale === 'ru'
          ? 'Все дочерние домены завершены без блокирующих результатов.'
          : 'All child domains completed without a blocking finding.',
    },
  };
  const issueSeverityLabels: Record<CombinedCoachIssue['severity'], string> = {
    input_required: locale === 'ru' ? 'Нужны данные' : 'Input required',
    warning: locale === 'ru' ? 'Предупреждение' : 'Warning',
    modify: locale === 'ru' ? 'Модификация' : 'Modify',
    hard_block: locale === 'ru' ? 'Блокировка' : 'Hard block',
  };
  const issueDomainLabels: Record<CombinedCoachIssue['domain'], string> = {
    strength: 'Strength',
    nutrition: locale === 'ru' ? 'Питание' : 'Nutrition',
    safety_recovery: locale === 'ru' ? 'Безопасность и восстановление' : 'Safety & Recovery',
  };
  const viewModelCopy = (viewModel: CombinedCoachViewModel) => {
    if (viewModel.kind === 'pending') {
      return {
        title: locale === 'ru' ? 'Объединённый анализ выполняется' : 'Combined review in progress',
        message:
          locale === 'ru'
            ? 'Дочерние Strength, Nutrition и Safety-запуски ещё выполняются.'
            : 'Strength, Nutrition, and Safety child runs are still being evaluated.',
      };
    }
    if (viewModel.kind === 'failed') {
      return {
        title: locale === 'ru' ? 'Анализ недоступен' : 'Review unavailable',
        message:
          locale === 'ru'
            ? 'Результат не прошёл безопасную локальную проверку или запуск завершился ошибкой.'
            : 'The result did not pass safe local validation or the run could not be completed.',
      };
    }
    return statusPresentation[viewModel.status];
  };

  return {
    statusLabels,
    issueSeverityLabels,
    issueDomainLabels,
    viewModelCopy,
    back: locale === 'ru' ? 'Назад' : 'Back',
    title: locale === 'ru' ? 'Объединённый Coach' : 'Combined Coach',
    subtitle: locale === 'ru' ? 'Strength · Питание · Безопасность' : 'Strength · Nutrition · Safety',
    localContext: locale === 'ru' ? 'Локальный контекст' : 'Local context',
    workout: locale === 'ru' ? 'Тренировка' : 'Workout',
    noWorkout: locale === 'ru' ? 'нет завершённой тренировки' : 'no completed workout',
    contextCounts: (nutritionDays: string, checkIns: string, limitations: string) =>
      locale === 'ru'
        ? `Дни питания: ${nutritionDays} · проверки восстановления: ${checkIns} · активные ограничения: ${limitations}`
        : `Nutrition days: ${nutritionDays} · recovery check-ins: ${checkIns} · active limitations: ${limitations}`,
    capability: locale === 'ru' ? 'Возможности' : 'Capability',
    capabilityAvailable: locale === 'ru' ? 'v6 доступна' : 'v6 available',
    capabilityUnavailable: locale === 'ru' ? 'не включено' : 'not enabled',
    sync: locale === 'ru' ? 'Синхронизация' : 'Sync',
    syncLabels: {
      idle: locale === 'ru' ? 'готово' : 'idle',
      syncing: locale === 'ru' ? 'выполняется' : 'syncing',
      success: locale === 'ru' ? 'завершена' : 'success',
      error: locale === 'ru' ? 'ошибка' : 'error',
      offline: locale === 'ru' ? 'нет подключения' : 'offline',
      conflict: locale === 'ru' ? 'конфликт' : 'conflict',
    } as Record<string, string>,
    preparing: locale === 'ru' ? 'Подготовка аккаунта…' : 'Preparing account…',
    signInRequired: locale === 'ru' ? 'Требуется вход' : 'Sign in required',
    signInBody:
      locale === 'ru'
        ? 'Combined Coach использует синхронизированные записи защищённого backend-аккаунта и дочерние Coach-запуски.'
        : 'Combined Coach uses account-scoped synchronized records and child Coach runs.',
    signIn: locale === 'ru' ? 'Войти' : 'Sign in',
    runTitle: locale === 'ru' ? 'Запустить детерминированный объединённый анализ' : 'Run deterministic combined review',
    runBody:
      locale === 'ru'
        ? 'Запускает существующие Strength, Nutrition и Safety & Recovery анализы параллельно, затем применяет единый финальный guardrail-статус.'
        : 'Runs the existing Strength, Nutrition, and Safety & Recovery reviews in parallel, then applies one final status guardrail.',
    runReview: locale === 'ru' ? 'Запустить Combined Coach' : 'Run Combined Coach review',
    capabilityHint:
      locale === 'ru'
        ? 'Кнопка недоступна, пока backend не объявит точный capability schema v6.'
        : 'Combined Coach remains unavailable until the backend advertises capability schema v6.',
    reviewSafety: locale === 'ru' ? 'Проверить Safety-входы' : 'Review Safety inputs',
    requestError: locale === 'ru' ? 'Ошибка объединённого анализа' : 'Combined Coach error',
    requestErrorBody:
      locale === 'ru'
        ? 'Не удалось завершить объединённый анализ. Проверьте подключение и синхронизацию, затем повторите попытку.'
        : 'Combined Coach could not complete the review. Check connectivity and synchronization, then try again.',
    strength: 'Strength',
    nutrition: locale === 'ru' ? 'Питание' : 'Nutrition',
    safetyRecovery: locale === 'ru' ? 'Безопасность и восстановление' : 'Safety & Recovery',
    strengthSummary: (sets: number, setsFormatted: string, reps: string) =>
      locale === 'ru'
        ? `${setsFormatted} ${pluralRu(sets, ['завершённый подход', 'завершённых подхода', 'завершённых подходов'])} · ${reps} повторений`
        : `${setsFormatted} completed ${sets === 1 ? 'set' : 'sets'} · ${reps} reps`,
    tonnageAndRpe: (tonnage: string, unit: string, rpe: string) =>
      locale === 'ru'
        ? `Тоннаж ${tonnage} ${unit} · средний RPE ${rpe}`
        : `Tonnage ${tonnage} ${unit} · average RPE ${rpe}`,
    nutritionSummary: (days: number, daysFormatted: string, coverage: string) =>
      locale === 'ru'
        ? `${daysFormatted} ${pluralRu(days, ['отслеживаемый день', 'отслеживаемых дня', 'отслеживаемых дней'])} · покрытие ${coverage}%`
        : `${daysFormatted} tracked ${days === 1 ? 'day' : 'days'} · ${coverage}% coverage`,
    nutritionAverages: (energy: string, energyUnit: string, protein: string) =>
      locale === 'ru'
        ? `Среднее ${energy} ${energyUnit} · белок ${protein} г`
        : `Average ${energy} ${energyUnit} · ${protein} g protein`,
    recommendedLoad: (percent: string) =>
      locale === 'ru' ? `Рекомендуемая нагрузка ${percent}%` : `Recommended load ${percent}%`,
    safetySummary: (restrictions: number, restrictionsFormatted: string, findings: number, findingsFormatted: string) =>
      locale === 'ru'
        ? `${restrictionsFormatted} ${pluralRu(restrictions, ['ограничение', 'ограничения', 'ограничений'])} · ${findingsFormatted} ${pluralRu(findings, ['результат', 'результата', 'результатов'])}`
        : `${restrictionsFormatted} ${restrictions === 1 ? 'restriction' : 'restrictions'} · ${findingsFormatted} ${findings === 1 ? 'finding' : 'findings'}`,
    finalGuardrail: locale === 'ru' ? 'Финальный guardrail' : 'Final guardrail',
    issueSummary: (issue: CombinedCoachIssue) =>
      `${issueDomainLabels[issue.domain]} · ${issueSeverityLabels[issue.severity]}`,
    issueMessage:
      locale === 'ru'
        ? 'Дочерний детерминированный анализ вернул типизированный результат. Проверьте домен и серьёзность.'
        : 'A deterministic child review returned a typed finding. Review its domain and severity.',
    boundary:
      locale === 'ru'
        ? 'Combined Coach работает только для чтения. Он не подтверждает и не применяет изменения Strength, Nutrition или тренировок. Каждое предложение требует отдельного детерминированного workflow и явного подтверждения.'
        : 'Combined Coach is read-only. It cannot confirm or apply Strength, Nutrition, or workout changes. Each proposal requires its own deterministic workflow and explicit confirmation.',
  };
};

export type CombinedReviewCopy = ReturnType<typeof getCombinedReviewCopy>;
