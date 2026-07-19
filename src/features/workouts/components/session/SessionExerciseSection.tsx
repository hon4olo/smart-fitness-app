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
        completed: set.completed !== false,
        id: set.id,
        indexLabel: `${index + 1}`,
        valueLabel: `${set.weight > 0 ? `${set.weight} kg` : '- kg'}  ·  ${set.reps > 0 ? `${set.reps} Reps` : '- Reps'}`,
      }))
    : Array.from({ length: plannedSetCount }, (_, index) => ({
        completed: false,
        id: `${exercise.id}-planned-${index}`,
        indexLabel: `${index + 1}`,
        valueLabel: '- kg  ·  - Reps',
      }));

  return (
    <View style={styles.section}>
      <Pressable onPress={() => onToggleExpanded(exercise.id)} style={({ pressed }) => [styles.header, expanded && styles.headerExpanded, pressed && styles.pressed]}>
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
                <View key={row.id} style={styles.collapsedLineRow}>
                  {row.completed ? (
                    <View style={styles.collapsedCompletedMarker}>
                      <Text style={styles.collapsedCompletedMarkerLabel}>✓</Text>
                    </View>
                  ) : null}
                  <Text numberOfLines={1} style={styles.collapsedIndex}>
                    {row.indexLabel}
                  </Text>
                  <Text numberOfLines={1} style={styles.collapsedLine}>
                    {row.valueLabel}
                  </Text>
                </View>
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
            <Text style={styles.restTimerLabel}>Rest Timer: Off</Text>
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
      backgroundColor: colors.surfaceElevated,
      borderCurve: 'continuous',
      borderRadius: 999,
      alignSelf: 'center',
      justifyContent: 'center',
      minHeight: 46,
      width: '92%',
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
    collapsedCompletedMarker: {
      alignItems: 'center',
      backgroundColor: colors.success,
      borderCurve: 'continuous',
      borderRadius: 4,
      height: 17,
      justifyContent: 'center',
      width: 17,
    },
    collapsedCompletedMarkerLabel: {
      color: colors.textOnAccent,
      fontSize: 12,
      fontWeight: '900',
      lineHeight: 13,
    },
    collapsedIndex: {
      color: colors.textPrimary,
      fontSize: 15,
      fontVariant: ['tabular-nums'],
      lineHeight: 22,
      width: 20,
    },
    collapsedLineRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 9,
      minHeight: 22,
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
      fontSize: 17,
      fontWeight: '500',
      lineHeight: 22,
    },
    expanded: {
      gap: 15,
      paddingBottom: 34,
    },
    header: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: 13,
      paddingBottom: 24,
    },
    headerExpanded: {
      alignItems: 'center',
      paddingBottom: 22,
    },
    headerCopy: {
      flex: 1,
      minWidth: 0,
    },
    menuButton: {
      alignItems: 'center',
      height: 34,
      justifyContent: 'center',
      width: 34,
    },
    menuLabel: {
      color: colors.accent,
      fontSize: 14,
      fontWeight: '900',
      letterSpacing: 1.4,
      lineHeight: 18,
    },
    notesInput: {
      color: colors.textMuted,
      fontSize: 15,
      lineHeight: 22,
      minHeight: 22,
      paddingVertical: 0,
    },
    pressed: {
      opacity: 0.72,
    },
    restTimer: {
      alignItems: 'center',
      alignSelf: 'flex-start',
      flexDirection: 'row',
    },
    restTimerLabel: {
      color: colors.accent,
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 18,
    },
    section: {
      borderTopColor: 'transparent',
      borderTopWidth: StyleSheet.hairlineWidth,
      gap: 0,
    },
  });
