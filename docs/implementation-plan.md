# Smart Fitness Active Implementation Plan

Updated: 2026-08-04

This is the canonical cross-repository execution plan for:

- mobile: `hon4olo/smart-fitness-app`;
- backend: `hon4olo/smart-fitness-backend`.

Detailed provider and release-readiness evidence remains in `docs/roadmap/provider-readiness.md`. Historical implementation evidence remains in merged pull requests and focused architecture documents.

## Verified baseline

Verified before the P8-C release-gate slice:

- mobile `main`: `e40e234606b385630bf2dc40e25b319f86335cf1`;
- backend `main`: `6facc94aac4aea19ba96fd337c48eff2107e9121`;
- no open mobile or backend pull requests before mobile PR #420;
- backend PRs #143-#152 complete the current server conflict-resolution, replay, Promise-lint, and multi-instance correctness boundary;
- mobile PRs #406, #409, and #411-#416 complete the strict client, safe candidate, durable intent, submission, reconciliation, explicit confirmation, and uncertain-response replay boundaries;
- mobile PR #418 completes bounded generated conflict-intent model sequences;
- mobile PR #419 completes privacy-safe diagnostics, exact source provenance, zero default retention, and explicit sensitive-data exclusions;
- mobile PR #420 implements exact release and rollback evidence gates, subject to full exact-head Mobile CI before merge;
- all public provider-backed capabilities remain disabled;
- no provider/staging execution, deployment, migration outside CI, worker scheduling, native build, OTA/EAS publication, rollback execution, or production activation has been performed.

Always re-check exact `main`, open pull requests, `AGENTS.md`, `PROJECT_LEARNINGS.md`, this plan, and relevant architecture/operations documents before another slice.

## Product and architecture baseline

Smart Fitness remains an Expo / React Native offline-first mobile application backed by the existing Fastify/PostgreSQL service.

Approved boundaries:

- the single AsyncStorage `AppState` snapshot remains the accepted local persistence architecture;
- private data remains revision-aware through explicit revisions, idempotency keys, tombstones, retry contracts, and persisted conflicts;
- mobile owns offline interaction, explicit user choices, and local recovery presentation;
- backend owns authenticated authority, atomic conflict resolution, durable idempotency, and authoritative revisions;
- Coach flows remain deterministic, structured, and explicit-confirmation based;
- Social and managed media remain server-authoritative and separate from private `AppState` synchronization;
- provider credentials and provider calls remain backend-only;
- unavailable provider-backed operations remain hidden or fail closed;
- no production screen may consume the full compatibility `AppContext` boundary.

The reviewed local-state evidence remains canonical in `docs/architecture/local-state-performance-decision.md`. The focused context boundary remains recorded in `docs/architecture/app-context-consumer-inventory.md`.

There is no remaining approved autonomous source-refactor phase. Any future provider-internals restructuring requires a new evidence-backed decision rather than continuation by default.

## Current priority order

P7 source correctness, P8-A generated model evidence, and P8-B privacy-safe provenance are complete. Release and rollback source evidence now precedes optional adversarial infrastructure.

1. **P8-C — Release and rollback gates.** Complete exact-head CI and merge the four-SHA release/rollback contract, Expo source binding, Android/iOS identifier and app-link audit, bounded evidence artifact, and operator stop conditions.
2. **P8-D — Optional adversarial scheduled validation.** Add larger model runs, load, and network-fault scenarios only where deterministic tests define the expected invariant and runtime/flake evidence supports scheduled execution.
3. **P9 — Privacy, legal, consent, retention, and analytics prerequisites.** Define technical prerequisites before broader production instrumentation.

A broader audit of retryable non-sync writes may proceed in independent focused slices, but it must not displace the active evidence order unless it exposes a defect in a currently used contract.

P6 real provider/staging evidence remains authorization-gated and does not block autonomous source work.

## Completed phases

### P0-P5

Source-complete for provider-neutral capability contracts, private storage/delivery adapters, worker entrypoints, classifier/OCR adapters, moderation calibration tooling, and password reset across backend/mobile source boundaries.

Operational activation remains dependent on explicitly authorized credentials, infrastructure, deployment, staging, DNS/domain, native-build, and device evidence.

