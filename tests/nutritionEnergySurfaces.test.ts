import { describe, expect, it } from 'vitest';

declare const __dirname: string;
declare const require: any;

const { readFileSync } = require('fs') as { readFileSync: (path: string, encoding: string) => string };
const { resolve } = require('path') as { resolve: (...parts: string[]) => string };

const projectRoot = resolve(__dirname, '..');
const readSource = (relativePath: string) => readFileSync(resolve(projectRoot, relativePath), 'utf8');

describe('nutrition energy display boundaries', () => {
  it('uses the selected energy unit for food discovery and reusable foods', () => {
    for (const path of [
      'src/features/nutrition/components/FoodSearchModeSection.tsx',
      'src/features/nutrition/components/FavoriteFoodsModeSection.tsx',
      'src/features/nutrition/components/RecentFoodsModeSection.tsx',
      'src/features/nutrition/components/SavedMealsModeSection.tsx',
    ]) {
      const source = readSource(path);
      expect(source).toContain('useUnitPreferences');
      expect(source).toContain('formatEnergyValue');
      expect(source).not.toMatch(/value={`[^`]* kcal`}/);
    }
  });

  it('recalculates the portion-editor energy label from canonical kcal', () => {
    const source = readSource('src/features/nutrition/components/FoodPortionSheet.tsx');
    expect(source).toContain('draft.calories * multiplier');
    expect(source).toContain('formatEnergyValue');
    expect(source).toContain('displayTotalsLabel');
  });
});
