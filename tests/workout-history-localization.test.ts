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
const readSource = (file: string) =>
  readFileSync(resolve(projectRoot, file), 'utf8');

describe('workout history localization and units', () => {
  it('uses localization and unit boundaries instead of direct Intl or raw kg copy', () => {
    const screen = readSource('src/app/workouts/history.tsx');
    const card = readSource('src/components/workouts/WorkoutHistorySessionCard.tsx');

    expect(screen).toContain('getWorkoutHistoryCopy');
    expect(screen).toContain('formatDate');
    expect(screen).toContain('parseDisplayNumber');
    expect(screen).toContain('weightToKg');
    expect(card).toContain('formatWeightValue');
    expect(card).toContain('formatNumber');
    expect(screen).not.toContain('new Intl.DateTimeFormat');
    expect(card).not.toContain('.toLocaleString(');
    expect(card).not.toContain(' kg volume');
    expect(card).not.toContain('Weight (kg)');
  });

  it('provides English and Russian copy for history, editing, alerts, and relative dates', () => {
    const copy = readSource('src/localization/workoutHistoryCopy.ts');
    expect(copy).toContain('История тренировок');
    expect(copy).toContain('Workout History');
    expect(copy).toContain('Сохранить изменения');
    expect(copy).toContain('Save Changes');
    expect(copy).toContain('Сегодня');
    expect(copy).toContain('Yesterday');
  });

  it('preserves canonical kg storage while presenting the selected unit', () => {
    const screen = readSource('src/app/workouts/history.tsx');
    const card = readSource('src/components/workouts/WorkoutHistorySessionCard.tsx');
    expect(screen).toContain('weight: weightKg');
    expect(screen).toContain('setSessionWeight(formatWeightValue(set.weight))');
    expect(card).toContain('{copy.weight} ({weight})');
    expect(card).toContain('copy.setMeta(formatWeightValue(set.weight), weight');
  });
});

// Revalidate this contract against the current main regression baseline.
