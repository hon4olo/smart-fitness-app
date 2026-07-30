import { router } from 'expo-router';
import { Alert, Pressable, Text, View } from 'react-native';

import type { WorkoutBuilderCopy } from '@/localization/workoutBuilderCopy';
import type { Workout } from '@/types';

export type WorkoutBuilderAttachedRow = {
  dayId: string;
  exerciseCountLabel: string;
  title: string;
  workout?: Workout;
};

type WorkoutBuilderProgramWorkoutsProps = {
  copy: WorkoutBuilderCopy;
  nextWorkout?: Workout;
  onAddWorkout: () => void;
  onEditWorkout: (workout: Workout) => void;
  onRemoveWorkout: (dayId: string) => void;
  rows: WorkoutBuilderAttachedRow[];
  styles: Record<string, any>;
};

export function WorkoutBuilderProgramWorkouts({
  copy,
  nextWorkout,
  onAddWorkout,
  onEditWorkout,
  onRemoveWorkout,
  rows,
  styles,
}: WorkoutBuilderProgramWorkoutsProps) {
  return (
    <>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>{copy.workouts}</Text>
        {nextWorkout ? (
          <Pressable
            accessibilityLabel={copy.startNextWorkout}
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: '/workouts/template/[workoutId]',
                params: { workoutId: nextWorkout.id },
              })
            }
            style={({ pressed }) => [styles.startNextButton, pressed && styles.pressed]}>
            <Text style={styles.startNextLabel}>{copy.startNextWorkout}</Text>
          </Pressable>
        ) : null}
      </View>

      {rows.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>{copy.noWorkoutsAdded}</Text>
          <Text style={styles.emptyStateSubtitle}>{copy.noWorkoutsAddedBody}</Text>
        </View>
      ) : (
        <View style={styles.workoutList}>
          {rows.map((row) => (
            <View key={row.dayId} style={styles.workoutRow}>
              <Pressable
                accessibilityLabel={copy.openWorkout(row.title)}
                accessibilityRole="button"
                onPress={() => {
                  if (!row.workout) {
                    Alert.alert(copy.workoutUnavailable, copy.workoutUnavailableBody);
                    return;
                  }
                  router.push({
                    pathname: '/workouts/template/[workoutId]',
                    params: { workoutId: row.workout.id },
                  });
                }}
                style={({ pressed }) => [styles.workoutRowBody, pressed && styles.pressed]}>
                <View style={styles.workoutRowCopy}>
                  <Text style={styles.workoutRowTitle}>{row.title}</Text>
                  <Text style={styles.workoutRowMeta}>{row.exerciseCountLabel}</Text>
                </View>
                <Text accessibilityElementsHidden style={styles.workoutRowChevron}>
                  ›
                </Text>
              </Pressable>

              <Pressable
                accessibilityLabel={copy.workoutActions(row.title)}
                accessibilityRole="button"
                onPress={() => {
                  const workout = row.workout;
                  if (!workout) {
                    Alert.alert(copy.workoutUnavailable, copy.workoutMissingBody);
                    return;
                  }

                  Alert.alert(row.title, undefined, [
                    ...(workout.isCustom
                      ? [
                          {
                            text: copy.editWorkout,
                            onPress: () => onEditWorkout(workout),
                          },
                        ]
                      : []),
                    {
                      text: copy.removeFromProgram,
                      style: 'destructive' as const,
                      onPress: () => onRemoveWorkout(row.dayId),
                    },
                    { text: copy.cancel, style: 'cancel' as const },
                  ]);
                }}
                style={({ pressed }) => [styles.overflowButton, pressed && styles.pressed]}>
                <Text style={styles.overflowLabel}>⋯</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <Pressable
        accessibilityLabel={copy.addWorkout}
        accessibilityRole="button"
        onPress={onAddWorkout}
        style={({ pressed }) => [styles.addWorkoutButton, pressed && styles.pressed]}>
        <Text style={styles.addWorkoutLabel}>+ {copy.addWorkout}</Text>
      </Pressable>
    </>
  );
}
