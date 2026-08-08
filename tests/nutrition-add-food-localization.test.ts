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

const auditedFiles = [
  'src/app/nutrition/add-food.tsx',
  'src/features/nutrition/components/NutritionAddFoodView.tsx',
  'src/features/nutrition/components/FoodSearchModeSection.tsx',
  'src/features/nutrition/components/RecentFoodsModeSection.tsx',
  'src/features/nutrition/components/FavoriteFoodsModeSection.tsx',
  'src/features/nutrition/components/SavedMealsModeSection.tsx',
  'src/features/nutrition/components/CreateFoodInlineForm.tsx',
  'src/features/nutrition/components/FoodPortionSheet.tsx',
  'src/features/nutrition/components/BarcodeScannerModal.tsx',
];

describe('nutrition add-food localization', () => {
  it('provides one bounded English/Russian copy contract for picker, forms, meals, and scanner', () => {
    const copy = readSource('src/localization/nutritionAddFoodCopy.ts');

    expect(copy).toContain("breakfast: locale === 'ru'");
    expect(copy).toContain('Создать продукт');
    expect(copy).toContain('Search food');
    expect(copy).toContain('Нужен доступ к камере');
    expect(copy).toContain('Scan barcode');
    expect(copy).toContain('Сохранить продукт');
  });

  it('routes audited user-facing controls through the localization boundary', () => {
    const source = auditedFiles.map(readSource).join('\n');
    const route = readSource('src/app/nutrition/add-food.tsx');

    expect(route).toContain('getNutritionAddFoodCopy');
    expect(route).toContain('useLocalization');
    expect(route).toContain('formatDate');
    expect(source).toContain('copy.searchFood');
    expect(source).toContain('copy.createFood');
    expect(source).toContain('copy.scanner.title');

    for (const fixedText of [
      'Search food',
      'Create food',
      'Delete entry',
      'Scan barcode',
      'Camera access needed',
      'No recent foods yet.',
      'No saved meals yet.',
    ]) {
      expect(source).not.toContain(`>${fixedText}<`);
      expect(source).not.toContain(`"${fixedText}"`);
    }
  });

  it('uses Lucide for compact Add Food action controls instead of text glyphs', () => {
    const search = readSource(
      'src/features/nutrition/components/FoodSearchModeSection.tsx',
    );
    const recent = readSource(
      'src/features/nutrition/components/RecentFoodsModeSection.tsx',
    );
    const favorites = readSource(
      'src/features/nutrition/components/FavoriteFoodsModeSection.tsx',
    );
    const meals = readSource(
      'src/features/nutrition/components/SavedMealsModeSection.tsx',
    );
    const portion = readSource(
      'src/features/nutrition/components/FoodPortionSheet.tsx',
    );
    const actionUi = [search, recent, favorites, meals, portion].join('\n');

    expect(search).toContain("from 'lucide-react-native'");
    expect(search).toContain('Plus');
    expect(search).toContain('Star');
    expect(search).toContain('X');
    expect(recent).toContain('Plus');
    expect(favorites).toContain('Plus');
    expect(favorites).toContain('Star');
    expect(meals).toContain('Plus');
    expect(meals).toContain('Trash2');
    expect(portion).toContain('X');
    expect(actionUi).not.toContain('>+</Text>');
    expect(actionUi).not.toContain('>×</Text>');
    expect(actionUi).not.toContain('>★</Text>');
    expect(actionUi).not.toContain('>☆</Text>');
  });

  it('keeps product data intact and does not expose raw backend errors in the scanner', () => {
    const route = readSource('src/app/nutrition/add-food.tsx');
    const scanner = readSource(
      'src/features/nutrition/components/BarcodeScannerModal.tsx',
    );

    expect(route).toContain('food.name');
    expect(route).toContain('template.name');
    expect(scanner).not.toContain('error.message');
    expect(scanner).not.toContain('isApiError');
    expect(scanner).toContain('copy.scanner.lookupError');
    expect(scanner).toContain('copy.scanner.saveError');
  });
});