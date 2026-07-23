import { describe, expect, it } from 'vitest';

import type { WorkoutSession } from '@/types';
import { filterWorkoutHistory } from './workoutHistoryViewModel';

const session = (id: string, finishedAt: string): WorkoutSession => ({
  id,
  workoutId: 'workout-a',
  workoutTitle: 'Workout A',
  startedAt: new Date(Date.parse(finishedAt) - 60 * 60 * 1000).toISOString(),
  finishedAt,
  sets: [],
});

describe('workout history explicit date ranges', () => {
  it('uses an inclusive start and exclusive end boundary', () => {
    const startAt = Date.parse('2026-07-01T00:00:00.000Z');
    const endAt = Date.parse('2026-07-08T00:00:00.000Z');
    const sessions = [
      session('11111111-1111-4111-8111-111111111111', '2026-06-30T23:59:59.999Z'),
      session('22222222-2222-4222-8222-222222222222', '2026-07-01T00:00:00.000Z'),
      session('33333333-3333-4333-8333-333333333333', '2026-07-07T23:59:59.999Z'),
      session('44444444-4444-4444-8444-444444444444', '2026-07-08T00:00:00.000Z'),
    ];

    expect(
      filterWorkoutHistory(sessions, [], {
        period: 'all',
        programId: 'all',
        safety: 'all',
        dateRange: { startAt, endAt },
      }).map((item) => item.session.id),
    ).toEqual([
      '33333333-3333-4333-8333-333333333333',
      '22222222-2222-4222-8222-222222222222',
    ]);
  });

  it('ignores malformed ranges and falls back to the selected period', () => {
    const sessions = [
      session('11111111-1111-4111-8111-111111111111', '2026-05-01T00:00:00.000Z'),
      session('22222222-2222-4222-8222-222222222222', '2026-07-23T00:00:00.000Z'),
    ];

    expect(
      filterWorkoutHistory(
        sessions,
        [],
        {
          period: '7d',
          programId: 'all',
          safety: 'all',
          dateRange: { startAt: Number.NaN, endAt: 0 },
        },
        Date.parse('2026-07-24T00:00:00.000Z'),
      ).map((item) => item.session.id),
    ).toEqual(['22222222-2222-4222-8222-222222222222']);
  });
});