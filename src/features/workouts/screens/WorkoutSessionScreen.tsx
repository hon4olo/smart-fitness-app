import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Keyboard, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { WorkoutSessionEmptyWorkoutCard } from '@/features/workouts/components/session/WorkoutSessionEmptyWorkoutCard';
import { WorkoutSessionFooterActions } from '@/features/workouts/components/session/WorkoutSessionFooterActions';
import { WorkoutSessionLoadingState } from '@/features/workouts/components/session/WorkoutSessionLoadingState';
import { WorkoutSessionMissingState } from '@/features/workouts/components/session/WorkoutSessionMissingState';
import {
  ExerciseOverflowModal,
  ReplacementExerciseModal,
  WorkoutOverflowModal,
} from '@/features/workouts/components/session/WorkoutSessionModals';
import { RpeBottomSheet } from '@/features/workouts/components/session/RpeBottomSheet';
import { SessionExerciseSection } from '@/features/workouts/components/session/SessionExerciseSection';
import { SessionHeader } from '@/features/workouts/components/session/SessionHeader';
import type {
  SessionDraftInputs,
  SessionExercise,
} from '@/features/workouts/components/session/types';
import { resolveWorkoutSessionRouteState } from '@/features/workouts/routeResolution';
import {
  addWorkoutSessionSet,
  clearWorkoutSessionSetsForExercise,
  createWorkoutSessionDraft,
  getPreviousCompletedSetsForExercise,
  getWorkoutSessionCompletedSetCount,
  removeWorkoutSessionSet,
  toggleWorkoutSessionSetCompletion,
  updateWorkoutSessionSetActualRpe,
  updateWorkoutSessionSetField,
} from '@/features/workouts/sessionScreenModel';
import { formatWorkoutSessionElapsedLabel } from '@/features/workouts/sessionModel';
import {
  clearActiveWorkoutSessionDraft,
  loadWorkoutRpeTrackingEnabled,
  saveWorkoutRpeTrackingEnabled,
  setActiveWorkoutSessionDraft,
} from '@/features/workouts/storage';
import { createStyles } from '@/features/workouts/styles/workoutSessionScreenStyles';
import {
  getActiveWorkoutSessionDraft,
  getWorkoutTemplateById,
  hydrateActiveWorkoutSessionDraft,
  parseWorkoutPlanDescription,
  resolveExerciseByName,
} from '@/lib/workouts';
import { useAppTheme } from '@/theme/AppThemeProvider';
import type { WorkoutRpe } from '@/types';

