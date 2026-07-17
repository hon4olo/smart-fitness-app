import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { WorkoutSet } from '@/context/AppContext';
import { Colors, Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/theme/AppThemeProvider';

import { SessionSetTable } from './SessionSetTable';
import type { SessionDraftInputs, SessionExercise } from './types';

type SessionExerciseSectionProps = {
  draftInputs: SessionDraftInputs;
  exercise: SessionExercise;
  exerciseCompleted: boolean;
  exerciseSets: WorkoutSet[];
  onAddSet: (exerciseId: string) => void;
  onCommitRowInputs: (setId: string) => void;
  onLongPressExercise: (exerciseId: string, exerciseName: string) => void;
  onLongPressRow: (setId: string) => void;
  onNotesPress?: () => void;
  onRepsChange: (setId: string, value: string) => void;
  onToggleSetCompletion: (setId: string) => void;
  onWeightChange: (setId: string, value: string) => void;
  previousSet?: { reps: number; weight: number } | null;
};

export const SessionExerciseSection = memo(function SessionExerciseSection({
  draftInputs,
  exercise,
  exerciseCompleted,
  exerciseSets,
  onAddSet,
  onCommitRowInputs,
  onLongPressExercise,
  onLongPressRow,
  onNotesPress,
  onRepsChange,
  onToggleSetCompletion,
  onWeightChange,
  previousSet,
}: SessionExerciseSectionProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.section, exerciseSets.length > 0 && styles.sectionDivider]}>
      <View style={styles.sectionHeader}>
        <View style={styles.exerciseHeaderCopy}>
          <View style={styles.exerciseTitleLine}>
            <View style={styles.exerciseIcon}>
              <Text style={styles.exerciseIconLabel}>{exercise.name.slice(0, 1).toUpperCase()}</Text>
            </View>
            <Text selectable style={[styles.exerciseTitle, exerciseCompleted && styles.exerciseTitleCompleted]}>
              {exercise.name}
            </Text>
          </View>
          {exercise.notes && onNotesPress ? (
            <Pressable accessibilityRole="button" onPress={onNotesPress} style={({ pressed }) => [styles.notesAction, pressed && styles.pressed]}>
              <Text style={styles.notesActionLabel}>Notes</Text>
            </Pressable>
          ) : null}
          <Text selectable style={styles.exerciseMeta}>
            Rest · {exercise.restSeconds ?? 90}s
          </Text>
          <Text selectable style={styles.exerciseState}>
            {exerciseCompleted ? 'Complete' : `${exerciseSets.length} set${exerciseSets.length === 1 ? '' : 's'}`}
          </Text>
        </View>
        <Pressable accessibilityRole="button" hitSlop={12} onPress={() => onLongPressExercise(exercise.id, exercise.name)} style={({ pressed }) => [styles.rowMenuButton, pressed && styles.pressed]}>
          <Text style={styles.rowMenuLabel}>⋯</Text>
        </Pressable>
      </View>

      <SessionSetTable
        draftInputs={draftInputs}
        onCommitRowInputs={onCommitRowInputs}
        onLongPressRow={onLongPressRow}
        onRepsChange={onRepsChange}
        onToggleSetCompletion={onToggleSetCompletion}
        onWeightChange={onWeightChange}
        previousSet={previousSet}
        sets={exerciseSets}
      />

      <Pressable accessibilityRole="button" onPress={() => onAddSet(exercise.id)} style={({ pressed }) => [styles.addSetRow, pressed && styles.pressed]}>
        <Text style={styles.addSetLabel}>+ Add set</Text>
      </Pressable>
    </View>
  );
});

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    addSetLabel: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: '800',
    },
    addSetRow: {
      alignItems: 'flex-start',
      minHeight: 44,
      paddingTop: Spacing.one,
    },
    exerciseHeaderCopy: {
      flex: 1,
      gap: 4,
    },
    exerciseIcon: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderCurve: 'continuous',
      borderRadius: 12,
      height: 34,
      justifyContent: 'center',
      width: 34,
    },
    exerciseIconLabel: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: '900',
    },
    exerciseMeta: {
      color: colors.textSecondary,
      fontSize: 12,
      fontVariant: ['tabular-nums'],
    },
    exerciseState: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '700',
      lineHeight: 18,
    },
    exerciseTitle: {
      color: colors.textPrimary,
      flexShrink: 1,
      fontSize: 18,
      fontWeight: '900',
      letterSpacing: -0.2,
      lineHeight: 24,
    },
    exerciseTitleCompleted: {
      color: colors.textSecondary,
    },
    notesAction: {
      alignSelf: 'flex-start',
    },
    notesActionLabel: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '800',
    },
    pressed: {
      opacity: 0.72,
    },
    rowMenuButton: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderCurve: 'continuous',
      borderRadius: 999,
      height: 34,
      justifyContent: 'center',
      width: 34,
    },
    rowMenuLabel: {
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: '700',
      lineHeight: 20,
      marginTop: -2,
    },
    section: {
      gap: Spacing.two,
      paddingVertical: Spacing.three,
    },
    sectionDivider: {
      borderTopColor: colors.borderSubtle,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    sectionHeader: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: Spacing.two,
    },
    exerciseTitleLine: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.two,
    },
  });
