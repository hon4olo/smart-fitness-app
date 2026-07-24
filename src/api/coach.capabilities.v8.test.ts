import { describe, expect, it } from 'vitest';

import { parseCoachCapabilities } from './coach/parsers';

const capabilities = {
  schemaVersion: 8,
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
    automaticApplication: false,
  },
};

describe('Coach capabilities v8', () => {
  it('accepts explicit Combined effective Strength confirmation support', () => {
    expect(parseCoachCapabilities(capabilities)).toEqual(capabilities);
  });

  it('rejects v8 without the effective Strength confirmation flag', () => {
    expect(() =>
      parseCoachCapabilities({
        ...capabilities,
        combined: {
          ...capabilities.combined,
          effectiveStrengthConfirmation: false,
        },
      }),
    ).toThrow('Invalid coach capabilities response');
  });

  it('continues to accept schema v7 without confirmation support', () => {
    const combined = { ...capabilities.combined };
    delete (combined as Partial<typeof combined>).effectiveStrengthConfirmation;
    expect(
      parseCoachCapabilities({ ...capabilities, schemaVersion: 7, combined }),
    ).toMatchObject({
      schemaVersion: 7,
      combined: {
        deterministicProposalReview: true,
        proposalRequiresExplicitConfirmation: true,
        automaticApplication: false,
      },
    });
  });
});
