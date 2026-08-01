import { describe, expect, test } from 'vitest';

import type { WeightEntry } from '@/types';

import { getWeightTrendEntries } from './weightTrend';

const entry = (
  id: string,
  date: string,
  weight: number,
  createdAt = `${date}T12:00:00.000Z`,
): WeightEntry => ({ id, date, weight, createdAt });

describe('getWeightTrendEntries', () => {
  test('returns empty and single-entry ranges without synthetic points', () => {
    expect(getWeightTrendEntries([], 7)).toEqual([]);
    expect(getWeightTrendEntries([entry('one', '2026-07-31', 70)], 90)).toEqual([
      entry('one', '2026-07-31', 70),
    ]);
  });

  test('selects inclusive 7, 30, and 90-day windows anchored to the latest valid entry', () => {
    const history = [
      entry('d90', '2026-05-03', 73),
      entry('d30', '2026-07-02', 71),
      entry('d7', '2026-07-25', 70.5),
      entry('latest', '2026-07-31', 70),
    ];

    expect(getWeightTrendEntries(history, 7).map((item) => item.id)).toEqual([
      'd7',
      'latest',
    ]);
    expect(getWeightTrendEntries(history, 30).map((item) => item.id)).toEqual([
      'd30',
      'd7',
      'latest',
    ]);
    expect(getWeightTrendEntries(history, 90).map((item) => item.id)).toEqual([
      'd90',
      'd30',
      'd7',
      'latest',
    ]);
  });

  test('keeps the latest write for duplicate date keys and sorts ascending', () => {
    const history = [
      entry('later-day', '2026-07-31', 70),
      entry('older-write', '2026-07-30', 71, '2026-07-30T08:00:00.000Z'),
      entry('newer-write', '2026-07-30', 70.8, '2026-07-30T20:00:00.000Z'),
    ];

    expect(getWeightTrendEntries(history, 7).map((item) => item.id)).toEqual([
      'newer-write',
      'later-day',
    ]);
  });

  test('excludes invalid timestamps and non-finite weights', () => {
    const invalidTimestamp = entry('bad-date', '2026-07-30', 71, 'invalid');
    const invalidWeight = entry('bad-weight', '2026-07-30', Number.NaN);
    const valid = entry('valid', '2026-07-31', 70);

    expect(getWeightTrendEntries([invalidTimestamp, invalidWeight, valid], 30)).toEqual([
      valid,
    ]);
  });
});
