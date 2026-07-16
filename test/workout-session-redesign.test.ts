import { describe, expect, test } from 'vitest';

declare const __dirname: string;
declare const require: any;

const { readFileSync } = require('fs') as { readFileSync: (path: string, encoding: string) => string };
const { resolve } = require('path') as { resolve: (...parts: string[]) => string };

const projectRoot = resolve(__dirname, '..');
const readSource = (relativePath: string) => readFileSync(resolve(projectRoot, relativePath), 'utf8');
const count = (source: string, needle: string) => (source.match(new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) ?? []).length;

describe('workout session redesign 8.1', () => {
  test('the active session screen uses a compact workflow and safe footer labels', () => {
    const screen = readSource('src/app/workout-session.tsx');
    const header = readSource('src/components/workouts/WorkoutSessionHeader.tsx');
    const navigator = readSource('src/components/workouts/WorkoutSessionExerciseNavigator.tsx');
    const editor = readSource('src/components/workouts/WorkoutSessionSetEditor.tsx');
    const history = readSource('src/components/workouts/WorkoutSessionSetHistory.tsx');
    const emptyState = readSource('src/components/workouts/WorkoutSessionEmptyState.tsx');

    expect(screen).toContain('WorkoutSessionHeader');
    expect(screen).toContain('WorkoutSessionExerciseNavigator');
    expect(screen).toContain('WorkoutSessionSetEditor');
    expect(screen).toContain('WorkoutSessionSetHistory');
    expect(screen).toContain('WorkoutSessionEmptyState');
    expect(screen).not.toContain('WorkoutSessionProgressCard');
    expect(screen).toContain("keyboardShouldPersistTaps=\"handled\"");
    expect(screen).toContain("Alert.alert('Delete set?'");
    expect(screen).toContain("Alert.alert('Cancel workout?'");
    expect(screen).toContain('Cancel');
    expect(screen).toContain('Finish workout');
    expect(screen).not.toContain('Cancel Workout');
    expect(count(screen, 'Workout Session')).toBe(0);

    expect(header).toContain('Next:');
    expect(header).toContain('progressTrack');
    expect(navigator).toContain('ScrollView');
    expect(navigator).toContain('showsHorizontalScrollIndicator={false}');
    expect(navigator).toContain('Exercises');
    expect(editor).toContain('Weight');
    expect(editor).toContain('Reps');
    expect(editor).toContain('Add set');
    expect(editor).toContain('Save set');
    expect(editor).toContain('Cancel edit');
    expect(editor).toContain('Previous:');
    expect(history).toContain('Added sets');
    expect(history).toContain('No sets logged yet.');
    expect(history).toContain('Delete');
    expect(screen).toContain('does not support adding exercises in-session');
    expect(screen).toContain('Return to Workouts');
  });
});
