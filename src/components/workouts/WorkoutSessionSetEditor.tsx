import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { Colors, Radii, Spacing, Typography } from '@/constants/theme';
import type { PlannedExercise, WorkoutSessionPreviousSet, WorkoutSessionPr } from '@/lib/workouts/workout-session';
import { useAppTheme } from '@/theme/AppThemeProvider';

type WorkoutSessionSetEditorProps = {
  editingSetId?: string;
  exercisePrs: WorkoutSessionPr[];
  onCancelEdit: () => void;
  onRepsChange: (value: string) => void;
  onSaveSet: () => void;
  onWeightChange: (value: string) => void;
  previousSets: WorkoutSessionPreviousSet[];
  reps: string;
  selectedExercise?: PlannedExercise;
  selectedExerciseIndex: number;
  totalExercises: number;
  weight: string;
};

const formatCompactSet = (set: WorkoutSessionPreviousSet) => `${set.weight} kg × ${set.reps}`;

const formatPrSummary = (exercisePrs: WorkoutSessionPr[]) =>
  `PR: ${exercisePrs
    .map((pr) => `${pr.label} ${pr.value}`)
    .join(' · ')}`;

const formatPreviousSummary = (previousSets: WorkoutSessionPreviousSet[]) =>
  `Previous: ${previousSets.slice(0, 3).map(formatCompactSet).join(', ')}${previousSets.length > 3 ? `, +${previousSets.length - 3} more` : ''}`;

export function WorkoutSessionSetEditor({
  editingSetId,
  exercisePrs,
  onCancelEdit,
  onRepsChange,
  onSaveSet,
  onWeightChange,
  previousSets,
  reps,
  selectedExercise,
  selectedExerciseIndex,
  totalExercises,
  weight,
}: WorkoutSessionSetEditorProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (!selectedExercise) {
    return (
      <AppCard style={styles.card}>
        <Text selectable style={styles.exerciseName}>
          No exercise selected
        </Text>
        <Text selectable style={styles.quietText}>
          Choose an exercise to log your next set.
        </Text>
      </AppCard>
    );
  }

  const previousSummary = previousSets.length > 0 ? formatPreviousSummary(previousSets) : null;
  const prSummary = exercisePrs.length > 0 ? formatPrSummary(exercisePrs) : null;
  const prescriptionLabel = `${selectedExercise.targetSets ?? 3} × ${selectedExercise.targetReps ?? 8} · ${selectedExercise.restSeconds ?? 90}s rest`;

  return (
    <AppCard style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text numberOfLines={2} selectable style={styles.exerciseName}>
            {selectedExercise.name}
          </Text>
          <Text selectable style={styles.positionText}>
            Exercise {selectedExerciseIndex + 1} of {totalExercises}
          </Text>
        </View>
      </View>

      <Text selectable style={styles.prescriptionText}>
        {prescriptionLabel}
      </Text>

      {previousSummary ? (
        <Text numberOfLines={2} selectable style={styles.quietText}>
          {previousSummary}
        </Text>
      ) : null}
      {prSummary ? (
        <Text numberOfLines={2} selectable style={styles.quietText}>
          {prSummary}
        </Text>
      ) : null}

      <View style={styles.inputsRow}>
        <View style={styles.inputGroup}>
          <Text selectable style={styles.inputLabel}>
            Weight
          </Text>
          <TextInput
            accessibilityLabel="Weight"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="decimal-pad"
            onChangeText={onWeightChange}
            placeholder="0"
            placeholderTextColor={colors.textMuted}
            selectionColor={colors.accent}
            style={styles.input}
            value={weight}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text selectable style={styles.inputLabel}>
            Reps
          </Text>
          <TextInput
            accessibilityLabel="Reps"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="number-pad"
            onChangeText={onRepsChange}
            placeholder="0"
            placeholderTextColor={colors.textMuted}
            selectionColor={colors.accent}
            style={styles.input}
            value={reps}
          />
        </View>
      </View>

      <Pressable accessibilityRole="button" onPress={onSaveSet} style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryPressed]}>
        <Text style={styles.primaryLabel}>{editingSetId ? 'Save set' : 'Add set'}</Text>
      </Pressable>

      {editingSetId ? (
        <Pressable accessibilityRole="button" onPress={onCancelEdit} style={({ pressed }) => [styles.cancelEditButton, pressed && styles.cancelEditPressed]}>
          <Text style={styles.cancelEditLabel}>Cancel edit</Text>
        </Pressable>
      ) : null}
    </AppCard>
  );
}

const createStyles = (colors: typeof Colors.dark) =>
  StyleSheet.create({
    card: {
      gap: Spacing.three,
      padding: Spacing.four,
    },
    cancelEditButton: {
      alignSelf: 'flex-start',
      minHeight: 44,
      justifyContent: 'center',
      paddingHorizontal: 2,
    },
    cancelEditLabel: {
      color: colors.textSecondary,
      fontSize: Typography.callout.fontSize,
      fontWeight: Typography.button.fontWeight,
      lineHeight: Typography.callout.lineHeight,
    },
    cancelEditPressed: {
      opacity: 0.72,
    },
    exerciseName: {
      color: colors.textPrimary,
      fontSize: Typography.cardTitle.fontSize,
      fontWeight: '900',
      lineHeight: Typography.cardTitle.lineHeight,
    },
    headerCopy: {
      gap: 2,
      minWidth: 0,
    },
    headerRow: {
      gap: Spacing.one,
    },
    input: {
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: Radii.medium,
      borderWidth: StyleSheet.hairlineWidth,
      color: colors.textPrimary,
      flex: 1,
      fontSize: 18,
      fontVariant: ['tabular-nums'],
      minHeight: 48,
      paddingHorizontal: Spacing.three,
      paddingVertical: 12,
    },
    inputGroup: {
      flex: 1,
      gap: 4,
      minWidth: 0,
    },
    inputLabel: {
      color: colors.textSecondary,
      fontSize: Typography.label.fontSize,
      fontWeight: Typography.label.fontWeight,
      lineHeight: Typography.label.lineHeight,
    },
    inputsRow: {
      flexDirection: 'row',
      gap: Spacing.two,
    },
    positionText: {
      color: colors.textSecondary,
      fontSize: Typography.callout.fontSize,
      lineHeight: Typography.callout.lineHeight,
    },
    prescriptionText: {
      color: colors.textPrimary,
      fontSize: Typography.bodyEmphasized.fontSize,
      fontWeight: Typography.bodyEmphasized.fontWeight,
      lineHeight: Typography.bodyEmphasized.lineHeight,
    },
    primaryButton: {
      alignItems: 'center',
      alignSelf: 'stretch',
      backgroundColor: colors.accent,
      borderCurve: 'continuous',
      borderRadius: Radii.large,
      justifyContent: 'center',
      minHeight: 48,
      paddingHorizontal: Spacing.four,
      paddingVertical: Spacing.two,
    },
    primaryLabel: {
      color: colors.textOnAccent,
      fontSize: Typography.button.fontSize,
      fontWeight: Typography.button.fontWeight,
      lineHeight: Typography.button.lineHeight,
    },
    primaryPressed: {
      backgroundColor: colors.accentPressed,
    },
    quietText: {
      color: colors.textSecondary,
      fontSize: Typography.callout.fontSize,
      lineHeight: Typography.callout.lineHeight,
    },
  });
