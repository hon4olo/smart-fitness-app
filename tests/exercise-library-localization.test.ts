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
const readSource = (file: string) =>
  readFileSync(resolve(projectRoot, file), 'utf8');

const auditedFiles = [
  'src/components/workouts/WorkoutExerciseLibraryCard.tsx',
  'src/components/workouts/exercise-library/ExerciseFilterBar.tsx',
  'src/components/workouts/exercise-library/ExerciseRow.tsx',
  'src/components/workouts/exercise-library/ExerciseDetailSheet.tsx',
];

describe('exercise library localization', () => {
  it('uses one bounded English/Russian copy contract across the browser and detail flow', () => {
    const copy = readSource('src/localization/exerciseLibraryCopy.ts');
    expect(copy).toContain("browserTitle: locale === 'ru'");
    expect(copy).toContain('Библиотека упражнений');
    expect(copy).toContain('Exercise browser');
    expect(copy).toContain('Частые ошибки');
    expect(copy).toContain('Common mistakes');
    expect(copy).toContain('ruFacetLabels');
  });

  it('does not keep audited fixed English controls or accessibility labels in components', () => {
    const source = auditedFiles.map(readSource).join('\n');
    for (const fixedText of [
      'Toggle exercise browser',
      'Search exercises',
      'Clear filters',
      'Recently used',
      'Add custom exercise',
      'Save exercise',
      'Open details for',
      'Add to workout',
      'Common mistakes',
      'No close matches in the current library.',
    ]) {
      expect(source).not.toContain(`>${fixedText}<`);
      expect(source).not.toContain(`"${fixedText}"`);
      expect(source).not.toContain(`\`${fixedText}`);
    }
    expect(source).toContain('getExerciseLibraryCopy');
  });

  it('keeps persisted exercise names and database content unchanged', () => {
    const card = readSource(
      'src/components/workouts/WorkoutExerciseLibraryCard.tsx',
    );
    const row = readSource(
      'src/components/workouts/exercise-library/ExerciseRow.tsx',
    );
    expect(card).toContain('onAddDatabaseExercise');
    expect(card).toContain('onExerciseNameChange');
    expect(row).toContain('buildQueryHighlight(exercise.name');
    expect(row).not.toContain('localizedExerciseName');
  });
});

// Revalidate this contract against the current main regression baseline.
