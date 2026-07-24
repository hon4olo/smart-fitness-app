import { describe, expect, it } from 'vitest';

declare const __dirname: string;
declare const require: any;

const { readFileSync } = require('fs') as {
  readFileSync: (path: string, encoding: string) => string;
};
const { resolve } = require('path') as { resolve: (...parts: string[]) => string };

const projectRoot = resolve(__dirname, '../../..');
const readSource = (relativePath: string) =>
  readFileSync(resolve(projectRoot, relativePath), 'utf8');

describe('Safety Recovery weekly history drilldown', () => {
  it('keeps week selection separate from explicit history actions', () => {
    const card = readSource('src/components/progress/SafetyRecoveryWeeklyTrendCard.tsx');

    expect(card).toContain('setSelectedPointKey(point.key)');
    expect(card).toContain('All workouts');
    expect(card).toContain('openHistory(status)');
    expect(card).toContain('getEndExclusive');
  });

  it('passes the selected range and optional status through the Progress route', () => {
    const progress = readSource('src/app/(tabs)/progress.tsx');

    expect(progress).toContain("pathname: '/workout-history'");
    expect(progress).toContain('from: startAt');
    expect(progress).toContain('to: endAt');
    expect(progress).toContain('...(safety ? { safety } : {})');
  });

  it('hydrates workout history filters from route params', () => {
    const history = readSource('src/features/workouts/screens/WorkoutHistoryScreen.tsx');

    expect(history).toContain('useLocalSearchParams<WorkoutHistoryRouteParams>');
    expect(history).toContain('parseWorkoutHistoryRouteFilters(params)');
    expect(history).toContain('dateRange,');
    expect(history).toContain('Selected weekly range');
  });
});
