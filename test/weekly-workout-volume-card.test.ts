import { describe, expect, test } from 'vitest';

declare const __dirname: string;
declare const require: any;

const { readFileSync } = require('fs') as {
  readFileSync: (path: string, encoding: string) => string;
};
const { resolve } = require('path') as {
  resolve: (...parts: string[]) => string;
};

const source = readFileSync(
  resolve(__dirname, '../src/components/progress/WeeklyWorkoutVolumeCard.tsx'),
  'utf8',
);

describe('weekly workout volume card', () => {
  test('uses the weekly selector with a ten-week local-time series', () => {
    expect(source).toContain('getWeeklyWorkoutVolume');
    expect(source).toContain('weeks: 10');
    expect(source).toContain('-new Date().getTimezoneOffset()');
  });

  test('renders current-week volume, workout count, comparison, and chart', () => {
    expect(source).toContain("t('progress.trainingVolume')");
    expect(source).toContain("t('progress.weeklyWorkoutCount')");
    expect(source).toContain("t('progress.compareValues'");
    expect(source).toContain('<ProgressTrendChart');
  });

  test('keeps an explicit empty state', () => {
    expect(source).toContain('<EmptyState');
    expect(source).toContain("t('progress.noWorkoutTrend')");
  });
});
