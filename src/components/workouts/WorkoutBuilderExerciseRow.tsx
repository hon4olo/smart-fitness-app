import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';

import type { DraftWorkoutExercise } from './workout-builder-types';

type WorkoutBuilderExerciseRowProps = {
  canMoveDown: boolean;
  canMoveUp: boolean;
  exercise: DraftWorkoutExercise;
  onChange: (exerciseId: string, patch: Partial<DraftWorkoutExercise>) => void;
  onDelete: (exerciseId: string) => void;
  onDuplicate: (exerciseId: string) => void;
  onMove: (exerciseId: string, direction: -1 | 1) => void;
};

function MiniAction({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.miniAction, pressed && styles.pressed]}>
      <Text style={styles.miniActionLabel}>{label}</Text>
    </Pressable>
  );
}

export function WorkoutBuilderExerciseRow({
  canMoveDown,
  canMoveUp,
  exercise,
  onChange,
  onDelete,
  onDuplicate,
  onMove,
}: WorkoutBuilderExerciseRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.rowHeader}>
        <View style={styles.handle}>
          <Text style={styles.handleLabel}>≡</Text>
        </View>

        <View style={styles.headerContent}>
          <Text style={styles.exerciseIndex}>Exercise</Text>
          <TextInput
            onChangeText={(value) => onChange(exercise.id, { name: value })}
            placeholder="Bench press"
            placeholderTextColor={Colors.dark.textSecondary}
            style={styles.nameInput}
            value={exercise.name}
          />
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaField}>
          <Text style={styles.label}>Sets</Text>
          <TextInput
            keyboardType="number-pad"
            onChangeText={(value) => onChange(exercise.id, { targetSets: value })}
            placeholder="3"
            placeholderTextColor={Colors.dark.textSecondary}
            style={styles.input}
            value={exercise.targetSets}
          />
        </View>
        <View style={styles.metaField}>
          <Text style={styles.label}>Reps</Text>
          <TextInput
            keyboardType="number-pad"
            onChangeText={(value) => onChange(exercise.id, { targetReps: value })}
            placeholder="8"
            placeholderTextColor={Colors.dark.textSecondary}
            style={styles.input}
            value={exercise.targetReps}
          />
        </View>
        <View style={styles.metaField}>
          <Text style={styles.label}>Rest sec</Text>
          <TextInput
            keyboardType="number-pad"
            onChangeText={(value) => onChange(exercise.id, { restSeconds: value })}
            placeholder="90"
            placeholderTextColor={Colors.dark.textSecondary}
            style={styles.input}
            value={exercise.restSeconds}
          />
        </View>
      </View>

      <View style={styles.metaField}>
        <Text style={styles.label}>Notes</Text>
        <TextInput
          multiline
          onChangeText={(value) => onChange(exercise.id, { notes: value })}
          placeholder="Tempo, cues, or setup notes"
          placeholderTextColor={Colors.dark.textSecondary}
          style={styles.notesInput}
          value={exercise.notes}
        />
      </View>

      <View style={styles.actionsRow}>
        <View style={styles.actionCluster}>
          <MiniAction label="↑" onPress={() => onMove(exercise.id, -1)} />
          <MiniAction label="↓" onPress={() => onMove(exercise.id, 1)} />
          <MiniAction label="Duplicate" onPress={() => onDuplicate(exercise.id)} />
        </View>
        <MiniAction label="Delete" onPress={() => onDelete(exercise.id)} />
      </View>

      {!canMoveUp || !canMoveDown ? (
        <Text style={styles.hint}>{!canMoveUp && !canMoveDown ? 'Single exercise only' : 'Reorder when needed'}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  actionCluster: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  actionsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  exerciseIndex: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  handle: {
    alignItems: 'center',
    backgroundColor: Colors.dark.backgroundSelected,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  handleLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
  headerContent: {
    flex: 1,
    gap: Spacing.one,
  },
  hint: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
  },
  input: {
    backgroundColor: Colors.dark.background,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 8,
    borderWidth: 1,
    color: Colors.dark.text,
    fontSize: 15,
    minHeight: 44,
    paddingHorizontal: Spacing.two,
  },
  label: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  metaField: {
    flex: 1,
    gap: Spacing.one,
    minWidth: 92,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  miniAction: {
    alignItems: 'center',
    backgroundColor: Colors.dark.backgroundSelected,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 34,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  miniActionLabel: {
    color: Colors.dark.text,
    fontSize: 12,
    fontWeight: '700',
  },
  nameInput: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '800',
    minHeight: 44,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  notesInput: {
    backgroundColor: Colors.dark.background,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 8,
    borderWidth: 1,
    color: Colors.dark.text,
    fontSize: 14,
    minHeight: 72,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    textAlignVertical: 'top',
  },
  pressed: {
    opacity: 0.78,
  },
  row: {
    backgroundColor: Colors.dark.backgroundElement,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 12,
    borderWidth: 1,
    gap: Spacing.two,
    padding: Spacing.three,
  },
  rowHeader: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'flex-start',
  },
});
