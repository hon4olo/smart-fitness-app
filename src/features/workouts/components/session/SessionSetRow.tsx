import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/theme/AppThemeProvider';

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
  const { colors } = useAppTheme();
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
        <Pressable accessibilityRole="button" onPress={onToggle} style={({ pressed }) => [styles.iconCell, styles.colCompletion, completed && styles.iconCellCompleted, pressed && styles.pressed]}>
          <Text style={[styles.checkLabel, completed && styles.checkLabelCompleted]}>✓</Text>
        </Pressable>
      </View>
    </View>
  );
});

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    cell: {
      color: colors.textPrimary,
      fontSize: 18,
      lineHeight: 46,
    },
    checkLabel: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '900',
      lineHeight: 18,
    },
    checkLabelCompleted: {
      color: '#FFFFFF',
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
      backgroundColor: colors.backgroundSecondary,
      borderCurve: 'continuous',
      borderRadius: 999,
      height: 38,
      justifyContent: 'center',
      marginLeft: Spacing.one,
    },
    iconCellCompleted: {
      backgroundColor: '#2DBA20',
    },
    inputCell: {
      backgroundColor: colors.surfacePrimary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: 8,
      borderWidth: StyleSheet.hairlineWidth,
      color: colors.textPrimary,
      fontSize: 17,
      height: 46,
      lineHeight: 23,
      paddingHorizontal: 4,
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
      gap: Spacing.two,
      minHeight: 58,
      width: '100%',
    },
    rowCompleted: {
      backgroundColor: '#D7F3CE',
    },
    rowWrap: {
      marginBottom: 0,
    },
  });
