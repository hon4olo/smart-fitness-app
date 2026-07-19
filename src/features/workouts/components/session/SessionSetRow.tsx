import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Colors } from '@/constants/theme';
import type { WorkoutRpe } from '@/types';
import { useAppTheme } from '@/theme/AppThemeProvider';

import { SESSION_TABLE_COLUMNS, SESSION_TABLE_GAPS, SESSION_TABLE_TOTAL_WIDTH } from './sessionTableLayout';

type SessionSetRowProps = {
  completed: boolean;
  draftValue: { reps: string; weight: string };
  index: number;
  actualRpe?: WorkoutRpe;
  onCommit: () => void;
  onEditRpe?: () => void;
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
  actualRpe,
  onCommit,
  onEditRpe,
  onLongPress,
  onRepsChange,
  onToggle,
  onWeightChange,
  previousLabel,
}: SessionSetRowProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isDark = colors.background === Colors.dark.background;

  return (
    <View style={styles.rowWrap}>
      <View style={[styles.row, completed && (isDark ? styles.rowCompletedDark : styles.rowCompletedLight)]}>
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
          style={[styles.inputCell, completed && styles.inputCellCompleted, styles.colWeight]}
          onChangeText={onWeightChange}
          onEndEditing={onCommit}
          onSubmitEditing={onCommit}
        />
        <View style={[styles.repsCell, styles.colReps]}>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            blurOnSubmit
            value={draftValue.reps}
            keyboardType="number-pad"
            placeholder="—"
            placeholderTextColor={colors.textSecondary}
            selectionColor={colors.accent}
            style={[styles.inputCell, styles.repsInput, completed && styles.inputCellCompleted]}
            onChangeText={onRepsChange}
            onEndEditing={onCommit}
            onSubmitEditing={onCommit}
          />
          {completed && actualRpe !== undefined ? (
            <Pressable accessibilityRole="button" hitSlop={8} onPress={onEditRpe} style={({ pressed }) => [styles.rpeBadge, pressed && styles.pressed]}>
              <Text style={styles.rpeBadgeLabel}>{actualRpe}</Text>
            </Pressable>
          ) : null}
        </View>
        <View style={[styles.completionCell, styles.colCompletion]}>
          <Pressable
            accessibilityRole="button"
            onLongPress={actualRpe !== undefined ? onEditRpe : onLongPress}
            onPress={onToggle}
            style={({ pressed }) => [styles.iconCell, completed && (isDark ? styles.iconCellCompletedDark : styles.iconCellCompletedLight), pressed && styles.pressed]}>
            <Text style={[styles.checkLabel, completed && styles.checkLabelCompleted]}>✓</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
});

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    cell: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: '400',
      lineHeight: 48,
      textAlign: 'center',
    },
    checkLabel: {
      color: colors.textOnAccent,
      fontSize: 20,
      fontWeight: '400',
      lineHeight: 22,
    },
    checkLabelCompleted: {
      color: colors.textOnAccent,
    },
    colCompletion: {
      marginLeft: SESSION_TABLE_GAPS.repsToCompletion,
      width: SESSION_TABLE_COLUMNS.completion,
    },
    completionCell: {
      alignItems: 'center',
      height: 48,
      justifyContent: 'center',
    },
    colPrevious: {
      marginLeft: SESSION_TABLE_GAPS.setToPrevious,
      textAlign: 'left',
      width: SESSION_TABLE_COLUMNS.previous,
    },
    colReps: {
      marginLeft: SESSION_TABLE_GAPS.weightToReps,
      width: SESSION_TABLE_COLUMNS.reps,
    },
    colSet: {
      width: SESSION_TABLE_COLUMNS.set,
    },
    colWeight: {
      marginLeft: SESSION_TABLE_GAPS.previousToWeight,
      width: SESSION_TABLE_COLUMNS.weight,
    },
    iconCell: {
      alignItems: 'center',
      backgroundColor: colors.surfaceElevated,
      borderCurve: 'continuous',
      borderRadius: 999,
      height: 30,
      justifyContent: 'center',
      width: 30,
    },
    iconCellCompletedDark: {
      backgroundColor: colors.success,
    },
    iconCellCompletedLight: {
      backgroundColor: '#2DBA20',
    },
    inputCell: {
      backgroundColor: colors.background,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: 3,
      borderWidth: StyleSheet.hairlineWidth,
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: '400',
      height: 30,
      includeFontPadding: false,
      lineHeight: 18,
      paddingHorizontal: 4,
      paddingVertical: 0,
      textAlign: 'center',
      textAlignVertical: 'center',
      fontVariant: ['tabular-nums'],
    },
    inputCellCompleted: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
    },
    previousCell: {
      color: colors.textMuted,
      fontSize: 15,
      lineHeight: 48,
    },
    pressed: {
      opacity: 0.72,
    },
    row: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 0,
      minHeight: 48,
      width: SESSION_TABLE_TOTAL_WIDTH,
    },
    rowCompletedDark: {
      backgroundColor: '#003D1C',
    },
    rowCompletedLight: {
      backgroundColor: '#D7F3CE',
    },
    rowWrap: {
      marginBottom: 0,
    },
    repsCell: {
      height: 30,
      justifyContent: 'center',
      position: 'relative',
    },
    repsInput: {
      marginLeft: 0,
      width: '100%',
    },
    rpeBadge: {
      alignItems: 'center',
      minHeight: 18,
      minWidth: 18,
      position: 'absolute',
      right: 20,
      top: -9,
    },
    rpeBadgeLabel: {
      color: colors.accent,
      fontSize: 9,
      fontVariant: ['tabular-nums'],
      fontWeight: '900',
      lineHeight: 11,
      textAlign: 'center',
    },
  });
