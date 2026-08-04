# Smart Fitness Active Implementation Plan

Updated: 2026-08-04

This is the canonical cross-repository execution plan for:

- mobile: `hon4olo/smart-fitness-app`;
- backend: `hon4olo/smart-fitness-backend`.

Detailed provider and release-readiness evidence remains in `docs/roadmap/provider-readiness.md`. Historical implementation evidence remains in merged pull requests and focused architecture documents.

## Verified baseline

Verified before the P8-B diagnostics slice:

- mobile `main`: `09591a0fff0b74e9ade9c26213eb766a5b21d38c`;
- backend `main`: `6facc94aac4aea19ba96fd337c48eff2107e9121`;
- no open mobile or backend pull requests before mobile PR #419;
- backend PRs #143-#152 complete the current server conflict-resolution, replay, Promise-lint, and multi-instance correctness boundary;
- mobile PRs #406, #409, and #411-#416 complete the strict client, safe candidate, durable intent, submission, reconciliation, explicit confirmation, and uncertain-response replay boundaries;
- mobile PR #418 completes bounded generated conflict-intent model sequences;
- mobile PR #419 implements the privacy-safe diagnostics and exact source-provenance boundary, subject to full exact-head Mobile CI before merge;
- all public provider-backed capabilities remain disabled;
- no provider/staging execution, deployment, migration outside CI, worker scheduling, native build, OTA/EAS publication, or production activation has been performed.

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

P7 source correctness and P8-A generated state-machine evidence are complete. The active order is now release evidence quality before generalized adversarial infrastructure.

1. **P8-B — Privacy-safe diagnostics and evidence provenance.** Complete exact-head CI and merge the versioned support-evidence contract, exact immutable source SHA, bounded metadata, zero default retention, and explicit data exclusions.
2. **P8-C — Release and rollback gates.** Verify backend/mobile exact-SHA release evidence, Android package/link source configuration, rollback readiness, and failure-stop conditions without publishing or deploying.
3. **P8-D — Optional adversarial nightly validation.** Add larger model runs, load, and network-fault scenarios only where deterministic tests already define the expected invariant and runtime/flake evidence supports scheduled execution.
4. **P9 — Privacy, legal, consent, retention, and analytics prerequisites.** Define technical prerequisites before broader production instrumentation.

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
- PR #148: blocking equivalent replay, conflicting key reuse, cross-user key reuse, and concurrent duplicate-delivery contracts;
- PR #149: deterministic rollback proof for failure after domain mutation and before conflict completion;
- PR #150: deterministic post-commit response-loss replay through the real API, proving one operation, one resolved conflict, and one revisioned domain tombstone;
- PR #151: type-aware Promise correctness linting with a dedicated full-repository TypeScript lint project and no broad suppressions;
- PR #152: equivalent concurrent delivery through two independent Fastify instances and two independent PostgreSQL pools, proving one effect and semantic replay.

The backend proves authenticated ownership, exact revision boundaries, bounded choices, advisory-lock serialization, compare-and-set conflict transition, restart-safe replay, user-scoped idempotency, one durable effect for equivalent delivery, deterministic rejection of conflicting reuse, independent cross-user keys, complete transaction rollback, post-commit response-loss recovery, and multi-instance correctness without process-local serialization.

The blocking work exposed and fixed or clarified real contracts:

- PostgreSQL aggregate `bigint` revisions arrive as runtime strings and must be normalized numerically before authoritative comparison;
- entity deletion is represented by a revisioned tombstone rather than physical row removal;
- type-aware linting requires a project that includes runtime source, tests, and TypeScript configuration files.

Do not add mechanical `FOR UPDATE` requirements where an atomic statement, compare-and-set, advisory lock, or database constraint already expresses the invariant. `AsyncLocalStorage` remains request/trace context propagation, not a race detector.

### Mobile correctness and presentation — complete through PR #416

Merged behavior:

