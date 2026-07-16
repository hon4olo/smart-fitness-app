import { describe, expect, test } from 'vitest';

declare const __dirname: string;
declare const require: any;

const { readFileSync } = require('fs') as { readFileSync: (path: string, encoding: string) => string };
const { resolve } = require('path') as { resolve: (...parts: string[]) => string };

const projectRoot = resolve(__dirname, '..');
const readSource = (relativePath: string) => readFileSync(resolve(projectRoot, relativePath), 'utf8');
const count = (source: string, needle: string) => (source.match(new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) ?? []).length;

describe('nutrition diary and meal-aware add flow 5.0', () => {
  test('main nutrition tab is diary-first and keeps the old add-food surface out of the main screen', () => {
    const source = readSource('src/app/(tabs)/nutrition.tsx');

    expect(source).toContain('Nutrition');
    expect(source).toContain('This week');
    expect(source).toContain('Consumed today');
    expect(source).toContain('Meal diary');
    expect(source).toContain('Nutrient breakdown');
    expect(source).toContain('Calendar');
    expect(source).toContain("router.push({ pathname: '/nutrition/add-food'");
    expect(source).toContain('Add food to');
    expect(source).toContain('No food logged');
    expect(source).not.toContain('Daily summary');
    expect(source).not.toContain('AddFoodFormSection');
    expect(source).not.toContain('Recent foods');
    expect(source).not.toContain('Saved meals');
    expect(source).not.toContain('Footer actions');
    expect(source).not.toContain('Create Food');
  });

  test('main nutrition tab keeps week navigation and one add button per visible meal', () => {
    const source = readSource('src/app/(tabs)/nutrition.tsx');

    expect(count(source, 'This week')).toBe(1);
    expect(count(source, 'accessibilityLabel={`Add food to ${mealTypeLabels[mealType]}`}')).toBe(1);
    expect(count(source, 'openMealPicker(mealType)')).toBe(1);
    expect(count(source, 'No food logged')).toBe(1);
    expect(source).toContain("pathname: '/nutrition/date-picker'");
  });

  test('meal-aware picker exposes food, recent, favorites, and meals modes', () => {
    const source = readSource('src/app/nutrition/add-food.tsx');

    expect(source).toContain("label: 'Food'");
    expect(source).toContain("label: 'Recent'");
    expect(source).toContain("label: 'Favorites'");
    expect(source).toContain("label: 'Meals'");
    expect(readSource('src/app/_layout.tsx')).toContain('name="nutrition/add-food"');
    expect(source).toContain('selectedMealLabel');
    expect(source).toContain('selectedDateLabel');
    expect(source).toContain('Quick add');
    expect(source).toContain('Create food');
    expect(source).toContain('Create meal');
  });

  test('picker keeps meal/date context stable and supports portion editing plus quick add', () => {
    const source = readSource('src/app/nutrition/add-food.tsx');

    expect(source).toContain('Add to ${selectedMealLabel}');
    expect(source).toContain('Save changes');
    expect(source).toContain('Quantity');
    expect(source).toContain('Cancel');
    expect(source).toContain('No recent foods yet.');
    expect(source).toContain('No favorites yet.');
    expect(source).toContain('No saved meals yet.');
    expect(source).toContain('selectedDate');
    expect(source).toContain('selectedMeal');
  });

  test('picker preserves recent, favorites, and saved meal behaviors in source', () => {
    const source = readSource('src/app/nutrition/add-food.tsx');

    expect(source).toContain('quickAddRecent');
    expect(source).toContain('quickAddMealTemplate');
    expect(source).toContain('toggleFavorite');
    expect(source).toContain('addMealTemplate');
    expect(source).toContain('deleteMealTemplate');
    expect(source).toContain('addFoodEntries');
    expect(source).toContain('updateFoodEntry');
  });
});
