import { describe, expect, test } from 'vitest';

declare const __dirname: string;
declare const require: any;

const { readFileSync } = require('fs') as {
  readFileSync: (path: string, encoding: string) => string;
};
const { resolve } = require('path') as {
  resolve: (...parts: string[]) => string;
};

const projectRoot = resolve(__dirname, '..');
const readSource = (relativePath: string) =>
  readFileSync(resolve(projectRoot, relativePath), 'utf8');

describe('list virtualization boundaries', () => {
  test('Nutrition Diary keeps one SectionList boundary for food-entry rows', () => {
    const route = readSource('src/app/(tabs)/nutrition.tsx');
    const list = readSource(
      'src/features/nutrition/components/NutritionDiaryList.tsx',
    );
    expect(route).toContain('NutritionDiaryList');
    expect(route).not.toContain('<ScrollView');
    expect(list).toContain('SectionList');
    expect(list).toContain('keyExtractor={(entry) => entry.id}');
  });

  test('Programs tab keeps a FlatList keyed by stable program id', () => {
    const source = readSource('src/features/workouts/screens/WorkoutsScreen.tsx');
    expect(source).toContain('FlatList');
    expect(source).toContain('data={visibleProgramSummaries}');
    expect(source).toContain('keyExtractor={(summary) => summary.program.id}');
    expect(source).not.toContain('{visibleProgramSummaries.map(');
  });

  test('Workout History keeps a FlatList keyed by stable session id', () => {
    const source = readSource('src/features/workouts/screens/WorkoutHistoryScreen.tsx');
    expect(source).toContain('FlatList');
    expect(source).toContain('data={history}');
    expect(source).toContain('keyExtractor={(item) => item.session.id}');
    expect(source).not.toContain('{history.map(');
  });

  test('Exercise Library keeps one SectionList and stable exercise ids', () => {
    const route = readSource('src/app/workouts/exercise-library.tsx');
    const browser = readSource(
      'src/components/workouts/VirtualizedWorkoutExerciseLibrary.tsx',
    );
    expect(route).not.toContain('<ScrollView');
    expect(browser).toContain('SectionList');
    expect(browser).toContain('keyExtractor={(exercise) => exercise.id}');
  });

  test('bounded secondary nutrition and progress surfaces stay bounded', () => {
    const addFood = readSource('src/app/nutrition/add-food.tsx');
    const addFoodModel = readSource('src/features/nutrition/addFoodModel.ts');
    const progress = readSource('src/app/(tabs)/progress.tsx');

    expect(addFood).toContain('defaultCatalogResults.slice(0, 18)');
    expect(addFoodModel).toContain('return items.slice(0, 20)');
    expect(progress).toContain('analytics.measurements.slice(0, 3)');
  });
});
