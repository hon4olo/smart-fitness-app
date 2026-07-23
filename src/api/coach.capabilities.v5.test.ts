import { describe, expect, it } from 'vitest';

import { parseCoachCapabilities } from './coach';

describe('Coach capabilities v5', () => {
  it('parses the deterministic Safety Recovery contract without exposing automatic apply', () => {
    expect(
      parseCoachCapabilities({
        schemaVersion: 5,
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
        safetyRecovery: {
          deterministicReview: true,
          limitationSync: true,
          recoveryCheckInSync: true,
          automaticApplication: false,
        },
      }),
    ).toEqual({
      schemaVersion: 5,
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
      safetyRecovery: {
        deterministicReview: true,
        limitationSync: true,
        recoveryCheckInSync: true,
      },
    });
  });

  it('rejects v5 responses without the Safety Recovery section', () => {
    expect(() =>
      parseCoachCapabilities({
        schemaVersion: 5,
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
      }),
    ).toThrow('Invalid coach capabilities response');
  });
});
