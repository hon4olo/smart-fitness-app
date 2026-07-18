import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { getWorkoutTemplateById, getActiveWorkoutSessionDraft, hydrateActiveWorkoutSessionDraft, parseWorkoutPlanDescription, resolveExerciseByName } from '@/lib/workouts';
import { clearActiveWorkoutSessionDraft, setActiveWorkoutSessionDraft } from '@/features/workouts/storage';
import { resolveWorkoutSessionRouteState } from '@/features/workouts/routeResolution';
import { addWorkoutSessionSet, clearWorkoutSessionSetsForExercise, createWorkoutSessionDraft, getPreviousCompletedSetsForExercise, getWorkoutSessionCompletedSetCount, removeWorkoutSessionSet, toggleWorkoutSessionSetCompletion, updateWorkoutSessionSetField } from '@/features/workouts/sessionScreenModel';
import { formatWorkoutSessionElapsedLabel } from '@/features/workouts/sessionModel';
import { SessionExerciseSection } from '@/features/workouts/components/session/SessionExerciseSection';
import { SessionHeader } from '@/features/workouts/components/session/SessionHeader';
import type { SessionDraftInputs, SessionExercise } from '@/features/workouts/components/session/types';
import { useAppTheme } from '@/theme/AppThemeProvider';

function uniqueExercisesFromSets(setNames: Array<{ exerciseId: string; exerciseName: string }>, catalog: ReturnType<typeof useAppContext>['exercises']) {
  const seen = new Set<string>();
  return setNames
    .map((entry) => resolveExerciseByName(entry.exerciseName, catalog) ?? catalog.find((exercise) => exercise.id === entry.exerciseId) ?? null)
    .filter((exercise): exercise is NonNullable<typeof exercise> => Boolean(exercise))
    .filter((exercise) => {
      if (seen.has(exercise.id)) return false;
      seen.add(exercise.id);
      return true;
    });
}

