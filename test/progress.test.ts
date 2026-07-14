import { describe, expect, it, vi } from 'vitest';

import {
  calculateAverage,
  formatDelta,
  formatProgressDelta,
  getTrendDirection,
  parseNumericMeasurement,
  findHistoricalReference,
} from '@/lib/progress/formatting';
import { getMeasurementInsights } from '@/lib/progress/measurements';
import { getLatestWeightEntry, getWeightAnalytics } from '@/lib/progress/weight';
import { getWorkoutVolumeTrend } from '@/lib/progress/workoutVolume';

describe('progress helpers', () => {
  it('formats numeric helpers and trends', () => {
    expect(formatDelta(2)).toBe('+2.0');
    expect(formatDelta(-2.34)).toBe('-2.3');
    expect(formatProgressDelta(null)).toBe('—');
    expect(formatProgressDelta(1.25)).toBe('+1.3 kg');
    expect(getTrendDirection(null)).toBe('stable');
    expect(getTrendDirection(0.1)).toBe('stable');
    expect(getTrendDirection(-0.2)).toBe('down');
    expect(calculateAverage([])).toBeNull();
    expect(calculateAverage([2, 4, 6])).toBe(4);
    expect(parseNumericMeasurement(' 72.5 cm ')).toEqual({ numeric: 72.5, unit: 'cm' });

    const entries = [
      { createdAt: '2026-01-01T00:00:00.000Z', value: 1 },
      { createdAt: '2026-01-03T00:00:00.000Z', value: 2 },
      { createdAt: '2026-01-05T00:00:00.000Z', value: 3 },
    ];

    expect(findHistoricalReference(entries, entries[2], 2)).toBe(entries[1]);
  });

  it('builds weight analytics from chronological entries', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-08T12:00:00.000Z'));

    const weightHistory = [
      { id: 'w1', date: '2026-01-01', weight: 80, createdAt: '2026-01-01T00:00:00.000Z' },
      { id: 'w2', date: '2026-01-05', weight: 79, createdAt: '2026-01-05T00:00:00.000Z' },
      { id: 'w3', date: '2026-01-07', weight: 78.5, createdAt: '2026-01-07T00:00:00.000Z' },
    ];

    expect(getLatestWeightEntry(weightHistory)?.weight).toBe(78.5);
    expect(getWeightAnalytics(weightHistory)).toMatchObject({
      currentWeight: 78.5,
      delta7Days: -1.5,
      weeklyAverage: 79.16666666666667,
      direction: 'down',
    });

    vi.useRealTimers();
  });

  it('derives measurement and workout progress slices', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-10T00:00:00.000Z'));

    expect(
      getMeasurementInsights([
        { id: 'm1', label: 'Waist', value: '80 cm', createdAt: '2026-01-01T00:00:00.000Z' },
        { id: 'm2', label: 'Waist', value: '78 cm', createdAt: '2026-01-08T00:00:00.000Z' },
      ])
    ).toEqual([
      expect.objectContaining({
        id: 'm2',
        label: 'Waist',
        delta: -2,
        direction: 'down',
        improved: true,
      }),
    ]);

    expect(
      getWorkoutVolumeTrend([
        {
          id: 's1',
          workoutId: 'push',
          workoutTitle: 'Push',
          startedAt: '2026-01-02T00:00:00.000Z',
          finishedAt: '2026-01-02T01:00:00.000Z',
          sets: [{ id: 's1-1', exerciseId: 'bench', exerciseName: 'Bench', reps: 5, weight: 80 }],
        },
        {
          id: 's2',
          workoutId: 'push',
          workoutTitle: 'Push',
          startedAt: '2026-01-05T00:00:00.000Z',
          finishedAt: '2026-01-05T01:00:00.000Z',
          sets: [{ id: 's2-1', exerciseId: 'bench', exerciseName: 'Bench', reps: 6, weight: 82.5 }],
        },
      ])
    ).toEqual([
      { id: 's1', label: '2026-01-02T01:00:00.000Z', volume: 400, createdAt: '2026-01-02T01:00:00.000Z' },
      { id: 's2', label: '2026-01-05T01:00:00.000Z', volume: 495, createdAt: '2026-01-05T01:00:00.000Z' },
    ]);

    vi.useRealTimers();
  });
});
