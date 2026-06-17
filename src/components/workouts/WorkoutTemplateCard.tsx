import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing } from '@/constants/theme';
import { Workout } from '@/context/AppContext';

type WorkoutTemplateCardProps = {
  isCustomWorkout: boolean;
  onDelete: (workoutId: string) => void;
  onEdit: (workoutId: string) => void;
  onStart: (workoutId: string) => void;
  workout: Workout;
};

export function WorkoutTemplateCard({ isCustomWorkout, onDelete, onEdit, onStart, workout }: WorkoutTemplateCardProps) {
  return (
    <AppCard>
      <View style={styles.cardHeader}>
        <Text selectable style={styles.title}>
          {workout.title}
        </Text>
        <Text selectable style={styles.duration}>
          {workout.duration}
        </Text>
      </View>

      {workout.description ? (
        <Text selectable style={styles.description}>
          {workout.description}
        </Text>
      ) : null}

      <View style={styles.exerciseList}>
        {workout.exercises.map((exercise) => (
          <Text selectable key={exercise.id} style={styles.exercise}>
            {exercise.name}
          </Text>
        ))}
      </View>

      <AppButton label="Start" onPress={() => onStart(workout.id)} />
      {isCustomWorkout ? (
        <>
          <AppButton label="Edit" onPress={() => onEdit(workout.id)} variant="secondary" />
          <AppButton label="Delete" onPress={() => onDelete(workout.id)} variant="secondary" />
        </>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  cardHeader: {
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  description: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  duration: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
  exercise: {
    color: Colors.dark.text,
    fontSize: 15,
  },
  exerciseList: {
    gap: Spacing.one,
  },
  title: {
    color: Colors.dark.text,
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
  },
});
