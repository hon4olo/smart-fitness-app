import { describe, expect, test } from 'vitest';

declare const __dirname: string;
declare const require: any;

const { readFileSync } = require('fs') as { readFileSync: (path: string, encoding: string) => string };
const { resolve } = require('path') as { resolve: (...parts: string[]) => string };

const projectRoot = resolve(__dirname, '..');
const readSource = (relativePath: string) => readFileSync(resolve(projectRoot, relativePath), 'utf8');
const count = (source: string, needle: string) => (source.match(new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) ?? []).length;

describe('product simplification 2.0', () => {
  test('workouts screen keeps the start-now section order and one visible create action', () => {
    const source = readSource('src/features/workouts/screens/WorkoutsScreen.tsx');
    const startNowBlock = source.slice(source.indexOf('const renderStartNow'), source.indexOf('const renderPrograms'));
    const programsBlock = source.slice(source.indexOf('const renderPrograms'), source.lastIndexOf('return ('));

    expect(startNowBlock.indexOf('Suggested Workouts')).toBeLessThan(startNowBlock.indexOf('Recently Added'));
    expect(programsBlock).not.toContain('title="Programs"');
    expect(programsBlock).toContain('Add new program');
    expect(programsBlock.indexOf('Add new program')).toBeLessThan(programsBlock.indexOf('programSummaries.map'));
    expect(programsBlock).toContain('variant="add"');
    expect(source).toContain('Create a new training split');
    expect(source).toContain('ProgramRow');
    expect(source).not.toContain('addProgramActionLabel');
  });

  test('workouts screen uses a consistent card and program metadata model', () => {
    const source = readSource('src/features/workouts/screens/WorkoutsScreen.tsx');

    expect(source).toContain("line2={`${summary.exerciseCount} exercises`}");
    expect(source).toContain("line3={summary.estimatedDuration ? summary.estimatedDuration : 'Duration unavailable'}");
    expect(source).toContain('metaLinePrimary');
    expect(source).toContain('metaLineSecondary');
    expect(source).toContain('ProgramRow');
    expect(source).toContain('variant="add"');
    expect(source).toContain('workoutCount={summary.workoutCount}');
    expect(source).toContain('Create a new training split');
    expect(source).not.toContain('detailLabel={summary.subtitle}');
    expect(source).not.toContain('countLabel={`${summary.workoutCount} workout');
    expect(source).not.toContain('Create program');
  });

  test('progress screen keeps one weight summary and hides duplicate analytics blocks', () => {
    const source = readSource('src/app/(tabs)/progress.tsx');

    expect(source).toContain('Current weight');
    expect(source).not.toContain('7-day');
    expect(source).not.toContain('30-day');
    expect(source).not.toContain('weekly average');
    expect(source).toContain('Weight details');
  });

  test('home screen stays within three primary content sections', () => {
    const source = readSource('src/app/(tabs)/index.tsx');

    expect(source).toContain('HomeSummaryCard');
    expect(source).toContain('QuickActionsCard');
    expect(source).toContain('HomeSnapshotCard');
    expect(source).not.toContain('HomeActivityCard');
    expect(source).not.toContain('HomeIntelligenceCard');
  });

  test('nutrition screen stays compact, diary-first, and uses dedicated date and add-food routes', () => {
    const source = readSource('src/app/(tabs)/nutrition.tsx');

    expect(source).toContain('Nutrition');
    expect(source).toContain('calendarButton');
    expect(source).toContain('summarySection');
    expect(source).toContain('mealSectionList');
    expect(source).toContain('mealGroup');
    expect(source).toContain('mealSummaryStrip');
    expect(source).toContain('renderMacroGridRow');
    expect(source).toContain('macroGridRow');
    expect(source).toContain('macroGridValue');
    expect(source).toContain('foodRowTop');
    expect(source).toContain('foodMetadata');
    expect(source).toContain('detailsSection');
    expect(source).toContain('detailRow');
    expect(source).not.toContain('mealSummaryValue');
    expect(source).not.toContain('foodRowCalories');
    expect(source).not.toContain('foodRowMacroLine');
    expect(source).not.toContain('foodRowMacroValue');
    expect(source).not.toContain('foodRowMacroServing');
    expect(source).toContain("router.push({ pathname: '/nutrition/add-food'");
    expect(source).toContain("pathname: '/nutrition/date-picker'");
    expect(source).toContain('todayButton');
    expect(source).toContain('weekDayButton');
    expect(source).not.toContain('Consumed today');
    expect(source).not.toContain('This week');
    expect(source).not.toContain('Daily summary');
    expect(source).not.toContain('Footer actions');
  });

  test('nutrition picker route keeps the meal-aware modes and quiet edit/delete path', () => {
    const source = readSource('src/app/nutrition/add-food.tsx');

    expect(source).toContain("label: 'Food'");
    expect(source).toContain("label: 'Recent'");
    expect(source).toContain("label: 'Favorites'");
    expect(source).toContain("label: 'Meals'");
    expect(source).toContain('Create food');
    expect(source).toContain('Create meal');
    expect(source).toContain('Quick add');
    expect(source).toContain('Delete entry');
    expect(source).toContain('Save changes');
    expect(source).toContain('Add to ${selectedMealLabel}');
  });

  test('profile screen does not render a duplicated account snapshot', () => {
    const source = readSource('src/app/(tabs)/profile.tsx');

    expect(source).not.toContain('ProfileHeaderCard');
    expect(source).not.toContain('Account Snapshot');
    expect(source).toContain('ProfileGoalsCard');
    expect(source).toContain('ProfilePreferencesCard');
  });

  test('tab bar is compact and conventional', () => {
    const source = readSource('src/app/(tabs)/_layout.tsx');

    expect(source).toContain('Tabs');
    expect(source).not.toContain('NativeTabs');
    expect(source).toContain('tabBarHeight');
    expect(source).toContain('borderTopWidth: 0.5');
    expect(source).toContain('paddingBottom: Math.max(insets.bottom, 6)');
    expect(source).not.toContain('capsule');
  });

  test('theme tokens remain valid', () => {
    const themeSource = readSource('src/constants/theme.ts');

    expect(themeSource).toContain("'system'");
    expect(themeSource).toContain("'light'");
    expect(themeSource).toContain("'dark'");
    expect(themeSource).toContain('surfacePrimary');
    expect(themeSource).toContain('textPrimary');
  });

  test('business actions remain reachable in source', () => {
    const workouts = readSource('src/features/workouts/screens/WorkoutsScreen.tsx');
    const template = readSource('src/features/workouts/screens/WorkoutTemplateDetailScreen.tsx');
    const program = readSource('src/features/workouts/screens/ProgramDetailScreen.tsx');
    const nutrition = readSource('src/app/(tabs)/nutrition.tsx');
    const nutritionPicker = readSource('src/app/nutrition/add-food.tsx');
    const profile = readSource('src/app/(tabs)/profile.tsx');
    const sessionTable = readSource('src/features/workouts/components/session/SessionSetTable.tsx');
    const exerciseSection = readSource('src/features/workouts/components/session/SessionExerciseSection.tsx');
    const builder = readSource('src/app/workouts/builder.tsx');
    const picker = readSource('src/components/workouts/ProgramWorkoutPickerModal.tsx');
    const editor = readSource('src/components/workouts/ProgramWorkoutEditorModal.tsx');
    const workoutBuilderCard = readSource('src/components/workouts/WorkoutBuilderCard.tsx');

    expect(workouts).toContain('Start now');
    expect(workouts).toContain('Programs');
    expect(workouts).not.toContain('Start empty workout');
    expect(template).toContain('Start workout');
    expect(template).toContain('Favorite / unfavorite');
    expect(program).toContain('Edit program');
    expect(program).toContain('Start next workout');
    expect(program).not.toContain('styles.startChip');
    expect(nutrition).toContain("router.push({ pathname: '/nutrition/add-food'");
    expect(nutritionPicker).toContain('addFoodEntries');
    expect(profile).toContain('Appearance');
    expect(sessionTable).toContain('Set');
    expect(sessionTable).toContain('Previous');
    expect(sessionTable).toContain('kg');
    expect(sessionTable).toContain('Reps');
    expect(sessionTable).toContain('✓');
    expect(sessionTable).not.toContain('colOverflow');
    expect(exerciseSection).toContain('Add set');
    expect(builder).toContain('Save');
    expect(builder).toContain('Discard changes?');
    expect(builder).toContain('ProgramWorkoutPickerModal');
    expect(builder).toContain('ProgramWorkoutEditorModal');
    expect(picker).toContain('Choose existing workout');
    expect(picker).toContain('Create new workout');
    expect(picker).toContain('Add workout');
    expect(editor).toContain('Create workout');
    expect(editor).toContain('Save');
    expect(workoutBuilderCard).not.toContain('Save workout');
  });
});
