import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, MaxContentWidth, Radii, Spacing } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { clearActiveWorkoutSessionDraft, getActiveWorkoutSessionDraft, hydrateActiveWorkoutSessionDraft, setActiveWorkoutSessionDraft, startWorkoutSession } from '@/lib/workouts';
import { resolveWorkoutSessionExercises } from '@/lib/workouts/workout-session';
import { formatWorkoutSessionElapsedLabel } from '@/features/workouts/sessionModel';
import { addWorkoutSessionSet, clearWorkoutSessionSetsForExercise, createWorkoutSessionDraft, getWorkoutSessionCompletedSetCount, getWorkoutSessionSetPreviousLabel, removeWorkoutSessionSet, toggleWorkoutSessionSetCompletion, updateWorkoutSessionSetField } from '@/features/workouts/sessionScreenModel';
import { resolveWorkoutSessionRouteState } from '@/features/workouts/routeResolution';
import { useAppTheme } from '@/theme/AppThemeProvider';

export default function WorkoutSessionScreen() {
  const { workouts, isRestoringState } = useAppContext();
  const { workoutId } = useLocalSearchParams<{ workoutId?: string }>();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const resolvedWorkoutId = Array.isArray(workoutId) ? workoutId[0] : workoutId;
  const [bootstrappedDraft, setBootstrappedDraft] = useState<ReturnType<typeof getActiveWorkoutSessionDraft> | undefined>(undefined);
  const [draft, setDraft] = useState<ReturnType<typeof createWorkoutSessionDraft> | null>(null);
  const [now, setNow] = useState(Date.now());
  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    let cancelled = false;

    void hydrateActiveWorkoutSessionDraft().then((activeDraft) => {
      if (!cancelled) {
        setBootstrappedDraft(activeDraft ?? getActiveWorkoutSessionDraft());
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const routeState = useMemo(
    () =>
      resolveWorkoutSessionRouteState({
        workoutId: resolvedWorkoutId,
        activeDraft: bootstrappedDraft,
        workouts,
        isRestoringState,
      }),
    [bootstrappedDraft, isRestoringState, resolvedWorkoutId, workouts],
  );

  const workout = useMemo(() => {
    if (routeState.status !== 'ready' || routeState.workoutId === 'empty-workout') {
      return null;
    }

    return workouts.find((candidate) => candidate.id === routeState.workoutId) ?? null;
  }, [routeState, workouts]);

  const workoutExercises = useMemo(() => resolveWorkoutSessionExercises(workout ?? undefined), [workout]);
  const completedSetCount = getWorkoutSessionCompletedSetCount(draft);
  const canFinish = completedSetCount > 0;

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (routeState.status !== 'ready') {
      return;
    }

    if (routeState.workoutId === 'empty-workout') {
      clearActiveWorkoutSessionDraft();
      router.replace('/workouts');
      return;
    }

    if (!workout) {
      return;
    }

    if (bootstrappedDraft && bootstrappedDraft.workoutId === workout.id) {
      setDraft(createWorkoutSessionDraft(workout, bootstrappedDraft));
      return;
    }

    if (!bootstrappedDraft) {
      const nextDraft = createWorkoutSessionDraft(workout);
      startWorkoutSession(workout, nextDraft.startedAt);
      setDraft(nextDraft);
      return;
    }

    setDraft(createWorkoutSessionDraft(workout, bootstrappedDraft));
  }, [bootstrappedDraft, routeState, workout]);

  useEffect(() => {
    if (!draft) {
      return;
    }

    setActiveWorkoutSessionDraft(draft);
  }, [draft]);

  if (bootstrappedDraft === undefined || isRestoringState || routeState.status === 'loading') {
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

  if (!workout || !draft) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={styles.loadingState}>
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

  const saveDraft = (nextDraft: typeof draft) => {
    setDraft(nextDraft);
  };

  const addSet = (exerciseId: string) => {
    const exercise = workoutExercises.find((item) => item.id === exerciseId);
    if (!exercise) {
      return;
    }

    const previousSet = [...draft.sets].filter((set) => set.exerciseId === exerciseId).at(-1);
    saveDraft(addWorkoutSessionSet(draft, exercise, previousSet));
  };

  const updateSet = (setId: string, field: 'weight' | 'reps', value: string) => {
    saveDraft(updateWorkoutSessionSetField(draft, setId, field, value));
  };

  const toggleComplete = (setId: string) => {
    saveDraft(toggleWorkoutSessionSetCompletion(draft, setId));
  };

  const deleteSet = (setId: string) => {
    saveDraft(removeWorkoutSessionSet(draft, setId));
  };

  const clearExerciseSets = (exerciseId: string) => {
    saveDraft(clearWorkoutSessionSetsForExercise(draft, exerciseId));
  };

  const requestFinish = () => {
    if (!canFinish) {
      return;
    }

    router.push('/workout-session-finish');
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.two }]}>
        <View style={styles.topBarRow}>
          <Pressable accessibilityRole="button" onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <Text style={styles.backLabel}>‹</Text>
          </Pressable>

          <View style={styles.timerPill}>
            <Text selectable style={styles.timerLabel}>
              {formatWorkoutSessionElapsedLabel(draft.startedAt, now)}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !canFinish }}
            disabled={!canFinish}
            onPress={requestFinish}
            style={({ pressed }) => [styles.finishButton, (!canFinish || pressed) && styles.finishButtonPressed]}>
            <Text style={[styles.finishLabel, !canFinish && styles.finishLabelDisabled]}>Finish</Text>
          </Pressable>
        </View>
        <Text selectable style={styles.workoutTitle}>
          {draft.workoutTitle}
        </Text>
      </View>

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 140 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}>
        <View style={styles.container}>
          {workoutExercises.map((exercise) => {
            const exerciseSets = draft.sets.filter((set) => set.exerciseId === exercise.id);
            const hasSets = exerciseSets.length > 0;
            const restLabel = exercise.restSeconds ? `${exercise.restSeconds} sec rest` : null;

            return (
              <View key={exercise.id} style={styles.exerciseCard}>
                <View style={styles.exerciseHeader}>
                  <View style={styles.exerciseIcon}>
                    <Text style={styles.exerciseIconLabel}>{exercise.name.slice(0, 1).toUpperCase()}</Text>
                  </View>
                  <View style={styles.exerciseHeaderCopy}>
                    <Text selectable style={styles.exerciseName}>
                      {exercise.name}
                    </Text>
                    {restLabel ? <Text selectable style={styles.exerciseRest}>{restLabel}</Text> : null}
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    hitSlop={10}
                    onPress={() => {
                      if (!hasSets) {
                        return;
                      }

                      Alert.alert(exercise.name, undefined, [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Clear sets', style: 'destructive', onPress: () => clearExerciseSets(exercise.id) },
                      ]);
                    }}
                    style={({ pressed }) => [styles.menuButton, pressed && styles.pressed]}>
                    <Text style={styles.menuLabel}>⋯</Text>
                  </Pressable>
                </View>

                {hasSets ? (
                  <View style={styles.table}>
                    <View style={styles.tableHeader}>
                      <Text style={styles.tableHeaderCellSet}>Set</Text>
                      <Text style={styles.tableHeaderCellPrevious}>Previous</Text>
                      <Text style={styles.tableHeaderCell}>kg</Text>
                      <Text style={styles.tableHeaderCell}>Reps</Text>
                      <Text style={styles.tableHeaderCellCheck}>✓</Text>
                    </View>

                    {exerciseSets.map((set, index) => {
                      const previousLabel = getWorkoutSessionSetPreviousLabel(draft, exercise.id, index);
                      return (
                        <View key={set.id} style={styles.tableRow}>
                          <Text selectable style={styles.tableCellSet}>
                            {index + 1}
                          </Text>
                          <Text selectable style={styles.tableCellPrevious} numberOfLines={1}>
                            {previousLabel}
                          </Text>
                          <TextInput
                            keyboardType="decimal-pad"
                            placeholder="0"
                            placeholderTextColor={colors.textSecondary}
                            selectionColor={colors.accent}
                            style={styles.tableInput}
                            value={String(set.weight)}
                            onChangeText={(value) => updateSet(set.id, 'weight', value)}
                          />
                          <TextInput
                            keyboardType="number-pad"
                            placeholder="0"
                            placeholderTextColor={colors.textSecondary}
                            selectionColor={colors.accent}
                            style={styles.tableInput}
                            value={String(set.reps)}
                            onChangeText={(value) => updateSet(set.id, 'reps', value)}
                          />
                          <Pressable accessibilityRole="button" hitSlop={10} onPress={() => toggleComplete(set.id)} style={({ pressed }) => [styles.checkButton, pressed && styles.pressed]}>
                            <Text style={[styles.checkLabel, set.completed !== false && styles.checkLabelActive]}>{set.completed !== false ? '✓' : ''}</Text>
                          </Pressable>
                          <Pressable accessibilityRole="button" hitSlop={10} onPress={() => deleteSet(set.id)} style={({ pressed }) => [styles.deleteSetButton, pressed && styles.pressed]}>
                            <Text style={styles.deleteSetLabel}>⋯</Text>
                          </Pressable>
                        </View>
                      );
                    })}
                  </View>
                ) : null}

                <Pressable accessibilityRole="button" onPress={() => addSet(exercise.id)} style={({ pressed }) => [styles.addSetRow, pressed && styles.pressed]}>
                  <Text style={styles.addSetPlus}>+</Text>
                  <Text style={styles.addSetLabel}>Add set</Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    addSetLabel: {
      color: colors.textPrimary,
      fontSize: 13,
      fontWeight: '800',
    },
    addSetPlus: {
      color: colors.accent,
      fontSize: 18,
      fontWeight: '900',
      lineHeight: 18,
    },
    addSetRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.two,
      marginTop: Spacing.two,
    },
    backButton: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 999,
      height: 34,
      justifyContent: 'center',
      width: 34,
    },
    backLabel: {
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: '700',
      lineHeight: 22,
      marginTop: -1,
    },
    checkButton: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 10,
      height: 30,
      justifyContent: 'center',
      width: 30,
    },
    checkLabel: {
      color: colors.textSecondary,
      fontSize: 15,
      fontWeight: '900',
      lineHeight: 15,
    },
    checkLabelActive: {
      color: colors.accent,
    },
    container: {
      maxWidth: MaxContentWidth,
      width: '100%',
      gap: Spacing.three,
    },
    content: {
      alignItems: 'center',
      paddingHorizontal: Spacing.three,
      paddingTop: Spacing.three,
    },
    deleteSetButton: {
      alignItems: 'center',
      height: 30,
      justifyContent: 'center',
      width: 20,
    },
    deleteSetLabel: {
      color: colors.textSecondary,
      fontSize: 20,
      fontWeight: '700',
      lineHeight: 20,
      marginTop: -1,
    },
    emptyMessage: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 19,
      marginTop: Spacing.one,
    },
    emptyTitle: {
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: '900',
    },
    exerciseCard: {
      backgroundColor: colors.surfacePrimary,
      borderColor: colors.borderSubtle,
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      padding: Spacing.three,
    },
    exerciseHeader: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: Spacing.two,
      marginBottom: Spacing.two,
    },
    exerciseHeaderCopy: {
      flex: 1,
      minWidth: 0,
    },
    exerciseIcon: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 14,
      height: 30,
      justifyContent: 'center',
      width: 30,
    },
    exerciseIconLabel: {
      color: colors.textPrimary,
      fontSize: 13,
      fontWeight: '900',
    },
    exerciseName: {
      color: colors.textPrimary,
      fontSize: 17,
      fontWeight: '800',
    },
    exerciseRest: {
      color: colors.textSecondary,
      fontSize: 12,
      marginTop: 2,
    },
    finishButton: {
      alignItems: 'center',
      backgroundColor: colors.accent,
      borderRadius: 999,
      height: 34,
      justifyContent: 'center',
      paddingHorizontal: Spacing.three,
    },
    finishButtonPressed: {
      opacity: 0.82,
    },
    finishLabel: {
      color: colors.background,
      fontSize: 13,
      fontWeight: '900',
    },
    finishLabelDisabled: {
      color: colors.textSecondary,
    },
    loadingLabel: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: '700',
    },
    loadingState: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
      gap: Spacing.two,
      padding: Spacing.three,
    },
    menuButton: {
      alignItems: 'center',
      height: 30,
      justifyContent: 'center',
      width: 20,
    },
    menuLabel: {
      color: colors.textSecondary,
      fontSize: 22,
      fontWeight: '700',
      lineHeight: 22,
      marginTop: -1,
    },
    pressed: {
      opacity: 0.72,
    },
    row: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.two,
    },
    screen: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    table: {
      gap: 8,
    },
    tableCellPrevious: {
      color: colors.textSecondary,
      flex: 1.2,
      fontSize: 12,
      minWidth: 0,
    },
    tableCellSet: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '800',
      width: 32,
    },
    tableHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.one,
    },
    tableHeaderCell: {
      color: colors.textSecondary,
      flex: 0.75,
      fontSize: 11,
      fontWeight: '800',
      textAlign: 'center',
    },
    tableHeaderCellCheck: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: '800',
      textAlign: 'center',
      width: 30,
    },
    tableHeaderCellPrevious: {
      color: colors.textSecondary,
      flex: 1.2,
      fontSize: 11,
      fontWeight: '800',
    },
    tableHeaderCellSet: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: '800',
      width: 32,
    },
    tableInput: {
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.borderSubtle,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
      color: colors.textPrimary,
      flex: 0.75,
      fontSize: 13,
      fontWeight: '800',
      minHeight: 32,
      paddingHorizontal: Spacing.one,
      paddingVertical: 6,
      textAlign: 'center',
    },
    tableRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.one,
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
    timerLabel: {
      color: colors.textPrimary,
      fontSize: 13,
      fontWeight: '900',
    },
    timerPill: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 999,
      minWidth: 74,
      paddingHorizontal: Spacing.two,
      paddingVertical: 8,
    },
    topBar: {
      paddingHorizontal: Spacing.three,
      paddingBottom: Spacing.two,
    },
    topBarRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: Spacing.two,
    },
    workoutTitle: {
      color: colors.textPrimary,
      fontSize: 24,
      fontWeight: '900',
      letterSpacing: -0.4,
      marginTop: Spacing.two,
    },
  });
