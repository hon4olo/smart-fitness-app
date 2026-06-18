import { Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing } from '@/constants/theme';

type DeveloperToolsCardProps = {
  createdAt: string;
  channel: string;
  onCheckForOtaUpdate: () => void;
  runtimeVersion: string;
  updateId: string;
};

export function DeveloperToolsCard({
  createdAt,
  channel,
  onCheckForOtaUpdate,
  runtimeVersion,
  updateId,
}: DeveloperToolsCardProps) {
  return (
    <AppCard>
      <Text style={styles.developerTitle}>Developer Tools</Text>
      <Text style={styles.helpText}>Debug info and OTA controls stay here, below your profile settings.</Text>
      <View style={styles.otaCard}>
        <Text style={styles.otaTitle}>OTA Update</Text>

        <View style={styles.otaRow}>
          <Text style={styles.otaLabel}>runtimeVersion</Text>
          <Text style={styles.otaValue}>{runtimeVersion}</Text>
        </View>
        <View style={styles.otaRow}>
          <Text style={styles.otaLabel}>updateId</Text>
          <Text style={styles.otaValue}>{updateId}</Text>
        </View>
        <View style={styles.otaRow}>
          <Text style={styles.otaLabel}>createdAt</Text>
          <Text style={styles.otaValue}>{createdAt}</Text>
        </View>
        <View style={styles.otaRow}>
          <Text style={styles.otaLabel}>channel</Text>
          <Text style={styles.otaValue}>{channel}</Text>
        </View>

        <AppButton
          label="Check for OTA update"
          onPress={onCheckForOtaUpdate}
          variant="secondary"
        />
      </View>
    </AppCard>
  );
}

const styles = {
  developerTitle: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '800' as const,
    letterSpacing: 0.4,
    marginBottom: 2,
    textTransform: 'uppercase' as const,
  },
  helpText: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: Spacing.two,
  },
  otaCard: {
    gap: Spacing.two,
  },
  otaLabel: {
    color: Colors.dark.textSecondary,
    flex: 1,
    fontSize: 12,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
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
    fontSize: 16,
    fontWeight: '800' as const,
  },
  otaValue: {
    color: Colors.dark.text,
    flex: 1,
    fontSize: 12,
    textAlign: 'right' as const,
  },
};