### P6 — Provider and staging readiness

Source-complete through backend PR #142.

Implemented source boundaries include:

- strict staging-only plans and exact-SHA confirmation;
- synthetic authentication and cleanup;
- private quarantine, moderation, delivery, recovery, expiry, cleanup, and immutable observation;
- password-reset staging composition;
- consolidated operator runbook and stop/rollback guidance.

The remaining P6 action is a real isolated non-production evidence run. It requires direct authorization and all operational ownership, credentials, quota, fixture, evidence-retention, rollback, and stop-condition inputs.

Do not perform that action autonomously.

## P7 — Explicit sync-conflict resolution and focused hardening

### Backend correctness — complete through PR #152

Merged behavior and blocking evidence:

- PR #143: strict backend-owned choice contract for supported delete-versus-upsert revision conflicts;
- PR #144: authenticated `POST /v1/sync/conflicts/:conflictId/resolve` route;
- PR #145: PostgreSQL-backed authenticated API integration;
- PR #146: blocking conflict replay/concurrency/API CI and numeric PostgreSQL `bigint` revision comparison;
- PR #147: forward-safe migration from global idempotency uniqueness to `(user_id, idempotency_key)`;
- PR #148: equivalent replay, conflicting key reuse, cross-user key reuse, and concurrent duplicate-delivery contracts;
- PR #149: deterministic rollback proof for failure after domain mutation and before conflict completion;
- PR #150: deterministic post-commit response-loss replay through the real API;
- PR #151: type-aware Promise correctness linting without broad suppression;
- PR #152: equivalent concurrent delivery through independent Fastify instances and PostgreSQL pools.

The backend proves authenticated ownership, exact revision boundaries, bounded choices, advisory-lock serialization, compare-and-set conflict transition, restart-safe replay, user-scoped idempotency, one durable effect for equivalent delivery, deterministic rejection of conflicting reuse, independent cross-user keys, complete transaction rollback, post-commit response-loss recovery, and multi-instance correctness without process-local serialization.

The blocking work exposed and fixed or clarified real contracts:

- PostgreSQL aggregate `bigint` revisions arrive as runtime strings and must be normalized numerically before authoritative comparison;
- entity deletion is represented by a revisioned tombstone rather than physical row removal;
- type-aware linting requires a project that includes runtime source, tests, and TypeScript configuration files.

Do not add mechanical `FOR UPDATE` requirements where an atomic statement, compare-and-set, advisory lock, or database constraint already expresses the invariant. `AsyncLocalStorage` remains request/trace context propagation, not a race detector.

### Mobile correctness and presentation — complete through PR #416

Merged behavior:

- PR #406: exact versioned response parser and authenticated client with one-time access-token refresh;
- PR #409: strict derivation of genuinely user-resolvable persisted conflicts;
- PR #411: immutable per-user persisted resolution intent with stable idempotency identity and restart repair;
- PR #412: bounded submission executor with retryable, stale, rejected, authentication, and duplicate-replay classification;
- PR #413: authoritative pull/materialization, accepted revision persistence, cursor verification, and terminal cleanup;
- PR #414: authenticated controller and hook composition through normal synchronization;
- PR #415: explicit localized choice and confirmation UI with safe outcome presentation;
- PR #416: uncertain-response and process-restart replay proof using the same persisted request identity.

The completed mobile boundary:

- accepts manual choice only for pending backend push/pull `revision_mismatch` conflicts where exactly one side is a tombstone;
- rejects malformed, terminal, client-only, identity-mismatched, upsert-versus-upsert, and tombstone-versus-tombstone snapshots;
- stores one immutable choice and stable key per user/conflict;
- never treats a response payload as a synthetic pull result;
- removes intent only after conflict absence and authoritative cursor advancement;
- resumes pending, retryable, accepted, stale, interrupted, and uncertain-response work after restart;
- never renders payloads, entity IDs, revisions, idempotency keys, ownership IDs, or raw backend errors;
- never chooses automatically;
- retains ordinary non-destructive sync retry outside the manual-choice contract.

Focused architecture evidence remains in `docs/architecture/sync-conflict-resolution-mobile-intent.md`.

