import { Pressable, Text, View } from 'react-native';

import type { createStyles } from '@/features/workouts/styles/workoutSessionScreenStyles';
import { useLocalization } from '@/localization';

type WorkoutSessionMissingStateProps = {
  backgroundColor: string;
  onBackToWorkouts: () => void;
  styles: ReturnType<typeof createStyles>;
};

export function WorkoutSessionMissingState({ backgroundColor, onBackToWorkouts, styles }: WorkoutSessionMissingStateProps) {
  const { t } = useLocalization();
  return (
    <View style={[styles.screen, { backgroundColor }]}>
      <View style={styles.loadingState}>
        <Text style={styles.emptyTitle}>{t('workouts.session.missingTitle')}</Text>
        <Pressable onPress={onBackToWorkouts} style={({ pressed }) => [styles.textAction, pressed && styles.pressed]}>
          <Text style={styles.textActionLabel}>{t('workouts.session.backToWorkouts')}</Text>
        </Pressable>
      </View>
    </View>
  );
}
