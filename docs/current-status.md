# Smart Fitness Current Status

Updated: 2026-08-08

## Verified repository baseline

Verified after backend PR #191 and mobile PR #456:

- mobile `main` before this documentation slice: `0d0901acd76e1435088c9b88bb28bb86a769e8f0`;
- backend `main`: `203887655ef93c268b06db85ef03dcd4de272228`;
- backend PR #190 completed the ownership-safe `social_relationships_and_account_activity` export source/projection;
- backend PR #191 added the deterministic source-only multi-surface assembler for all seven complete candidate projections;
- mobile PR #456 optimized CI runner allocation without changing product/runtime behavior;
- no open mobile or backend pull requests existed before this documentation branch was created.

Always re-check both repositories and open pull requests before work. This file records a checkpoint, not a live Git query.

## Engineering state

The canonical implementation plan now estimates approximately:

- completed: 90%;
- remaining: 10%.

Completed source packages include:

- P0-P6 provider-neutral foundations and readiness scaffolding;
- P7 explicit synchronization-conflict resolution;
- P8 diagnostics and adversarial release preparation;
- P9-A technical data inventory;
- P9-B1 operational retention foundation;
- P9-B2 cross-surface account deletion source work.

Active packages:

1. P9-B3 provider/environment retention evidence — externally blocked until exact providers, environments, lifecycle controls, owners, credentials and evidence are available.
2. P9-C consent and analytics prerequisites — collection remains disabled; no production event or measurement purpose is registered.
3. P9-D privacy-facing controls and policy evidence — seven complete ownership-safe candidate projections and deterministic source-only assembly now exist; the next bounded package is export auditability and idempotency semantics.
4. Operational and physical evidence — authorization-gated staging, deployment, worker scheduling, native build, release-device, offline-restart, accessibility, localization and second-device validation.

Source completion does not activate an export route, delivery path, analytics collection, deployment or release operation.

## Mobile state

Current mobile source includes:

- focused production state boundaries with zero production `useAppContext` consumers;
- revisioned synchronization for every currently registered private mobile domain;
- persisted conflict review and explicit conflict resolution;
- secure native token storage;
- strict platform-independent JWT base64url/UTF-8 expiry decoding with fail-closed malformed-token behavior;
- deterministic and structured Coach flows with explicit confirmation;
- account-deletion recovery and privacy-facing fail-closed contracts;
- blocking source CI, Expo export and Expo Doctor checks;
- no known tracked hand-written source file above 500 physical lines.

Source tests do not replace physical matching-runtime validation.

## Backend state

Backend `main` contains:

- authenticated ownership-safe revisioned synchronization for the full current mobile entity set;
- deterministic and structured Coach orchestration;
- provider-neutral capability gates;
- account deletion and durable deletion-receipt recovery;
- technical data, retention and privacy registries;
- disabled-by-default data-access export preparation and optional route composition;
- durable PostgreSQL export-attempt limiting;
- seven complete ownership-safe candidate export projections:
  - `profile_and_account_metadata`;
  - `workouts_programs_and_exercises`;
  - `nutrition_and_meal_data`;
  - `progress_measurements_and_weight`;
  - `limitations_recovery_and_safety_context`;
  - `coach_reviews_proposals_and_run_history`;
  - `social_relationships_and_account_activity`;
- a deterministic source-only `json_v1` multi-surface assembler for those seven projections.

No export is product-available by default.

## Complete Social projection

Backend PR #190 completed the reviewed Social source/projection.

The projection:

- verifies an active authenticated owner;
- uses one read-only PostgreSQL `REPEATABLE READ` transaction;
- exports only the owner's Social profile and active authored workout posts;
- exports outgoing follows, current pending outgoing follow requests and outgoing blocks without counterpart identity;
- exports owner-authored reactions and comments only when the target is currently readable;
- omits incoming follows/requests/blocks, target/counterpart identity, other-user comments, resolved request history, deleted post history, managed-media values, notification rows, internal IDs, revisions, idempotency keys, raw JSON, moderation internals and provider/operational metadata;
- fails closed above reviewed source bounds.

Received `social_notifications` are permanently excluded. Managed media remains a separate `notice_only` / `mixed_policy_review` surface with no notice or binary projection.

