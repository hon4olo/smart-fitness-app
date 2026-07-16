import { Text } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing, Typography } from '@/constants/theme';

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
  const { conflictCount, error, lastSyncAt, pendingOperations, status, syncNow } = useWeightSync();
  const label = STATUS_LABELS[status] ?? 'Error';

  return (
    <AppCard>
      <Text style={styles.title}>Sync & backup</Text>
      <Text style={styles.subtitle}>Only weight history is backed up in this phase.</Text>

      <Text style={styles.badge}>{label}</Text>
      <Text style={styles.meta}>Last sync: {lastSyncAt ? formatShortDateTime(lastSyncAt) : 'Never'}</Text>
      <Text style={styles.meta}>Pending operations: {pendingOperations}</Text>
      {conflictCount > 0 ? <Text style={styles.conflict}>Conflicts: {conflictCount}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <AppButton label="Sync now" loading={status === 'syncing'} onPress={() => void syncNow()} disabled={status === 'syncing'} />
    </AppCard>
  );
}

const styles = {
  badge: {
    alignSelf: 'flex-start' as const,
    backgroundColor: Colors.dark.backgroundSelected,
    borderRadius: 999,
    color: Colors.dark.text,
    fontSize: 12,
    fontWeight: '700' as const,
    marginBottom: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
  },
  conflict: {
    color: Colors.dark.warning,
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
    marginBottom: 4,
  },
  error: {
    color: Colors.dark.error,
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
    marginBottom: Spacing.one,
  },
  meta: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
    marginBottom: 4,
  },
  subtitle: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
    marginBottom: Spacing.two,
  },
  title: {
    color: Colors.dark.text,
    fontSize: Typography.sectionTitle.fontSize,
    fontWeight: Typography.sectionTitle.fontWeight,
    letterSpacing: Typography.sectionTitle.letterSpacing,
    lineHeight: Typography.sectionTitle.lineHeight,
    textTransform: Typography.sectionTitle.textTransform,
  },
};
