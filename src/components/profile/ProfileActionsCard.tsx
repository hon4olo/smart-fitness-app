import { Text } from 'react-native';
import { useRouter } from 'expo-router';

import { DestructiveButton } from '@/components/ui/DestructiveButton';
import { AppCard } from '@/components/ui/AppCard';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { Colors, Spacing, Typography } from '@/constants/theme';

type ProfileActionsCardProps = {
  onResetOnboarding: () => void;
};

export function ProfileActionsCard({ onResetOnboarding }: ProfileActionsCardProps) {
  const router = useRouter();

  return (
    <AppCard>
      <Text style={styles.title}>Developer settings</Text>
      <Text style={styles.badge}>Developer</Text>
      <SecondaryButton
        accessibilityHint="Opens the deterministic Strength Coach preview"
        label="Strength Coach preview"
        onPress={() => router.push('/workouts/coach')}
      />
      <DestructiveButton accessibilityHint="Resets the setup flow for this device" label="Reset onboarding" onPress={onResetOnboarding} />
    </AppCard>
  );
}

const styles = {
  badge: {
    alignSelf: 'flex-start' as const,
    backgroundColor: Colors.dark.backgroundSelected,
    borderRadius: 999,
    color: Colors.dark.textSecondary,
    fontSize: Typography.caption.fontSize,
    fontWeight: '700' as const,
    marginBottom: Spacing.two,
    marginTop: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
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
