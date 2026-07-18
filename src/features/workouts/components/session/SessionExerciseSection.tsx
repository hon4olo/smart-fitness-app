import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { WorkoutSet } from '@/context/AppContext';
import { Colors, Radii, Spacing } from '@/constants/theme';
import { useWorkoutTheme } from '@/features/workouts/workoutTheme';

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
  const { colors } = useWorkoutTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.card, exerciseSets.length > 0 && styles.cardBordered]}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <View style={styles.exerciseTitleLine}>
            <View style={styles.exerciseIcon}>
              <Text style={styles.exerciseIconLabel}>{exercise.name.slice(0, 1).toUpperCase()}</Text>
            </View>
            <Text selectable style={[styles.exerciseTitle, exerciseCompleted && styles.exerciseTitleCompleted]}>
              {exercise.name}
            </Text>
          </View>
          <Text selectable style={styles.exerciseMeta}>
            Rest · {exercise.restSeconds ?? 90}s
          </Text>
          {exercise.notes && onNotesPress ? (
            <Pressable accessibilityRole="button" onPress={onNotesPress} style={({ pressed }) => [styles.notesButton, pressed && styles.pressed]}>
              <Text style={styles.notesLabel}>Notes</Text>
            </Pressable>
          ) : null}
        </View>
        <Pressable accessibilityRole="button" hitSlop={12} onPress={() => onLongPressExercise(exercise.id, exercise.name)} style={({ pressed }) => [styles.menuButton, pressed && styles.pressed]}>
          <Text style={styles.menuLabel}>⋯</Text>
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
      color: colors.accent,
      fontSize: 15,
      fontWeight: '800',
    },
    addSetRow: {
      alignItems: 'flex-start',
      minHeight: 36,
      paddingTop: 0,
    },
    card: {
      gap: 4,
      paddingVertical: 6,
    },
    cardBordered: {
      borderTopColor: colors.borderSubtle,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    exerciseIcon: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderCurve: 'continuous',
      borderRadius: 12,
      height: 32,
      justifyContent: 'center',
      width: 32,
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
      marginTop: 0,
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
    exerciseTitleLine: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 6,
    },
    header: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: 4,
    },
    headerCopy: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    menuButton: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderCurve: 'continuous',
      borderRadius: 999,
      height: 32,
      justifyContent: 'center',
      width: 32,
    },
    menuLabel: {
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: '700',
      lineHeight: 20,
      marginTop: -2,
    },
    notesButton: {
      alignSelf: 'flex-start',
    },
    notesLabel: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '800',
    },
    pressed: {
      opacity: 0.72,
    },
  });
