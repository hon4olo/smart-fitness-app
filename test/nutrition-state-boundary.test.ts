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

describe('Nutrition state boundary', () => {
  test('defines and provides a memoized focused Nutrition state context', () => {
    const core = readSource('src/context/appContext/AppContextCore.ts');
    const provider = readSource('src/context/AppContext.tsx');

    expect(core).toContain('NutritionDataStateContext');
    expect(core).toContain('useNutritionState');
    expect(provider).toContain('useMemo<NutritionDataState>');
    expect(provider).toContain(
      '<NutritionDataStateContext.Provider value={nutritionState}>',
    );
  });

  test('contains only the three currently required Nutrition arrays', () => {
    const source = readSource('src/types/appContext.ts');
    const block = source.slice(
      source.indexOf('export type NutritionDataState'),
      source.indexOf('export type AppActions'),
    );

    for (const field of ['foodEntries', 'mealTemplates', 'nutritionTargets']) {
      expect(block).toContain(field);
    }
    for (const unrelatedField of [
      'workouts',
      'workoutSessions',
      'weightHistory',
      'profile',
      'recoveryCheckIns',
    ]) {
      expect(block).not.toContain(unrelatedField);
    }
  });

  test.each([
    'src/app/(tabs)/nutrition.tsx',
    'src/app/nutrition/date-picker.tsx',
  ])('%s uses only focused Nutrition state', (path) => {
    const source = readSource(path);

    expect(source).toContain('useNutritionState');
    expect(source).not.toContain('useAppContext');
  });
});
