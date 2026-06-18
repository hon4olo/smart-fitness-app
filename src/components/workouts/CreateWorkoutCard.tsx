import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing } from '@/constants/theme';

type CreateWorkoutCardProps = {
  draftExerciseName: string;
  draftExercises: string[];
  editingWorkoutId?: string;
  isExpanded: boolean;
  isSaveWorkoutDisabled: boolean;
  onAddExercise: () => void;
  onCancelEdit: () => void;
  onDraftExerciseNameChange: (value: string) => void;
  onRemoveDraftExercise: (exerciseIndex: number) => void;
  onSaveWorkout: () => void;
  onToggleExpanded: () => void;
  onWorkoutDescriptionChange: (value: string) => void;
  onWorkoutTitleChange: (value: string) => void;
  workoutDescription: string;
  workoutTitle: string;
};

const getSectionTitle = (title: string, isExpanded: boolean) => {
  return `${title} ${isExpanded ? '−' : '+'}`;
};

export function CreateWorkoutCard({
  draftExerciseName,
  draftExercises,
  editingWorkoutId,
  isExpanded,
  isSaveWorkoutDisabled,
  onAddExercise,
  onCancelEdit,
  onDraftExerciseNameChange,
  onRemoveDraftExercise,
  onSaveWorkout,
  onToggleExpanded,
  onWorkoutDescriptionChange,
  onWorkoutTitleChange,
  workoutDescription,
  workoutTitle,
}: CreateWorkoutCardProps) {
  return (
    <AppCard>
      <Pressable onPress={onToggleExpanded} style={styles.collapsibleHeader}>
        <Text style={styles.sectionTitle}>
          {getSectionTitle(editingWorkoutId ? 'Edit Workout' : 'Create Workout', isExpanded)}
        </Text>
      </Pressable>

      {isExpanded ? (
        <>
          <Text selectable style={styles.formTitle}>
            {editingWorkoutId ? 'Edit Workout' : 'Create Workout'}
          </Text>

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
              Description
            </Text>
            <TextInput
              onChangeText={onWorkoutDescriptionChange}
              placeholder="Optional description"
              placeholderTextColor={Colors.dark.textSecondary}
              style={styles.input}
              value={workoutDescription}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text selectable style={styles.inputLabel}>
              Exercise name
            </Text>
            <TextInput
              onChangeText={onDraftExerciseNameChange}
              placeholder="Bench press"
              placeholderTextColor={Colors.dark.textSecondary}
              style={styles.input}
              value={draftExerciseName}
            />
          </View>

          <AppButton
            disabled={draftExerciseName.trim().length === 0}
            label="Add Exercise"
            onPress={onAddExercise}
            variant="secondary"
          />

          {draftExercises.length > 0 ? (
            <View style={styles.draftList}>
              {draftExercises.map((exercise, index) => (
                <View key={`${exercise}-${index}`} style={styles.draftRow}>
                  <Text selectable style={styles.exercise}>
                    {exercise}
                  </Text>
                  <AppButton
                    label="Remove"
                    onPress={() => onRemoveDraftExercise(index)}
                    variant="secondary"
                  />
                </View>
              ))}
            </View>
          ) : null}

          <AppButton disabled={isSaveWorkoutDisabled} label="Save Workout" onPress={onSaveWorkout} />
          {editingWorkoutId ? <AppButton label="Cancel Edit" onPress={onCancelEdit} variant="secondary" /> : null}
        </>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  collapsibleHeader: {
    paddingBottom: Spacing.two,
  },
  draftList: {
    gap: Spacing.two,
  },
  draftRow: {
    alignItems: 'center',
    borderColor: Colors.dark.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
    paddingTop: Spacing.two,
  },
  exercise: {
    color: Colors.dark.text,
    fontSize: 15,
  },
  formTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '800',
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
  sectionTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '800',
  },
});
