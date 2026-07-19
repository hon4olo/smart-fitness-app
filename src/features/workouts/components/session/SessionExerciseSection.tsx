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
  onPlannedRepsChange: (exerciseId: string, index: number, field: 'reps', value: string) => void;
  onPlannedToggleSetCompletion: (exerciseId: string, index: number) => void;
  onPlannedWeightChange: (exerciseId: string, index: number, field: 'weight', value: string) => void;
  onRepsChange: (setId: string, value: string) => void;
  onToggleExpanded: (exerciseId: string) => void;
  onToggleSetCompletion: (setId: string) => void;
  onWeightChange: (setId: string, value: string) => void;
  previousSets?: Array<{ reps: number; weight: number }>;
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
  onPlannedRepsChange,
  onPlannedToggleSetCompletion,
  onPlannedWeightChange,
  onRepsChange,
  onToggleExpanded,
  onToggleSetCompletion,
  onWeightChange,
  previousSets,
}: SessionExerciseSectionProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const plannedSetCount = Math.max(exercise.targetSets ?? 0, exerciseSets.length);
  const collapsedRows = exerciseSets.length > 0
    ? exerciseSets.map((set, index) => ({
        id: set.id,
        label: `${index + 1}   ${set.weight > 0 ? `${set.weight} kg` : '- kg'}  ·  ${set.reps > 0 ? `${set.reps} Reps` : '- Reps'}`,
      }))
    : Array.from({ length: plannedSetCount }, (_, index) => ({
        id: `${exercise.id}-planned-${index}`,
        label: `${index + 1}   - kg  ·  - Reps`,
      }));

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
            collapsedRows.length > 0 ? (
              collapsedRows.map((row) => (
                <Text key={row.id} numberOfLines={1} style={styles.collapsedLine}>
                  {row.label}
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
            onPlannedRepsChange={(index, value) => onPlannedRepsChange(exercise.id, index, 'reps', value)}
            onPlannedToggleSetCompletion={(index) => onPlannedToggleSetCompletion(exercise.id, index)}
            onPlannedWeightChange={(index, value) => onPlannedWeightChange(exercise.id, index, 'weight', value)}
            onRepsChange={onRepsChange}
            onToggleSetCompletion={onToggleSetCompletion}
            onWeightChange={onWeightChange}
            previousSets={previousSets}
            targetSetCount={plannedSetCount}
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
      backgroundColor: '#282828',
      borderCurve: 'continuous',
      borderRadius: 999,
      justifyContent: 'center',
      minHeight: 62,
    },
    addSetLabel: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '500',
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
      backgroundColor: '#FFFFFF',
      borderColor: '#F3F3F3',
      borderCurve: 'continuous',
      borderRadius: 7,
      borderWidth: StyleSheet.hairlineWidth,
      height: 66,
      justifyContent: 'center',
      width: 44,
    },
    exerciseThumbLabel: {
      color: '#111111',
      fontSize: 16,
      fontWeight: '900',
    },
    exerciseTitle: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: '500',
      lineHeight: 24,
    },
    expanded: {
      gap: 18,
      paddingBottom: 34,
    },
    header: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: 20,
      paddingBottom: 24,
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
      color: '#0A84FF',
      fontSize: 17,
      fontWeight: '900',
      letterSpacing: 1,
      lineHeight: 22,
    },
    notesInput: {
      color: colors.textPrimary,
      fontSize: 15,
      minHeight: 24,
      paddingVertical: 0,
    },
    pressed: {
      opacity: 0.72,
    },
    restTimer: {
      alignSelf: 'flex-start',
    },
    restTimerLabel: {
      color: '#0A84FF',
      fontSize: 16,
      fontWeight: '500',
    },
    section: {
      borderTopColor: 'transparent',
      borderTopWidth: StyleSheet.hairlineWidth,
      gap: 0,
    },
  });
