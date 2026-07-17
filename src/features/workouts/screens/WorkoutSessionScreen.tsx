import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppContext, type WorkoutSet } from '@/context/AppContext';
import { formatWorkoutSessionElapsedLabel } from '@/lib/workouts';
import { resolveWorkoutSessionExercises } from '@/lib/workouts/workout-session';
import { SessionExerciseSection } from '@/features/workouts/components/session/SessionExerciseSection';
import { SessionHeader } from '@/features/workouts/components/session/SessionHeader';
import type { SessionDraftInputs } from '@/features/workouts/screens/sessionHelpers';
import { buildSessionRows, isSetCompleted, parseDraftValue, syncDraftInputs } from '@/features/workouts/screens/sessionHelpers';
import { createWorkoutSessionScreenStyles } from '@/features/workouts/screens/workoutSessionScreenStyles';
import { resolveWorkoutSessionRouteState } from '@/features/workouts/routeResolution';
import { discardActiveWorkoutSession, startWorkoutSession } from '@/features/workouts/sessionService';
import { getActiveWorkoutSessionDraft, hydrateActiveWorkoutSessionDraft, setActiveWorkoutSessionDraft } from '@/features/workouts/storage';
import { useAppTheme } from '@/theme/AppThemeProvider';

type DraftInputs = SessionDraftInputs;
type DraftSet = WorkoutSet;

export default function WorkoutSessionScreen() {
  const { workouts, workoutSessions, isRestoringState } = useAppContext();
  const { workoutId } = useLocalSearchParams<{ workoutId?: string }>();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const resolvedWorkoutId = Array.isArray(workoutId) ? workoutId[0] : workoutId;
  const [bootstrappedDraft, setBootstrappedDraft] = useState<null | undefined | { id: string; workoutId: string; workoutTitle: string; startedAt: string; sets: DraftSet[] }>(undefined);
  const [startedAt, setStartedAt] = useState('');
  const [sets, setSets] = useState<DraftSet[]>([]);
  const [draftInputs, setDraftInputs] = useState<DraftInputs>({});
  const [now, setNow] = useState(Date.now());
  const styles = useMemo(() => createWorkoutSessionScreenStyles(colors), [colors]);

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

  const routeState = useMemo(
    () =>
      resolveWorkoutSessionRouteState({
        activeDraft: bootstrappedDraft,
        isRestoringState,
        workoutId: resolvedWorkoutId,
        workouts,
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
  const sectionRows = useMemo(() => buildSessionRows(workoutExercises, sets, workoutSessions), [sets, workoutExercises, workoutSessions]);

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

    const createdDraft = startWorkoutSession(workout);
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
          discardActiveWorkoutSession();
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

  if (bootstrappedDraft === undefined || isRestoringState) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={styles.loadingState}>
          <ActivityIndicator color={colors.accent} />
          <Text selectable style={styles.loadingLabel}>Loading workout…</Text>
        </View>
      </View>
    );
  }

  if (!workout) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={styles.emptyState}>
          <Text selectable style={styles.emptyTitle}>{resolvedWorkoutId === 'empty-workout' ? 'Empty workout unavailable' : 'No workout selected'}</Text>
          <Text selectable style={styles.emptyMessage}>
            {resolvedWorkoutId === 'empty-workout'
              ? 'Start a template workout for now. Empty workout is temporarily disabled.'
              : 'Open a workout from the Workouts tab to continue.'}
          </Text>
          <Pressable accessibilityRole="button" onPress={() => router.replace('/workouts')} style={({ pressed }) => [styles.textAction, pressed && styles.textActionPressed]}>
            <Text style={styles.textActionLabel}>Back to Workouts</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.fill}>
        <SessionHeader elapsedLabel={formatWorkoutSessionElapsedLabel(startedAt, now)} onBack={() => router.back()} onOverflow={discardWorkout} onFinish={requestFinish} />

        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 112 + 20 }]}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}>
          <View style={styles.container}>
            {sectionRows.length > 0 ? (
              <View style={styles.sectionList}>
                {sectionRows.map(({ exercise, exerciseSets, previous }) => (
                  <SessionExerciseSection
                    key={exercise.id}
                    draftInputs={draftInputs}
                    exercise={exercise}
                    exerciseCompleted={exerciseSets.some(isSetCompleted)}
                    exerciseSets={exerciseSets}
                    onAddSet={addSet}
                    onCommitRowInputs={commitRowInputs}
                    onLongPressExercise={(exerciseId, exerciseName) => showExerciseActions(exerciseId, exerciseName)}
                    onLongPressRow={(setId) => showSetActions(setId, exercise.name)}
                    onNotesPress={exercise.notes ? () => Alert.alert(exercise.name, exercise.notes ?? '', [{ text: 'Close', style: 'cancel' }]) : undefined}
                    onRepsChange={(setId, value) => {
                      setDraftInputs((current) => ({
                        ...current,
                        [setId]: { ...(current[setId] ?? { reps: '', weight: '' }), reps: value },
                      }));
                    }}
                    onToggleSetCompletion={toggleSetCompletion}
                    onWeightChange={(setId, value) => {
                      setDraftInputs((current) => ({
                        ...current,
                        [setId]: { ...(current[setId] ?? { reps: '', weight: '' }), weight: value },
                      }));
                    }}
                    previousSet={previous}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.emptyWorkoutState}>
                <Text selectable style={styles.emptyWorkoutTitle}>This workout has no exercises yet.</Text>
                <Text selectable style={styles.emptyWorkoutMessage}>Add exercises in Workout Details to start logging sets.</Text>
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
