import type { CoachDomain, CoachRunStatus } from '@/api/coach';
import type {
  CoachAppliedEntityRevision,
  CoachSourceRevision,
} from '@/api/coach/applicationProvenance';
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
  provenance: locale === 'ru' ? 'Происхождение применения' : 'Application provenance',
  provenanceUnavailable: locale === 'ru'
    ? 'Метаданные применения не прошли проверку и не отображаются.'
    : 'Application metadata failed validation and is not displayed.',
  sourceRevision: locale === 'ru' ? 'Исходная ревизия' : 'Source revision',
  appliedRevision: locale === 'ru' ? 'Применённая ревизия' : 'Applied revision',
  fingerprintRecorded: locale === 'ru'
    ? 'Fingerprint исходных ревизий записан.'
    : 'Source revision fingerprint recorded.',
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
  application: (key: string) => {
    if (key === 'nutrition') return locale === 'ru' ? 'Питание' : 'Nutrition';
    if (key === 'effectiveStrength') return locale === 'ru' ? 'Силовой план' : 'Strength plan';
    return locale === 'ru' ? 'Подтверждённое изменение' : 'Confirmed change';
  },
  revision: (value: number) => `${locale === 'ru' ? 'ревизия' : 'revision'} ${value}`,
});
