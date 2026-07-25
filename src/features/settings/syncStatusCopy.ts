import type { SupportedLocale } from '@/localization';
import type { WeightSyncStatus } from '@/context/SyncContext';

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

const COPY: Record<SupportedLocale, SyncStatusCopy> = {
  en: {
    section: 'Data & Sync',
    title: 'Sync status',
    description: 'Review account synchronization, pending changes, and recovery actions.',
    open: 'Open sync details',
    currentStatus: 'Current status',
    lastSync: 'Last successful sync',
    never: 'Never',
    queue: 'Pending data',
    pendingOperations: 'Pending changes',
    conflicts: 'Unresolved conflicts',
    syncNow: 'Sync now',
    syncing: 'Syncing…',
    retry: 'Retry sync',
    localOnlyExplanation: 'Data is stored on this device until you sign in.',
    accountSyncedExplanation: 'Supported account data is synchronized through your signed-in account.',
    errorExplanation: 'Synchronization did not finish. Your local data remains available; retry when the connection is stable.',
    conflictExplanation: 'Some changes need deterministic conflict resolution before synchronization can finish.',
    offlineExplanation: 'The device appears offline. Pending changes remain queued for the next connection.',
    statusLabels: {
      'local-only': 'Local only',
      syncing: 'Syncing',
      synced: 'Synced',
      offline: 'Offline',
      conflict: 'Needs review',
      error: 'Retry needed',
    },
  },
  ru: {
    section: 'Данные и синхронизация',
    title: 'Состояние синхронизации',
    description: 'Проверьте синхронизацию аккаунта, ожидающие изменения и действия восстановления.',
    open: 'Открыть сведения о синхронизации',
    currentStatus: 'Текущее состояние',
    lastSync: 'Последняя успешная синхронизация',
    never: 'Никогда',
    queue: 'Ожидающие данные',
    pendingOperations: 'Ожидающие изменения',
    conflicts: 'Неразрешённые конфликты',
    syncNow: 'Синхронизировать',
    syncing: 'Синхронизация…',
    retry: 'Повторить синхронизацию',
    localOnlyExplanation: 'Данные хранятся только на этом устройстве, пока вы не войдёте в аккаунт.',
    accountSyncedExplanation: 'Поддерживаемые данные аккаунта синхронизируются через выполненный вход.',
    errorExplanation: 'Синхронизация не завершилась. Локальные данные доступны; повторите попытку при стабильном соединении.',
    conflictExplanation: 'Некоторые изменения требуют разрешения конфликта перед завершением синхронизации.',
    offlineExplanation: 'Устройство не в сети. Изменения остаются в очереди до следующего подключения.',
    statusLabels: {
      'local-only': 'Только на устройстве',
      syncing: 'Синхронизация',
      synced: 'Синхронизировано',
      offline: 'Нет сети',
      conflict: 'Требует проверки',
      error: 'Нужен повтор',
    },
  },
};

export const getSyncStatusCopy = (locale: SupportedLocale): SyncStatusCopy => COPY[locale];

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
