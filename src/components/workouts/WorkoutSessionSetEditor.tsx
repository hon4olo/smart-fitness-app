import { StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing } from '@/constants/theme';
import type { WorkoutSessionPreviousSet, WorkoutSessionPr, PlannedExercise } from '@/lib/workouts/workout-session';

type WorkoutSessionSetEditorProps = {
  editingSetId?: string;
  exercisePrs: WorkoutSessionPr[];
  onCancelEdit: () => void;
  onRepsChange: (value: string) => void;
  onSaveSet: () => void;
  onWeightChange: (value: string) => void;
  previousSets: WorkoutSessionPreviousSet[];
  reps: string;
  selectedExercise?: PlannedExercise;
  weight: string;
};

export function WorkoutSessionSetEditor({
  editingSetId,
  exercisePrs,
  onCancelEdit,
  onRepsChange,
  onSaveSet,
  onWeightChange,
  previousSets,
  reps,
  selectedExercise,
  weight,
}: WorkoutSessionSetEditorProps) {
  return (
    <AppCard>
      <Text selectable style={styles.sectionTitle}>
        Selected exercise
      </Text>
      <Text selectable style={styles.selectedExerciseName}>
        {selectedExercise?.name ?? 'No exercise selected'}
      </Text>

      <View style={styles.infoGrid}>
        <View style={styles.infoPill}>
          <Text style={styles.infoLabel}>Targets</Text>
          <Text style={styles.infoValue}>{selectedExercise ? `${selectedExercise.targetSets ?? 3} x ${selectedExercise.targetReps ?? 8}` : '—'}</Text>
        </View>
        <View style={styles.infoPill}>
          <Text style={styles.infoLabel}>Rest</Text>
          <Text style={styles.infoValue}>{selectedExercise ? `${selectedExercise.restSeconds ?? 90}s` : '—'}</Text>
        </View>
      </View>

      <View style={styles.historyBlock}>
        <Text selectable style={styles.historyTitle}>
          Previous sets
        </Text>
        {previousSets.length === 0 ? (
          <Text selectable style={styles.emptyHistory}>
            No previous sets yet.
          </Text>
        ) : (
          previousSets.map((set) => (
            <View key={set.id} style={styles.historyRow}>
              <Text selectable style={styles.historyDate}>
                {set.workoutDate}
              </Text>
              <Text selectable style={styles.historyMeta}>
                {set.weight} kg x {set.reps}
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.historyBlock}>
        <Text selectable style={styles.historyTitle}>
          Exercise PRs
        </Text>
        {exercisePrs.length === 0 ? (
          <Text selectable style={styles.emptyHistory}>
            No PRs yet.
          </Text>
        ) : (
          exercisePrs.map((pr) => (
            <View key={pr.id} style={styles.prRow}>
              <View style={styles.prContent}>
                <Text selectable style={styles.prLabel}>
                  {pr.label}
                </Text>
                <Text selectable style={styles.prValue}>
                  {pr.value}
                </Text>
              </View>
              <Text selectable style={styles.historyDate}>
                {pr.date}
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.inputsRow}>
        <View style={styles.inputGroup}>
          <Text selectable style={styles.inputLabel}>
            Weight
          </Text>
          <TextInput
            keyboardType="decimal-pad"
            onChangeText={onWeightChange}
            placeholder="0"
            placeholderTextColor={Colors.dark.textSecondary}
            style={styles.input}
            value={weight}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text selectable style={styles.inputLabel}>
            Reps
          </Text>
          <TextInput
            keyboardType="number-pad"
            onChangeText={onRepsChange}
            placeholder="0"
            placeholderTextColor={Colors.dark.textSecondary}
            style={styles.input}
            value={reps}
          />
        </View>
      </View>

      <AppButton label={editingSetId ? 'Save set' : 'Add set'} onPress={onSaveSet} />
      {editingSetId ? <AppButton label="Cancel edit" onPress={onCancelEdit} variant="secondary" /> : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  emptyHistory: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
  },
  historyBlock: {
    gap: Spacing.one,
  },
  historyDate: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
  },
  historyMeta: {
    color: Colors.dark.text,
    fontSize: 14,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
  },
  historyRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  historyTitle: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  infoLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  infoPill: {
    backgroundColor: Colors.dark.backgroundSelected,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    minWidth: 120,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  infoValue: {
    color: Colors.dark.text,
    fontSize: 15,
    fontWeight: '800',
  },
  input: {
    backgroundColor: Colors.dark.background,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 8,
    borderWidth: 1,
    color: Colors.dark.text,
    fontSize: 18,
    fontVariant: ['tabular-nums'],
    minHeight: 48,
    paddingHorizontal: Spacing.two,
  },
  inputGroup: {
    flex: 1,
    gap: Spacing.one,
    minWidth: 120,
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
  prContent: {
    flex: 1,
    gap: Spacing.one,
  },
  prLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  prRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  prValue: {
    color: Colors.dark.text,
    fontSize: 15,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
  },
  sectionTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '800',
  },
  selectedExerciseName: {
    color: Colors.dark.accent,
    fontSize: 20,
    fontWeight: '900',
  },
});
