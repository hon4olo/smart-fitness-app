import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { WorkoutSet } from '@/context/AppContext';
import { Colors, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/theme/AppThemeProvider';

import { SessionSetTable } from './SessionSetTable';
import type { SessionDraftInputs, SessionExercise } from './types';

type SessionExerciseSectionProps = {
  draftInputs: SessionDraftInputs;
  exercise: SessionExercise;
  exerciseCompleted: boolean;
  exerciseSets: WorkoutSet[];
  expanded: boolean;
  onAddSet: (exerciseId: string) => void;
  onCommitRowInputs: (setId: string) => void;
  onLongPressExercise: (exerciseId: string, exerciseName: string) => void;
  onLongPressRow: (setId: string) => void;
  onNotesPress?: () => void;
  onRepsChange: (setId: string, value: string) => void;
  onToggleExpanded: (exerciseId: string) => void;
  onToggleSetCompletion: (setId: string) => void;
  onWeightChange: (setId: string, value: string) => void;
  previousSet?: { reps: number; weight: number } | null;
};

export const SessionExerciseSection = memo(function SessionExerciseSection({
  draftInputs,
  exercise,
  exerciseSets,
  expanded,
  onAddSet,
  onCommitRowInputs,
  onLongPressExercise,
  onLongPressRow,
  onNotesPress,
  onRepsChange,
  onToggleExpanded,
  onToggleSetCompletion,
  onWeightChange,
  previousSet,
}: SessionExerciseSectionProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.section}>
      <Pressable onPress={() => onToggleExpanded(exercise.id)} style={({ pressed }) => [styles.header, pressed && styles.pressed]}>
        <View style={styles.exerciseThumb}>
          <Text style={styles.exerciseThumbLabel}>{exercise.name.slice(0, 1).toUpperCase()}</Text>
          <Text style={styles.exerciseHelp}>?</Text>
        </View>
        <View style={styles.headerCopy}>
          <Text selectable numberOfLines={1} style={styles.exerciseTitle}>
            {exercise.name}
          </Text>
          {!expanded ? (
            exerciseSets.length > 0 ? (
              exerciseSets.map((set, index) => (
                <Text key={set.id} numberOfLines={1} style={styles.collapsedLine}>
                  {index + 1}   {set.weight > 0 ? `${set.weight} kg` : '- kg'}  ·  {set.reps > 0 ? `${set.reps} Reps` : '- Reps'}
                </Text>
              ))
            ) : (
              <Text style={styles.collapsedLine}>No sets added</Text>
            )
          ) : null}
        </View>
        <Pressable accessibilityRole="button" hitSlop={12} onPress={() => onLongPressExercise(exercise.id, exercise.name)} style={({ pressed }) => [styles.menuButton, pressed && styles.pressed]}>
          <Text style={styles.menuLabel}>•••</Text>
        </Pressable>
      </Pressable>

      {expanded ? (
        <View style={styles.expanded}>
          <TextInput placeholder="Notes..." placeholderTextColor={colors.textMuted} style={styles.notesInput} />
          <Pressable disabled={!onNotesPress} onPress={onNotesPress} style={({ pressed }) => [styles.restTimer, pressed && styles.pressed]}>
            <Text style={styles.restTimerLabel}>⏱ Rest Timer: Off</Text>
          </Pressable>
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
          <Pressable accessibilityRole="button" onPress={() => onAddSet(exercise.id)} style={({ pressed }) => [styles.addSetButton, pressed && styles.pressed]}>
            <Text style={styles.addSetLabel}>+ Add set</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
});

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    addSetButton: {
      alignItems: 'center',
      backgroundColor: colors.backgroundSecondary,
      borderCurve: 'continuous',
      borderRadius: 999,
      justifyContent: 'center',
      minHeight: 52,
    },
    addSetLabel: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '800',
    },
    collapsedLine: {
      color: colors.textSecondary,
      fontSize: 15,
      fontVariant: ['tabular-nums'],
      lineHeight: 22,
    },
    exerciseHelp: {
      bottom: 2,
      color: colors.textMuted,
      fontSize: 10,
      position: 'absolute',
      right: 5,
    },
    exerciseThumb: {
      alignItems: 'center',
      backgroundColor: colors.surfacePrimary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: 8,
      borderWidth: StyleSheet.hairlineWidth,
      height: 64,
      justifyContent: 'center',
      width: 58,
    },
    exerciseThumbLabel: {
      color: colors.textPrimary,
      fontSize: 21,
      fontWeight: '900',
    },
    exerciseTitle: {
      color: colors.textPrimary,
      fontSize: 21,
      fontWeight: '500',
      lineHeight: 27,
    },
    expanded: {
      gap: Spacing.two,
      paddingBottom: Spacing.three,
    },
    header: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: Spacing.two,
      paddingVertical: Spacing.two,
    },
    headerCopy: {
      flex: 1,
      minWidth: 0,
    },
    menuButton: {
      alignItems: 'center',
      height: 40,
      justifyContent: 'center',
      width: 40,
    },
    menuLabel: {
      color: '#0A8DFF',
      fontSize: 20,
      fontWeight: '900',
      letterSpacing: 1,
      lineHeight: 22,
    },
    notesInput: {
      color: colors.textPrimary,
      fontSize: 17,
      minHeight: 38,
      paddingVertical: Spacing.one,
    },
    pressed: {
      opacity: 0.72,
    },
    restTimer: {
      alignSelf: 'flex-start',
    },
    restTimerLabel: {
      color: '#0A8DFF',
      fontSize: 17,
      fontWeight: '800',
    },
    section: {
      borderTopColor: colors.borderSubtle,
      borderTopWidth: StyleSheet.hairlineWidth,
      gap: Spacing.one,
    },
  });
