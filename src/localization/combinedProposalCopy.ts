import type {
  CombinedCoachProposalViewModel,
  CombinedProposalAction,
  CombinedProposalIssue,
  CombinedProposalStatus,
  CombinedSafetyRestriction,
} from '@/features/coach/combinedCoachProposalViewModel';

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

export const getCombinedProposalCopy = (locale: SupportedLocale) => {
  const statusLabels: Record<CombinedProposalStatus, string> = {
    ready: locale === 'ru' ? 'Готово' : 'Ready',
    modify: locale === 'ru' ? 'Нужны изменения' : 'Modify',
    needs_input: locale === 'ru' ? 'Нужны данные' : 'Needs input',
    blocked: locale === 'ru' ? 'Заблокировано' : 'Blocked',
  };
  const reviewCopy: Record<CombinedProposalStatus, { title: string; message: string }> = {
    blocked: {
      title: locale === 'ru' ? 'Объединённое предложение заблокировано' : 'Combined proposal blocked',
      message:
        locale === 'ru'
          ? 'Safety или одно из дочерних предложений содержит жёсткую блокировку.'
          : 'Safety or one of the child proposals contains a hard block.',
    },
    needs_input: {
      title: locale === 'ru' ? 'Нужны дополнительные данные' : 'More data required',
      message:
        locale === 'ru'
          ? 'Минимум одному дочернему предложению нужны дополнительные синхронизированные данные.'
          : 'At least one child proposal needs additional synchronized input.',
    },
    modify: {
      title: locale === 'ru' ? 'Проверьте изменения' : 'Review modifications',
      message:
        locale === 'ru'
          ? 'Предложения доступны с явными корректировками ограничений безопасности.'
          : 'The proposals are available with explicit guardrail adjustments.',
    },
    ready: {
      title: locale === 'ru' ? 'Объединённое предложение готово' : 'Combined proposal ready',
      message:
        locale === 'ru'
          ? 'Все дочерние предложения прошли финальную детерминированную проверку.'
          : 'All child proposals passed the deterministic final guardrail.',
    },
  };
  const actionLabels: Record<CombinedProposalAction, string> = {
    review_strength_proposal:
      locale === 'ru'
        ? 'Проверить Strength-предложение отдельно'
        : 'Review the Strength proposal separately',
    apply_safety_load_ceiling:
      locale === 'ru'
        ? 'Создать шаблон тренировки с Safety-потолком нагрузки'
        : 'Create a workout template with the Safety load ceiling',
    resolve_movement_restrictions:
      locale === 'ru'
        ? 'Разрешить ограничения движений перед использованием Strength'
        : 'Resolve restricted movement patterns before using Strength',
    confirm_nutrition_target:
      locale === 'ru'
        ? 'Применить цель питания отдельным revisioned-действием'
        : 'Apply the Nutrition target as a separate revisioned action',
  };
  const restrictionActionLabels: Record<CombinedSafetyRestriction['action'], string> = {
    monitor: locale === 'ru' ? 'Наблюдать' : 'Monitor',
    reduce_load: locale === 'ru' ? 'Снизить нагрузку' : 'Reduce load',
    avoid_movement: locale === 'ru' ? 'Исключить движение' : 'Avoid movement',
    pause_training: locale === 'ru' ? 'Приостановить тренировки' : 'Pause training',
  };
  const issueSeverityLabels: Record<CombinedProposalIssue['severity'], string> = {
    input_required: locale === 'ru' ? 'Нужны данные' : 'Input required',
    warning: locale === 'ru' ? 'Предупреждение' : 'Warning',
    modify: locale === 'ru' ? 'Модификация' : 'Modify',
    hard_block: locale === 'ru' ? 'Блокировка' : 'Hard block',
  };
  const issueDomainLabels: Record<CombinedProposalIssue['domain'], string> = {
    strength: 'Strength',
    nutrition: locale === 'ru' ? 'Питание' : 'Nutrition',
    safety_recovery: locale === 'ru' ? 'Безопасность и восстановление' : 'Safety & Recovery',
  };

  const viewModelCopy = (viewModel: CombinedCoachProposalViewModel) => {
    if (viewModel.kind === 'pending') {
      return {
        title: locale === 'ru' ? 'Формирование предложений' : 'Building proposals',
        message:
          locale === 'ru'
            ? 'Дочерние Strength, Nutrition и Safety-запуски проходят оценку.'
            : 'Strength, Nutrition, and Safety child runs are being evaluated.',
      };
    }
    if (viewModel.kind === 'failed') {
      return {
        title: locale === 'ru' ? 'Предложение недоступно' : 'Proposal unavailable',
        message:
          locale === 'ru'
            ? 'Результат не прошёл безопасную локальную проверку или запуск завершился ошибкой.'
            : 'The result did not pass safe local validation or the run could not be completed.',
      };
    }
    return reviewCopy[viewModel.status];
  };

  return {
    statusLabels,
    reviewCopy,
    actionLabels,
    restrictionActionLabels,
    issueSeverityLabels,
    issueDomainLabels,
    viewModelCopy,
    back: locale === 'ru' ? 'Назад' : 'Back',
    title: locale === 'ru' ? 'Объединённое предложение' : 'Combined proposal',
    subtitle: locale === 'ru' ? 'Strength · Питание · Безопасность' : 'Strength · Nutrition · Safety',
    explicitProposal:
      locale === 'ru' ? 'Явное предложение и применение' : 'Explicit proposal and application',
    explanation:
      locale === 'ru'
        ? 'Формирует предложения Strength и Nutrition, рассчитывает эффективные Strength-нагрузки с учётом Safety-потолка и сохраняет каждую мутацию отдельным явным действием.'
        : 'Builds Strength and Nutrition proposals, derives effective Strength loads under the Safety ceiling, and keeps every mutation as a separate explicit action.',
    capability: locale === 'ru' ? 'Возможности' : 'Capability',
    notEnabled: locale === 'ru' ? 'не включено' : 'not enabled',
    sync: locale === 'ru' ? 'Синхронизация' : 'Sync',
    syncLabels: {
      idle: locale === 'ru' ? 'готово' : 'idle',
      syncing: locale === 'ru' ? 'выполняется' : 'syncing',
      success: locale === 'ru' ? 'завершена' : 'success',
      error: locale === 'ru' ? 'ошибка' : 'error',
      offline: locale === 'ru' ? 'нет подключения' : 'offline',
      conflict: locale === 'ru' ? 'конфликт' : 'conflict',
    } as Record<string, string>,
    signIn: locale === 'ru' ? 'Войти' : 'Sign in',
    buildProposal:
      locale === 'ru' ? 'Сформировать объединённое предложение' : 'Build Combined proposal',
    openReview:
      locale === 'ru' ? 'Открыть обычный объединённый анализ' : 'Open regular Combined review',
    notice: locale === 'ru' ? 'Уведомление объединённого предложения' : 'Combined proposal notice',
    requestFailed:
      locale === 'ru'
        ? 'Не удалось сформировать объединённые предложения. Проверьте синхронизацию и повторите попытку.'
        : 'Combined Coach could not build the proposals. Check synchronization and try again.',
    strengthSyncRetry:
      locale === 'ru'
        ? 'Шаблон тренировки создан, но локальную синхронизацию нужно повторить.'
        : 'The workout template was created, but local synchronization needs to be retried.',
    strengthConfirmationFailed:
      locale === 'ru'
        ? 'Не удалось создать эффективный Strength-шаблон.'
        : 'The effective Strength template could not be created.',
    nutritionSyncRetry:
      locale === 'ru'
        ? 'Цель питания применена, но локальную синхронизацию нужно повторить.'
        : 'The Nutrition target was applied, but local synchronization needs to be retried.',
    nutritionConfirmationFailed:
      locale === 'ru' ? 'Не удалось применить цель питания.' : 'The Nutrition target could not be applied.',
    createTemplateTitle:
      locale === 'ru' ? 'Создать шаблон тренировки?' : 'Create workout template?',
    createTemplateBody:
      locale === 'ru'
        ? 'Будет создан новый revisioned-шаблон на основе эффективных Strength-нагрузок. История завершённых тренировок и Nutrition не изменятся.'
        : 'This creates a new revisioned template from the effective Strength loads. Completed workout history and Nutrition will not be changed.',
    cancel: locale === 'ru' ? 'Отмена' : 'Cancel',
    createTemplate: locale === 'ru' ? 'Создать шаблон' : 'Create template',
    applyNutritionTitle:
      locale === 'ru' ? 'Применить цель питания?' : 'Apply Nutrition target?',
    applyNutritionBody:
      locale === 'ru'
        ? 'Будет применена только предложенная цель питания через revisioned sync-путь. Strength-шаблоны и история завершённых тренировок не изменятся.'
        : 'This applies only the proposed Nutrition target through the revisioned sync path. Strength templates and completed workout history will not be changed.',
    applyTarget: locale === 'ru' ? 'Применить цель' : 'Apply target',
    strengthProposal: locale === 'ru' ? 'Strength-предложение' : 'Strength proposal',
    setsAndTonnage: (sets: number, setsFormatted: string, tonnage: string, unit: string) =>
      locale === 'ru'
        ? `${setsFormatted} ${pluralRu(sets, ['подход', 'подхода', 'подходов'])} · предложенный тоннаж ${tonnage} ${unit}`
        : `${setsFormatted} ${sets === 1 ? 'set' : 'sets'} · proposed tonnage ${tonnage} ${unit}`,
    effectivePlan: locale === 'ru' ? 'Эффективный план' : 'Effective plan',
    blocked: locale === 'ru' ? 'заблокировано' : 'blocked',
    effectiveTonnage: (tonnage: string, unit: string, ceiling: string) =>
      locale === 'ru'
        ? `Эффективный тоннаж: ${tonnage} ${unit} · потолок нагрузки ${ceiling}%`
        : `Effective tonnage: ${tonnage} ${unit} · load ceiling ${ceiling}%`,
    setProposal: (
      name: string,
      proposed: string,
      effective: string,
      maximum: string,
      unit: string,
    ) =>
      locale === 'ru'
        ? `${name}: предложено ${proposed} ${unit} → эффективно ${effective} ${unit} · потолок ${maximum} ${unit}`
        : `${name}: proposed ${proposed} ${unit} → effective ${effective} ${unit} · ceiling ${maximum} ${unit}`,
    restrictedUnresolved:
      locale === 'ru' ? 'Не разрешены ограничения движений' : 'Restricted movements unresolved',
    templateCreated:
      locale === 'ru' ? 'Шаблон тренировки создан' : 'Workout template created',
    revision: locale === 'ru' ? 'Ревизия' : 'Revision',
    createEffectiveTemplate:
      locale === 'ru' ? 'Создать эффективный Strength-шаблон' : 'Create effective Strength template',
    nutritionTarget: locale === 'ru' ? 'Цель питания' : 'Nutrition target',
    current: locale === 'ru' ? 'Текущая' : 'Current',
    proposed: locale === 'ru' ? 'Предложенная' : 'Proposed',
    targetApplied: locale === 'ru' ? 'Цель питания применена' : 'Nutrition target applied',
    applyNutritionTarget:
      locale === 'ru' ? 'Применить цель питания' : 'Apply Nutrition target',
    targetSummary: (
      energy: string,
      energyUnit: string,
      protein: string,
      carbs: string,
      fats: string,
    ) => `${energy} ${energyUnit} · P ${protein} · C ${carbs} · F ${fats}`,
    safetyCeiling: locale === 'ru' ? 'Safety-потолок' : 'Safety ceiling',
    maximumStrengthLoad: (percent: string) =>
      locale === 'ru'
        ? `Максимальная Strength-нагрузка: ${percent}%`
        : `Maximum Strength load: ${percent}%`,
    restrictionsAndFindings: (
      restrictions: number,
      restrictionsFormatted: string,
      findings: number,
      findingsFormatted: string,
    ) =>
      locale === 'ru'
        ? `${restrictionsFormatted} ${pluralRu(restrictions, ['ограничение', 'ограничения', 'ограничений'])} · ${findingsFormatted} ${pluralRu(findings, ['результат', 'результата', 'результатов'])}`
        : `${restrictionsFormatted} ${restrictions === 1 ? 'restriction' : 'restrictions'} · ${findingsFormatted} ${findings === 1 ? 'finding' : 'findings'}`,
    restrictionSummary: (action: string, percent: string, movements: string) =>
      movements
        ? `${action} · max ${percent}% · ${movements}`
        : `${action} · max ${percent}%`,
    pendingActions: locale === 'ru' ? 'Ожидающие действия' : 'Pending actions',
    guardrailFindings: locale === 'ru' ? 'Результаты ограничений' : 'Guardrail findings',
    issueSummary: (issue: CombinedProposalIssue) =>
      `${issueDomainLabels[issue.domain]} · ${issueSeverityLabels[issue.severity]}`,
    issueMessage:
      locale === 'ru'
        ? 'Детерминированная проверка вернула типизированное ограничение. Проверьте домен и серьёзность перед продолжением.'
        : 'The deterministic guardrail returned a typed finding. Review its domain and severity before continuing.',
    boundary:
      locale === 'ru'
        ? 'Strength и Nutrition применяются отдельными явными действиями. Создание шаблона тренировки никогда не изменяет завершённую историю; применение Nutrition никогда не создаёт и не изменяет шаблон тренировки.'
        : 'Strength and Nutrition are separate explicit actions. Creating a workout template never edits completed history; applying Nutrition never creates or changes a workout template.',
  };
};

export type CombinedProposalCopy = ReturnType<typeof getCombinedProposalCopy>;
