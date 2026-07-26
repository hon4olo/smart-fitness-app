import { ActivityIndicator, Text, View } from 'react-native';

import type { createStyles } from '@/features/workouts/styles/workoutSessionScreenStyles';
import { useLocalization } from '@/localization';

type WorkoutSessionLoadingStateProps = {
  accentColor: string;
  backgroundColor: string;
  styles: ReturnType<typeof createStyles>;
};

export function WorkoutSessionLoadingState({ accentColor, backgroundColor, styles }: WorkoutSessionLoadingStateProps) {
  const { t } = useLocalization();
  return (
    <View style={[styles.screen, { backgroundColor }]}>
      <View style={styles.loadingState}>
        <ActivityIndicator color={accentColor} />
        <Text style={styles.loadingLabel}>{t('workouts.session.loading')}</Text>
      </View>
    </View>
  );
}
