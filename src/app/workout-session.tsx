import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, MaxContentWidth, Radii, Spacing, Typography } from '@/constants/theme';
import { useAppContext, type WorkoutSet } from '@/context/AppContext';
import {
  clearActiveWorkoutSessionDraft,
  formatWorkoutSessionElapsedLabel,
  getActiveWorkoutSessionDraft,
  hydrateActiveWorkoutSessionDraft,
  setActiveWorkoutSessionDraft,
  startWorkoutSessionDraft,
  type WorkoutSessionDraft,
} from '@/lib/workouts';
import { getWorkoutSessionPreviousSets, resolveWorkoutSessionExercises } from '@/lib/workouts/workout-session';
import { useAppTheme } from '@/theme/AppThemeProvider';

type DraftInputs = Record<string, { reps: string; weight: string }>;

type DraftSet = WorkoutSet;

const createEmptyWorkout = () => ({
  createdAt: new Date().toISOString(),
  description: 'Start from scratch and add exercises later.',
  duration: 'Open-ended',
  exercises: [],
  id: 'empty-workout',
  isCustom: true,
  title: 'Empty Workout',
});

const syncDraftInputs = (current: DraftInputs, sets: DraftSet[]) => {
  const next: DraftInputs = { ...current };
  const ids = new Set(sets.map((set) => set.id));

  for (const id of Object.keys(next)) {
    if (!ids.has(id)) {
      delete next[id];
    }
  }

  for (const set of sets) {
    if (!next[set.id]) {
      next[set.id] = { reps: `${set.reps}`, weight: `${set.weight}` };
    }
  }

  return next;
};

const parseDraftValue = (value: { reps: string; weight: string }) => {
  const weight = Number.parseFloat(value.weight);
  const reps = Number.parseInt(value.reps, 10);

  if (!Number.isFinite(weight) || !Number.isFinite(reps) || weight < 0 || reps <= 0) {
    return null;
  }

  return { reps, weight };
};

const isSetCompleted = (set: DraftSet) => set.completed !== false;

