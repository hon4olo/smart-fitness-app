import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, TextInput } from 'react-native';

import type { WorkoutSet } from '@/context/AppContext';
import { Colors, Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/theme/AppThemeProvider';

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
  set: WorkoutSet;
};

export const SessionSetRow = memo(function SessionSetRow({
  completed,
  draftValue,
  index,
  onCommit,
  onLongPress,
  onRepsChange,
  onToggle,
  onWeightChange,
  previousLabel,
  set,
}: SessionSetRowProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable accessibilityRole="button" delayLongPress={300} onLongPress={onLongPress} style={({ pressed }) => [styles.row, completed && styles.rowCompleted, pressed && styles.rowPressed]}>
      <Text selectable style={[styles.cell, styles.colSet]}>{index + 1}</Text>
      <Text selectable numberOfLines={1} style={[styles.cell, styles.previousCell, styles.colPrevious]}>{previousLabel}</Text>
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        blurOnSubmit
        defaultValue={draftValue.weight}
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
        defaultValue={draftValue.reps}
        keyboardType="number-pad"
        placeholder="—"
        placeholderTextColor={colors.textSecondary}
        selectionColor={colors.accent}
        style={[styles.inputCell, styles.colReps]}
        onChangeText={onRepsChange}
        onEndEditing={onCommit}
        onSubmitEditing={onCommit}
      />
      <Pressable accessibilityRole="button" onPress={onToggle} style={({ pressed }) => [styles.checkButton, pressed && styles.pressed]}>
        <Text style={[styles.checkLabel, completed && styles.checkLabelCompleted]}>{completed ? '✓' : '○'}</Text>
      </Pressable>
    </Pressable>
  );
});

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    cell: {
      color: colors.textPrimary,
      fontSize: 16,
      lineHeight: 23,
    },
    checkButton: {
      alignItems: 'center',
      height: 36,
      justifyContent: 'center',
      width: 36,
    },
    checkLabel: {
      color: colors.textSecondary,
      fontSize: 20,
      fontWeight: '900',
      lineHeight: 20,
    },
    checkLabelCompleted: {
      color: '#27C46A',
    },
    colPrevious: {
      width: 112,
    },
    colReps: {
      width: 64,
    },
    colSet: {
      width: 40,
    },
    colWeight: {
      flex: 1,
      minWidth: 82,
    },
    inputCell: {
      color: colors.textPrimary,
      fontSize: 16,
      height: 38,
      lineHeight: 23,
      paddingHorizontal: 0,
      textAlign: 'center',
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
      minHeight: 46,
    },
    rowCompleted: {
      opacity: 0.82,
    },
    rowPressed: {
      backgroundColor: colors.surfaceSecondary,
      borderCurve: 'continuous',
      borderRadius: Radii.medium,
    },
  });
