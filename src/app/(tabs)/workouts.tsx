import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useState } from 'react';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
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

  const getSectionTitle = (title: string, isExpanded: boolean) => {
    return `${title} ${isExpanded ? '−' : '+'}`;
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
        <AppButton label="Start Workout" onPress={() => startWorkout(workouts[0]?.id ?? '')} />

        <AppCard>
          <Pressable
            onPress={() => setIsExercisesExpanded((current) => !current)}
            style={styles.collapsibleHeader}>
            <Text style={styles.sectionTitle}>{getSectionTitle('Exercises', isExercisesExpanded)}</Text>
          </Pressable>

          {isExercisesExpanded ? (
            <>
              <View style={styles.inputGroup}>
                <Text selectable style={styles.inputLabel}>
                  Exercise name
                </Text>
                <TextInput
                  onChangeText={setExerciseName}
                  placeholder="Bench press"
                  placeholderTextColor={Colors.dark.textSecondary}
                  style={styles.input}
                  value={exerciseName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text selectable style={styles.inputLabel}>
                  Muscle group
                </Text>
                <TextInput
                  onChangeText={setExerciseMuscleGroup}
                  placeholder="Chest"
                  placeholderTextColor={Colors.dark.textSecondary}
                  style={styles.input}
                  value={exerciseMuscleGroup}
                />
              </View>

              <AppButton
                disabled={isSaveExerciseDisabled}
                label="Add Exercise"
                onPress={handleSaveExercise}
              />

              <View style={styles.availableExercises}>
                <Text selectable style={styles.availableExercisesTitle}>
                  Available exercises
                </Text>
                {exercises.length > 0 ? (
                  exercises.map((exercise) => {
                    const isAdded = isDraftExerciseAdded(exercise.name);

                    return (
                      <View key={exercise.id} style={styles.availableExerciseRow}>
                        <View style={styles.availableExerciseContent}>
                          <Text selectable style={styles.exercise}>
                            {exercise.name}
                          </Text>
                          {exercise.muscleGroup ? (
                            <Text selectable style={styles.availableExerciseMeta}>
                              {exercise.muscleGroup}
                            </Text>
                          ) : null}
                        </View>
                        <AppButton
                          disabled={isAdded}
                          label={isAdded ? 'Added' : 'Add'}
                          onPress={() => handleAddDatabaseExercise(exercise.name)}
                          variant="secondary"
                        />
                        {exercise.isCustom ? (
                          <AppButton
                            label="Delete"
                            onPress={() => handleDeleteExercise(exercise.id)}
                            variant="secondary"
                          />
                        ) : null}
                      </View>
                    );
                  })
                ) : (
                  <Text selectable style={styles.emptyText}>
                    No exercises yet.
                  </Text>
                )}
              </View>
            </>
          ) : null}
        </AppCard>

        <AppCard>
          <Pressable
            onPress={() => setIsCreateWorkoutExpanded((current) => !current)}
            style={styles.collapsibleHeader}>
            <Text style={styles.sectionTitle}>
              {getSectionTitle(editingWorkoutId ? 'Edit Workout' : 'Create Workout', isCreateWorkoutExpanded)}
            </Text>
          </Pressable>

          {isCreateWorkoutExpanded ? (
            <>
              <Text selectable style={styles.formTitle}>
                {editingWorkoutId ? 'Edit Workout' : 'Create Workout'}
              </Text>

              <View style={styles.inputGroup}>
                <Text selectable style={styles.inputLabel}>
                  Workout title
                </Text>
                <TextInput
                  onChangeText={setWorkoutTitle}
                  placeholder="Push day"
                  placeholderTextColor={Colors.dark.textSecondary}
                  style={styles.input}
                  value={workoutTitle}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text selectable style={styles.inputLabel}>
                  Description
                </Text>
                <TextInput
                  onChangeText={setWorkoutDescription}
                  placeholder="Optional description"
                  placeholderTextColor={Colors.dark.textSecondary}
                  style={styles.input}
                  value={workoutDescription}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text selectable style={styles.inputLabel}>
                  Exercise name
                </Text>
                <TextInput
                  onChangeText={setDraftExerciseName}
                  placeholder="Bench press"
                  placeholderTextColor={Colors.dark.textSecondary}
                  style={styles.input}
                  value={draftExerciseName}
                />
              </View>

              <AppButton
                disabled={draftExerciseName.trim().length === 0}
                label="Add Exercise"
                onPress={handleAddExercise}
                variant="secondary"
              />

              {draftExercises.length > 0 ? (
                <View style={styles.draftList}>
                  {draftExercises.map((exercise, index) => (
                    <View key={`${exercise}-${index}`} style={styles.draftRow}>
                      <Text selectable style={styles.exercise}>
                        {exercise}
                      </Text>
                      <AppButton
                        label="Remove"
                        onPress={() => handleRemoveDraftExercise(index)}
                        variant="secondary"
                      />
                    </View>
                  ))}
                </View>
              ) : null}

              <AppButton
                disabled={isSaveWorkoutDisabled}
                label="Save Workout"
                onPress={handleSaveWorkout}
              />
              {editingWorkoutId ? (
                <AppButton label="Cancel Edit" onPress={clearWorkoutForm} variant="secondary" />
              ) : null}
            </>
          ) : null}
        </AppCard>

        <AppCard>
          <Pressable
            onPress={() => setIsWorkoutHistoryExpanded((current) => !current)}
            style={styles.collapsibleHeader}>
            <Text style={styles.sectionTitle}>
              {getSectionTitle('Workout History', isWorkoutHistoryExpanded)}
            </Text>
          </Pressable>

          {isWorkoutHistoryExpanded ? (
            completedSessions.length === 0 ? (
              <AppCard>
                <Text selectable style={styles.emptyText}>
                  No completed workouts yet.
                </Text>
              </AppCard>
            ) : (
              completedSessions.map((session) => {
                const isEditingSession = editingSessionId === session.id;
                const visibleSets = isEditingSession ? sessionDraftSets : session.sets;
                const sessionExercises = getSessionExercises({ ...session, sets: visibleSets });
                const sessionVolume = getSessionVolume({ ...session, sets: visibleSets });

                return (
                  <AppCard key={session.id}>
                    <View style={styles.cardHeader}>
                      <Text selectable style={styles.title}>
                        {session.workoutTitle}
                      </Text>
                      <Text selectable style={styles.duration}>
                        {formatFinishedAt(session.finishedAt)}
                      </Text>
                    </View>

                    <View style={styles.sessionStats}>
                      <Text selectable style={styles.sessionStat}>
                        {session.sets.length} sets
                      </Text>
                      <Text selectable style={styles.sessionStat}>
                        {sessionVolume.toLocaleString()} kg volume
                      </Text>
                    </View>

                    <View style={styles.exerciseList}>
                      {sessionExercises.map((exerciseName) => (
                        <Text selectable key={exerciseName} style={styles.exercise}>
                          {exerciseName}
                        </Text>
                      ))}
                    </View>

                    {isEditingSession ? (
                      <View style={styles.sessionEditor}>
                        <View style={styles.inputGroup}>
                          <Text selectable style={styles.inputLabel}>
                            Exercise name
                          </Text>
                          <TextInput
                            onChangeText={setSessionExerciseName}
                            placeholder="Bench press"
                            placeholderTextColor={Colors.dark.textSecondary}
                            style={styles.input}
                            value={sessionExerciseName}
                          />
                        </View>

                        <View style={styles.inputsRow}>
                          <View style={styles.inputGroup}>
                            <Text selectable style={styles.inputLabel}>
                              Weight
                            </Text>
                            <TextInput
                              keyboardType="decimal-pad"
                              onChangeText={setSessionWeight}
                              placeholder="0"
                              placeholderTextColor={Colors.dark.textSecondary}
                              style={styles.input}
                              value={sessionWeight}
                            />
                          </View>

                          <View style={styles.inputGroup}>
                            <Text selectable style={styles.inputLabel}>
                              Reps
                            </Text>
                            <TextInput
                              keyboardType="number-pad"
                              onChangeText={setSessionReps}
                              placeholder="0"
                              placeholderTextColor={Colors.dark.textSecondary}
                              style={styles.input}
                              value={sessionReps}
                            />
                          </View>
                        </View>

                        <AppButton
                          label={editingSessionSetId ? 'Save Set' : 'Add Set'}
                          onPress={handleSaveSessionSet}
                        />
                        {editingSessionSetId ? (
                          <AppButton
                            label="Cancel Edit"
                            onPress={() => {
                              setEditingSessionSetId(undefined);
                              setSessionExerciseName('');
                              setSessionWeight('');
                              setSessionReps('');
                            }}
                            variant="secondary"
                          />
                        ) : null}

                        <View style={styles.draftList}>
                          {sessionDraftSets.map((set) => (
                            <View key={set.id} style={styles.draftRow}>
                              <View style={styles.setContent}>
                                <Text selectable style={styles.setName}>
                                  {set.exerciseName}
                                </Text>
                                <Text selectable style={styles.setMeta}>
                                  {set.weight} kg x {set.reps}
                                </Text>
                              </View>
                              <View style={styles.setActions}>
                                <AppButton
                                  label="Edit"
                                  onPress={() => handleEditSessionSet(set)}
                                  variant="secondary"
                                />
                                <AppButton
                                  label="Delete"
                                  onPress={() => handleDeleteSessionSet(set.id)}
                                  variant="secondary"
                                />
                              </View>
                            </View>
                          ))}
                        </View>

                        <View style={styles.editorFooter}>
                          <AppButton label="Cancel" onPress={handleCancelSessionEdit} variant="secondary" />
                          <AppButton
                            label="Save Changes"
                            onPress={() => handleSaveSessionChanges(session)}
                          />
                          <AppButton
                            label="Delete"
                            onPress={() => {
                              Alert.alert(
                                'Delete workout?',
                                'This completed workout will be removed from history.',
                                [
                                  { text: 'Cancel', style: 'cancel' },
                                  {
                                    text: 'Delete',
                                    style: 'destructive',
                                    onPress: () => {
                                      clearSessionEdit();
                                      deleteWorkoutSession(session.id);
                                    },
                                  },
                                ],
                              );
                            }}
                            variant="secondary"
                          />
                        </View>
                      </View>
                    ) : (
                      <>
                        <AppButton label="Edit" onPress={() => handleEditSession(session)} variant="secondary" />
                        <AppButton
                          label="Delete"
                          onPress={() => confirmDeleteSession(session.id)}
                          variant="secondary"
                        />
                      </>
                    )}
                  </AppCard>
                );
              })
            )
          ) : null}
        </AppCard>

        <SectionHeader title="Workout templates" />
        {workouts.map((workout) => (
          <AppCard key={workout.id}>
            <View style={styles.cardHeader}>
              <Text selectable style={styles.title}>
                {workout.title}
              </Text>
              <Text selectable style={styles.duration}>
                {workout.duration}
              </Text>
            </View>

            {workout.description ? (
              <Text selectable style={styles.description}>
                {workout.description}
              </Text>
            ) : null}

            <View style={styles.exerciseList}>
              {workout.exercises.map((exercise) => (
                <Text selectable key={exercise.id} style={styles.exercise}>
                  {exercise.name}
                </Text>
              ))}
            </View>

            <AppButton label="Start" onPress={() => startWorkout(workout.id)} />
            {isCustomWorkout(workout.id, workout.isCustom) ? (
              <>
                <AppButton
                  label="Edit"
                  onPress={() => handleEditWorkout(workout.id)}
                  variant="secondary"
                />
                <AppButton
                  label="Delete"
                  onPress={() => confirmDeleteWorkoutTemplate(workout.id)}
                  variant="secondary"
                />
              </>
            ) : null}
          </AppCard>
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
