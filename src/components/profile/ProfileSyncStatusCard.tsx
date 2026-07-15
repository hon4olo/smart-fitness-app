import { Text } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { formatShortDateTime } from '@/lib';

import { useWeightSync } from '@/context/SyncContext';

const STATUS_LABELS: Record<string, string> = {
  'local-only': 'Local only',
  syncing: 'Syncing',
  synced: 'Synced',
  offline: 'Offline',
  conflict: 'Conflict',
  error: 'Error',
};

export function ProfileSyncStatusCard() {
  const { conflictCount, error, lastSyncAt, pendingOperations, status, syncNow } = useWeightSync();
  const label = STATUS_LABELS[status] ?? 'Error';

  return (
    <AppCard>
      <Text style={styles.title}>Weight sync</Text>
      <Text style={styles.subtitle}>Only weight history is currently cloud-enabled.</Text>

      <Text style={styles.badge}>{label}</Text>
      <Text style={styles.meta}>Last sync: {lastSyncAt ? formatShortDateTime(lastSyncAt) : 'Never'}</Text>
      <Text style={styles.meta}>Pending operations: {pendingOperations}</Text>
      {conflictCount > 0 ? <Text style={styles.conflict}>Conflicts: {conflictCount}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <AppButton label={status === 'syncing' ? 'Syncing...' : 'Sync now'} onPress={() => void syncNow()} disabled={status === 'syncing'} />
    </AppCard>
  );
}

const styles = {
  title: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '800' as const,
    marginBottom: 2,
  },
  subtitle: {
    color: '#64748b',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  badge: {
    alignSelf: 'flex-start' as const,
    backgroundColor: '#e2e8f0',
    borderRadius: 999,
    color: '#334155',
    fontSize: 12,
    fontWeight: '700' as const,
    marginBottom: 8,
    overflow: 'hidden' as const,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  meta: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 4,
  },
  conflict: {
    color: '#b45309',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 4,
  },
  error: {
    color: '#be123c',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 8,
  },
};
