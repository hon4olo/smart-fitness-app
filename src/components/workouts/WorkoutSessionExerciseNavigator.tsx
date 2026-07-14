import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing } from '@/constants/theme';
import type { PlannedExercise } from '@/lib/workouts/workout-session';

type WorkoutSessionExerciseNavigatorProps = {
  onSelectExercise: (exerciseId: string) => void;
  selectedExerciseId: string;
  selectedExerciseIndex: number;
  workoutExercises: PlannedExercise[];
};

export function WorkoutSessionExerciseNavigator({
  onSelectExercise,
  selectedExerciseId,
  selectedExerciseIndex,
  workoutExercises,
}: WorkoutSessionExerciseNavigatorProps) {
  return (
    <AppCard>
      <Text selectable style={styles.sectionTitle}>
        Exercise progression
      </Text>
      <View style={styles.exerciseList}>
        {workoutExercises.map((exercise, index) => {
          const isSelected = exercise.id === selectedExerciseId;
          const isComplete = index < selectedExerciseIndex;

          return (
            <Pressable
              accessibilityRole="button"
              key={exercise.id}
              onPress={() => onSelectExercise(exercise.id)}
              style={({ pressed }) => [
                styles.exerciseCard,
                isSelected && styles.exerciseCardSelected,
                pressed && styles.pressed,
              ]}>
              <View style={styles.exerciseCardHeader}>
                <View style={styles.exerciseIndexPill}>
                  <Text style={styles.exerciseIndexLabel}>{index + 1}</Text>
                </View>
                <View style={styles.exerciseCardCopy}>
                  <Text selectable style={[styles.exerciseCardTitle, isSelected && styles.exerciseCardTitleSelected]}>
                    {exercise.name}
                  </Text>
                  <Text selectable style={styles.exerciseCardMeta}>
                    {exercise.targetSets ?? 3} sets · {exercise.targetReps ?? 8} reps · {exercise.restSeconds ?? 90}s rest
                  </Text>
                </View>
                <Text style={styles.exerciseState}>{isSelected ? 'Current' : isComplete ? 'Done' : 'Next'}</Text>
              </View>
              {exercise.notes ? <Text selectable style={styles.exerciseNotes}>{exercise.notes}</Text> : null}
            </Pressable>
          );
        })}
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  exerciseCard: {
    backgroundColor: Colors.dark.backgroundElement,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 14,
    borderWidth: 1,
    gap: Spacing.one,
    padding: Spacing.three,
  },
  exerciseCardCopy: {
    flex: 1,
    gap: 2,
  },
  exerciseCardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.two,
  },
  exerciseCardMeta: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
  },
  exerciseCardSelected: {
    borderColor: Colors.dark.accent,
  },
  exerciseCardTitle: {
    color: Colors.dark.text,
    fontSize: 15,
    fontWeight: '800',
  },
  exerciseCardTitleSelected: {
    color: Colors.dark.accent,
  },
  exerciseIndexLabel: {
    color: Colors.dark.text,
    fontSize: 12,
    fontWeight: '800',
  },
  exerciseIndexPill: {
    alignItems: 'center',
    backgroundColor: Colors.dark.backgroundSelected,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 28,
    minWidth: 28,
  },
  exerciseList: {
    gap: Spacing.two,
  },
  exerciseNotes: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  exerciseState: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  pressed: {
    opacity: 0.82,
  },
  sectionTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '800',
  },
});
