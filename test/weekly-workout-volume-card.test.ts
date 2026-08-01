import { describe, expect, test } from 'vitest';

declare const __dirname: string;
declare const require: any;

const { readFileSync } = require('fs') as {
  readFileSync: (path: string, encoding: string) => string;
};
const { resolve } = require('path') as {
  resolve: (...parts: string[]) => string;
};

const cardSource = readFileSync(
  resolve(__dirname, '../src/components/progress/WeeklyWorkoutVolumeCard.tsx'),
  'utf8',
);
const progressSource = readFileSync(
  resolve(__dirname, '../src/app/(tabs)/progress.tsx'),
  'utf8',
);

describe('weekly workout volume card', () => {
  test('uses the weekly selector with a ten-week local-time series', () => {
    expect(cardSource).toContain('getWeeklyWorkoutVolume');
    expect(cardSource).toContain('weeks: 10');
    expect(cardSource).toContain('-new Date().getTimezoneOffset()');
  });

  test('renders current-week volume, workout count, comparison, and chart', () => {
    expect(cardSource).toContain("t('progress.trainingVolume')");
    expect(cardSource).toContain("t('progress.weeklyWorkoutCount')");
    expect(cardSource).toContain("t('progress.compareValues'");
    expect(cardSource).toContain('<ProgressTrendChart');
  });

  test('keeps an explicit empty state', () => {
    expect(cardSource).toContain('<EmptyState');
    expect(cardSource).toContain("t('progress.noWorkoutTrend')");
  });

  test('is the single training-progress surface on Progress', () => {
    expect(progressSource).toContain(
      '<WeeklyWorkoutVolumeCard sessions={workoutSessions} />',
    );
    expect(progressSource).not.toContain('latestVolumePoint');
    expect(progressSource).not.toContain('previousVolumePoint');
    expect(progressSource).not.toContain('formatWorkoutVolume');
  });
});
