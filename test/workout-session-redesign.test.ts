import { describe, expect, it } from 'vitest';

declare const __dirname: string;
declare const require: any;

const { readFileSync } = require('fs') as { readFileSync: (path: string, encoding: string) => string };
const { resolve } = require('path') as { resolve: (...parts: string[]) => string };

import { defaultState } from '@/data/defaults';
import { addWorkoutSessionSet, buildCompletedWorkoutSessionSnapshotFromDraft, createWorkoutSessionDraft, getWorkoutSessionCompletedSetCount, toggleWorkoutSessionSetCompletion } from '@/features/workouts/sessionScreenModel';

const projectRoot = resolve(__dirname, '..');
const readSource = (relativePath: string) => readFileSync(resolve(projectRoot, relativePath), 'utf8');

const workout = defaultState.workouts.find((item) => item.id === 'push-a') ?? defaultState.workouts[0]!;

describe('workout session redesign', () => {
  it('keeps the session screen sequential and low chrome', () => {
    const source = readSource('src/features/workouts/screens/WorkoutSessionScreen.tsx');
    const finishSource = readSource('src/features/workouts/screens/WorkoutSessionFinishScreen.tsx');
    const sessionHeader = readSource('src/features/workouts/components/session/SessionHeader.tsx');
    const sessionTable = readSource('src/features/workouts/components/session/SessionSetTable.tsx');
    const sessionSection = readSource('src/features/workouts/components/session/SessionExerciseSection.tsx');
    const sessionUi = [source, sessionHeader, sessionTable, sessionSection].join('\n');

    expect(sessionUi).toContain('Finish');
    expect(sessionUi).toContain('Add set');
    expect(sessionUi).toContain('Previous');
    expect(sessionUi).toContain('kg');
    expect(sessionUi).toContain('Reps');
    expect(sessionUi).toContain('✓');
    expect(source).not.toContain('Exercise X of Y');
    expect(source).not.toContain('WorkoutSessionExerciseNavigator');
    expect(source).not.toContain('Save set');
    expect(source).not.toContain('Edit set');
    expect(source).not.toContain('horizontal chips');

    expect(finishSource).toContain('Finish Workout');
    expect(finishSource).toContain('Discard Workout');
    expect(finishSource).toContain('Save');
  });

  it('uses a full-width five column set table grid', () => {
    const sessionTable = readSource('src/features/workouts/components/session/SessionSetTable.tsx');
    const sessionLayout = readSource('src/features/workouts/components/session/sessionTableLayout.ts');
    const sessionRow = readSource('src/features/workouts/components/session/SessionSetRow.tsx');

    expect(sessionLayout).toContain('set: 24');
    expect(sessionLayout).toContain('previous: 68');
    expect(sessionLayout).toContain('weight: 92');
    expect(sessionLayout).toContain('reps: 92');
    expect(sessionLayout).toContain('completion: 30');
    expect(sessionLayout).toContain('SESSION_TABLE_TOTAL_WIDTH =');
    expect(sessionTable).toContain('width: SESSION_TABLE_TOTAL_WIDTH');
    expect(sessionTable).toContain('SESSION_TABLE_COLUMNS.completion');
    expect(sessionRow).toContain('width: SESSION_TABLE_TOTAL_WIDTH');
    expect(sessionRow).toContain('minHeight: 48');
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
    const source = readSource('src/features/workouts/screens/WorkoutsScreen.tsx');

    expect(source).toContain('Start Now');
    expect(source).toContain('Programs');
    expect(source).not.toContain('Start empty workout');
    expect(source).not.toContain('Workout plan:');
  });
});
