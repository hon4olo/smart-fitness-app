import { router } from 'expo-router';

import { ListRow } from '@/components/ui/ListRow';
import { useWeightSync } from '@/context/SyncContext';
import { formatShortDateTime } from '@/lib';

const STATUS_LABELS: Record<string, string> = {
  'local-only': 'Local only',
  syncing: 'Syncing',
  synced: 'Synced',
  offline: 'Offline',
  conflict: 'Conflict',
  error: 'Error',
};

export function ProfileSyncStatusCard() {
  const { lastSyncAt, status } = useWeightSync();
  const label = STATUS_LABELS[status] ?? 'Error';

  return (
    <ListRow
      detail={lastSyncAt ? `Last sync ${formatShortDateTime(lastSyncAt)}` : 'Last sync never'}
      onPress={() => router.push('/sync-backup')}
      title="Sync & Backup"
      value={label}
    />
  );
}
