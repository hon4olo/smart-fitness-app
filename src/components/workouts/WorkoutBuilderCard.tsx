import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Colors, Spacing } from '@/constants/theme';
import { useLocalization } from '@/localization';
import { getWorkoutBuilderCopy } from '@/localization/workoutBuilderCopy';

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

export function WorkoutBuilderCard({
  draftExerciseName,
  draftExercises,
  editingWorkoutId,
  isExpanded,
  onAddExercise,
  onCancelEdit,
  onDraftExerciseNameChange,
  onDuplicateExercise,
  onExerciseChange,
  onMoveExercise,
  onRemoveDraftExercise,
  onToggleExpanded,
  onWorkoutDescriptionChange,
  onWorkoutTitleChange,
  workoutDescription,
  workoutTitle,
}: WorkoutBuilderCardProps) {
  const { locale } = useLocalization();
  const copy = getWorkoutBuilderCopy(locale);
  const sectionTitle = editingWorkoutId ? copy.editWorkout : copy.workoutBuilder;

  return (
    <AppCard>
      <Pressable
        accessibilityLabel={isExpanded ? copy.collapseBuilder : copy.expandBuilder}
        accessibilityRole="button"
        accessibilityState={{ expanded: isExpanded }}
        onPress={onToggleExpanded}
        style={styles.collapsibleHeader}>
        <View style={styles.headerRow}>
          <View style={styles.headerContent}>
            <Text style={styles.sectionTitle}>{sectionTitle}</Text>
            <Text style={styles.subtitle}>{copy.workoutBuilderSubtitle}</Text>
          </View>
          <Text accessibilityElementsHidden style={styles.toggle}>
            {isExpanded ? '−' : '+'}
          </Text>
        </View>
      </Pressable>

      {isExpanded ? (
        <>
          <View style={styles.inputGroup}>
            <Text selectable style={styles.inputLabel}>
              {copy.workoutTitle}
            </Text>
            <TextInput
              accessibilityLabel={copy.workoutTitle}
              onChangeText={onWorkoutTitleChange}
              placeholder={copy.workoutTitlePlaceholder}
              placeholderTextColor={Colors.dark.textSecondary}
              style={styles.input}
              value={workoutTitle}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text selectable style={styles.inputLabel}>
              {copy.workoutNotes}
            </Text>
            <TextInput
              accessibilityLabel={copy.workoutNotes}
              multiline
              onChangeText={onWorkoutDescriptionChange}
              placeholder={copy.workoutNotesPlaceholder}
              placeholderTextColor={Colors.dark.textSecondary}
              style={styles.notesInput}
              value={workoutDescription}
            />
          </View>

          <View style={styles.quickAddRow}>
            <View style={styles.quickAddField}>
              <Text selectable style={styles.inputLabel}>
                {copy.quickAddExercise}
              </Text>
              <TextInput
                accessibilityLabel={copy.quickAddExercise}
                onChangeText={onDraftExerciseNameChange}
                placeholder={copy.exercisePlaceholder}
                placeholderTextColor={Colors.dark.textSecondary}
                style={styles.input}
                value={draftExerciseName}
              />
            </View>
            <View style={styles.quickAddAction}>
              <AppButton
                disabled={draftExerciseName.trim().length === 0}
                label={copy.add}
                onPress={onAddExercise}
                variant="secondary"
              />
            </View>
          </View>

          {draftExercises.length === 0 ? (
            <EmptyState
              compact
              description={copy.noExercisesInWorkoutBody}
              message={copy.noExercisesInWorkout}
              title={copy.startBuilding}
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
              <AppButton
                label={copy.cancelEdit}
                onPress={onCancelEdit}
                variant="secondary"
              />
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
    minWidth: 0,
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
    flexShrink: 0,
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
    flexShrink: 1,
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    color: Colors.dark.textSecondary,
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  toggle: {
    color: Colors.dark.accent,
    flexShrink: 0,
    fontSize: 24,
    fontWeight: '700',
  },
});
