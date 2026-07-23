import { describe, expect, it } from 'vitest';

import { parseCoachCapabilities } from './coach';

describe('Coach capabilities v4', () => {
  it('enables Strength confirmation only from the explicit v4 flag', () => {
    expect(
      parseCoachCapabilities({
        schemaVersion: 4,
        nutrition: {
          deterministicReview: true,
          deterministicTargetProposal: true,
          structuredStrategyProposal: true,
          structuredStrategyConfirmation: true,
          strategyRequiresConfirmation: true,
        },
        strength: {
          deterministicReview: true,
          deterministicMockProposal: true,
          structuredStrategyProposal: true,
          structuredStrategyConfirmation: true,
          strategyRequiresConfirmation: true,
        },
      }),
    ).toEqual({
      schemaVersion: 4,
      nutrition: {
        deterministicReview: true,
        deterministicTargetProposal: true,
        structuredStrategyProposal: true,
        structuredStrategyConfirmation: true,
        strategyRequiresConfirmation: true,
      },
      strength: {
        deterministicReview: true,
        deterministicMockProposal: true,
        structuredStrategyProposal: true,
        structuredStrategyConfirmation: true,
        strategyRequiresConfirmation: true,
      },
    });
  });

  it('rejects missing or malformed v4 Strength confirmation metadata', () => {
    const base = {
      schemaVersion: 4,
      nutrition: {
        deterministicReview: true,
        deterministicTargetProposal: true,
        structuredStrategyProposal: true,
        structuredStrategyConfirmation: true,
        strategyRequiresConfirmation: true,
      },
    };

    expect(() => parseCoachCapabilities(base)).toThrow(
      'Invalid coach capabilities response',
    );
    expect(() =>
      parseCoachCapabilities({
        ...base,
        strength: {
          deterministicReview: true,
          deterministicMockProposal: true,
          structuredStrategyProposal: true,
          structuredStrategyConfirmation: 'yes',
          strategyRequiresConfirmation: true,
        },
      }),
    ).toThrow('Invalid coach capabilities response');
  });
});
