import { describe, expect, it } from 'vitest';

import { parseCombinedProposalApplications } from './combinedCoachProposalViewModel';

const timestamp = '2026-07-24T12:00:00.000Z';

const applications = () => ({
  applications: {
    effectiveStrength: {
      applied: true,
      appliedAt: timestamp,
      appliedRevision: 11,
      confirmationIdempotencyKey: 'combined-strength-confirmation',
      templateId: '11111111-1111-4111-8111-111111111111',
      policyVersion: 'combined-effective-strength-v1',
    },
    nutrition: {
      applied: true,
      appliedAt: timestamp,
      appliedRevision: 12,
      confirmationIdempotencyKey: 'combined-nutrition-confirmation',
      childRunId: '22222222-2222-4222-8222-222222222222',
      targetId: '33333333-3333-4333-8333-333333333333',
      requestType: 'nutrition_target_proposal',
    },
  },
});

describe('Combined proposal application metadata', () => {
  it('parses independent Strength and Nutrition applications', () => {
    expect(parseCombinedProposalApplications(applications())).toEqual({
      effectiveStrength: expect.objectContaining({
        applied: true,
        appliedRevision: 11,
        policyVersion: 'combined-effective-strength-v1',
      }),
      nutrition: expect.objectContaining({
        applied: true,
        appliedRevision: 12,
        requestType: 'nutrition_target_proposal',
      }),
    });
  });

  it('returns empty application state when no mutation has been confirmed', () => {
    expect(parseCombinedProposalApplications({})).toEqual({
      effectiveStrength: null,
      nutrition: null,
    });
  });

  it('fails closed for malformed Nutrition revision metadata', () => {
    const value = applications();
    value.applications.nutrition.appliedRevision = -1;
    expect(parseCombinedProposalApplications(value)).toBeUndefined();
  });

  it('fails closed for malformed Nutrition date or request type', () => {
    const invalidDate = applications();
    invalidDate.applications.nutrition.appliedAt = 'not-a-date';
    expect(parseCombinedProposalApplications(invalidDate)).toBeUndefined();

    const invalidType = applications();
    invalidType.applications.nutrition.requestType = 'nutrition_review';
    expect(parseCombinedProposalApplications(invalidType)).toBeUndefined();
  });
});
