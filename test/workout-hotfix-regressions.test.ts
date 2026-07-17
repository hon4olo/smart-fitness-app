import { beforeEach, describe, expect, it } from 'vitest';

declare const require: any;

import { defaultState } from '@/data/defaults';
import { buildCompletedWorkoutSessionSnapshotFromDraft, createWorkoutSessionDraft } from '@/features/workouts/sessionScreenModel';
import { clearActiveWorkoutSessionDraft, getActiveWorkoutSessionDraft, setActiveWorkoutSessionDraft, upsertWorkoutSessionById } from '@/lib/workouts';

const readFileSync = require('fs').readFileSync as (path: string, encoding: string) => string;

describe('workout hotfix regressions', () => {
  beforeEach(() => {
    clearActiveWorkoutSessionDraft();
  });

  it('keeps workout template detail read-only by default and starts workouts from the sticky action', () => {
    const templateSource = readFileSync('/root/smart-fitness-app/src/features/workouts/screens/WorkoutTemplateDetailScreen.tsx', 'utf8');
    const programSource = readFileSync('/root/smart-fitness-app/src/features/workouts/screens/ProgramDetailScreen.tsx', 'utf8');

    expect(templateSource).toContain('Start workout');
    expect(templateSource).not.toContain('Save workout');
    expect(templateSource).not.toContain('TextInput');
    expect(programSource).not.toContain('Save Program');
    expect(programSource).not.toContain('TextInput');
    expect(programSource).not.toContain('Save program');
  });

  it('saves a completed workout once, clears the active draft, and resists duplicate upserts', () => {
    const workout = defaultState.workouts.find((item) => item.id === 'legs-a');
    expect(workout).toBeDefined();
    if (!workout) {
      throw new Error('Expected Lower Body workout fixture');
    }

    const draft = createWorkoutSessionDraft(workout);
    setActiveWorkoutSessionDraft({
      ...draft,
      sets: [
        {
          id: 'set-1',
          exerciseId: 'back-squat',
          exerciseName: 'Back squat',
          weight: 100,
          reps: 8,
          completed: true,
        },
      ],
    });

    const activeDraft = getActiveWorkoutSessionDraft();
    expect(activeDraft).not.toBeNull();
    if (!activeDraft) {
      throw new Error('Expected active workout draft');
    }

    const snapshot = buildCompletedWorkoutSessionSnapshotFromDraft(activeDraft, {
      finishedAt: '2026-01-17T10:15:00.000Z',
      notes: 'Finished cleanly',
    });

    const firstSave = upsertWorkoutSessionById([], snapshot);
    clearActiveWorkoutSessionDraft();
    const secondSave = upsertWorkoutSessionById(firstSave, snapshot);

    expect(getActiveWorkoutSessionDraft()).toBeNull();
    expect(firstSave).toHaveLength(1);
    expect(secondSave).toHaveLength(1);
    expect(secondSave[0]).toEqual(snapshot);
  });

  it('never shows a stale Start empty workout action', () => {
    const source = readFileSync('/root/smart-fitness-app/src/features/workouts/screens/WorkoutsScreen.tsx', 'utf8');

    expect(source).not.toContain('Start empty workout');
    expect(source).not.toContain('Add exercise');
  });
});
