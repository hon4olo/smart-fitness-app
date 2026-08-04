export const RETENTION_DISCLOSURE_SCHEMA_VERSION = 1 as const;

export type RetentionDisclosureSurfaceId =
  | 'mobile_local_account_data'
  | 'native_authentication_secrets'
  | 'account_deletion_receipts'
  | 'application_and_reverse_proxy_logs'
  | 'database_backups'
  | 'private_media_and_delivery'
  | 'email_delivery_metadata'
  | 'model_moderation_classifier_and_ocr_requests'
  | 'food_provider_cache'
  | 'support_diagnostics'
  | 'review_exports_and_incident_copies';

export type RetentionEvidence =
  | { kind: 'source_account_lifecycle'; maximumDays: null }
  | { kind: 'source_record_expiry'; maximumDays: null }
  | { kind: 'source_zero'; maximumDays: 0 }
  | { kind: 'unset_blocker'; maximumDays: null };

export type RetentionAccountDeletionRelationship =
  | 'account_scoped_cleanup_required'
  | 'aggregate_not_account_scoped'
  | 'exceptional_retention_review_required'
  | 'not_account_scoped';

export type RetentionExceptionCategory =
  | 'backup_generation_expiry_required'
  | 'bounded_legal_hold_or_incident_review'
  | 'none'
  | 'provider_evidence_required';

export type RetentionDisclosureSurface = {
  id: RetentionDisclosureSurfaceId;
  publicationState: 'blocked';
  purpose: string;
  evidence: RetentionEvidence;
  accountDeletion: RetentionAccountDeletionRelationship;
  exceptionCategory: RetentionExceptionCategory;
  sourceBoundary: readonly string[];
  unresolvedEvidence: readonly string[];
};

