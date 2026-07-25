import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Colors, MaxContentWidth, Spacing, Typography } from '@/constants/theme';
import { useWeightSync } from '@/context/SyncContext';
import { DataRecoveryCard } from '@/features/settings/DataRecoveryCard';
import { SupportDiagnosticsCard } from '@/features/settings/SupportDiagnosticsCard';
import { SyncConflictReviewCard } from '@/features/settings/SyncConflictReviewCard';
import { getSyncStatusCopy, getSyncStatusExplanation } from '@/features/settings/syncStatusCopy';
import { useLocalization } from '@/localization';

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function SyncBackupScreen() {
  const { conflictCount, lastSyncAt, pendingOperations, status, syncNow } = useWeightSync();
  const { formatDate, locale } = useLocalization();
  const safeAreaInsets = useSafeAreaInsets();
  const copy = getSyncStatusCopy(locale);
  const isBusy = status === 'syncing';
  const actionLabel = isBusy
    ? copy.syncing
    : status === 'error' || status === 'offline'
      ? copy.retry
      : copy.syncNow;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[styles.content, { paddingBottom: safeAreaInsets.bottom + 120 }]}
      style={styles.screen}>
      <View style={styles.container}>
        <SectionHeader title={copy.section} subtitle={copy.description} />

        <AppCard>
          <Text style={styles.title}>{copy.currentStatus}</Text>
          <Text style={styles.value}>{copy.statusLabels[status]}</Text>
          <Text style={styles.detail}>{getSyncStatusExplanation(copy, status)}</Text>
          <Text style={styles.detail}>
            {copy.lastSync}:{' '}
            {lastSyncAt
              ? formatDate(lastSyncAt, { dateStyle: 'medium', timeStyle: 'short' })
              : copy.never}
          </Text>
        </AppCard>

        <AppCard>
          <Text style={styles.title}>{copy.queue}</Text>
          <DetailRow label={copy.pendingOperations} value={`${pendingOperations}`} />
          <DetailRow label={copy.conflicts} value={`${conflictCount}`} />
          <AppButton
            disabled={isBusy}
            label={actionLabel}
            loading={isBusy}
            onPress={() => void syncNow()}
          />
        </AppCard>

        <DataRecoveryCard />
        <SyncConflictReviewCard />
        <SupportDiagnosticsCard
          conflictCount={conflictCount}
          pendingOperations={pendingOperations}
          syncStatus={status}
        />
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
    marginBottom: Spacing.two,
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
