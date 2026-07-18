import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useWorkoutTheme } from '@/features/workouts/workoutTheme';

import { SESSION_TABLE_COLUMNS } from './sessionTableLayout';

type SessionSetRowProps = {
  completed: boolean;
  draftValue: { reps: string; weight: string };
  index: number;
  onCommit: () => void;
  onLongPress: () => void;
  onRepsChange: (value: string) => void;
  onToggle: () => void;
  onWeightChange: (value: string) => void;
  previousLabel: string;
};

export const SessionSetRow = memo(function SessionSetRow({
  completed,
  draftValue,
  index,
  onCommit,
  onRepsChange,
  onToggle,
  onWeightChange,
  previousLabel,
}: SessionSetRowProps) {
  const { colors } = useWorkoutTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.rowWrap}>
      <View style={[styles.row, completed && styles.rowCompleted]}>
        <Text selectable style={[styles.cell, styles.colSet]}>
          {index + 1}
        </Text>
        <Text selectable numberOfLines={1} style={[styles.cell, styles.previousCell, styles.colPrevious]}>
          {previousLabel}
        </Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          blurOnSubmit
          value={draftValue.weight}
          keyboardType="decimal-pad"
          placeholder="—"
          placeholderTextColor={colors.textSecondary}
          selectionColor={colors.accent}
          style={[styles.inputCell, styles.colWeight]}
          onChangeText={onWeightChange}
          onEndEditing={onCommit}
          onSubmitEditing={onCommit}
        />
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          blurOnSubmit
          value={draftValue.reps}
          keyboardType="number-pad"
          placeholder="—"
          placeholderTextColor={colors.textSecondary}
          selectionColor={colors.accent}
          style={[styles.inputCell, styles.colReps]}
          onChangeText={onRepsChange}
          onEndEditing={onCommit}
          onSubmitEditing={onCommit}
        />
        <Pressable accessibilityRole="button" onPress={onToggle} style={({ pressed }) => [styles.iconCell, styles.colCompletion, pressed && styles.pressed]}>
          <Text style={[styles.checkLabel, completed && styles.checkLabelCompleted]}>{completed ? '✓' : '○'}</Text>
        </Pressable>
      </View>
    </View>
  );
});

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    cell: {
      color: colors.textPrimary,
      fontSize: 16,
      lineHeight: 23,
    },
    checkLabel: {
      color: colors.textSecondary,
      fontSize: 18,
      fontWeight: '900',
      lineHeight: 18,
    },
    checkLabelCompleted: {
      color: colors.accent,
    },
    colCompletion: {
      width: SESSION_TABLE_COLUMNS.completion,
    },
    colPrevious: {
      minWidth: 0,
      width: SESSION_TABLE_COLUMNS.previous,
    },
    colReps: {
      width: SESSION_TABLE_COLUMNS.reps,
    },
    colSet: {
      width: SESSION_TABLE_COLUMNS.set,
    },
    colWeight: {
      width: SESSION_TABLE_COLUMNS.weight,
    },
    iconCell: {
      alignItems: 'center',
      height: 40,
      justifyContent: 'center',
    },
    inputCell: {
      color: colors.textPrimary,
      fontSize: 16,
      height: 34,
      lineHeight: 23,
      paddingHorizontal: 0,
      textAlign: 'center',
      fontVariant: ['tabular-nums'],
    },
    previousCell: {
      color: colors.textSecondary,
    },
    pressed: {
      opacity: 0.72,
    },
    row: {
      alignItems: 'center',
      flexDirection: 'row',
      minHeight: 34,
    },
    rowCompleted: {
      opacity: 0.82,
    },
    rowWrap: {
      marginBottom: 0,
    },
  });
