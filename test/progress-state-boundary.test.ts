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

describe('Progress state boundary', () => {
  test('contains only weight history and body measurements', () => {
    const source = readSource('src/context/ProgressStateContext.tsx');

    expect(source).toContain("Pick<AppState, 'bodyMeasurements' | 'weightHistory'>");
    for (const unrelatedField of [
      'workoutSessions',
      'exercises',
      'foodEntries',
      'profile',
      'recoveryCheckIns',
    ]) {
      expect(source).not.toContain(`'${unrelatedField}'`);
    }
  });

  test('memoizes the focused value from only the two Progress arrays', () => {
    const source = readSource('src/context/ProgressStateContext.tsx');

    expect(source).toContain('useMemo<ProgressState>');
    expect(source).toContain('[bodyMeasurements, weightHistory]');
  });

  test('mounts the provider inside AppProvider', () => {
    const source = readSource('src/app/_layout.tsx');
    const appProviderIndex = source.indexOf('<AppProvider>');
    const progressProviderIndex = source.indexOf('<ProgressStateProvider>');

    expect(appProviderIndex).toBeGreaterThanOrEqual(0);
    expect(progressProviderIndex).toBeGreaterThan(appProviderIndex);
  });

  test('Weight Details composes focused Progress and Workout state', () => {
    const source = readSource('src/app/weight-details.tsx');

    expect(source).toContain('useProgressState');
    expect(source).toContain('useWorkoutState');
    expect(source).not.toContain('useAppContext');
  });
});
