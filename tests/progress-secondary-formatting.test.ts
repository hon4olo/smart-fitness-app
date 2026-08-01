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

const auditedPresentation = () =>
  [
    readSource('src/app/(tabs)/progress.tsx'),
    readSource('src/app/weight-details.tsx'),
    readSource('src/components/progress/ProgressTrendChart.tsx'),
    readSource('src/components/progress/WeeklyWorkoutVolumeCard.tsx'),
  ].join('\n');

describe('secondary Progress formatting boundaries', () => {
  it('uses central locale and selected-unit formatting for charts and measurements', () => {
    const progress = readSource('src/app/(tabs)/progress.tsx');
    const chart = readSource('src/components/progress/ProgressTrendChart.tsx');
    const weeklyVolume = readSource(
      'src/components/progress/WeeklyWorkoutVolumeCard.tsx',
    );
    const weightDetails = readSource('src/app/weight-details.tsx');
    const source = auditedPresentation();

    expect(progress).toContain('formatLengthValue,');
    expect(progress).toContain('formatWeightValue,');
    expect(progress).toContain('formatNumber(measurement.latestNumericValue');
    expect(weeklyVolume).toContain('weightFromKg(week.volume, weightUnit)');
    expect(weeklyVolume).toContain('weightFromKg(volume, weightUnit)');
    expect(chart).toContain('value: formatNumber(midpoint');
    expect(weightDetails).toContain(
      'displayValue: `${formatWeightValue(entry.weight)} ${weightUnit}`',
    );
    expect(source).not.toContain('.toFixed(');
    expect(source).not.toContain('.toLocaleString(');
    expect(source).not.toContain('new Intl.');
  });

  it('keeps chart geometry and bounded analytics ordering unchanged', () => {
    const progress = readSource('src/app/(tabs)/progress.tsx');
    const chart = readSource('src/components/progress/ProgressTrendChart.tsx');
    const weeklyVolume = readSource(
      'src/components/progress/WeeklyWorkoutVolumeCard.tsx',
    );

    expect(progress).toContain('getProgressAnalytics({');
    expect(progress).toContain('analytics.measurements.slice(0, 3)');
    expect(progress).toContain('<WeeklyWorkoutVolumeCard sessions={workoutSessions} />');
    expect(weeklyVolume).toContain('getWeeklyWorkoutVolume');
    expect(weeklyVolume).toContain('weeklyVolume.at(-1)');
    expect(weeklyVolume).toContain('weeklyVolume.at(-2)');
    expect(chart).toContain('const visibleRange = Math.max(');
    expect(chart).toContain('const axisMinimum = minValue - visibleRange * 0.18');
    expect(chart).toContain('const axisMaximum = maxValue + visibleRange * 0.08');
    expect(chart).toContain('((point.value - axisMinimum) / axisRange)');
  });

  it('preserves measurement persistence and existing navigation contracts', () => {
    const progress = readSource('src/app/(tabs)/progress.tsx');
    const weightDetails = readSource('src/app/weight-details.tsx');

    expect(progress).toContain('buildBodyMeasurement({');
    expect(progress).toContain('addBodyMeasurement(result.measurement)');
    expect(progress).toContain('createUuid()');
    expect(progress).toContain("router.push('/weight-entry')");
    expect(progress).toContain("router.push('/weight-details')");
    expect(progress).toContain("router.push('/workout-history')");
    expect(weightDetails).toContain("router.push('/workout-history')");
    expect(weightDetails).toContain('analytics.weight.recentEntries');
  });
});
