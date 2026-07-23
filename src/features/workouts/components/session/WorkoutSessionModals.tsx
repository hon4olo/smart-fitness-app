import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, Switch, Text, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import { createStyles } from '@/features/workouts/styles/workoutSessionScreenStyles';

type WorkoutSessionStyles = ReturnType<typeof createStyles>;

type ExerciseTarget = {
  exerciseId: string;
  exerciseName: string;
};

type ReplacementExercise = {
  id: string;
  name: string;
  muscleGroup?: string;
  category?: string;
};

type WorkoutSheetRowProps = {
  destructive?: boolean;
  label: string;
  onPress?: () => void;
  styles: WorkoutSessionStyles;
  trailingAccessory?: ReactNode;
};

function WorkoutSheetRow({
  destructive = false,
  label,
  onPress,
  styles,
  trailingAccessory,
}: WorkoutSheetRowProps) {
  const content = (
    <>
      <View style={styles.workoutSheetRowLabelContainer}>
        <Text
          numberOfLines={1}
          style={[
            styles.workoutSheetRowLabel,
            destructive && styles.workoutSheetRowLabelDestructive,
          ]}>
          {label}
        </Text>
      </View>
      {trailingAccessory ? (
        <View style={styles.workoutSheetRowAccessory}>{trailingAccessory}</View>
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [
          styles.workoutSheetRow,
          destructive && styles.workoutSheetRowDestructive,
          pressed && styles.pressed,
        ]}>
        {content}
      </Pressable>
    );
  }

  return (
    <View style={[styles.workoutSheetRow, destructive && styles.workoutSheetRowDestructive]}>
      {content}
    </View>
  );
}

export function ExerciseOverflowModal({
  bottomInset,
  exercise,
  message,
  onCancel,
  onDelete,
  onDismiss,
  onReplace,
  styles,
}: {
  bottomInset: number;
  exercise: ExerciseTarget | null;
  message: string | null;
  onCancel(): void;
  onDelete(target: ExerciseTarget): void;
  onDismiss(): void;
  onReplace(target: ExerciseTarget): void;
  styles: WorkoutSessionStyles;
}) {
  return (
    <Modal
      animationType="fade"
      transparent
      visible={Boolean(exercise)}
      onRequestClose={onDismiss}>
      <Pressable
        onPress={onDismiss}
        style={[styles.overflowBackdrop, { paddingBottom: bottomInset + Spacing.three }]}>
        <Pressable onPress={() => undefined} style={styles.overflowSheet}>
          <Text style={styles.overflowTitle}>{exercise?.exerciseName ?? ''}</Text>
          <View style={styles.overflowActions}>
            {message ? <Text style={styles.overflowMessage}>{message}</Text> : null}
            <Pressable
              onPress={() => exercise && onReplace(exercise)}
              style={({ pressed }) => [styles.overflowAction, pressed && styles.pressed]}>
              <Text style={styles.overflowActionLabel}>Replace exercise</Text>
            </Pressable>
            <Pressable
              onPress={() => exercise && onDelete(exercise)}
              style={({ pressed }) => [
                styles.overflowAction,
                styles.overflowDangerAction,
                pressed && styles.pressed,
              ]}>
              <Text style={[styles.overflowActionLabel, styles.overflowDangerLabel]}>
                Delete exercise
              </Text>
            </Pressable>
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => [styles.overflowCancel, pressed && styles.pressed]}>
              <Text style={styles.overflowCancelLabel}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function WorkoutOverflowModal({
  bottomInset,
  colors,
  onAddExercises,
  onClose,
  onDiscard,
  onTrackRpeChange,
  styles,
  title,
  trackRpeEnabled,
  visible,
}: {
  bottomInset: number;
  colors: typeof Colors.light;
  onAddExercises(): void;
  onClose(): void;
  onDiscard(): void;
  onTrackRpeChange(enabled: boolean): void;
  styles: WorkoutSessionStyles;
  title: string;
  trackRpeEnabled: boolean;
  visible: boolean;
}) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={[styles.overflowBackdrop, { paddingBottom: bottomInset + Spacing.three }]}>
        <Pressable onPress={() => undefined} style={styles.overflowSheet}>
          <Text style={styles.overflowTitle}>{title}</Text>
          <View style={styles.overflowActions}>
            <WorkoutSheetRow
              label="Track RPE"
              styles={styles}
              trailingAccessory={
                <Switch
                  value={trackRpeEnabled}
                  onValueChange={onTrackRpeChange}
                  trackColor={{ false: colors.surfaceSecondary, true: colors.accent }}
                  thumbColor="#FFFFFF"
                />
              }
            />
            <WorkoutSheetRow label="Add exercises" onPress={onAddExercises} styles={styles} />
            <WorkoutSheetRow
              destructive
              label="Discard workout"
              onPress={onDiscard}
              styles={styles}
            />
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.overflowCancel, pressed && styles.pressed]}>
              <Text style={styles.overflowCancelLabel}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function ReplacementExerciseModal({
  exercises,
  onClose,
  onSelect,
  styles,
  target,
}: {
  exercises: ReplacementExercise[];
  onClose(): void;
  onSelect(exercise: ReplacementExercise): void;
  styles: WorkoutSessionStyles;
  target: ExerciseTarget | null;
}) {
  return (
    <Modal
      animationType="slide"
      transparent
      visible={Boolean(target)}
      onRequestClose={onClose}>
      <View style={styles.replacementBackdrop}>
        <View style={styles.replacementSheet}>
          <View style={styles.replacementHeader}>
            <Text style={styles.replacementTitle}>Replace exercise</Text>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.overflowCancel, pressed && styles.pressed]}>
              <Text style={styles.overflowCancelLabel}>Cancel</Text>
            </Pressable>
          </View>
          <ScrollView
            contentInsetAdjustmentBehavior="automatic"
            showsVerticalScrollIndicator={false}>
            {exercises.slice(0, 100).map((exercise) => (
              <Pressable
                key={exercise.id}
                onPress={() => onSelect(exercise)}
                style={({ pressed }) => [styles.replacementRow, pressed && styles.pressed]}>
                <View style={styles.replacementIcon}>
                  <Text style={styles.replacementIconLabel}>
                    {exercise.name.slice(0, 1).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.replacementCopy}>
                  <Text numberOfLines={1} style={styles.replacementRowTitle}>
                    {exercise.name}
                  </Text>
                  <Text numberOfLines={1} style={styles.replacementRowMeta}>
                    {exercise.muscleGroup ?? exercise.category ?? 'Exercise'}
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
