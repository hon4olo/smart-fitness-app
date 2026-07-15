import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { WorkoutExerciseLibraryCard } from '@/components/workouts/WorkoutExerciseLibraryCard';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';

const createExerciseId = (name: string) => `exercise-${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;

export default function ExerciseLibraryRoute() {
  const { addExercise, deleteExercise, exercises, workoutSessions } = useAppContext();
  const [isExpanded, setIsExpanded] = useState(true);
  const [exerciseName, setExerciseName] = useState('');
  const [exerciseMuscleGroup, setExerciseMuscleGroup] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const insets = useSafeAreaInsets();

  const isExerciseAdded = useMemo(() => new Set(exercises.map((exercise) => exercise.name.toLowerCase())), [exercises]);

  return (
    <View style={styles.screen}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.three }]} style={styles.scrollView}>
        <View style={styles.container}>
          <WorkoutExerciseLibraryCard
            exerciseName={exerciseName}
            exerciseMuscleGroup={exerciseMuscleGroup}
            exercises={exercises}
            isExpanded={isExpanded}
            isExerciseAdded={(name) => isExerciseAdded.has(name.toLowerCase())}
            isSaveExerciseDisabled={exerciseName.trim().length === 0}
            onAddDatabaseExercise={(name) => setExerciseName(name)}
            onDeleteExercise={deleteExercise}
            onExerciseMuscleGroupChange={setExerciseMuscleGroup}
            onExerciseNameChange={setExerciseName}
            onSaveExercise={() => {
              const nextName = exerciseName.trim();
              if (!nextName) {
                return;
              }

              addExercise({
                createdAt: new Date().toISOString(),
                id: createExerciseId(nextName),
                isCustom: true,
                muscleGroup: exerciseMuscleGroup.trim() || undefined,
                name: nextName,
              });
              setExerciseName('');
              setExerciseMuscleGroup('');
            }}
            onSearchChange={setSearchValue}
            onToggleExpanded={() => setIsExpanded((current) => !current)}
            searchValue={searchValue}
            workoutSessions={workoutSessions}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: MaxContentWidth,
    width: '100%',
  },
  content: {
    alignItems: 'center',
    padding: Spacing.three,
  },
  screen: {
    backgroundColor: Colors.dark.background,
    flex: 1,
  },
  scrollView: {
    backgroundColor: Colors.dark.background,
    flex: 1,
  },
});
