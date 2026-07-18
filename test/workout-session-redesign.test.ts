import { describe, expect, it } from 'vitest';

declare const require: any;

import { defaultState } from '@/data/defaults';
import { addWorkoutSessionSet, buildCompletedWorkoutSessionSnapshotFromDraft, createWorkoutSessionDraft, getWorkoutSessionCompletedSetCount, toggleWorkoutSessionSetCompletion } from '@/features/workouts/sessionScreenModel';

const workout = defaultState.workouts.find((item) => item.id === 'push-a') ?? defaultState.workouts[0]!;

describe('workout session redesign', () => {
  it('keeps the session screen sequential and low chrome', () => {
    const source = require('fs').readFileSync('/root/smart-fitness-app/src/features/workouts/screens/WorkoutSessionScreen.tsx', 'utf8');
    const finishSource = require('fs').readFileSync('/root/smart-fitness-app/src/features/workouts/screens/WorkoutSessionFinishScreen.tsx', 'utf8');

    expect(source).toContain('Finish');
    expect(source).toContain('Add set');
    expect(source).toContain('Previous');
    expect(source).toContain('kg');
    expect(source).toContain('Reps');
    expect(source).toContain('✓');
    expect(source).not.toContain('Exercise X of Y');
    expect(source).not.toContain('WorkoutSessionExerciseNavigator');
    expect(source).not.toContain('Save set');
    expect(source).not.toContain('Edit set');
    expect(source).not.toContain('Add exercises');
    expect(source).not.toContain('horizontal chips');

    expect(finishSource).toContain('Finish Workout');
    expect(finishSource).toContain('Workout saved');
    expect(finishSource).toContain('Discard workout');
    expect(finishSource).toContain('Save');
  });

  it('uses a full-width five column set table grid', () => {
    const sessionTable = require('fs').readFileSync('/root/smart-fitness-app/src/features/workouts/components/session/SessionSetTable.tsx', 'utf8');
    const sessionLayout = require('fs').readFileSync('/root/smart-fitness-app/src/features/workouts/components/session/sessionTableLayout.ts', 'utf8');
    const sessionRow = require('fs').readFileSync('/root/smart-fitness-app/src/features/workouts/components/session/SessionSetRow.tsx', 'utf8');

    expect(sessionLayout).toContain("set: '10%'");
    expect(sessionLayout).toContain("previous: '28%'");
    expect(sessionLayout).toContain("weight: '20%'");
    expect(sessionLayout).toContain("reps: '20%'");
    expect(sessionLayout).toContain("completion: '22%'");
    expect(sessionLayout).toContain("SESSION_TABLE_TOTAL_WIDTH = '100%'");
    expect(sessionTable).toContain("alignSelf: 'stretch'");
    expect(sessionTable).toContain("width: '100%'");
    expect(sessionTable).toContain('SESSION_TABLE_COLUMNS.completion');
    expect(sessionRow).toContain("width: '100%'");
    expect(sessionRow).toContain('minHeight: 44');
    expect(sessionRow).not.toContain('colOverflow');
  });

  it('supports add set, complete set, and finish gating', () => {
    const initial = createWorkoutSessionDraft(workout);
    expect(getWorkoutSessionCompletedSetCount(initial)).toBe(0);

    const withSet = addWorkoutSessionSet(initial, { id: 'bench', name: 'Bench Press', targetReps: 6 }, undefined);
    expect(withSet.sets).toHaveLength(1);
    expect(getWorkoutSessionCompletedSetCount(withSet)).toBe(0);

    const completed = toggleWorkoutSessionSetCompletion(withSet, withSet.sets[0].id);
    expect(getWorkoutSessionCompletedSetCount(completed)).toBe(1);

    const snapshot = buildCompletedWorkoutSessionSnapshotFromDraft(completed, { finishedAt: '2026-01-17T10:15:00.000Z', notes: 'Done' });
    expect(snapshot.sets).toHaveLength(1);
    expect(snapshot.notes).toBe('Done');
  });

  it('hides the empty workout CTA when add exercise is not implemented', () => {
    const source = require('fs').readFileSync('/root/smart-fitness-app/src/features/workouts/screens/WorkoutsScreen.tsx', 'utf8');

    expect(source).toContain('Start now');
    expect(source).toContain('Programs');
    expect(source).not.toContain('Start empty workout');
    expect(source).not.toContain('Add exercise');
    expect(source).not.toContain('Workout plan:');
  });
});
