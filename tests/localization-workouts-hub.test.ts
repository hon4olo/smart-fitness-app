import { describe, expect, it } from 'vitest';

import {
  getWorkoutsHubProgramTitle,
  getWorkoutsHubWorkoutTitle,
} from '@/features/workouts/workoutsHubLocalization';
import { translate } from '@/localization/LocalizationProvider';
import { enMessages, ruMessages, type Translate } from '@/localization/messages';
import type { TrainingProgram, Workout } from '@/types';

declare const __dirname: string;
declare const require: any;

const { readFileSync } = require('fs') as {
  readFileSync: (path: string, encoding: string) => string;
};
const { resolve } = require('path') as { resolve: (...parts: string[]) => string };
const projectRoot = resolve(__dirname, '..');
const readSource = (path: string) => readFileSync(resolve(projectRoot, path), 'utf8');

const WORKOUTS_HUB_FILES = [
  'src/app/(tabs)/workouts.tsx',
  'src/features/workouts/screens/WorkoutsScreen.tsx',
  'src/features/workouts/screens/WorkoutsScreenComponents.tsx',
  'src/features/workouts/workoutsHubLocalization.ts',
] as const;

const ruTranslate: Translate = (key, values) => translate('ru', key, values);

describe('localized Workouts hub contract', () => {
  it('keeps representative Workouts hub keys in both catalogs', () => {
    const keys = [
      'workouts.history',
      'workouts.tabs.startNow',
      'workouts.exerciseCount.many',
      'workouts.programNameRequired',
      'workouts.noRoutines',
      'workouts.startEmptyWorkout',
    ] as const;

    for (const key of keys) {
      expect(enMessages[key].trim(), key).not.toBe('');
      expect(ruMessages[key].trim(), key).not.toBe('');
      expect(ruMessages[key], key).not.toBe(enMessages[key]);
    }
  });

  it('does not branch on locale or hard-code English controls in the completed hub slice', () => {
    for (const path of WORKOUTS_HUB_FILES) {
      const source = readSource(path);
      expect(source, path).not.toMatch(/locale\s*===\s*['"](?:ru|en)['"]/);
      expect(source, path).not.toMatch(/locale\.startsWith\(\s*['"]ru/);
      expect(source, path).not.toMatch(
        /\b(?:label|title|subtitle|placeholder|helperText|accessibilityLabel|accessibilityHint)\s*=\s*['"][A-Za-z]/,
      );
    }
  });

  it('does not render the audited fixed English hub copy directly', () => {
    const route = readSource('src/app/(tabs)/workouts.tsx');
    const screen = readSource('src/features/workouts/screens/WorkoutsScreen.tsx');
    const components = readSource('src/features/workouts/screens/WorkoutsScreenComponents.tsx');
    const source = `${route}\n${screen}\n${components}`;

    for (const copy of [
      'Workout history',
      'Start Now',
      'Recently Added',
      'Give the program a name',
      'No favorite programs yet.',
      'Resume Workout',
      'Start an Empty Workout',
    ]) {
      expect(source).not.toContain(copy);
    }
  });

  it('localizes built-in workout and program names without mutating user titles', () => {
    const defaultWorkout = {
      id: 'push-a',
      title: 'Upper Body Strength',
      duration: '45 min',
      exercises: [],
    } as Workout;
    const customWorkout = {
      id: 'custom-workout',
      title: 'My Pull Day',
      duration: '45 min',
      exercises: [],
      isCustom: true,
    } as Workout;
    const defaultProgram = {
      id: 'default-program',
      name: 'Strength Program',
      createdAt: '2026-07-26T00:00:00.000Z',
      days: [],
      difficulty: 'intermediate',
      durationWeeks: 8,
      goal: 'Strength',
    } as TrainingProgram;
    const customProgram = {
      id: 'custom-program',
      name: 'My Program',
      createdAt: '2026-07-26T00:00:00.000Z',
      days: [],
      difficulty: 'intermediate',
      durationWeeks: 8,
      goal: 'Strength',
      isCustom: true,
    } as TrainingProgram;

    expect(getWorkoutsHubWorkoutTitle(ruTranslate, defaultWorkout)).toBe(
      'Силовая тренировка верха тела',
    );
    expect(getWorkoutsHubWorkoutTitle(ruTranslate, customWorkout)).toBe('My Pull Day');
    expect(getWorkoutsHubProgramTitle(ruTranslate, defaultProgram)).toBe('Силовая программа');
    expect(getWorkoutsHubProgramTitle(ruTranslate, customProgram)).toBe('My Program');
  });

  it('keeps a visible explanation next to the disabled program-create action', () => {
    const components = readSource('src/features/workouts/screens/WorkoutsScreenComponents.tsx');

    expect(components).toContain("t('workouts.programNameRequired')");
    expect(components).toContain('accessibilityState={{ disabled: !canCreate }}');
  });
});
