import { describe, expect, it } from 'vitest';

import {
  RETENTION_DISCLOSURE_SURFACES,
  evaluateRetentionDisclosurePublication,
} from './retentionDisclosureContract';

describe('retention disclosure contract', () => {
  it('keeps every disclosure surface blocked', () => {
    expect(RETENTION_DISCLOSURE_SURFACES.length).toBeGreaterThan(0);
    expect(
      RETENTION_DISCLOSURE_SURFACES.every(
        ({ publicationState }) => publicationState === 'blocked',
      ),
    ).toBe(true);
  });

  it('uses unique surface identifiers', () => {
    const ids = RETENTION_DISCLOSURE_SURFACES.map(({ id }) => id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('requires every surface to state source and unresolved evidence', () => {
    for (const surface of RETENTION_DISCLOSURE_SURFACES) {
      expect(surface.purpose.trim().length).toBeGreaterThan(0);
      expect(surface.sourceBoundary.length).toBeGreaterThan(0);
      expect(surface.unresolvedEvidence.length).toBeGreaterThan(0);
    }
  });

  it('uses zero days only for source-zero retention', () => {
    for (const { evidence } of RETENTION_DISCLOSURE_SURFACES) {
      if (evidence.kind === 'source_zero') {
        expect(evidence.maximumDays).toBe(0);
      } else {
        expect(evidence.maximumDays).toBeNull();
      }
    }
  });

  it('does not invent exact maximum days for provider or lifecycle evidence', () => {
    const affected = RETENTION_DISCLOSURE_SURFACES.filter(({ evidence }) =>
      ['source_account_lifecycle', 'source_record_expiry', 'unset_blocker'].includes(
        evidence.kind,
      ),
    );

    expect(affected.length).toBeGreaterThan(0);
    expect(affected.every(({ evidence }) => evidence.maximumDays === null)).toBe(
      true,
    );
  });

  it('keeps provider-bound and infrastructure surfaces unresolved', () => {
    const unresolvedIds = RETENTION_DISCLOSURE_SURFACES.filter(
      ({ evidence }) => evidence.kind === 'unset_blocker',
    )
      .map(({ id }) => id)
      .sort();

    expect(unresolvedIds).toEqual([
      'application_and_reverse_proxy_logs',
      'database_backups',
      'email_delivery_metadata',
      'food_provider_cache',
      'model_moderation_classifier_and_ocr_requests',
      'review_exports_and_incident_copies',
    ]);
  });

  it('does not treat record expiry as deployed provider deletion proof', () => {
    const recordExpirySurfaces = RETENTION_DISCLOSURE_SURFACES.filter(
      ({ evidence }) => evidence.kind === 'source_record_expiry',
    );

    expect(recordExpirySurfaces.map(({ id }) => id).sort()).toEqual([
      'account_deletion_receipts',
      'private_media_and_delivery',
    ]);
    for (const surface of recordExpirySurfaces) {
      expect(surface.publicationState).toBe('blocked');
      expect(surface.unresolvedEvidence.join(' ')).toMatch(
        /deploy|production|provider|public/iu,
      );
    }
  });

  it('records support diagnostics as zero-retention source state only', () => {
    const support = RETENTION_DISCLOSURE_SURFACES.find(
      ({ id }) => id === 'support_diagnostics',
    );

    expect(support).toMatchObject({
      evidence: { kind: 'source_zero', maximumDays: 0 },
      accountDeletion: 'account_scoped_cleanup_required',
      exceptionCategory: 'none',
      publicationState: 'blocked',
    });
    expect(support?.sourceBoundary.join(' ')).toMatch(/no background upload/iu);
  });

  it('requires bounded exception explanations for backups and incident copies', () => {
    const evaluation = evaluateRetentionDisclosurePublication();

    expect(evaluation.exceptionalSurfaceIds).toEqual(
      expect.arrayContaining([
        'database_backups',
        'review_exports_and_incident_copies',
      ]),
    );
    expect(evaluation.issueCodes).toContain('exception_explanation_unreviewed');
  });

  it('keeps publication blocked by policy, product and evidence gaps', () => {
    const evaluation = evaluateRetentionDisclosurePublication();

    expect(evaluation.allowed).toBe(false);
    expect(evaluation.issueCodes).toEqual(
      expect.arrayContaining([
        'policy_review_missing',
        'localization_review_missing',
        'accessibility_review_missing',
        'product_surface_not_implemented',
        'exact_environment_evidence_missing',
        'unresolved_retention_evidence',
      ]),
    );
    expect(evaluation.unresolvedSurfaceIds.length).toBe(
      RETENTION_DISCLOSURE_SURFACES.length,
    );
  });

  it('contains no selected provider names or fake regions', () => {
    const serialized = JSON.stringify(RETENTION_DISCLOSURE_SURFACES);

    expect(serialized).not.toMatch(
      /amazon|aws|cloudflare|google cloud|azure|openai|anthropic|eu-west|us-east/iu,
    );
  });
});
