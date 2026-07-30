import type { SupportedLocale } from './messages';

const SYNC_STATUSES = ['idle', 'syncing', 'success', 'error', 'offline', 'conflict'] as const;
const COACH_RUN_STATUSES = ['queued', 'running', 'completed', 'rejected', 'failed'] as const;

type SyncStatus = (typeof SYNC_STATUSES)[number];
type CoachRunStatus = (typeof COACH_RUN_STATUSES)[number];

const isSyncStatus = (value: string): value is SyncStatus =>
  SYNC_STATUSES.some((status) => status === value);

const isCoachRunStatus = (value: string): value is CoachRunStatus =>
  COACH_RUN_STATUSES.some((status) => status === value);

export const getBoundedSyncStatusLabel = (
  locale: SupportedLocale,
  status: string,
): string => {
  const labels: Record<SyncStatus, string> = {
    idle: locale === 'ru' ? 'готово' : 'ready',
    syncing: locale === 'ru' ? 'выполняется' : 'in progress',
    success: locale === 'ru' ? 'завершена' : 'complete',
    error: locale === 'ru' ? 'нужна повторная попытка' : 'retry needed',
    offline: locale === 'ru' ? 'нет подключения' : 'offline',
    conflict: locale === 'ru' ? 'нужно разрешить конфликт' : 'conflict needs review',
  };

  return isSyncStatus(status)
    ? labels[status]
    : locale === 'ru'
      ? 'статус недоступен'
      : 'status unavailable';
};

export const getBoundedCoachRunStatusLabel = (
  locale: SupportedLocale,
  status: string,
): string => {
  const labels: Record<CoachRunStatus, string> = {
    queued: locale === 'ru' ? 'В очереди' : 'Queued',
    running: locale === 'ru' ? 'Выполняется' : 'Running',
    completed: locale === 'ru' ? 'Завершено' : 'Completed',
    rejected: locale === 'ru' ? 'Отклонено' : 'Rejected',
    failed: locale === 'ru' ? 'Ошибка' : 'Failed',
  };

  return isCoachRunStatus(status)
    ? labels[status]
    : locale === 'ru'
      ? 'Статус недоступен'
      : 'Status unavailable';
};
