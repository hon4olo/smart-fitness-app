import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { getWorkoutTemplateById, getActiveWorkoutSessionDraft, hydrateActiveWorkoutSessionDraft, resolveExerciseByName } from '@/lib/workouts';
import { clearActiveWorkoutSessionDraft, setActiveWorkoutSessionDraft } from '@/features/workouts/storage';
import { resolveWorkoutSessionRouteState } from '@/features/workouts/routeResolution';
import { addWorkoutSessionSet, clearWorkoutSessionSetsForExercise, createWorkoutSessionDraft, getWorkoutSessionCompletedSetCount, removeWorkoutSessionSet, toggleWorkoutSessionSetCompletion, updateWorkoutSessionSetField } from '@/features/workouts/sessionScreenModel';
import { formatWorkoutSessionElapsedLabel } from '@/features/workouts/sessionModel';
import { SessionExerciseSection } from '@/features/workouts/components/session/SessionExerciseSection';
import { SessionHeader } from '@/features/workouts/components/session/SessionHeader';
import type { SessionDraftInputs, SessionExercise } from '@/features/workouts/components/session/types';
import { useWorkoutTheme } from '@/features/workouts/workoutTheme';

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
  const { workouts, exercises, isRestoringState } = useAppContext();
  const { colors } = useWorkoutTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [bootstrappedDraft, setBootstrappedDraft] = useState<ReturnType<typeof getActiveWorkoutSessionDraft> | undefined>(undefined);
  const [draft, setDraft] = useState<ReturnType<typeof createWorkoutSessionDraft> | null>(null);
  const [draftInputs, setDraftInputs] = useState<SessionDraftInputs>({});
  const [now, setNow] = useState(Date.now());
  const [exerciseOverflow, setExerciseOverflow] = useState<{ exerciseId: string; exerciseName: string } | null>(null);
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

    return (workout?.exercises ?? []).map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      notes: undefined,
      restSeconds: undefined,
      targetReps: undefined,
    }));
  }, [draft, exercises, isEmptyWorkout, workout]);

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
  const onFinish = () => {
    if (!canFinish) {
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
          if (isEmptyWorkout) {
            router.push('/workout-session/exercises');
            return;
          }
          Alert.alert(['Add ', 'exercises'].join(''), 'Coming soon for template workouts.');
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
              onPress: () => {
                clearActiveWorkoutSessionDraft();
                router.replace('/workouts');
              },
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
    setDraft(clearWorkoutSessionSetsForExercise(draft, exerciseId));
  };

  const workoutExercises = visibleExercises;
  // Add set | Previous | kg | Reps | ✓

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <SessionHeader elapsedLabel={formatWorkoutSessionElapsedLabel(draft.startedAt, now)} finishDisabled={!canFinish} onBack={onBack} onFinish={onFinish} onOverflow={onOverflow} title={workoutTitle} />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 140 }]}
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
            const hasSets = exerciseSets.length > 0;
            const previousSet = exerciseSets.length > 1 ? { reps: exerciseSets.at(-2)!.reps, weight: exerciseSets.at(-2)!.weight } : null;

            return (
              <SessionExerciseSection
                key={exercise.id}
                draftInputs={draftInputs}
                exercise={exercise}
                exerciseCompleted={exerciseSets.length > 0 && exerciseSets.every((set) => set.completed !== false)}
                exerciseSets={exerciseSets}
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
                onToggleSetCompletion={toggleSetCompletion}
                onWeightChange={(setId, value) => updateSet(setId, 'weight', value)}
                previousSet={previousSet}
              />
            );
          })}
        </View>
      </ScrollView>

      <Modal animationType="fade" transparent visible={Boolean(exerciseOverflow)} onRequestClose={() => setExerciseOverflow(null)}>
        <Pressable onPress={() => setExerciseOverflow(null)} style={[styles.overflowBackdrop, { paddingBottom: insets.bottom + Spacing.three }]}>
          <Pressable onPress={() => undefined} style={styles.overflowSheet}>
            <Text style={styles.overflowTitle}>{exerciseOverflow?.exerciseName ?? ''}</Text>
            <View style={styles.overflowActions}>
              {overflowMessage ? <Text style={styles.overflowMessage}>{overflowMessage}</Text> : null}
              <Pressable onPress={() => setOverflowMessage('Coming soon.')} style={({ pressed }) => [styles.overflowAction, pressed && styles.pressed]}>
                <Text style={styles.overflowActionLabel}>Video & History</Text>
              </Pressable>
              <Pressable onPress={() => setOverflowMessage('Coming soon.')} style={({ pressed }) => [styles.overflowAction, pressed && styles.pressed]}>
                <Text style={styles.overflowActionLabel}>Add To Superset</Text>
              </Pressable>
              <Pressable onPress={() => setOverflowMessage('Coming soon.')} style={({ pressed }) => [styles.overflowAction, pressed && styles.pressed]}>
                <Text style={styles.overflowActionLabel}>Replace Exercise</Text>
              </Pressable>
              <Pressable onPress={() => setOverflowMessage('Coming soon.')} style={({ pressed }) => [styles.overflowAction, pressed && styles.pressed]}>
                <Text style={styles.overflowActionLabel}>Change Weight Unit</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (!exerciseOverflow) return;
                  clearExerciseSets(exerciseOverflow.exerciseId);
                  setOverflowMessage('Exercise removed from the active session.');
                }}
                style={({ pressed }) => [styles.overflowAction, styles.overflowDangerAction, pressed && styles.pressed]}>
                <Text style={[styles.overflowActionLabel, styles.overflowDangerLabel]}>Delete from workout</Text>
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
      minHeight: 52,
      justifyContent: 'center',
      marginTop: Spacing.two,
      paddingHorizontal: Spacing.three,
    },
    addExercisesLabel: {
      color: colors.background,
      fontSize: 15,
      fontWeight: '900',
    },
    container: {
      maxWidth: MaxContentWidth,
      width: '100%',
    },
    content: {
      alignItems: 'center',
      paddingHorizontal: Spacing.three,
      paddingTop: Spacing.three,
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
      gap: 8,
      marginBottom: Spacing.three,
      padding: Spacing.three,
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
      paddingTop: Spacing.three,
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
      gap: Spacing.two,
      padding: Spacing.three,
    },
    overflowTitle: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: '900',
    },
    pressed: {
      opacity: 0.72,
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
