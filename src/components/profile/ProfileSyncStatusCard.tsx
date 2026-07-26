import { router } from 'expo-router';

import { ListRow } from '@/components/ui/ListRow';
import { type WeightSyncStatus, useWeightSync } from '@/context/SyncContext';
import { type MessageKey, useLocalization } from '@/localization';

const STATUS_MESSAGE_KEYS = {
  'local-only': 'sync.status.localOnly',
  syncing: 'sync.status.syncing',
  synced: 'sync.status.synced',
  offline: 'sync.status.offline',
  conflict: 'sync.status.conflict',
  error: 'sync.status.error',
} as const satisfies Record<WeightSyncStatus, MessageKey>;

export function ProfileSyncStatusCard() {
  const { lastSyncAt, status } = useWeightSync();
  const { formatDate, t } = useLocalization();
  const lastSync = lastSyncAt
    ? formatDate(lastSyncAt, {
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : t('sync.never');

  return (
    <ListRow
      detail={`${t('sync.lastSync')}: ${lastSync}`}
      onPress={() => router.push('/sync-backup')}
      title={t('sync.section')}
      value={t(STATUS_MESSAGE_KEYS[status])}
    />
  );
}
