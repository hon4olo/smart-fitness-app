import type { AnalyticsSurfaceId } from './analyticsActivationContract';

export const ANALYTICS_EVENT_REGISTRY_SCHEMA_VERSION = 1 as const;

export const ANALYTICS_ALLOWED_DATA_CLASSES = [
  'aggregate_product_state',
  'bounded_failure_category',
  'coarse_performance_bucket',
  'release_metadata',
] as const;

export type AnalyticsAllowedDataClass =
  (typeof ANALYTICS_ALLOWED_DATA_CLASSES)[number];

export type AnalyticsEventPropertyDefinition = {
  name: string;
  kind: 'boolean' | 'bounded_enum' | 'bounded_integer';
  required: boolean;
  dataClass: AnalyticsAllowedDataClass;
  enumValues?: readonly string[];
  minimum?: number;
  maximum?: number;
};

export type AnalyticsEventDefinition = {
  name: string;
  version: number;
  surface: AnalyticsSurfaceId;
  purposeId: string;
  owner: string;
  properties: readonly AnalyticsEventPropertyDefinition[];
};

export const ANALYTICS_EVENT_REGISTRY: readonly AnalyticsEventDefinition[] = [];

export type AnalyticsEventCandidate = {
  name: string;
  version: number;
  properties: Readonly<Record<string, unknown>>;
};

export type AnalyticsEventEvaluationIssueCode =
  | 'event_not_registered'
  | 'event_name_invalid'
  | 'event_version_invalid'
  | 'property_missing'
  | 'property_not_registered'
  | 'property_type_invalid'
  | 'property_value_out_of_bounds';

export type AnalyticsEventEvaluation = {
  accepted: boolean;
  issueCodes: readonly AnalyticsEventEvaluationIssueCode[];
};

export type AnalyticsEventRegistryIssueCode =
  | 'duplicate_event'
  | 'duplicate_property'
  | 'event_name_invalid'
  | 'event_version_invalid'
  | 'owner_missing'
  | 'property_bounds_invalid'
  | 'property_enum_invalid'
  | 'property_name_invalid'
  | 'purpose_missing';

const EVENT_NAME_PATTERN = /^[a-z][a-z0-9_]{2,63}$/u;
const PROPERTY_NAME_PATTERN = /^[a-z][a-z0-9_]{1,47}$/u;
const MAX_EVENT_PROPERTIES = 24;
const MAX_ENUM_VALUES = 32;

const eventKey = (event: Pick<AnalyticsEventDefinition, 'name' | 'version'>) =>
  `${event.name}@${event.version}`;

const isValidInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value);

const evaluateProperty = (
  definition: AnalyticsEventPropertyDefinition,
  value: unknown,
): AnalyticsEventEvaluationIssueCode | null => {
  if (definition.kind === 'boolean') {
    return typeof value === 'boolean' ? null : 'property_type_invalid';
  }

  if (definition.kind === 'bounded_enum') {
    if (typeof value !== 'string') return 'property_type_invalid';
    return definition.enumValues?.includes(value)
      ? null
      : 'property_value_out_of_bounds';
  }

  if (!isValidInteger(value)) return 'property_type_invalid';
  if (
    definition.minimum === undefined ||
    definition.maximum === undefined ||
    value < definition.minimum ||
    value > definition.maximum
  ) {
    return 'property_value_out_of_bounds';
  }
  return null;
};

export const reviewAnalyticsEventRegistry = (
  registry: readonly AnalyticsEventDefinition[],
): readonly AnalyticsEventRegistryIssueCode[] => {
  const issues = new Set<AnalyticsEventRegistryIssueCode>();
  const seenEvents = new Set<string>();

  for (const event of registry) {
    const key = eventKey(event);
    if (seenEvents.has(key)) issues.add('duplicate_event');
    seenEvents.add(key);

    if (!EVENT_NAME_PATTERN.test(event.name)) issues.add('event_name_invalid');
    if (!Number.isSafeInteger(event.version) || event.version < 1) {
      issues.add('event_version_invalid');
    }
    if (event.purposeId.trim() === '') issues.add('purpose_missing');
    if (event.owner.trim() === '') issues.add('owner_missing');
    if (event.properties.length > MAX_EVENT_PROPERTIES) {
      issues.add('property_bounds_invalid');
    }

    const seenProperties = new Set<string>();
    for (const property of event.properties) {
      if (seenProperties.has(property.name)) issues.add('duplicate_property');
      seenProperties.add(property.name);

      if (!PROPERTY_NAME_PATTERN.test(property.name)) {
        issues.add('property_name_invalid');
      }
      if (property.kind === 'bounded_enum') {
        const values = property.enumValues ?? [];
        if (
          values.length === 0 ||
          values.length > MAX_ENUM_VALUES ||
          new Set(values).size !== values.length ||
          values.some((value) => value.trim() === '')
        ) {
          issues.add('property_enum_invalid');
        }
      }
      if (property.kind === 'bounded_integer') {
        if (
          !isValidInteger(property.minimum) ||
          !isValidInteger(property.maximum) ||
          property.minimum > property.maximum
        ) {
          issues.add('property_bounds_invalid');
        }
      }
    }
  }

  return [...issues].sort();
};

export const evaluateAnalyticsEventCandidate = (
  candidate: AnalyticsEventCandidate,
  registry: readonly AnalyticsEventDefinition[] = ANALYTICS_EVENT_REGISTRY,
): AnalyticsEventEvaluation => {
  const issues = new Set<AnalyticsEventEvaluationIssueCode>();
  if (!EVENT_NAME_PATTERN.test(candidate.name)) issues.add('event_name_invalid');
  if (!Number.isSafeInteger(candidate.version) || candidate.version < 1) {
    issues.add('event_version_invalid');
  }

  const definition = registry.find(
    (event) =>
      event.name === candidate.name && event.version === candidate.version,
  );
  if (!definition) {
    issues.add('event_not_registered');
    return { accepted: false, issueCodes: [...issues].sort() };
  }

  const properties = new Map(
    definition.properties.map((property) => [property.name, property]),
  );
  for (const property of definition.properties) {
    if (property.required && !(property.name in candidate.properties)) {
      issues.add('property_missing');
    }
  }
  for (const [name, value] of Object.entries(candidate.properties)) {
    const property = properties.get(name);
    if (!property) {
      issues.add('property_not_registered');
      continue;
    }
    const issue = evaluateProperty(property, value);
    if (issue) issues.add(issue);
  }

  return {
    accepted: issues.size === 0,
    issueCodes: [...issues].sort(),
  };
};
