import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors, Radii, Spacing, Typography } from '@/constants/theme';
import type { PlannedExercise } from '@/lib/workouts/workout-session';
import { useAppTheme } from '@/theme/AppThemeProvider';

type WorkoutSessionExerciseNavigatorProps = {
  onSelectExercise: (exerciseId: string) => void;
  selectedExerciseId: string;
  selectedExerciseIndex: number;
  workoutExercises: PlannedExercise[];
};

export function WorkoutSessionExerciseNavigator({
  onSelectExercise,
  selectedExerciseId,
  selectedExerciseIndex,
  workoutExercises,
}: WorkoutSessionExerciseNavigatorProps) {
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
        {workoutExercises.map((exercise, index) => {
          const isSelected = exercise.id === selectedExerciseId;
          const isComplete = index < selectedExerciseIndex;
          const stateLabel = isSelected ? 'current' : isComplete ? 'completed' : 'upcoming';

          return (
            <Pressable
              accessibilityLabel={`Exercise ${index + 1} of ${workoutExercises.length}, ${exercise.name}, ${stateLabel}`}
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
              <Text numberOfLines={1} style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>
                {index + 1} {exercise.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: typeof Colors.dark) =>
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
      maxWidth: 180,
      paddingHorizontal: Spacing.four,
      paddingVertical: Spacing.two,
    },
    chipCompleted: {
      backgroundColor: colors.accentSoft,
      borderColor: colors.accentSoft,
    },
    chipLabel: {
      color: colors.textPrimary,
      fontSize: Typography.callout.fontSize,
      fontWeight: '800',
      lineHeight: Typography.callout.lineHeight,
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
      paddingRight: Spacing.three,
    },
    sectionLabel: {
      color: colors.textSecondary,
      fontSize: Typography.sectionTitle.fontSize,
      fontWeight: Typography.sectionTitle.fontWeight,
      letterSpacing: Typography.sectionTitle.letterSpacing,
      textTransform: Typography.sectionTitle.textTransform,
    },
  });
