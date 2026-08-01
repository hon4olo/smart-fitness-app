import { describe, expect, test } from 'vitest';

import { defaultState } from '../src/data/defaults';
import {
  updateCoachProfileInState,
  updatePersonalDetailsInState,
} from '../src/context/appContext/progressActions';

declare const __dirname: string;
declare const require: any;

const { readFileSync } = require('fs') as {
  readFileSync: (path: string, encoding: string) => string;
};
const { resolve } = require('path') as { resolve: (...parts: string[]) => string };

const projectRoot = resolve(__dirname, '..');
const readSource = (relativePath: string) =>
  readFileSync(resolve(projectRoot, relativePath), 'utf8');

describe('typed profile updater actions', () => {
  test('updates personal details without replacing unrelated state slices', () => {
    const nextState = updatePersonalDetailsInState(defaultState, {
      dateOfBirth: '2001-06-12',
      calculationSex: 'male',
    });

    expect(nextState).not.toBe(defaultState);
    expect(nextState.profile).toEqual({
      ...defaultState.profile,
      dateOfBirth: '2001-06-12',
      calculationSex: 'male',
    });
    expect(nextState.workouts).toBe(defaultState.workouts);
    expect(nextState.foodEntries).toBe(defaultState.foodEntries);
    expect(nextState.workoutSessions).toBe(defaultState.workoutSessions);
  });

  test('updates the validated Coach profile without replacing unrelated state slices', () => {
    const nextState = updateCoachProfileInState(defaultState, {
      dateOfBirth: '2001-06-12',
      calculationSex: 'male',
      height: '175',
      activityLevel: 'moderate',
      trainingExperience: 'intermediate',
    });

    expect(nextState.profile).toEqual({
      ...defaultState.profile,
      dateOfBirth: '2001-06-12',
      calculationSex: 'male',
      height: '175',
      activityLevel: 'moderate',
      trainingExperience: 'intermediate',
    });
    expect(nextState.trainingPrograms).toBe(defaultState.trainingPrograms);
    expect(nextState.recoveryCheckIns).toBe(defaultState.recoveryCheckIns);
    expect(nextState.weightHistory).toBe(defaultState.weightHistory);
  });

  test('exposes both updates through the ordered AppActions provider boundary', () => {
    const types = readSource('src/types/appContext.ts');
    const provider = readSource('src/context/AppContext.tsx');

    for (const action of ['updateCoachProfile', 'updatePersonalDetails']) {
      expect(types).toContain(action);
      expect(provider).toContain(action);
    }
    expect(provider).toContain('updateCoachProfileInState');
    expect(provider).toContain('updatePersonalDetailsInState');
    expect(provider).toContain("scheduleStateMutation({ label: 'Apply synchronized data', nextState })");
  });

  test.each([
    ['src/features/progress/ProgressPlanningSections.tsx', 'updateCoachProfile'],
    ['src/features/settings/PersonalDetailsSettingsCard.tsx', 'updatePersonalDetails'],
  ])('%s no longer reconstructs or replaces full AppState', (path, action) => {
    const source = readSource(path);

    expect(source).toContain('useAppActions');
    expect(source).toContain(action);
    expect(source).not.toContain('replaceState');
    expect(source).not.toContain('workouts:');
    expect(source).not.toContain('trainingPrograms:');
    expect(source).not.toContain('onboardingCompleted:');
  });
});
