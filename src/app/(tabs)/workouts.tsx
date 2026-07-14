import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, LayoutChangeEvent, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { QuickActionsCard } from '@/components/ui/QuickActionsCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { WorkoutBuilderCard } from '@/components/workouts/WorkoutBuilderCard';
import { TrainingProgramBuilderCard } from '@/components/workouts/TrainingProgramBuilderCard';
import { WorkoutExerciseLibraryCard } from '@/components/workouts/WorkoutExerciseLibraryCard';
import { WorkoutLauncherCard } from '@/components/workouts/WorkoutLauncherCard';
import { WorkoutTemplateCard } from '@/components/workouts/WorkoutTemplateCard';
import { WorkoutHistorySection } from '@/components/workouts/WorkoutHistorySection';
import { EmptyWorkoutState } from '@/components/workouts/EmptyWorkoutState';
import type { DraftWorkoutExercise } from '@/components/workouts/workout-builder-types';
import type { TrainingProgram } from '@/types';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAppContext, WorkoutSession } from '@/context/AppContext';
import { formatShortDateTime } from '@/lib';
import {
  createDefaultTrainingProgram,
  formatWorkoutPlanDescription,
  getLatestWorkoutSessionForWorkout,
  parseWorkoutPlanDescription,
} from '@/lib/workouts';

const DEFAULT_WORKOUT_TEMPLATE_IDS = new Set(['push-a', 'legs-a', 'conditioning-a']);

const createDraftExercise = (name = '', overrides: Partial<DraftWorkoutExercise> = {}): DraftWorkoutExercise => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  name,
  notes: '',
  restSeconds: '90',
  targetReps: '8',
  targetSets: '3',
  ...overrides,
});

