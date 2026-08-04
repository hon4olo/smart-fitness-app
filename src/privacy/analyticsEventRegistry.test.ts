import { describe, expect, it } from 'vitest';

import {
  ANALYTICS_EVENT_REGISTRY,
  ANALYTICS_EVENT_REGISTRY_SCHEMA_VERSION,
  evaluateAnalyticsEventCandidate,
  reviewAnalyticsEventRegistry,
  type AnalyticsEventDefinition,
} from './analyticsEventRegistry';

const syntheticRegistry: readonly AnalyticsEventDefinition[] = [
  {
    name: 'screen_summary_viewed',
    version: 1,
    surface: 'product_usage',
    purposeId: 'synthetic_test_only',
    owner: 'privacy-review',
    properties: [
      {
        name: 'source',
        kind: 'bounded_enum',
        required: true,
        dataClass: 'aggregate_product_state',
        enumValues: ['home', 'workouts'],
      },
      {
        name: 'item_count_bucket',
        kind: 'bounded_integer',
        required: true,
        dataClass: 'aggregate_product_state',
        minimum: 0,
        maximum: 5,
      },
      {
        name: 'cached',
        kind: 'boolean',
        required: false,
        dataClass: 'coarse_performance_bucket',
      },
    ],
  },
];

describe('analytics event registry', () => {
  it('keeps the production registry empty and collection fail closed', () => {
    expect(ANALYTICS_EVENT_REGISTRY_SCHEMA_VERSION).toBe(1);
    expect(ANALYTICS_EVENT_REGISTRY).toEqual([]);
    expect(reviewAnalyticsEventRegistry(ANALYTICS_EVENT_REGISTRY)).toEqual([]);

    expect(
      evaluateAnalyticsEventCandidate({
        name: 'screen_summary_viewed',
        version: 1,
        properties: {},
      }),
    ).toEqual({
      accepted: false,
      issueCodes: ['event_not_registered'],
    });
  });

  it('accepts only an exact synthetic allowlisted event shape', () => {
    expect(
      evaluateAnalyticsEventCandidate(
        {
          name: 'screen_summary_viewed',
          version: 1,
          properties: {
            source: 'home',
            item_count_bucket: 2,
            cached: false,
          },
        },
        syntheticRegistry,
      ),
    ).toEqual({ accepted: true, issueCodes: [] });
  });

  it('rejects unknown, missing, mistyped and out-of-range properties', () => {
    expect(
      evaluateAnalyticsEventCandidate(
        {
          name: 'screen_summary_viewed',
          version: 1,
          properties: {
            source: 'profile',
            item_count_bucket: 8,
            cached: 'false',
            raw_payload: { workouts: [] },
          },
        },
        syntheticRegistry,
      ),
    ).toEqual({
      accepted: false,
      issueCodes: [
        'property_not_registered',
        'property_type_invalid',
        'property_value_out_of_bounds',
      ],
    });

    expect(
      evaluateAnalyticsEventCandidate(
        {
          name: 'screen_summary_viewed',
          version: 1,
          properties: { cached: true },
        },
        syntheticRegistry,
      ),
    ).toEqual({
      accepted: false,
      issueCodes: ['property_missing'],
    });
  });

  it('rejects malformed or unregistered event identities', () => {
    expect(
      evaluateAnalyticsEventCandidate(
        { name: 'Screen Viewed', version: 0, properties: {} },
        syntheticRegistry,
      ),
    ).toEqual({
      accepted: false,
      issueCodes: [
        'event_name_invalid',
        'event_not_registered',
        'event_version_invalid',
      ],
    });

    expect(
      evaluateAnalyticsEventCandidate(
        {
          name: 'screen_summary_viewed',
          version: 2,
          properties: {},
        },
        syntheticRegistry,
      ),
    ).toEqual({
      accepted: false,
      issueCodes: ['event_not_registered'],
    });
  });

  it('reports registry definition defects before any event can be approved', () => {
    const invalidRegistry = [
      {
        name: 'Bad Event',
        version: 0,
        surface: 'product_usage',
        purposeId: '',
        owner: '',
        properties: [
          {
            name: 'x',
            kind: 'bounded_enum',
            required: true,
            dataClass: 'aggregate_product_state',
            enumValues: ['same', 'same'],
          },
          {
            name: 'x',
            kind: 'bounded_integer',
            required: false,
            dataClass: 'coarse_performance_bucket',
            minimum: 4,
            maximum: 2,
          },
        ],
      },
      {
        name: 'Bad Event',
        version: 0,
        surface: 'product_usage',
        purposeId: '',
        owner: '',
        properties: [],
      },
    ] as unknown as readonly AnalyticsEventDefinition[];

    expect(reviewAnalyticsEventRegistry(invalidRegistry)).toEqual([
      'duplicate_event',
      'duplicate_property',
      'event_name_invalid',
      'event_version_invalid',
      'owner_missing',
      'property_bounds_invalid',
      'property_enum_invalid',
      'property_name_invalid',
      'purpose_missing',
    ]);
  });
});
