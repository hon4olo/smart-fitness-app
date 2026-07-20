import { Pressable, Text } from 'react-native';

import type { createStyles } from '@/features/workouts/styles/workoutSessionScreenStyles';

type WorkoutSessionFooterActionsProps = {
  onAddExercises: () => void;
  onTestGif: () => void;
  styles: ReturnType<typeof createStyles>;
  visible: boolean;
};

export function WorkoutSessionFooterActions({ onAddExercises, onTestGif, styles, visible }: WorkoutSessionFooterActionsProps) {
  if (!visible) {
    return null;
  }

  return (
    <>
      <Pressable onPress={onAddExercises} style={({ pressed }) => [styles.addExerciseFooterButton, pressed && styles.pressed]}>
        <Text style={styles.addExerciseFooterLabel}>Add exercises</Text>
      </Pressable>
      <Pressable onPress={onTestGif} style={({ pressed }) => [styles.testGifFooterButton, pressed && styles.pressed]}>
        <Text style={styles.testGifLabel}>Test Exercise GIF</Text>
      </Pressable>
    </>
  );
}
