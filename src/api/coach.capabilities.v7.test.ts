import { describe, expect, it } from 'vitest';

import { parseCoachCapabilities } from './coach/parsers';

const capabilities = {
  schemaVersion: 7,
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
    automaticApplication: false,
  },
};

describe('Coach capabilities v7', () => {
  it('accepts the read-only Combined proposal capability', () => {
    expect(parseCoachCapabilities(capabilities)).toEqual(capabilities);
  });

  it('rejects Combined proposal capability without explicit confirmation', () => {
    expect(() =>
      parseCoachCapabilities({
        ...capabilities,
        combined: {
          ...capabilities.combined,
          proposalRequiresExplicitConfirmation: false,
        },
      }),
    ).toThrow('Invalid coach capabilities response');
  });

  it('rejects any automatic application capability', () => {
    expect(() =>
      parseCoachCapabilities({
        ...capabilities,
        combined: {
          ...capabilities.combined,
          automaticApplication: true,
        },
      }),
    ).toThrow('Invalid coach capabilities response');
  });
});
