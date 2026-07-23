import { describe, expect, it } from 'vitest';

import { parseCoachCapabilities } from './coach';

const nutrition = {
  deterministicReview: true,
  deterministicTargetProposal: true,
  structuredStrategyProposal: false,
  structuredStrategyConfirmation: false,
  strategyRequiresConfirmation: true,
} as const;

const strength = {
  deterministicReview: true,
  deterministicMockProposal: true,
  structuredStrategyProposal: false,
  structuredStrategyConfirmation: false,
  strategyRequiresConfirmation: true,
} as const;

const safety = {
  deterministicRecoveryReview: true,
  revisionedLimitations: true,
  revisionedRecoveryCheckIns: true,
  automaticApplication: false,
} as const;

const combined = {
  deterministicReview: true,
  automaticApplication: false,
} as const;

describe('Coach capabilities v6', () => {
  it('enables Combined review only with a no-auto-apply contract', () => {
    expect(
      parseCoachCapabilities({
        schemaVersion: 6,
        nutrition,
        strength,
        safety,
        combined,
      }),
    ).toEqual({
      schemaVersion: 6,
      nutrition,
      strength,
      safety,
      combined,
    });
  });

  it('rejects missing or unsafe Combined capability metadata', () => {
    expect(() =>
      parseCoachCapabilities({
        schemaVersion: 6,
        nutrition,
        strength,
        safety,
      }),
    ).toThrow('Invalid coach capabilities response');

    expect(() =>
      parseCoachCapabilities({
        schemaVersion: 6,
        nutrition,
        strength,
        safety,
        combined: {
          deterministicReview: true,
          automaticApplication: true,
        },
      }),
    ).toThrow('Invalid coach capabilities response');
  });

  it('preserves v5 without inventing Combined availability', () => {
    expect(
      parseCoachCapabilities({
        schemaVersion: 5,
        nutrition,
        strength,
        safety,
      }).combined,
    ).toBeUndefined();
  });
});