Physical second-device, offline termination/restart, and matching standalone-runtime validation remain release-device evidence rather than source-completion claims.

## P8 — Diagnostics and adversarial release preparation

### P8-A — Generated state-machine sequences — complete through PR #418

Blocking mobile evidence includes:

- 128 reproducible seeds with 20-60 commands per sequence;
- two-user isolation across create/replay, submit, retry, accepted revision, stale state, completion, removal, malformed revision, wrong key, and restart;
- model-versus-real-store comparison after every command;
- deterministic failing-sequence reduction and seed reporting;
- stable choice/idempotency identity and terminal-only removal;
- PR-level execution without a new dependency or high-volume database loop.

Larger sequence counts remain scheduled-validation work only after runtime and flake evidence supports them.

### P8-B — Privacy-safe diagnostics and evidence provenance — complete through PR #419

Merged source behavior:

- stable event name `support_diagnostics_snapshot` and schema version `1`;
- exact full source SHA from explicit release input or immutable GitHub CI SHA;
- rejection of branches, tags, shortened hashes, dirty suffixes, placeholders, and malformed provenance;
- exact evidence timestamp plus bounded app, build, runtime, channel, update, environment, sync, and count metadata;
- explicit field construction that drops arbitrary properties;
- tests excluding email, tokens, ownership IDs, payloads, health values, nutrition text, and other unapproved content;
- zero default retention, no persistence, no background upload, and no analytics activation;
- architecture evidence in `docs/architecture/privacy-safe-support-diagnostics.md`.

Any future collection or transmission requires a separate consent, purpose, access-control, retention, deletion, and redaction contract.

### P8-C — Release and rollback gates — active in PR #420

The current slice requires:

- exact full release SHAs for mobile and backend;
- exact full previously validated rollback SHAs for mobile and backend;
- distinct release/rollback refs and rollback ancestry in each repository;
- Expo build provenance equality with the selected mobile release SHA;
- Android package, iOS bundle identifier, application scheme, runtime policy, production update channel, iOS associated domain, and Android verified app-link parity;
- current backend disabled-capability configuration, migration idempotency, scoped-idempotency schema evidence, complete tests, and production startup health;
- a bounded schema-v1 evidence artifact containing the run ID and four exact SHAs;
- explicit fail-closed operator stop conditions and 30-day artifact retention.

Full exact-head Mobile CI remains required before merge. The manual release gate is not executed by this source slice.

### P8-D — Optional adversarial scheduled validation

Candidate scheduled scenarios:

- larger property-based sequence counts;
- additional independent-process HTTP concurrency;
- bounded k6 load for lock contention and pool saturation;
- Toxiproxy connection reset and timeout scenarios;
- exact artifact retention for reproducible failures.

Do not make 100-VU stress, 10,000 database iterations, or network fault injection mandatory on every pull request unless runtime and flake evidence justify it.

## P9 — Privacy, legal, consent, retention, and analytics prerequisites

Planned work includes:

- data inventory and purpose mapping;
- consent and withdrawal contracts where required;
- retention, deletion, and legal-hold alignment;
- analytics minimization;
- user-facing privacy/account-deletion requirements;
- technical evidence for legal/policy review.

Source completion alone is not a legal-compliance determination.

## Permanent authorization boundaries

Do not perform any of the following without a direct user request for that exact action:

- create or change provider accounts, credentials, secrets, buckets, CDN distributions, DNS, sender domains, or callback configuration;
- deploy backend/workers, run migrations outside CI, change worker schedules, or activate capabilities;
- execute real staging/provider smoke scenarios;
- perform native builds, install builds on devices, publish OTA/EAS updates, submit stores, execute rollback, or activate production;
- use production user data, unrelated staging data, or unbounded/global worker selection for synthetic evidence;
- run destructive rollback, down migration, production data deletion, legal-hold removal, audit deletion, or generic credential revocation.

## Validation policy for every source PR

- start from current exact `main`;
- keep one coherent slice and preserve public contracts unless explicitly changed;
- maintain repository and changed-file line limits;
- add deterministic tests for changed behavior and failure paths;
- run complete repository CI on the exact final head;
- inspect review threads, reviews, and comments;
- merge only the exact green head;
- update this plan when phase status or the ordered backlog changes.
