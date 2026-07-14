import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing } from '@/constants/theme';
import { Workout } from '@/types';

import { estimateWorkoutDurationFromPlan, formatWorkoutPlanExercise, parseWorkoutPlanDescription } from '@/lib/workouts';

type WorkoutTemplateCardProps = {
  isCustomWorkout: boolean;
  lastUsedLabel?: string;
  onDelete: (workoutId: string) => void;
  onEdit: (workoutId: string) => void;
  onStart: (workoutId: string) => void;
  workout: Workout;
};

export function WorkoutTemplateCard({ isCustomWorkout, lastUsedLabel, onDelete, onEdit, onStart, workout }: WorkoutTemplateCardProps) {
  const parsedPlan = parseWorkoutPlanDescription(workout.description);
  const planExercises = parsedPlan.exercises;
  const estimatedDuration = planExercises.length > 0 ? estimateWorkoutDurationFromPlan(planExercises) : workout.duration;
  const summaryExercises = planExercises.length > 0 ? planExercises : workout.exercises.map((exercise) => ({ name: exercise.name }));
  const visibleSummary = summaryExercises.slice(0, 3);
  const remainingCount = Math.max(0, summaryExercises.length - visibleSummary.length);

  return (
    <AppCard>
      <View style={styles.headerRow}>
        <View style={styles.headerContent}>
          <Text selectable style={styles.title}>
            {workout.title}
          </Text>
          {parsedPlan.baseDescription ? <Text selectable style={styles.description}>{parsedPlan.baseDescription}</Text> : null}
        </View>
        <View style={styles.durationPill}>
          <Text style={styles.durationLabel}>Est.</Text>
          <Text style={styles.durationValue}>{estimatedDuration}</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaPill}>
          <Text style={styles.metaLabel}>Exercises</Text>
          <Text style={styles.metaValue}>{workout.exercises.length}</Text>
        </View>
        {lastUsedLabel ? (
          <View style={styles.metaPill}>
            <Text style={styles.metaLabel}>Last used</Text>
            <Text style={styles.metaValue}>{lastUsedLabel}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.summaryList}>
        {visibleSummary.map((exercise, index) => (
          <View key={`${workout.id}-${exercise.name}-${index}`} style={styles.summaryRow}>
            <Text selectable style={styles.summaryIndex}>
              {index + 1}
            </Text>
            <View style={styles.summaryContent}>
              <Text selectable style={styles.summaryName}>
                {exercise.name}
              </Text>
              {planExercises.length > 0 ? (
                <Text selectable style={styles.summaryDetail}>
                  {formatWorkoutPlanExercise(exercise, index)}
                </Text>
              ) : null}
            </View>
          </View>
        ))}
        {remainingCount > 0 ? <Text style={styles.moreLabel}>+ {remainingCount} more</Text> : null}
      </View>

      <AppButton label="Start workout" onPress={() => onStart(workout.id)} />

      {isCustomWorkout ? (
        <View style={styles.secondaryActions}>
          <AppButton label="Edit template" onPress={() => onEdit(workout.id)} variant="secondary" />
          <AppButton label="Delete template" onPress={() => onDelete(workout.id)} variant="secondary" />
        </View>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  description: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  durationLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  durationPill: {
    alignItems: 'flex-end',
    backgroundColor: Colors.dark.backgroundSelected,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 14,
    borderWidth: 1,
    gap: 2,
    minWidth: 88,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  durationValue: {
    color: Colors.dark.text,
    fontSize: 15,
    fontWeight: '800',
  },
  headerContent: {
    flex: 1,
    gap: Spacing.one,
  },
  headerRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  moreLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  metaLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  metaPill: {
    backgroundColor: Colors.dark.backgroundSelected,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    minWidth: 120,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  metaValue: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryActions: {
    gap: Spacing.two,
  },
  summaryContent: {
    flex: 1,
    gap: 2,
  },
  summaryDetail: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  summaryIndex: {
    color: Colors.dark.accent,
    fontSize: 13,
    fontWeight: '800',
    width: 18,
  },
  summaryList: {
    gap: Spacing.two,
  },
  summaryName: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  title: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '800',
  },
});
