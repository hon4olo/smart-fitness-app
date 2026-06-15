import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { MetricCard } from '@/components/ui/MetricCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAppContext, WorkoutSet } from '@/context/AppContext';

export default function WorkoutSessionScreen() {
  const { workouts, workoutSessions, saveWorkoutSession } = useAppContext();
  const { workoutId } = useLocalSearchParams();
  const safeAreaInsets = useSafeAreaInsets();
  const requestedWorkoutId = Array.isArray(workoutId) ? workoutId[0] : workoutId;
  const workout = workouts.find((candidate) => candidate.id === requestedWorkoutId) ?? workouts[0];
  const [selectedExerciseId, setSelectedExerciseId] = useState(workout.exercises[0]?.id ?? '');
  const [weight, setWeight] = useState('60');
  const [reps, setReps] = useState('8');
  const [sets, setSets] = useState<WorkoutSet[]>([]);
  const [editingSetId, setEditingSetId] = useState<string | undefined>();
  const startedAt = useMemo(() => new Date().toISOString(), []);

  const selectedExercise =
    workout.exercises.find((exercise) => exercise.id === selectedExerciseId) ?? workout.exercises[0];
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
            workoutDate: new Intl.DateTimeFormat(undefined, {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            }).format(new Date(session.finishedAt)),
            reps: set.reps,
            weight: set.weight,
          }));
      })
      .sort((a, b) => new Date(b.finishedAt).getTime() - new Date(a.finishedAt).getTime())
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
          workoutDate: new Intl.DateTimeFormat(undefined, {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }).format(new Date(session.finishedAt)),
          reps: set.reps,
          weight: set.weight,
          volume: set.weight * set.reps,
          estimated1rm: set.weight * (1 + set.reps / 30),
        }))
    );

    if (matchingSets.length === 0) {
      return [];
    }

    const maxWeightSet = matchingSets.reduce((best, current) =>
      current.weight > best.weight ? current : best
    );
    const bestVolumeSet = matchingSets.reduce((best, current) =>
      current.volume > best.volume ? current : best
    );
    const estimated1rmSet = matchingSets.reduce((best, current) =>
      current.estimated1rm > best.estimated1rm ? current : best
    );

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

  const resetSetForm = () => {
    setEditingSetId(undefined);
    setSelectedExerciseId(workout.exercises[0]?.id ?? '');
    setWeight('60');
    setReps('8');
  };

  const handleSaveSet = () => {
    const parsedWeight = Number(weight);
    const parsedReps = Number(reps);

    if (
      !selectedExercise ||
      !selectedExerciseId ||
      !Number.isFinite(parsedWeight) ||
      !Number.isFinite(parsedReps)
    ) {
      return;
    }

    if (parsedWeight < 0 || parsedReps <= 0) {
      return;
    }

    const nextSet = {
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

    resetSetForm();
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
      resetSetForm();
    }
  };

  const handleFinishWorkout = () => {
    if (sets.length === 0) {
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

    Alert.alert(
      'Cancel workout?',
      'Your added sets will not be saved.',
      [
        { text: 'Keep Training', style: 'cancel' },
        {
          text: 'Cancel Workout',
          style: 'destructive',
          onPress: () => router.replace('/'),
        },
      ],
    );
  };

  const footerHeight = 72 + safeAreaInsets.bottom;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: footerHeight + Spacing.three }]}>
        <View style={styles.container}>
          <SectionHeader title="Workout Session" subtitle={workout.title} />

          <View style={styles.grid}>
            <MetricCard label="Workout" value={workout.title} detail={workout.duration} />
            <MetricCard label="Sets" value={`${sets.length}`} detail="added now" />
          </View>

          <AppCard>
            <Text selectable style={styles.sectionTitle}>
              Exercises
            </Text>
            <View style={styles.exerciseList}>
              {workout.exercises.map((exercise) => {
                const isSelected = exercise.id === selectedExerciseId;

                return (
                  <Pressable
                    accessibilityRole="button"
                    key={exercise.id}
                    onPress={() => setSelectedExerciseId(exercise.id)}
                    style={({ pressed }) => [
                      styles.exerciseButton,
                      isSelected && styles.exerciseButtonSelected,
                      pressed && styles.pressed,
                    ]}>
                    <Text
                      selectable
                      style={[styles.exerciseText, isSelected && styles.exerciseTextSelected]}>
                      {exercise.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </AppCard>

          <AppCard>
            <Text selectable style={styles.sectionTitle}>
              Selected exercise
            </Text>
            <Text selectable style={styles.selectedExercise}>
              {selectedExercise?.name ?? 'No exercise selected'}
            </Text>

            <View style={styles.historyBlock}>
              <Text selectable style={styles.historyTitle}>
                Previous sets
              </Text>
              {previousSets.length === 0 ? (
                <Text selectable style={styles.emptyHistory}>
                  No previous sets yet
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
                  No PRs yet
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

            <AppButton label={editingSetId ? 'Save Set' : 'Add Set'} onPress={handleSaveSet} />
            {editingSetId ? (
              <AppButton label="Cancel Edit" onPress={resetSetForm} variant="secondary" />
            ) : null}
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
              sets.map((set, index) => (
                <View key={set.id} style={styles.setRow}>
                  <View style={styles.setContent}>
                    <Text selectable style={styles.setName}>
                      {index + 1}. {set.exerciseName}
                    </Text>
                    <Text selectable style={styles.setMeta}>
                      {set.weight} kg x {set.reps}
                    </Text>
                  </View>
                  <View style={styles.setActions}>
                    <AppButton label="Edit" onPress={() => handleEditSet(set)} variant="secondary" />
                    <AppButton
                      label="Delete"
                      onPress={() => handleDeleteSet(set.id)}
                      variant="secondary"
                    />
                  </View>
                </View>
              ))
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
            <AppButton label="Cancel Workout" onPress={handleCancelWorkout} variant="secondary" />
          </View>
          <View style={styles.finishButtonSlot}>
            <AppButton
              disabled={sets.length === 0}
              label="Finish Workout"
              onPress={handleFinishWorkout}
            />
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
  emptyText: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
  },
  emptyHistory: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
  },
  exerciseButton: {
    backgroundColor: Colors.dark.backgroundSelected,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  exerciseButtonSelected: {
    backgroundColor: Colors.dark.accentMuted,
    borderColor: Colors.dark.accent,
  },
  exerciseList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  exerciseText: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  exerciseTextSelected: {
    color: Colors.dark.text,
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
    fontWeight: '700',
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
  finishButtonSlot: {
    flex: 1.7,
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
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
  pressed: {
    opacity: 0.78,
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
  selectedExercise: {
    color: Colors.dark.accent,
    fontSize: 20,
    fontWeight: '800',
  },
  setMeta: {
    color: Colors.dark.text,
    fontSize: 15,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
  },
  setActions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  setContent: {
    flex: 1,
    gap: Spacing.one,
  },
  setName: {
    color: Colors.dark.textSecondary,
    flex: 1,
    fontSize: 15,
  },
  setRow: {
    alignItems: 'center',
    borderColor: Colors.dark.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
    paddingTop: Spacing.two,
  },
});
