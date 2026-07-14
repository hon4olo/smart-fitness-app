import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { MetricCard } from '@/components/ui/MetricCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAppContext, WorkoutSet } from '@/context/AppContext';
import { Workout, Exercise } from '@/types';
import {
  estimateWorkoutDurationFromPlan,
  formatWorkoutPlanExercise,
  parseWorkoutPlanDescription,
} from '@/lib/workouts';

type PlannedExercise = Exercise & {
  notes?: string;
  restSeconds?: number;
  targetReps?: number;
  targetSets?: number;
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));

const resolveWorkoutExercises = (workout?: Workout) => {
  if (!workout) {
    return [] as PlannedExercise[];
  }

  const parsedPlan = parseWorkoutPlanDescription(workout.description);

  return workout.exercises.map((exercise, index) => {
    const plannedExercise = parsedPlan.exercises[index];

    return {
      ...exercise,
      ...plannedExercise,
      name: plannedExercise?.name ?? exercise.name,
    } satisfies PlannedExercise;
  });
};

export default function WorkoutSessionScreen() {
  const { workouts, workoutSessions, saveWorkoutSession } = useAppContext();
  const { workoutId } = useLocalSearchParams();
  const safeAreaInsets = useSafeAreaInsets();
  const requestedWorkoutId = Array.isArray(workoutId) ? workoutId[0] : workoutId;
  const workout = useMemo(() => workouts.find((candidate) => candidate.id === requestedWorkoutId) ?? workouts[0], [requestedWorkoutId, workouts]);
  const workoutExercises = useMemo(() => resolveWorkoutExercises(workout), [workout]);
  const parsedPlan = useMemo(() => parseWorkoutPlanDescription(workout?.description), [workout?.description]);
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

  const selectedExercise = workoutExercises.find((exercise) => exercise.id === selectedExerciseId) ?? workoutExercises[0];
  const selectedExerciseIndex = Math.max(0, workoutExercises.findIndex((exercise) => exercise.id === selectedExercise?.id));
  const progressLabel = workoutExercises.length > 0 ? `${selectedExerciseIndex + 1} / ${workoutExercises.length}` : '0 / 0';
  const nextExercise = workoutExercises[selectedExerciseIndex + 1];
  const estimatedDuration = parsedPlan.exercises.length > 0 ? estimateWorkoutDurationFromPlan(parsedPlan.exercises) : workout?.duration ?? '—';

  const previousSets = useMemo(() => {
    if (!selectedExercise) {
      return [];
    }

    return workoutSessions
      .flatMap((session) => {
        return session.sets
          .filter((set) => set.exerciseId === selectedExercise.id)
          .map((set) => ({
            id: `${session.id}-${set.id}`,
            finishedAt: session.finishedAt,
            workoutDate: formatDate(session.finishedAt),
            reps: set.reps,
            weight: set.weight,
          }));
      })
      .sort((left, right) => new Date(right.finishedAt).getTime() - new Date(left.finishedAt).getTime())
      .slice(0, 5);
  }, [selectedExercise, workoutSessions]);

  const exercisePrs = useMemo(() => {
    if (!selectedExercise) {
      return [];
    }

    const matchingSets = workoutSessions.flatMap((session) =>
      session.sets
        .filter((set) => set.exerciseId === selectedExercise.id)
        .map((set) => ({
          finishedAt: session.finishedAt,
          workoutDate: formatDate(session.finishedAt),
          reps: set.reps,
          weight: set.weight,
          volume: set.weight * set.reps,
          estimated1rm: set.weight * (1 + set.reps / 30),
        })),
    );

    if (matchingSets.length === 0) {
      return [];
    }

    const maxWeightSet = matchingSets.reduce((best, current) => (current.weight > best.weight ? current : best));
    const bestVolumeSet = matchingSets.reduce((best, current) => (current.volume > best.volume ? current : best));
    const estimated1rmSet = matchingSets.reduce((best, current) => (current.estimated1rm > best.estimated1rm ? current : best));

    return [
      {
        id: 'max-weight',
        label: 'Max weight set',
        value: `${maxWeightSet.weight} kg x ${maxWeightSet.reps}`,
        date: maxWeightSet.workoutDate,
      },
      {
        id: 'best-volume',
        label: 'Best volume set',
        value: `${bestVolumeSet.volume.toLocaleString()} kg volume`,
        date: bestVolumeSet.workoutDate,
      },
      {
        id: 'estimated-1rm',
        label: 'Estimated 1RM',
        value: `${estimated1rmSet.estimated1rm.toFixed(1)} kg`,
        date: estimated1rmSet.workoutDate,
      },
    ];
  }, [selectedExercise, workoutSessions]);

  if (!workout) {
    return (
      <View style={styles.screen}>
        <View style={styles.emptyScreen}>
          <Text style={styles.emptyTitle}>No workout selected</Text>
          <Text style={styles.emptyDescription}>Create a template first, then start a session from the workouts tab.</Text>
          <AppButton label="Go back" onPress={() => router.replace('/')} />
        </View>
      </View>
    );
  }

  const handleSaveSet = () => {
    if (!selectedExercise) {
      return;
    }

    const parsedWeight = Number(weight);
    const parsedReps = Number(reps);

    if (!Number.isFinite(parsedWeight) || !Number.isFinite(parsedReps) || parsedWeight < 0 || parsedReps <= 0) {
      return;
    }

    const nextSet: WorkoutSet = {
      id: editingSetId ?? `${Date.now()}-${sets.length + 1}`,
      exerciseId: selectedExercise.id,
      exerciseName: selectedExercise.name,
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
          <SectionHeader title="Workout Session" subtitle={workout.title} />

          <View style={styles.metricsRow}>
            <MetricCard label="Workout" value={workout.title} detail={estimatedDuration} />
            <MetricCard label="Sets" value={`${sets.length}`} detail="logged now" />
          </View>

          <AppCard>
            <View style={styles.progressHeader}>
              <View style={styles.progressCopy}>
                <Text selectable style={styles.sectionTitle}>
                  Current exercise
                </Text>
                <Text selectable style={styles.currentExerciseName}>
                  {selectedExercise?.name ?? 'No exercise selected'}
                </Text>
                <Text selectable style={styles.progressMeta}>
                  {progressLabel}
                  {nextExercise ? ` · Next: ${nextExercise.name}` : ''}
                </Text>
              </View>
              <View style={styles.currentBadge}>
                <Text style={styles.currentBadgeLabel}>Now</Text>
              </View>
            </View>

            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${workoutExercises.length > 0 ? ((selectedExerciseIndex + 1) / workoutExercises.length) * 100 : 0}%` }]} />
            </View>
          </AppCard>

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
                    onPress={() => setSelectedExerciseId(exercise.id)}
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

          <AppCard>
            <Text selectable style={styles.sectionTitle}>
              Selected exercise
            </Text>
            <Text selectable style={styles.selectedExerciseName}>
              {selectedExercise?.name ?? 'No exercise selected'}
            </Text>

            <View style={styles.infoGrid}>
              <View style={styles.infoPill}>
                <Text style={styles.infoLabel}>Targets</Text>
                <Text style={styles.infoValue}>{selectedExercise ? `${selectedExercise.targetSets ?? 3} x ${selectedExercise.targetReps ?? 8}` : '—'}</Text>
              </View>
              <View style={styles.infoPill}>
                <Text style={styles.infoLabel}>Rest</Text>
                <Text style={styles.infoValue}>{selectedExercise ? `${selectedExercise.restSeconds ?? 90}s` : '—'}</Text>
              </View>
            </View>

            <View style={styles.historyBlock}>
              <Text selectable style={styles.historyTitle}>
                Previous sets
              </Text>
              {previousSets.length === 0 ? (
                <Text selectable style={styles.emptyHistory}>
                  No previous sets yet.
                </Text>
              ) : (
                previousSets.map((set) => (
                  <View key={set.id} style={styles.historyRow}>
                    <Text selectable style={styles.historyDate}>
                      {set.workoutDate}
                    </Text>
                    <Text selectable style={styles.historyMeta}>
                      {set.weight} kg x {set.reps}
                    </Text>
                  </View>
                ))
              )}
            </View>

            <View style={styles.historyBlock}>
              <Text selectable style={styles.historyTitle}>
                Exercise PRs
              </Text>
              {exercisePrs.length === 0 ? (
                <Text selectable style={styles.emptyHistory}>
                  No PRs yet.
                </Text>
              ) : (
                exercisePrs.map((pr) => (
                  <View key={pr.id} style={styles.prRow}>
                    <View style={styles.prContent}>
                      <Text selectable style={styles.prLabel}>
                        {pr.label}
                      </Text>
                      <Text selectable style={styles.prValue}>
                        {pr.value}
                      </Text>
                    </View>
                    <Text selectable style={styles.historyDate}>
                      {pr.date}
                    </Text>
                  </View>
                ))
              )}
            </View>

            <View style={styles.inputsRow}>
              <View style={styles.inputGroup}>
                <Text selectable style={styles.inputLabel}>
                  Weight
                </Text>
                <TextInput
                  keyboardType="decimal-pad"
                  onChangeText={setWeight}
                  placeholder="0"
                  placeholderTextColor={Colors.dark.textSecondary}
                  style={styles.input}
                  value={weight}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text selectable style={styles.inputLabel}>
                  Reps
                </Text>
                <TextInput
                  keyboardType="number-pad"
                  onChangeText={setReps}
                  placeholder="0"
                  placeholderTextColor={Colors.dark.textSecondary}
                  style={styles.input}
                  value={reps}
                />
              </View>
            </View>

            <AppButton label={editingSetId ? 'Save set' : 'Add set'} onPress={handleSaveSet} />
            {editingSetId ? <AppButton label="Cancel edit" onPress={() => setEditingSetId(undefined)} variant="secondary" /> : null}
          </AppCard>

          <AppCard>
            <Text selectable style={styles.sectionTitle}>
              Added sets
            </Text>
            {sets.length === 0 ? (
              <Text selectable style={styles.emptyText}>
                No sets added yet.
              </Text>
            ) : (
              <View style={styles.setList}>
                {sets.map((set, index) => (
                  <AppCard key={set.id}>
                    <View style={styles.setCard}>
                      <View style={styles.setCardCopy}>
                        <Text selectable style={styles.setName}>
                          Set {index + 1} · {set.exerciseName}
                        </Text>
                        <Text selectable style={styles.setMeta}>
                          {set.weight} kg x {set.reps}
                        </Text>
                      </View>
                      <View style={styles.setActions}>
                        <AppButton label="Edit" onPress={() => handleEditSet(set)} variant="secondary" />
                        <AppButton label="Delete" onPress={() => handleDeleteSet(set.id)} variant="secondary" />
                      </View>
                    </View>
                  </AppCard>
                ))}
              </View>
            )}
          </AppCard>
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
  currentBadge: {
    alignItems: 'center',
    backgroundColor: Colors.dark.accentMuted,
    borderColor: Colors.dark.accent,
    borderCurve: 'continuous',
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minWidth: 72,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  currentBadgeLabel: {
    color: Colors.dark.accent,
    fontSize: 12,
    fontWeight: '800',
  },
  currentExerciseName: {
    color: Colors.dark.text,
    fontSize: 24,
    fontWeight: '900',
  },
  emptyDescription: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  emptyHistory: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
  },
  emptyScreen: {
    alignItems: 'center',
    flex: 1,
    gap: Spacing.two,
    justifyContent: 'center',
    padding: Spacing.four,
  },
  emptyText: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
  },
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
  historyBlock: {
    gap: Spacing.one,
  },
  historyDate: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
  },
  historyMeta: {
    color: Colors.dark.text,
    fontSize: 14,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
  },
  historyRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  historyTitle: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  infoLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  infoPill: {
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
  infoValue: {
    color: Colors.dark.text,
    fontSize: 15,
    fontWeight: '800',
  },
  input: {
    backgroundColor: Colors.dark.background,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 8,
    borderWidth: 1,
    color: Colors.dark.text,
    fontSize: 18,
    fontVariant: ['tabular-nums'],
    minHeight: 48,
    paddingHorizontal: Spacing.two,
  },
  inputGroup: {
    flex: 1,
    gap: Spacing.one,
    minWidth: 120,
  },
  inputLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  inputsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  pressed: {
    opacity: 0.82,
  },
  prContent: {
    flex: 1,
    gap: Spacing.one,
  },
  prLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  prRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  prValue: {
    color: Colors.dark.text,
    fontSize: 15,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
  },
  progressBarFill: {
    backgroundColor: Colors.dark.accent,
    borderCurve: 'continuous',
    borderRadius: 999,
    height: 8,
  },
  progressBarTrack: {
    backgroundColor: Colors.dark.backgroundSelected,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 999,
    borderWidth: 1,
    height: 10,
    overflow: 'hidden',
  },
  progressCopy: {
    flex: 1,
    gap: Spacing.one,
  },
  progressHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  progressMeta: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  screen: {
    backgroundColor: Colors.dark.background,
    flex: 1,
  },
  scrollView: {
    backgroundColor: Colors.dark.background,
    flex: 1,
  },
  sectionTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '800',
  },
  selectedExerciseName: {
    color: Colors.dark.accent,
    fontSize: 20,
    fontWeight: '900',
  },
  setActions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  setCard: {
    gap: Spacing.two,
  },
  setCardCopy: {
    gap: 2,
  },
  setList: {
    gap: Spacing.two,
  },
  setMeta: {
    color: Colors.dark.text,
    fontSize: 15,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
  },
  setName: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  emptyTitle: {
    color: Colors.dark.text,
    fontSize: 20,
    fontWeight: '900',
  },
});
