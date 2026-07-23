import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppContext } from '@/context/AppContext';
import { WorkoutSessionBody } from '@/features/workouts/components/session/WorkoutSessionBody';
import { WorkoutSessionLoadingState } from '@/features/workouts/components/session/WorkoutSessionLoadingState';
import { WorkoutSessionMissingState } from '@/features/workouts/components/session/WorkoutSessionMissingState';
import { WorkoutSessionModalLayer } from '@/features/workouts/components/session/WorkoutSessionModalLayer';
import type { SessionDraftInputs } from '@/features/workouts/components/session/types';
import { resolveWorkoutSessionRouteState } from '@/features/workouts/routeResolution';
import {
  addWorkoutSessionSet,
  clearWorkoutSessionSetsForExercise,
  createWorkoutSessionDraft,
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
  buildVisibleSessionExercises,
  buildWorkoutSessionLiveSummary,
} from '@/features/workouts/workoutSessionScreenViewModel';
import {
  getActiveWorkoutSessionDraft,
  getWorkoutTemplateById,
  hydrateActiveWorkoutSessionDraft,
  parseWorkoutPlanDescription,
} from '@/lib/workouts';
import { useAppTheme } from '@/theme/AppThemeProvider';
import type { WorkoutRpe } from '@/types';

type ExerciseTarget = { exerciseId: string; exerciseName: string };

