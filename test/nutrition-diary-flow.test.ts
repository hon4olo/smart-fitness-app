import { describe, expect, test } from 'vitest';

declare const __dirname: string;
declare const require: any;

const { readFileSync } = require('fs') as { readFileSync: (path: string, encoding: string) => string };
const { resolve } = require('path') as { resolve: (...parts: string[]) => string };

const projectRoot = resolve(__dirname, '..');
const readSource = (relativePath: string) => readFileSync(resolve(projectRoot, relativePath), 'utf8');
const count = (source: string, needle: string) => (source.match(new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) ?? []).length;

describe('nutrition compact diary 5.0', () => {
  test('main nutrition screen keeps a stable compact header, seven-day selector, summary row, and collapsed meals', () => {
    const source = readSource('src/app/(tabs)/nutrition.tsx');

    expect(source).toContain('Nutrition');
    expect(source).toContain('calendarButton');
    expect(source).toContain('streakChip');
    expect(source).toContain('metaRow');
    expect(source).toContain('todayButton');
    expect(source).toContain('weekSection');
    expect(source).toContain('weekDayButton');
    expect(source).toContain('weekDayHitArea');
    expect(count(source, 'weekDayButton')).toBe(2); // style + JSX usage
    expect(source).toContain('summarySection');
    expect(source).toContain('mealSectionList');
    expect(source).toContain('mealGroup');
    expect(source).toContain('mealHeaderLeft');
    expect(source).toContain('mealIcon');
    expect(source).toContain('mealHeaderMeta');
    expect(source).toContain('mealSummaryStrip');
    expect(source).toContain('mealSummaryMetric');
    expect(source).toContain('mealSummaryCount');
    expect(source).toContain('TARGET');
    expect(source).toContain('Calories');
    expect(source).not.toContain('Consumed today');
    expect(source).not.toContain('This week');
    expect(source).not.toContain('Daily summary');
    expect(source).not.toContain('progress');
    expect(source).toContain('mealHeaderActions');
    expect(source).toContain('accessibilityState={{ expanded }}');
    expect(source).toContain('toggleMealExpansion(mealType)');
    expect(source).toContain('openMealPicker(mealType)');
    expect(source).toContain('mealActionButton');
    expect(source).toContain('mealActionIcon');
    expect(source).toContain('foodRow');
    expect(source).toContain('foodRowCalories');
    expect(source).toContain('detailsSection');
    expect(source).toContain('detailRow');
    expect(source).not.toContain('remaining');
    expect(source).not.toContain('No food logged');
  });

  test('today and calendar actions remain layout-stable and date switching uses the compact route', () => {
    const source = readSource('src/app/(tabs)/nutrition.tsx');

    expect(source).toContain('todayButtonDisabled');
    expect(source).toContain("router.replace({ pathname: '/nutrition', params: { date: nextDate } })");
    expect(source).toContain("pathname: '/nutrition/date-picker'");
    expect(source).toContain('selectedDateLabel');
    expect(source).toContain('formatWeekdayLabel');
    expect(source).toContain('formatDayNumber');
  });

  test('meal rows stay compact and use additive expansion without delete controls in the diary', () => {
    const source = readSource('src/app/(tabs)/nutrition.tsx');

    expect(source).toContain('mealGroup');
    expect(source).toContain('mealSummaryStrip');
    expect(source).toContain('mealSummaryCount');
    expect(source).toContain('mealSummaryMetric');
    expect(source).toContain('mealHeaderActions');
    expect(source).toContain('mealActionButton');
    expect(source).toContain('chevronText');
    expect(source).toContain('foodRowDivider');
    expect(source).not.toContain('Delete ${entry.name}');
    expect(source).not.toContain('deleteButton');
    expect(source).not.toContain('×');
  });

  test('picker returns to the selected meal and exposes a quiet delete action for edited entries', () => {
    const source = readSource('src/app/nutrition/add-food.tsx');

    expect(source).toContain('router.replace({ pathname: \'/nutrition\', params: { date: selectedDate, openMeal: selectedMeal } })');
    expect(source).toContain('Delete entry');
    expect(source).toContain('deleteSelectedDraft');
    expect(source).toContain('Save changes');
    expect(source).toContain('Add to ${selectedMealLabel}');
    expect(source).toContain('selectedMeal');
    expect(source).toContain('selectedDate');
  });

  test('nutrient breakdown is compact and only renders useful nutrient data', () => {
    const source = readSource('src/app/(tabs)/nutrition.tsx');

    expect(source).toContain('fiberBreakdown.hasFiberData');
    expect(source).toContain('Nutrition details');
    expect(source).not.toContain('Sodium, cholesterol, sugar');
    expect(source).not.toContain('Not available yet');
  });
});
