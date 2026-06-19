import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing } from '@/constants/theme';
import { Exercise } from '@/context/AppContext';

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
  onToggleExpanded: () => void;
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
  onToggleExpanded,
}: WorkoutExerciseLibraryCardProps) {
  return (
    <AppCard>
      <Pressable onPress={onToggleExpanded} style={styles.collapsibleHeader}>
        <Text style={styles.sectionTitle}>{`Exercises ${isExpanded ? '−' : '+'}`}</Text>
      </Pressable>

      {isExpanded ? (
        <>
          <View style={styles.inputGroup}>
            <Text selectable style={styles.inputLabel}>
              Exercise name
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

          <AppButton disabled={isSaveExerciseDisabled} label="Add exercise" onPress={onSaveExercise} />

          <View style={styles.list}>
            <Text selectable style={styles.title}>
              Available exercises
            </Text>
            {exercises.length > 0 ? (
              exercises.map((exercise) => {
                const added = isExerciseAdded(exercise.name);

                return (
                  <View key={exercise.id} style={styles.row}>
                    <View style={styles.content}>
                      <Text selectable style={styles.exerciseName}>
                        {exercise.name}
                      </Text>
                      {exercise.muscleGroup ? (
                        <Text selectable style={styles.exerciseMeta}>
                          {exercise.muscleGroup}
                        </Text>
                      ) : null}
                    </View>
                    <AppButton
                      disabled={added}
                      label={added ? 'Added' : 'Add to workout'}
                      onPress={() => onAddDatabaseExercise(exercise.name)}
                      variant="secondary"
                    />
                    {exercise.isCustom ? (
                      <AppButton label="Delete" onPress={() => onDeleteExercise(exercise.id)} variant="secondary" />
                    ) : null}
                  </View>
                );
              })
            ) : (
              <EmptyWorkoutState message="No exercises yet." />
            )}
          </View>
        </>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  collapsibleHeader: {
    paddingBottom: Spacing.two,
  },
  content: {
    flex: 1,
    gap: Spacing.one,
  },
  exerciseMeta: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
  },
  exerciseName: {
    color: Colors.dark.text,
    fontSize: 15,
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
  list: {
    gap: Spacing.two,
  },
  row: {
    alignItems: 'center',
    borderColor: Colors.dark.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
    paddingTop: Spacing.two,
  },
  sectionTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '800',
  },
  title: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
});