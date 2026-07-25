import { describe, expect, it } from 'vitest';

declare const __dirname: string;
declare const require: any;

const { readFileSync } = require('fs') as { readFileSync: (path: string, encoding: string) => string };
const { resolve } = require('path') as { resolve: (...parts: string[]) => string };

const projectRoot = resolve(__dirname, '..');
const source = readFileSync(
  resolve(projectRoot, 'src/features/exercises/screens/ExerciseDetailScreen.tsx'),
  'utf8',
);

describe('exercise detail unit boundaries', () => {
  it('formats history and progress weights through the selected preference', () => {
    expect(source).toContain('useUnitPreferences');
    expect(source).toContain('formatWeight(set.weight)');
    expect(source).toContain('formatWeight(progressMetrics.bestWeight)');
    expect(source).toContain('formatWeight(progressMetrics.estimatedOneRepMax)');
    expect(source).not.toContain('{set.weight} kg');
    expect(source).not.toContain('`${progressMetrics.bestWeight} kg`');
  });

  it('converts volume metrics and chart points from canonical kilograms', () => {
    expect(source).toContain('weightFromKg(valueKg, weightUnit)');
    expect(source).toContain('weightFromKg(point.value, weightUnit)');
    expect(source).toContain('points={displayVolumeTrend}');
    expect(source).toContain("maxLabel={`High · ${weightUnit}`}");
    expect(source).not.toContain('Math.round(progressMetrics.totalVolume).toLocaleString()} kg');
  });
});
