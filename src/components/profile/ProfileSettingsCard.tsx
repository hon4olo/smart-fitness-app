import { StyleSheet, Text } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useAppTheme } from '@/theme/AppThemeProvider';

export function ProfileSettingsCard({
  actionLabel,
  description,
  onOpen,
}: {
  actionLabel: string;
  description: string;
  onOpen: () => void;
}) {
  const { colors } = useAppTheme();

  return (
    <AppCard>
      <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>
      <SecondaryButton label={actionLabel} onPress={onOpen} />
    </AppCard>
  );
}

const styles = StyleSheet.create({
  description: {
    fontSize: Typography.body.fontSize,
    lineHeight: Typography.body.lineHeight,
    marginBottom: Spacing.two,
  },
});
