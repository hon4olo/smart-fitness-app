import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { WorkoutSet } from '@/context/AppContext';
import { Colors } from '@/constants/theme';
import { useLocalization } from '@/localization';
import { useAppTheme } from '@/theme/AppThemeProvider';
import { formatWeightValue, useUnitPreferences } from '@/units';

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
  onEditSetRpe: (setId: string) => void;
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
  onEditSetRpe,
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
  const { formatNumber, formatPlural, t } = useLocalization();
  const { weight: weightUnit } = useUnitPreferences();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const plannedSetCount = Math.max(exercise.targetSets ?? 0, exerciseSets.length);
  const collapsedRows = exerciseSets.length > 0
    ? exerciseSets.map((set, index) => ({
        completed: set.completed !== false,
        id: set.id,
        indexLabel: formatNumber(index + 1, { maximumFractionDigits: 0 }),
        valueLabel: `${set.weight > 0 ? `${formatWeightValue(set.weight, weightUnit)} ${weightUnit}` : `— ${weightUnit}`}  ·  ${set.reps > 0 ? formatPlural('workouts.session.repCount', set.reps) : `— ${t('workouts.session.reps')}`}`,
      }))
    : Array.from({ length: plannedSetCount }, (_, index) => ({
        completed: false,
        id: `${exercise.id}-planned-${index}`,
        indexLabel: formatNumber(index + 1, { maximumFractionDigits: 0 }),
        valueLabel: `— ${weightUnit}  ·  — ${t('workouts.session.reps')}`,
      }));
  const expandLabel = t(
    expanded ? 'workouts.session.collapseExercise' : 'workouts.session.expandExercise',
    { exercise: exercise.name },
  );

  return (
    <View style={styles.section}>
      <Pressable
        accessibilityLabel={expandLabel}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => onToggleExpanded(exercise.id)}
        style={({ pressed }) => [
          styles.header,
          expanded && styles.headerExpanded,
          pressed && styles.pressed,
        ]}>
        <View style={styles.exerciseThumb}>
          <Text style={styles.exerciseThumbLabel}>{exercise.name.slice(0, 1).toUpperCase()}</Text>
          <Text style={styles.exerciseHelp}>?</Text>
        </View>
        <View style={styles.headerCopy}>
          <Text selectable numberOfLines={2} style={styles.exerciseTitle}>
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
              <Text style={styles.collapsedLine}>{t('workouts.session.noSets')}</Text>
            )
          ) : null}
        </View>
        <Pressable
          accessibilityLabel={t('workouts.session.exerciseActions', {
            exercise: exercise.name,
          })}
          accessibilityRole="button"
          hitSlop={12}
          onPress={() => onLongPressExercise(exercise.id, exercise.name)}
          style={({ pressed }) => [styles.menuButton, pressed && styles.pressed]}>
          <Text style={styles.menuLabel}>•••</Text>
        </Pressable>
      </Pressable>

      {expanded ? (
        <View style={styles.expanded}>
          <TextInput
            accessibilityLabel={t('workouts.session.notesForExercise', {
              exercise: exercise.name,
            })}
            placeholder={t('workouts.session.notesPlaceholder')}
            placeholderTextColor={colors.textMuted}
            style={styles.notesInput}
          />
          <Pressable
            accessibilityLabel={t('workouts.session.restTimerOff')}
            accessibilityRole="button"
            accessibilityState={{ disabled: !onNotesPress }}
            disabled={!onNotesPress}
            onPress={onNotesPress}
            style={({ pressed }) => [styles.restTimer, pressed && styles.pressed]}>
            <Text style={styles.restTimerLabel}>{t('workouts.session.restTimerOff')}</Text>
          </Pressable>
          <SessionSetTable
            draftInputs={draftInputs}
            onCommitRowInputs={onCommitRowInputs}
            onEditSetRpe={onEditSetRpe}
            onLongPressRow={onLongPressRow}
            onPlannedRepsChange={(index, value) =>
              onPlannedRepsChange(exercise.id, index, 'reps', value)
            }
            onPlannedToggleSetCompletion={(index) =>
              onPlannedToggleSetCompletion(exercise.id, index)
            }
            onPlannedWeightChange={(index, value) =>
              onPlannedWeightChange(exercise.id, index, 'weight', value)
            }
            onRepsChange={onRepsChange}
            onToggleSetCompletion={onToggleSetCompletion}
            onWeightChange={onWeightChange}
            previousSets={previousSets}
            targetSetCount={plannedSetCount}
            sets={exerciseSets}
          />
          <Pressable
            accessibilityLabel={t('workouts.session.addSetForExercise', {
              exercise: exercise.name,
            })}
            accessibilityRole="button"
            onPress={() => onAddSet(exercise.id)}
            style={({ pressed }) => [styles.addSetButton, pressed && styles.pressed]}>
            <Text style={styles.addSetLabel}>+ {t('workouts.session.addSet')}</Text>
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
      alignSelf: 'center',
      backgroundColor: colors.surfaceElevated,
      borderCurve: 'continuous',
      borderRadius: 999,
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
      flexShrink: 1,
      fontSize: 15,
      fontVariant: ['tabular-nums'],
      lineHeight: 22,
      minWidth: 0,
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
      flexShrink: 0,
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
      minWidth: 0,
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
      flexShrink: 1,
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
      flexShrink: 0,
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
