import { describe, expect, it } from 'vitest';

import { parseCoachCapabilities } from './coach/parsers';

const capabilities = {
  schemaVersion: 9,
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
  safety: {
    deterministicRecoveryReview: true,
    revisionedLimitations: true,
    revisionedRecoveryCheckIns: true,
    automaticApplication: false,
  },
  combined: {
    deterministicReview: true,
    deterministicProposalReview: true,
    proposalRequiresExplicitConfirmation: true,
    effectiveStrengthConfirmation: true,
    nutritionConfirmation: true,
    automaticApplication: false,
  },
};

describe('Coach capabilities v9', () => {
  it('accepts separate Combined Strength and Nutrition confirmation support', () => {
    expect(parseCoachCapabilities(capabilities)).toEqual(capabilities);
  });

  it('rejects v9 without explicit Nutrition confirmation support', () => {
    expect(() =>
      parseCoachCapabilities({
        ...capabilities,
        combined: {
          ...capabilities.combined,
          nutritionConfirmation: false,
        },
      }),
    ).toThrow('Invalid coach capabilities response');
  });

  it('continues to accept schema v8 without Nutrition confirmation', () => {
    const combined = { ...capabilities.combined };
    delete (combined as Partial<typeof combined>).nutritionConfirmation;
    expect(
      parseCoachCapabilities({ ...capabilities, schemaVersion: 8, combined }),
    ).toMatchObject({
      schemaVersion: 8,
      combined: {
        deterministicProposalReview: true,
        effectiveStrengthConfirmation: true,
        proposalRequiresExplicitConfirmation: true,
        automaticApplication: false,
      },
    });
  });
});
