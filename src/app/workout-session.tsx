import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { WorkoutSessionEmptyState } from '@/components/workouts/WorkoutSessionEmptyState';
import { WorkoutSessionExerciseNavigator } from '@/components/workouts/WorkoutSessionExerciseNavigator';
import { WorkoutSessionHeader } from '@/components/workouts/WorkoutSessionHeader';
import { WorkoutSessionSetEditor } from '@/components/workouts/WorkoutSessionSetEditor';
import { WorkoutSessionSetHistory } from '@/components/workouts/WorkoutSessionSetHistory';
import { Colors, MaxContentWidth, Radii, Spacing, Typography } from '@/constants/theme';
import { useAppContext, WorkoutSet } from '@/context/AppContext';
import {
  clearActiveWorkoutSessionDraft,
  getActiveWorkoutSessionDraft,
  setActiveWorkoutSessionDraft,
} from '@/lib/workouts';
import {
  getWorkoutSessionPreviousSets,
  getWorkoutSessionProgress,
  resolveWorkoutSessionExercises,
} from '@/lib/workouts/workout-session';
import { useAppTheme } from '@/theme/AppThemeProvider';

const formatElapsedLabel = (startedAt: string, now = Date.now()) => {
  const elapsedMs = Math.max(0, now - new Date(startedAt).getTime());
  const totalMinutes = Math.floor(elapsedMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
};

export default function WorkoutSessionScreen() {
  const { workouts, workoutSessions, saveWorkoutSession } = useAppContext();
  const { workoutId } = useLocalSearchParams();
  const { colors } = useAppTheme();
  const safeAreaInsets = useSafeAreaInsets();
  const requestedWorkoutId = Array.isArray(workoutId) ? workoutId[0] : workoutId;
  const workout = useMemo(() => {
    if (requestedWorkoutId === 'empty-workout') {
      return {
        createdAt: new Date().toISOString(),
        description: 'Start from scratch and add exercises during the session.',
        duration: 'Open-ended',
        exercises: [],
        id: 'empty-workout',
        title: 'Empty Workout',
        isCustom: true,
      };
    }

    return workouts.find((candidate) => candidate.id === requestedWorkoutId) ?? workouts[0] ?? null;
  }, [requestedWorkoutId, workouts]);
  const workoutExercises = useMemo(() => (workout ? resolveWorkoutSessionExercises(workout) : []), [workout]);
  const activeWorkoutDraft = useMemo(() => getActiveWorkoutSessionDraft(), [requestedWorkoutId]);
  const initialDraft = workout && activeWorkoutDraft?.workoutId === workout.id ? activeWorkoutDraft : null;
  const [startedAt, setStartedAt] = useState(initialDraft?.startedAt ?? new Date().toISOString());
  const [selectedExerciseId, setSelectedExerciseId] = useState(initialDraft?.sets.at(-1)?.exerciseId ?? workoutExercises[0]?.id ?? '');
  const [weight, setWeight] = useState('60');
  const [reps, setReps] = useState('8');
  const [sets, setSets] = useState<WorkoutSet[]>(initialDraft?.sets.map((set) => ({ ...set })) ?? []);
  const [editingSetId, setEditingSetId] = useState<string | undefined>();

  useEffect(() => {
    if (!workout) {
      return;
    }

    const nextDraft = activeWorkoutDraft?.workoutId === workout.id ? activeWorkoutDraft : null;

    if (nextDraft) {
      setStartedAt(nextDraft.startedAt);
      setSets(nextDraft.sets.map((set) => ({ ...set })));
      setSelectedExerciseId(nextDraft.sets.at(-1)?.exerciseId ?? workoutExercises[0]?.id ?? '');
    } else {
      const nextStartedAt = new Date().toISOString();
      setStartedAt(nextStartedAt);
      setSets([]);
      setSelectedExerciseId(workoutExercises[0]?.id ?? '');
      setActiveWorkoutSessionDraft({
        id: `${Date.now()}`,
        workoutId: workout.id,
        workoutTitle: workout.title,
        startedAt: nextStartedAt,
        sets: [],
      });
    }

    setWeight('60');
    setReps('8');
    setEditingSetId(undefined);
  }, [activeWorkoutDraft, workout, workoutExercises]);

  useEffect(() => {
    if (!workout) {
      return;
    }

    setActiveWorkoutSessionDraft({
      id: `${Date.now()}`,
      workoutId: workout.id,
      workoutTitle: workout.title,
      startedAt,
      sets,
    });
  }, [sets, startedAt, workout]);

  const progress = useMemo(() => getWorkoutSessionProgress(workoutExercises, selectedExerciseId, sets), [workoutExercises, selectedExerciseId, sets]);
  const previousSets = useMemo(() => getWorkoutSessionPreviousSets(progress.selectedExercise, workoutSessions), [progress.selectedExercise, workoutSessions]);
  const hasWorkout = Boolean(workout);
  const hasExercises = workoutExercises.length > 0;
  const styles = useMemo(() => createStyles(colors), [colors]);
  const completedLabel = progress.progressLabel;

  if (!hasWorkout) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <WorkoutSessionEmptyState
          actionLabel="Back to Workouts"
          description="Open a workout from the Workouts tab to continue logging sets."
          onAction={() => router.replace('/workouts')}
          title="No workout selected"
        />
      </View>
    );
  }

  const handleSaveSet = () => {
    if (!progress.selectedExercise) {
      return;
    }

    const parsedWeight = Number(weight);
    const parsedReps = Number(reps);

    if (!Number.isFinite(parsedWeight) || !Number.isFinite(parsedReps) || parsedWeight < 0 || parsedReps <= 0) {
      return;
    }

    const nextSet: WorkoutSet = {
      id: editingSetId ?? `${Date.now()}-${sets.length + 1}`,
      exerciseId: progress.selectedExercise.id,
      exerciseName: progress.selectedExercise.name,
      weight: parsedWeight,
      reps: parsedReps,
    };

    setSets((currentSets) => {
      if (!editingSetId) {
        return [...currentSets, nextSet];
      }

      return currentSets.map((set) => (set.id === editingSetId ? nextSet : set));
    });

    setEditingSetId(undefined);
    setWeight('60');
    setReps('8');
  };

  const handleEditSet = (set: WorkoutSet) => {
    setEditingSetId(set.id);
    setSelectedExerciseId(set.exerciseId);
    setWeight(`${set.weight}`);
    setReps(`${set.reps}`);
  };

  const handleRequestDeleteSet = (set: WorkoutSet) => {
    Alert.alert('Delete set?', `Delete ${set.exerciseName} · ${set.weight} kg × ${set.reps}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete set',
        style: 'destructive',
        onPress: () => {
          setSets((currentSets) => currentSets.filter((item) => item.id !== set.id));

          if (editingSetId === set.id) {
            setEditingSetId(undefined);
            setWeight('60');
            setReps('8');
          }
        },
      },
    ]);
  };

  const handleFinishWorkout = () => {
    if (sets.length === 0) {
      Alert.alert('Add at least one set', 'You need at least one set before finishing the workout.');
      return;
    }

    clearActiveWorkoutSessionDraft();
    saveWorkoutSession({
      id: `${Date.now()}`,
      workoutId: workout.id,
      workoutTitle: workout.title,
      startedAt,
      finishedAt: new Date().toISOString(),
      sets,
    });
    router.replace('/');
  };

  const handleCancelWorkout = () => {
    if (sets.length === 0) {
      clearActiveWorkoutSessionDraft();
      router.replace('/');
      return;
    }

    Alert.alert('Cancel workout?', 'Your added sets will not be saved.', [
      { text: 'Keep training', style: 'cancel' },
      {
        text: 'Cancel workout',
        style: 'destructive',
        onPress: () => {
          clearActiveWorkoutSessionDraft();
          router.replace('/');
        },
      },
    ]);
  };

  const zeroExerciseDescription = 'This workout has no exercises yet. The current empty-workout draft does not support adding exercises in-session, so return to Workouts to choose another plan.';

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.fill}>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={[styles.content, { paddingBottom: safeAreaInsets.bottom + 240 }]}
          keyboardShouldPersistTaps="handled"
          style={styles.scrollView}>
          <View style={styles.container}>
            {hasExercises ? (
              <>
                <WorkoutSessionHeader
                  completedLabel={completedLabel}
                  elapsedLabel={formatElapsedLabel(startedAt)}
                  nextExerciseName={progress.nextExercise?.name}
                  progressPercent={progress.progressPercent}
                  workoutTitle={workout.title}
                />

                <WorkoutSessionExerciseNavigator
                  completedExerciseIds={new Set(sets.map((set) => set.exerciseId))}
                  onSelectExercise={setSelectedExerciseId}
                  selectedExerciseId={selectedExerciseId}
                  workoutExercises={workoutExercises}
                />

                <WorkoutSessionSetEditor
                  editingSetId={editingSetId}
                  onCancelEdit={() => setEditingSetId(undefined)}
                  onRepsChange={setReps}
                  onSaveSet={handleSaveSet}
                  onWeightChange={setWeight}
                  previousSets={previousSets}
                  reps={reps}
                  selectedExercise={progress.selectedExercise}
                  selectedExerciseIndex={progress.selectedExerciseIndex}
                  totalExercises={workoutExercises.length}
                  weight={weight}
                />

                <WorkoutSessionSetHistory onDeleteSet={handleRequestDeleteSet} onEditSet={handleEditSet} sets={sets} />
              </>
            ) : (
              <WorkoutSessionEmptyState actionLabel="Return to Workouts" description={zeroExerciseDescription} onAction={() => router.replace('/workouts')} title={workout.title} />
            )}
          </View>
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: colors.background, borderColor: colors.borderSubtle, paddingBottom: safeAreaInsets.bottom + Spacing.two }]}>
          <View style={styles.footerInner}>
            <Pressable accessibilityRole="button" onPress={handleCancelWorkout} style={({ pressed }) => [styles.footerButton, styles.footerCancelButton, pressed && styles.footerPressed]}>
              <Text style={styles.footerCancelLabel}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: sets.length === 0 }}
              disabled={sets.length === 0}
              onPress={handleFinishWorkout}
              style={({ pressed }) => [styles.footerButton, styles.footerFinishButton, sets.length === 0 && styles.footerDisabled, pressed && sets.length > 0 && styles.footerPressed]}>
              <Text style={[styles.footerFinishLabel, sets.length === 0 && styles.footerLabelDisabled]}>Finish workout</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: typeof Colors.dark) =>
  StyleSheet.create({
    container: {
      gap: Spacing.three,
      maxWidth: MaxContentWidth,
      width: '100%',
    },
    content: {
      alignItems: 'center',
      padding: Spacing.three,
      paddingTop: Spacing.three,
    },
    fill: {
      flex: 1,
    },
    footer: {
      borderTopColor: colors.borderSubtle,
      borderTopWidth: StyleSheet.hairlineWidth,
      paddingHorizontal: Spacing.three,
      paddingTop: Spacing.two,
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
    },
    footerButton: {
      alignItems: 'center',
      borderCurve: 'continuous',
      borderRadius: Radii.large,
      justifyContent: 'center',
      minHeight: 48,
      paddingHorizontal: Spacing.four,
      paddingVertical: Spacing.two,
    },
    footerCancelButton: {
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.borderSubtle,
      borderWidth: StyleSheet.hairlineWidth,
      flex: 0.92,
    },
    footerCancelLabel: {
      color: colors.textPrimary,
      fontSize: Typography.button.fontSize,
      fontWeight: Typography.button.fontWeight,
      lineHeight: Typography.button.lineHeight,
    },
    footerDisabled: {
      opacity: 0.45,
    },
    footerFinishButton: {
      backgroundColor: colors.accent,
      flex: 1.35,
    },
    footerFinishLabel: {
      color: colors.textOnAccent,
      fontSize: Typography.button.fontSize,
      fontWeight: Typography.button.fontWeight,
      lineHeight: Typography.button.lineHeight,
    },
    footerInner: {
      alignSelf: 'center',
      flexDirection: 'row',
      gap: Spacing.two,
      maxWidth: MaxContentWidth,
      width: '100%',
    },
    footerLabelDisabled: {
      color: colors.textSecondary,
    },
    footerPressed: {
      opacity: 0.82,
    },
    screen: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
  });
