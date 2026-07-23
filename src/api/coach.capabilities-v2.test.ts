import { describe, expect, it } from 'vitest';

import { parseCoachCapabilities } from './coach';

describe('Coach capabilities v2', () => {
  it('enables strategy confirmation only from an explicit v2 flag', () => {
    expect(
      parseCoachCapabilities({
        schemaVersion: 2,
        nutrition: {
          deterministicReview: true,
          deterministicTargetProposal: true,
          structuredStrategyProposal: true,
          structuredStrategyConfirmation: true,
          strategyRequiresConfirmation: true,
        },
      }),
    ).toEqual({
      schemaVersion: 2,
      nutrition: {
        deterministicReview: true,
        deterministicTargetProposal: true,
        structuredStrategyProposal: true,
        structuredStrategyConfirmation: true,
        strategyRequiresConfirmation: true,
      },
    });
  });

  it('rejects a v2 response without the confirmation capability', () => {
    expect(() =>
      parseCoachCapabilities({
        schemaVersion: 2,
        nutrition: {
          deterministicReview: true,
          deterministicTargetProposal: true,
          structuredStrategyProposal: true,
          strategyRequiresConfirmation: true,
        },
      }),
    ).toThrow('Invalid coach capabilities response');
  });

  it('keeps a v1 backend preview-only', () => {
    const capabilities = parseCoachCapabilities({
      schemaVersion: 1,
      nutrition: {
        deterministicReview: true,
        deterministicTargetProposal: true,
        structuredStrategyProposal: true,
        strategyRequiresConfirmation: true,
      },
    });

    expect(capabilities.schemaVersion).toBe(1);
    expect(capabilities.nutrition.structuredStrategyProposal).toBe(true);
    expect(capabilities.nutrition.structuredStrategyConfirmation).toBeUndefined();
  });
});
