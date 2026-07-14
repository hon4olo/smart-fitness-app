import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { WorkoutSessionEmptyState } from '@/components/workouts/WorkoutSessionEmptyState';
import { WorkoutSessionExerciseNavigator } from '@/components/workouts/WorkoutSessionExerciseNavigator';
import { WorkoutSessionHeader } from '@/components/workouts/WorkoutSessionHeader';
import { WorkoutSessionProgressCard } from '@/components/workouts/WorkoutSessionProgressCard';
import { WorkoutSessionSetEditor } from '@/components/workouts/WorkoutSessionSetEditor';
import { WorkoutSessionSetHistory } from '@/components/workouts/WorkoutSessionSetHistory';
import { AppButton } from '@/components/ui/AppButton';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAppContext, WorkoutSet } from '@/context/AppContext';
import {
  getWorkoutSessionEstimatedDuration,
  getWorkoutSessionExercisePrs,
  getWorkoutSessionPreviousSets,
  getWorkoutSessionProgress,
  resolveWorkoutSessionExercises,
} from '@/lib/workouts/workout-session';

export default function WorkoutSessionScreen() {
  const { workouts, workoutSessions, saveWorkoutSession } = useAppContext();
  const { workoutId } = useLocalSearchParams();
  const safeAreaInsets = useSafeAreaInsets();
  const requestedWorkoutId = Array.isArray(workoutId) ? workoutId[0] : workoutId;
  const workout = useMemo(() => workouts.find((candidate) => candidate.id === requestedWorkoutId) ?? workouts[0], [requestedWorkoutId, workouts]);
  const workoutExercises = useMemo(() => resolveWorkoutSessionExercises(workout), [workout]);
  const estimatedDuration = useMemo(() => getWorkoutSessionEstimatedDuration(workout), [workout]);
  const startedAt = useMemo(() => new Date().toISOString(), []);

  const [selectedExerciseId, setSelectedExerciseId] = useState(workoutExercises[0]?.id ?? '');
  const [weight, setWeight] = useState('60');
  const [reps, setReps] = useState('8');
  const [sets, setSets] = useState<WorkoutSet[]>([]);
  const [editingSetId, setEditingSetId] = useState<string | undefined>();

  useEffect(() => {
    setSelectedExerciseId(workoutExercises[0]?.id ?? '');
    setWeight('60');
    setReps('8');
    setSets([]);
    setEditingSetId(undefined);
  }, [workout?.id]);

  const progress = useMemo(() => getWorkoutSessionProgress(workoutExercises, selectedExerciseId), [workoutExercises, selectedExerciseId]);
  const previousSets = useMemo(() => getWorkoutSessionPreviousSets(progress.selectedExercise, workoutSessions), [progress.selectedExercise, workoutSessions]);
  const exercisePrs = useMemo(() => getWorkoutSessionExercisePrs(progress.selectedExercise, workoutSessions), [progress.selectedExercise, workoutSessions]);

  if (!workout) {
    return (
      <View style={styles.screen}>
        <WorkoutSessionEmptyState onGoBack={() => router.replace('/')} />
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

  const handleDeleteSet = (setId: string) => {
    setSets((currentSets) => currentSets.filter((set) => set.id !== setId));

    if (editingSetId === setId) {
      setEditingSetId(undefined);
      setWeight('60');
      setReps('8');
    }
  };

  const handleFinishWorkout = () => {
    if (sets.length === 0) {
      Alert.alert('Add at least one set', 'You need at least one set before finishing the workout.');
      return;
    }

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
      router.replace('/');
      return;
    }

    Alert.alert('Cancel workout?', 'Your added sets will not be saved.', [
      { text: 'Keep training', style: 'cancel' },
      {
        text: 'Cancel workout',
        style: 'destructive',
        onPress: () => router.replace('/'),
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.content, { paddingBottom: safeAreaInsets.bottom + 120 }]}
        keyboardShouldPersistTaps="handled"
        style={styles.scrollView}>
        <View style={styles.container}>
          <WorkoutSessionHeader estimatedDuration={estimatedDuration} setsCount={sets.length} workoutTitle={workout.title} />

          <WorkoutSessionProgressCard
            nextExerciseName={progress.nextExercise?.name}
            progressLabel={progress.progressLabel}
            progressPercent={progress.progressPercent}
            selectedExerciseName={progress.selectedExercise?.name}
          />

          <WorkoutSessionExerciseNavigator
            onSelectExercise={setSelectedExerciseId}
            selectedExerciseId={selectedExerciseId}
            selectedExerciseIndex={progress.selectedExerciseIndex}
            workoutExercises={workoutExercises}
          />

          <WorkoutSessionSetEditor
            editingSetId={editingSetId}
            exercisePrs={exercisePrs}
            onCancelEdit={() => setEditingSetId(undefined)}
            onRepsChange={setReps}
            onSaveSet={handleSaveSet}
            onWeightChange={setWeight}
            previousSets={previousSets}
            reps={reps}
            selectedExercise={progress.selectedExercise}
            weight={weight}
          />

          <WorkoutSessionSetHistory onDeleteSet={handleDeleteSet} onEditSet={handleEditSet} sets={sets} />
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: safeAreaInsets.bottom + Spacing.two,
          },
        ]}>
        <View style={styles.footerInner}>
          <View style={styles.cancelButtonSlot}>
            <AppButton label="Cancel workout" onPress={handleCancelWorkout} variant="secondary" />
          </View>
          <View style={styles.finishButtonSlot}>
            <AppButton disabled={sets.length === 0} label="Finish workout" onPress={handleFinishWorkout} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cancelButtonSlot: {
    flex: 1,
  },
  container: {
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    width: '100%',
  },
  content: {
    alignItems: 'center',
    padding: Spacing.three,
  },
  finishButtonSlot: {
    flex: 1.6,
  },
  footer: {
    backgroundColor: Colors.dark.background,
    borderColor: Colors.dark.border,
    borderTopWidth: 1,
    bottom: 0,
    left: 0,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    position: 'absolute',
    right: 0,
  },
  footerInner: {
    alignSelf: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
    width: '100%',
  },
  screen: {
    backgroundColor: Colors.dark.background,
    flex: 1,
  },
  scrollView: {
    backgroundColor: Colors.dark.background,
    flex: 1,
  },
});
