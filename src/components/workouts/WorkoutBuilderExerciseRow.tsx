import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import { useLocalization } from '@/localization';
import { getWorkoutBuilderCopy } from '@/localization/workoutBuilderCopy';

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

function MiniAction({
  accessibilityLabel,
  disabled = false,
  label,
  onPress,
}: {
  accessibilityLabel: string;
  disabled?: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.miniAction,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}>
      <Text numberOfLines={2} style={styles.miniActionLabel}>
        {label}
      </Text>
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
  const { locale } = useLocalization();
  const copy = getWorkoutBuilderCopy(locale);

  return (
    <View style={styles.row}>
      <View style={styles.rowHeader}>
        <View accessibilityElementsHidden style={styles.handle}>
          <Text style={styles.handleLabel}>≡</Text>
        </View>

        <View style={styles.headerContent}>
          <Text style={styles.exerciseIndex}>{copy.exercise}</Text>
          <TextInput
            accessibilityLabel={copy.exercise}
            onChangeText={(value) => onChange(exercise.id, { name: value })}
            placeholder={copy.exercisePlaceholder}
            placeholderTextColor={Colors.dark.textSecondary}
            style={styles.nameInput}
            value={exercise.name}
          />
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaField}>
          <Text style={styles.label}>{copy.sets}</Text>
          <TextInput
            accessibilityLabel={copy.sets}
            keyboardType="number-pad"
            onChangeText={(value) => onChange(exercise.id, { targetSets: value })}
            placeholder="3"
            placeholderTextColor={Colors.dark.textSecondary}
            style={styles.input}
            value={exercise.targetSets}
          />
        </View>
        <View style={styles.metaField}>
          <Text style={styles.label}>{copy.reps}</Text>
          <TextInput
            accessibilityLabel={copy.reps}
            keyboardType="number-pad"
            onChangeText={(value) => onChange(exercise.id, { targetReps: value })}
            placeholder="8"
            placeholderTextColor={Colors.dark.textSecondary}
            style={styles.input}
            value={exercise.targetReps}
          />
        </View>
        <View style={styles.metaField}>
          <Text style={styles.label}>{copy.restSeconds}</Text>
          <TextInput
            accessibilityLabel={copy.restSeconds}
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
        <Text style={styles.label}>{copy.notes}</Text>
        <TextInput
          accessibilityLabel={copy.notes}
          multiline
          onChangeText={(value) => onChange(exercise.id, { notes: value })}
          placeholder={copy.exerciseNotesPlaceholder}
          placeholderTextColor={Colors.dark.textSecondary}
          style={styles.notesInput}
          value={exercise.notes}
        />
      </View>

      <View style={styles.actionsRow}>
        <View style={styles.actionCluster}>
          <MiniAction
            accessibilityLabel={copy.moveUp}
            disabled={!canMoveUp}
            label="↑"
            onPress={() => onMove(exercise.id, -1)}
          />
          <MiniAction
            accessibilityLabel={copy.moveDown}
            disabled={!canMoveDown}
            label="↓"
            onPress={() => onMove(exercise.id, 1)}
          />
          <MiniAction
            accessibilityLabel={copy.duplicate}
            label={copy.duplicate}
            onPress={() => onDuplicate(exercise.id)}
          />
        </View>
        <MiniAction
          accessibilityLabel={copy.delete}
          label={copy.delete}
          onPress={() => onDelete(exercise.id)}
        />
      </View>

      {!canMoveUp || !canMoveDown ? (
        <Text style={styles.hint}>
          {!canMoveUp && !canMoveDown
            ? copy.singleExerciseOnly
            : copy.reorderWhenNeeded}
        </Text>
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
    flexWrap: 'wrap',
    gap: Spacing.one,
    justifyContent: 'space-between',
  },
  disabled: {
    opacity: 0.4,
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
    flexShrink: 0,
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
    minWidth: 0,
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
    flexShrink: 1,
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
    maxWidth: '100%',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  miniActionLabel: {
    color: Colors.dark.text,
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
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
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.two,
  },
});
