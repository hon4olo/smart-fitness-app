import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing } from '@/constants/theme';
import { Exercise } from '@/types';

import { EmptyWorkoutState } from './EmptyWorkoutState';

type WorkoutExerciseLibraryCardProps = {
  exerciseName: string;
  exerciseMuscleGroup: string;
  exercises: Exercise[];
  isExpanded: boolean;
  isExerciseAdded: (name: string) => boolean;
  isSaveExerciseDisabled: boolean;
  onAddDatabaseExercise: (name: string) => void;
  onDeleteExercise: (exerciseId: string) => void;
  onExerciseMuscleGroupChange: (value: string) => void;
  onExerciseNameChange: (value: string) => void;
  onSaveExercise: () => void;
  onSearchChange: (value: string) => void;
  onToggleExpanded: () => void;
  searchValue: string;
};

const groupExercises = (exercises: Exercise[]) => {
  return exercises.reduce<Record<string, Exercise[]>>((groups, exercise) => {
    const key = exercise.name.trim().charAt(0).toUpperCase() || '#';
    const nextGroups = groups[key] ?? [];

    return {
      ...groups,
      [key]: [...nextGroups, exercise],
    };
  }, {});
};

export function WorkoutExerciseLibraryCard({
  exerciseName,
  exerciseMuscleGroup,
  exercises,
  isExpanded,
  isExerciseAdded,
  isSaveExerciseDisabled,
  onAddDatabaseExercise,
  onDeleteExercise,
  onExerciseMuscleGroupChange,
  onExerciseNameChange,
  onSaveExercise,
  onSearchChange,
  onToggleExpanded,
  searchValue,
}: WorkoutExerciseLibraryCardProps) {
  const normalizedSearch = searchValue.trim().toLowerCase();
  const filteredExercises = exercises.filter((exercise) => {
    if (!normalizedSearch) {
      return true;
    }

    return [exercise.name, exercise.muscleGroup ?? ''].some((value) => value.toLowerCase().includes(normalizedSearch));
  });
  const groupedExercises = groupExercises(filteredExercises);
  const groupKeys = Object.keys(groupedExercises).sort((left, right) => left.localeCompare(right));

  return (
    <AppCard>
      <Pressable onPress={onToggleExpanded} style={styles.collapsibleHeader}>
        <View style={styles.headerRow}>
          <View style={styles.headerContent}>
            <Text style={styles.sectionTitle}>{`Exercise library ${isExpanded ? '−' : '+'}`}</Text>
            <Text style={styles.subtitle}>Search the library, add one tap, or create a custom exercise.</Text>
          </View>
          <Text style={styles.toggle}>{isExpanded ? '−' : '+'}</Text>
        </View>
      </Pressable>

      {isExpanded ? (
        <>
          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text selectable style={styles.inputLabel}>
                Add custom exercise
              </Text>
              <TextInput
                onChangeText={onExerciseNameChange}
                placeholder="Bench press"
                placeholderTextColor={Colors.dark.textSecondary}
                style={styles.input}
                value={exerciseName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text selectable style={styles.inputLabel}>
                Muscle group
              </Text>
              <TextInput
                onChangeText={onExerciseMuscleGroupChange}
                placeholder="Chest"
                placeholderTextColor={Colors.dark.textSecondary}
                style={styles.input}
                value={exerciseMuscleGroup}
              />
            </View>

            <AppButton disabled={isSaveExerciseDisabled} label="Save exercise" onPress={onSaveExercise} variant="secondary" />
          </View>

          <View style={styles.searchSection}>
            <Text selectable style={styles.inputLabel}>
              Search library
            </Text>
            <TextInput
              onChangeText={onSearchChange}
              placeholder="Search exercises or muscle groups"
              placeholderTextColor={Colors.dark.textSecondary}
              style={styles.input}
              value={searchValue}
            />
          </View>

          {filteredExercises.length === 0 ? (
            <EmptyWorkoutState
              actionLabel={normalizedSearch ? 'Clear search' : undefined}
              description={normalizedSearch ? 'Try a different search term or add a custom exercise above.' : 'Add the first exercise to your library to make building templates faster.'}
              message={normalizedSearch ? 'No matching exercises found.' : 'No exercises yet.'}
              onActionPress={normalizedSearch ? () => onSearchChange('') : undefined}
              title="Library empty"
            />
          ) : (
            <View style={styles.groups}>
              {groupKeys.map((groupKey) => (
                <View key={groupKey} style={styles.groupCard}>
                  <Text selectable style={styles.groupTitle}>
                    {groupKey}
                  </Text>
                  <View style={styles.groupList}>
                    {groupedExercises[groupKey].map((exercise) => {
                      const alreadyAdded = isExerciseAdded(exercise.name);

                      return (
                        <View key={exercise.id} style={styles.exerciseRow}>
                          <View style={styles.exerciseContent}>
                            <Text selectable style={styles.exerciseName}>
                              {exercise.name}
                            </Text>
                            {exercise.muscleGroup ? <Text selectable style={styles.exerciseMeta}>{exercise.muscleGroup}</Text> : null}
                          </View>
                          <View style={styles.rowActions}>
                            <AppButton
                              disabled={alreadyAdded}
                              label={alreadyAdded ? 'Added' : 'Add'}
                              onPress={() => onAddDatabaseExercise(exercise.name)}
                              variant="secondary"
                            />
                            {exercise.isCustom ? (
                              <AppButton label="Delete" onPress={() => onDeleteExercise(exercise.id)} variant="secondary" />
                            ) : null}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          )}
        </>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  collapsibleHeader: {
    paddingBottom: Spacing.two,
  },
  exerciseContent: {
    flex: 1,
    gap: Spacing.one,
    minWidth: 0,
  },
  exerciseMeta: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
  },
  exerciseName: {
    color: Colors.dark.text,
    fontSize: 15,
    fontWeight: '700',
  },
  exerciseRow: {
    backgroundColor: Colors.dark.background,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 12,
    borderWidth: 1,
    gap: Spacing.two,
    padding: Spacing.three,
  },
  formSection: {
    gap: Spacing.two,
  },
  groupCard: {
    gap: Spacing.two,
  },
  groupList: {
    gap: Spacing.two,
  },
  groupTitle: {
    color: Colors.dark.accent,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  groups: {
    gap: Spacing.three,
  },
  headerContent: {
    flex: 1,
    gap: Spacing.one,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  input: {
    backgroundColor: Colors.dark.background,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 8,
    borderWidth: 1,
    color: Colors.dark.text,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: Spacing.two,
  },
  inputGroup: {
    gap: Spacing.one,
  },
  inputLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  rowActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    justifyContent: 'flex-end',
  },
  searchSection: {
    gap: Spacing.one,
  },
  sectionTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  toggle: {
    color: Colors.dark.accent,
    fontSize: 24,
    fontWeight: '700',
  },
});
