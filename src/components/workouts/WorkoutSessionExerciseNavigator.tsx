import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Radii, Spacing, Typography } from '@/constants/theme';
import type { PlannedExercise } from '@/lib/workouts/workout-session';
import { useAppTheme } from '@/theme/AppThemeProvider';

type WorkoutSessionExerciseNavigatorProps = {
  completedExerciseIds: Set<string>;
  onSelectExercise: (exerciseId: string) => void;
  selectedExerciseId: string;
  workoutExercises: PlannedExercise[];
};

export function WorkoutSessionExerciseNavigator({ completedExerciseIds, onSelectExercise, selectedExerciseId, workoutExercises }: WorkoutSessionExerciseNavigatorProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <Text selectable style={styles.sectionLabel}>
        Exercises
      </Text>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        horizontal
        keyboardShouldPersistTaps="handled"
        showsHorizontalScrollIndicator={false}>
        {workoutExercises.map((exercise) => {
          const isSelected = exercise.id === selectedExerciseId;
          const isComplete = completedExerciseIds.has(exercise.id);

          return (
            <Pressable
              accessibilityLabel={`${exercise.name}${isComplete ? ', completed' : ''}${isSelected ? ', active' : ''}`}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              key={exercise.id}
              onPress={() => onSelectExercise(exercise.id)}
              style={({ pressed }) => [
                styles.chip,
                isSelected && styles.chipSelected,
                isComplete && !isSelected && styles.chipCompleted,
                pressed && styles.chipPressed,
              ]}>
              <View style={styles.chipContent}>
                {isComplete ? <Text style={[styles.statusMark, isSelected && styles.statusMarkSelected]}>✓</Text> : <View style={styles.statusSpacer} />}
                <Text numberOfLines={1} style={[styles.chipLabel, isSelected && styles.chipLabelSelected, isComplete && !isSelected && styles.chipLabelCompleted]}>
                  {exercise.name}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: typeof import('@/constants/theme').Colors.dark) =>
  StyleSheet.create({
    chip: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: Radii.pill,
      borderWidth: StyleSheet.hairlineWidth,
      flexShrink: 0,
      justifyContent: 'center',
      marginRight: Spacing.two,
      minHeight: 44,
      maxWidth: 200,
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.two,
    },
    chipCompleted: {
      backgroundColor: colors.accentSoft,
      borderColor: colors.accentSoft,
    },
    chipContent: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 6,
      maxWidth: '100%',
    },
    chipLabel: {
      color: colors.textPrimary,
      flexShrink: 1,
      fontSize: Typography.callout.fontSize,
      fontWeight: '800',
      lineHeight: Typography.callout.lineHeight,
    },
    chipLabelCompleted: {
      color: colors.textPrimary,
    },
    chipLabelSelected: {
      color: colors.textOnAccent,
    },
    chipPressed: {
      opacity: 0.88,
    },
    chipSelected: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    container: {
      gap: Spacing.two,
    },
    scrollContent: {
      paddingBottom: 2,
      paddingHorizontal: Spacing.three,
    },
    sectionLabel: {
      color: colors.textSecondary,
      fontSize: Typography.sectionTitle.fontSize,
      fontWeight: Typography.sectionTitle.fontWeight,
      letterSpacing: Typography.sectionTitle.letterSpacing,
      textTransform: Typography.sectionTitle.textTransform,
    },
    statusMark: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: '900',
      lineHeight: 16,
      width: 12,
    },
    statusMarkSelected: {
      color: colors.textOnAccent,
    },
    statusSpacer: {
      width: 12,
    },
  });
