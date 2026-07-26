import { Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useLocalization } from '@/localization';

export function ProfileRuntimeInfoCard({
  channel,
  createdAt,
  onCheckForOtaUpdate,
  runtimeVersion,
  updateId,
}: {
  channel: string;
  createdAt: string;
  onCheckForOtaUpdate: () => void;
  runtimeVersion: string;
  updateId: string;
}) {
  const { t } = useLocalization();

  return (
    <AppCard>
      <Text style={styles.title}>{t('developer.runtimeMetadata')}</Text>

      <View style={styles.otaCard}>
        <Text style={styles.otaTitle}>{t('developer.otaUpdate')}</Text>

        <View style={styles.otaRow}>
          <Text style={styles.otaLabel}>runtimeVersion</Text>
          <Text style={styles.otaValue}>{runtimeVersion}</Text>
        </View>
        <View style={styles.otaRow}>
          <Text style={styles.otaLabel}>updateId</Text>
          <Text style={styles.otaValue}>{updateId}</Text>
        </View>
        <View style={styles.otaRow}>
          <Text style={styles.otaLabel}>{t('developer.createdAt')}</Text>
          <Text style={styles.otaValue}>{createdAt}</Text>
        </View>
        <View style={styles.otaRow}>
          <Text style={styles.otaLabel}>{t('developer.channel')}</Text>
          <Text style={styles.otaValue}>{channel}</Text>
        </View>

        <AppButton
          label={t('developer.checkOtaUpdate')}
          onPress={onCheckForOtaUpdate}
          variant="secondary"
        />
      </View>
    </AppCard>
  );
}

const styles = {
  otaCard: {
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  otaLabel: {
    color: Colors.dark.textSecondary,
    flex: 1,
    fontSize: Typography.metricSmall.fontSize,
    fontWeight: Typography.metricSmall.fontWeight,
    lineHeight: Typography.metricSmall.lineHeight,
    textTransform: Typography.metricSmall.textTransform,
  },
  otaRow: {
    borderColor: Colors.dark.border,
    borderTopWidth: 1,
    flexDirection: 'row' as const,
    gap: Spacing.two,
    paddingTop: Spacing.two,
  },
  otaTitle: {
    color: Colors.dark.text,
    fontSize: Typography.bodyStrong.fontSize,
    fontWeight: Typography.bodyStrong.fontWeight,
    lineHeight: Typography.bodyStrong.lineHeight,
  },
  otaValue: {
    color: Colors.dark.text,
    flex: 1,
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
    textAlign: 'right' as const,
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
