export const DATA_ACCESS_EXPORT_CONTRACT_SCHEMA_VERSION = 1 as const;

export type DataAccessExportSurfaceId =
  | 'profile_and_account_metadata'
  | 'workouts_programs_and_exercises'
  | 'nutrition_and_meal_data'
  | 'progress_measurements_and_weight'
  | 'limitations_recovery_and_safety_context'
  | 'coach_reviews_proposals_and_run_history'
  | 'social_relationships_and_account_activity'
  | 'managed_media_metadata'
  | 'sync_conflict_and_recovery_metadata'
  | 'local_diagnostics'
  | 'authentication_and_security_secrets'
  | 'account_deletion_recovery_secrets'
  | 'provider_and_operational_copies';

export type DataAccessExportSourceAuthority =
  | 'backend'
  | 'cross_surface'
  | 'external_provider'
  | 'mobile';

export type DataAccessExportDisposition =
  | 'candidate_export'
  | 'excluded_secret'
  | 'notice_only';

export type DataAccessExportSurface = {
  id: DataAccessExportSurfaceId;
  sourceAuthority: DataAccessExportSourceAuthority;
  disposition: DataAccessExportDisposition;
  status: 'blocked';
  purpose: string;
  candidateDataClasses: readonly string[];
  excludedDataClasses: readonly string[];
};

export const DATA_ACCESS_EXPORT_FORBIDDEN_FIELDS = [
  'access_tokens',
  'refresh_tokens',
  'passwords_or_password_hashes',
  'account_deletion_status_secrets',
  'authorization_or_cookie_headers',
  'provider_api_keys_or_credentials',
  'private_object_storage_keys',
  'full_idempotency_keys',
  'hidden_model_reasoning',
  'raw_internal_provider_payloads',
  'security_control_material',
] as const;

export const DATA_ACCESS_EXPORT_SURFACES: readonly DataAccessExportSurface[] = [
  {
    id: 'profile_and_account_metadata',
    sourceAuthority: 'cross_surface',
    disposition: 'candidate_export',
    status: 'blocked',
    purpose: 'User-provided profile, preferences and bounded account metadata.',
    candidateDataClasses: [
      'profile_inputs',
      'onboarding_state',
      'bounded_account_metadata',
    ],
    excludedDataClasses: ['authentication_secrets', 'internal_ownership_ids'],
  },
  {
    id: 'workouts_programs_and_exercises',
    sourceAuthority: 'cross_surface',
    disposition: 'candidate_export',
    status: 'blocked',
    purpose: 'User-created and completed training records.',
    candidateDataClasses: [
      'workout_sessions_and_sets',
      'workout_templates',
      'training_programs',
      'custom_exercises',
    ],
    excludedDataClasses: ['sync_envelopes', 'provider_payloads'],
  },
  {
    id: 'nutrition_and_meal_data',
    sourceAuthority: 'cross_surface',
    disposition: 'candidate_export',
    status: 'blocked',
    purpose: 'User nutrition records and reusable meal data.',
    candidateDataClasses: [
      'food_entries',
      'nutrition_targets',
      'meal_templates',
      'nutrition_library_items',
    ],
    excludedDataClasses: ['provider_cache_internals', 'search_request_logs'],
  },
  {
    id: 'progress_measurements_and_weight',
    sourceAuthority: 'cross_surface',
    disposition: 'candidate_export',
    status: 'blocked',
    purpose: 'User-entered progress, weight and body-measurement history.',
    candidateDataClasses: [
      'weight_history',
      'typed_body_measurements',
      'derived_user_facing_progress_summaries',
    ],
    excludedDataClasses: ['internal_debug_metrics'],
  },
  {
    id: 'limitations_recovery_and_safety_context',
    sourceAuthority: 'cross_surface',
    disposition: 'candidate_export',
    status: 'blocked',
    purpose: 'User limitations, recovery check-ins and recorded safety context.',
    candidateDataClasses: [
      'user_limitations',
      'recovery_check_ins',
      'workout_safety_acknowledgements',
    ],
    excludedDataClasses: ['hidden_model_reasoning', 'provider_payloads'],
  },
  {
    id: 'coach_reviews_proposals_and_run_history',
    sourceAuthority: 'backend',
    disposition: 'candidate_export',
    status: 'blocked',
    purpose: 'Structured Coach inputs, user-visible outputs and immutable run history.',
    candidateDataClasses: [
      'structured_user_visible_reviews',
      'structured_proposals',
      'confirmation_history',
      'bounded_run_provenance',
    ],
    excludedDataClasses: ['hidden_model_reasoning', 'raw_provider_payloads'],
  },
  {
    id: 'social_relationships_and_account_activity',
    sourceAuthority: 'backend',
    disposition: 'candidate_export',
    status: 'blocked',
    purpose: 'Account-scoped social relationships and user-authored activity.',
    candidateDataClasses: ['following_relationships', 'user_authored_social_records'],
    excludedDataClasses: ['other_users_private_data', 'moderation_internals'],
  },
  {
    id: 'managed_media_metadata',
    sourceAuthority: 'cross_surface',
    disposition: 'notice_only',
    status: 'blocked',
    purpose: 'Explain managed-media records, lifecycle state and exceptional retention.',
    candidateDataClasses: ['user_visible_media_metadata', 'lifecycle_status'],
    excludedDataClasses: ['private_object_keys', 'moderation_provider_payloads'],
  },
  {
    id: 'sync_conflict_and_recovery_metadata',
    sourceAuthority: 'cross_surface',
    disposition: 'notice_only',
    status: 'blocked',
    purpose: 'Explain bounded synchronization and conflict-recovery state.',
    candidateDataClasses: ['human_readable_sync_status', 'bounded_conflict_status'],
    excludedDataClasses: [
      'raw_sync_payloads',
      'full_idempotency_keys',
      'internal_revisions',
      'ownership_ids',
    ],
  },
  {
    id: 'local_diagnostics',
    sourceAuthority: 'mobile',
    disposition: 'notice_only',
    status: 'blocked',
    purpose: 'Explain local aggregate size, duration and failure counters.',
    candidateDataClasses: ['aggregate_local_diagnostic_summary'],
    excludedDataClasses: ['raw_application_records', 'support_upload_payloads'],
  },
  {
    id: 'authentication_and_security_secrets',
    sourceAuthority: 'cross_surface',
    disposition: 'excluded_secret',
    status: 'blocked',
    purpose: 'Security credentials must never be included in an access export.',
    candidateDataClasses: [],
    excludedDataClasses: [
      'access_tokens',
      'refresh_tokens',
      'passwords_or_password_hashes',
      'authorization_headers',
      'security_control_material',
    ],
  },
  {
    id: 'account_deletion_recovery_secrets',
    sourceAuthority: 'cross_surface',
    disposition: 'excluded_secret',
    status: 'blocked',
    purpose: 'Deletion recovery credentials must never be disclosed in an export.',
    candidateDataClasses: [],
    excludedDataClasses: [
      'account_deletion_status_secret',
      'receipt_secret_hash',
      'pending_cleanup_secret_state',
    ],
  },
  {
    id: 'provider_and_operational_copies',
    sourceAuthority: 'external_provider',
    disposition: 'notice_only',
    status: 'blocked',
    purpose: 'Disclose unresolved provider, backup, log and exceptional-copy handling.',
    candidateDataClasses: [
      'provider_category_and_purpose',
      'retention_status',
      'exceptional_retention_explanation',
    ],
    excludedDataClasses: [
      'other_users_data',
      'operator_credentials',
      'incident_security_material',
    ],
  },
];

