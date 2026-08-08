import { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import type { Exercise } from '@/features/exercises';
import {
  createFilterStyles,
  createRowStyles,
} from '@/features/workouts/styles/workoutExerciseLibraryScreenStyles';
import { useWorkoutTheme } from '@/features/workouts/workoutTheme';
import type { WorkoutSessionExercisePickerCopy } from '@/localization/workoutSessionExercisePickerCopy';

export function ExerciseRow({
  copy,
  exercise,
  onInfoPress,
  onPress,
  selected,
}: {
  copy: WorkoutSessionExercisePickerCopy;
  exercise: Exercise;
  onInfoPress: () => void;
  onPress: () => void;
  selected: boolean;
}) {
  const { colors } = useWorkoutTheme();
  const styles = useMemo(() => createRowStyles(colors), [colors]);
  const equipment = exercise.equipment.join(', ') || copy.noEquipment;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        selected && styles.rowSelected,
        pressed && styles.pressed,
      ]}>
      <View style={styles.thumbnail}>
        <Text style={styles.thumbnailLabel}>
          {exercise.name.slice(0, 1).toUpperCase()}
        </Text>
      </View>
      <View style={styles.copy}>
        <Text numberOfLines={2} style={styles.name}>
          {exercise.name}
        </Text>
        <Text numberOfLines={1} style={styles.meta}>
          {exercise.primaryMuscles[0] ?? exercise.bodyPart}
        </Text>
        <Text numberOfLines={1} style={styles.meta}>
          {equipment} · {exercise.bodyPart}
        </Text>
        {exercise.secondaryMuscles.length > 0 ? (
          <Text numberOfLines={1} style={styles.meta}>
            {copy.secondaryMuscles(exercise.secondaryMuscles.slice(0, 2).join(', '))}
          </Text>
        ) : null}
      </View>
      <Pressable
        accessibilityLabel={copy.openDetails(exercise.name)}
        accessibilityRole="button"
        onPress={onInfoPress}
        style={({ pressed }) => [styles.infoButton, pressed && styles.pressed]}>
        <Text numberOfLines={2} style={styles.infoLabel}>
          {copy.details}
        </Text>
      </Pressable>
      <View style={[styles.selection, selected && styles.selectionSelected]}>
        <Text
          style={[
            styles.selectionLabel,
            selected && styles.selectionLabelSelected,
          ]}>
          {selected ? '✓' : '+'}
        </Text>
      </View>
    </Pressable>
  );
}

export function FilterChips({
  activeValue,
  allLabel,
  label,
  onChange,
  options,
}: {
  activeValue?: string;
  allLabel: string;
  label: string;
  onChange: (value?: string) => void;
  options: string[];
}) {
  const { colors } = useWorkoutTheme();
  const styles = useMemo(() => createFilterStyles(colors), [colors]);

  if (options.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView
        contentContainerStyle={styles.chips}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroll}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: !activeValue }}
          onPress={() => onChange(undefined)}
          style={({ pressed }) => [
            styles.chip,
            !activeValue && styles.chipActive,
            pressed && styles.pressed,
          ]}>
          <Text
            style={[
              styles.chipLabel,
              !activeValue && styles.chipLabelActive,
            ]}>
            {allLabel}
          </Text>
        </Pressable>
        {options.map((option) => {
          const active = activeValue === option;
          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => onChange(active ? undefined : option)}
              style={({ pressed }) => [
                styles.chip,
                active && styles.chipActive,
                pressed && styles.pressed,
              ]}>
              <Text
                style={[
                  styles.chipLabel,
                  active && styles.chipLabelActive,
                ]}>
                {option}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