export const RETENTION_DISCLOSURE_SURFACES: readonly RetentionDisclosureSurface[] = [
  {
    id: 'mobile_local_account_data',
    publicationState: 'blocked',
    purpose: 'Offline-first profile, workout, nutrition, progress and recovery data.',
    evidence: { kind: 'source_account_lifecycle', maximumDays: null },
    accountDeletion: 'account_scoped_cleanup_required',
    exceptionCategory: 'none',
    sourceBoundary: [
      'account-scoped AsyncStorage keys are inventoried',
      'confirmed deletion starts resumable local cleanup',
    ],
    unresolvedEvidence: [
      'public retention wording',
      'standalone-device cleanup evidence',
    ],
  },
  {
    id: 'native_authentication_secrets',
    publicationState: 'blocked',
    purpose: 'Native access and refresh tokens required for authenticated API use.',
    evidence: { kind: 'source_account_lifecycle', maximumDays: null },
    accountDeletion: 'account_scoped_cleanup_required',
    exceptionCategory: 'none',
    sourceBoundary: [
      'native tokens use SecureStore',
      'auth cleanup removes token state',
    ],
    unresolvedEvidence: [
      'public security wording',
      'matching-native-runtime deletion evidence',
    ],
  },
  {
    id: 'account_deletion_receipts',
    publicationState: 'blocked',
    purpose: 'Recover authoritative account-deletion status after response loss.',
    evidence: { kind: 'source_record_expiry', maximumDays: null },
    accountDeletion: 'exceptional_retention_review_required',
    exceptionCategory: 'provider_evidence_required',
    sourceBoundary: [
      'receipt records carry expiry',
      'bounded source purge command exists',
      'raw status secret is not stored by the backend',
    ],
    unresolvedEvidence: [
      'deployed purge schedule',
      'production execution evidence',
      'public expiry explanation',
    ],
  },
  {
    id: 'application_and_reverse_proxy_logs',
    publicationState: 'blocked',
    purpose: 'Runtime diagnosis, request correlation, abuse response and security review.',
    evidence: { kind: 'unset_blocker', maximumDays: null },
    accountDeletion: 'aggregate_not_account_scoped',
    exceptionCategory: 'provider_evidence_required',
    sourceBoundary: [
      'application logging redacts secrets and request/response bodies',
    ],
    unresolvedEvidence: [
      'selected log destinations',
      'maximum lifetime',
      'operator access roles',
      'expiry and deletion monitoring',
    ],
  },
  {
    id: 'database_backups',
    publicationState: 'blocked',
    purpose: 'Disaster recovery and validated PostgreSQL restoration.',
    evidence: { kind: 'unset_blocker', maximumDays: null },
    accountDeletion: 'exceptional_retention_review_required',
    exceptionCategory: 'backup_generation_expiry_required',
    sourceBoundary: ['primary PostgreSQL data inventory exists'],
    unresolvedEvidence: [
      'selected backup provider',
      'generation schedule and maximum lifetime',
      'encryption and access ownership',
      'account-deletion propagation through generation expiry',
    ],
  },
  {
    id: 'private_media_and_delivery',
    publicationState: 'blocked',
    purpose: 'Private moderation origins, normalized masters and approved derivatives.',
    evidence: { kind: 'source_record_expiry', maximumDays: null },
    accountDeletion: 'account_scoped_cleanup_required',
    exceptionCategory: 'provider_evidence_required',
    sourceBoundary: [
      'media records carry lifecycle state',
      'cleanup operations and bounded holds exist in source',
    ],
    unresolvedEvidence: [
      'selected object storage and CDN',
      'deployed cleanup worker evidence',
      'provider lifecycle and invalidation proof',
    ],
  },
  {
    id: 'email_delivery_metadata',
    publicationState: 'blocked',
    purpose: 'Password-reset delivery and bounded delivery-failure diagnosis.',
    evidence: { kind: 'unset_blocker', maximumDays: null },
    accountDeletion: 'exceptional_retention_review_required',
    exceptionCategory: 'provider_evidence_required',
    sourceBoundary: ['reset tokens and provider credentials are forbidden retention fields'],
    unresolvedEvidence: [
      'selected email provider',
      'maximum provider lifetime',
      'support access and deletion behavior',
    ],
  },
  {
    id: 'model_moderation_classifier_and_ocr_requests',
    publicationState: 'blocked',
    purpose: 'Optional structured Coach and trust-safety provider processing.',
    evidence: { kind: 'unset_blocker', maximumDays: null },
    accountDeletion: 'exceptional_retention_review_required',
    exceptionCategory: 'provider_evidence_required',
    sourceBoundary: [
      'provider calls remain backend-only and capability-gated',
      'hidden model reasoning and credentials are forbidden',
    ],
    unresolvedEvidence: [
      'exact providers and regions',
      'training and reuse terms',
      'request/response lifetime and deletion mechanisms',
      'subprocessor and support access',
    ],
  },
  {
    id: 'food_provider_cache',
    publicationState: 'blocked',
    purpose: 'Reduce food lookup requests while preserving provider attribution.',
    evidence: { kind: 'unset_blocker', maximumDays: null },
    accountDeletion: 'not_account_scoped',
    exceptionCategory: 'provider_evidence_required',
    sourceBoundary: ['account food diaries are not approved cache records'],
    unresolvedEvidence: [
      'selected provider terms',
      'maximum cache lifetime',
      'expiry enforcement and attribution wording',
    ],
  },
  {
    id: 'support_diagnostics',
    publicationState: 'blocked',
    purpose: 'Bounded release and aggregate sync diagnostics for user-authorized support.',
    evidence: { kind: 'source_zero', maximumDays: 0 },
    accountDeletion: 'account_scoped_cleanup_required',
    exceptionCategory: 'none',
    sourceBoundary: [
      'default retention is zero',
      'no background upload or backend ingestion exists',
      'raw health, nutrition, payload, token and identity data are excluded',
    ],
    unresolvedEvidence: [
      'public support explanation',
      'future explicit sharing flow if ever approved',
    ],
  },
  {
    id: 'review_exports_and_incident_copies',
    publicationState: 'blocked',
    purpose: 'Bounded trust-safety review evidence and declared incident response copies.',
    evidence: { kind: 'unset_blocker', maximumDays: null },
    accountDeletion: 'exceptional_retention_review_required',
    exceptionCategory: 'bounded_legal_hold_or_incident_review',
    sourceBoundary: [
      'unrestricted dumps and indefinite copies are forbidden',
      'incident copies require named responders, minimum scope and explicit expiry',
    ],
    unresolvedEvidence: [
      'external export destination',
      'maximum lifetime and deletion evidence',
      'reviewed legal-hold and incident exception wording',
    ],
  },
];

export type RetentionDisclosureIssueCode =
  | 'accessibility_review_missing'
  | 'exact_environment_evidence_missing'
  | 'exception_explanation_unreviewed'
  | 'localization_review_missing'
  | 'policy_review_missing'
  | 'product_surface_not_implemented'
  | 'unresolved_retention_evidence';

export type RetentionDisclosureEvaluation = {
  allowed: false;
  issueCodes: readonly RetentionDisclosureIssueCode[];
  unresolvedSurfaceIds: readonly RetentionDisclosureSurfaceId[];
  exceptionalSurfaceIds: readonly RetentionDisclosureSurfaceId[];
};

export const evaluateRetentionDisclosurePublication = (): RetentionDisclosureEvaluation => {
  const unresolvedSurfaceIds = RETENTION_DISCLOSURE_SURFACES.filter(
    ({ evidence, unresolvedEvidence }) =>
      evidence.kind === 'unset_blocker' || unresolvedEvidence.length > 0,
  ).map(({ id }) => id);
  const exceptionalSurfaceIds = RETENTION_DISCLOSURE_SURFACES.filter(
    ({ exceptionCategory }) => exceptionCategory !== 'none',
  ).map(({ id }) => id);

  return {
    allowed: false,
    issueCodes: [
      'accessibility_review_missing',
      'exact_environment_evidence_missing',
      'exception_explanation_unreviewed',
      'localization_review_missing',
      'policy_review_missing',
      'product_surface_not_implemented',
      'unresolved_retention_evidence',
    ],
    unresolvedSurfaceIds,
    exceptionalSurfaceIds,
  };
};
