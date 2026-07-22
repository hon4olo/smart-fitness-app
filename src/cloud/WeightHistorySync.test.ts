import { describe, expect, it } from 'vitest';

import { defaultState } from '@/data/defaults';

import { applyRemoteWeightHistoryChanges } from './WeightHistorySync';

describe('applyRemoteWeightHistoryChanges', () => {
  it('uses the operation envelope revision when the payload has no revision', () => {
    const result = applyRemoteWeightHistoryChanges(
      { ...defaultState, weightHistory: [] },
      [
        {
          entityType: 'weight_history',
          entityId: 'weight-1',
          revision: 12,
          appliedAt: '2026-07-22T10:00:00.000Z',
          payload: {
            id: 'weight-1',
            weight: 69.5,
            recordedAt: '2026-07-22T08:00:00.000Z',
            createdAt: '2026-07-22T08:00:00.000Z',
            updatedAt: '2026-07-22T10:00:00.000Z',
            deviceId: 'device-1',
          },
        },
      ],
      [],
      new Map(),
      '2026-07-22T10:00:00.000Z',
    );

    expect(result.nextState.weightHistory).toHaveLength(1);
    expect(result.metadata).toEqual([
      expect.objectContaining({ id: 'weight-1', revision: 12 }),
    ]);
  });

  it('ignores deletions for other entity types', () => {
    const result = applyRemoteWeightHistoryChanges(
      {
        ...defaultState,
        weightHistory: [
          {
            id: 'shared-id',
            date: '22 Jul',
            weight: 70,
            createdAt: '2026-07-22T08:00:00.000Z',
          },
        ],
      },
      [],
      [
        {
          entityType: 'workout_sessions',
          entityId: 'shared-id',
          revision: 13,
          appliedAt: '2026-07-22T11:00:00.000Z',
        },
      ],
    );

    expect(result.nextState.weightHistory).toHaveLength(1);
    expect(result.deletedRecordIds).toEqual([]);
  });
});
