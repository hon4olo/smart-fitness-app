import type {
  CombinedCoachAction,
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
  const actionLabels: Record<CombinedCoachAction, string> = {
    review_strength_proposal:
      locale === 'ru' ? 'Проверить Strength-предложение' : 'Review the Strength proposal',
    review_nutrition_proposal:
      locale === 'ru' ? 'Проверить Nutrition-предложение' : 'Review the Nutrition proposal',
    complete_recovery_check_in:
      locale === 'ru' ? 'Заполнить проверку восстановления' : 'Complete a recovery check-in',
    resolve_safety_restrictions:
      locale === 'ru' ? 'Разрешить ограничения безопасности' : 'Resolve safety restrictions',
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
    statusPresentation,
    actionLabels,
    issueSeverityLabels,
    issueDomainLabels,
    viewModelCopy,
    back: locale === 'ru' ? 'Назад' : 'Back',
    title: locale === 'ru' ? 'Объединённый Coach' : 'Combined Coach',
    subtitle: locale === 'ru' ? 'Strength · Питание · Безопасность' : 'Strength · Nutrition · Safety',
    preview: locale === 'ru' ? 'Предпросмотр и анализ' : 'Preview and review',
    explanation:
      locale === 'ru'
        ? 'Запускает дочерние Strength, Nutrition и Safety-анализы под одним родительским запуском. Этот экран остаётся только для чтения и никогда не применяет изменения автоматически.'
        : 'Runs Strength, Nutrition, and Safety child reviews under one parent run. This surface remains read-only and never applies changes automatically.',
    capabilityChecking:
      locale === 'ru' ? 'Проверка возможностей backend' : 'Checking backend capability',
    capabilityAvailable:
      locale === 'ru' ? 'Combined v1 доступен' : 'Combined v1 available',
    capabilityUnavailable:
      locale === 'ru' ? 'Combined недоступен' : 'Combined unavailable',
    signInRequired: locale === 'ru' ? 'Требуется вход' : 'Sign in required',
    signInBody:
      locale === 'ru'
        ? 'Combined Coach использует только синхронизированные записи защищённого backend-аккаунта.'
        : 'Combined Coach reads only records synchronized to your protected backend account.',
    signIn: locale === 'ru' ? 'Войти' : 'Sign in',
    runReview: locale === 'ru' ? 'Запустить объединённый анализ' : 'Run Combined review',
    openProposal:
      locale === 'ru' ? 'Открыть объединённое предложение' : 'Open Combined proposal',
    capabilityHint:
      locale === 'ru'
        ? 'Кнопка остаётся недоступной, пока авторизованный backend не вернёт точный Combined v1 контракт.'
        : 'This control remains disabled until the authenticated backend returns the exact Combined v1 capability contract.',
    requestError: locale === 'ru' ? 'Ошибка объединённого анализа' : 'Combined review error',
    requestErrorBody:
      locale === 'ru'
        ? 'Не удалось завершить объединённый анализ. Проверьте подключение и синхронизацию, затем повторите попытку.'
        : 'Combined Coach could not complete the review. Check connectivity and synchronization, then try again.',
    runStatusLabels: {
      queued: locale === 'ru' ? 'В очереди' : 'Queued',
      running: locale === 'ru' ? 'Выполняется' : 'Running',
      completed: locale === 'ru' ? 'Завершено' : 'Completed',
      rejected: locale === 'ru' ? 'Отклонено' : 'Rejected',
      failed: locale === 'ru' ? 'Ошибка' : 'Failed',
    } as Record<string, string>,
    strength: 'Strength',
    nutrition: locale === 'ru' ? 'Питание' : 'Nutrition',
    safetyRecovery: locale === 'ru' ? 'Безопасность и восстановление' : 'Safety & Recovery',
    setsAndTonnage: (sets: number, setsFormatted: string, tonnage: string, unit: string) =>
      locale === 'ru'
        ? `${setsFormatted} ${pluralRu(sets, ['подход', 'подхода', 'подходов'])} · ${tonnage} ${unit}`
        : `${setsFormatted} ${sets === 1 ? 'set' : 'sets'} · ${tonnage} ${unit}`,
    targetSummary: (
      energy: string,
      energyUnit: string,
      protein: string,
      carbs: string,
      fats: string,
    ) => `${energy} ${energyUnit} · P ${protein} · C ${carbs} · F ${fats}`,
    safetySummary: (restrictions: number, restrictionsFormatted: string, findings: number, findingsFormatted: string) =>
      locale === 'ru'
        ? `${restrictionsFormatted} ${pluralRu(restrictions, ['ограничение', 'ограничения', 'ограничений'])} · ${findingsFormatted} ${pluralRu(findings, ['результат', 'результата', 'результатов'])}`
        : `${restrictionsFormatted} ${restrictions === 1 ? 'restriction' : 'restrictions'} · ${findingsFormatted} ${findings === 1 ? 'finding' : 'findings'}`,
    pendingActions: locale === 'ru' ? 'Ожидающие действия' : 'Pending actions',
    guardrailFindings: locale === 'ru' ? 'Результаты ограничений' : 'Guardrail findings',
    issueSummary: (issue: CombinedCoachIssue) =>
      `${issueDomainLabels[issue.domain]} · ${issueSeverityLabels[issue.severity]}`,
    issueMessage:
      locale === 'ru'
        ? 'Детерминированный дочерний анализ вернул типизированный результат. Проверьте домен и серьёзность.'
        : 'A deterministic child review returned a typed finding. Review its domain and severity.',
    boundary:
      locale === 'ru'
        ? 'Combined Coach агрегирует результаты, но не применяет предложения. Любое изменение Strength, Nutrition или Safety требует отдельного явного workflow.'
        : 'Combined Coach aggregates results but does not apply proposals. Any Strength, Nutrition, or Safety mutation requires a separate explicit workflow.',
    actionsCount: (count: number, formatted: string) =>
      locale === 'ru'
        ? `${formatted} ${pluralRu(count, ['действие', 'действия', 'действий'])}`
        : `${formatted} action${count === 1 ? '' : 's'}`,
  };
};

export type CombinedReviewCopy = ReturnType<typeof getCombinedReviewCopy>;
