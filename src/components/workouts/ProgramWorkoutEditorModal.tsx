import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import { createWorkoutDraftFromWorkout } from '@/features/workouts/programEditorModel';
import { useLocalization } from '@/localization';
import { getWorkoutBuilderCopy } from '@/localization/workoutBuilderCopy';
import type { Workout } from '@/types';

import { WorkoutBuilderCard } from './WorkoutBuilderCard';
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

export function ProgramWorkoutEditorModal({
  visible,
  workout,
  onClose,
  onSaveWorkout,
}: ProgramWorkoutEditorModalProps) {
  const { locale } = useLocalization();
  const copy = getWorkoutBuilderCopy(locale);
  const initialDraft = useMemo(() => createWorkoutDraftFromWorkout(workout), [workout]);
  const [workoutTitle, setWorkoutTitle] = useState(initialDraft.title);
  const [workoutDescription, setWorkoutDescription] = useState(initialDraft.description);
  const [draftExerciseName, setDraftExerciseName] = useState('');
  const [draftExercises, setDraftExercises] = useState<DraftWorkoutExercise[]>(
    initialDraft.exercises,
  );
  const [isExpanded, setExpanded] = useState(true);

  useEffect(() => {
    if (!visible) return;
    setWorkoutTitle(initialDraft.title);
    setWorkoutDescription(initialDraft.description);
    setDraftExercises(initialDraft.exercises);
    setDraftExerciseName('');
    setExpanded(true);
  }, [initialDraft, visible]);

  if (!visible) return null;

  const addExercise = () => {
    const trimmed = draftExerciseName.trim();
    if (!trimmed) return;

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
    setDraftExercises((current) =>
      current.map((exercise) =>
        exercise.id === exerciseId ? { ...exercise, ...patch } : exercise,
      ),
    );
  };

  const removeExercise = (exerciseId: string) => {
    setDraftExercises((current) =>
      current.filter((exercise) => exercise.id !== exerciseId),
    );
  };

  const duplicateExercise = (exerciseId: string) => {
    setDraftExercises((current) => {
      const index = current.findIndex((exercise) => exercise.id === exerciseId);
      if (index === -1) return current;
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
      if (index === -1) return current;
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= current.length) return current;
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(targetIndex, 0, item);
      return next;
    });
  };

  const saveDisabled = workoutTitle.trim().length === 0 || draftExercises.length === 0;
  const saveWorkout = () => {
    if (saveDisabled) return;
    onSaveWorkout({
      title: workoutTitle.trim(),
      description: workoutDescription.trim() || undefined,
      exercises: draftExercises.map((exercise) => exercise.name.trim()).filter(Boolean),
    });
  };

  return (
    <View style={styles.overlay}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.fill}>
        <View style={styles.panel}>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>
                {workout ? copy.editWorkout : copy.createNewWorkout}
              </Text>
              <Text style={styles.subtitle}>{copy.editorSubtitle}</Text>
            </View>
            <View style={styles.headerActions}>
              <Pressable
                accessibilityLabel={workout ? copy.back : copy.cancel}
                accessibilityRole="button"
                onPress={onClose}
                style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
                <Text numberOfLines={2} style={styles.closeLabel}>
                  {workout ? copy.back : copy.cancel}
                </Text>
              </Pressable>
              <Pressable
                accessibilityLabel={copy.save}
                accessibilityRole="button"
                accessibilityState={{ disabled: saveDisabled }}
                disabled={saveDisabled}
                onPress={saveWorkout}
                style={({ pressed }) => [
                  styles.saveButton,
                  saveDisabled && styles.saveButtonDisabled,
                  pressed && !saveDisabled && styles.pressed,
                ]}>
                <Text numberOfLines={2} style={styles.saveLabel}>
                  {copy.save}
                </Text>
              </Pressable>
            </View>
          </View>

          <ScrollView
            automaticallyAdjustKeyboardInsets
            contentContainerStyle={styles.scrollContent}
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
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
              onSaveWorkout={saveWorkout}
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
    flexShrink: 0,
    justifyContent: 'center',
    maxWidth: 110,
    minHeight: 40,
    paddingHorizontal: Spacing.two,
    paddingVertical: 10,
  },
  closeLabel: {
    color: Colors.dark.text,
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  fill: {
    flex: 1,
    width: '100%',
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 0,
    gap: Spacing.one,
  },
  headerCopy: {
    flex: 1,
    gap: 4,
    minWidth: 180,
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
  saveButton: {
    alignItems: 'center',
    backgroundColor: Colors.dark.accent,
    borderCurve: 'continuous',
    borderRadius: 16,
    flexShrink: 0,
    justifyContent: 'center',
    maxWidth: 100,
    minHeight: 40,
    paddingHorizontal: Spacing.two,
    paddingVertical: 10,
  },
  saveButtonDisabled: {
    opacity: 0.38,
  },
  saveLabel: {
    color: Colors.dark.background,
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Spacing.two,
  },
  subtitle: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  title: {
    color: Colors.dark.text,
    flexShrink: 1,
    fontSize: 22,
    fontWeight: '900',
  },
});
