import type { CoachDomain, CoachRunStatus } from '@/api/coach';
import type { SupportedLocale } from '@/localization';

const DOMAIN_COPY: Record<SupportedLocale, Record<CoachDomain, string>> = {
  en: { strength: 'Strength', nutrition: 'Nutrition', safety_recovery: 'Safety & Recovery', combined: 'Combined' },
  ru: { strength: 'Силовой тренинг', nutrition: 'Питание', safety_recovery: 'Безопасность и восстановление', combined: 'Общий анализ' },
};

const STATUS_COPY: Record<SupportedLocale, Record<CoachRunStatus, string>> = {
  en: { queued: 'Queued', running: 'Running', completed: 'Completed', rejected: 'Rejected', failed: 'Failed' },
  ru: { queued: 'В очереди', running: 'Выполняется', completed: 'Завершено', rejected: 'Отклонено', failed: 'Ошибка' },
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
});
