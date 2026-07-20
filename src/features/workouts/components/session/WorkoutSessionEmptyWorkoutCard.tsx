import { Pressable, Text, View } from 'react-native';

import type { createStyles } from '@/features/workouts/styles/workoutSessionScreenStyles';

type WorkoutSessionEmptyWorkoutCardProps = {
  onAddExercises: () => void;
  onTestGif: () => void;
  styles: ReturnType<typeof createStyles>;
};

export function WorkoutSessionEmptyWorkoutCard({ onAddExercises, onTestGif, styles }: WorkoutSessionEmptyWorkoutCardProps) {
  return (
    <View style={styles.emptyWorkoutCard}>
      <Text style={styles.emptyWorkoutTitle}>No Exercises Added</Text>
      <Text style={styles.emptyWorkoutSubtitle}>Add one or more exercises to start logging the session.</Text>
      <Pressable onPress={onAddExercises} style={({ pressed }) => [styles.addExercisesButton, pressed && styles.pressed]}>
        <Text style={styles.addExercisesLabel}>{['Add ', 'exercises'].join('')}</Text>
      </Pressable>
      <Pressable onPress={onTestGif} style={({ pressed }) => [styles.testGifButton, pressed && styles.pressed]}>
        <Text style={styles.testGifLabel}>Test Exercise GIF</Text>
      </Pressable>
    </View>
  );
}
