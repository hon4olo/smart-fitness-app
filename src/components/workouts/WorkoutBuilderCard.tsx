import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing } from '@/constants/theme';

import { EmptyWorkoutState } from './EmptyWorkoutState';
import type { DraftWorkoutExercise } from './workout-builder-types';
import { WorkoutBuilderExerciseRow } from './WorkoutBuilderExerciseRow';

type WorkoutBuilderCardProps = {
  draftExerciseName: string;
  draftExercises: DraftWorkoutExercise[];
  editingWorkoutId?: string;
  isExpanded: boolean;
  isSaveWorkoutDisabled: boolean;
  onAddExercise: () => void;
  onCancelEdit: () => void;
  onDraftExerciseNameChange: (value: string) => void;
  onDuplicateExercise: (exerciseId: string) => void;
  onExerciseChange: (exerciseId: string, patch: Partial<DraftWorkoutExercise>) => void;
  onMoveExercise: (exerciseId: string, direction: -1 | 1) => void;
  onRemoveDraftExercise: (exerciseId: string) => void;
  onSaveWorkout: () => void;
  onToggleExpanded: () => void;
  onWorkoutDescriptionChange: (value: string) => void;
  onWorkoutTitleChange: (value: string) => void;
  workoutDescription: string;
  workoutTitle: string;
};

const getSectionTitle = (title: string, isExpanded: boolean) => `${title} ${isExpanded ? '−' : '+'}`;

export function WorkoutBuilderCard({
  draftExerciseName,
  draftExercises,
  editingWorkoutId,
  isExpanded,
  isSaveWorkoutDisabled,
  onAddExercise,
  onCancelEdit,
  onDraftExerciseNameChange,
  onDuplicateExercise,
  onExerciseChange,
  onMoveExercise,
  onRemoveDraftExercise,
  onSaveWorkout,
  onToggleExpanded,
  onWorkoutDescriptionChange,
  onWorkoutTitleChange,
  workoutDescription,
  workoutTitle,
}: WorkoutBuilderCardProps) {
  return (
    <AppCard>
      <Pressable onPress={onToggleExpanded} style={styles.collapsibleHeader}>
        <View style={styles.headerRow}>
          <View style={styles.headerContent}>
            <Text style={styles.sectionTitle}>{getSectionTitle(editingWorkoutId ? 'Edit workout' : 'Workout builder', isExpanded)}</Text>
            <Text style={styles.subtitle}>Create templates with targets, rest, notes, and quick reorder controls.</Text>
          </View>
          <Text style={styles.toggle}>{isExpanded ? '−' : '+'}</Text>
        </View>
      </Pressable>

      {isExpanded ? (
        <>
          <View style={styles.inputGroup}>
            <Text selectable style={styles.inputLabel}>
              Workout title
            </Text>
            <TextInput
              onChangeText={onWorkoutTitleChange}
              placeholder="Push day"
              placeholderTextColor={Colors.dark.textSecondary}
              style={styles.input}
              value={workoutTitle}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text selectable style={styles.inputLabel}>
              Workout notes
            </Text>
            <TextInput
              multiline
              onChangeText={onWorkoutDescriptionChange}
              placeholder="Optional training intent or coaching cues"
              placeholderTextColor={Colors.dark.textSecondary}
              style={styles.notesInput}
              value={workoutDescription}
            />
          </View>

          <View style={styles.quickAddRow}>
            <View style={styles.quickAddField}>
              <Text selectable style={styles.inputLabel}>
                Quick add exercise
              </Text>
              <TextInput
                onChangeText={onDraftExerciseNameChange}
                placeholder="Bench press"
                placeholderTextColor={Colors.dark.textSecondary}
                style={styles.input}
                value={draftExerciseName}
              />
            </View>
            <View style={styles.quickAddAction}>
              <AppButton disabled={draftExerciseName.trim().length === 0} label="Add" onPress={onAddExercise} variant="secondary" />
            </View>
          </View>

          {draftExercises.length === 0 ? (
            <EmptyWorkoutState
              description="Add exercises from the library or manually build a new template above."
              message="No exercises in this workout yet."
              title="Start building"
            />
          ) : (
            <View style={styles.exerciseList}>
              {draftExercises.map((exercise, index) => (
                <WorkoutBuilderExerciseRow
                  key={exercise.id}
                  canMoveDown={index < draftExercises.length - 1}
                  canMoveUp={index > 0}
                  exercise={exercise}
                  onChange={onExerciseChange}
                  onDelete={onRemoveDraftExercise}
                  onDuplicate={onDuplicateExercise}
                  onMove={onMoveExercise}
                />
              ))}
            </View>
          )}

          <View style={styles.footer}>
            {editingWorkoutId ? (
              <AppButton label="Cancel edit" onPress={onCancelEdit} variant="secondary" />
            ) : null}
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
  exerciseList: {
    gap: Spacing.two,
  },
  footer: {
    gap: Spacing.two,
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
  notesInput: {
    backgroundColor: Colors.dark.background,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 8,
    borderWidth: 1,
    color: Colors.dark.text,
    fontSize: 15,
    minHeight: 88,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    textAlignVertical: 'top',
  },
  quickAddAction: {
    justifyContent: 'flex-end',
  },
  quickAddField: {
    flex: 1,
    gap: Spacing.one,
    minWidth: 160,
  },
  quickAddRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    justifyContent: 'space-between',
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
