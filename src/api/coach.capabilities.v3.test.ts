import { describe, expect, it } from 'vitest';

import { parseCoachCapabilities } from './coach';

describe('Coach capabilities v3', () => {
  it('enables Strength Strategy preview only from the explicit strength section', () => {
    expect(
      parseCoachCapabilities({
        schemaVersion: 3,
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
          structuredStrategyProposal: true,
          structuredStrategyConfirmation: false,
          strategyRequiresConfirmation: true,
        },
      }),
    ).toEqual({
      schemaVersion: 3,
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
        structuredStrategyProposal: true,
        structuredStrategyConfirmation: false,
        strategyRequiresConfirmation: true,
      },
    });
  });

  it('rejects v3 responses that omit or enable Strength confirmation', () => {
    expect(() =>
      parseCoachCapabilities({
        schemaVersion: 3,
        nutrition: {
          deterministicReview: true,
          deterministicTargetProposal: true,
          structuredStrategyProposal: false,
          structuredStrategyConfirmation: false,
          strategyRequiresConfirmation: true,
        },
      }),
    ).toThrow('Invalid coach capabilities response');

    expect(() =>
      parseCoachCapabilities({
        schemaVersion: 3,
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
          structuredStrategyProposal: true,
          structuredStrategyConfirmation: true,
          strategyRequiresConfirmation: true,
        },
      }),
    ).toThrow('Invalid coach capabilities response');
  });

  it('preserves v1 and v2 backends without inventing Strength capabilities', () => {
    const v1 = parseCoachCapabilities({
      schemaVersion: 1,
      nutrition: {
        deterministicReview: true,
        deterministicTargetProposal: true,
        structuredStrategyProposal: false,
        strategyRequiresConfirmation: true,
      },
    });
    const v2 = parseCoachCapabilities({
      schemaVersion: 2,
      nutrition: {
        deterministicReview: true,
        deterministicTargetProposal: true,
        structuredStrategyProposal: true,
        structuredStrategyConfirmation: true,
        strategyRequiresConfirmation: true,
      },
    });

    expect(v1.strength).toBeUndefined();
    expect(v2.strength).toBeUndefined();
  });
});
