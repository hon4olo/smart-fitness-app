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

describe('Nutrition calendar localization', () => {
  it('uses selected-locale date formatting and bounded English/Russian copy', () => {
    const route = readSource('src/app/nutrition/date-picker.tsx');
    const copy = readSource('src/localization/nutritionCalendarCopy.ts');

    expect(route).toContain('useLocalization');
    expect(route).toContain('getNutritionCalendarCopy');
    expect(route).toContain("formatDate(monthDate, { month: 'long', year: 'numeric' })");
    expect(route).not.toContain('new Intl.DateTimeFormat');
    expect(copy).toContain('Календарь');
    expect(copy).toContain('Previous month');
    expect(copy).toContain('питание записано');
  });

  it('does not retain audited fixed English controls in the route', () => {
    const route = readSource('src/app/nutrition/date-picker.tsx');

    for (const text of [
      'Jump to any day',
      'Previous month',
      'Next month',
      ', food logged',
      ', no food logged',
    ]) {
      expect(route).not.toContain(text);
    }
    expect(route).toContain('copy.dayAccessibility');
    expect(route).toContain('copy.weekDays.map');
  });
});
