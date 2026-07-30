import { describe, expect, test } from 'vitest';

declare const __dirname: string;
declare const require: any;

const { readFileSync } = require('fs') as { readFileSync: (path: string, encoding: string) => string };
const { resolve } = require('path') as { resolve: (...parts: string[]) => string };

const projectRoot = resolve(__dirname, '..');
const readSource = (relativePath: string) => readFileSync(resolve(projectRoot, relativePath), 'utf8');
const count = (source: string, needle: string) => (source.match(new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) ?? []).length;
const readWorkoutsSource = () =>
  [
    readSource('src/features/workouts/screens/WorkoutsScreen.tsx'),
    readSource('src/features/workouts/screens/WorkoutsScreenComponents.tsx'),
  ].join('\n');

describe('product simplification 2.0', () => {
  test('workouts screen keeps the start-now section order and one visible create action', () => {
    const screen = readSource('src/features/workouts/screens/WorkoutsScreen.tsx');
    const source = readWorkoutsSource();
    const startNowBlock = screen.slice(screen.indexOf("activeTab === 'start-now'"), screen.indexOf('<View style={styles.programList}>'));
    const programsBlock = screen.slice(screen.indexOf('<View style={styles.programList}>'), screen.indexOf('</View>', screen.indexOf('<View style={styles.programList}>')));
    expect(startNowBlock).toContain('suggested.map');
    expect(startNowBlock).toContain("t('workouts.recentlyAdded')");
    expect(programsBlock).not.toContain('title="Programs"');
    expect(programsBlock).toContain("t('workouts.addProgram')");
    expect(programsBlock.indexOf("t('workouts.addProgram')")).toBeLessThan(programsBlock.indexOf('visibleProgramSummaries.map'));
    expect(programsBlock).toContain('icon="add"');
    expect(source).toContain('CreateProgramModal');
    expect(source).toContain('ProgramRow');
    expect(source).not.toContain('addProgramActionLabel');
  });

  test('workouts screen uses a consistent card and program metadata model', () => {
    const source = readWorkoutsSource();
    expect(source).toContain('displaySubtitle');
    expect(source).toContain('getWorkoutsHubWorkoutTitle');
    expect(source).toContain('getWorkoutsHubProgramTitle');
    expect(source).toContain('formatPlural');
    expect(source).toContain('RoutineCard');
    expect(source).toContain('coverLabel');
    expect(source).toContain('ProgramRow');
    expect(source).toContain('icon="add"');
    expect(source).toContain('workoutCount={summary.workoutCount}');
    expect(source).toContain('CreateProgramModal');
    expect(source).not.toContain('detailLabel={summary.subtitle}');
    expect(source).not.toContain('countLabel={`${summary.workoutCount} workout');
    expect(source).not.toContain('Create program');
  });

  test('progress screen keeps one weight summary and hides duplicate analytics blocks', () => {
    const source = readSource('src/app/(tabs)/progress.tsx');
    expect(source).toContain("t('progress.currentWeight')");
    expect(source).not.toContain('7-day');
    expect(source).not.toContain('30-day');
    expect(source).not.toContain('weekly average');
    expect(source).toContain("t('progress.weightDetails')");
    expect(source).not.toContain('ProgressPlanningSections');
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
    const summaryGrid = readSource('src/features/nutrition/components/NutritionSummaryGrid.tsx');
    const mealGroup = readSource('src/features/nutrition/components/MealGroup.tsx');
    const foodEntryRow = readSource('src/features/nutrition/components/FoodEntryRow.tsx');
    const weekStrip = readSource('src/features/nutrition/components/NutritionWeekStrip.tsx');
    const detailsSection = readSource('src/features/nutrition/components/NutritionDetailsSection.tsx');
    const nutritionUi = [source, summaryGrid, mealGroup, foodEntryRow, weekStrip, detailsSection].join('\n');
    expect(source).toContain('Nutrition');
    expect(source).toContain('calendarButton');
    expect(source).toContain('summarySection');
    expect(source).toContain('mealSectionList');
    expect(nutritionUi).toContain('mealGroup');
    expect(nutritionUi).toContain('mealSummaryStrip');
    expect(nutritionUi).toContain('NutritionSummaryGrid');
    expect(nutritionUi).toContain('macroGridRow');
    expect(nutritionUi).toContain('macroGridValue');
    expect(nutritionUi).toContain('foodRowTop');
    expect(nutritionUi).toContain('foodMetadata');
    expect(nutritionUi).toContain('detailsSection');
    expect(nutritionUi).toContain('detailRow');
    expect(nutritionUi).not.toContain('mealSummaryValue');
    expect(nutritionUi).not.toContain('foodRowCalories');
    expect(nutritionUi).not.toContain('foodRowMacroLine');
    expect(nutritionUi).not.toContain('foodRowMacroValue');
    expect(nutritionUi).not.toContain('foodRowMacroServing');
    expect(source).toContain("router.push({ pathname: '/nutrition/add-food'");
    expect(source).toContain("pathname: '/nutrition/date-picker'");
    expect(source).toContain('todayButton');
    expect(nutritionUi).toContain('weekDayButton');
    expect(nutritionUi).not.toContain('Consumed today');
    expect(nutritionUi).not.toContain('This week');
    expect(nutritionUi).not.toContain('Daily summary');
    expect(nutritionUi).not.toContain('Footer actions');
  });

  test('nutrition picker route keeps the meal-aware modes and quiet edit/delete path', () => {
    const route = readSource('src/app/nutrition/add-food.tsx');
    const view = readSource('src/features/nutrition/components/NutritionAddFoodView.tsx');
    const copy = readSource('src/localization/nutritionAddFoodCopy.ts');
    const source = [route, view, copy].join('\n');

    expect(view).toContain('label: copy.modes.food');
    expect(view).toContain('label: copy.modes.recent');
    expect(view).toContain('label: copy.modes.favorites');
    expect(view).toContain('label: copy.modes.meals');
    expect(view).toContain('copy.createFood');
    expect(view).toContain('copy.createMeal');
    expect(source).toContain('onQuickAdd');
    expect(view).toContain('deleteLabel={copy.deleteEntry}');
    expect(route).toContain('copy.saveChanges');
    expect(route).toContain('copy.addToMeal(selectedMealLabel)');
  });

  test('Profile owns the plan, Coach owns Coach tools, and Progress stays analytical', () => {
    const profile = readSource('src/app/(tabs)/profile.tsx');
    const profileGoals = readSource('src/features/profile/ProfileGoalsSection.tsx');
    const coach = readSource('src/app/(tabs)/coach.tsx');
    const progress = readSource('src/app/(tabs)/progress.tsx');
    const settings = readSource('src/app/settings/index.tsx');
    expect(profile).not.toContain('ProfileHeaderCard');
    expect(profile).not.toContain('Account Snapshot');
    expect(profile).not.toContain('AuthGateCard');
    expect(profile).not.toContain('ProfileCoachCard');
    expect(profile).toContain('ProfilePreferencesCard');
    expect(profile).toContain('ProfileGoalsSection');
    expect(profileGoals).toContain('ProfileGoalsCard');
    expect(coach).toContain('/profile/recovery-check-in');
    expect(coach).toContain('/profile/combined-proposal');
    expect(progress).not.toContain('ProgressPlanningSections');
    expect(settings).toContain('<AuthGateCard />');
  });

  test('tab bar is compact and conventional', () => {
    const source = readSource('src/app/(tabs)/_layout.tsx');
    const tabBar = readSource('src/components/navigation/LiquidGlassTabBar.tsx');

    expect(source).toContain('Tabs');
    expect(source).not.toContain('NativeTabs');
    expect(source).toContain('tabBar={(props) => <LiquidGlassTabBar {...props} />}');
    expect(source).toContain('headerShown: false');
    expect(source).toContain('tabBarHideOnKeyboard: true');
    expect(source).toContain("title: t('tabs.coach')");
    expect(source).toContain('name="profile" options={{ href: null }}');
    expect(tabBar).toContain("import type { BottomTabBarProps } from 'expo-router/js-tabs';");
    expect(tabBar).toContain('BlurView');
    expect(tabBar).toContain('Canvas');
    expect(tabBar).toContain('usePathInterpolation');
    expect(tabBar).toContain('selectionAsync()');
    expect(tabBar).toContain('impactAsync(Haptics.ImpactFeedbackStyle.Light)');
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
    const workouts = readWorkoutsSource();
    const template = readSource('src/features/workouts/screens/WorkoutTemplateDetailScreen.tsx');
    const program = readSource('src/features/workouts/screens/ProgramDetailScreen.tsx');
    const nutrition = readSource('src/app/(tabs)/nutrition.tsx');
    const nutritionPicker = readSource('src/app/nutrition/add-food.tsx');
    const profile = readSource('src/app/(tabs)/profile.tsx');
    const coach = readSource('src/app/(tabs)/coach.tsx');
    const settings = readSource('src/app/settings/index.tsx');
    const sessionTable = readSource('src/features/workouts/components/session/SessionSetTable.tsx');
    const exerciseSection = readSource('src/features/workouts/components/session/SessionExerciseSection.tsx');
    const builder = readSource('src/features/workouts/screens/WorkoutBuilderScreen.tsx');
    const picker = readSource('src/components/workouts/ProgramWorkoutPickerModal.tsx');
    const editor = readSource('src/components/workouts/ProgramWorkoutEditorModal.tsx');
    const workoutBuilderCard = readSource('src/components/workouts/WorkoutBuilderCard.tsx');
    expect(workouts).toContain("messageKey: 'workouts.tabs.startNow'");
    expect(workouts).toContain("messageKey: 'workouts.tabs.programs'");
    expect(workouts).not.toContain('Start empty workout');
    expect(template).toContain('startWorkoutSession(workout)');
    expect(template).toContain('copy.startWorkout');
    expect(template).toContain('toggleWorkoutTemplateFavorite(workout.id)');
    expect(template).toContain('copy.addFavorite');
    expect(template).toContain('copy.removeFavorite');
    expect(program).toContain("pathname: '/workouts/routine/new'");
    expect(program).toContain('copy.addRoutine');
    expect(program).toContain('playButton');
    expect(program).not.toContain('styles.startChip');
    expect(nutrition).toContain("router.push({ pathname: '/nutrition/add-food'");
    expect(nutritionPicker).toContain('addFoodEntries');
    expect(profile).toContain("router.push('/settings')");
    expect(coach).toContain('/profile/limitations');
    expect(settings).toContain('settings.appearance');
    expect(settings).toContain('settings.language');
    expect(settings).toContain('setWeightUnit');
    expect(sessionTable).toContain("t('workouts.session.set')");
    expect(sessionTable).toContain("t('workouts.session.previous')");
    expect(sessionTable).toContain('weightUnit');
    expect(sessionTable).toContain("t('workouts.session.reps')");
    expect(sessionTable).toContain('✓');
    expect(sessionTable).not.toContain('colOverflow');
    expect(exerciseSection).toContain("t('workouts.session.addSet')");
    expect(exerciseSection).toContain('useUnitPreferences');
    expect(builder).toContain('handleSaveProgram');
    expect(builder).toContain('copy.discardChanges');
    expect(builder).toContain('ProgramWorkoutPickerModal');
    expect(builder).toContain('ProgramWorkoutEditorModal');
    expect(picker).toContain('copy.chooseExistingWorkout');
    expect(picker).toContain('copy.createNewWorkout');
    expect(picker).toContain('copy.addWorkoutCount');
    expect(picker).toContain('onAddWorkouts(selectedIds)');
    expect(editor).toContain('copy.createNewWorkout');
    expect(editor).toContain('copy.save');
    expect(editor).toContain('onSaveWorkout({');
    expect(workoutBuilderCard).not.toContain('Save workout');
  });
});