export type DataAccessExportRequest = {
  schemaVersion: typeof DATA_ACCESS_EXPORT_CONTRACT_SCHEMA_VERSION;
  format: 'json_v1';
  surfaceIds: readonly DataAccessExportSurfaceId[];
};

export type DataAccessExportIssueCode =
  | 'audit_and_failure_monitoring_not_implemented'
  | 'backend_export_route_not_implemented'
  | 'delivery_expiry_and_revocation_not_implemented'
  | 'exceptional_retention_notice_unreviewed'
  | 'external_provider_disposition_unresolved'
  | 'identity_reverification_not_defined'
  | 'mobile_local_transform_not_implemented'
  | 'policy_disclosure_not_reviewed'
  | 'rate_limit_and_abuse_controls_not_implemented'
  | 'redaction_and_minimization_not_implemented'
  | 'request_invalid'
  | 'source_inventory_mapping_incomplete';

export type DataAccessExportEvaluation = {
  allowed: false;
  selectedSurfaceIds: readonly DataAccessExportSurfaceId[];
  issueCodes: readonly DataAccessExportIssueCode[];
};

const REQUEST_KEYS = ['format', 'schemaVersion', 'surfaceIds'] as const;
const SURFACE_IDS = DATA_ACCESS_EXPORT_SURFACES.map(({ id }) => id);
const BLOCKING_ISSUES: readonly Exclude<
  DataAccessExportIssueCode,
  'request_invalid'
>[] = [
  'audit_and_failure_monitoring_not_implemented',
  'backend_export_route_not_implemented',
  'delivery_expiry_and_revocation_not_implemented',
  'exceptional_retention_notice_unreviewed',
  'external_provider_disposition_unresolved',
  'identity_reverification_not_defined',
  'mobile_local_transform_not_implemented',
  'policy_disclosure_not_reviewed',
  'rate_limit_and_abuse_controls_not_implemented',
  'redaction_and_minimization_not_implemented',
  'source_inventory_mapping_incomplete',
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const hasExactKeys = (value: Record<string, unknown>): boolean => {
  const keys = Object.keys(value).sort();
  const expected = [...REQUEST_KEYS].sort();
  return keys.length === expected.length && keys.every((key, index) => key === expected[index]);
};

export const parseDataAccessExportRequest = (
  value: unknown,
): DataAccessExportRequest | null => {
  if (!isRecord(value) || !hasExactKeys(value)) return null;
  if (
    value.schemaVersion !== DATA_ACCESS_EXPORT_CONTRACT_SCHEMA_VERSION ||
    value.format !== 'json_v1' ||
    !Array.isArray(value.surfaceIds) ||
    value.surfaceIds.length === 0
  ) {
    return null;
  }

  const uniqueIds = new Set<string>();
  for (const surfaceId of value.surfaceIds) {
    if (
      typeof surfaceId !== 'string' ||
      !SURFACE_IDS.includes(surfaceId as DataAccessExportSurfaceId) ||
      uniqueIds.has(surfaceId)
    ) {
      return null;
    }
    uniqueIds.add(surfaceId);
  }

  return value as DataAccessExportRequest;
};

export const evaluateDataAccessExport = (
  value: unknown,
): DataAccessExportEvaluation => {
  const request = parseDataAccessExportRequest(value);
  if (!request) {
    return {
      allowed: false,
      selectedSurfaceIds: [],
      issueCodes: ['request_invalid'],
    };
  }

  return {
    allowed: false,
    selectedSurfaceIds: [...request.surfaceIds],
    issueCodes: [...BLOCKING_ISSUES],
  };
};
