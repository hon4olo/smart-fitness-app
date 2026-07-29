import type {
  CoachDomain,
  CoachRunStatus,
  CoachRunTrustState,
  CoachTrustApplicationState,
} from '@/api/coach';
import type {
  CoachAppliedEntityRevision,
  CoachSourceRevision,
} from '@/api/coach/applicationProvenance';
import type { NutritionAppliedRationaleCode } from '@/api/coach/nutritionAppliedChangeSummary';
import type { SupportedLocale } from '@/localization';

const DOMAIN_COPY: Record<SupportedLocale, Record<CoachDomain, string>> = {
  en: { strength: 'Strength', nutrition: 'Nutrition', safety_recovery: 'Safety & Recovery', combined: 'Combined' },
  ru: { strength: 'Силовой тренинг', nutrition: 'Питание', safety_recovery: 'Безопасность и восстановление', combined: 'Общий анализ' },
};

const STATUS_COPY: Record<SupportedLocale, Record<CoachRunStatus, string>> = {
  en: { queued: 'Queued', running: 'Running', completed: 'Completed', rejected: 'Rejected', failed: 'Failed' },
  ru: { queued: 'В очереди', running: 'Выполняется', completed: 'Завершено', rejected: 'Отклонено', failed: 'Ошибка' },
};

const ENTITY_COPY: Record<
  SupportedLocale,
  Record<CoachSourceRevision['entityType'] | CoachAppliedEntityRevision['entityType'], string>
> = {
  en: { nutrition_target: 'Nutrition target', workout_session: 'Workout session', workout_template: 'Workout template' },
  ru: { nutrition_target: 'Цель питания', workout_session: 'Тренировочная сессия', workout_template: 'Шаблон тренировки' },
};

const RATIONALE_COPY: Record<
  SupportedLocale,
  Record<NutritionAppliedRationaleCode, string>
> = {
  en: {
    already_consistent: 'Targets were already consistent',
    macro_calorie_mismatch: 'Calories and macros were inconsistent',
    goal_alignment: 'Alignment with the selected goal',
    energy_balance_trend: 'Recent energy-balance trend',
    macro_distribution: 'Macro distribution',
    adherence_pattern: 'Recent adherence pattern',
    training_support: 'Training support',
    recovery_support: 'Recovery support',
  },
  ru: {
    already_consistent: 'Цели уже были согласованы',
    macro_calorie_mismatch: 'Калории и макросы не совпадали',
    goal_alignment: 'Соответствие выбранной цели',
    energy_balance_trend: 'Последняя динамика энергетического баланса',
    macro_distribution: 'Распределение макронутриентов',
    adherence_pattern: 'Последняя динамика соблюдения плана',
    training_support: 'Поддержка тренировок',
    recovery_support: 'Поддержка восстановления',
  },
};

