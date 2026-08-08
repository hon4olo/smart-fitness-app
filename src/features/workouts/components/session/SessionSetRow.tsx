import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useLocalization } from '@/localization';
import { useAppTheme } from '@/theme/AppThemeProvider';
import type { WorkoutRpe } from '@/types';
import { useUnitPreferences } from '@/units';

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
  const { formatNumber, t } = useLocalization();
  const { weight } = useUnitPreferences();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isDark = colors.background === Colors.dark.background;
  const setLabel = formatNumber(index + 1, { maximumFractionDigits: 0 });

  return (
    <View style={styles.rowWrap}>
      <View
        style={[
          styles.row,
          completed && (isDark ? styles.rowCompletedDark : styles.rowCompletedLight),
        ]}>
        <Text selectable style={[styles.cell, styles.colSet]}>
          {setLabel}
        </Text>
        <Text
          selectable
          numberOfLines={1}
          style={[styles.cell, styles.previousCell, styles.colPrevious]}>
          {previousLabel}
        </Text>
        <TextInput
          accessibilityLabel={t('workouts.session.weightInput', {
            set: setLabel,
            unit: weight,
          })}
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
            accessibilityLabel={t('workouts.session.repsInput', { set: setLabel })}
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
            <Pressable
              accessibilityLabel={t('workouts.session.editRpe', { set: setLabel })}
              accessibilityRole="button"
              hitSlop={8}
              onPress={onEditRpe}
              style={({ pressed }) => [styles.rpeBadge, pressed && styles.pressed]}>
              <Text style={styles.rpeBadgeLabel}>{actualRpe}</Text>
            </Pressable>
          ) : null}
        </View>
        <View style={[styles.completionCell, styles.colCompletion]}>
          <Pressable
            accessibilityLabel={t(
              completed
                ? 'workouts.session.markSetIncomplete'
                : 'workouts.session.markSetComplete',
              { set: setLabel },
            )}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: completed }}
            onLongPress={actualRpe !== undefined ? onEditRpe : onLongPress}
            onPress={onToggle}
            style={({ pressed }) => [
              styles.iconCell,
              completed && (isDark ? styles.iconCellCompletedDark : styles.iconCellCompletedLight),
              pressed && styles.pressed,
            ]}>
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
      flexBasis: 0,
      flexGrow: SESSION_TABLE_COLUMNS.previous,
      marginLeft: SESSION_TABLE_GAPS.setToPrevious,
      minWidth: 0,
      textAlign: 'left',
    },
    colReps: {
      flexBasis: 0,
      flexGrow: SESSION_TABLE_COLUMNS.reps,
      marginLeft: SESSION_TABLE_GAPS.weightToReps,
      minWidth: 0,
    },
    colSet: {
      width: SESSION_TABLE_COLUMNS.set,
    },
    colWeight: {
      flexBasis: 0,
      flexGrow: SESSION_TABLE_COLUMNS.weight,
      marginLeft: SESSION_TABLE_GAPS.previousToWeight,
      minWidth: 0,
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
      fontVariant: ['tabular-nums'],
      fontWeight: '400',
      height: 30,
      includeFontPadding: false,
      lineHeight: 18,
      paddingHorizontal: 4,
      paddingVertical: 0,
      textAlign: 'center',
      textAlignVertical: 'center',
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
      maxWidth: SESSION_TABLE_TOTAL_WIDTH,
      minHeight: 48,
      width: '100%',
    },
    rowCompletedDark: {
      backgroundColor: '#003D1C',
    },
    rowCompletedLight: {
      backgroundColor: '#D7F3CE',
    },
    rowWrap: {
      marginBottom: 0,
      width: '100%',
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
      right: 8,
      top: -10,
    },
    rpeBadgeLabel: {
      color: colors.textPrimary,
      fontSize: 13,
      fontVariant: ['tabular-nums'],
      fontWeight: '900',
      lineHeight: 15,
      textAlign: 'center',
    },
  });
