import { describe, expect, it } from 'vitest';

import { parseCoachCapabilities } from './coach';

const baseCapabilities = {
  nutrition: {
    deterministicReview: true,
    deterministicTargetProposal: true,
    structuredStrategyProposal: false,
    structuredStrategyConfirmation: false,
    strategyRequiresConfirmation: true,
  },
  strength: {
    deterministicReview: true,
    deterministicMockProposal: true,
    structuredStrategyProposal: false,
    structuredStrategyConfirmation: false,
    strategyRequiresConfirmation: true,
  },
} as const;

describe('Coach capabilities v5', () => {
  it('parses the deterministic Safety contract and preserves the no-auto-apply boundary', () => {
    expect(
      parseCoachCapabilities({
        schemaVersion: 5,
        ...baseCapabilities,
        safety: {
          deterministicRecoveryReview: true,
          revisionedLimitations: true,
          revisionedRecoveryCheckIns: true,
          automaticApplication: false,
        },
      }),
    ).toEqual({
      schemaVersion: 5,
      ...baseCapabilities,
      safety: {
        deterministicRecoveryReview: true,
        revisionedLimitations: true,
        revisionedRecoveryCheckIns: true,
        automaticApplication: false,
      },
    });
  });

  it('rejects v5 responses without the Safety section or with automatic apply enabled', () => {
    expect(() =>
      parseCoachCapabilities({
        schemaVersion: 5,
        ...baseCapabilities,
      }),
    ).toThrow('Invalid coach capabilities response');

    expect(() =>
      parseCoachCapabilities({
        schemaVersion: 5,
        ...baseCapabilities,
        safety: {
          deterministicRecoveryReview: true,
          revisionedLimitations: true,
          revisionedRecoveryCheckIns: true,
          automaticApplication: true,
        },
      }),
    ).toThrow('Invalid coach capabilities response');
  });

  it('preserves v4 backends without inventing Safety capabilities', () => {
    expect(
      parseCoachCapabilities({
        schemaVersion: 4,
        ...baseCapabilities,
      }).safety,
    ).toBeUndefined();
  });
});
