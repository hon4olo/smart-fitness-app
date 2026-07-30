import { describe, expect, it } from 'vitest';

declare const __dirname: string;
declare const require: any;

const { readFileSync } = require('fs') as {
  readFileSync(path: string, encoding: string): string;
};
const { resolve } = require('path') as {
  resolve(...parts: string[]): string;
};

const projectRoot = resolve(__dirname, '..');
const readSource = (relativePath: string) =>
  readFileSync(resolve(projectRoot, relativePath), 'utf8');

const auditedPresentation = () =>
  [
    readSource('src/features/workouts/components/session/SessionHeader.tsx'),
    readSource('src/features/workouts/components/session/SessionExerciseSection.tsx'),
    readSource('src/features/workouts/components/session/SessionSetTable.tsx'),
    readSource('src/features/workouts/components/session/SessionSetRow.tsx'),
    readSource('src/features/workouts/components/session/WorkoutSessionBody.tsx'),
    readSource('src/features/workouts/screens/WorkoutSessionScreen.tsx'),
  ].join('\n');

describe('workout session preview localization', () => {
  it('provides English and Russian session-preview and accessibility copy', () => {
    const messages = readSource('src/localization/workoutsMessages.ts');

    expect(messages).toContain("'workouts.session.addSet': 'Add set'");
    expect(messages).toContain("'workouts.session.repCount.one': '{count} rep'");
    expect(messages).toContain("'workouts.session.moreActions': 'Workout actions'");
    expect(messages).toContain("'workouts.session.addSet': 'Добавить подход'");
    expect(messages).toContain("'workouts.session.repCount.many': '{count} повторений'");
    expect(messages).toContain("'workouts.session.moreActions': 'Действия с тренировкой'");
  });

  it('uses selected locale and weight boundaries without direct formatting', () => {
    const source = auditedPresentation();
    const header = readSource(
      'src/features/workouts/components/session/SessionHeader.tsx',
    );
    const exercise = readSource(
      'src/features/workouts/components/session/SessionExerciseSection.tsx',
    );

    expect(header).toContain('weightFromKg(volume, weight)');
    expect(header).toContain('formatNumber');
    expect(header).toContain('useUnitPreferences');
    expect(exercise).toContain('formatWeightValue(set.weight, weightUnit)');
    expect(exercise).toContain("formatPlural('workouts.session.repCount', set.reps)");
    expect(source).not.toContain('toLocaleString');
    expect(source).not.toContain('new Intl.');
    expect(source).not.toMatch(/['"`]\s*kg\b/);
    expect(source).not.toContain('kg  ·');
  });

  it('localizes controls and exposes semantic accessibility state', () => {
    const header = readSource(
      'src/features/workouts/components/session/SessionHeader.tsx',
    );
    const exercise = readSource(
      'src/features/workouts/components/session/SessionExerciseSection.tsx',
    );
    const row = readSource(
      'src/features/workouts/components/session/SessionSetRow.tsx',
    );

    expect(header).toContain("t('workouts.session.backAccessibility')");
    expect(header).toContain("t('workouts.session.moreActions')");
    expect(exercise).toContain("t('workouts.session.addSet')");
    expect(exercise).toContain('accessibilityState={{ expanded }}');
    expect(row).toContain('accessibilityRole="checkbox"');
    expect(row).toContain('accessibilityState={{ checked: completed }}');
    expect(row).toContain("'workouts.session.markSetIncomplete'");
    expect(row).toContain("'workouts.session.markSetComplete'");
    expect(exercise).not.toContain('+ Add set');
    expect(header).not.toContain('.toLocaleString(');
  });

  it('keeps canonical empty-workout draft data and localizes only display titles', () => {
    const screen = readSource(
      'src/features/workouts/screens/WorkoutSessionScreen.tsx',
    );
    const body = readSource(
      'src/features/workouts/components/session/WorkoutSessionBody.tsx',
    );

    expect(screen).toContain("id: 'empty-workout', title: 'Empty workout'");
    expect(screen).toContain("workoutTitle: 'Empty workout'");
    expect(screen).toContain("t('workouts.session.emptyWorkout')");
    expect(screen).toContain('getWorkoutsHubWorkoutTitle(t, workout)');
    expect(screen).toContain('workoutTitle={displayWorkoutTitle}');
    expect(body).toContain('title={workoutTitle}');
    expect(body).not.toContain('title={draft.workoutTitle}');
    expect(screen).not.toContain('workoutTitle={draft.workoutTitle}');
  });

  it('preserves draft, completion, RPE and session lifecycle contracts', () => {
    const screen = readSource(
      'src/features/workouts/screens/WorkoutSessionScreen.tsx',
    );
    const table = readSource(
      'src/features/workouts/components/session/SessionSetTable.tsx',
    );

    expect(screen).toContain('hydrateActiveWorkoutSessionDraft');
    expect(screen).toContain('setActiveWorkoutSessionDraft(draft)');
    expect(screen).toContain('clearActiveWorkoutSessionDraft()');
    expect(screen).toContain('addWorkoutSessionSet');
    expect(screen).toContain('removeWorkoutSessionSet');
    expect(screen).toContain('toggleWorkoutSessionSetCompletion');
    expect(screen).toContain('updateWorkoutSessionSetActualRpe');
    expect(screen).toContain('saveWorkoutRpeTrackingEnabled(enabled)');
    expect(screen).toContain("router.push('/workout-session-finish')");
    expect(table).toContain('displayWeightInputToKg(value, weightUnit)');
  });
});
