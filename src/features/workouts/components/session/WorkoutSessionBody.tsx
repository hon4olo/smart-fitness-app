import { Alert, ScrollView, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { getPreviousCompletedSetsForExercise } from '@/features/workouts/sessionScreenModel';
import { createStyles } from '@/features/workouts/styles/workoutSessionScreenStyles';
import type { WorkoutSessionDraft } from '@/features/workouts/types';
import type { WorkoutSession } from '@/types';

import { WorkoutSessionEmptyWorkoutCard } from './WorkoutSessionEmptyWorkoutCard';
import { WorkoutSessionFooterActions } from './WorkoutSessionFooterActions';
import { SessionExerciseSection } from './SessionExerciseSection';
import { SessionHeader } from './SessionHeader';
import type { SessionDraftInputs, SessionExercise } from './types';

type WorkoutSessionStyles = ReturnType<typeof createStyles>;

type PlannedSetField = 'weight' | 'reps';

export function WorkoutSessionBody({
  bottomInset,
  canFinish,
  completedReps,
  completedSetCount,
  completedVolume,
  draft,
  draftInputs,
  elapsedLabel,
  expandedExerciseId,
  isEmptyWorkout,
  onAddExercises,
  onAddSet,
  onBack,
  onEditSetRpe,
  onFinish,
  onLongPressExercise,
  onOverflow,
  onPlannedSetChange,
  onPlannedToggleSetCompletion,
  onRemoveSet,
  onSetChange,
  onTestGif,
  onToggleExpanded,
  onToggleSetCompletion,
  styles,
  visibleExercises,
  workoutSessions,
}: {
  bottomInset: number;
  canFinish: boolean;
  completedReps: number;
  completedSetCount: number;
  completedVolume: number;
  draft: WorkoutSessionDraft;
  draftInputs: SessionDraftInputs;
  elapsedLabel: string;
  expandedExerciseId: string | null;
  isEmptyWorkout: boolean;
  onAddExercises(): void;
  onAddSet(exerciseId: string): void;
  onBack(): void;
  onEditSetRpe(setId: string): void;
  onFinish(): void;
  onLongPressExercise(exerciseId: string, exerciseName: string): void;
  onOverflow(): void;
  onPlannedSetChange(
    exerciseId: string,
    index: number,
    field: PlannedSetField,
    value: string,
  ): void;
  onPlannedToggleSetCompletion(exerciseId: string, index: number): void;
  onRemoveSet(setId: string): void;
  onSetChange(setId: string, field: PlannedSetField, value: string): void;
  onTestGif(): void;
  onToggleExpanded(exerciseId: string): void;
  onToggleSetCompletion(setId: string): void;
  styles: WorkoutSessionStyles;
  visibleExercises: SessionExercise[];
  workoutSessions: WorkoutSession[];
}) {
  return (
    <>
      <SessionHeader
        elapsedLabel={elapsedLabel}
        finishDisabled={!canFinish}
        onBack={onBack}
        onFinish={onFinish}
        onOverflow={onOverflow}
        reps={completedReps}
        sets={completedSetCount}
        title={draft.workoutTitle}
        volume={completedVolume}
      />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[
          styles.content,
          { paddingBottom: bottomInset + Spacing.five },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}>
        <View style={styles.container}>
          {isEmptyWorkout && draft.sets.length === 0 ? (
            <WorkoutSessionEmptyWorkoutCard
              onAddExercises={onAddExercises}
              onTestGif={onTestGif}
              styles={styles}
            />
          ) : null}

          {visibleExercises.map((exercise) => {
            const exerciseSets = draft.sets.filter((set) => set.exerciseId === exercise.id);
            const previousSets = getPreviousCompletedSetsForExercise(exercise.id, workoutSessions);

            return (
              <SessionExerciseSection
                key={exercise.id}
                draftInputs={draftInputs}
                exercise={exercise}
                exerciseCompleted={
                  exerciseSets.length > 0 &&
                  exerciseSets.every((set) => set.completed !== false)
                }
                exerciseSets={exerciseSets}
                expanded={expandedExerciseId === exercise.id}
                onAddSet={onAddSet}
                onCommitRowInputs={() => undefined}
                onLongPressExercise={onLongPressExercise}
                onLongPressRow={(setId) =>
                  Alert.alert('Set actions', undefined, [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete set',
                      style: 'destructive',
                      onPress: () => onRemoveSet(setId),
                    },
                  ])
                }
                onNotesPress={
                  exercise.notes ? () => Alert.alert('Notes', exercise.notes ?? '') : undefined
                }
                onEditSetRpe={onEditSetRpe}
                onRepsChange={(setId, value) => onSetChange(setId, 'reps', value)}
                onPlannedRepsChange={onPlannedSetChange}
                onPlannedToggleSetCompletion={onPlannedToggleSetCompletion}
                onPlannedWeightChange={onPlannedSetChange}
                onToggleExpanded={onToggleExpanded}
                onToggleSetCompletion={onToggleSetCompletion}
                onWeightChange={(setId, value) => onSetChange(setId, 'weight', value)}
                previousSets={previousSets}
              />
            );
          })}

          <WorkoutSessionFooterActions
            onAddExercises={onAddExercises}
            onTestGif={onTestGif}
            styles={styles}
            visible={visibleExercises.length > 0}
          />
        </View>
      </ScrollView>
    </>
  );
}
