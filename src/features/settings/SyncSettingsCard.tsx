import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { Spacing, Typography } from '@/constants/theme';
import { useWeightSync } from '@/context/SyncContext';
import { useLocalization } from '@/localization';
import { useAppTheme } from '@/theme/AppThemeProvider';

import { getSyncStatusCopy, getSyncStatusExplanation } from './syncStatusCopy';

export function SyncSettingsCard() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { t } = useLocalization();
  const { conflictCount, pendingOperations, status } = useWeightSync();
  const copy = getSyncStatusCopy(t);

  return (
    <AppCard>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{copy.title}</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {getSyncStatusExplanation(copy, status)}
          </Text>
        </View>
        <Text style={[styles.status, { color: colors.textPrimary }]}>
          {copy.statusLabels[status]}
        </Text>
      </View>
      <View style={[styles.stats, { borderColor: colors.borderSubtle }]}>
        <Text style={[styles.stat, { color: colors.textSecondary }]}>
          {copy.pendingOperations}: {pendingOperations}
        </Text>
        <Text style={[styles.stat, { color: colors.textSecondary }]}>
          {copy.conflicts}: {conflictCount}
        </Text>
      </View>
      <SecondaryButton label={copy.open} onPress={() => router.push('/sync-backup')} />
    </AppCard>
  );
}

const styles = StyleSheet.create({
  description: {
    fontSize: Typography.body.fontSize,
    lineHeight: Typography.body.lineHeight,
  },
  headerCopy: { flex: 1, gap: Spacing.one },
  headerRow: { alignItems: 'flex-start', flexDirection: 'row', gap: Spacing.two },
  stat: {
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
  },
  stats: {
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.one,
    marginVertical: Spacing.two,
    paddingTop: Spacing.two,
  },
  status: {
    fontSize: Typography.label.fontSize,
    fontWeight: Typography.label.fontWeight,
    lineHeight: Typography.label.lineHeight,
    maxWidth: 120,
    textAlign: 'right',
  },
  title: {
    fontSize: Typography.cardTitle.fontSize,
    fontWeight: Typography.cardTitle.fontWeight,
    lineHeight: Typography.cardTitle.lineHeight,
  },
});
