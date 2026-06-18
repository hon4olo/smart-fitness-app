import { router } from 'expo-router';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useState } from 'react';

import { AppButton } from '@/components/ui/AppButton';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { WorkoutCoachInsightCard } from '@/components/workouts/WorkoutCoachInsightCard';
import { WorkoutExerciseLibraryCard } from '@/components/workouts/WorkoutExerciseLibraryCard';
import { WorkoutTemplateCard } from '@/components/workouts/WorkoutTemplateCard';
import { CreateWorkoutCard } from '@/components/workouts/CreateWorkoutCard';
import { WorkoutHistorySection } from '@/components/workouts/WorkoutHistorySection';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAppContext, WorkoutSession } from '@/context/AppContext';

const DEFAULT_WORKOUT_TEMPLATE_IDS = new Set(['push-a', 'legs-a', 'conditioning-a']);

const formatFinishedAt = (finishedAt: string) => {
  const date = new Date(finishedAt);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown time';
  }

  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  }).format(date);
};

const getSessionVolume = (session: WorkoutSession) => {
  return session.sets.reduce((total, set) => total + set.weight * set.reps, 0);
};

const getSessionExercises = (session: WorkoutSession) => {
  return Array.from(new Set(session.sets.map((set) => set.exerciseName)));
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
  const [exerciseName, setExerciseName] = useState('');
  const [exerciseMuscleGroup, setExerciseMuscleGroup] = useState('');
  const [workoutTitle, setWorkoutTitle] = useState('');
  const [workoutDescription, setWorkoutDescription] = useState('');
  const [draftExerciseName, setDraftExerciseName] = useState('');
  const [draftExercises, setDraftExercises] = useState<string[]>([]);
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
  const completedSessions = [...workoutSessions].reverse();
  const latestCompletedSession = completedSessions[0];
  const workoutsInsight = (() => {
    if (workouts.length === 0) {
      return {
        title: 'Build your first workout',
        detail: 'Create a template so Track has something ready to launch.',
        summaryLine: '0 templates · 0 completed sessions',
        ctaLabel: 'Create workout',
      };
    }

    if (completedSessions.length === 0) {
      return {
        title: 'Ready to log your first session',
        detail: `You have ${workouts.length} workout template${workouts.length === 1 ? '' : 's'} ready to go.`,
        summaryLine: `${workouts.length} template${workouts.length === 1 ? '' : 's'} · no completed sessions yet`,
        ctaLabel: 'Start workout',
      };
    }

    return {
      title: 'Keep the momentum',
      detail: `${latestCompletedSession?.workoutTitle ?? 'Your last workout'} finished on ${formatFinishedAt(latestCompletedSession?.finishedAt ?? '')} with ${getSessionVolume(latestCompletedSession ?? completedSessions[0]).toLocaleString()} kg volume.`,
      summaryLine: `${workouts.length} template${workouts.length === 1 ? '' : 's'} · ${completedSessions.length} completed session${completedSessions.length === 1 ? '' : 's'}`,
      ctaLabel: 'Start next workout',
    };
  })();
  const isSaveWorkoutDisabled = workoutTitle.trim().length === 0 || draftExercises.length === 0;
  const isSaveExerciseDisabled = exerciseName.trim().length === 0;
  const normalizeDraftExerciseName = (name: string) => name.trim().toLowerCase();
  const isDraftExerciseAdded = (name: string) => {
    const normalizedName = normalizeDraftExerciseName(name);

    return draftExercises.some((exercise) => normalizeDraftExerciseName(exercise) === normalizedName);
  };
  const startWorkout = (workoutId: string) => {
    router.push({
      pathname: '/workout-session',
      params: { workoutId },
    });
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

  const isCustomWorkout = (workoutId: string, isCustom?: boolean) => {
    return Boolean(isCustom) || !DEFAULT_WORKOUT_TEMPLATE_IDS.has(workoutId);
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

    setDraftExercises((currentExercises) => [...currentExercises, nextExercise]);
    setDraftExerciseName('');
  };

  const handleSaveExercise = () => {
    if (isSaveExerciseDisabled) {
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
  };

  const handleDeleteExercise = (exerciseId: string) => {
    Alert.alert('Delete exercise?', 'This custom exercise will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteExercise(exerciseId),
      },
    ]);
  };

  const handleRemoveDraftExercise = (exerciseIndex: number) => {
    setDraftExercises((currentExercises) =>
      currentExercises.filter((_, currentIndex) => currentIndex !== exerciseIndex)
    );
  };

  const handleAddDatabaseExercise = (name: string) => {
    const nextExercise = name.trim();

    if (!nextExercise || isDraftExerciseAdded(nextExercise)) {
      return;
    }

    setDraftExercises((currentExercises) => [...currentExercises, nextExercise]);
  };

  const handleEditWorkout = (workoutId: string) => {
    const workout = workouts.find((item) => item.id === workoutId);

    if (!workout || !isCustomWorkout(workout.id, workout.isCustom)) {
      return;
    }

    setIsCreateWorkoutExpanded(true);
    setEditingWorkoutId(workout.id);
    setWorkoutTitle(workout.title);
    setWorkoutDescription(workout.description ?? '');
    setDraftExerciseName('');
    setDraftExercises(workout.exercises.map((exercise) => exercise.name));
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
      Alert.alert(
        'Workout needs sets',
        'Add at least one set before saving changes.'
      );
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

    const workoutPayload = {
      title: workoutTitle.trim(),
      description: workoutDescription.trim() || undefined,
      exercises: draftExercises,
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
      style={styles.screen}
      contentContainerStyle={styles.content}>
      <View style={styles.container}>
        <SectionHeader title="Track" subtitle="Workouts, templates, and session history" />

        <WorkoutCoachInsightCard
          ctaLabel={workoutsInsight.ctaLabel}
          detail={workoutsInsight.detail}
          onPress={() => {
            if (workouts.length === 0) {
              setIsCreateWorkoutExpanded(true);
              return;
            }

            startWorkout(workouts[0].id);
          }}
          summaryLine={workoutsInsight.summaryLine}
          title={workoutsInsight.title}
        />

        <AppButton
          disabled={workouts.length === 0}
          label="Start Workout"
          onPress={() => startWorkout(workouts[0]?.id ?? '')}
        />

        <WorkoutExerciseLibraryCard
          exerciseName={exerciseName}
          exerciseMuscleGroup={exerciseMuscleGroup}
          exercises={exercises}
          isExpanded={isExercisesExpanded}
          isExerciseAdded={isDraftExerciseAdded}
          isSaveExerciseDisabled={isSaveExerciseDisabled}
          onAddDatabaseExercise={handleAddDatabaseExercise}
          onDeleteExercise={handleDeleteExercise}
          onExerciseMuscleGroupChange={setExerciseMuscleGroup}
          onExerciseNameChange={setExerciseName}
          onSaveExercise={handleSaveExercise}
          onToggleExpanded={() => setIsExercisesExpanded((current) => !current)}
        />

        <CreateWorkoutCard
          draftExerciseName={draftExerciseName}
          draftExercises={draftExercises}
          editingWorkoutId={editingWorkoutId}
          isExpanded={isCreateWorkoutExpanded}
          isSaveWorkoutDisabled={isSaveWorkoutDisabled}
          onAddExercise={handleAddExercise}
          onCancelEdit={clearWorkoutForm}
          onDraftExerciseNameChange={setDraftExerciseName}
          onRemoveDraftExercise={handleRemoveDraftExercise}
          onSaveWorkout={handleSaveWorkout}
          onToggleExpanded={() => setIsCreateWorkoutExpanded((current) => !current)}
          onWorkoutDescriptionChange={setWorkoutDescription}
          onWorkoutTitleChange={setWorkoutTitle}
          workoutDescription={workoutDescription}
          workoutTitle={workoutTitle}
        />

        <WorkoutHistorySection
          completedSessions={completedSessions}
          editingSessionId={editingSessionId}
          editingSessionSetId={editingSessionSetId}
          formatFinishedAt={formatFinishedAt}
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

        <SectionHeader title="Workout templates" />
        {workouts.map((workout) => (
          <WorkoutTemplateCard
            key={workout.id}
            isCustomWorkout={isCustomWorkout(workout.id, workout.isCustom)}
            onDelete={confirmDeleteWorkoutTemplate}
            onEdit={handleEditWorkout}
            onStart={startWorkout}
            workout={workout}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  cardHeader: {
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  collapsibleHeader: {
    paddingBottom: Spacing.two,
  },
  container: {
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    width: '100%',
  },
  content: {
    alignItems: 'center',
    padding: Spacing.three,
    paddingBottom: Spacing.six,
  },
  description: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  duration: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
  emptyText: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
  },
  availableExerciseContent: {
    flex: 1,
    gap: Spacing.one,
  },
  availableExerciseMeta: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
  },
  availableExercises: {
    gap: Spacing.two,
  },
  availableExercisesTitle: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  availableExerciseRow: {
    alignItems: 'center',
    borderColor: Colors.dark.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
    paddingTop: Spacing.two,
  },
  exerciseLibrary: {
    gap: Spacing.two,
  },
  exerciseLibraryContent: {
    flex: 1,
    gap: Spacing.one,
  },
  exerciseLibraryMeta: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
  },
  exerciseLibraryName: {
    color: Colors.dark.text,
    fontSize: 15,
    fontWeight: '700',
  },
  exerciseLibraryRow: {
    alignItems: 'center',
    borderColor: Colors.dark.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
    paddingTop: Spacing.two,
  },
  exercise: {
    color: Colors.dark.text,
    fontSize: 15,
  },
  exerciseList: {
    gap: Spacing.one,
  },
  editorFooter: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  formTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '800',
  },
  draftList: {
    gap: Spacing.two,
  },
  draftRow: {
    alignItems: 'center',
    borderColor: Colors.dark.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
    paddingTop: Spacing.two,
  },
  inputsRow: {
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
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: Spacing.two,
  },
  inputGroup: {
    gap: Spacing.one,
  },
  inputLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  screen: {
    backgroundColor: Colors.dark.background,
    flex: 1,
  },
  sectionTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '800',
  },
  insightLabel: {
    color: Colors.dark.textSecondary,
    flex: 1,
    fontSize: 15,
  },
  insightSummary: {
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  insightSummaryRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  insightValue: {
    color: Colors.dark.text,
    flex: 1,
    fontSize: 15,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
    textAlign: 'right',
  },
  setName: {
    color: Colors.dark.textSecondary,
    flex: 1,
    fontSize: 15,
  },
  setMeta: {
    color: Colors.dark.text,
    fontSize: 15,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
  },
  sessionStat: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
  },
  sessionEditor: {
    gap: Spacing.two,
    paddingTop: Spacing.two,
  },
  sessionStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  setActions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  setContent: {
    flex: 1,
    gap: Spacing.one,
  },
  title: {
    color: Colors.dark.text,
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
  },
});
