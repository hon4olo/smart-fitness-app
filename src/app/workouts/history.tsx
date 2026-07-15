import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { WorkoutHistorySessionCard } from '@/components/workouts/WorkoutHistorySessionCard';
import { AppCard } from '@/components/ui/AppCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { BottomTabInset, Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { getSessionExercises, getSessionVolume } from '@/lib/workouts';
import type { WorkoutSession } from '@/context/AppContext';

const formatFinishedAt = (finishedAt: string) => new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(finishedAt));
const formatMonth = (finishedAt: string) => new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(new Date(finishedAt));

export default function WorkoutHistoryRoute() {
  const { deleteWorkoutSession, updateWorkoutSession, workoutSessions } = useAppContext();
  const [isExpanded, setIsExpanded] = useState(true);
  const [editingSessionId, setEditingSessionId] = useState<string | undefined>();
  const [editingSessionSetId, setEditingSessionSetId] = useState<string | undefined>();
  const [sessionDraftSets, setSessionDraftSets] = useState<WorkoutSession['sets']>([]);
  const [sessionExerciseName, setSessionExerciseName] = useState('');
  const [sessionReps, setSessionReps] = useState('');
  const [sessionWeight, setSessionWeight] = useState('');
  const insets = useSafeAreaInsets();

  const completedSessions = useMemo(() => [...workoutSessions].sort((left, right) => right.finishedAt.localeCompare(left.finishedAt)), [workoutSessions]);
  const groupedSessions = useMemo(() => {
    const groups = new Map<string, WorkoutSession[]>();

    completedSessions.forEach((session) => {
      const key = formatMonth(session.finishedAt);
      groups.set(key, [...(groups.get(key) ?? []), session]);
    });

    return Array.from(groups.entries());
  }, [completedSessions]);

  const handleEditSession = (session: WorkoutSession) => {
    setEditingSessionId(session.id);
    setEditingSessionSetId(undefined);
    setSessionDraftSets(session.sets.map((set) => ({ ...set })));
    setSessionExerciseName('');
    setSessionReps('');
    setSessionWeight('');
  };

  const handleEditSessionSet = (set: WorkoutSession['sets'][number]) => {
    setEditingSessionSetId(set.id);
    setSessionExerciseName(set.exerciseName);
    setSessionReps(String(set.reps));
    setSessionWeight(String(set.weight));
  };

  const handleSaveSessionSet = () => {
    if (!editingSessionId || sessionExerciseName.trim().length === 0) {
      return;
    }

    const slug = sessionExerciseName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const nextSet = {
      id: editingSessionSetId ?? `${editingSessionId}-${Date.now()}`,
      exerciseId: editingSessionSetId ?? `${slug || editingSessionId}-${Date.now()}`,
      exerciseName: sessionExerciseName.trim(),
      reps: Number.parseInt(sessionReps, 10) || 0,
      weight: Number.parseFloat(sessionWeight) || 0,
    };

    setSessionDraftSets((current) => {
      if (editingSessionSetId) {
        return current.map((set) => (set.id === editingSessionSetId ? nextSet : set));
      }

      return [...current, nextSet];
    });
    setEditingSessionSetId(undefined);
    setSessionExerciseName('');
    setSessionReps('');
    setSessionWeight('');
  };

  const handleSaveSessionChanges = (session: WorkoutSession) => {
    updateWorkoutSession(session.id, { ...session, sets: sessionDraftSets });
    setEditingSessionId(undefined);
    setEditingSessionSetId(undefined);
    setSessionDraftSets([]);
  };

  const handleDeleteSessionSet = (setId: string) => {
    setSessionDraftSets((current) => current.filter((set) => set.id !== setId));
  };

  const handleCancelSessionEdit = () => {
    setEditingSessionId(undefined);
    setEditingSessionSetId(undefined);
    setSessionDraftSets([]);
    setSessionExerciseName('');
    setSessionReps('');
    setSessionWeight('');
  };

  const handleCancelSessionSetEdit = () => {
    setEditingSessionSetId(undefined);
    setSessionExerciseName('');
    setSessionReps('');
    setSessionWeight('');
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + BottomTabInset + 120 }]} style={styles.scrollView}>
        <View style={styles.container}>
          <SectionHeader subtitle="Grouped by month and ready for session edits." title="Workout History" />

          {completedSessions.length === 0 ? (
            <EmptyState compact message="Log a few workouts and they will appear here." title="No completed workouts yet" />
          ) : (
            groupedSessions.map(([month, sessions]) => (
              <View key={month} style={styles.groupBlock}>
                <AppCard>
                  <Text selectable style={styles.monthTitle}>
                    {month}
                  </Text>
                  <Text selectable style={styles.monthMeta}>
                    {sessions.length} session{sessions.length === 1 ? '' : 's'}
                  </Text>
                </AppCard>
                {sessions.map((session) => {
                  const isEditingSession = editingSessionId === session.id;
                  const visibleSets = isEditingSession ? sessionDraftSets : session.sets;
                  const sessionExercises = getSessionExercises({ ...session, sets: visibleSets });
                  const sessionVolume = getSessionVolume({ ...session, sets: visibleSets });

                  return (
                    <WorkoutHistorySessionCard
                      key={session.id}
                      editingSessionSetId={editingSessionSetId}
                      formatFinishedAt={formatFinishedAt}
                      isEditing={isEditingSession}
                      onCancelSessionEdit={handleCancelSessionEdit}
                      onCancelSessionSetEdit={handleCancelSessionSetEdit}
                      onDeleteSession={() => deleteWorkoutSession(session.id)}
                      onDeleteSessionSet={handleDeleteSessionSet}
                      onEditSession={() => handleEditSession(session)}
                      onEditSessionSet={handleEditSessionSet}
                      onSaveSessionChanges={() => handleSaveSessionChanges(session)}
                      onSaveSessionSet={handleSaveSessionSet}
                      onSessionExerciseNameChange={setSessionExerciseName}
                      onSessionRepsChange={setSessionReps}
                      onSessionWeightChange={setSessionWeight}
                      session={session}
                      sessionExerciseName={sessionExerciseName}
                      sessionExercises={sessionExercises}
                      sessionReps={sessionReps}
                      sessionVolume={sessionVolume}
                      sessionWeight={sessionWeight}
                      visibleSets={visibleSets}
                    />
                  );
                })}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
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
    padding: Spacing.three,
  },
  groupBlock: {
    gap: Spacing.two,
  },
  monthMeta: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
  },
  monthTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '900',
  },
  screen: {
    backgroundColor: Colors.dark.background,
    flex: 1,
  },
  scrollView: {
    backgroundColor: Colors.dark.background,
    flex: 1,
  },
});