export const getCoachHistoryCopy = (locale: SupportedLocale) => ({
  title: locale === 'ru' ? 'История Coach' : 'Coach history',
  subtitle: locale === 'ru' ? 'Неизменяемая история проверок и предложений' : 'Immutable review and proposal history',
  all: locale === 'ru' ? 'Все' : 'All',
  empty: locale === 'ru' ? 'История Coach пока пуста.' : 'Coach history is empty.',
  retry: locale === 'ru' ? 'Повторить' : 'Retry',
  signIn: locale === 'ru' ? 'Войдите, чтобы открыть историю Coach.' : 'Sign in to view Coach history.',
  loading: locale === 'ru' ? 'Загрузка истории…' : 'Loading history…',
  notice: locale === 'ru' ? 'Историю Coach не удалось загрузить.' : 'Coach history could not be loaded.',
  policies: locale === 'ru' ? 'Версии правил' : 'Policy versions',
  agents: locale === 'ru' ? 'Цепочка агентов' : 'Agent trail',
  statusLabel: locale === 'ru' ? 'Статус' : 'Status',
  trust: locale === 'ru' ? 'Проверка источников' : 'Source verification',
  trustValidationFailed: locale === 'ru'
    ? 'Метаданные состояния источников не прошли проверку. Считайте предложение недоступным до повторного обновления.'
    : 'Source-status metadata failed validation. Treat this proposal as unavailable until it is refreshed.',
  proposalRevision: locale === 'ru' ? 'Ревизия предложения' : 'Proposal revision',
  currentRevision: locale === 'ru' ? 'Текущая ревизия' : 'Current revision',
  revisionUnavailable: locale === 'ru' ? 'не записана' : 'not recorded',
  provenance: locale === 'ru' ? 'Происхождение применения' : 'Application provenance',
  provenanceUnavailable: locale === 'ru'
    ? 'Метаданные применения не прошли проверку и не отображаются.'
    : 'Application metadata failed validation and is not displayed.',
  sourceRevision: locale === 'ru' ? 'Исходная ревизия' : 'Source revision',
  appliedRevision: locale === 'ru' ? 'Применённая ревизия' : 'Applied revision',
  fingerprintRecorded: locale === 'ru'
    ? 'Fingerprint исходных ревизий записан.'
    : 'Source revision fingerprint recorded.',
  appliedChanges: locale === 'ru' ? 'Применённые изменения' : 'Applied changes',
  appliedChangesUnavailable: locale === 'ru'
    ? 'Сводка применённого изменения не прошла проверку и не отображается.'
    : 'The applied-change summary failed validation and is not displayed.',
  before: locale === 'ru' ? 'До' : 'Before',
  after: locale === 'ru' ? 'После' : 'After',
  calories: locale === 'ru' ? 'Энергия' : 'Energy',
  protein: locale === 'ru' ? 'Белки' : 'Protein',
  carbs: locale === 'ru' ? 'Углеводы' : 'Carbs',
  fats: locale === 'ru' ? 'Жиры' : 'Fats',
  rationale: locale === 'ru' ? 'Причины' : 'Rationale',
  policyReferences: locale === 'ru' ? 'Использованные правила' : 'Policy references',
  grams: locale === 'ru' ? 'г' : 'g',
  requested: locale === 'ru' ? 'Запрошено' : 'Requested',
  completed: locale === 'ru' ? 'Завершено' : 'Completed',
  requestType: locale === 'ru' ? 'Тип запроса' : 'Request type',
  immutable: locale === 'ru'
    ? 'Эта запись не изменяется после завершения. Новые действия создают отдельные ревизии.'
    : 'This record is not rewritten after completion. New actions create separate revisions.',
  noPolicies: locale === 'ru' ? 'Версии правил не записаны.' : 'No policy versions were recorded.',
  noAgents: locale === 'ru' ? 'Отдельные этапы агентов не записаны.' : 'No separate agent stages were recorded.',
  domain: (domain: CoachDomain) => DOMAIN_COPY[locale][domain],
  status: (status: CoachRunStatus) => STATUS_COPY[locale][status],
  entity: (entityType: CoachSourceRevision['entityType'] | CoachAppliedEntityRevision['entityType']) => ENTITY_COPY[locale][entityType],
  rationaleCode: (code: NutritionAppliedRationaleCode) => RATIONALE_COPY[locale][code],
  application: (key: string) => {
    if (key === 'nutrition') return locale === 'ru' ? 'Питание' : 'Nutrition';
    if (key === 'effectiveStrength') return locale === 'ru' ? 'Силовой план' : 'Strength plan';
    return locale === 'ru' ? 'Подтверждённое изменение' : 'Confirmed change';
  },
  trustState: (state: CoachTrustApplicationState) => {
    if (locale === 'ru') {
      if (state === 'current') return 'Актуально';
      if (state === 'stale') return 'Устарело';
      if (state === 'applied') return 'Применено';
      return 'Недоступно';
    }
    if (state === 'current') return 'Current';
    if (state === 'stale') return 'Stale';
    if (state === 'applied') return 'Applied';
    return 'Unavailable';
  },
  trustSummary: (state: CoachRunTrustState['overallState']) => {
    if (locale === 'ru') {
      if (state === 'current') return 'Исходные данные всё ещё соответствуют этому предложению.';
      if (state === 'stale') return 'Исходные данные изменились после создания предложения. Перед применением создайте новое предложение.';
      if (state === 'applied') return 'Изменение уже применено из записанной ревизии. Последующие правки источника не переписывают эту историю.';
      if (state === 'unavailable') return 'Состояние источника не удалось проверить. Не применяйте предложение до повторного обновления.';
      return '';
    }
    if (state === 'current') return 'The source data still matches this proposal.';
    if (state === 'stale') return 'The source changed after this proposal was created. Create a new proposal before applying.';
    if (state === 'applied') return 'The change was already applied from the recorded revision. Later source edits do not rewrite this history.';
    if (state === 'unavailable') return 'The source could not be verified. Do not apply this proposal until it is refreshed.';
    return '';
  },
  revision: (value: number) => `${locale === 'ru' ? 'ревизия' : 'revision'} ${value}`,
});
