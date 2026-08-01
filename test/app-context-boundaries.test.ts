import { describe, expect, test } from 'vitest';

declare const __dirname: string;
declare const require: any;

const { readFileSync } = require('fs') as {
  readFileSync: (path: string, encoding: string) => string;
};
const { resolve } = require('path') as { resolve: (...parts: string[]) => string };

const projectRoot = resolve(__dirname, '..');
const readSource = (relativePath: string) =>
  readFileSync(resolve(projectRoot, relativePath), 'utf8');

describe('AppContext public boundaries', () => {
  test('defines focused action, infrastructure, and Workout state contexts', () => {
    const source = readSource('src/context/appContext/AppContextCore.ts');

    expect(source).toContain('AppActionsContext');
    expect(source).toContain('AppInfrastructureContext');
    expect(source).toContain('WorkoutStateContext');
    expect(source).toContain('useAppActions');
    expect(source).toContain('useAppInfrastructure');
    expect(source).toContain('useWorkoutState');
  });

  test('memoizes and provides focused values while retaining compatibility context', () => {
    const source = readSource('src/context/AppContext.tsx');

    expect(source).toContain('useMemo<AppActions>');
    expect(source).toContain('useMemo<AppInfrastructure>');
    expect(source).toContain('useMemo<WorkoutState>');
    expect(source).toContain('<AppActionsContext.Provider value={actions}>');
    expect(source).toContain(
      '<AppInfrastructureContext.Provider value={infrastructure}>',
    );
    expect(source).toContain('<WorkoutStateContext.Provider value={workoutState}>');
    expect(source).toContain('<AppContext.Provider value={value}>');
  });

  test('WorkoutState contains only Workout-domain arrays', () => {
    const source = readSource('src/types/appContext.ts');
    const workoutStateBlock = source.slice(
      source.indexOf('export type WorkoutState'),
      source.indexOf('export type AppActions'),
    );

    for (const field of ['workouts', 'trainingPrograms', 'exercises', 'workoutSessions']) {
      expect(workoutStateBlock).toContain(field);
    }
    for (const unrelatedField of [
      'foodEntries',
      'nutritionTargets',
      'weightHistory',
      'profile',
      'onboardingCompleted',
    ]) {
      expect(workoutStateBlock).not.toContain(unrelatedField);
    }
  });

  test.each([
    ['src/app/auth/register.tsx', ['useAppActions']],
    ['src/app/weight-entry.tsx', ['useAppActions']],
    ['src/app/settings/index.tsx', ['useAppActions']],
    ['src/features/settings/DataRecoveryCard.tsx', ['useAppInfrastructure']],
    ['src/features/coach/screens/NutritionCoachScreen.tsx', ['useAppInfrastructure']],
    [
      'src/features/coach/screens/NutritionTargetProposalScreen.tsx',
      ['useAppInfrastructure'],
    ],
    [
      'src/features/workouts/screens/WorkoutSessionFinishScreen.tsx',
      ['useAppActions', 'useAppInfrastructure'],
    ],
    [
      'src/features/workouts/screens/WorkoutsScreen.tsx',
      ['useAppActions', 'useAppInfrastructure', 'useWorkoutState'],
    ],
    ['src/app/workouts/exercise-library.tsx', ['useAppActions', 'useWorkoutState']],
  ])('%s uses only focused app contexts', (path, focusedHooks) => {
    const source = readSource(path);

    for (const focusedHook of focusedHooks) {
      expect(source).toContain(focusedHook);
    }
    expect(source).not.toContain('useAppContext');
  });
});
