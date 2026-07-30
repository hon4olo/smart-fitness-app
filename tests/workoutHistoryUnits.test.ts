import { describe, expect, it } from 'vitest';

declare const __dirname: string;
declare const require: any;

const { readFileSync } = require('fs') as { readFileSync: (path: string, encoding: string) => string };
const { resolve } = require('path') as { resolve: (...parts: string[]) => string };

const projectRoot = resolve(__dirname, '..');
const readSource = (relativePath: string) => readFileSync(resolve(projectRoot, relativePath), 'utf8');

describe('workout history unit boundaries', () => {
  it('formats list volume through the selected weight unit', () => {
    const source = readSource('src/features/workouts/screens/WorkoutHistoryScreen.tsx');

    expect(source).toContain('useUnitPreferences');
    expect(source).toContain('weightFromKg(volumeKg, weightUnit)');
    expect(source).toContain('formatNumber(weightFromKg(volumeKg, weightUnit)');
    expect(source).toContain('formatVolume(item.volume)');
    expect(source).not.toContain('{item.volumeLabel}');
    expect(source).not.toContain('.toLocaleString(');
  });

  it('formats completed set weights and exercise volume through the selected unit', () => {
    const source = readSource('src/features/workouts/screens/WorkoutHistoryDetailScreen.tsx');

    expect(source).toContain('formatWeightValue, weight: weightUnit');
    expect(source).toContain('weightUnit.toUpperCase()');
    expect(source).toContain('formatWeightValue(set.weight)');
    expect(source).toContain('weightFromKg(volumeKg, weightUnit)');
    expect(source).toContain('formatVolume(group.volume)');
    expect(source).toContain('formatVolume(summary.volume)');
    expect(source).not.toContain('Math.round(group.volume).toLocaleString()} kg');
    expect(source).not.toContain('new Intl.');
  });
});
