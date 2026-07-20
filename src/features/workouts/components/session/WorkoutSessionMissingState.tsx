import { Pressable, Text, View } from 'react-native';

import type { createStyles } from '@/features/workouts/styles/workoutSessionScreenStyles';

type WorkoutSessionMissingStateProps = {
  backgroundColor: string;
  onBackToWorkouts: () => void;
  styles: ReturnType<typeof createStyles>;
};

export function WorkoutSessionMissingState({ backgroundColor, onBackToWorkouts, styles }: WorkoutSessionMissingStateProps) {
  return (
    <View style={[styles.screen, { backgroundColor }]}>
      <View style={styles.loadingState}>
        <Text style={styles.emptyTitle}>No workout selected</Text>
        <Pressable onPress={onBackToWorkouts} style={({ pressed }) => [styles.textAction, pressed && styles.pressed]}>
          <Text style={styles.textActionLabel}>Back to Workouts</Text>
        </Pressable>
      </View>
    </View>
  );
}
