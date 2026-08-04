export const PRIVACY_REVIEW_EVIDENCE_SCHEMA_VERSION = 1 as const;

export type PrivacyReviewEvidenceDomainId =
  | 'account_deletion_and_recovery'
  | 'analytics_consent_and_choice'
  | 'authentication_and_security'
  | 'data_access_and_export'
  | 'data_inventory_and_ownership'
  | 'offline_sync_and_conflicts'
  | 'product_audience_and_regional_scope'
  | 'provider_processing_and_regions'
  | 'purpose_and_minimization'
  | 'retention_and_exceptional_retention'
  | 'user_disclosures_and_controls';

export type PrivacyReviewEvidenceState =
  | 'environment_evidence_required'
  | 'operational_validation_required'
  | 'policy_decision_required'
  | 'product_integration_required'
  | 'source_supported';

export type PrivacyReviewEvidenceItem = {
  id: PrivacyReviewEvidenceDomainId;
  reviewState: 'not_ready';
  purpose: string;
  sourceEvidence: readonly string[];
  requiredStates: readonly PrivacyReviewEvidenceState[];
  unresolvedQuestions: readonly string[];
  forbiddenConclusions: readonly string[];
};

export const PRIVACY_REVIEW_EVIDENCE_ITEMS: readonly PrivacyReviewEvidenceItem[] = [
  {
    id: 'data_inventory_and_ownership',
    reviewState: 'not_ready',
    purpose:
      'Map account-linked mobile, backend, provider and operational data to an accountable technical owner.',
    sourceEvidence: [
      'docs/privacy/mobile-account-data-inventory.md',
      'backend:docs/privacy/backend-data-inventory.md',
      'backend:docs/privacy/operational-retention-contracts.md',
    ],
    requiredStates: ['source_supported', 'policy_decision_required'],
    unresolvedQuestions: [
      'Which technical categories require public disclosure in each supported region?',
      'Which operational or provider copies are in the exact deployed environment?',
    ],
    forbiddenConclusions: [
      'The technical inventory is a complete legal record of processing.',
      'A source registry proves every external copy has been discovered.',
    ],
  },
  {
    id: 'purpose_and_minimization',
    reviewState: 'not_ready',
    purpose:
      'Record a necessary purpose, minimum fields and forbidden classes for every proposed processing surface.',
    sourceEvidence: [
      'src/privacy/analyticsActivationContract.ts',
      'src/privacy/analyticsEventRegistry.ts',
      'src/privacy/dataAccessExportContract.ts',
    ],
    requiredStates: ['source_supported', 'policy_decision_required'],
    unresolvedQuestions: [
      'Which proposed purposes are approved, optional or prohibited?',
      'Do any derived fields create re-identification or sensitive-data risk?',
    ],
    forbiddenConclusions: [
      'Hashing or aggregation automatically makes a field approved.',
      'A closed schema proves the purpose is necessary or lawful.',
    ],
  },
  {
    id: 'authentication_and_security',
    reviewState: 'not_ready',
    purpose:
      'Explain token storage, session boundaries, identity verification and security-sensitive exclusions.',
    sourceEvidence: [
      'AGENTS.md',
      'PROJECT_LEARNINGS.md',
      'src/auth',
      'src/privacy/dataAccessExportContract.ts',
    ],
    requiredStates: [
      'source_supported',
      'operational_validation_required',
      'policy_decision_required',
    ],
    unresolvedQuestions: [
      'What identity re-verification is required for export or destructive actions?',
      'What deployed access controls and incident procedures apply?',
    ],
    forbiddenConclusions: [
      'SecureStore source usage proves every release runtime is correctly configured.',
      'Authentication authorizes exporting tokens, credentials or deletion secrets.',
    ],
  },
  {
    id: 'offline_sync_and_conflicts',
    reviewState: 'not_ready',
    purpose:
      'Describe offline persistence, revisioned synchronization, explicit conflict resolution and recovery boundaries.',
    sourceEvidence: [
      'docs/architecture/sync-conflict-resolution-mobile-intent.md',
      'docs/architecture/privacy-safe-support-diagnostics.md',
      'PROJECT_LEARNINGS.md',
    ],
    requiredStates: ['source_supported', 'product_integration_required'],
    unresolvedQuestions: [
      'Which conflict and recovery explanations belong in user-facing disclosures?',
      'How will real-device offline and second-device behavior be validated?',
    ],
    forbiddenConclusions: [
      'Source tests prove every physical two-device scenario.',
      'Internal revisions, payloads or idempotency keys should be disclosed to users.',
    ],
  },
  {
    id: 'provider_processing_and_regions',
    reviewState: 'not_ready',
    purpose:
      'Identify exact providers, regions, subprocessors, reuse terms, access and lifecycle behavior before activation.',
    sourceEvidence: [
      'docs/roadmap/provider-readiness.md',
      'backend:docs/privacy/operational-retention-contracts.md',
      'src/privacy/retentionDisclosureContract.ts',
    ],
    requiredStates: [
      'environment_evidence_required',
      'operational_validation_required',
      'policy_decision_required',
    ],
    unresolvedQuestions: [
      'Which exact providers and regions are selected for each environment?',
      'What retention, deletion, training/reuse and support-access configuration is verified?',
    ],
    forbiddenConclusions: [
      'Generic provider documentation proves the deployed configuration.',
      'An unselected or disabled provider may be named as active.',
    ],
  },
  {
    id: 'retention_and_exceptional_retention',
    reviewState: 'not_ready',
    purpose:
      'Separate source lifecycle facts from verified maximum lifetimes, deletion proof and bounded exceptions.',
    sourceEvidence: [
      'src/privacy/retentionDisclosureContract.ts',
      'docs/privacy/retention-disclosure-requirements.md',
      'backend:src/privacy/operational-retention-registry.ts',
    ],
    requiredStates: [
      'source_supported',
      'environment_evidence_required',
      'policy_decision_required',
    ],
    unresolvedQuestions: [
      'What exact maximum lifetime applies to each deployed surface?',
      'How are backups, legal holds, review evidence and incident copies bounded and explained?',
    ],
    forbiddenConclusions: [
      'Record expiry proves provider bytes were deleted.',
      'Unknown retention may be replaced with an estimated number.',
    ],
  },
  {
    id: 'account_deletion_and_recovery',
    reviewState: 'not_ready',
    purpose:
      'Explain authoritative deletion, blocked/pending states, response-loss recovery and resumable local cleanup.',
    sourceEvidence: [
      'docs/privacy/mobile-account-data-inventory.md',
      'docs/privacy/account-deletion-status-presentation.md',
      'backend:docs/privacy/account-deletion-receipts.md',
    ],
    requiredStates: [
      'source_supported',
      'operational_validation_required',
      'product_integration_required',
      'policy_decision_required',
    ],
    unresolvedQuestions: [
      'What public wording accurately explains backups, providers and exceptional retention?',
      'How will deletion status and cleanup retry be integrated and validated on a release device?',
    ],
    forbiddenConclusions: [
      'A missing session or expired receipt proves deletion completed.',
      'Source completion proves production cleanup or provider deletion.',
    ],
  },
  {
    id: 'data_access_and_export',
    reviewState: 'not_ready',
    purpose:
      'Define exportable, notice-only and permanently excluded data surfaces before implementing access/export.',
    sourceEvidence: [
      'src/privacy/dataAccessExportContract.ts',
      'docs/privacy/data-access-export-requirements.md',
    ],
    requiredStates: [
      'source_supported',
      'environment_evidence_required',
      'operational_validation_required',
      'product_integration_required',
      'policy_decision_required',
    ],
    unresolvedQuestions: [
      'What authenticated backend export and identity re-verification contract will be implemented?',
      'What secure expiring delivery mechanism is verified for the exact environment?',
    ],
    forbiddenConclusions: [
      'Raw storage snapshots or database rows are suitable user exports.',
      'A structural request parser is an implemented export capability.',
    ],
  },
  {
    id: 'analytics_consent_and_choice',
    reviewState: 'not_ready',
    purpose:
      'Keep analytics disabled until purpose, event schema, user choice or other basis, withdrawal and provider evidence are reviewed.',
    sourceEvidence: [
      'src/privacy/analyticsActivationContract.ts',
      'src/privacy/analyticsEventRegistry.ts',
      'src/privacy/analyticsConsentState.ts',
      'docs/privacy/analytics-consent-prerequisites.md',
    ],
    requiredStates: [
      'source_supported',
      'environment_evidence_required',
      'product_integration_required',
      'policy_decision_required',
    ],
    unresolvedQuestions: [
      'Which measurement purposes, if any, are approved for each region?',
      'How will refusal, withdrawal, persistence and account deletion interact?',
    ],
    forbiddenConclusions: [
      'A synthetic grant authorizes collection.',
      'An empty production registry is an implemented consent experience.',
    ],
  },
  {
    id: 'product_audience_and_regional_scope',
    reviewState: 'not_ready',
    purpose:
      'Record intended audience, supported regions and any age or account-eligibility decisions before public policy approval.',
    sourceEvidence: ['docs/implementation-plan.md'],
    requiredStates: ['policy_decision_required', 'product_integration_required'],
    unresolvedQuestions: [
      'Which countries and regions are intentionally supported?',
      'What audience, age and account-eligibility rules apply?',
    ],
    forbiddenConclusions: [
      'Repository language or store availability defines legal regional scope.',
      'No explicit audience decision means the product is approved for every age group.',
    ],
  },
  {
    id: 'user_disclosures_and_controls',
    reviewState: 'not_ready',
    purpose:
      'Require accurate EN/RU copy, accessibility, control discoverability and consistency with actual product behavior.',
    sourceEvidence: [
      'src/privacy/accountDeletionStatusPresentation.ts',
      'src/privacy/retentionDisclosureContract.ts',
      'docs/privacy/data-access-export-requirements.md',
    ],
    requiredStates: [
      'product_integration_required',
      'operational_validation_required',
      'policy_decision_required',
    ],
    unresolvedQuestions: [
      'What reviewed public wording will be used in English and Russian?',
      'How will accessibility and control discoverability be validated on release devices?',
    ],
    forbiddenConclusions: [
      'Internal localization keys are approved public policy copy.',
      'Source contracts prove controls are discoverable or accessible.',
    ],
  },
];

export type PrivacyReviewEvidenceIssueCode =
  | 'environment_evidence_missing'
  | 'operational_validation_missing'
  | 'policy_decisions_missing'
  | 'product_integration_missing'
  | 'reviewer_signoff_missing';

export type PrivacyReviewEvidenceEvaluation = {
  schemaVersion: typeof PRIVACY_REVIEW_EVIDENCE_SCHEMA_VERSION;
  ready: false;
  issueCodes: readonly PrivacyReviewEvidenceIssueCode[];
  domainIds: readonly PrivacyReviewEvidenceDomainId[];
};

export const evaluatePrivacyReviewEvidencePacket = (): PrivacyReviewEvidenceEvaluation => ({
  schemaVersion: PRIVACY_REVIEW_EVIDENCE_SCHEMA_VERSION,
  ready: false,
  issueCodes: [
    'environment_evidence_missing',
    'operational_validation_missing',
    'policy_decisions_missing',
    'product_integration_missing',
    'reviewer_signoff_missing',
  ],
  domainIds: PRIVACY_REVIEW_EVIDENCE_ITEMS.map(({ id }) => id),
});