export default function WorkoutSessionScreen() {
  const { workouts, workoutSessions, saveWorkoutSession, isRestoringState } = useAppContext();
  const { workoutId } = useLocalSearchParams<{ workoutId?: string }>();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const resolvedWorkoutId = Array.isArray(workoutId) ? workoutId[0] : workoutId;
  const [bootstrappedDraft, setBootstrappedDraft] = useState<
    WorkoutSessionDraft | null | undefined
  >(undefined);
  const [startedAt, setStartedAt] = useState('');
  const [sets, setSets] = useState<DraftSet[]>([]);
  const [draftInputs, setDraftInputs] = useState<DraftInputs>({});
  const [now, setNow] = useState(Date.now());
  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    let cancelled = false;

    void hydrateActiveWorkoutSessionDraft().then((draft) => {
      if (!cancelled) {
        setBootstrappedDraft(draft ?? getActiveWorkoutSessionDraft());
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const workout = useMemo(() => {
    const workoutIdToUse = bootstrappedDraft?.workoutId ?? resolvedWorkoutId;

    if (workoutIdToUse === 'empty-workout') {
      return createEmptyWorkout();
    }

    if (!workoutIdToUse) {
      return null;
    }

    return workouts.find((candidate) => candidate.id === workoutIdToUse) ?? null;
  }, [bootstrappedDraft?.workoutId, resolvedWorkoutId, workouts]);

  const workoutExercises = useMemo(() => resolveWorkoutSessionExercises(workout ?? undefined), [workout]);
  const completedSets = useMemo(() => sets.filter(isSetCompleted), [sets]);
  const completedExerciseIds = useMemo(() => new Set(completedSets.map((set) => set.exerciseId)), [completedSets]);
  const completedExerciseCount = useMemo(
    () => workoutExercises.filter((exercise) => completedExerciseIds.has(exercise.id)).length,
    [completedExerciseIds, workoutExercises],
  );

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (bootstrappedDraft === undefined || !workout) {
      return;
    }

    if (bootstrappedDraft && bootstrappedDraft.workoutId === workout.id) {
      setStartedAt(bootstrappedDraft.startedAt);
      setSets(bootstrappedDraft.sets.map((set) => ({ ...set })));
      setDraftInputs((current) => syncDraftInputs(current, bootstrappedDraft.sets));
      return;
    }

    const createdDraft = startWorkoutSessionDraft(workout);
    setBootstrappedDraft(createdDraft);
    setStartedAt(createdDraft.startedAt);
    setSets(createdDraft.sets.map((set) => ({ ...set })));
    setDraftInputs({});
  }, [bootstrappedDraft, workout]);

  useEffect(() => {
    setDraftInputs((current) => syncDraftInputs(current, sets));
  }, [sets]);

  useEffect(() => {
    if (bootstrappedDraft === undefined || !workout) {
      return;
    }

    setActiveWorkoutSessionDraft({
      id: bootstrappedDraft?.id ?? `${Date.now()}`,
      workoutId: workout.id,
      workoutTitle: workout.title,
      startedAt,
      sets,
    });
  }, [bootstrappedDraft, sets, startedAt, workout]);

  useEffect(() => {
    if (bootstrappedDraft === undefined) {
      return;
    }

    const timeout = setTimeout(() => {
      setSets((current) => {
        let changed = false;

        const next = current.map((set) => {
          const parsed = parseDraftValue(draftInputs[set.id] ?? { reps: `${set.reps}`, weight: `${set.weight}` });
          if (!parsed) {
            return set;
          }

          if (parsed.weight === set.weight && parsed.reps === set.reps) {
            return set;
          }

          changed = true;
          return {
            ...set,
            reps: parsed.reps,
            weight: parsed.weight,
          };
        });

        return changed ? next : current;
      });
    }, 250);

    return () => clearTimeout(timeout);
  }, [bootstrappedDraft, draftInputs]);

  const commitRowInputs = (setId: string) => {
    setSets((current) =>
      current.map((set) => {
        if (set.id !== setId) {
          return set;
        }

        const parsed = parseDraftValue(draftInputs[setId] ?? { reps: `${set.reps}`, weight: `${set.weight}` });
        if (!parsed) {
          return set;
        }

        return {
          ...set,
          reps: parsed.reps,
          weight: parsed.weight,
        };
      }),
    );
  };

  if (bootstrappedDraft === undefined || isRestoringState) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={styles.loadingState}>
          <ActivityIndicator color={colors.accent} />
          <Text selectable style={styles.loadingLabel}>
            Loading workout…
          </Text>
        </View>
      </View>
    );
  }

  if (!workout) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={styles.emptyState}>
          <Text selectable style={styles.emptyTitle}>
            No workout selected
          </Text>
          <Text selectable style={styles.emptyMessage}>
            Open a workout from the Workouts tab to continue.
          </Text>
          <Pressable accessibilityRole="button" onPress={() => router.replace('/workouts')} style={({ pressed }) => [styles.textAction, pressed && styles.textActionPressed]}>
            <Text style={styles.textActionLabel}>Back to Workouts</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const requestFinish = () => {
    router.push('/workout-session-finish');
  };

  const discardWorkout = () => {
    Alert.alert('Discard workout?', 'Your logged sets will not be saved.', [
      { text: 'Keep training', style: 'cancel' },
      {
        text: 'Discard workout',
        style: 'destructive',
        onPress: () => {
          clearActiveWorkoutSessionDraft();
          router.replace('/workouts');
        },
      },
    ]);
  };

  const addSet = (exerciseId: string) => {
    const exercise = workoutExercises.find((item) => item.id === exerciseId);
    if (!exercise) {
      return;
    }

    const previousSet = [...sets].filter((set) => set.exerciseId === exerciseId).at(-1);
    const nextSet: DraftSet = {
      id: `${Date.now()}-${sets.length + 1}`,
      exerciseId,
      exerciseName: exercise.name,
      weight: previousSet?.weight ?? 60,
      reps: previousSet?.reps ?? exercise.targetReps ?? 8,
      completed: false,
    };

    setSets((current) => [...current, nextSet]);
    setDraftInputs((current) => ({
      ...current,
      [nextSet.id]: { reps: `${nextSet.reps}`, weight: `${nextSet.weight}` },
    }));
  };

  const deleteSet = (setId: string) => {
    setSets((current) => current.filter((set) => set.id !== setId));
    setDraftInputs((current) => {
      const next = { ...current };
      delete next[setId];
      return next;
    });
  };

  const clearExerciseSets = (exerciseId: string) => {
    setSets((current) => {
      const next = current.filter((set) => set.exerciseId !== exerciseId);
      setDraftInputs((draftCurrent) => {
        const nextInputs = { ...draftCurrent };
        for (const id of Object.keys(nextInputs)) {
          if (!next.some((set) => set.id === id)) {
            delete nextInputs[id];
          }
        }
        return nextInputs;
      });
      return next;
    });
  };

  const toggleSetCompletion = (setId: string) => {
    commitRowInputs(setId);
    setSets((current) => current.map((set) => (set.id === setId ? { ...set, completed: !isSetCompleted(set) } : set)));
  };

  const showExerciseActions = (exerciseId: string, exerciseName: string) => {
    Alert.alert(exerciseName, undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear sets', style: 'destructive', onPress: () => clearExerciseSets(exerciseId) },
    ]);
  };

  const showSetActions = (setId: string, exerciseName: string) => {
    Alert.alert(exerciseName, undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete set', style: 'destructive', onPress: () => deleteSet(setId) },
    ]);
  };

  const sectionRows = workoutExercises.map((exercise) => {
    const exerciseSets = sets.filter((set) => set.exerciseId === exercise.id);
    const previous = getWorkoutSessionPreviousSets(exercise, workoutSessions)[0];
    const exerciseCompleted = exerciseSets.some(isSetCompleted);

    return {
      exercise,
      exerciseCompleted,
      exerciseSets,
      previous,
    };
  });

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.fill}>
        <View style={[styles.topBar, { borderBottomColor: colors.borderSubtle, backgroundColor: colors.background, paddingTop: insets.top + Spacing.two }]}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.topBarButton, pressed && styles.topBarButtonPressed]}>
            <Text style={styles.topBarButtonLabel}>‹</Text>
          </Pressable>
          <Text selectable style={styles.timer}>
            {formatWorkoutSessionElapsedLabel(startedAt, now)}
          </Text>
          <View style={styles.topBarActions}>
            <Pressable
              accessibilityRole="button"
              hitSlop={12}
              onPress={discardWorkout}
              style={({ pressed }) => [styles.topBarButton, pressed && styles.topBarButtonPressed]}>
              <Text style={styles.topBarButtonLabel}>⋯</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={requestFinish} style={({ pressed }) => [styles.finishButton, pressed && styles.finishButtonPressed]}>
              <Text style={styles.finishButtonLabel}>Finish</Text>
            </Pressable>
          </View>
        </View>

        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.five + 112 }]}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}>
          <View style={styles.container}>
            {sectionRows.length > 0 ? (
              <View style={styles.sectionList}>
                {sectionRows.map(({ exercise, exerciseCompleted, exerciseSets, previous }, index) => (
                  <View key={exercise.id} style={[styles.section, index > 0 && styles.sectionDivider]}>
                    <View style={styles.sectionHeader}>
                      <View style={styles.exerciseHeaderCopy}>
                        <View style={styles.exerciseTitleLine}>
                          <View style={styles.exerciseIcon}>
                            <Text style={styles.exerciseIconLabel}>{exercise.name.slice(0, 1).toUpperCase()}</Text>
                          </View>
                          <Text selectable style={[styles.exerciseTitle, exerciseCompleted && styles.exerciseTitleCompleted]}>
                            {exercise.name}
                          </Text>
                        </View>
                        {exercise.notes ? (
                          <Pressable accessibilityRole="button" onPress={() => Alert.alert(exercise.name, exercise.notes ?? '', [{ text: 'Close', style: 'cancel' }])} style={({ pressed }) => [styles.notesAction, pressed && styles.textActionPressed]}>
                            <Text style={styles.notesActionLabel}>Notes</Text>
                          </Pressable>
                        ) : null}
                        <Text selectable style={styles.exerciseMeta}>
                          Rest · {exercise.restSeconds ?? 90}s
                        </Text>
                        <Text selectable style={styles.exerciseState}>
                          {exerciseCompleted ? 'Complete' : `${exerciseSets.length} set${exerciseSets.length === 1 ? '' : 's'}`}
                        </Text>
                      </View>
                      <Pressable
                        accessibilityRole="button"
                        hitSlop={12}
                        onPress={() => showExerciseActions(exercise.id, exercise.name)}
                        style={({ pressed }) => [styles.rowMenuButton, pressed && styles.rowMenuButtonPressed]}>
                        <Text style={styles.rowMenuLabel}>⋯</Text>
                      </Pressable>
                    </View>

                    <View style={styles.tableHeader}>
                      <Text style={[styles.tableHeaderText, styles.colSet]}>Set</Text>
                      <Text style={[styles.tableHeaderText, styles.colPrevious]}>Previous</Text>
                      <Text style={[styles.tableHeaderText, styles.colWeight]}>kg</Text>
                      <Text style={[styles.tableHeaderText, styles.colReps]}>Reps</Text>
                      <Text style={[styles.tableHeaderText, styles.colCheck]}>✓</Text>
                    </View>

                    <View style={styles.tableBody}>
                      {exerciseSets.length > 0 ? (
                        exerciseSets.map((set, setIndex) => {
                          const completed = isSetCompleted(set);
                          const previousLabel = previous ? `${previous.weight} × ${previous.reps}` : '—';
                          const draftValue = draftInputs[set.id] ?? { reps: `${set.reps}`, weight: `${set.weight}` };

                          return (
                            <Pressable
                              key={set.id}
                              accessibilityRole="button"
                              delayLongPress={300}
                              onLongPress={() => showSetActions(set.id, exercise.name)}
                              style={({ pressed }) => [styles.tableRow, completed && styles.tableRowCompleted, pressed && styles.tableRowPressed]}>
                              <Text selectable style={[styles.cell, styles.colSet]}>
                                {setIndex + 1}
                              </Text>
                              <Text selectable numberOfLines={1} style={[styles.cell, styles.previousCell, styles.colPrevious]}>
                                {previousLabel}
                              </Text>
                              <TextInput
                                autoCapitalize="none"
                                autoCorrect={false}
                                blurOnSubmit
                                defaultValue={draftValue.weight}
                                keyboardType="decimal-pad"
                                placeholder="—"
                                placeholderTextColor={colors.textSecondary}
                                selectionColor={colors.accent}
                                style={[styles.inputCell, styles.colWeight]}
                                onChangeText={(value) =>
                                  setDraftInputs((current) => ({
                                    ...current,
                                    [set.id]: { ...(current[set.id] ?? draftValue), weight: value },
                                  }))
                                }
                                onEndEditing={() => commitRowInputs(set.id)}
                                onSubmitEditing={() => commitRowInputs(set.id)}
                              />
                              <TextInput
                                autoCapitalize="none"
                                autoCorrect={false}
                                blurOnSubmit
                                defaultValue={draftValue.reps}
                                keyboardType="number-pad"
                                placeholder="—"
                                placeholderTextColor={colors.textSecondary}
                                selectionColor={colors.accent}
                                style={[styles.inputCell, styles.colReps]}
                                onChangeText={(value) =>
                                  setDraftInputs((current) => ({
                                    ...current,
                                    [set.id]: { ...(current[set.id] ?? draftValue), reps: value },
                                  }))
                                }
                                onEndEditing={() => commitRowInputs(set.id)}
                                onSubmitEditing={() => commitRowInputs(set.id)}
                              />
                              <Pressable accessibilityRole="button" onPress={() => toggleSetCompletion(set.id)} style={({ pressed }) => [styles.checkButton, pressed && styles.checkButtonPressed]}>
                                <Text style={[styles.checkLabel, completed && styles.checkLabelCompleted]}>{completed ? '✓' : '○'}</Text>
                              </Pressable>
                            </Pressable>
                          );
                        })
                      ) : (
                        <Text selectable style={styles.emptySets}>
                          No sets logged yet.
                        </Text>
                      )}
                    </View>

                    <Pressable accessibilityRole="button" onPress={() => addSet(exercise.id)} style={({ pressed }) => [styles.addSetRow, pressed && styles.textActionPressed]}>
                      <Text style={styles.addSetLabel}>+ Add set</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyWorkoutState}>
                <Text selectable style={styles.emptyWorkoutTitle}>
                  This workout has no exercises yet.
                </Text>
                <Text selectable style={styles.emptyWorkoutMessage}>
                  Add exercises in Workout Details to start logging sets.
                </Text>
                <Pressable accessibilityRole="button" onPress={() => router.replace('/workouts')} style={({ pressed }) => [styles.textAction, pressed && styles.textActionPressed]}>
                  <Text style={styles.textActionLabel}>Back to Workouts</Text>
                </Pressable>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    addSetLabel: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: '800',
    },
    addSetRow: {
      alignItems: 'flex-start',
      minHeight: 48,
      paddingVertical: Spacing.one,
    },
    cell: {
      color: colors.textPrimary,
      fontSize: 16,
      lineHeight: 23,
    },
    checkButton: {
      alignItems: 'center',
      height: 36,
      justifyContent: 'center',
      width: 36,
    },
    checkButtonPressed: {
      opacity: 0.72,
    },
    checkLabel: {
      color: colors.textSecondary,
      fontSize: 20,
      fontWeight: '900',
      lineHeight: 20,
    },
    checkLabelCompleted: {
      color: '#27C46A',
    },
    colCheck: {
      width: 44,
    },
    colPrevious: {
      width: 112,
    },
    colReps: {
      width: 64,
    },
    colSet: {
      width: 40,
    },
    colWeight: {
      flex: 1,
      minWidth: 82,
    },
    container: {
      maxWidth: MaxContentWidth,
      width: '100%',
    },
    content: {
      alignItems: 'center',
      paddingHorizontal: Spacing.three,
      paddingTop: Spacing.two,
    },
    emptyMessage: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 19,
    },
    loadingState: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
      gap: Spacing.two,
      padding: Spacing.three,
    },
    loadingLabel: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '700',
    },
    emptySets: {
      color: colors.textSecondary,
      fontSize: 13,
      paddingVertical: Spacing.two,
    },
    emptyState: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
      padding: Spacing.three,
    },
    emptyTitle: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: '900',
      marginBottom: 4,
    },
    emptyWorkoutMessage: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 19,
    },
    emptyWorkoutState: {
      gap: Spacing.one,
      paddingVertical: Spacing.four,
    },
    emptyWorkoutTitle: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: '900',
    },
    exerciseHeaderCopy: {
      flex: 1,
      gap: 4,
    },
    exerciseIcon: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderCurve: 'continuous',
      borderRadius: 12,
      height: 34,
      justifyContent: 'center',
      width: 34,
    },
    exerciseIconLabel: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: '900',
    },
    exerciseMeta: {
      color: colors.textSecondary,
      fontSize: 12,
      fontVariant: ['tabular-nums'],
    },
    exerciseNotes: {
      color: colors.textSecondary,
      fontSize: 12,
      lineHeight: 18,
    },
    exerciseRest: {
      color: colors.textSecondary,
      fontSize: 12,
      lineHeight: 18,
    },
    exerciseState: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '700',
      lineHeight: 18,
    },
    exerciseTitle: {
      color: colors.textPrimary,
      flexShrink: 1,
      fontSize: 16,
      fontWeight: '900',
      lineHeight: 21,
    },
    exerciseTitleCompleted: {
      color: '#27C46A',
    },
    exerciseTitleLine: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.two,
    },
    fill: {
      flex: 1,
    },
    finishButton: {
      alignItems: 'center',
      backgroundColor: colors.accent,
      borderCurve: 'continuous',
      borderRadius: 999,
      justifyContent: 'center',
      minHeight: 38,
      paddingHorizontal: Spacing.three,
    },
    finishButtonLabel: {
      color: colors.textOnAccent,
      fontSize: 13,
      fontWeight: '900',
    },
    finishButtonPressed: {
      opacity: 0.85,
    },
    inputCell: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '700',
      minHeight: 34,
      paddingHorizontal: 0,
      paddingVertical: 4,
      textAlign: 'center',
      fontVariant: ['tabular-nums'],
    },
    notesAction: {
      alignSelf: 'flex-start',
      paddingVertical: 2,
    },
    notesActionLabel: {
      color: colors.accent,
      fontSize: 12,
      fontWeight: '800',
    },
    previousCell: {
      color: colors.textSecondary,
      fontSize: 13,
      fontVariant: ['tabular-nums'],
      lineHeight: 18,
    },
    rowMenuButton: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 32,
      minWidth: 32,
    },
    rowMenuButtonPressed: {
      opacity: 0.65,
    },
    rowMenuLabel: {
      color: colors.textSecondary,
      fontSize: 22,
      fontWeight: '700',
      lineHeight: 22,
    },
    screen: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    section: {
      gap: Spacing.two,
      paddingVertical: Spacing.three,
    },
    sectionDivider: {
      borderTopColor: colors.borderSubtle,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    sectionHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    sectionList: {
      gap: 0,
    },
    tableBody: {
      gap: Spacing.one,
    },
    tableHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.one,
    },
    tableHeaderText: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '800',
      letterSpacing: 0.3,
      lineHeight: 15,
      textTransform: 'uppercase',
    },
    tableRow: {
      alignItems: 'center',
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      gap: Spacing.one,
      minHeight: 52,
      paddingHorizontal: Spacing.two,
      paddingVertical: 10,
    },
    tableRowCompleted: {
      backgroundColor: 'rgba(39, 196, 106, 0.10)',
      borderColor: 'rgba(39, 196, 106, 0.25)',
    },
    tableRowPressed: {
      opacity: 0.82,
    },
    textAction: {
      alignSelf: 'flex-start',
      paddingVertical: Spacing.one,
    },
    textActionLabel: {
      color: colors.textPrimary,
      fontSize: 13,
      fontWeight: '800',
    },
    textActionPressed: {
      opacity: 0.72,
    },
    timer: {
      color: colors.textPrimary,
      flex: 1,
      fontSize: 16,
      fontWeight: '900',
      textAlign: 'center',
    },
    topBar: {
      alignItems: 'center',
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      gap: Spacing.two,
      paddingBottom: Spacing.two,
      paddingHorizontal: Spacing.three,
    },
    topBarActions: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.two,
    },
    topBarButton: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderCurve: 'continuous',
      borderRadius: 999,
      height: 38,
      justifyContent: 'center',
      width: 38,
    },
    topBarButtonLabel: {
      color: colors.textPrimary,
      fontSize: 24,
      fontWeight: '700',
      lineHeight: 24,
      marginTop: -2,
    },
    topBarButtonPressed: {
      opacity: 0.75,
    },
  });
