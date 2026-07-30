import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';

import { getExerciseLibraryCopy } from '@/localization/exerciseLibraryCopy';
import { useLocalization } from '@/localization';

type FilterValue = 'all' | string;

type FilterChipProps = {
  hint: string;
  label: string;
  onPress: () => void;
  selected?: boolean;
  styles: Record<string, any>;
};

type ExerciseFilterBarProps = {
  difficultyFilters: readonly string[];
  equipment: string[];
  exerciseTypeFilters: readonly string[];
  formatFilterLabel: (value: string) => string;
  muscles: string[];
  onClearFilters: () => void;
  onSelectDifficulty: (value: FilterValue) => void;
  onSelectEquipment: (value: FilterValue) => void;
  onSelectExerciseType: (value: FilterValue) => void;
  onSelectMuscle: (value: FilterValue) => void;
  selectedDifficulty: FilterValue;
  selectedEquipment: FilterValue;
  selectedExerciseType: FilterValue;
  selectedMuscle: FilterValue;
  styles: Record<string, any>;
};

const FilterChip = memo(function FilterChip({
  hint,
  label,
  onPress,
  selected = false,
  styles,
}: FilterChipProps) {
  return (
    <Pressable
      accessibilityHint={hint}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.filterChip,
        selected && styles.filterChipSelected,
        pressed && styles.pressed,
      ]}>
      <Text style={[styles.filterChipLabel, selected && styles.filterChipLabelSelected]}>
        {label}
      </Text>
    </Pressable>
  );
});

export function ExerciseFilterBar({
  difficultyFilters,
  equipment,
  exerciseTypeFilters,
  formatFilterLabel,
  muscles,
  onClearFilters,
  onSelectDifficulty,
  onSelectEquipment,
  onSelectExerciseType,
  onSelectMuscle,
  selectedDifficulty,
  selectedEquipment,
  selectedExerciseType,
  selectedMuscle,
  styles,
}: ExerciseFilterBarProps) {
  const { locale } = useLocalization();
  const copy = getExerciseLibraryCopy(locale);
  const chip = (
    label: string,
    onPress: () => void,
    selected: boolean,
    key?: string,
  ) => (
    <FilterChip
      key={key}
      hint={copy.filterHint}
      label={label}
      onPress={onPress}
      selected={selected}
      styles={styles}
    />
  );

  return (
    <View style={styles.filterSection}>
      <View style={styles.filterHeaderRow}>
        <Text style={styles.sectionHeading}>{copy.filterBar}</Text>
        <Pressable
          accessibilityLabel={copy.clearFiltersAccessibility}
          accessibilityRole="button"
          onPress={onClearFilters}
          style={({ pressed }) => [styles.clearFiltersButton, pressed && styles.pressed]}>
          <Text style={styles.clearFiltersText}>{copy.clearFilters}</Text>
        </Pressable>
      </View>

      <View style={styles.filterGroup}>
        <Text style={styles.filterGroupTitle}>{copy.muscle}</Text>
        <View style={styles.filterChips}>
          {chip(copy.all, () => onSelectMuscle('all'), selectedMuscle === 'all')}
          {muscles.map((muscle) =>
            chip(muscle, () => onSelectMuscle(muscle), selectedMuscle === muscle, muscle),
          )}
        </View>
      </View>

      <View style={styles.filterGroup}>
        <Text style={styles.filterGroupTitle}>{copy.equipment}</Text>
        <View style={styles.filterChips}>
          {chip(copy.all, () => onSelectEquipment('all'), selectedEquipment === 'all')}
          {equipment.map((item) =>
            chip(item, () => onSelectEquipment(item), selectedEquipment === item, item),
          )}
        </View>
      </View>

      <View style={styles.filterGroup}>
        <Text style={styles.filterGroupTitle}>{copy.difficulty}</Text>
        <View style={styles.filterChips}>
          {chip(copy.all, () => onSelectDifficulty('all'), selectedDifficulty === 'all')}
          {difficultyFilters.map((difficulty) =>
            chip(
              formatFilterLabel(difficulty),
              () => onSelectDifficulty(difficulty),
              selectedDifficulty === difficulty,
              difficulty,
            ),
          )}
        </View>
      </View>

      <View style={styles.filterGroup}>
        <Text style={styles.filterGroupTitle}>{copy.exerciseType}</Text>
        <View style={styles.filterChips}>
          {chip(copy.all, () => onSelectExerciseType('all'), selectedExerciseType === 'all')}
          {exerciseTypeFilters.map((exerciseType) =>
            chip(
              formatFilterLabel(exerciseType),
              () => onSelectExerciseType(exerciseType),
              selectedExerciseType === exerciseType,
              exerciseType,
            ),
          )}
        </View>
      </View>
    </View>
  );
}
