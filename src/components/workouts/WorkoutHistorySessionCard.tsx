import { StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing } from '@/constants/theme';
import { WorkoutSession } from '@/context/AppContext';

type WorkoutHistorySessionCardProps = {
  editingSessionSetId?: string;
  formatFinishedAt: (finishedAt: string) => string;
  isEditing: boolean;
  onCancelSessionEdit: () => void;
  onCancelSessionSetEdit: () => void;
  onDeleteSession: () => void;
  onDeleteSessionSet: (setId: string) => void;
  onEditSession: () => void;
  onEditSessionSet: (set: WorkoutSession['sets'][number]) => void;
  onSaveSessionChanges: () => void;
  onSaveSessionSet: () => void;
  onSessionExerciseNameChange: (value: string) => void;
  onSessionRepsChange: (value: string) => void;
  onSessionWeightChange: (value: string) => void;
  session: WorkoutSession;
  sessionExerciseName: string;
  sessionExercises: string[];
  sessionReps: string;
  sessionVolume: number;
  sessionWeight: string;
  visibleSets: WorkoutSession['sets'];
};

export function WorkoutHistorySessionCard({
  editingSessionSetId,
  formatFinishedAt,
  isEditing,
  onCancelSessionEdit,
  onCancelSessionSetEdit,
  onDeleteSession,
  onDeleteSessionSet,
  onEditSession,
  onEditSessionSet,
  onSaveSessionChanges,
  onSaveSessionSet,
  onSessionExerciseNameChange,
  onSessionRepsChange,
  onSessionWeightChange,
  session,
  sessionExerciseName,
  sessionExercises,
  sessionReps,
  sessionVolume,
  sessionWeight,
  visibleSets,
}: WorkoutHistorySessionCardProps) {
  return (
    <AppCard>
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

      {isEditing ? (
        <View style={styles.sessionEditor}>
          <View style={styles.inputGroup}>
            <Text selectable style={styles.inputLabel}>
              Exercise name
            </Text>
            <TextInput
              onChangeText={onSessionExerciseNameChange}
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
                onChangeText={onSessionWeightChange}
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
                onChangeText={onSessionRepsChange}
                placeholder="0"
                placeholderTextColor={Colors.dark.textSecondary}
                style={styles.input}
                value={sessionReps}
              />
            </View>
          </View>

          <AppButton label={editingSessionSetId ? 'Save Set' : 'Add Set'} onPress={onSaveSessionSet} />
          {editingSessionSetId ? (
            <AppButton label="Cancel Edit" onPress={onCancelSessionSetEdit} variant="secondary" />
          ) : null}

          <View style={styles.draftList}>
            {visibleSets.map((set) => (
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
                  <AppButton label="Edit" onPress={() => onEditSessionSet(set)} variant="secondary" />
                  <AppButton label="Delete" onPress={() => onDeleteSessionSet(set.id)} variant="secondary" />
                </View>
              </View>
            ))}
          </View>

          <View style={styles.editorFooter}>
            <AppButton label="Cancel" onPress={onCancelSessionEdit} variant="secondary" />
            <AppButton label="Save Changes" onPress={onSaveSessionChanges} />
            <AppButton label="Delete" onPress={onDeleteSession} variant="secondary" />
          </View>
        </View>
      ) : (
        <>
          <AppButton label="Edit" onPress={onEditSession} variant="secondary" />
          <AppButton label="Delete" onPress={onDeleteSession} variant="secondary" />
        </>
      )}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  cardHeader: {
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  duration: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    fontVariant: ['tabular-nums'],
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
  editorFooter: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  exercise: {
    color: Colors.dark.text,
    fontSize: 15,
  },
  exerciseList: {
    gap: Spacing.one,
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
  inputsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  sessionEditor: {
    gap: Spacing.two,
    paddingTop: Spacing.two,
  },
  sessionStat: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
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
  setMeta: {
    color: Colors.dark.text,
    fontSize: 15,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
  },
  setName: {
    color: Colors.dark.textSecondary,
    flex: 1,
    fontSize: 15,
  },
  title: {
    color: Colors.dark.text,
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
  },
});
