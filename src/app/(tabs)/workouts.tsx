import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { CreateWorkoutCard } from '@/components/workouts/CreateWorkoutCard';
import { EmptyWorkoutState } from '@/components/workouts/EmptyWorkoutState';
import { WorkoutHistorySection } from '@/components/workouts/WorkoutHistorySection';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAppContext, WorkoutSession } from '@/context/AppContext';
import { formatShortDateTime } from '@/lib';
import { getSessionVolume } from '@/lib/workouts';

export default function WorkoutsScreen() {
  const {
    addWorkoutSession,
    deleteWorkoutSession,
    exercises,
    selectWorkout,
    selectedWorkout,
    updateWorkoutSession,
    workoutSessions,
  } = useAppContext();
  const [isWorkoutHistoryExpanded, setIsWorkoutHistoryExpanded] = useState(true);
  const [editingSessionId, setEditingSessionId] = useState<string | undefined>();
  const [editingSessionSetId, setEditingSessionSetId] = useState<string | undefined>();
  const [sessionExerciseName, setSessionExerciseName] = useState('');
  const [sessionWeight, setSessionWeight] = useState('');
  const [sessionReps, setSessionReps] = useState('');
  const [sessionDraftSets, setSessionDraftSets] = useState<WorkoutSession['sets']>([]);
  const safeAreaInsets = useSafeAreaInsets();
  const workouts = exercises;
  const lastWorkoutSession = workoutSessions[0];
  const completedSessions = workoutSessions.filter((session) => session.completed);
  const latestCompletedSession = completedSessions[0];

  const handleSelectWorkout = (workoutId: string) => {
    const workout = workouts.find((item) => item.id === workoutId);

    if (!workout) {
      return;
    }

    selectWorkout(workout);
  };

  const startWorkout = () => {
    if (!selectedWorkout) {
      return;
    }

    addWorkoutSession({
      id: `${Date.now()}`,
      completed: false,
      finishedAt: '',
      sets: [],
      startedAt: new Date().toISOString(),
      workoutId: selectedWorkout.id,
      workoutTitle: selectedWorkout.name,
    });
  };

  const completeWorkout = (sessionId: string) => {
    const session = workoutSessions.find((item) => item.id === sessionId);

    if (!session || session.completed) {
      return;
    }

    updateWorkoutSession(sessionId, {
      ...session,
      completed: true,
      finishedAt: new Date().toISOString(),
    });
  };

  const confirmDeleteWorkout = (sessionId: string) => {
    Alert.alert('Delete workout?', 'This workout session will be removed from history.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteWorkoutSession(sessionId),
      },
    ]);
  };

  const handleEditSession = (session: WorkoutSession) => {
    setEditingSessionId(session.id);
    setEditingSessionSetId(undefined);
    setSessionDraftSets(session.sets.map((set) => ({ ...set })));
    setSessionExerciseName('');
    setSessionWeight('');
    setSessionReps('');
  };

  const handleEditSessionSet = (set: WorkoutSession['sets'][number]) => {
    setEditingSessionSetId(set.id);
    setEditingSessionId(undefined);
    setSessionExerciseName(set.exerciseName);
    setSessionWeight(`${set.weight}`);
    setSessionReps(`${set.reps}`);
  };

  const handleSaveSessionSet = () => {
    if (!editingSessionSetId) {
      return;
    }

    const session = workoutSessions.find((item) => item.sets.some((set) => set.id === editingSessionSetId));

    if (!session) {
      return;
    }

    const parsedWeight = Number(sessionWeight);
    const parsedReps = Number(sessionReps);

    if (!sessionExerciseName.trim() || !Number.isFinite(parsedWeight) || parsedWeight <= 0 || !Number.isFinite(parsedReps) || parsedReps <= 0) {
      return;
    }

    updateWorkoutSession(session.id, {
      ...session,
      sets: session.sets.map((set) =>
        set.id === editingSessionSetId
          ? { ...set, exerciseName: sessionExerciseName.trim(), reps: parsedReps, weight: parsedWeight }
          : set
      ),
    });

    setEditingSessionSetId(undefined);
    setSessionExerciseName('');
    setSessionWeight('');
    setSessionReps('');
  };

  const handleCancelSessionEdit = () => {
    setEditingSessionId(undefined);
    setSessionDraftSets([]);
  };

  const handleSaveSessionChanges = (session: WorkoutSession) => {
    updateWorkoutSession(session.id, {
      ...session,
      sets: sessionDraftSets,
    });
    setEditingSessionId(undefined);
    setSessionDraftSets([]);
  };

  const handleCancelSessionSetEdit = () => {
    setEditingSessionSetId(undefined);
    setSessionExerciseName('');
    setSessionWeight('');
    setSessionReps('');
  };

  const updateDraftSet = (setId: string, updater: (set: WorkoutSession['sets'][number]) => WorkoutSession['sets'][number]) => {
    setSessionDraftSets((current) => current.map((item) => (item.id === setId ? updater(item) : item)));
  };

  const handleSaveSession = () => {
    if (!editingSessionId) {
      return;
    }

    const session = workoutSessions.find((item) => item.id === editingSessionId);

    if (!session) {
      return;
    }

    updateWorkoutSession(session.id, {
      ...session,
      sets: sessionDraftSets,
    });
    setEditingSessionId(undefined);
    setSessionDraftSets([]);
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: safeAreaInsets.bottom + 140 }]}>
      <View style={styles.container}>
        <SectionHeader title="Track" subtitle="Workouts, training load, and completed sessions" />

        <AppCard>
          <Text style={styles.sectionTitle}>Workout Library</Text>
          <View style={styles.workoutList}>
            {workouts.map((workout) => (
              <AppButton key={workout.id} label={workout.name} onPress={() => handleSelectWorkout(workout.id)} variant={selectedWorkout?.id === workout.id ? 'primary' : 'secondary'} />
            ))}
          </View>
          <AppButton disabled={workouts.length === 0} label="Start Workout" onPress={startWorkout} />
        </AppCard>

        <AppCard>
          <Text style={styles.sectionTitle}>Current Workout</Text>
          <View style={styles.currentWorkoutList}>
            {lastWorkoutSession ? (
              <View style={styles.currentWorkoutCard}>
                <Text style={styles.currentWorkoutTitle}>{lastWorkoutSession.workoutTitle}</Text>
                <Text style={styles.currentWorkoutMeta}>{`${lastWorkoutSession.sets.length} sets • ${getSessionVolume(lastWorkoutSession).toFixed(0)} kg`}</Text>
              </View>
            ) : (
              <Text style={styles.emptyText}>Start a workout to see your current session.</Text>
            )}
          </View>
        </AppCard>

        <CreateWorkoutCard
          editingSessionId={editingSessionId}
          editingSessionSetId={editingSessionSetId}
          onCancelSessionEdit={handleCancelSessionEdit}
          onCancelSessionSetEdit={handleCancelSessionSetEdit}
          onSaveSession={handleSaveSession}
          onSaveSessionSet={handleSaveSessionSet}
          onSessionExerciseNameChange={setSessionExerciseName}
          onSessionRepsChange={setSessionReps}
          onSessionWeightChange={setSessionWeight}
          onUpdateDraftSet={updateDraftSet}
          sessionDraftSets={sessionDraftSets}
          sessionExerciseName={sessionExerciseName}
          sessionReps={sessionReps}
          sessionWeight={sessionWeight}
        />

        <WorkoutHistorySection
          completedSessions={completedSessions}
          editingSessionId={editingSessionId}
          editingSessionSetId={editingSessionSetId}
          formatFinishedAt={formatShortDateTime}
          isExpanded={isWorkoutHistoryExpanded}
          onCancelSessionEdit={handleCancelSessionEdit}
          onCancelSessionSetEdit={handleCancelSessionSetEdit}
          onDeleteSession={confirmDeleteWorkout}
          onDeleteSessionSet={handleSaveSessionSet}
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    width: '100%',
  },
  content: {
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    paddingBottom: Spacing.six,
  },
  currentWorkoutCard: {
    gap: Spacing.one,
  },
  currentWorkoutList: {
    gap: Spacing.two,
  },
  currentWorkoutMeta: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
  currentWorkoutTitle: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '800',
  },
  emptyText: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
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
  workoutList: {
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
});