export default function WorkoutSessionScreen() {
  const params = useLocalSearchParams<{ workoutId?: string }>();
  const workoutId = Array.isArray(params.workoutId) ? params.workoutId[0] : params.workoutId;
  const { workouts, exercises, isRestoringState, workoutSessions } = useAppContext();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [bootstrappedDraft, setBootstrappedDraft] = useState<ReturnType<typeof getActiveWorkoutSessionDraft> | undefined>(undefined);
  const [draft, setDraft] = useState<ReturnType<typeof createWorkoutSessionDraft> | null>(null);
  const [draftInputs, setDraftInputs] = useState<SessionDraftInputs>({});
  const [now, setNow] = useState(Date.now());
  const [exerciseOverflow, setExerciseOverflow] = useState<{ exerciseId: string; exerciseName: string } | null>(null);
  const [replacementTarget, setReplacementTarget] = useState<{ exerciseId: string; exerciseName: string } | null>(null);
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);
  const [hiddenExerciseIds, setHiddenExerciseIds] = useState<Set<string>>(() => new Set());
  const [overflowMessage, setOverflowMessage] = useState<string | null>(null);

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
        workoutId,
        activeDraft: bootstrappedDraft,
        workouts,
        isRestoringState,
      }),
    [bootstrappedDraft, isRestoringState, workoutId, workouts],
  );

  const workout = useMemo(() => {
    if (routeState.status !== 'ready' || routeState.workoutId === 'empty-workout') {
      return null;
    }

    return getWorkoutTemplateById(routeState.workoutId, workouts);
  }, [routeState, workouts]);
  const parsedPlan = useMemo(() => parseWorkoutPlanDescription(workout?.description), [workout?.description]);

  useEffect(() => {
    if (routeState.status !== 'ready') {
      return;
    }

    if (routeState.workoutId === 'empty-workout') {
      if (bootstrappedDraft?.workoutId === 'empty-workout') {
        setDraft(createWorkoutSessionDraft({ id: 'empty-workout', title: 'Empty workout', duration: '0 min', exercises: [] }, bootstrappedDraft));
        return;
      }

      if (!bootstrappedDraft) {
        const nextDraft = {
          id: `${Date.now()}`,
          workoutId: 'empty-workout',
          workoutTitle: 'Empty workout',
          startedAt: new Date().toISOString(),
          sets: [],
        };
        setDraft(nextDraft);
        return;
      }
    }

    if (!workout) {
      return;
    }

    if (bootstrappedDraft?.workoutId === workout.id) {
      setDraft(createWorkoutSessionDraft(workout, bootstrappedDraft));
      return;
    }

    if (!bootstrappedDraft) {
      setDraft(createWorkoutSessionDraft(workout));
      return;
    }

    setDraft(createWorkoutSessionDraft(workout, bootstrappedDraft));
  }, [bootstrappedDraft, routeState, workout]);

  useEffect(() => {
    if (!draft) {
      return;
    }

    setDraftInputs(
      Object.fromEntries(
        draft.sets.map((set) => [set.id, { reps: String(set.reps), weight: String(set.weight) }]),
      ),
    );
  }, [draft]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (draft) {
      setActiveWorkoutSessionDraft(draft);
    }
  }, [draft]);

  const completedSetCount = getWorkoutSessionCompletedSetCount(draft);
  const canFinish = completedSetCount > 0;
  const readyWorkoutId = routeState.status === 'ready' ? routeState.workoutId : null;
  const isEmptyWorkout = readyWorkoutId === 'empty-workout';
  const visibleExercises: SessionExercise[] = useMemo(() => {
    if (!draft) {
      return [];
    }

    if (isEmptyWorkout) {
      return uniqueExercisesFromSets(draft.sets, exercises).map((exercise) => ({
        id: exercise.id,
        name: exercise.name,
        notes: undefined,
        restSeconds: undefined,
        targetReps: undefined,
      }));
    }

    const templateExercises = (workout?.exercises ?? [])
      .filter((exercise) => !hiddenExerciseIds.has(exercise.id))
      .map((exercise, index) => ({
        id: exercise.id,
        name: exercise.name,
        notes: parsedPlan.exercises[index]?.notes,
        restSeconds: parsedPlan.exercises[index]?.restSeconds,
        targetReps: parsedPlan.exercises[index]?.targetReps,
      }));
    const templateIds = new Set(templateExercises.map((exercise) => exercise.id));
    const sessionOnlyExercises = uniqueExercisesFromSets(draft.sets, exercises)
      .filter((exercise) => !templateIds.has(exercise.id) && !hiddenExerciseIds.has(exercise.id))
      .map((exercise) => ({
        id: exercise.id,
        name: exercise.name,
        notes: undefined,
        restSeconds: undefined,
        targetReps: undefined,
      }));

    return [...templateExercises, ...sessionOnlyExercises];
  }, [draft, exercises, hiddenExerciseIds, isEmptyWorkout, parsedPlan.exercises, workout]);

  if (bootstrappedDraft === undefined || isRestoringState || routeState.status === 'loading') {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={styles.loadingState}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.loadingLabel}>Loading workout…</Text>
        </View>
      </View>
    );
  }

  if (!draft) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={styles.loadingState}>
          <Text style={styles.emptyTitle}>No workout selected</Text>
          <Pressable onPress={() => router.replace('/workouts')} style={({ pressed }) => [styles.textAction, pressed && styles.pressed]}>
            <Text style={styles.textActionLabel}>Back to Workouts</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const workoutTitle = draft.workoutTitle;
  const onBack = () => router.replace('/workouts');
  const discardActiveWorkoutAndReturn = () => {
    clearActiveWorkoutSessionDraft();
    setDraft(null);
    setBootstrappedDraft(null);
    setDraftInputs({});
    setExerciseOverflow(null);
    setReplacementTarget(null);
    setExpandedExerciseId(null);
    setHiddenExerciseIds(new Set());
    router.replace('/workouts');
  };
  const onFinish = () => {
    if (!canFinish || !draft) {
      return;
    }

    router.push('/workout-session-finish');
  };
  const onOverflow = () => {
    Alert.alert(workoutTitle, undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: ['Add ', 'exercises'].join(''),
        onPress: () => {
          router.push('/workout-session/exercises');
        },
      },
      {
        text: 'Discard workout',
        style: 'destructive',
        onPress: () => {
          Alert.alert('Discard workout?', 'Your logged sets will not be saved.', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Discard workout',
              style: 'destructive',
              onPress: discardActiveWorkoutAndReturn,
            },
          ]);
        },
      },
    ]);
  };

  const updateSet = (setId: string, field: 'weight' | 'reps', value: string) => {
    if (!draft) return;
    setDraftInputs((current) => ({ ...current, [setId]: { ...(current[setId] ?? { reps: '0', weight: '0' }), [field]: value } }));
    setDraft(updateWorkoutSessionSetField(draft, setId, field, value));
  };

  const addSet = (exerciseId: string) => {
    if (!draft) return;
    const exercise = visibleExercises.find((item) => item.id === exerciseId);
    if (!exercise) return;
    const previousSet = [...draft.sets].filter((set) => set.exerciseId === exerciseId).at(-1);
    setDraft(addWorkoutSessionSet(draft, { id: exercise.id, name: exercise.name, targetReps: exercise.targetReps ?? undefined }, previousSet));
  };

  const removeSet = (setId: string) => {
    if (!draft) return;
    setDraft(removeWorkoutSessionSet(draft, setId));
  };

  const toggleSetCompletion = (setId: string) => {
    if (!draft) return;
    setDraft(toggleWorkoutSessionSetCompletion(draft, setId));
  };

  const clearExerciseSets = (exerciseId: string) => {
    if (!draft) return;
    setHiddenExerciseIds((current) => new Set([...current, exerciseId]));
    setDraft(clearWorkoutSessionSetsForExercise(draft, exerciseId));
  };

  const replaceExercise = (replacement: { id: string; name: string }) => {
    if (!draft || !replacementTarget) return;
    setDraft({
      ...draft,
      sets: draft.sets.map((set) =>
        set.exerciseId === replacementTarget.exerciseId
          ? {
              ...set,
              exerciseId: replacement.id,
              exerciseName: replacement.name,
            }
          : { ...set },
      ),
    });
    setHiddenExerciseIds((current) => {
      const next = new Set(current);
      next.add(replacementTarget.exerciseId);
      next.delete(replacement.id);
      return next;
    });
    setExpandedExerciseId(replacement.id);
    setReplacementTarget(null);
    setExerciseOverflow(null);
  };

  const workoutExercises = visibleExercises;
  const completedSets = draft.sets.filter((set) => set.completed !== false);
  const completedReps = completedSets.reduce((total, set) => total + set.reps, 0);
  const completedVolume = completedSets.reduce((total, set) => total + set.reps * set.weight, 0);
  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <SessionHeader
        elapsedLabel={formatWorkoutSessionElapsedLabel(draft.startedAt, now)}
        finishDisabled={!canFinish}
        onBack={onBack}
        onFinish={onFinish}
        onOverflow={onOverflow}
        reps={completedReps}
        sets={completedSets.length}
        title={workoutTitle}
        volume={completedVolume}
      />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.four }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}>
        <View style={styles.container}>
          {isEmptyWorkout && draft.sets.length === 0 ? (
            <View style={styles.emptyWorkoutCard}>
              <Text style={styles.emptyWorkoutTitle}>No Exercises Added</Text>
              <Text style={styles.emptyWorkoutSubtitle}>Add one or more exercises to start logging the session.</Text>
              <Pressable onPress={() => router.push('/workout-session/exercises')} style={({ pressed }) => [styles.addExercisesButton, pressed && styles.pressed]}>
                <Text style={styles.addExercisesLabel}>{['Add ', 'exercises'].join('')}</Text>
              </Pressable>
            </View>
          ) : null}

          {workoutExercises.map((exercise) => {
            const exerciseSets = draft.sets.filter((set) => set.exerciseId === exercise.id);
            const previousSets = getPreviousCompletedSetsForExercise(exercise.id, workoutSessions);

            return (
              <SessionExerciseSection
                key={exercise.id}
                draftInputs={draftInputs}
                exercise={exercise}
                exerciseCompleted={exerciseSets.length > 0 && exerciseSets.every((set) => set.completed !== false)}
                exerciseSets={exerciseSets}
                expanded={expandedExerciseId === exercise.id}
                onAddSet={addSet}
                onCommitRowInputs={() => undefined}
                onLongPressExercise={(exerciseId, exerciseName) =>
                  setExerciseOverflow({ exerciseId, exerciseName })
                }
                onLongPressRow={(setId) =>
                  Alert.alert('Set actions', undefined, [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete set', style: 'destructive', onPress: () => removeSet(setId) },
                  ])
                }
                onNotesPress={exercise.notes ? () => Alert.alert('Notes', exercise.notes ?? '') : undefined}
                onRepsChange={(setId, value) => updateSet(setId, 'reps', value)}
                onToggleExpanded={(exerciseId) => setExpandedExerciseId((current) => (current === exerciseId ? null : exerciseId))}
                onToggleSetCompletion={toggleSetCompletion}
                onWeightChange={(setId, value) => updateSet(setId, 'weight', value)}
                previousSets={previousSets}
              />
            );
          })}
          {workoutExercises.length > 0 ? (
            <Pressable onPress={() => router.push('/workout-session/exercises')} style={({ pressed }) => [styles.addExerciseFooterButton, pressed && styles.pressed]}>
              <Text style={styles.addExerciseFooterLabel}>+ Add exercise</Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>

      <Modal animationType="fade" transparent visible={Boolean(exerciseOverflow)} onRequestClose={() => setExerciseOverflow(null)}>
        <Pressable onPress={() => setExerciseOverflow(null)} style={[styles.overflowBackdrop, { paddingBottom: insets.bottom + Spacing.three }]}>
          <Pressable onPress={() => undefined} style={styles.overflowSheet}>
            <Text style={styles.overflowTitle}>{exerciseOverflow?.exerciseName ?? ''}</Text>
            <View style={styles.overflowActions}>
              {overflowMessage ? <Text style={styles.overflowMessage}>{overflowMessage}</Text> : null}
              <Pressable
                onPress={() => {
                  if (!exerciseOverflow) return;
                  setReplacementTarget(exerciseOverflow);
                  setExerciseOverflow(null);
                }}
                style={({ pressed }) => [styles.overflowAction, pressed && styles.pressed]}>
                <Text style={styles.overflowActionLabel}>Replace exercise</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (!exerciseOverflow) return;
                  clearExerciseSets(exerciseOverflow.exerciseId);
                  setExerciseOverflow(null);
                }}
                style={({ pressed }) => [styles.overflowAction, styles.overflowDangerAction, pressed && styles.pressed]}>
                <Text style={[styles.overflowActionLabel, styles.overflowDangerLabel]}>Delete exercise</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setOverflowMessage(null);
                  setExerciseOverflow(null);
                }}
                style={({ pressed }) => [styles.overflowCancel, pressed && styles.pressed]}>
                <Text style={styles.overflowCancelLabel}>Cancel</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal animationType="slide" transparent visible={Boolean(replacementTarget)} onRequestClose={() => setReplacementTarget(null)}>
        <View style={styles.replacementBackdrop}>
          <View style={styles.replacementSheet}>
            <View style={styles.replacementHeader}>
              <Text style={styles.replacementTitle}>Replace exercise</Text>
              <Pressable onPress={() => setReplacementTarget(null)} style={({ pressed }) => [styles.overflowCancel, pressed && styles.pressed]}>
                <Text style={styles.overflowCancelLabel}>Cancel</Text>
              </Pressable>
            </View>
            <ScrollView contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false}>
              {exercises.slice(0, 100).map((exercise) => (
                <Pressable key={exercise.id} onPress={() => replaceExercise(exercise)} style={({ pressed }) => [styles.replacementRow, pressed && styles.pressed]}>
                  <View style={styles.replacementIcon}>
                    <Text style={styles.replacementIconLabel}>{exercise.name.slice(0, 1).toUpperCase()}</Text>
                  </View>
                  <View style={styles.replacementCopy}>
                    <Text numberOfLines={1} style={styles.replacementRowTitle}>
                      {exercise.name}
                    </Text>
                    <Text numberOfLines={1} style={styles.replacementRowMeta}>
                      {exercise.muscleGroup ?? exercise.category ?? 'Exercise'}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    addExercisesButton: {
      alignItems: 'center',
      backgroundColor: colors.accent,
      borderCurve: 'continuous',
      borderRadius: 999,
      minHeight: 48,
      justifyContent: 'center',
      marginTop: Spacing.two,
      paddingHorizontal: Spacing.three,
    },
    addExercisesLabel: {
      color: colors.background,
      fontSize: 15,
      fontWeight: '900',
    },
    addExerciseFooterButton: {
      alignItems: 'center',
      backgroundColor: colors.backgroundSecondary,
      borderCurve: 'continuous',
      borderRadius: 16,
      justifyContent: 'center',
      minHeight: 50,
      marginTop: Spacing.two,
    },
    addExerciseFooterLabel: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '900',
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
    emptyState: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: '700',
    },
    emptyTitle: {
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: '900',
    },
    emptyWorkoutCard: {
      backgroundColor: colors.surfacePrimary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: 24,
      borderWidth: StyleSheet.hairlineWidth,
      gap: 6,
      marginBottom: 8,
      padding: 12,
    },
    emptyWorkoutSubtitle: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 19,
    },
    emptyWorkoutTitle: {
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: '900',
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
    overflowAction: {
      backgroundColor: colors.surfaceSecondary,
      borderCurve: 'continuous',
      borderRadius: 16,
      minHeight: 48,
      justifyContent: 'center',
      paddingHorizontal: Spacing.three,
    },
    overflowActionLabel: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: '800',
    },
    overflowActions: {
      gap: Spacing.one,
    },
    overflowBackdrop: {
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      flex: 1,
      justifyContent: 'flex-end',
      paddingHorizontal: Spacing.three,
      paddingTop: 8,
    },
    overflowCancel: {
      alignItems: 'center',
      minHeight: 48,
      justifyContent: 'center',
      marginTop: Spacing.one,
    },
    overflowCancelLabel: {
      color: colors.textSecondary,
      fontSize: 15,
      fontWeight: '800',
    },
    overflowDangerAction: {
      backgroundColor: colors.surfacePrimary,
      borderColor: colors.error,
      borderWidth: StyleSheet.hairlineWidth,
    },
    overflowDangerLabel: {
      color: colors.error,
    },
    overflowMessage: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '700',
      lineHeight: 18,
      marginBottom: Spacing.one,
    },
    overflowSheet: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      gap: 8,
      padding: 12,
    },
    overflowTitle: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: '900',
    },
    pressed: {
      opacity: 0.72,
    },
    replacementBackdrop: {
      ...StyleSheet.absoluteFill,
      backgroundColor: colors.overlay,
      justifyContent: 'flex-end',
    },
    replacementCopy: {
      flex: 1,
      minWidth: 0,
    },
    replacementHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingBottom: Spacing.three,
    },
    replacementIcon: {
      alignItems: 'center',
      backgroundColor: colors.backgroundSecondary,
      borderCurve: 'continuous',
      borderRadius: 12,
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    replacementIconLabel: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: '900',
    },
    replacementRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.three,
      minHeight: 64,
    },
    replacementRowMeta: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '700',
      marginTop: 3,
    },
    replacementRowTitle: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '900',
    },
    replacementSheet: {
      backgroundColor: colors.surfacePrimary,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '78%',
      padding: Spacing.three,
    },
    replacementTitle: {
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: '900',
    },
    screen: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    textAction: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderCurve: 'continuous',
      borderRadius: 999,
      paddingHorizontal: Spacing.three,
      paddingVertical: 10,
    },
    textActionLabel: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: '900',
    },
  });
