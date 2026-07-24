import { describe, expect, it } from 'vitest';

import { parseCoachCapabilities } from './coach/parsers';

const capabilities = {
  schemaVersion: 10,
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
    nutritionReconciliation: true,
    automaticApplication: false,
  },
};

describe('Coach capabilities v10', () => {
  it('accepts deterministic Combined Nutrition reconciliation support', () => {
    expect(parseCoachCapabilities(capabilities)).toEqual(capabilities);
  });

  it('rejects v10 without the reconciliation flag', () => {
    expect(() =>
      parseCoachCapabilities({
        ...capabilities,
        combined: {
          ...capabilities.combined,
          nutritionReconciliation: false,
        },
      }),
    ).toThrow('Invalid coach capabilities response');
  });

  it('continues to accept schema v9 without reconciliation support', () => {
    const combined = { ...capabilities.combined };
    delete (combined as Partial<typeof combined>).nutritionReconciliation;
    expect(
      parseCoachCapabilities({ ...capabilities, schemaVersion: 9, combined }),
    ).toMatchObject({
      schemaVersion: 9,
      combined: {
        effectiveStrengthConfirmation: true,
        nutritionConfirmation: true,
        automaticApplication: false,
      },
    });
  });
});
