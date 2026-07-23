import { Alert } from 'react-native';

import { Colors } from '@/constants/theme';
import { RpeBottomSheet } from '@/features/workouts/components/session/RpeBottomSheet';
import {
  ExerciseOverflowModal,
  ReplacementExerciseModal,
  WorkoutOverflowModal,
} from '@/features/workouts/components/session/WorkoutSessionModals';
import { createStyles } from '@/features/workouts/styles/workoutSessionScreenStyles';
import type { WorkoutRpe } from '@/types';

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

export function WorkoutSessionModalLayer({
  bottomInset,
  colors,
  exerciseOverflow,
  exercises,
  onClearExercise,
  onCloseExerciseOverflow,
  onCloseReplacement,
  onCloseWorkoutOverflow,
  onDiscardWorkout,
  onOpenAddExercises,
  onReplaceExercise,
  onSelectReplacement,
  onSetActualRpe,
  onSetExerciseOverflow,
  onSetReplacementTarget,
  onSetRpeSetId,
  onSetTrackRpeEnabled,
  overflowMessage,
  replacementTarget,
  rpeSet,
  rpeSetId,
  rpeSetLabel,
  styles,
  trackRpeEnabled,
  workoutOverflowOpen,
  workoutTitle,
}: {
  bottomInset: number;
  colors: typeof Colors.light;
  exerciseOverflow: ExerciseTarget | null;
  exercises: ReplacementExercise[];
  onClearExercise(exerciseId: string): void;
  onCloseExerciseOverflow(clearMessage?: boolean): void;
  onCloseReplacement(): void;
  onCloseWorkoutOverflow(): void;
  onDiscardWorkout(): void;
  onOpenAddExercises(): void;
  onReplaceExercise(target: ExerciseTarget): void;
  onSelectReplacement(exercise: ReplacementExercise): void;
  onSetActualRpe(setId: string, actualRpe?: WorkoutRpe): void;
  onSetExerciseOverflow(target: ExerciseTarget | null): void;
  onSetReplacementTarget(target: ExerciseTarget | null): void;
  onSetRpeSetId(setId: string | null): void;
  onSetTrackRpeEnabled(enabled: boolean): void;
  overflowMessage: string | null;
  replacementTarget: ExerciseTarget | null;
  rpeSet?: { actualRpe?: WorkoutRpe };
  rpeSetId: string | null;
  rpeSetLabel: string;
  styles: WorkoutSessionStyles;
  trackRpeEnabled: boolean;
  workoutOverflowOpen: boolean;
  workoutTitle: string;
}) {
  return (
    <>
      <ExerciseOverflowModal
        bottomInset={bottomInset}
        exercise={exerciseOverflow}
        message={overflowMessage}
        onCancel={() => onCloseExerciseOverflow(true)}
        onDelete={(target) => {
          onClearExercise(target.exerciseId);
          onSetExerciseOverflow(null);
        }}
        onDismiss={() => onCloseExerciseOverflow(false)}
        onReplace={(target) => {
          onSetReplacementTarget(target);
          onSetExerciseOverflow(null);
          onReplaceExercise(target);
        }}
        styles={styles}
      />

      <WorkoutOverflowModal
        bottomInset={bottomInset}
        colors={colors}
        onAddExercises={onOpenAddExercises}
        onClose={onCloseWorkoutOverflow}
        onDiscard={() => {
          onCloseWorkoutOverflow();
          Alert.alert('Discard workout?', 'Your logged sets will not be saved.', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Discard workout',
              style: 'destructive',
              onPress: onDiscardWorkout,
            },
          ]);
        }}
        onTrackRpeChange={onSetTrackRpeEnabled}
        styles={styles}
        title={workoutTitle}
        trackRpeEnabled={trackRpeEnabled}
        visible={workoutOverflowOpen}
      />

      <ReplacementExerciseModal
        exercises={exercises}
        onClose={onCloseReplacement}
        onSelect={onSelectReplacement}
        styles={styles}
        target={replacementTarget}
      />

      <RpeBottomSheet
        selectedRpe={rpeSet?.actualRpe}
        setLabel={rpeSetLabel}
        visible={Boolean(rpeSet)}
        onDismiss={() => onSetRpeSetId(null)}
        onSelect={(value) => {
          if (rpeSetId) {
            onSetActualRpe(rpeSetId, value);
          }
        }}
        onSkip={() => {
          if (rpeSetId) {
            onSetActualRpe(rpeSetId, undefined);
          }
        }}
      />
    </>
  );
}
