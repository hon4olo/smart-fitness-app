import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing } from '@/constants/theme';
import { WorkoutSession } from '@/context/AppContext';
import { getSessionExercises, getSessionVolume } from '@/lib/workouts';
import { EmptyWorkoutState } from './EmptyWorkoutState';
import { WorkoutHistorySessionCard } from './WorkoutHistorySessionCard';

type WorkoutHistorySectionProps = {
  completedSessions: WorkoutSession[];
  editingSessionId?: string;
  editingSessionSetId?: string;
  formatFinishedAt: (finishedAt: string) => string;
  isExpanded: boolean;
  onCancelSessionEdit: () => void;
  onCancelSessionSetEdit: () => void;
  onDeleteSession: (sessionId: string) => void;
  onDeleteSessionSet: (setId: string) => void;
  onEditSession: (session: WorkoutSession) => void;
  onEditSessionSet: (set: WorkoutSession['sets'][number]) => void;
  onSaveSessionChanges: (session: WorkoutSession) => void;
  onSaveSessionSet: () => void;
  onSessionExerciseNameChange: (value: string) => void;
  onSessionRepsChange: (value: string) => void;
  onSessionWeightChange: (value: string) => void;
  onToggleExpanded: () => void;
  sessionDraftSets: WorkoutSession['sets'];
  sessionExerciseName: string;
  sessionReps: string;
  sessionWeight: string;
};

const getSectionTitle = (title: string, isExpanded: boolean) => {
  return `${title} ${isExpanded ? '−' : '+'}`;
};

export function WorkoutHistorySection({ completedSessions, editingSessionId, editingSessionSetId, formatFinishedAt, isExpanded, onCancelSessionEdit, onCancelSessionSetEdit, onDeleteSession, onDeleteSessionSet, onEditSession, onEditSessionSet, onSaveSessionChanges, onSaveSessionSet, onSessionExerciseNameChange, onSessionRepsChange, onSessionWeightChange, onToggleExpanded, sessionDraftSets, sessionExerciseName, sessionReps, sessionWeight, }: WorkoutHistorySectionProps) {
  return (
    <AppCard>
      <Pressable onPress={onToggleExpanded} style={styles.collapsibleHeader}>
        <Text style={styles.sectionTitle}>{getSectionTitle('Workout History', isExpanded)}</Text>
      </Pressable>

      {isExpanded ? (
        completedSessions.length === 0 ? (
          <EmptyWorkoutState
            description="Log a few workouts and your recent sessions will appear here."
            message="No completed workouts yet."
            title="Workout history is empty"
          />
        ) : (
          completedSessions.map((session) => {
            const isEditingSession = editingSessionId === session.id;
            const visibleSets = isEditingSession ? sessionDraftSets : session.sets;
            const sessionExercises = getSessionExercises({ ...session, sets: visibleSets });
            const sessionVolume = getSessionVolume({ ...session, sets: visibleSets });

            return (
              <WorkoutHistorySessionCard
                editingSessionSetId={editingSessionSetId}
                formatFinishedAt={formatFinishedAt}
                isEditing={isEditingSession}
                onCancelSessionEdit={onCancelSessionEdit}
                onCancelSessionSetEdit={onCancelSessionSetEdit}
                onDeleteSession={() => onDeleteSession(session.id)}
                onDeleteSessionSet={onDeleteSessionSet}
                onEditSession={() => onEditSession(session)}
                onEditSessionSet={onEditSessionSet}
                onSaveSessionChanges={() => onSaveSessionChanges(session)}
                onSaveSessionSet={onSaveSessionSet}
                onSessionExerciseNameChange={onSessionExerciseNameChange}
                onSessionRepsChange={onSessionRepsChange}
                onSessionWeightChange={onSessionWeightChange}
                session={session}
                sessionExerciseName={sessionExerciseName}
                sessionExercises={sessionExercises}
                sessionReps={sessionReps}
                sessionVolume={sessionVolume}
                sessionWeight={sessionWeight}
                visibleSets={visibleSets}
              />
            );
          })
        )
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  collapsibleHeader: { paddingBottom: Spacing.two },
  sectionTitle: { color: Colors.dark.text, fontSize: 18, fontWeight: '800' },
});
