# Smart Fitness Active Implementation Plan

Updated: 2026-08-04

This is the canonical cross-repository execution plan for:

- mobile: `hon4olo/smart-fitness-app`;
- backend: `hon4olo/smart-fitness-backend`.

Detailed provider and release-readiness evidence remains in `docs/roadmap/provider-readiness.md`. Historical implementation evidence remains in merged pull requests and focused architecture documents.

## Verified baseline

Verified before the P7-C4 source slice:

- mobile `main`: `96e2e6e9278ab972c1b25f9834145fc8cdeb881c`;
- backend `main`: `eb1b869a683393ac402810ca25d21cc41645108d`;
- no open mobile or backend pull requests before PR #415;
- backend PRs #143-#149 complete the server conflict-resolution correctness boundary;
- mobile PRs #406, #409, and #411-#414 complete the strict client, candidate, intent, submission, reconciliation, and authenticated composition boundaries;
- mobile PR #415 completes the bounded explicit confirmation UI and restart-safe continuation gap, subject to exact-head blocking CI before merge;
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

## Current priority order

Correctness and recoverability continue to precede generalized stress infrastructure.

1. **P7-D1 — Deterministic lost-response replay.** Prove that a committed conflict-resolution request whose HTTP response is lost can be retried with the same key and produces one durable effect and one authoritative mobile outcome.
2. **P7-D2 — Reviewed Promise correctness linting.** Enable type-aware `@typescript-eslint/no-floating-promises` and `no-misused-promises` only where configuration and findings are actionable.
3. **P7-D3 — Focused HTTP and service concurrency.** Add deterministic multi-request and multi-instance coverage around currently used retryable writes before broad load tooling.
4. **P8 — Diagnostics and adversarial release preparation.** Add bounded property-based sequences, multi-instance tests, and optional nightly k6/Toxiproxy scenarios after focused P7 hardening is complete.
5. **P9 — Privacy, legal, consent, retention, and analytics prerequisites.** Define technical prerequisites before broader production instrumentation.

A broader audit of retryable non-sync writes may proceed in independent focused slices, but it must not displace the active correctness order unless it exposes a defect in a currently used contract.

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

## P7 — Explicit sync-conflict resolution

### Backend correctness — complete through PR #149

Merged behavior and blocking evidence:

- PR #143: strict backend-owned choice contract for supported delete-versus-upsert revision conflicts;
- PR #144: authenticated `POST /v1/sync/conflicts/:conflictId/resolve` route;
- PR #145: PostgreSQL-backed authenticated API integration;
- PR #146: blocking conflict replay/concurrency/API CI and numeric PostgreSQL `bigint` revision comparison;
- PR #147: forward-safe migration from global idempotency uniqueness to `(user_id, idempotency_key)`;
- PR #148: blocking equivalent replay, conflicting key reuse, cross-user key reuse, and concurrent duplicate-delivery contracts;
- PR #149: deterministic rollback proof for failure after domain mutation and before conflict completion.

The backend now proves authenticated ownership, exact revision boundaries, bounded choices, advisory-lock serialization, compare-and-set conflict transition, restart-safe replay, user-scoped idempotency, one durable effect for equivalent delivery, deterministic rejection of conflicting reuse, independent cross-user keys, and complete transaction rollback.

The blocking CI work exposed and fixed a real defect: PostgreSQL aggregate `bigint` revisions arrived as runtime strings and could previously be compared lexicographically. Values are normalized with `BigInt` before selecting the authoritative maximum.

Do not add mechanical `FOR UPDATE` requirements where an atomic statement, compare-and-set, advisory lock, or database constraint already expresses the invariant.

### Mobile correctness and presentation — complete through PR #415

Merged or included in PR #415:

- PR #406: exact versioned response parser and authenticated client with one-time access-token refresh;
- PR #409: strict read-only derivation of genuinely user-resolvable persisted conflicts;
- PR #411: immutable per-user persisted resolution intent with stable deterministic idempotency identity and restart repair;
- PR #412: bounded submission executor with retryable, stale, rejected, authentication, and duplicate-replay classification;
- PR #413: authoritative pull/materialization, accepted revision persistence, cursor verification, and terminal cleanup;
- PR #414: authenticated controller and hook composition through the normal synchronization path;
- PR #415: explicit localized this-device/account choice and confirmation UI, safe outcome presentation, duplicate-action blocking, and durable continuation when the original conflict snapshot is already gone.

The completed mobile boundary:

- accepts manual choice only for pending backend push/pull `revision_mismatch` conflicts where exactly one side is a tombstone;
- rejects malformed, terminal, client-only, identity-mismatched, upsert-versus-upsert, and tombstone-versus-tombstone snapshots;
- stores one immutable choice and one stable key per user/conflict;
- never treats a response payload as a synthetic pull result;
- removes the intent only after the conflict is absent and the authoritative cursor reaches the accepted revision;
- resumes pending, retryable, accepted, stale, and interrupted work after process restart;
- presents only localized entity labels, detection time, and saved-data/deletion kinds;
- never renders payloads, entity IDs, revisions, request IDs, fingerprints, schema versions, idempotency keys, ownership IDs, or raw backend errors;
- never chooses automatically and never exposes the opposite choice after an intent exists;
- retains non-destructive ordinary synchronization retry for conflicts outside the manual-choice contract.

Focused architecture evidence remains in `docs/architecture/sync-conflict-resolution-mobile-intent.md`.

Physical second-device, offline termination/restart, and matching standalone-runtime validation remain release-device evidence rather than source-completion claims.

## P7-D — Focused retry and async correctness hardening

### P7-D1 — Lost response after commit

Required next behavior:

1. deterministically commit the backend transaction;
2. prevent the successful HTTP response from reaching the client;
3. replay the exact request with the same user-scoped idempotency key;
4. prove one domain effect, one effective revision, one completed conflict transition, and semantic duplicate success;
5. prove the mobile intent remains retryable after uncertainty and reconciles through normal pull/materialization;
6. keep this deterministic test in blocking CI before introducing proxy-based fault injection.

An in-process response-loss hook or controlled socket termination is preferred for the blocking proof. Toxiproxy remains optional nightly infrastructure, not the first correctness oracle.

### P7-D2 — Promise correctness linting

Required approach:

- use type-aware ESLint configuration;
- enable `@typescript-eslint/no-floating-promises` and `no-misused-promises` in a focused PR;
- review every finding rather than adding broad suppression;
- retain intentional `void` fire-and-forget boundaries only where errors are independently handled;
- keep `AsyncLocalStorage` limited to request/trace context propagation rather than describing it as a race detector.

### P7-D3 — Focused concurrency

Add deterministic service/HTTP tests for currently used retryable writes before generalized load:

- equivalent duplicate requests with one effect and replay success;
- same key with different immutable request fields and deterministic rejection;
- different choices for one conflict with exactly one winner;
- same key under different users with independent outcomes;
- multi-instance execution against real PostgreSQL where process-local state cannot serialize the test accidentally.

## P8 — Diagnostics and adversarial release preparation

Planned source work:

- privacy-safe diagnostics and exact artifact provenance;
- backend/mobile exact-SHA release gates;
- Android package/link source audit;
- rollback verification;
- property-based model/sequence tests with bounded PR runs and larger nightly runs;
- multi-instance HTTP concurrency tests;
- optional nightly k6 and Toxiproxy scenarios for lock contention, pool saturation, connection reset, timeout, and retry behavior.

Do not make 100-VU stress, 10,000 database iterations, or network fault injection mandatory on every pull request unless runtime and flake evidence justify it.

Native builds, installation, TestFlight/Play distribution, OTA/EAS publication, store submission, and production activation remain external actions requiring direct authorization.

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