type ReplacementExercise = {
  id: string;
  name: string;
  muscleGroup?: string;
  category?: string;
};

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
  const [exerciseOverflow, setExerciseOverflow] = useState<ExerciseTarget | null>(null);
  const [workoutOverflowOpen, setWorkoutOverflowOpen] = useState(false);
  const [replacementTarget, setReplacementTarget] = useState<ExerciseTarget | null>(null);
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);
  const [hiddenExerciseIds, setHiddenExerciseIds] = useState<Set<string>>(() => new Set());
  const [overflowMessage, setOverflowMessage] = useState<string | null>(null);
  const [trackRpeEnabled, setTrackRpeEnabled] = useState(false);
  const [rpeSetId, setRpeSetId] = useState<string | null>(null);
  const didSetInitialExpandedExercise = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void hydrateActiveWorkoutSessionDraft().then((activeDraft) => {
      if (!cancelled) setBootstrappedDraft(activeDraft ?? getActiveWorkoutSessionDraft());
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
    if (routeState.status !== 'ready' || routeState.workoutId === 'empty-workout') return null;
    return getWorkoutTemplateById(routeState.workoutId, workouts);
  }, [routeState, workouts]);
  const parsedPlan = useMemo(
    () => parseWorkoutPlanDescription(workout?.description),
    [workout?.description],
  );

  useEffect(() => {
    if (routeState.status !== 'ready') return;

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
        setDraft({
          id: `${Date.now()}`,
          workoutId: 'empty-workout',
          workoutTitle: 'Empty workout',
          startedAt: new Date().toISOString(),
          sets: [],
        });
        return;
      }
    }

    if (!workout) return;
    setDraft(createWorkoutSessionDraft(workout, bootstrappedDraft ?? undefined));
  }, [bootstrappedDraft, routeState, workout]);

  useEffect(() => {
    if (!draft) return;
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
      if (!cancelled) setTrackRpeEnabled(enabled);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (draft) setActiveWorkoutSessionDraft(draft);
  }, [draft]);

  const canFinish = getWorkoutSessionCompletedSetCount(draft) > 0;
  const readyWorkoutId = routeState.status === 'ready' ? routeState.workoutId : null;
  const isEmptyWorkout = readyWorkoutId === 'empty-workout';
  const visibleExercises = useMemo(
    () =>
      buildVisibleSessionExercises({
        catalog: exercises,
        draft,
        hiddenExerciseIds,
        isEmptyWorkout,
        planExercises: parsedPlan.exercises,
        workout,
      }),
    [draft, exercises, hiddenExerciseIds, isEmptyWorkout, parsedPlan.exercises, workout],
  );

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

  const updateSet = (setId: string, field: 'weight' | 'reps', value: string) => {
    setDraftInputs((current) => ({
      ...current,
      [setId]: { ...(current[setId] ?? { reps: '0', weight: '0' }), [field]: value },
    }));
    setDraft(updateWorkoutSessionSetField(draft, setId, field, value));
  };

  const addSet = (exerciseId: string) => {
    const exercise = visibleExercises.find((item) => item.id === exerciseId);
    if (!exercise) return;
    const previousSet = [...draft.sets].filter((set) => set.exerciseId === exerciseId).at(-1);
    setDraft(
      addWorkoutSessionSet(
        draft,
        { id: exercise.id, name: exercise.name, targetReps: exercise.targetReps },
        previousSet,
      ),
    );
  };

  const ensurePlannedSet = (exerciseId: string, index: number) => {
    const exercise = visibleExercises.find((item) => item.id === exerciseId);
    if (!exercise) return null;
    const exerciseSets = draft.sets.filter((set) => set.exerciseId === exerciseId);
    if (exerciseSets[index]) return exerciseSets[index];

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
      [set.id]: { ...(current[set.id] ?? { reps: '', weight: '' }), [field]: value },
    }));
    setDraft((current) =>
      current ? updateWorkoutSessionSetField(current, set.id, field, value) : current,
    );
  };

  const toggleSetCompletion = (setId: string) => {
    const set = draft.sets.find((item) => item.id === setId);
    const shouldAskForRpe = Boolean(trackRpeEnabled && set && set.completed === false);
    setDraft(toggleWorkoutSessionSetCompletion(draft, setId));
    if (shouldAskForRpe) {
      Keyboard.dismiss();
      setRpeSetId(setId);
    }
  };

  const togglePlannedSetCompletion = (exerciseId: string, index: number) => {
    const set = ensurePlannedSet(exerciseId, index);
    if (!set) return;
    const shouldAskForRpe = Boolean(trackRpeEnabled && set.completed === false);
    setDraft((current) =>
      current ? toggleWorkoutSessionSetCompletion(current, set.id) : current,
    );
    if (shouldAskForRpe) {
      Keyboard.dismiss();
      setRpeSetId(set.id);
    }
  };

  const editSetRpe = (setId: string) => {
    const set = draft.sets.find((item) => item.id === setId);
    if (!set || set.completed === false) return;
    Keyboard.dismiss();
    setRpeSetId(setId);
  };

  const setActualRpe = (setId: string, actualRpe?: WorkoutRpe) =>
    setDraft((current) =>
      current ? updateWorkoutSessionSetActualRpe(current, setId, actualRpe) : current,
    );

  const clearExerciseSets = (exerciseId: string) => {
    setHiddenExerciseIds((current) => new Set([...current, exerciseId]));
    setDraft(clearWorkoutSessionSetsForExercise(draft, exerciseId));
  };

  const replaceExercise = (replacement: ReplacementExercise) => {
    if (!replacementTarget) return;
    setDraft({
      ...draft,
      sets: draft.sets.map((set) =>
        set.exerciseId === replacementTarget.exerciseId
          ? { ...set, exerciseId: replacement.id, exerciseName: replacement.name }
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

  const { completedReps, completedSets, completedVolume, rpeSet, rpeSetLabel } =
    buildWorkoutSessionLiveSummary(draft, rpeSetId);
  const openAddExercises = () => router.push('/workout-session/exercises');
  const openTestGif = () => router.push('/exercises/direct-gif-test');

  return (
    <View style={styles.screen}>
      <WorkoutSessionBody
        bottomInset={insets.bottom}
        canFinish={canFinish}
        completedReps={completedReps}
        completedSetCount={completedSets.length}
        completedVolume={completedVolume}
        draft={draft}
        draftInputs={draftInputs}
        elapsedLabel={formatWorkoutSessionElapsedLabel(draft.startedAt, now)}
        expandedExerciseId={expandedExerciseId}
        isEmptyWorkout={isEmptyWorkout}
        onAddExercises={openAddExercises}
        onAddSet={addSet}
        onBack={() => router.replace('/workouts')}
        onEditSetRpe={editSetRpe}
        onFinish={() => canFinish && router.push('/workout-session-finish')}
        onLongPressExercise={(exerciseId, exerciseName) =>
          setExerciseOverflow({ exerciseId, exerciseName })
        }
        onOverflow={() => setWorkoutOverflowOpen(true)}
        onPlannedSetChange={updatePlannedSet}
        onPlannedToggleSetCompletion={togglePlannedSetCompletion}
        onRemoveSet={(setId) => setDraft(removeWorkoutSessionSet(draft, setId))}
        onSetChange={updateSet}
        onTestGif={openTestGif}
        onToggleExpanded={(exerciseId) =>
          setExpandedExerciseId((current) => (current === exerciseId ? null : exerciseId))
        }
        onToggleSetCompletion={toggleSetCompletion}
        styles={styles}
        visibleExercises={visibleExercises}
        workoutSessions={workoutSessions}
      />

      <WorkoutSessionModalLayer
        bottomInset={insets.bottom}
        colors={colors}
        exerciseOverflow={exerciseOverflow}
        exercises={exercises}
        onClearExercise={clearExerciseSets}
        onCloseExerciseOverflow={(clearMessage) => {
          if (clearMessage) setOverflowMessage(null);
          setExerciseOverflow(null);
        }}
        onCloseReplacement={() => setReplacementTarget(null)}
        onCloseWorkoutOverflow={() => setWorkoutOverflowOpen(false)}
        onDiscardWorkout={discardActiveWorkoutAndReturn}
        onOpenAddExercises={() => {
          setWorkoutOverflowOpen(false);
          openAddExercises();
        }}
        onSelectReplacement={replaceExercise}
        onSetActualRpe={setActualRpe}
        onSetExerciseOverflow={setExerciseOverflow}
        onSetReplacementTarget={setReplacementTarget}
        onSetRpeSetId={setRpeSetId}
        onSetTrackRpeEnabled={(enabled) => {
          setTrackRpeEnabled(enabled);
          void saveWorkoutRpeTrackingEnabled(enabled);
        }}
        overflowMessage={overflowMessage}
        replacementTarget={replacementTarget}
        rpeSet={rpeSet}
        rpeSetId={rpeSetId}
        rpeSetLabel={rpeSetLabel}
        styles={styles}
        trackRpeEnabled={trackRpeEnabled}
        workoutOverflowOpen={workoutOverflowOpen}
        workoutTitle={draft.workoutTitle}
      />
    </View>
  );
}
