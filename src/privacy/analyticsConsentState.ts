import { evaluateAnalyticsActivation } from './analyticsActivationContract';

export const ANALYTICS_CONSENT_STATE_SCHEMA_VERSION = 1 as const;

export type AnalyticsChoiceRequirement =
  | 'opt_in_required'
  | 'policy_decision_pending';

export type AnalyticsMeasurementPurpose = {
  id: string;
  version: number;
  choiceRequirement: AnalyticsChoiceRequirement;
  policyVersion: number;
  disclosureVersion: number;
  eventRegistryVersion: number;
};

export const ANALYTICS_MEASUREMENT_PURPOSES: readonly AnalyticsMeasurementPurpose[] =
  [];

export type AnalyticsConsentChoice = 'denied' | 'granted' | 'withdrawn';

export type AnalyticsConsentState = {
  schemaVersion: typeof ANALYTICS_CONSENT_STATE_SCHEMA_VERSION;
  purposeId: string;
  purposeVersion: number;
  policyVersion: number;
  disclosureVersion: number;
  eventRegistryVersion: number;
  choice: AnalyticsConsentChoice;
  recordedAt: string;
};

export type AnalyticsConsentIssueCode =
  | 'choice_missing'
  | 'choice_not_granted'
  | 'choice_policy_pending'
  | 'consent_state_invalid'
  | 'disclosure_version_mismatch'
  | 'event_registry_version_mismatch'
  | 'policy_version_mismatch'
  | 'purpose_not_registered'
  | 'purpose_version_mismatch';

export type AnalyticsConsentEvaluation = {
  satisfied: boolean;
  issueCodes: readonly AnalyticsConsentIssueCode[];
};

export type AnalyticsCollectionPermission = {
  allowed: false;
  issueCodes: readonly (
    | AnalyticsConsentIssueCode
    | 'analytics_activation_blocked'
  )[];
};

const PURPOSE_ID_PATTERN = /^[a-z][a-z0-9_]{2,63}$/u;
const CONSENT_STATE_KEYS = [
  'schemaVersion',
  'purposeId',
  'purposeVersion',
  'policyVersion',
  'disclosureVersion',
  'eventRegistryVersion',
  'choice',
  'recordedAt',
] as const;
const CONSENT_CHOICES: readonly AnalyticsConsentChoice[] = [
  'denied',
  'granted',
  'withdrawn',
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isPositiveInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value > 0;

const isIsoTimestamp = (value: unknown): value is string =>
  typeof value === 'string' &&
  !Number.isNaN(Date.parse(value)) &&
  new Date(value).toISOString() === value;

const hasExactKeys = (value: Record<string, unknown>): boolean => {
  const keys = Object.keys(value).sort();
  return (
    keys.length === CONSENT_STATE_KEYS.length &&
    keys.every((key, index) => key === [...CONSENT_STATE_KEYS].sort()[index])
  );
};

export const parseAnalyticsConsentState = (
  value: unknown,
): AnalyticsConsentState | null => {
  if (!isRecord(value) || !hasExactKeys(value)) return null;
  if (value.schemaVersion !== ANALYTICS_CONSENT_STATE_SCHEMA_VERSION) {
    return null;
  }
  if (
    typeof value.purposeId !== 'string' ||
    !PURPOSE_ID_PATTERN.test(value.purposeId)
  ) {
    return null;
  }
  if (
    !isPositiveInteger(value.purposeVersion) ||
    !isPositiveInteger(value.policyVersion) ||
    !isPositiveInteger(value.disclosureVersion) ||
    !isPositiveInteger(value.eventRegistryVersion)
  ) {
    return null;
  }
  if (
    typeof value.choice !== 'string' ||
    !CONSENT_CHOICES.includes(value.choice as AnalyticsConsentChoice) ||
    !isIsoTimestamp(value.recordedAt)
  ) {
    return null;
  }
  return value as AnalyticsConsentState;
};

export const createAnalyticsConsentState = (
  purpose: AnalyticsMeasurementPurpose,
  choice: AnalyticsConsentChoice,
  recordedAt: string,
): AnalyticsConsentState => {
  const state: AnalyticsConsentState = {
    schemaVersion: ANALYTICS_CONSENT_STATE_SCHEMA_VERSION,
    purposeId: purpose.id,
    purposeVersion: purpose.version,
    policyVersion: purpose.policyVersion,
    disclosureVersion: purpose.disclosureVersion,
    eventRegistryVersion: purpose.eventRegistryVersion,
    choice,
    recordedAt,
  };
  if (!parseAnalyticsConsentState(state)) {
    throw new Error('Analytics consent state is invalid');
  }
  return state;
};

export const evaluateAnalyticsConsentState = (
  purposeId: string,
  state: unknown,
  purposes: readonly AnalyticsMeasurementPurpose[] =
    ANALYTICS_MEASUREMENT_PURPOSES,
): AnalyticsConsentEvaluation => {
  const purpose = purposes.find((entry) => entry.id === purposeId);
  if (!purpose) {
    return { satisfied: false, issueCodes: ['purpose_not_registered'] };
  }
  if (purpose.choiceRequirement === 'policy_decision_pending') {
    return { satisfied: false, issueCodes: ['choice_policy_pending'] };
  }
  if (state === null || state === undefined) {
    return { satisfied: false, issueCodes: ['choice_missing'] };
  }

  const parsed = parseAnalyticsConsentState(state);
  if (!parsed || parsed.purposeId !== purpose.id) {
    return { satisfied: false, issueCodes: ['consent_state_invalid'] };
  }

  const issues = new Set<AnalyticsConsentIssueCode>();
  if (parsed.purposeVersion !== purpose.version) {
    issues.add('purpose_version_mismatch');
  }
  if (parsed.policyVersion !== purpose.policyVersion) {
    issues.add('policy_version_mismatch');
  }
  if (parsed.disclosureVersion !== purpose.disclosureVersion) {
    issues.add('disclosure_version_mismatch');
  }
  if (parsed.eventRegistryVersion !== purpose.eventRegistryVersion) {
    issues.add('event_registry_version_mismatch');
  }
  if (parsed.choice !== 'granted') issues.add('choice_not_granted');

  return {
    satisfied: issues.size === 0,
    issueCodes: [...issues].sort(),
  };
};

export const evaluateAnalyticsCollectionPermission = (
  purposeId: string,
  state: unknown,
  purposes: readonly AnalyticsMeasurementPurpose[] =
    ANALYTICS_MEASUREMENT_PURPOSES,
): AnalyticsCollectionPermission => {
  const consent = evaluateAnalyticsConsentState(purposeId, state, purposes);
  const activation = evaluateAnalyticsActivation();
  return {
    allowed: false,
    issueCodes: [
      ...consent.issueCodes,
      ...(activation.allowed ? [] : ['analytics_activation_blocked' as const]),
    ].sort(),
  };
};
