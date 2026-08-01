import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { VirtualizedWorkoutExerciseLibrary } from '@/components/workouts/VirtualizedWorkoutExerciseLibrary';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAppActions, useWorkoutState } from '@/context/AppContext';

const createExerciseId = (name: string) =>
  `exercise-${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;

export default function ExerciseLibraryRoute() {
  const { addExercise, deleteExercise } = useAppActions();
  const { exercises, workoutSessions } = useWorkoutState();
  const [isExpanded, setIsExpanded] = useState(true);
  const [exerciseName, setExerciseName] = useState('');
  const [exerciseMuscleGroup, setExerciseMuscleGroup] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const insets = useSafeAreaInsets();

  const isExerciseAdded = useMemo(
    () => new Set(exercises.map((exercise) => exercise.name.toLowerCase())),
    [exercises],
  );

  return (
    <View style={styles.screen}>
      <View style={styles.container}>
        <VirtualizedWorkoutExerciseLibrary
          bottomInset={insets.bottom}
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
            if (!nextName) return;
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three,
    width: '100%',
  },
  screen: {
    alignItems: 'center',
    backgroundColor: Colors.dark.background,
    flex: 1,
  },
});
