import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { Spacing, Typography } from '@/constants/theme';
import type { WeightSyncStatus } from '@/context/SyncContext';
import { useLocalization } from '@/localization';
import { useAppTheme } from '@/theme/AppThemeProvider';

import { createSupportDiagnostics } from './supportDiagnostics';
import { getSyncStatusCopy } from './syncStatusCopy';

function Row({ label, value }: { label: string; value: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.row, { borderColor: colors.borderSubtle }]}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <Text selectable style={[styles.value, { color: colors.textPrimary }]}>{value}</Text>
    </View>
  );
}

export function SupportDiagnosticsCard({
  conflictCount,
  pendingOperations,
  syncStatus,
}: {
  conflictCount: number;
  pendingOperations: number;
  syncStatus: WeightSyncStatus;
}) {
  const { colors } = useAppTheme();
  const { t } = useLocalization();
  const diagnostics = useMemo(
    () => createSupportDiagnostics({ conflictCount, pendingOperations, syncStatus }),
    [conflictCount, pendingOperations, syncStatus],
  );
  const syncCopy = getSyncStatusCopy(t);
  const environment =
    diagnostics.environment === 'development'
      ? t('diagnostics.environment.development')
      : diagnostics.environment === 'production'
        ? t('diagnostics.environment.production')
        : diagnostics.environment === 'unknown'
          ? t('common.unknown')
          : diagnostics.environment;

  return (
    <AppCard>
      <Text style={[styles.title, { color: colors.textPrimary }]}>
        {t('diagnostics.title')}
      </Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        {t('diagnostics.description')}
      </Text>
      <View style={styles.rows}>
        <Row label={t('diagnostics.appVersion')} value={diagnostics.appVersion} />
        <Row label={t('diagnostics.build')} value={diagnostics.buildNumber} />
        <Row label={t('diagnostics.runtime')} value={diagnostics.runtimeVersion} />
        <Row label={t('diagnostics.channel')} value={diagnostics.channel} />
        <Row label={t('diagnostics.update')} value={diagnostics.updateId} />
        <Row
          label={t('diagnostics.updateSource')}
          value={
            diagnostics.updateSource === 'embedded'
              ? t('diagnostics.embedded')
              : t('diagnostics.downloaded')
          }
        />
        <Row label={t('diagnostics.environment')} value={environment} />
        <Row label={t('diagnostics.syncState')} value={syncCopy.statusLabels[diagnostics.syncStatus]} />
        <Row label={t('diagnostics.pending')} value={`${diagnostics.pendingOperations}`} />
        <Row label={t('diagnostics.conflicts')} value={`${diagnostics.conflictCount}`} />
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  description: {
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
    marginTop: Spacing.one,
  },
  label: {
    flex: 1,
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
  },
  row: {
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  rows: { marginTop: Spacing.three },
  title: {
    fontSize: Typography.sectionTitle.fontSize,
    fontWeight: Typography.sectionTitle.fontWeight,
    lineHeight: Typography.sectionTitle.lineHeight,
  },
  value: {
    flexShrink: 1,
    fontSize: Typography.caption.fontSize,
    fontWeight: Typography.label.fontWeight,
    lineHeight: Typography.caption.lineHeight,
    textAlign: 'right',
  },
});
