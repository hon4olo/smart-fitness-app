export const ANALYTICS_ACTIVATION_CONTRACT_SCHEMA_VERSION = 1 as const;

export type AnalyticsActivationPrerequisiteId =
  | 'purpose_approved'
  | 'event_schema_approved'
  | 'choice_or_legal_basis_approved'
  | 'withdrawal_flow_implemented'
  | 'data_minimization_reviewed'
  | 'access_controls_defined'
  | 'retention_and_deletion_defined'
  | 'provider_and_region_approved'
  | 'account_deletion_integration_proven'
  | 'security_and_incident_controls_approved'
  | 'user_disclosure_reviewed';

export type AnalyticsActivationPrerequisite = {
  id: AnalyticsActivationPrerequisiteId;
  status: 'blocked';
  requirement: string;
};

export type AnalyticsSurfaceId =
  | 'product_usage'
  | 'crash_diagnostics'
  | 'performance_metrics'
  | 'marketing_attribution'
  | 'advertising';

export type AnalyticsSurface = {
  id: AnalyticsSurfaceId;
  state: 'disabled';
  provider: null;
  collection: 'none';
  upload: 'none';
  retention: 'zero';
  userChoice: 'policy_review_required';
  purpose: string;
};

export const ANALYTICS_FORBIDDEN_DATA_CLASSES = [
  'access_or_refresh_tokens',
  'passwords_or_password_hashes',
  'account_deletion_status_secrets',
  'authorization_or_cookie_headers',
  'email_or_direct_contact_details',
  'account_session_or_device_identifiers',
  'advertising_or_cross_app_identifiers',
  'raw_health_fitness_or_recovery_values',
  'raw_workout_or_nutrition_payloads',
  'nutrition_free_text_or_search_text',
  'sync_payloads_conflicts_or_idempotency_keys',
  'private_media_object_keys_or_provider_payloads',
  'precise_location',
  'hidden_model_reasoning',
  'unbounded_free_text',
] as const;

export const ANALYTICS_ACTIVATION_PREREQUISITES: readonly AnalyticsActivationPrerequisite[] = [
  {
    id: 'purpose_approved',
    status: 'blocked',
    requirement:
      'Each proposed measurement purpose must be named, necessary and approved before collection.',
  },
  {
    id: 'event_schema_approved',
    status: 'blocked',
    requirement:
      'Every event and property must have a versioned allowlist, owner and minimization review.',
  },
  {
    id: 'choice_or_legal_basis_approved',
    status: 'blocked',
    requirement:
      'Policy review must determine and document the required user choice or other lawful basis for each purpose and region.',
  },
  {
    id: 'withdrawal_flow_implemented',
    status: 'blocked',
    requirement:
      'Where user choice applies, refusal and later withdrawal must stop future collection without degrading unrelated product access.',
  },
  {
    id: 'data_minimization_reviewed',
    status: 'blocked',
    requirement:
      'Forbidden data classes, free text and raw fitness or nutrition payloads must remain excluded.',
  },
  {
    id: 'access_controls_defined',
    status: 'blocked',
    requirement:
      'Operator roles, support access, auditability and credential ownership must be defined.',
  },
  {
    id: 'retention_and_deletion_defined',
    status: 'blocked',
    requirement:
      'Maximum lifetime, expiry, deletion, failure monitoring and evidence must be defined.',
  },
  {
    id: 'provider_and_region_approved',
    status: 'blocked',
    requirement:
      'An exact provider, region, subprocessors and training or reuse policy must be reviewed.',
  },
  {
    id: 'account_deletion_integration_proven',
    status: 'blocked',
    requirement:
      'Account-scoped identifiers and records must have tested deletion or bounded exceptional retention.',
  },
  {
    id: 'security_and_incident_controls_approved',
    status: 'blocked',
    requirement:
      'Transport, storage, secret handling, incident scope and bounded incident-copy expiry must be approved.',
  },
  {
    id: 'user_disclosure_reviewed',
    status: 'blocked',
    requirement:
      'Accurate user-facing purpose, retention, sharing and control disclosures must be reviewed before activation.',
  },
];

export const ANALYTICS_SURFACES: readonly AnalyticsSurface[] = [
  {
    id: 'product_usage',
    state: 'disabled',
    provider: null,
    collection: 'none',
    upload: 'none',
    retention: 'zero',
    userChoice: 'policy_review_required',
    purpose: 'No approved product-usage measurement purpose exists.',
  },
  {
    id: 'crash_diagnostics',
    state: 'disabled',
    provider: null,
    collection: 'none',
    upload: 'none',
    retention: 'zero',
    userChoice: 'policy_review_required',
    purpose:
      'No crash-reporting provider, event schema or retention contract is approved.',
  },
  {
    id: 'performance_metrics',
    state: 'disabled',
    provider: null,
    collection: 'none',
    upload: 'none',
    retention: 'zero',
    userChoice: 'policy_review_required',
    purpose:
      'Existing local diagnostics remain local aggregate state and are not telemetry.',
  },
  {
    id: 'marketing_attribution',
    state: 'disabled',
    provider: null,
    collection: 'none',
    upload: 'none',
    retention: 'zero',
    userChoice: 'policy_review_required',
    purpose: 'No attribution purpose or provider is approved.',
  },
  {
    id: 'advertising',
    state: 'disabled',
    provider: null,
    collection: 'none',
    upload: 'none',
    retention: 'zero',
    userChoice: 'policy_review_required',
    purpose:
      'Advertising, cross-app tracking and advertising identifiers are not approved product capabilities.',
  },
];

export type AnalyticsActivationEvaluation = {
  schemaVersion: typeof ANALYTICS_ACTIVATION_CONTRACT_SCHEMA_VERSION;
  allowed: false;
  blockerIds: readonly AnalyticsActivationPrerequisiteId[];
};

export const evaluateAnalyticsActivation = (): AnalyticsActivationEvaluation => ({
  schemaVersion: ANALYTICS_ACTIVATION_CONTRACT_SCHEMA_VERSION,
  allowed: false,
  blockerIds: ANALYTICS_ACTIVATION_PREREQUISITES.map(({ id }) => id),
});
