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
    const screen = readSource('src/app/workout-session.tsx');
    const storage = readSource('src/lib/workouts.ts');

    expect(screen).toContain('hydrateActiveWorkoutSessionDraft');
    expect(screen).toContain('Finish');
    expect(screen).toContain('+ Add set');
    expect(screen).toContain('Rest ·');
    expect(screen).toContain('onLongPress');
    expect(screen).toContain('toggleSetCompletion');
    expect(screen).toContain('keyboardShouldPersistTaps="handled"');
    expect(screen).toContain("Alert.alert('Discard workout?'");
    expect(screen).toContain('Complete');
    expect(count(screen, 'Exercise X of Y')).toBe(0);
    expect(count(screen, 'WorkoutSessionExerciseNavigator')).toBe(0);
    expect(count(screen, 'Save set')).toBe(0);
    expect(count(screen, 'Edit set')).toBe(0);

    expect(storage).toContain('hydrateActiveWorkoutSessionDraft');
    expect(storage).toContain('persistActiveWorkoutSessionDraft');
    expect(storage).toContain('active-workout-session-draft');
  });

  test('the finish flow stays minimal', () => {
    const finish = readSource('src/app/workout-session-finish.tsx');

    expect(finish).toContain('Finish Workout');
    expect(finish).toContain('Workout');
    expect(finish).toContain('Date & time');
    expect(finish).toContain('Duration');
    expect(finish).toContain('Notes');
    expect(finish).toContain('Save');
    expect(finish).toContain('Discard workout');
    expect(finish).toContain('Workout saved');
    expect(finish).not.toContain('Photo');
    expect(finish).not.toContain('analytics');
    expect(finish).not.toContain('statistics');
  });
});
