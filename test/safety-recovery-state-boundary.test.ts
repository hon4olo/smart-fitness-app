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

describe('Safety Recovery state boundary', () => {
  test('contains only recovery check-ins and user limitations', () => {
    const source = readSource('src/context/SafetyRecoveryStateContext.tsx');

    expect(source).toContain("Pick<AppState, 'recoveryCheckIns' | 'userLimitations'>");
    for (const unrelatedField of [
      'profile',
      'weightHistory',
      'workoutSessions',
      'foodEntries',
      'nutritionTargets',
    ]) {
      expect(source).not.toContain(`'${unrelatedField}'`);
    }
  });

  test('memoizes the focused value from only the two Safety Recovery arrays', () => {
    const source = readSource('src/context/SafetyRecoveryStateContext.tsx');

    expect(source).toContain('useMemo<SafetyRecoveryState>');
    expect(source).toContain('[recoveryCheckIns, userLimitations]');
  });

  test('mounts the provider inside AppProvider', () => {
    const source = readSource('src/app/_layout.tsx');
    const appProviderIndex = source.indexOf('<AppProvider>');
    const safetyProviderIndex = source.indexOf('<SafetyRecoveryStateProvider>');

    expect(appProviderIndex).toBeGreaterThanOrEqual(0);
    expect(safetyProviderIndex).toBeGreaterThan(appProviderIndex);
  });

  test('all Safety Recovery consumers use focused state', () => {
    for (const relativePath of [
      'src/features/coach/screens/RecoveryCheckInScreen.tsx',
      'src/features/coach/screens/UserLimitationScreen.tsx',
      'src/features/coach/screens/SafetyRecoveryPreflightScreen.tsx',
      'src/features/coach/screens/SafetyRecoveryCoachScreen.tsx',
      'src/features/workouts/screens/WorkoutSafetyGateScreen.tsx',
      'src/features/coach/screens/CombinedCoachScreen.tsx',
    ]) {
      const source = readSource(relativePath);

      expect(source).toContain('useSafetyRecoveryState');
      expect(source).not.toContain('useAppContext');
    }
  });

  test('Safety Recovery Coach composes focused state and infrastructure', () => {
    const source = readSource(
      'src/features/coach/screens/SafetyRecoveryCoachScreen.tsx',
    );

    expect(source).toContain('useAppInfrastructure');
  });

  test('workout safety gate reads no unnecessary domain context', () => {
    const source = readSource(
      'src/features/workouts/screens/WorkoutSafetyGateScreen.tsx',
    );

    expect(source).not.toContain('useWorkoutState');
    expect(source).not.toContain('useAppInfrastructure');
  });

  test('Combined Coach composes existing focused domains', () => {
    const source = readSource('src/features/coach/screens/CombinedCoachScreen.tsx');

    expect(source).toContain('useWorkoutState');
    expect(source).toContain('useNutritionState');
    expect(source).toContain('useSafetyRecoveryState');
  });
});
