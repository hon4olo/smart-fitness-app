import type { WeightSyncStatus } from '@/context/SyncContext';
import type { Translate } from '@/localization';

export type SyncStatusCopy = {
  section: string;
  title: string;
  description: string;
  open: string;
  currentStatus: string;
  lastSync: string;
  never: string;
  queue: string;
  pendingOperations: string;
  conflicts: string;
  syncNow: string;
  syncing: string;
  retry: string;
  localOnlyExplanation: string;
  accountSyncedExplanation: string;
  errorExplanation: string;
  conflictExplanation: string;
  offlineExplanation: string;
  statusLabels: Record<WeightSyncStatus, string>;
};

export const getSyncStatusCopy = (t: Translate): SyncStatusCopy => ({
  section: t('sync.section'),
  title: t('sync.title'),
  description: t('sync.description'),
  open: t('sync.open'),
  currentStatus: t('sync.currentStatus'),
  lastSync: t('sync.lastSync'),
  never: t('sync.never'),
  queue: t('sync.queue'),
  pendingOperations: t('sync.pendingOperations'),
  conflicts: t('sync.conflicts'),
  syncNow: t('sync.syncNow'),
  syncing: t('sync.syncing'),
  retry: t('sync.retry'),
  localOnlyExplanation: t('sync.explanation.localOnly'),
  accountSyncedExplanation: t('sync.explanation.synced'),
  errorExplanation: t('sync.explanation.error'),
  conflictExplanation: t('sync.explanation.conflict'),
  offlineExplanation: t('sync.explanation.offline'),
  statusLabels: {
    'local-only': t('sync.status.localOnly'),
    syncing: t('sync.status.syncing'),
    synced: t('sync.status.synced'),
    offline: t('sync.status.offline'),
    conflict: t('sync.status.conflict'),
    error: t('sync.status.error'),
  },
});

export const getSyncStatusExplanation = (
  copy: SyncStatusCopy,
  status: WeightSyncStatus,
): string => {
  if (status === 'local-only') return copy.localOnlyExplanation;
  if (status === 'offline') return copy.offlineExplanation;
  if (status === 'conflict') return copy.conflictExplanation;
  if (status === 'error') return copy.errorExplanation;
  return copy.accountSyncedExplanation;
};
