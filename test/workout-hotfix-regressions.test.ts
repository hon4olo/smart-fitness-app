import { beforeEach, describe, expect, it } from 'vitest';

declare const __dirname: string;
declare const require: any;

import { defaultState } from '@/data/defaults';
import { buildCompletedWorkoutSessionSnapshotFromDraft, createWorkoutSessionDraft } from '@/features/workouts/sessionScreenModel';
import { clearActiveWorkoutSessionDraft, getActiveWorkoutSessionDraft, setActiveWorkoutSessionDraft, upsertWorkoutSessionById } from '@/lib/workouts';

const readFileSync = require('fs').readFileSync as (path: string, encoding: string) => string;
const { resolve } = require('path') as { resolve: (...parts: string[]) => string };
const projectRoot = resolve(__dirname, '..');
const readSource = (relativePath: string) => readFileSync(resolve(projectRoot, relativePath), 'utf8');

describe('workout hotfix regressions', () => {
  beforeEach(() => {
    clearActiveWorkoutSessionDraft();
  });

  it('keeps workout template detail read-only by default and starts workouts from the sticky action', () => {
    const templateSource = readSource('src/features/workouts/screens/WorkoutTemplateDetailScreen.tsx');
    const programSource = readSource('src/features/workouts/screens/ProgramDetailScreen.tsx');
    const builderSource = readSource('src/app/workouts/builder.tsx');
    const workoutEditorSource = readSource('src/components/workouts/ProgramWorkoutEditorModal.tsx');

    expect(templateSource).toContain('startWorkoutSession(workout)');
    expect(templateSource).toContain('copy.startWorkout');
    expect(templateSource).not.toContain('Save workout');
    expect(templateSource).not.toContain('TextInput');
    expect(programSource).toContain("pathname: '/workouts/routine/new'");
    expect(programSource).toContain('copy.addRoutine');
    expect(programSource).not.toContain('styles.startChip');
    expect(programSource).not.toContain('Save Program');
    expect(programSource).not.toContain('TextInput');
    expect(programSource).not.toContain('Save program');
    expect(builderSource).not.toContain('[existingProgram, workouts]');
    expect(workoutEditorSource).toContain('Save');
    expect(workoutEditorSource).toContain('headerActions');
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
});
