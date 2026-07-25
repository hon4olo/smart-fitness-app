import { describe, expect, it } from 'vitest';

import { parseCoachRunTrustState } from './trust';

describe('Coach run trust parser', () => {
  it('parses bounded current and stale application states', () => {
    expect(
      parseCoachRunTrustState({
        schemaVersion: 1,
        overallState: 'stale',
        applications: [
          {
            key: 'effectiveStrength',
            state: 'current',
            sourceEntityType: 'workout_session',
            proposalRevision: 7,
            currentRevision: 7,
          },
          {
            key: 'nutrition',
            state: 'stale',
            sourceEntityType: 'nutrition_target',
            proposalRevision: 4,
            currentRevision: 5,
          },
        ],
      }),
    ).toEqual({
      schemaVersion: 1,
      overallState: 'stale',
      applications: [
        {
          key: 'effectiveStrength',
          state: 'current',
          sourceEntityType: 'workout_session',
          proposalRevision: 7,
          currentRevision: 7,
        },
        {
          key: 'nutrition',
          state: 'stale',
          sourceEntityType: 'nutrition_target',
          proposalRevision: 4,
          currentRevision: 5,
        },
      ],
    });
  });

  it('supports not-applicable and legacy applied states', () => {
    expect(
      parseCoachRunTrustState({
        schemaVersion: 1,
        overallState: 'not_applicable',
        applications: [],
      }),
    ).toEqual({
      schemaVersion: 1,
      overallState: 'not_applicable',
      applications: [],
    });
    expect(
      parseCoachRunTrustState({
        schemaVersion: 1,
        overallState: 'applied',
        applications: [
          {
            key: 'proposal',
            state: 'applied',
            sourceEntityType: 'workout_session',
            proposalRevision: null,
            currentRevision: null,
          },
        ],
      }),
    ).toMatchObject({ overallState: 'applied' });
  });

  it('rejects duplicate keys and inconsistent overall state', () => {
    expect(() =>
      parseCoachRunTrustState({
        schemaVersion: 1,
        overallState: 'current',
        applications: [
          {
            key: 'proposal',
            state: 'current',
            sourceEntityType: 'nutrition_target',
            proposalRevision: 1,
            currentRevision: 1,
          },
          {
            key: 'proposal',
            state: 'current',
            sourceEntityType: 'workout_session',
            proposalRevision: 1,
            currentRevision: 1,
          },
        ],
      }),
    ).toThrow('duplicate application');

    expect(() =>
      parseCoachRunTrustState({
        schemaVersion: 1,
        overallState: 'current',
        applications: [
          {
            key: 'proposal',
            state: 'stale',
            sourceEntityType: 'nutrition_target',
            proposalRevision: 1,
            currentRevision: 2,
          },
        ],
      }),
    ).toThrow('overallState');
  });

  it('rejects unsafe revision-state combinations and unsupported schemas', () => {
    expect(() =>
      parseCoachRunTrustState({
        schemaVersion: 1,
        overallState: 'current',
        applications: [
          {
            key: 'proposal',
            state: 'current',
            sourceEntityType: 'nutrition_target',
            proposalRevision: 1,
            currentRevision: null,
          },
        ],
      }),
    ).toThrow('revision state');
    expect(() =>
      parseCoachRunTrustState({
        schemaVersion: 2,
        overallState: 'not_applicable',
        applications: [],
      }),
    ).toThrow('Invalid Coach trust response');
  });
});
