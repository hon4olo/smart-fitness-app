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

describe('responsive mobile UI contract', () => {
  it('keeps floating-tab clearance centralized', () => {
    const layout = readSource(
      'src/components/navigation/floatingTabBarLayout.ts',
    );
    const tabBar = readSource(
      'src/components/navigation/LiquidGlassTabBar.tsx',
    );
    const home = readSource('src/app/(tabs)/index.tsx');
    const progress = readSource('src/app/(tabs)/progress.tsx');
    const profile = readSource('src/app/(tabs)/profile.tsx');

    expect(layout).toContain('FLOATING_TAB_BAR_HEIGHT');
    expect(layout).toContain('FLOATING_TAB_BAR_MIN_BOTTOM_OFFSET');
    expect(tabBar).toContain('FLOATING_TAB_BAR_HEIGHT');
    expect(tabBar).toContain('FLOATING_TAB_BAR_MIN_BOTTOM_OFFSET');
    expect(home).toContain('getFloatingTabBarBottomClearance');
    expect(progress).toContain('getFloatingTabBarBottomClearance');
    expect(profile).toContain('getFloatingTabBarBottomClearance');

    expect(home).not.toContain('safeAreaInsets.bottom + 120');
    expect(progress).not.toContain('safeAreaInsets.bottom + 120');
    expect(profile).not.toContain('safeAreaInsets.bottom + 120');
  });

  it('keeps variable sticky workout and food footers measured instead of guessed', () => {
    const finish = readSource(
      'src/features/workouts/screens/WorkoutSessionFinishScreen.tsx',
    );
    const exerciseLibrary = readSource(
      'src/features/workouts/screens/WorkoutExerciseLibraryScreen.tsx',
    );

    expect(finish).toContain('footerHeight');
    expect(finish).toContain('onLayout');
    expect(finish).not.toContain('insets.bottom + 176');

    expect(exerciseLibrary).toContain('<FlatList');
    expect(exerciseLibrary).toContain('footerHeight');
    expect(exerciseLibrary).toContain('onLayout');
    expect(exerciseLibrary).not.toContain('insets.bottom + 128');
  });

  it('keeps growing workout pickers virtualized and viewport-bounded', () => {
    const workoutPicker = readSource(
      'src/components/workouts/ProgramWorkoutPickerModal.tsx',
    );
    const routinePicker = readSource(
      'src/features/workouts/components/NewRoutineModals.tsx',
    );

    expect(workoutPicker).toContain('<FlatList');
    expect(workoutPicker).toContain("maxHeight: '92%'");
    expect(workoutPicker).not.toContain('availableWorkouts.map(');

    expect(routinePicker).toContain('<FlatList');
    expect(routinePicker).not.toContain('visibleExercises.map(');
  });

  it('keeps editable auth, onboarding, profile, and nutrition surfaces keyboard-aware', () => {
    const sources = [
      'src/components/auth/AuthFormScreen.tsx',
      'src/app/auth/forgot-password.tsx',
      'src/app/auth/reset-password.tsx',
      'src/features/onboarding/OnboardingClientScreen.tsx',
      'src/components/auth/ChangePasswordModal.tsx',
      'src/components/auth/DeleteAccountModal.tsx',
      'src/app/(tabs)/profile.tsx',
      'src/features/nutrition/components/NutritionAddFoodView.tsx',
      'src/features/nutrition/components/FoodPortionSheet.tsx',
    ].map(readSource);

    for (const source of sources) {
      expect(source).toContain('automaticallyAdjustKeyboardInsets');
      expect(source).toContain('keyboardDismissMode');
      expect(source).toContain('keyboardShouldPersistTaps');
    }
  });

  it('keeps localized choice and action groups able to reflow', () => {
    const auth = readSource('src/components/auth/AuthFormScreen.tsx');
    const onboarding = readSource(
      'src/features/onboarding/OnboardingClientScreen.tsx',
    );
    const workoutActions = readSource(
      'src/components/workouts/WorkoutBuilderExerciseRow.tsx',
    );

    expect(auth).toContain("experienceRow: {");
    expect(auth).toContain("flexWrap: 'wrap'");
    expect(onboarding).toContain("choiceGrid: { flexDirection: 'row', flexWrap: 'wrap'");
    expect(onboarding).toContain("goalRow: { flexDirection: 'row', flexWrap: 'wrap'");
    expect(workoutActions).toContain("actionsRow: {");
    expect(workoutActions).toContain("flexWrap: 'wrap'");
  });
});