The earlier bounded `social_profile_and_authored_posts` source remains focused evidence and compatibility context but is no longer the maximum implemented Social export boundary.

## Multi-surface assembly

Backend PR #191 adds schema version 1 of the internal `json_v1` assembler.

The assembler:

- accepts only the seven complete `candidate_export` surface IDs;
- rejects notice-only surfaces before any loader runs;
- preflights every selected projection loader;
- normalizes selected surfaces into one canonical deterministic order;
- invokes only selected loaders;
- verifies returned surface IDs and projection schema versions;
- returns no partial projection payload if a selected loader is absent, fails or returns a mismatched contract;
- does not expose authenticated owner identifiers or repository error text.

The assembler is intentionally not connected to `prepareDataAccessExport` or the optional route. The standing preparation blocker is `assembly_not_integrated`.

## Data-access route and delivery state

The projections and assembler are source-complete but not product-available.

Still fail closed or unimplemented:

- default `createApp()` does not compose the optional data-access export route;
- explicitly composed `/v1/privacy/data-access/export/prepare` still returns the bounded unavailable response after its existing authentication, request, attempt-limit and password checks;
- preparation does not invoke the assembler;
- export audit persistence is not implemented;
- export idempotency and committed-response-loss recovery are not implemented;
- no cross-surface PostgreSQL snapshot contract is claimed;
- pagination/continuation and maximum assembled-size semantics are not complete;
- archive generation is not implemented;
- secure expiring/revocable delivery is not implemented;
- managed-media notice/binary export is not implemented;
- mobile export UI is not implemented.

## P9-B3 retention evidence

Provider/environment retention evidence remains externally blocked until exact selected environments prove maximum lifetime, access, expiry/deletion behavior, failure monitoring, account-deletion handling and bounded exceptional-retention behavior.

Do not replace evidence blockers with generic provider documentation or assumptions.

## P9-C analytics and consent

Analytics, crash collection, performance telemetry, attribution, advertising tracking and generic measurement remain disabled.

Existing fail-closed activation, event/property and consent-state contracts are source controls only. Activation still requires purpose/region policy decisions, exact provider evidence, persistence/ownership semantics, reviewed disclosures, product behavior, localization/accessibility and separate implementation approval.

## Next safe P9-D boundary

The recommended next bounded package is **export auditability and idempotency semantics**:

- define one ownership-safe export attempt/audit record contract;
- define request identity and retry semantics without persisting passwords, selected payloads, full secrets or reusable authorization proofs;
- define committed-response-loss behavior and deterministic replay expectations;
- define bounded retention and account-deletion interaction for audit metadata;
- keep archive generation, secure delivery, route activation, mobile UI, deployment, provider configuration and production execution out of that slice.

Cross-surface snapshot/pagination semantics and maximum assembled-size limits remain separate reviewed concerns before delivery can be enabled.

## Deferred audit recommendations

The following are not approved autonomous implementation work without new evidence:

- migrating focused Context boundaries to Zustand or Jotai;
- replacing the reviewed AsyncStorage snapshot with SQLite, WatermelonDB, MMKV or another local database;
- mass-moving shared code into feature directories;
- mechanically consolidating test directories;
- generic performance refactors without release-device profiling.

## Disabled or authorization-gated

The following remain disabled, absent from default production composition, or require direct authorization:

- product analytics, crash collection, performance telemetry, attribution and advertising tracking;
- export route activation and preparation-to-assembly integration;
- managed-media notice projection and binary media export;
- export audit/idempotency persistence, archive generation and secure delivery;
- mobile export UI;
- model/provider staging execution;
- worker scheduling and external lifecycle proof;
- backend deployment and production migration execution;
- OTA/EAS publication, native build, installation, rollback execution and store submission;
- credential, DNS, provider-account or production-environment changes.

## Documentation state

- `docs/project-context.md` provides stable orientation;
- `docs/current-status.md` provides mutable verified state;
- `docs/handoffs/latest.md` provides the continuation checkpoint;
- `docs/architecture/README.md` indexes focused architecture documents;
- `docs/implementation-plan.md` remains the canonical cross-repository roadmap.
