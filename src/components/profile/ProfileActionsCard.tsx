import { Text } from 'react-native';

import { DestructiveButton } from '@/components/ui/DestructiveButton';
import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing, Typography } from '@/constants/theme';

type ProfileActionsCardProps = {
  onResetOnboarding: () => void;
};

export function ProfileActionsCard({ onResetOnboarding }: ProfileActionsCardProps) {
  return (
    <AppCard>
      <Text style={styles.title}>Developer settings</Text>
      <Text style={styles.helpText}>Reset onboarding and other owner-only tools stay below the regular settings.</Text>
      <DestructiveButton accessibilityHint="Resets the setup flow for this device" label="Reset onboarding" onPress={onResetOnboarding} />
    </AppCard>
  );
}

const styles = {
  helpText: {
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
