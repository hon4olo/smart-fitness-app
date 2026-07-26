import { Pressable, Text, View } from 'react-native';

import type { createStyles } from '@/features/workouts/styles/workoutSessionScreenStyles';
import { useLocalization } from '@/localization';

type WorkoutSessionEmptyWorkoutCardProps = {
  onAddExercises: () => void;
  onTestGif: () => void;
  styles: ReturnType<typeof createStyles>;
};

export function WorkoutSessionEmptyWorkoutCard({ onAddExercises, onTestGif, styles }: WorkoutSessionEmptyWorkoutCardProps) {
  const { t } = useLocalization();
  return (
    <View style={styles.emptyWorkoutCard}>
      <Text style={styles.emptyWorkoutTitle}>{t('workouts.session.noExercises')}</Text>
      <Text style={styles.emptyWorkoutSubtitle}>{t('workouts.session.noExercisesDescription')}</Text>
      <Pressable onPress={onAddExercises} style={({ pressed }) => [styles.addExercisesButton, pressed && styles.pressed]}>
        <Text style={styles.addExercisesLabel}>{t('workouts.session.addExercises')}</Text>
      </Pressable>
      <Pressable onPress={onTestGif} style={({ pressed }) => [styles.testGifButton, pressed && styles.pressed]}>
        <Text style={styles.testGifLabel}>{t('workouts.session.testGif')}</Text>
      </Pressable>
    </View>
  );
}
