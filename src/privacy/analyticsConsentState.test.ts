import { describe, expect, it } from 'vitest';

import {
  ANALYTICS_CONSENT_STATE_SCHEMA_VERSION,
  ANALYTICS_MEASUREMENT_PURPOSES,
  createAnalyticsConsentState,
  evaluateAnalyticsCollectionPermission,
  evaluateAnalyticsConsentState,
  parseAnalyticsConsentState,
  type AnalyticsMeasurementPurpose,
} from './analyticsConsentState';

const syntheticPurpose: AnalyticsMeasurementPurpose = {
  id: 'product_quality_measurement',
  version: 1,
  choiceRequirement: 'opt_in_required',
  policyVersion: 2,
  disclosureVersion: 3,
  eventRegistryVersion: 1,
};

const recordedAt = '2026-08-04T22:00:00.000Z';

describe('analytics consent state', () => {
  it('keeps the production purpose registry empty and permission blocked', () => {
    expect(ANALYTICS_CONSENT_STATE_SCHEMA_VERSION).toBe(1);
    expect(ANALYTICS_MEASUREMENT_PURPOSES).toEqual([]);
    expect(evaluateAnalyticsConsentState('unknown_purpose', null)).toEqual({
      satisfied: false,
      issueCodes: ['purpose_not_registered'],
    });
    expect(
      evaluateAnalyticsCollectionPermission('unknown_purpose', null),
    ).toEqual({
      allowed: false,
      issueCodes: [
        'analytics_activation_blocked',
        'purpose_not_registered',
      ],
    });
  });

  it('strictly parses an exact versioned consent state', () => {
    const state = createAnalyticsConsentState(
      syntheticPurpose,
      'granted',
      recordedAt,
    );

    expect(parseAnalyticsConsentState(state)).toEqual(state);
    expect(
      parseAnalyticsConsentState({ ...state, unknownField: true }),
    ).toBeNull();
    expect(
      parseAnalyticsConsentState({ ...state, recordedAt: 'not-a-date' }),
    ).toBeNull();
    expect(
      parseAnalyticsConsentState({ ...state, choice: 'accepted' }),
    ).toBeNull();
    expect(
      parseAnalyticsConsentState({ ...state, schemaVersion: 2 }),
    ).toBeNull();
  });

  it('satisfies only an exact synthetic opt-in decision', () => {
    const state = createAnalyticsConsentState(
      syntheticPurpose,
      'granted',
      recordedAt,
    );

    expect(
      evaluateAnalyticsConsentState(
        syntheticPurpose.id,
        state,
        [syntheticPurpose],
      ),
    ).toEqual({ satisfied: true, issueCodes: [] });

    expect(
      evaluateAnalyticsCollectionPermission(
        syntheticPurpose.id,
        state,
        [syntheticPurpose],
      ),
    ).toEqual({
      allowed: false,
      issueCodes: ['analytics_activation_blocked'],
    });
  });

  it('treats refusal and withdrawal as not granted', () => {
    for (const choice of ['denied', 'withdrawn'] as const) {
      const state = createAnalyticsConsentState(
        syntheticPurpose,
        choice,
        recordedAt,
      );
      expect(
        evaluateAnalyticsConsentState(
          syntheticPurpose.id,
          state,
          [syntheticPurpose],
        ),
      ).toEqual({
        satisfied: false,
        issueCodes: ['choice_not_granted'],
      });
    }
  });

  it('invalidates consent when any reviewed version changes', () => {
    const state = createAnalyticsConsentState(
      syntheticPurpose,
      'granted',
      recordedAt,
    );
    const changedPurpose: AnalyticsMeasurementPurpose = {
      ...syntheticPurpose,
      version: 2,
      policyVersion: 3,
      disclosureVersion: 4,
      eventRegistryVersion: 2,
    };

    expect(
      evaluateAnalyticsConsentState(
        changedPurpose.id,
        state,
        [changedPurpose],
      ),
    ).toEqual({
      satisfied: false,
      issueCodes: [
        'disclosure_version_mismatch',
        'event_registry_version_mismatch',
        'policy_version_mismatch',
        'purpose_version_mismatch',
      ],
    });
  });

  it('blocks purposes whose policy choice is not decided', () => {
    const pendingPurpose: AnalyticsMeasurementPurpose = {
      ...syntheticPurpose,
      choiceRequirement: 'policy_decision_pending',
    };

    expect(
      evaluateAnalyticsConsentState(
        pendingPurpose.id,
        createAnalyticsConsentState(
          pendingPurpose,
          'granted',
          recordedAt,
        ),
        [pendingPurpose],
      ),
    ).toEqual({
      satisfied: false,
      issueCodes: ['choice_policy_pending'],
    });
  });

  it('rejects missing or mismatched purpose state', () => {
    expect(
      evaluateAnalyticsConsentState(
        syntheticPurpose.id,
        null,
        [syntheticPurpose],
      ),
    ).toEqual({ satisfied: false, issueCodes: ['choice_missing'] });

    const otherPurpose = {
      ...syntheticPurpose,
      id: 'other_quality_measurement',
    };
    expect(
      evaluateAnalyticsConsentState(
        syntheticPurpose.id,
        createAnalyticsConsentState(
          otherPurpose,
          'granted',
          recordedAt,
        ),
        [syntheticPurpose],
      ),
    ).toEqual({
      satisfied: false,
      issueCodes: ['consent_state_invalid'],
    });
  });
});
