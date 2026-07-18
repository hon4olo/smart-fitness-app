import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import { WorkoutBuilderCard } from './WorkoutBuilderCard';
import { createWorkoutDraftFromWorkout } from '@/features/workouts/programEditorModel';
import type { Workout } from '@/types';
import type { DraftWorkoutExercise } from './workout-builder-types';

type ProgramWorkoutEditorModalProps = {
  visible: boolean;
  workout?: Workout | null;
  onClose: () => void;
  onSaveWorkout: (payload: {
    title: string;
    description?: string;
    exercises: string[];
  }) => void;
};

export function ProgramWorkoutEditorModal({ visible, workout, onClose, onSaveWorkout }: ProgramWorkoutEditorModalProps) {
  const initialDraft = useMemo(() => createWorkoutDraftFromWorkout(workout), [workout]);
  const [workoutTitle, setWorkoutTitle] = useState(initialDraft.title);
  const [workoutDescription, setWorkoutDescription] = useState(initialDraft.description);
  const [draftExerciseName, setDraftExerciseName] = useState('');
  const [draftExercises, setDraftExercises] = useState<DraftWorkoutExercise[]>(initialDraft.exercises);
  const [isExpanded, setExpanded] = useState(true);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setWorkoutTitle(initialDraft.title);
    setWorkoutDescription(initialDraft.description);
    setDraftExercises(initialDraft.exercises);
    setDraftExerciseName('');
    setExpanded(true);
  }, [initialDraft, visible]);

  if (!visible) {
    return null;
  }

  const addExercise = () => {
    const trimmed = draftExerciseName.trim();
    if (!trimmed) {
      return;
    }

    setDraftExercises((current) => [
      ...current,
      {
        id: `draft-exercise-${Date.now()}-${current.length + 1}`,
        name: trimmed,
        notes: '',
        restSeconds: '90',
        targetReps: '8',
        targetSets: '3',
      },
    ]);
    setDraftExerciseName('');
  };

  const updateExercise = (exerciseId: string, patch: Partial<DraftWorkoutExercise>) => {
    setDraftExercises((current) => current.map((exercise) => (exercise.id === exerciseId ? { ...exercise, ...patch } : exercise)));
  };

  const removeExercise = (exerciseId: string) => {
    setDraftExercises((current) => current.filter((exercise) => exercise.id !== exerciseId));
  };

  const duplicateExercise = (exerciseId: string) => {
    setDraftExercises((current) => {
      const index = current.findIndex((exercise) => exercise.id === exerciseId);
      if (index === -1) {
        return current;
      }

      const source = current[index];
      const next = [...current];
      next.splice(index + 1, 0, {
        ...source,
        id: `draft-exercise-${Date.now()}-${index + 1}`,
      });
      return next;
    });
  };

  const moveExercise = (exerciseId: string, direction: -1 | 1) => {
    setDraftExercises((current) => {
      const index = current.findIndex((exercise) => exercise.id === exerciseId);
      if (index === -1) {
        return current;
      }

      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= current.length) {
        return current;
      }

      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(targetIndex, 0, item);
      return next;
    });
  };

  const saveDisabled = workoutTitle.trim().length === 0 || draftExercises.length === 0;

  return (
    <View style={styles.overlay}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.fill}>
        <View style={styles.panel}>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>{workout ? 'Edit workout' : 'Create workout'}</Text>
              <Text style={styles.subtitle}>Build the template here, then return to the program draft.</Text>
            </View>
            <Pressable onPress={onClose} style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
              <Text style={styles.closeLabel}>{workout ? 'Back' : 'Cancel'}</Text>
            </Pressable>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <WorkoutBuilderCard
              draftExerciseName={draftExerciseName}
              draftExercises={draftExercises}
              editingWorkoutId={workout?.id}
              isExpanded={isExpanded}
              isSaveWorkoutDisabled={saveDisabled}
              onAddExercise={addExercise}
              onCancelEdit={onClose}
              onDraftExerciseNameChange={setDraftExerciseName}
              onDuplicateExercise={duplicateExercise}
              onExerciseChange={updateExercise}
              onMoveExercise={moveExercise}
              onRemoveDraftExercise={removeExercise}
              onSaveWorkout={() => {
                onSaveWorkout({
                  title: workoutTitle.trim(),
                  description: workoutDescription.trim() || undefined,
                  exercises: draftExercises.map((exercise) => exercise.name.trim()).filter(Boolean),
                });
              }}
              onToggleExpanded={() => setExpanded((current) => !current)}
              onWorkoutDescriptionChange={setWorkoutDescription}
              onWorkoutTitleChange={setWorkoutTitle}
              workoutDescription={workoutDescription}
              workoutTitle={workoutTitle}
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  closeButton: {
    alignItems: 'center',
    backgroundColor: Colors.dark.surfaceSecondary,
    borderCurve: 'continuous',
    borderRadius: 16,
    paddingHorizontal: Spacing.two,
    paddingVertical: 10,
  },
  closeLabel: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '800',
  },
  fill: {
    flex: 1,
    width: '100%',
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.74)',
    justifyContent: 'center',
    padding: Spacing.three,
  },
  panel: {
    backgroundColor: Colors.dark.background,
    borderCurve: 'continuous',
    borderRadius: 28,
    maxHeight: '94%',
    maxWidth: 560,
    padding: Spacing.three,
    width: '100%',
  },
  pressed: {
    opacity: 0.7,
  },
  scrollContent: {
    paddingBottom: Spacing.two,
  },
  subtitle: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  title: {
    color: Colors.dark.text,
    fontSize: 22,
    fontWeight: '900',
  },
});
