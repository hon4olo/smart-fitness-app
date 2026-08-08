import { describe, expect, test } from 'vitest';

import { formatMealItemCount, getLoggedFoodDates } from '@/lib/nutrition';

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
    const summaryGrid = readSource('src/features/nutrition/components/NutritionSummaryGrid.tsx');
    const mealGroup = readSource('src/features/nutrition/components/MealGroup.tsx');
    const foodEntryRow = readSource('src/features/nutrition/components/FoodEntryRow.tsx');
    const weekStrip = readSource('src/features/nutrition/components/NutritionWeekStrip.tsx');
    const detailsSection = readSource('src/features/nutrition/components/NutritionDetailsSection.tsx');
    const styles = readSource('src/features/nutrition/styles/nutritionScreenStyles.ts');
    const nutritionUi = [source, summaryGrid, mealGroup, foodEntryRow, weekStrip, detailsSection, styles].join('\n');

    expect(source).toContain('Nutrition');
    expect(source).toContain('calendarButton');
    expect(source).toContain('CalendarDays');
    expect(source).toContain('streakChip');
    expect(source).toContain('metaRow');
    expect(source).toContain('todayButton');
    expect(nutritionUi).toContain('weekSection');
    expect(nutritionUi).toContain('weekDayButton');
    expect(nutritionUi).toContain('weekDayHitArea');
    expect(nutritionUi).toContain('weekDayCircleLogged');
    expect(nutritionUi).toContain('weekDayCheck');
    expect(nutritionUi).toContain('NutritionSummaryGrid');
    expect(nutritionUi).toContain('macroGridRow');
    expect(nutritionUi).toContain('macroGridCell');
    expect(nutritionUi).toContain('macroGridLabel');
    expect(nutritionUi).toContain('macroGridValue');
    expect(count(nutritionUi, 'weekDayButton')).toBe(2);
    expect(source).toContain('summarySection');
    expect(source).toContain('mealSectionList');
    expect(nutritionUi).toContain('mealGroup');
    expect(nutritionUi).toContain('mealHeaderLeft');
    expect(nutritionUi).toContain('mealIcon');
    expect(nutritionUi).toContain('mealHeaderMeta');
    expect(nutritionUi).toContain('mealSummaryStrip');
    expect(nutritionUi).toContain('mealHeaderActions');
    expect(nutritionUi).toContain('surfaceSecondary');
    expect(nutritionUi).not.toContain('mealSummaryLabel');
    expect(nutritionUi).not.toContain('mealSummaryMetric');
    expect(nutritionUi).not.toContain('mealSubtotal');
    expect(nutritionUi).not.toContain('Consumed today');
    expect(nutritionUi).not.toContain('This week');
    expect(nutritionUi).not.toContain('Daily summary');
    expect(nutritionUi).not.toContain('progress');
    expect(nutritionUi).toContain('mealActionButton');
    expect(mealGroup).toContain('Plus');
    expect(nutritionUi).toContain('foodRow');
    expect(nutritionUi).toContain('foodRowTop');
    expect(nutritionUi).toContain('foodRowDetail');
    expect(nutritionUi).toContain('ellipsizeMode="tail"');
    expect(nutritionUi).toContain('detailsSection');
    expect(nutritionUi).toContain('detailRow');
    expect(nutritionUi).not.toContain('foodRowCalories');
    expect(nutritionUi).not.toContain('foodRowMacroServing');
    expect(nutritionUi).not.toContain('foodRowMacroLine');
    expect(nutritionUi).not.toContain('remaining');
    expect(nutritionUi).not.toContain('No food logged');
  });

  test('today and calendar actions remain layout-stable and dates use the central localization boundary', () => {
    const source = readSource('src/app/(tabs)/nutrition.tsx');
    const weekStrip = readSource('src/features/nutrition/components/NutritionWeekStrip.tsx');
    const copy = readSource('src/localization/nutritionDiaryCopy.ts');
    const summaryHook = readSource('src/features/nutrition/hooks/useNutritionDaySummary.ts');
    const utils = readSource('src/features/nutrition/utils/nutritionScreenUtils.ts');

    expect(source).toContain('accessibilityState={{ disabled: selectedDateIsToday }}');
    expect(source).toContain('backgroundColor: colors.backgroundSecondary');
    expect(source).toContain('borderColor: colors.divider');
    expect(source).toContain('color: colors.textMuted');
    expect(source).toContain('CalendarDays');
    expect(source).toContain("router.replace({ pathname: '/nutrition', params: { date: nextDate } })");
    expect(source).toContain("pathname: '/nutrition/date-picker'");
    expect(source).toContain('selectedDateLabel');
    expect(source).toContain("formatDate(`${dateLabel}T12:00:00`, { weekday: 'long' })");
    expect(weekStrip).toContain('accessibilityLabelForDay');
    expect(source).toContain('accessibilityLabelForDay={copy.weekDayAccessibility}');
    expect(copy).toContain('weekDayAccessibility');
    expect(summaryHook).toContain("dayLabel: formatDate(date, { weekday: 'short' })");
    expect(summaryHook).toContain("dayNumber: formatDate(date, { day: 'numeric' })");
    expect(utils).not.toContain('Intl.DateTimeFormat');
    expect(utils).not.toContain('formatWeekdayLabel');
    expect(utils).not.toContain('formatDayNumber');
  });

  test('meal rows stay compact and use additive expansion without delete controls in the diary', () => {
    const source = readSource('src/app/(tabs)/nutrition.tsx');
    const summaryGrid = readSource('src/features/nutrition/components/NutritionSummaryGrid.tsx');
    const mealGroup = readSource('src/features/nutrition/components/MealGroup.tsx');
    const foodEntryRow = readSource('src/features/nutrition/components/FoodEntryRow.tsx');
    const nutritionUi = [source, summaryGrid, mealGroup, foodEntryRow].join('\n');

    expect(nutritionUi).toContain('mealGroup');
    expect(nutritionUi).toContain('mealSummaryStrip');
    expect(nutritionUi).toContain('NutritionSummaryGrid');
    expect(nutritionUi).toContain('macroGridRow');
    expect(nutritionUi).toContain('macroGridValue');
    expect(nutritionUi).toContain('mealHeaderMeta');
    expect(nutritionUi).toContain('copy.itemCount');
    expect(nutritionUi).toContain('mealHeaderActions');
    expect(nutritionUi).toContain('mealActionButton');
    expect(mealGroup).toContain('ChevronDown');
    expect(mealGroup).toContain('ChevronRight');
    expect(mealGroup).toContain('const ExpandIcon = expanded ? ChevronDown : ChevronRight;');
    expect(mealGroup).toContain('Plus');
    expect(mealGroup).not.toContain("expanded ? '▾' : '▸'");
    expect(nutritionUi).toContain('foodRowDivider');
    expect(nutritionUi).toContain('foodRowTop');
    expect(nutritionUi).toContain('foodMetadata');
    expect(nutritionUi).not.toContain('mealSummaryLabel');
    expect(nutritionUi).not.toContain('mealSummaryMetric');
    expect(nutritionUi).not.toContain('mealSubtotal');
    expect(nutritionUi).not.toContain('foodRowCalories');
    expect(nutritionUi).not.toContain('foodRowMacroLine');
    expect(nutritionUi).not.toContain('foodRowMacroServing');
    expect(nutritionUi).not.toContain('Delete ${entry.name}');
    expect(nutritionUi).not.toContain('deleteButton');
    expect(nutritionUi).not.toContain('×');
  });

  test('picker returns to the selected meal and exposes a quiet delete action for edited entries', () => {
    const route = readSource('src/app/nutrition/add-food.tsx');
    const view = readSource('src/features/nutrition/components/NutritionAddFoodView.tsx');
    const copy = readSource('src/localization/nutritionAddFoodCopy.ts');

    expect(route.replace(/\s+/g, ' ')).toContain("router.replace({ pathname: '/nutrition', params: { date: selectedDate, openMeal: selectedMeal }, })");
    expect(view).toContain('deleteLabel={copy.deleteEntry}');
    expect(route).toContain('deleteSelectedDraft');
    expect(route).toContain('copy.saveChanges');
    expect(route).toContain('copy.addToMeal(selectedMealLabel)');
    expect(copy).toContain("deleteEntry: locale === 'ru'");
    expect(route).toContain('selectedMeal');
    expect(route).toContain('selectedDate');
  });

  test('nutrient breakdown is compact and only renders useful nutrient data', () => {
    const source = readSource('src/app/(tabs)/nutrition.tsx');
    const detailsSection = readSource('src/features/nutrition/components/NutritionDetailsSection.tsx');
    const copy = readSource('src/localization/nutritionDiaryCopy.ts');

    expect(source).toContain('fiberBreakdown.hasFiberData');
    expect(detailsSection).toContain('copy.nutritionDetails');
    expect(detailsSection).toContain('copy.fiber');
    expect(copy).toContain("nutritionDetails: locale === 'ru'");
    expect(copy).toContain('Подробности питания');
    expect(copy).toContain('Nutrition details');
    expect([source, detailsSection].join('\n')).not.toContain('Sodium, cholesterol, sugar');
    expect([source, detailsSection].join('\n')).not.toContain('Not available yet');
  });

  test('calendar date picker marks logged dates without changing layout', () => {
    const source = readSource('src/app/nutrition/date-picker.tsx');
    const copy = readSource('src/localization/nutritionCalendarCopy.ts');

    expect(source).toContain('useNutritionState');
    expect(source).toContain('getLoggedFoodDates');
    expect(source).toContain('dayCellLogged');
    expect(source).toContain('dayCellCheck');
    expect(source).toContain('copy.dayAccessibility');
    expect(copy).toContain(', food logged');
    expect(copy).toContain(', no food logged');
    expect(source).not.toContain('new dependency');
  });

  test('meal count helper uses singular/plural copy and logged-day helper tracks persisted dates', () => {
    expect(formatMealItemCount(0)).toBe('No items yet');
    expect(formatMealItemCount(1)).toBe('1 item');
    expect(formatMealItemCount(2)).toBe('2 items');

    expect(getLoggedFoodDates([]).has('2026-01-02')).toBe(false);

    const dates = getLoggedFoodDates([{ date: '2026-01-02' }, { date: '2026-01-02' }, { date: '2026-01-03' }]);
    expect(dates.has('2026-01-02')).toBe(true);
    expect(dates.has('2026-01-03')).toBe(true);
    expect(dates.has('2026-01-04')).toBe(false);

    const afterDeleteLastEntry = getLoggedFoodDates([{ date: '2026-01-03' }]);
    expect(afterDeleteLastEntry.has('2026-01-02')).toBe(false);
  });
});