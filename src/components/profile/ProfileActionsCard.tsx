import { Text } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing } from '@/constants/theme';

type ProfileActionsCardProps = {
  onResetOnboarding: () => void;
};

export function ProfileActionsCard({ onResetOnboarding }: ProfileActionsCardProps) {
  return (
    <AppCard>
      <Text style={styles.title}>Quick actions</Text>
      <Text style={styles.helpText}>Need the setup flow again? Reset onboarding from here.</Text>
      <AppButton label="Reset onboarding" onPress={onResetOnboarding} variant="secondary" />
    </AppCard>
  );
}

const styles = {
  title: {
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
};