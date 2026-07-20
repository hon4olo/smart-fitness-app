import { ActivityIndicator, Text, View } from 'react-native';

import type { createStyles } from '@/features/workouts/styles/workoutSessionScreenStyles';

type WorkoutSessionLoadingStateProps = {
  accentColor: string;
  backgroundColor: string;
  styles: ReturnType<typeof createStyles>;
};

export function WorkoutSessionLoadingState({ accentColor, backgroundColor, styles }: WorkoutSessionLoadingStateProps) {
  return (
    <View style={[styles.screen, { backgroundColor }]}>
      <View style={styles.loadingState}>
        <ActivityIndicator color={accentColor} />
        <Text style={styles.loadingLabel}>Loading workout…</Text>
      </View>
    </View>
  );
}
