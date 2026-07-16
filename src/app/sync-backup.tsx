import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Colors, MaxContentWidth, Spacing, Typography } from '@/constants/theme';
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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function SyncBackupScreen() {
  const { conflictCount, error, lastSyncAt, pendingOperations, status, syncNow } = useWeightSync();
  const safeAreaInsets = useSafeAreaInsets();
  const label = STATUS_LABELS[status] ?? 'Error';

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[styles.content, { paddingBottom: safeAreaInsets.bottom + 120 }]} style={styles.screen}>
      <View style={styles.container}>
        <SectionHeader title="Sync & Backup" />

        <AppCard>
          <Text style={styles.title}>Current status</Text>
          <Text style={styles.value}>{label}</Text>
          <Text style={styles.detail}>Last sync: {lastSyncAt ? formatShortDateTime(lastSyncAt) : 'Never'}</Text>
        </AppCard>

        <AppCard>
          <Text style={styles.title}>Queue</Text>
          <DetailRow label="Pending operations" value={`${pendingOperations}`} />
          <DetailRow label="Conflicts" value={`${conflictCount}`} />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <AppButton disabled={status === 'syncing'} label="Sync now" loading={status === 'syncing'} onPress={() => void syncNow()} />
        </AppCard>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    width: '100%',
  },
  content: {
    alignItems: 'center',
    padding: Spacing.three,
  },
  detail: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
    marginTop: Spacing.one,
  },
  error: {
    color: Colors.dark.error,
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
    marginBottom: Spacing.two,
  },
  row: {
    borderColor: Colors.dark.borderSubtle,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.two,
  },
  rowLabel: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.caption.fontSize,
    fontWeight: Typography.label.fontWeight,
    lineHeight: Typography.caption.lineHeight,
  },
  rowValue: {
    color: Colors.dark.textPrimary,
    fontSize: Typography.bodyEmphasized.fontSize,
    fontWeight: Typography.bodyEmphasized.fontWeight,
    lineHeight: Typography.bodyEmphasized.lineHeight,
    marginTop: 2,
  },
  screen: {
    backgroundColor: Colors.dark.background,
    flex: 1,
  },
  title: {
    color: Colors.dark.textPrimary,
    fontSize: Typography.sectionTitle.fontSize,
    fontWeight: Typography.sectionTitle.fontWeight,
    letterSpacing: Typography.sectionTitle.letterSpacing,
    lineHeight: Typography.sectionTitle.lineHeight,
    textTransform: Typography.sectionTitle.textTransform,
  },
  value: {
    color: Colors.dark.textPrimary,
    fontSize: Typography.cardTitle.fontSize,
    fontWeight: Typography.heroMetric.fontWeight,
    lineHeight: Typography.cardTitle.lineHeight,
    marginTop: Spacing.one,
  },
});