function uniqueExercisesFromSets(
  setNames: Array<{ exerciseId: string; exerciseName: string }>,
  catalog: ReturnType<typeof useAppContext>['exercises'],
) {
  const seen = new Set<string>();
  return setNames
    .map(
      (entry) =>
        resolveExerciseByName(entry.exerciseName, catalog) ??
        catalog.find((exercise) => exercise.id === entry.exerciseId) ?? {
          id: entry.exerciseId,
          name: entry.exerciseName,
        },
    )
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
  const [bootstrappedDraft, setBootstrappedDraft] = useState<
    ReturnType<typeof getActiveWorkoutSessionDraft> | undefined
  >(undefined);
  const [draft, setDraft] = useState<ReturnType<typeof createWorkoutSessionDraft> | null>(null);
  const [draftInputs, setDraftInputs] = useState<SessionDraftInputs>({});
  const [now, setNow] = useState(Date.now());
  const [exerciseOverflow, setExerciseOverflow] = useState<{
    exerciseId: string;
    exerciseName: string;
  } | null>(null);
  const [workoutOverflowOpen, setWorkoutOverflowOpen] = useState(false);
  const [replacementTarget, setReplacementTarget] = useState<{
    exerciseId: string;
    exerciseName: string;
  } | null>(null);
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);
  const [hiddenExerciseIds, setHiddenExerciseIds] = useState<Set<string>>(() => new Set());
  const [overflowMessage, setOverflowMessage] = useState<string | null>(null);
  const [trackRpeEnabled, setTrackRpeEnabled] = useState(false);
  const [rpeSetId, setRpeSetId] = useState<string | null>(null);
  const didSetInitialExpandedExercise = useRef(false);

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
  const parsedPlan = useMemo(
    () => parseWorkoutPlanDescription(workout?.description),
    [workout?.description],
  );

  useEffect(() => {
    if (routeState.status !== 'ready') {
      return;
    }

    if (routeState.workoutId === 'empty-workout') {
      if (bootstrappedDraft?.workoutId === 'empty-workout') {
        setDraft(
          createWorkoutSessionDraft(
            { id: 'empty-workout', title: 'Empty workout', duration: '0 min', exercises: [] },
            bootstrappedDraft,
          ),
        );
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
        draft.sets.map((set) => [
          set.id,
          { reps: String(set.reps), weight: String(set.weight) },
        ]),
      ),
    );
  }, [draft]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void loadWorkoutRpeTrackingEnabled().then((enabled) => {
      if (!cancelled) {
        setTrackRpeEnabled(enabled);
      }
    });

    return () => {
      cancelled = true;
    };
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
        targetSets: undefined,
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
        targetSets: parsedPlan.exercises[index]?.targetSets,
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
        targetSets: undefined,
      }));

    return [...templateExercises, ...sessionOnlyExercises];
  }, [draft, exercises, hiddenExerciseIds, isEmptyWorkout, parsedPlan.exercises, workout]);

  useEffect(() => {
    if (!didSetInitialExpandedExercise.current && isEmptyWorkout && visibleExercises.length > 0) {
      didSetInitialExpandedExercise.current = true;
      setExpandedExerciseId(visibleExercises[0].id);
    }
  }, [isEmptyWorkout, visibleExercises]);

  if (bootstrappedDraft === undefined || isRestoringState || routeState.status === 'loading') {
    return (
      <WorkoutSessionLoadingState
        accentColor={colors.accent}
        backgroundColor={colors.background}
        styles={styles}
      />
    );
  }

  if (!draft) {
    return (
      <WorkoutSessionMissingState
        backgroundColor={colors.background}
        onBackToWorkouts={() => router.replace('/workouts')}
        styles={styles}
      />
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
    setWorkoutOverflowOpen(false);
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
  const onOverflow = () => setWorkoutOverflowOpen(true);

  const updateSet = (setId: string, field: 'weight' | 'reps', value: string) => {
    if (!draft) return;
    setDraftInputs((current) => ({
      ...current,
      [setId]: {
        ...(current[setId] ?? { reps: '0', weight: '0' }),
        [field]: value,
      },
    }));
    setDraft(updateWorkoutSessionSetField(draft, setId, field, value));
  };

  const addSet = (exerciseId: string) => {
    if (!draft) return;
    const exercise = visibleExercises.find((item) => item.id === exerciseId);
    if (!exercise) return;
    const previousSet = [...draft.sets]
      .filter((set) => set.exerciseId === exerciseId)
      .at(-1);
    setDraft(
      addWorkoutSessionSet(
        draft,
        {
          id: exercise.id,
          name: exercise.name,
          targetReps: exercise.targetReps ?? undefined,
        },
        previousSet,
      ),
    );
  };

  const ensurePlannedSet = (exerciseId: string, index: number) => {
    if (!draft) return null;
    const exercise = visibleExercises.find((item) => item.id === exerciseId);
    if (!exercise) return null;
    const exerciseSets = draft.sets.filter((set) => set.exerciseId === exerciseId);
    const existingSet = exerciseSets[index];

    if (existingSet) {
      return existingSet;
    }

    let nextDraft = draft;
    for (let currentIndex = exerciseSets.length; currentIndex <= index; currentIndex += 1) {
      nextDraft = {
        ...nextDraft,
        sets: [
          ...nextDraft.sets.map((set) => ({ ...set })),
          {
            id: `${Date.now()}-${exercise.id}-${currentIndex}`,
            exerciseId: exercise.id,
            exerciseName: exercise.name,
            weight: 0,
            reps: 0,
            completed: false,
          },
        ],
      };
    }

    setDraft(nextDraft);
    return nextDraft.sets.filter((set) => set.exerciseId === exerciseId)[index] ?? null;
  };

  const removeSet = (setId: string) => {
    if (!draft) return;
    setDraft(removeWorkoutSessionSet(draft, setId));
  };

  const toggleSetCompletion = (setId: string) => {
    if (!draft) return;
    const set = draft.sets.find((item) => item.id === setId);
    const shouldAskForRpe = Boolean(trackRpeEnabled && set && set.completed === false);
    setDraft(toggleWorkoutSessionSetCompletion(draft, setId));
    if (shouldAskForRpe) {
      Keyboard.dismiss();
      setRpeSetId(setId);
    }
  };

  const updatePlannedSet = (
    exerciseId: string,
    index: number,
    field: 'weight' | 'reps',
    value: string,
  ) => {
    const set = ensurePlannedSet(exerciseId, index);
    if (!set) return;
    setDraftInputs((current) => ({
      ...current,
      [set.id]: {
        ...(current[set.id] ?? { reps: '', weight: '' }),
        [field]: value,
      },
    }));
    setDraft((currentDraft) =>
      currentDraft ? updateWorkoutSessionSetField(currentDraft, set.id, field, value) : currentDraft,
    );
  };

  const togglePlannedSetCompletion = (exerciseId: string, index: number) => {
    const set = ensurePlannedSet(exerciseId, index);
    if (!set) return;
    const shouldAskForRpe = Boolean(trackRpeEnabled && set.completed === false);
    setDraft((currentDraft) =>
      currentDraft ? toggleWorkoutSessionSetCompletion(currentDraft, set.id) : currentDraft,
    );
    if (shouldAskForRpe) {
      Keyboard.dismiss();
      setRpeSetId(set.id);
    }
  };

  const editSetRpe = (setId: string) => {
    const set = draft?.sets.find((item) => item.id === setId);
    if (!set || set.completed === false) return;
    Keyboard.dismiss();
    setRpeSetId(setId);
  };

  const setActualRpe = (setId: string, actualRpe?: WorkoutRpe) => {
    setDraft((currentDraft) =>
      currentDraft
        ? updateWorkoutSessionSetActualRpe(currentDraft, setId, actualRpe)
        : currentDraft,
    );
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
  const rpeSet = rpeSetId ? draft.sets.find((set) => set.id === rpeSetId) : undefined;
  const rpeSetLabel = rpeSet
    ? `Set ${
        draft.sets
          .filter((set) => set.exerciseId === rpeSet.exerciseId)
          .findIndex((set) => set.id === rpeSet.id) + 1
      }`
    : 'Set';

  return (
    <View style={styles.screen}>
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
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.five },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}>
        <View style={styles.container}>
          {isEmptyWorkout && draft.sets.length === 0 ? (
            <WorkoutSessionEmptyWorkoutCard
              onAddExercises={() => router.push('/workout-session/exercises')}
              onTestGif={() => router.push('/exercises/direct-gif-test')}
              styles={styles}
            />
          ) : null}

          {workoutExercises.map((exercise) => {
            const exerciseSets = draft.sets.filter((set) => set.exerciseId === exercise.id);
            const previousSets = getPreviousCompletedSetsForExercise(exercise.id, workoutSessions);

            return (
              <SessionExerciseSection
                key={exercise.id}
                draftInputs={draftInputs}
                exercise={exercise}
                exerciseCompleted={
                  exerciseSets.length > 0 &&
                  exerciseSets.every((set) => set.completed !== false)
                }
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
                    {
                      text: 'Delete set',
                      style: 'destructive',
                      onPress: () => removeSet(setId),
                    },
                  ])
                }
                onNotesPress={
                  exercise.notes ? () => Alert.alert('Notes', exercise.notes ?? '') : undefined
                }
                onEditSetRpe={editSetRpe}
                onRepsChange={(setId, value) => updateSet(setId, 'reps', value)}
                onPlannedRepsChange={updatePlannedSet}
                onPlannedToggleSetCompletion={togglePlannedSetCompletion}
                onPlannedWeightChange={updatePlannedSet}
                onToggleExpanded={(exerciseId) =>
                  setExpandedExerciseId((current) =>
                    current === exerciseId ? null : exerciseId,
                  )
                }
                onToggleSetCompletion={toggleSetCompletion}
                onWeightChange={(setId, value) => updateSet(setId, 'weight', value)}
                previousSets={previousSets}
              />
            );
          })}
          <WorkoutSessionFooterActions
            onAddExercises={() => router.push('/workout-session/exercises')}
            onTestGif={() => router.push('/exercises/direct-gif-test')}
            styles={styles}
            visible={workoutExercises.length > 0}
          />
        </View>
      </ScrollView>

      <ExerciseOverflowModal
        bottomInset={insets.bottom}
        exercise={exerciseOverflow}
        message={overflowMessage}
        onCancel={() => {
          setOverflowMessage(null);
          setExerciseOverflow(null);
        }}
        onDelete={(target) => {
          clearExerciseSets(target.exerciseId);
          setExerciseOverflow(null);
        }}
        onDismiss={() => setExerciseOverflow(null)}
        onReplace={(target) => {
          setReplacementTarget(target);
          setExerciseOverflow(null);
        }}
        styles={styles}
      />

      <WorkoutOverflowModal
        bottomInset={insets.bottom}
        colors={colors}
        onAddExercises={() => {
          setWorkoutOverflowOpen(false);
          router.push('/workout-session/exercises');
        }}
        onClose={() => setWorkoutOverflowOpen(false)}
        onDiscard={() => {
          setWorkoutOverflowOpen(false);
          Alert.alert('Discard workout?', 'Your logged sets will not be saved.', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Discard workout',
              style: 'destructive',
              onPress: discardActiveWorkoutAndReturn,
            },
          ]);
        }}
        onTrackRpeChange={(enabled) => {
          setTrackRpeEnabled(enabled);
          void saveWorkoutRpeTrackingEnabled(enabled);
        }}
        styles={styles}
        title={workoutTitle}
        trackRpeEnabled={trackRpeEnabled}
        visible={workoutOverflowOpen}
      />

      <ReplacementExerciseModal
        exercises={exercises}
        onClose={() => setReplacementTarget(null)}
        onSelect={replaceExercise}
        styles={styles}
        target={replacementTarget}
      />

      <RpeBottomSheet
        selectedRpe={rpeSet?.actualRpe}
        setLabel={rpeSetLabel}
        visible={Boolean(rpeSet)}
        onDismiss={() => setRpeSetId(null)}
        onSelect={(value) => {
          if (rpeSetId) {
            setActualRpe(rpeSetId, value);
          }
        }}
        onSkip={() => {
          if (rpeSetId) {
            setActualRpe(rpeSetId, undefined);
          }
        }}
      />
    </View>
  );
}
