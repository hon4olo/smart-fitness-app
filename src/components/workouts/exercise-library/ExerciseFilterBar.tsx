import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';

type FilterValue = 'all' | string;

type FilterChipProps = {
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

const FilterChip = memo(function FilterChip({ label, onPress, selected = false, styles }: FilterChipProps) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityHint="Toggle this exercise filter"
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.filterChip, selected && styles.filterChipSelected, pressed && styles.pressed]}>
      <Text style={[styles.filterChipLabel, selected && styles.filterChipLabelSelected]}>{label}</Text>
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
  return (
    <View style={styles.filterSection}>
      <View style={styles.filterHeaderRow}>
        <Text style={styles.sectionHeading}>Filter bar</Text>
        <Pressable
          accessibilityLabel="Clear exercise filters"
          accessibilityRole="button"
          onPress={onClearFilters}
          style={({ pressed }) => [styles.clearFiltersButton, pressed && styles.pressed]}>
          <Text style={styles.clearFiltersText}>Clear Filters</Text>
        </Pressable>
      </View>

      <View style={styles.filterGroup}>
        <Text style={styles.filterGroupTitle}>Muscle</Text>
        <View style={styles.filterChips}>
          <FilterChip label="All" onPress={() => onSelectMuscle('all')} selected={selectedMuscle === 'all'} styles={styles} />
          {muscles.map((muscle) => (
            <FilterChip key={muscle} label={muscle} onPress={() => onSelectMuscle(muscle)} selected={selectedMuscle === muscle} styles={styles} />
          ))}
        </View>
      </View>

      <View style={styles.filterGroup}>
        <Text style={styles.filterGroupTitle}>Equipment</Text>
        <View style={styles.filterChips}>
          <FilterChip label="All" onPress={() => onSelectEquipment('all')} selected={selectedEquipment === 'all'} styles={styles} />
          {equipment.map((item) => (
            <FilterChip key={item} label={item} onPress={() => onSelectEquipment(item)} selected={selectedEquipment === item} styles={styles} />
          ))}
        </View>
      </View>

      <View style={styles.filterGroup}>
        <Text style={styles.filterGroupTitle}>Difficulty</Text>
        <View style={styles.filterChips}>
          <FilterChip label="All" onPress={() => onSelectDifficulty('all')} selected={selectedDifficulty === 'all'} styles={styles} />
          {difficultyFilters.map((difficulty) => (
            <FilterChip key={difficulty} label={formatFilterLabel(difficulty)} onPress={() => onSelectDifficulty(difficulty)} selected={selectedDifficulty === difficulty} styles={styles} />
          ))}
        </View>
      </View>

      <View style={styles.filterGroup}>
        <Text style={styles.filterGroupTitle}>Exercise type</Text>
        <View style={styles.filterChips}>
          <FilterChip label="All" onPress={() => onSelectExerciseType('all')} selected={selectedExerciseType === 'all'} styles={styles} />
          {exerciseTypeFilters.map((exerciseType) => (
            <FilterChip key={exerciseType} label={formatFilterLabel(exerciseType)} onPress={() => onSelectExerciseType(exerciseType)} selected={selectedExerciseType === exerciseType} styles={styles} />
          ))}
        </View>
      </View>
    </View>
  );
}
