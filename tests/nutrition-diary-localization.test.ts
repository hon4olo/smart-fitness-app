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
const readSource = (file: string) => readFileSync(resolve(projectRoot, file), 'utf8');

describe('nutrition diary localization', () => {
  it('uses bounded English and Russian copy for the diary shell and meals', () => {
    const copy = readSource('src/localization/nutritionDiaryCopy.ts');
    expect(copy).toContain("title: locale === 'ru' ? 'Питание' : 'Nutrition'");
    expect(copy).toContain('Дневник питания');
    expect(copy).toContain('Завтрак');
    expect(copy).toContain('Перекус');
    expect(copy).toContain('macroLabels');
  });

  it('routes visible dates and numbers through localization and unit boundaries', () => {
    const screen = readSource('src/app/(tabs)/nutrition.tsx');
    const hook = readSource('src/features/nutrition/hooks/useNutritionDaySummary.ts');
    const meal = readSource('src/features/nutrition/components/MealGroup.tsx');
    const row = readSource('src/features/nutrition/components/FoodEntryRow.tsx');

    expect(screen).toContain('useLocalization');
    expect(screen).toContain('labels={copy.macroLabels}');
    expect(hook).toContain('formatDate');
    expect(hook).not.toContain('new Intl.DateTimeFormat');
    expect(meal).toContain('formatEnergyValue');
    expect(row).toContain('copy.editFoodLabel');
  });

  it('does not retain audited fixed English controls in the diary components', () => {
    const source = [
      'src/app/(tabs)/nutrition.tsx',
      'src/features/nutrition/components/MealGroup.tsx',
      'src/features/nutrition/components/FoodEntryRow.tsx',
    ]
      .map(readSource)
      .join('\n');

    for (const fixedText of [
      '>Nutrition<',
      '>Meal diary<',
      '>Today<',
      'Today selected',
      'Jump to today',
      'Tap to edit this food entry',
      'Add food to',
    ]) {
      expect(source).not.toContain(fixedText);
    }
  });
});
