import { describe, expect, it } from 'vitest';

import { parseCoachCapabilities } from './coach';

const nutrition = {
  deterministicReview: true,
  deterministicTargetProposal: true,
  structuredStrategyProposal: true,
  structuredStrategyConfirmation: true,
  strategyRequiresConfirmation: true,
} as const;

const strength = {
  deterministicReview: true,
  deterministicMockProposal: true,
  structuredStrategyProposal: true,
  structuredStrategyConfirmation: true,
  strategyRequiresConfirmation: true,
} as const;

const safety = {
  deterministicRecoveryReview: true,
  revisionedLimitations: true,
  revisionedRecoveryCheckIns: true,
  automaticApplication: false,
} as const;

describe('Coach capabilities v5', () => {
  it('enables the deterministic Safety Recovery contract only from v5', () => {
    expect(
      parseCoachCapabilities({
        schemaVersion: 5,
        nutrition,
        strength,
        safety,
      }),
    ).toEqual({
      schemaVersion: 5,
      nutrition,
      strength,
      safety,
    });
  });

  it('rejects missing or unsafe Safety Recovery capability metadata', () => {
    expect(() =>
      parseCoachCapabilities({
        schemaVersion: 5,
        nutrition,
        strength,
      }),
    ).toThrow('Invalid coach capabilities response');

    expect(() =>
      parseCoachCapabilities({
        schemaVersion: 5,
        nutrition,
        strength,
        safety: {
          ...safety,
          automaticApplication: true,
        },
      }),
    ).toThrow('Invalid coach capabilities response');
  });
});
