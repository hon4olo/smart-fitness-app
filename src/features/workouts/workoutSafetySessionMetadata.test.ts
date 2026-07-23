import { describe, expect, it } from 'vitest';

import {
  createWorkoutSafetyMetadataFromAcknowledgement,
  type WorkoutSafetyAcknowledgement,
} from '@/storage/WorkoutSafetyAcknowledgementStore';
import {
  cloneWorkoutSafetyMetadata,
  parseWorkoutSafetyMetadata,
} from './workoutSafetySessionMetadata';

const acknowledgement: WorkoutSafetyAcknowledgement = {
  schemaVersion: 2,
  draftId: '11111111-1111-4111-8111-111111111111',
  gateKind: 'confirmation_required',
  acknowledgedAt: '2026-07-23T11:00:00.000Z',
  acknowledgementRequired: true,
  explicitlyAcknowledged: true,
  reviewRunId: '22222222-2222-4222-8222-222222222222',
  reviewStatus: 'modify',
  sourceFingerprint: 'safety-recovery-source-v1:abcdef12',
  recommendedLoadMultiplier: 0.75,
  restrictions: [
    {
      limitationId: '33333333-3333-4333-8333-333333333333',
      bodyRegion: 'shoulder',
      side: 'right',
      severity: 'moderate',
      action: 'reduce_load',
      movementPatterns: ['vertical_push'],
      maximumLoadMultiplier: 0.75,
    },
  ],
  issues: [
    {
      code: 'RECOVERY_LOAD_REDUCTION_REQUIRED',
      severity: 'modify',
      message: 'Reduce reviewed training load.',
    },
  ],
};

describe('completed workout safety metadata', () => {
  it('converts the exact gate acknowledgement into strict session metadata', () => {
    expect(createWorkoutSafetyMetadataFromAcknowledgement(acknowledgement)).toEqual({
      ...acknowledgement,
      schemaVersion: 1,
      draftId: undefined,
    });
  });

  it('requires a real explicit acknowledgement when the gate required one', () => {
    expect(
      parseWorkoutSafetyMetadata({
        ...acknowledgement,
        schemaVersion: 1,
        explicitlyAcknowledged: false,
      }),
    ).toBeNull();
  });

  it('rejects review-shaped data without a review run and deep-clones restrictions', () => {
    expect(
      parseWorkoutSafetyMetadata({
        ...acknowledgement,
        schemaVersion: 1,
        reviewRunId: null,
      }),
    ).toBeNull();

    const metadata = createWorkoutSafetyMetadataFromAcknowledgement(acknowledgement);
    expect(metadata).not.toBeNull();
    const clone = metadata ? cloneWorkoutSafetyMetadata(metadata) : null;
    expect(clone).toEqual(metadata);
    expect(clone?.restrictions).not.toBe(metadata?.restrictions);
    expect(clone?.restrictions[0]?.movementPatterns).not.toBe(
      metadata?.restrictions[0]?.movementPatterns,
    );
  });
});