- PR #406: exact versioned response parser and authenticated client with one-time access-token refresh;
- PR #409: strict read-only derivation of genuinely user-resolvable persisted conflicts;
- PR #411: immutable per-user persisted resolution intent with stable deterministic idempotency identity and restart repair;
- PR #412: bounded submission executor with retryable, stale, rejected, authentication, and duplicate-replay classification;
- PR #413: authoritative pull/materialization, accepted revision persistence, cursor verification, and terminal cleanup;
- PR #414: authenticated controller and hook composition through the normal synchronization path;
- PR #415: explicit localized this-device/account choice and confirmation UI, safe outcome presentation, duplicate-action blocking, and durable continuation when the original conflict snapshot is already gone;
- PR #416: uncertain-response and process-restart replay proof using the same persisted request and idempotency identity before authoritative reconciliation.

The completed mobile boundary:

- accepts manual choice only for pending backend push/pull `revision_mismatch` conflicts where exactly one side is a tombstone;
- rejects malformed, terminal, client-only, identity-mismatched, upsert-versus-upsert, and tombstone-versus-tombstone snapshots;
- stores one immutable choice and one stable key per user/conflict;
- never treats a response payload as a synthetic pull result;
- removes the intent only after the conflict is absent and the authoritative cursor reaches the accepted revision;
- resumes pending, retryable, accepted, stale, interrupted, and uncertain-response work after process restart;
- presents only localized entity labels, detection time, and saved-data/deletion kinds;
- never renders payloads, entity IDs, revisions, request IDs, fingerprints, schema versions, idempotency keys, ownership IDs, or raw backend errors;
- never chooses automatically and never exposes the opposite choice after an intent exists;
- retains non-destructive ordinary synchronization retry for conflicts outside the manual-choice contract.

Focused architecture evidence remains in `docs/architecture/sync-conflict-resolution-mobile-intent.md`.

Physical second-device, offline termination/restart, and matching standalone-runtime validation remain release-device evidence rather than source-completion claims.

## P8 — Diagnostics and adversarial release preparation

### P8-A — Property-based model sequences — complete through PR #418

The blocking mobile contract now runs bounded generated state-machine sequences against the durable conflict-resolution intent store.

Implemented evidence:

- 128 reproducible seeds with 20-60 commands per sequence;
- two-user isolation across create/replay, submit, retry, accepted revision, stale state, completion, removal, malformed revision, wrong key, and process restart;
- model-versus-real-store comparison after every command;
- deterministic failing-sequence reduction and original seed reporting;
- stable choice and idempotency identity across retry and restart;
- accepted state retention until authoritative reconciliation;
- terminal-only removal and fail-closed invalid operations;
- blocking PR-level execution without a new dependency or high-volume database loop.

Larger sequence counts remain scheduled-validation work only after runtime and flake evidence supports them.

### P8-B — Privacy-safe diagnostics and evidence provenance — active in PR #419

The current slice defines:

- stable event name `support_diagnostics_snapshot` and schema version `1`;
- exact full source SHA resolved from explicit release input or immutable GitHub CI SHA;
- rejection of branches, tags, shortened hashes, dirty suffixes, placeholders, and malformed provenance;
- exact evidence timestamp plus app, build, runtime, channel, update, environment, sync, and bounded count metadata;
- explicit field construction that drops arbitrary properties;
- tests proving exclusion of email, tokens, ownership IDs, payloads, health values, nutrition text, and other unapproved content;
- zero default retention, no persistence, no background upload, and no analytics activation;
- architecture documentation in `docs/architecture/privacy-safe-support-diagnostics.md`.

Full exact-head Mobile CI remains required before merge. Any future collection or transmission requires a separate consent, purpose, access-control, retention, deletion, and redaction contract.

### P8-C — Release and rollback gates

Planned source work:

- verify backend/mobile exact-SHA release evidence;
- audit Android package and app-link source configuration;
- verify rollback and stop-condition documentation;
- ensure release evidence cannot silently refer to a moving branch;
- keep native builds, installation, publishing, deployment, and production activation authorization-gated.

### P8-D — Optional adversarial nightly validation

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
- perform native builds, install builds on devices, publish OTA/EAS updates, submit stores, or activate production;
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
