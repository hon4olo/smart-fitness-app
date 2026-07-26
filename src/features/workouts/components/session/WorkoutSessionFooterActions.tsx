import { Pressable, Text } from 'react-native';

import type { createStyles } from '@/features/workouts/styles/workoutSessionScreenStyles';
import { useLocalization } from '@/localization';

type WorkoutSessionFooterActionsProps = {
  onAddExercises: () => void;
  onTestGif: () => void;
  styles: ReturnType<typeof createStyles>;
  visible: boolean;
};

export function WorkoutSessionFooterActions({ onAddExercises, onTestGif, styles, visible }: WorkoutSessionFooterActionsProps) {
  const { t } = useLocalization();
  if (!visible) {
    return null;
  }

  return (
    <>
      <Pressable onPress={onAddExercises} style={({ pressed }) => [styles.addExerciseFooterButton, pressed && styles.pressed]}>
        <Text style={styles.addExerciseFooterLabel}>{t('workouts.session.addExercises')}</Text>
      </Pressable>
      <Pressable onPress={onTestGif} style={({ pressed }) => [styles.testGifFooterButton, pressed && styles.pressed]}>
        <Text style={styles.testGifLabel}>{t('workouts.session.testGif')}</Text>
      </Pressable>
    </>
  );
}
