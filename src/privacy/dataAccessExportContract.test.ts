import { describe, expect, it } from 'vitest';

import {
  DATA_ACCESS_EXPORT_CONTRACT_SCHEMA_VERSION,
  DATA_ACCESS_EXPORT_FORBIDDEN_FIELDS,
  DATA_ACCESS_EXPORT_SURFACES,
  evaluateDataAccessExport,
  parseDataAccessExportRequest,
  type DataAccessExportRequest,
} from './dataAccessExportContract';

const validRequest: DataAccessExportRequest = {
  schemaVersion: DATA_ACCESS_EXPORT_CONTRACT_SCHEMA_VERSION,
  format: 'json_v1',
  surfaceIds: [
    'profile_and_account_metadata',
    'workouts_programs_and_exercises',
  ],
};

describe('data access export contract', () => {
  it('keeps every declared surface blocked', () => {
    expect(DATA_ACCESS_EXPORT_SURFACES.length).toBeGreaterThan(0);
    expect(DATA_ACCESS_EXPORT_SURFACES.every(({ status }) => status === 'blocked')).toBe(
      true,
    );
  });

  it('uses unique surface identifiers', () => {
    const ids = DATA_ACCESS_EXPORT_SURFACES.map(({ id }) => id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('requires candidate exports to name data and exclusions', () => {
    const candidates = DATA_ACCESS_EXPORT_SURFACES.filter(
      ({ disposition }) => disposition === 'candidate_export',
    );

    expect(candidates.length).toBeGreaterThan(0);
    for (const surface of candidates) {
      expect(surface.candidateDataClasses.length).toBeGreaterThan(0);
      expect(surface.excludedDataClasses.length).toBeGreaterThan(0);
      expect(surface.purpose.trim().length).toBeGreaterThan(0);
    }
  });

  it('keeps secret surfaces completely excluded', () => {
    const secretSurfaces = DATA_ACCESS_EXPORT_SURFACES.filter(
      ({ disposition }) => disposition === 'excluded_secret',
    );

    expect(secretSurfaces.map(({ id }) => id).sort()).toEqual([
      'account_deletion_recovery_secrets',
      'authentication_and_security_secrets',
    ]);
    for (const surface of secretSurfaces) {
      expect(surface.candidateDataClasses).toEqual([]);
      expect(surface.excludedDataClasses.length).toBeGreaterThan(0);
    }
  });

  it('records high-risk fields that must never be exported', () => {
    expect(DATA_ACCESS_EXPORT_FORBIDDEN_FIELDS).toEqual(
      expect.arrayContaining([
        'access_tokens',
        'refresh_tokens',
        'passwords_or_password_hashes',
        'account_deletion_status_secrets',
        'provider_api_keys_or_credentials',
        'private_object_storage_keys',
        'full_idempotency_keys',
        'hidden_model_reasoning',
      ]),
    );
    expect(new Set(DATA_ACCESS_EXPORT_FORBIDDEN_FIELDS).size).toBe(
      DATA_ACCESS_EXPORT_FORBIDDEN_FIELDS.length,
    );
  });

  it('strictly parses a bounded structural request', () => {
    expect(parseDataAccessExportRequest(validRequest)).toEqual(validRequest);
  });

  it.each([
    null,
    [],
    {},
    {
      ...validRequest,
      schemaVersion: 2,
    },
    {
      ...validRequest,
      format: 'csv',
    },
    {
      ...validRequest,
      surfaceIds: [],
    },
    {
      ...validRequest,
      surfaceIds: ['unknown_surface'],
    },
    {
      ...validRequest,
      surfaceIds: [
        'profile_and_account_metadata',
        'profile_and_account_metadata',
      ],
    },
    {
      ...validRequest,
      accountId: 'must-not-be-accepted',
    },
  ])('rejects malformed or over-broad request input %#', (candidate) => {
    expect(parseDataAccessExportRequest(candidate)).toBeNull();
  });

  it('returns only request_invalid for malformed input', () => {
    expect(evaluateDataAccessExport({})).toEqual({
      allowed: false,
      selectedSurfaceIds: [],
      issueCodes: ['request_invalid'],
    });
  });

  it('keeps a valid candidate blocked by all unresolved controls', () => {
    const evaluation = evaluateDataAccessExport(validRequest);

    expect(evaluation.allowed).toBe(false);
    expect(evaluation.selectedSurfaceIds).toEqual(validRequest.surfaceIds);
    expect(evaluation.issueCodes).toEqual(
      expect.arrayContaining([
        'identity_reverification_not_defined',
        'backend_export_route_not_implemented',
        'mobile_local_transform_not_implemented',
        'source_inventory_mapping_incomplete',
        'redaction_and_minimization_not_implemented',
        'external_provider_disposition_unresolved',
        'exceptional_retention_notice_unreviewed',
        'delivery_expiry_and_revocation_not_implemented',
        'rate_limit_and_abuse_controls_not_implemented',
        'audit_and_failure_monitoring_not_implemented',
        'policy_disclosure_not_reviewed',
      ]),
    );
    expect(evaluation.issueCodes).not.toContain('request_invalid');
  });

  it('does not mutate a validated request while evaluating it', () => {
    const request: DataAccessExportRequest = {
      ...validRequest,
      surfaceIds: [...validRequest.surfaceIds],
    };
    const before = JSON.stringify(request);

    evaluateDataAccessExport(request);

    expect(JSON.stringify(request)).toBe(before);
  });
});
