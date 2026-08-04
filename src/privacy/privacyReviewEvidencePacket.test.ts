import { describe, expect, it } from 'vitest';

import {
  PRIVACY_REVIEW_EVIDENCE_ITEMS,
  evaluatePrivacyReviewEvidencePacket,
} from './privacyReviewEvidencePacket';

describe('privacy review evidence packet', () => {
  it('keeps every evidence domain not ready', () => {
    expect(PRIVACY_REVIEW_EVIDENCE_ITEMS.length).toBeGreaterThan(0);
    expect(
      PRIVACY_REVIEW_EVIDENCE_ITEMS.every(
        ({ reviewState }) => reviewState === 'not_ready',
      ),
    ).toBe(true);
  });

  it('uses unique domain identifiers', () => {
    const ids = PRIVACY_REVIEW_EVIDENCE_ITEMS.map(({ id }) => id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('covers the complete current P9 review boundary', () => {
    expect(PRIVACY_REVIEW_EVIDENCE_ITEMS.map(({ id }) => id).sort()).toEqual([
      'account_deletion_and_recovery',
      'analytics_consent_and_choice',
      'authentication_and_security',
      'data_access_and_export',
      'data_inventory_and_ownership',
      'offline_sync_and_conflicts',
      'product_audience_and_regional_scope',
      'provider_processing_and_regions',
      'purpose_and_minimization',
      'retention_and_exceptional_retention',
      'user_disclosures_and_controls',
    ]);
  });

  it('requires source evidence, open questions and forbidden conclusions', () => {
    for (const item of PRIVACY_REVIEW_EVIDENCE_ITEMS) {
      expect(item.purpose.trim().length).toBeGreaterThan(0);
      expect(item.sourceEvidence.length).toBeGreaterThan(0);
      expect(item.requiredStates.length).toBeGreaterThan(0);
      expect(item.unresolvedQuestions.length).toBeGreaterThan(0);
      expect(item.forbiddenConclusions.length).toBeGreaterThan(0);
    }
  });

  it('uses only repository-relative source references', () => {
    for (const reference of PRIVACY_REVIEW_EVIDENCE_ITEMS.flatMap(
      ({ sourceEvidence }) => sourceEvidence,
    )) {
      expect(reference).toMatch(/^(backend:)?(?:AGENTS\.md|PROJECT_LEARNINGS\.md|docs\/|src\/)/u);
      expect(reference).not.toMatch(/^https?:\/\//u);
    }
  });

  it('keeps provider processing dependent on exact environment evidence', () => {
    const provider = PRIVACY_REVIEW_EVIDENCE_ITEMS.find(
      ({ id }) => id === 'provider_processing_and_regions',
    );

    expect(provider?.requiredStates).toEqual(
      expect.arrayContaining([
        'environment_evidence_required',
        'operational_validation_required',
        'policy_decision_required',
      ]),
    );
    expect(provider?.forbiddenConclusions.join(' ')).toMatch(
      /generic provider documentation/iu,
    );
  });

  it('keeps analytics dependent on policy, provider and product decisions', () => {
    const analytics = PRIVACY_REVIEW_EVIDENCE_ITEMS.find(
      ({ id }) => id === 'analytics_consent_and_choice',
    );

    expect(analytics?.requiredStates).toEqual(
      expect.arrayContaining([
        'environment_evidence_required',
        'policy_decision_required',
        'product_integration_required',
      ]),
    );
    expect(analytics?.forbiddenConclusions).toEqual(
      expect.arrayContaining([
        'A synthetic grant authorizes collection.',
        'An empty production registry is an implemented consent experience.',
      ]),
    );
  });

  it('keeps access/export dependent on secure implementation evidence', () => {
    const accessExport = PRIVACY_REVIEW_EVIDENCE_ITEMS.find(
      ({ id }) => id === 'data_access_and_export',
    );

    expect(accessExport?.requiredStates).toEqual(
      expect.arrayContaining([
        'environment_evidence_required',
        'operational_validation_required',
        'product_integration_required',
        'policy_decision_required',
      ]),
    );
    expect(accessExport?.forbiddenConclusions.join(' ')).toMatch(
      /structural request parser/iu,
    );
  });

  it('does not treat source deletion work as production proof', () => {
    const deletion = PRIVACY_REVIEW_EVIDENCE_ITEMS.find(
      ({ id }) => id === 'account_deletion_and_recovery',
    );

    expect(deletion?.requiredStates).toContain('operational_validation_required');
    expect(deletion?.forbiddenConclusions).toContain(
      'Source completion proves production cleanup or provider deletion.',
    );
  });

  it('keeps public disclosure dependent on copy and accessibility review', () => {
    const disclosures = PRIVACY_REVIEW_EVIDENCE_ITEMS.find(
      ({ id }) => id === 'user_disclosures_and_controls',
    );

    expect(disclosures?.requiredStates).toEqual(
      expect.arrayContaining([
        'product_integration_required',
        'operational_validation_required',
        'policy_decision_required',
      ]),
    );
    expect(disclosures?.unresolvedQuestions.join(' ')).toMatch(
      /English and Russian/iu,
    );
  });

  it('always evaluates the evidence packet as not ready', () => {
    const evaluation = evaluatePrivacyReviewEvidencePacket();

    expect(evaluation.ready).toBe(false);
    expect(evaluation.domainIds).toEqual(
      PRIVACY_REVIEW_EVIDENCE_ITEMS.map(({ id }) => id),
    );
    expect(evaluation.issueCodes).toEqual([
      'environment_evidence_missing',
      'operational_validation_missing',
      'policy_decisions_missing',
      'product_integration_missing',
      'reviewer_signoff_missing',
    ]);
  });

  it('contains no legal approval or named provider claim', () => {
    const serialized = JSON.stringify(PRIVACY_REVIEW_EVIDENCE_ITEMS);

    expect(serialized).not.toMatch(
      /gdpr compliant|hipaa compliant|legally compliant|legal approval|approved by counsel/iu,
    );
    expect(serialized).not.toMatch(
      /amazon|aws|cloudflare|azure|openai|anthropic|google cloud/iu,
    );
  });
});
