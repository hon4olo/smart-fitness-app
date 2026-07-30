import { Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { createStyles } from '@/features/workouts/styles/newRoutineScreenStyles';
import type { ProgramRoutineCopy } from '@/localization/programRoutineCopy';
import { useAppTheme } from '@/theme/AppThemeProvider';
import type { Exercise } from '@/types';

export type RoutinePickerMode =
  | { type: 'add' }
  | { type: 'replace'; exerciseId: string };

const getExerciseSubtitle = (exercise: Exercise, fallback: string) =>
  exercise.muscleGroup ?? exercise.category ?? exercise.primaryMuscles?.[0] ?? fallback;

export function RoutineExercisePickerModal({
  copy,
  exercises,
  mode,
  onAdd,
  onClose,
  onReplace,
  selectedExerciseIds,
}: {
  copy: ProgramRoutineCopy;
  exercises: Exercise[];
  mode: RoutinePickerMode | null;
  onAdd(exercise: Exercise): void;
  onClose(): void;
  onReplace(exerciseId: string, replacement: Exercise): void;
  selectedExerciseIds: Set<string>;
}) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Modal
      animationType="slide"
      transparent
      visible={Boolean(mode)}
      onRequestClose={onClose}>
      <View style={styles.pickerOverlay}>
        <View style={styles.pickerPanel}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>
              {mode?.type === 'replace' ? copy.replaceExercise : copy.addExercises}
            </Text>
            <Pressable
              accessibilityLabel={copy.done}
              accessibilityRole="button"
              onPress={onClose}
              style={({ pressed }) => [styles.textButton, pressed && styles.pressed]}>
              <Text style={styles.textButtonLabel}>{copy.done}</Text>
            </Pressable>
          </View>
          <ScrollView
            contentInsetAdjustmentBehavior="automatic"
            showsVerticalScrollIndicator={false}>
            {exercises.slice(0, 100).map((exercise) => {
              const selected = selectedExerciseIds.has(exercise.id);
              return (
                <Pressable
                  accessibilityLabel={exercise.name}
                  accessibilityRole="button"
                  accessibilityState={{ selected: selected && mode?.type === 'add' }}
                  key={exercise.id}
                  onPress={() => {
                    if (mode?.type === 'replace') {
                      onReplace(mode.exerciseId, exercise);
                      onClose();
                      return;
                    }
                    onAdd(exercise);
                  }}
                  style={({ pressed }) => [styles.pickerRow, pressed && styles.pressed]}>
                  <View style={styles.pickerRowCopy}>
                    <Text numberOfLines={1} style={styles.pickerRowTitle}>
                      {exercise.name}
                    </Text>
                    <Text numberOfLines={1} style={styles.pickerRowMeta}>
                      {getExerciseSubtitle(exercise, copy.exerciseFallback)}
                    </Text>
                  </View>
                  <Text style={styles.check}>
                    {selected && mode?.type === 'add' ? '✓' : ''}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function RoutineExerciseMenuModal({
  copy,
  exercise,
  onClose,
  onDelete,
  onReplace,
}: {
  copy: ProgramRoutineCopy;
  exercise: Exercise | null;
  onClose(): void;
  onDelete(exerciseId: string): void;
  onReplace(exerciseId: string): void;
}) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Modal
      animationType="fade"
      transparent
      visible={Boolean(exercise)}
      onRequestClose={onClose}>
      <Pressable
        accessibilityLabel={copy.cancel}
        accessibilityRole="button"
        onPress={onClose}
        style={[styles.menuOverlay, { paddingBottom: insets.bottom + Spacing.three }]}>
        <Pressable onPress={() => undefined} style={styles.menuPanel}>
          <Text style={styles.menuTitle}>{exercise?.name}</Text>
          <Pressable
            accessibilityLabel={copy.replaceExercise}
            accessibilityRole="button"
            onPress={() => {
              if (!exercise) return;
              onReplace(exercise.id);
            }}
            style={({ pressed }) => [styles.menuAction, pressed && styles.pressed]}>
            <Text style={styles.menuActionLabel}>{copy.replaceExercise}</Text>
          </Pressable>
          <Pressable
            accessibilityLabel={copy.deleteExercise}
            accessibilityRole="button"
            onPress={() => {
              if (!exercise) return;
              Alert.alert(copy.deleteExerciseTitle, copy.deleteExerciseBody, [
                { text: copy.cancel, style: 'cancel' },
                {
                  text: copy.deleteExercise,
                  style: 'destructive',
                  onPress: () => onDelete(exercise.id),
                },
              ]);
            }}
            style={({ pressed }) => [styles.menuAction, pressed && styles.pressed]}>
            <Text style={[styles.menuActionLabel, styles.deleteLabel]}>
              {copy.deleteExercise}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
