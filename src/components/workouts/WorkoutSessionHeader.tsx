import { StyleSheet, View } from 'react-native';

import { MetricCard } from '@/components/ui/MetricCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Spacing } from '@/constants/theme';

type WorkoutSessionHeaderProps = {
  estimatedDuration: string;
  setsCount: number;
  workoutTitle: string;
};

export function WorkoutSessionHeader({ estimatedDuration, setsCount, workoutTitle }: WorkoutSessionHeaderProps) {
  return (
    <View style={styles.container}>
      <SectionHeader title="Workout Session" subtitle={workoutTitle} />
      <View style={styles.metricsRow}>
        <MetricCard label="Workout" value={workoutTitle} detail={estimatedDuration} />
        <MetricCard label="Sets" value={`${setsCount}`} detail="logged now" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
