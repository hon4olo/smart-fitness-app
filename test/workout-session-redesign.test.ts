import { describe, expect, test } from 'vitest';

declare const __dirname: string;
declare const require: any;

const { readFileSync } = require('fs') as { readFileSync: (path: string, encoding: string) => string };
const { resolve } = require('path') as { resolve: (...parts: string[]) => string };

const projectRoot = resolve(__dirname, '..');
const readSource = (relativePath: string) => readFileSync(resolve(projectRoot, relativePath), 'utf8');
const count = (source: string, needle: string) => (source.match(new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) ?? []).length;

describe('workout session redesign', () => {
  test('the active session screen is sequential and low-chrome', () => {
    const route = readSource('src/app/workout-session.tsx');
    const screen = readSource('src/features/workouts/screens/WorkoutSessionScreen.tsx');
    const storage = readSource('src/lib/workouts.ts');
    const layout = readSource('src/app/_layout.tsx');

    expect(route).toContain('WorkoutSessionScreen');
    expect(layout).toContain("presentation: 'fullScreenModal'");

    expect(screen).toContain('hydrateActiveWorkoutSessionDraft');
    expect(screen).toContain('Finish');
    expect(screen).toContain('Add exercises');
    expect(screen).toContain('toggleSetCompletion');
    expect(screen).toContain('keyboardShouldPersistTaps="handled"');
    expect(screen).toContain("Alert.alert('Discard workout?'");
    expect(screen).toContain('Complete');
    expect(screen).toContain('WorkoutSessionEmptyState');
    expect(count(screen, 'WorkoutSessionExerciseNavigator')).toBe(0);
    expect(count(screen, 'Save set')).toBe(0);
    expect(count(screen, 'Edit set')).toBe(0);

    expect(storage).toContain('hydrateActiveWorkoutSessionDraft');
    expect(storage).toContain('setActiveWorkoutSessionDraft');
  });

  test('the finish flow stays minimal', () => {
    const route = readSource('src/app/workout-session-finish.tsx');
    const summary = readSource('src/features/workouts/components/finish/FinishWorkoutSummary.tsx');
    const notes = readSource('src/features/workouts/components/finish/FinishWorkoutNotes.tsx');
    const actions = readSource('src/features/workouts/components/finish/FinishWorkoutActions.tsx');
    const saved = readSource('src/features/workouts/components/finish/WorkoutSavedSummary.tsx');

    expect(route).toContain('WorkoutSessionFinishScreen');
    expect(summary).toContain('Workout');
    expect(summary).toContain('Date & time');
    expect(summary).toContain('Duration');
    expect(notes).toContain('Notes');
    expect(actions).toContain('disabled={disabled}');
    expect(actions).toContain('Save');
    expect(saved).toContain('Workout saved');
    expect(saved).toContain('Back to Workouts');
    expect(saved).toContain('Home');
    expect(saved).not.toContain('Photo');
    expect(saved).not.toContain('analytics');
    expect(saved).not.toContain('statistics');
  });
});
