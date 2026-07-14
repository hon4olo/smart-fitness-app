import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { Colors, Spacing } from '@/constants/theme';

type WorkoutSessionEmptyStateProps = {
  onGoBack: () => void;
};

export function WorkoutSessionEmptyState({ onGoBack }: WorkoutSessionEmptyStateProps) {
  return (
    <View style={styles.emptyScreen}>
      <Text style={styles.emptyTitle}>No workout selected</Text>
      <Text style={styles.emptyDescription}>Create a template first, then start a session from the workouts tab.</Text>
      <AppButton label="Go back" onPress={onGoBack} />
    </View>
  );
}

const styles = StyleSheet.create({
  emptyDescription: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  emptyScreen: {
    alignItems: 'center',
    flex: 1,
    gap: Spacing.two,
    justifyContent: 'center',
    padding: Spacing.four,
  },
  emptyTitle: {
    color: Colors.dark.text,
    fontSize: 20,
    fontWeight: '900',
  },
});