const toPositiveInteger = (value: string, fallback: number) => {
  const parsed = Number.parseInt(value, 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const toExercisePlan = (exercise: DraftWorkoutExercise) => ({
  name: exercise.name.trim(),
  notes: exercise.notes.trim() || undefined,
  restSeconds: toPositiveInteger(exercise.restSeconds, 90),
  targetReps: toPositiveInteger(exercise.targetReps, 8),
  targetSets: toPositiveInteger(exercise.targetSets, 3),
});

const formatLastUsedLabel = (session?: WorkoutSession) => {
  if (!session) {
    return undefined;
  }

  return formatShortDateTime(session.finishedAt);
};

export default function WorkoutsScreen() {
  const {
    addExercise,
    addWorkoutTemplate,
    deleteExercise,
    deleteWorkoutSession,
    deleteWorkoutTemplate,
    updateWorkoutSession,
    updateWorkoutTemplate,
    exercises,
    workouts,
    workoutSessions,
  } = useAppContext();
  const safeAreaInsets = useSafeAreaInsets();

  const [exerciseName, setExerciseName] = useState('');
  const [exerciseMuscleGroup, setExerciseMuscleGroup] = useState('');
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [workoutTitle, setWorkoutTitle] = useState('');
  const [workoutDescription, setWorkoutDescription] = useState('');
  const [draftExerciseName, setDraftExerciseName] = useState('');
  const [draftExercises, setDraftExercises] = useState<DraftWorkoutExercise[]>([]);
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | undefined>();
  const [editingSessionId, setEditingSessionId] = useState<string | undefined>();
  const [sessionDraftSets, setSessionDraftSets] = useState<WorkoutSession['sets']>([]);
  const [sessionExerciseName, setSessionExerciseName] = useState('');
  const [sessionWeight, setSessionWeight] = useState('');
  const [sessionReps, setSessionReps] = useState('');
  const [editingSessionSetId, setEditingSessionSetId] = useState<string | undefined>();
  const [isCreateWorkoutExpanded, setIsCreateWorkoutExpanded] = useState(false);
  const [isExercisesExpanded, setIsExercisesExpanded] = useState(false);
  const [isWorkoutHistoryExpanded, setIsWorkoutHistoryExpanded] = useState(true);
  const [isWorkoutLauncherExpanded, setIsWorkoutLauncherExpanded] = useState(false);
  const [isProgramBuilderExpanded, setIsProgramBuilderExpanded] = useState(true);
  const [trainingProgram, setTrainingProgram] = useState<TrainingProgram>(() => createDefaultTrainingProgram(workouts));
  const scrollViewRef = useRef<ScrollView>(null);
  const sectionOffsets = useRef({ createWorkout: 0, exerciseLibrary: 0, history: 0, programBuilder: 0, templates: 0 });

  const completedSessions = useMemo(() => [...workoutSessions].reverse(), [workoutSessions]);
  const latestCompletedSession = completedSessions[0];

  useEffect(() => {
    if (trainingProgram.days.length > 0 || workouts.length === 0) {
      return;
    }

    setTrainingProgram(createDefaultTrainingProgram(workouts));
  }, [trainingProgram.days.length, workouts]);
  const isCustomWorkout = (workoutId: string, isCustom?: boolean) => {
    return Boolean(isCustom) || !DEFAULT_WORKOUT_TEMPLATE_IDS.has(workoutId);
  };

  const isDraftExerciseAdded = (name: string) => {
    const normalizedName = name.trim().toLowerCase();

    return draftExercises.some((exercise) => exercise.name.trim().toLowerCase() === normalizedName);
  };

  const isSaveWorkoutDisabled =
    workoutTitle.trim().length === 0 ||
    draftExercises.length === 0 ||
    draftExercises.some((exercise) => exercise.name.trim().length === 0);

  const startWorkout = (workoutId: string) => {
    router.push({
      pathname: '/workout-session',
      params: { workoutId },
    });
  };

  const scrollToSection = (key: keyof typeof sectionOffsets.current) => {
    scrollViewRef.current?.scrollTo({ animated: true, y: Math.max(0, sectionOffsets.current[key] - 12) });
  };

  const handleSectionLayout = (key: keyof typeof sectionOffsets.current) => (event: LayoutChangeEvent) => {
    sectionOffsets.current[key] = event.nativeEvent.layout.y;
  };

  const confirmDeleteSession = (sessionId: string) => {
    Alert.alert(
      'Delete workout?',
      'This completed workout will be removed from history.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteWorkoutSession(sessionId),
        },
      ],
    );
  };

  const clearWorkoutForm = () => {
    setEditingWorkoutId(undefined);
    setWorkoutTitle('');
    setWorkoutDescription('');
    setDraftExerciseName('');
    setDraftExercises([]);
  };

  const clearExerciseForm = () => {
    setExerciseName('');
    setExerciseMuscleGroup('');
  };

  const clearSessionEdit = () => {
    setEditingSessionId(undefined);
    setSessionDraftSets([]);
    setSessionExerciseName('');
    setSessionWeight('');
    setSessionReps('');
    setEditingSessionSetId(undefined);
  };

  const confirmDeleteWorkoutTemplate = (templateId: string) => {
    Alert.alert('Delete workout?', 'This custom workout template will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteWorkoutTemplate(templateId),
      },
    ]);
  };

  const handleAddExercise = () => {
    const nextExercise = draftExerciseName.trim();

    if (!nextExercise || isDraftExerciseAdded(nextExercise)) {
      return;
    }

    setDraftExercises((currentExercises) => [...currentExercises, createDraftExercise(nextExercise)]);
    setDraftExerciseName('');
  };

  const handleAddExerciseFromLibrary = (name: string) => {
    const nextExercise = name.trim();

    if (!nextExercise || isDraftExerciseAdded(nextExercise)) {
      return;
    }

    setDraftExercises((currentExercises) => [...currentExercises, createDraftExercise(nextExercise)]);
  };

  const handleDuplicateExercise = (exerciseId: string) => {
    setDraftExercises((currentExercises) => {
      const sourceIndex = currentExercises.findIndex((exercise) => exercise.id === exerciseId);

      if (sourceIndex === -1) {
        return currentExercises;
      }

      const duplicatedExercise = createDraftExercise(currentExercises[sourceIndex].name, {
        notes: currentExercises[sourceIndex].notes,
        restSeconds: currentExercises[sourceIndex].restSeconds,
        targetReps: currentExercises[sourceIndex].targetReps,
        targetSets: currentExercises[sourceIndex].targetSets,
      });
      const nextExercises = [...currentExercises];
      nextExercises.splice(sourceIndex + 1, 0, duplicatedExercise);

      return nextExercises;
    });
  };

  const handleMoveExercise = (exerciseId: string, direction: -1 | 1) => {
    setDraftExercises((currentExercises) => {
      const sourceIndex = currentExercises.findIndex((exercise) => exercise.id === exerciseId);
      const targetIndex = sourceIndex + direction;

      if (sourceIndex === -1 || targetIndex < 0 || targetIndex >= currentExercises.length) {
        return currentExercises;
      }

      const nextExercises = [...currentExercises];
      const [movedExercise] = nextExercises.splice(sourceIndex, 1);
      nextExercises.splice(targetIndex, 0, movedExercise);

      return nextExercises;
    });
  };

  const handleExerciseChange = (exerciseId: string, patch: Partial<DraftWorkoutExercise>) => {
    setDraftExercises((currentExercises) =>
      currentExercises.map((exercise) =>
        exercise.id === exerciseId
          ? {
              ...exercise,
              ...patch,
            }
          : exercise,
      ),
    );
  };

  const handleRemoveDraftExercise = (exerciseId: string) => {
    setDraftExercises((currentExercises) => currentExercises.filter((exercise) => exercise.id !== exerciseId));
  };

  const handleEditWorkout = (workoutId: string) => {
    const workout = workouts.find((item) => item.id === workoutId);

    if (!workout || !isCustomWorkout(workout.id, workout.isCustom)) {
      return;
    }

    const parsedDescription = parseWorkoutPlanDescription(workout.description);
    const sourceExercises: Array<{
      name: string;
      notes?: string;
      restSeconds?: number;
      targetReps?: number;
      targetSets?: number;
    }> =
      parsedDescription.exercises.length > 0
        ? parsedDescription.exercises
        : workout.exercises.map((exercise) => ({
            name: exercise.name,
            notes: undefined,
            restSeconds: undefined,
            targetReps: undefined,
            targetSets: undefined,
          }));

    setIsCreateWorkoutExpanded(true);
    setEditingWorkoutId(workout.id);
    setWorkoutTitle(workout.title);
    setWorkoutDescription(parsedDescription.baseDescription);
    setDraftExerciseName('');
    setDraftExercises(
      sourceExercises.map((exercise) =>
        createDraftExercise(exercise.name, {
          notes: exercise.notes ?? '',
          restSeconds: `${exercise.restSeconds ?? 90}`,
          targetReps: `${exercise.targetReps ?? 8}`,
          targetSets: `${exercise.targetSets ?? 3}`,
        }),
      ),
    );
  };

  const handleEditSession = (session: WorkoutSession) => {
    setEditingSessionId(session.id);
    setSessionDraftSets(session.sets.map((set) => ({ ...set })));
    setSessionExerciseName('');
    setSessionWeight('');
    setSessionReps('');
    setEditingSessionSetId(undefined);
  };

  const handleCancelSessionEdit = () => {
    clearSessionEdit();
  };

  const handleEditSessionSet = (set: WorkoutSession['sets'][number]) => {
    setEditingSessionSetId(set.id);
    setSessionExerciseName(set.exerciseName);
    setSessionWeight(`${set.weight}`);
    setSessionReps(`${set.reps}`);
  };

  const handleCancelSessionSetEdit = () => {
    setEditingSessionSetId(undefined);
    setSessionExerciseName('');
    setSessionWeight('');
    setSessionReps('');
  };

  const handleDeleteSessionSet = (setId: string) => {
    setSessionDraftSets((currentSets) => currentSets.filter((set) => set.id !== setId));

    if (editingSessionSetId === setId) {
      setEditingSessionSetId(undefined);
      setSessionExerciseName('');
      setSessionWeight('');
      setSessionReps('');
    }
  };

  const handleSaveSessionSet = () => {
    const parsedWeight = Number(sessionWeight);
    const parsedReps = Number(sessionReps);
    const exerciseName = sessionExerciseName.trim();

    if (!exerciseName || !Number.isFinite(parsedWeight) || !Number.isFinite(parsedReps)) {
      return;
    }

    if (parsedWeight < 0 || parsedReps <= 0) {
      return;
    }

    const nextSet: WorkoutSession['sets'][number] = {
      id: editingSessionSetId ?? `${Date.now()}-${sessionDraftSets.length + 1}`,
      exerciseId: exerciseName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      exerciseName,
      weight: parsedWeight,
      reps: parsedReps,
    };

    setSessionDraftSets((currentSets) => {
      if (!editingSessionSetId) {
        return [...currentSets, nextSet];
      }

      return currentSets.map((set) => (set.id === editingSessionSetId ? nextSet : set));
    });

    setEditingSessionSetId(undefined);
    setSessionExerciseName('');
    setSessionWeight('');
    setSessionReps('');
  };

  const handleSaveSessionChanges = (session: WorkoutSession) => {
    if (sessionDraftSets.length === 0) {
      Alert.alert('Workout needs sets', 'Add at least one set before saving changes.');
      return;
    }

    updateWorkoutSession(session.id, {
      ...session,
      sets: sessionDraftSets,
    });
    clearSessionEdit();
  };

  const handleSaveWorkout = () => {
    if (isSaveWorkoutDisabled) {
      return;
    }

    const normalizedExercises = draftExercises.map(toExercisePlan);
    const workoutPayload = {
      title: workoutTitle.trim(),
      description: formatWorkoutPlanDescription(workoutDescription, normalizedExercises),
      exercises: normalizedExercises.map((exercise) => exercise.name),
    };

    if (editingWorkoutId) {
      updateWorkoutTemplate(editingWorkoutId, workoutPayload);
    } else {
      addWorkoutTemplate({
        id: `${Date.now()}`,
        ...workoutPayload,
        createdAt: new Date().toISOString(),
      });
    }

    clearWorkoutForm();
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[styles.content, { paddingBottom: safeAreaInsets.bottom + Spacing.six }]}
      keyboardShouldPersistTaps="handled"
      ref={scrollViewRef}
      style={styles.screen}>
      <View style={styles.container}>
        <SectionHeader title="Track" subtitle="Workouts, templates, and session history" />

        <View style={styles.heroGroup}>
          <QuickActionsCard
            title="Workout actions"
            subtitle="Create, edit, or launch workouts without hunting through the page."
            primaryAction={{
              disabled: workouts.length === 0,
              label: workouts.length === 0 ? 'Create workout first' : 'Choose workout',
              onPress: () => {
                if (workouts.length === 0) {
                  setIsCreateWorkoutExpanded(true);
                  scrollToSection('createWorkout');
                  return;
                }

                setIsWorkoutLauncherExpanded(true);
              },
            }}
            secondaryActions={[
              {
                label: 'Create workout',
                onPress: () => {
                  setIsCreateWorkoutExpanded(true);
                  scrollToSection('createWorkout');
                },
              },
              {
                label: 'Add exercise',
                onPress: () => {
                  setIsExercisesExpanded(true);
                  scrollToSection('exerciseLibrary');
                },
              },
              {
                label: 'Workout history',
                onPress: () => {
                  setIsWorkoutHistoryExpanded(true);
                  scrollToSection('history');
                },
              },
              {
                label: 'Templates',
                onPress: () => scrollToSection('templates'),
              },
              {
                label: 'Program builder',
                onPress: () => {
                  setIsProgramBuilderExpanded(true);
                  scrollToSection('programBuilder');
                },
              },
            ]}
          />

          <WorkoutLauncherCard
            isExpanded={isWorkoutLauncherExpanded}
            onCreateWorkout={() => {
              setIsCreateWorkoutExpanded(true);
              scrollToSection('createWorkout');
            }}
            onStart={startWorkout}
            onToggleExpanded={() => setIsWorkoutLauncherExpanded((current) => !current)}
            workoutSessions={workoutSessions}
            workouts={workouts}
          />
        </View>

        <View onLayout={handleSectionLayout('programBuilder')}>
          <TrainingProgramBuilderCard
            exercises={exercises}
            isExpanded={isProgramBuilderExpanded}
            onProgramChange={setTrainingProgram}
            onToggleExpanded={() => setIsProgramBuilderExpanded((current) => !current)}
            program={trainingProgram}
            workouts={workouts}
          />
        </View>

        <View onLayout={handleSectionLayout('exerciseLibrary')}>
          <WorkoutExerciseLibraryCard
            exerciseName={exerciseName}
            exerciseMuscleGroup={exerciseMuscleGroup}
            exercises={exercises}
            isExpanded={isExercisesExpanded}
            isExerciseAdded={isDraftExerciseAdded}
            isSaveExerciseDisabled={exerciseName.trim().length === 0}
            onAddDatabaseExercise={handleAddExerciseFromLibrary}
            onDeleteExercise={deleteExercise}
            onExerciseMuscleGroupChange={setExerciseMuscleGroup}
            onExerciseNameChange={setExerciseName}
            onSaveExercise={() => {
              if (exerciseName.trim().length === 0) {
                return;
              }

              addExercise({
                id: `${Date.now()}`,
                name: exerciseName.trim(),
                muscleGroup: exerciseMuscleGroup.trim() || undefined,
                isCustom: true,
                createdAt: new Date().toISOString(),
              });
              clearExerciseForm();
            }}
            onSearchChange={setExerciseSearch}
            onToggleExpanded={() => setIsExercisesExpanded((current) => !current)}
            searchValue={exerciseSearch}
            workoutSessions={workoutSessions}
          />
        </View>

        <View onLayout={handleSectionLayout('createWorkout')}>
          <WorkoutBuilderCard
            draftExerciseName={draftExerciseName}
            draftExercises={draftExercises}
            editingWorkoutId={editingWorkoutId}
            isExpanded={isCreateWorkoutExpanded}
            isSaveWorkoutDisabled={isSaveWorkoutDisabled}
            onAddExercise={handleAddExercise}
            onCancelEdit={clearWorkoutForm}
            onDraftExerciseNameChange={setDraftExerciseName}
            onDuplicateExercise={handleDuplicateExercise}
            onExerciseChange={handleExerciseChange}
            onMoveExercise={handleMoveExercise}
            onRemoveDraftExercise={handleRemoveDraftExercise}
            onSaveWorkout={handleSaveWorkout}
            onToggleExpanded={() => setIsCreateWorkoutExpanded((current) => !current)}
            onWorkoutDescriptionChange={setWorkoutDescription}
            onWorkoutTitleChange={setWorkoutTitle}
            workoutDescription={workoutDescription}
            workoutTitle={workoutTitle}
          />
        </View>

        <View onLayout={handleSectionLayout('history')}>
          <WorkoutHistorySection
            completedSessions={completedSessions}
            editingSessionId={editingSessionId}
            editingSessionSetId={editingSessionSetId}
            formatFinishedAt={formatShortDateTime}
            isExpanded={isWorkoutHistoryExpanded}
            onCancelSessionEdit={handleCancelSessionEdit}
            onCancelSessionSetEdit={handleCancelSessionSetEdit}
            onDeleteSession={(sessionId) => {
              if (editingSessionId === sessionId) {
                Alert.alert('Delete workout?', 'This completed workout will be removed from history.', [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                      clearSessionEdit();
                      deleteWorkoutSession(sessionId);
                    },
                  },
                ]);
                return;
              }

              confirmDeleteSession(sessionId);
            }}
            onDeleteSessionSet={handleDeleteSessionSet}
            onEditSession={handleEditSession}
            onEditSessionSet={handleEditSessionSet}
            onSaveSessionChanges={handleSaveSessionChanges}
            onSaveSessionSet={handleSaveSessionSet}
            onSessionExerciseNameChange={setSessionExerciseName}
            onSessionRepsChange={setSessionReps}
            onSessionWeightChange={setSessionWeight}
            onToggleExpanded={() => setIsWorkoutHistoryExpanded((current) => !current)}
            sessionDraftSets={sessionDraftSets}
            sessionExerciseName={sessionExerciseName}
            sessionReps={sessionReps}
            sessionWeight={sessionWeight}
          />
        </View>

        <View onLayout={handleSectionLayout('templates')}>
          <SectionHeader title="Workout templates" />
          {workouts.length === 0 ? (
            <EmptyWorkoutState
              actionLabel="Create workout"
              description="Build a template with targets, notes, and a saved workout plan."
              message="You don't have any workout templates yet."
              onActionPress={() => {
                setIsCreateWorkoutExpanded(true);
                scrollToSection('createWorkout');
              }}
              title="No workout templates"
            />
          ) : (
            workouts.map((workout) => {
              const latestSession = getLatestWorkoutSessionForWorkout(workout.id, workoutSessions);
              const lastUsedLabel = formatLastUsedLabel(latestSession);

              return (
                <WorkoutTemplateCard
                  key={workout.id}
                  isCustomWorkout={isCustomWorkout(workout.id, workout.isCustom)}
                  lastUsedLabel={lastUsedLabel}
                  onDelete={confirmDeleteWorkoutTemplate}
                  onEdit={handleEditWorkout}
                  onStart={startWorkout}
                  workout={workout}
                />
              );
            })
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    padding: Spacing.three,
  },
  container: {
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    width: '100%',
  },
  emptySection: {
    gap: Spacing.two,
  },
  heroGroup: {
    gap: Spacing.three,
  },
  screen: {
    backgroundColor: Colors.dark.background,
    flex: 1,
  },
});
