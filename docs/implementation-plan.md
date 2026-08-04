# Smart Fitness Active Implementation Plan

Updated: 2026-08-04

This is the canonical cross-repository execution plan for:

- mobile: `hon4olo/smart-fitness-app`;
- backend: `hon4olo/smart-fitness-backend`.

Detailed provider and release-readiness evidence remains in `docs/roadmap/provider-readiness.md`. Historical implementation evidence remains in merged pull requests and focused architecture documents.

## Verified baseline

Verified before this roadmap reprioritization:

- mobile `main`: `30ec3a5ba81d671e4df54c80dea15eb17fc8da84`;
- backend `main`: `cd4c9705dbbe532990f2978bf62401e31e15ab3c`;
- open mobile pull requests: none;
- open backend pull requests: none;
- mobile PR #406 merged the strict authenticated conflict-resolution API client;
- backend PRs #143-#145 merged the backend-owned conflict-choice contract, authenticated route, and PostgreSQL-backed API coverage;
- all public provider-backed capabilities remain disabled;
- no real provider/staging execution, deployment, migration outside CI, worker scheduling, native build, OTA/EAS publication, or production activation has been performed.

Always re-check exact `main`, open pull requests, `AGENTS.md`, this plan, and relevant architecture/operations documents before another slice.

## Product and architecture baseline

Smart Fitness remains an Expo / React Native offline-first mobile application backed by the existing Fastify/PostgreSQL service.

Approved boundaries:

- the single AsyncStorage `AppState` snapshot remains the accepted local persistence architecture;
- private data remains revision-aware through explicit revisions, idempotency keys, tombstones, retry contracts, and persisted conflicts;
- mobile owns offline interaction and local recovery presentation;
- backend owns authenticated authority, atomic conflict resolution, durable idempotency, and authoritative revisions;
- Coach flows remain deterministic, structured, and explicit-confirmation based;
- Social and managed media remain server-authoritative and separate from private `AppState` synchronization;
- provider credentials and provider calls remain backend-only;
- unavailable provider-backed operations remain hidden or fail closed.

`docs/architecture/app-context-consumer-inventory.md` records no remaining production `useAppContext` consumers. There is no approved broad source-refactor phase.

## Program order

The execution order is intentionally mixed: finish the correctness gates that protect the active P7 contract, then continue the user-facing P7 flow, while deferring expensive generalized stress infrastructure to P8.

1. **P7-A — Blocking sync correctness gate.** Make the existing PostgreSQL conflict-resolution replay/concurrency/API tests mandatory in Backend CI.
2. **P7-B — Idempotency and database invariant audit.** Verify and correct key scope, uniqueness, compare-and-set, rollback, and duplicate-delivery invariants for retryable sync writes.
3. **P7-C — Mobile explicit conflict resolution.** Integrate the merged client into persisted conflict state, bounded presentation, explicit choice, safe replay, and post-resolution resynchronization.
4. **P7-D — Focused retry and async correctness hardening.** Add deterministic lost-response replay coverage and type-aware Promise linting where it produces actionable signal.
5. **P8 — Broader diagnostics and adversarial validation.** Add property-based sequence tests, multi-instance HTTP concurrency, and optional nightly k6/Toxiproxy scenarios after the P7 product path is complete.
6. **P9 — Privacy, legal, consent, retention, and analytics prerequisites.** Define technical requirements before analytics or broader production instrumentation.

P6 real provider/staging evidence remains authorization-gated and does not block autonomous source work.

## Completed phases

### P0-P5

Source-complete for provider-neutral capability contracts, private storage/delivery adapters, worker entrypoints, classifier/OCR adapters, moderation calibration tooling, and password reset across backend/mobile source boundaries.

Operational activation remains dependent on explicitly authorized credentials, infrastructure, deployment, staging, DNS/domain, native-build, and device evidence.

### P6 — Provider and staging readiness

**Source-complete through backend PR #142.**

Implemented source boundaries include:

- strict staging-only plans and exact-SHA confirmation;
- synthetic authentication and cleanup;
- private quarantine, moderation, delivery, recovery, expiry, cleanup, and immutable observation;
- password-reset staging composition;
- consolidated operator runbook and stop/rollback guidance.

The only remaining P6 action is a real isolated non-production evidence run. It requires direct authorization and all operational ownership, credentials, quota, fixture, evidence-retention, rollback, and stop-condition inputs.

Do not perform that action autonomously.

## P7 — Explicit sync-conflict resolution

### Current merged state

Backend:

- PR #143: strict backend-owned conflict-choice contract for supported delete-versus-upsert revision conflicts;
- PR #144: authenticated `POST /v1/sync/conflicts/:conflictId/resolve` route;
- PR #145: PostgreSQL-backed authenticated API integration coverage.

Mobile:

- PR #406: strict versioned parser and authenticated API client with one-time token-refresh retry.

The backend contract already provides:

- authenticated user and device ownership checks;
- expected conflict and authoritative remote revisions;
- bounded `keep_local` / `keep_remote` choices;
- atomic transaction-bound resolution;
- user revision locking and exact compare-and-set conflict transition;
- restart-safe idempotency audit metadata;
- deterministic rejection of stale, unauthorized, malformed, unsupported, or conflicting choices.

### P7-A — Blocking sync correctness gate

**Immediate active slice.**

Required work:

1. add a dedicated Backend CI stage using the PostgreSQL service and migrated schema;
2. run the existing conflict-resolution service and authenticated API PostgreSQL tests with file parallelism disabled;
3. upload focused logs on failure;
4. keep the ordinary complete Vitest suite unchanged;
5. merge only the exact green head.

Acceptance:

- the current replay and concurrent-choice tests cannot silently skip in pull-request CI;
- one concurrent conflicting choice commits and the other fails deterministically;
- replay produces one durable business effect;
- HTTP integration verifies ownership, stale revision rejection, tombstone publication, and pull visibility.

### P7-B — Idempotency and database invariant audit

Start immediately after P7-A unless P7-A exposes a defect.

Required order:

1. inventory every retryable backend write and its intended idempotency-key scope;
2. compare repository lookup scope with the actual PostgreSQL unique constraint scope;
3. add explicit tests for the same key used by two different users;
4. verify same key/same payload replay and same key/different payload rejection;
5. verify transaction rollback between domain mutation, operation persistence, and conflict transition;
6. use database constraints, atomic statements, compare-and-set, advisory locks, or row locks according to the actual invariant;
7. do not require `FOR UPDATE` mechanically where an existing atomic strategy is correct.

The first known item to verify is `sync_operations`: repository lookup is user-scoped while the current unique index appears globally scoped by `idempotency_key`.

### P7-C — Mobile explicit conflict resolution

Begin after P7-A is green and the blocking portion of P7-B is resolved. P7-B follow-up tests may continue in parallel when they do not alter the public contract.

Required order:

1. audit current persisted conflict representation and Data & Sync presentation;
2. expose only genuinely user-resolvable conflicts returned by the backend contract;
3. present bounded localized summaries, never raw payloads, IDs, schema versions, or idempotency keys;
4. require an explicit user choice and confirmation;
5. create a stable per-resolution idempotency identity and preserve it through refresh/retry;
6. submit through the merged authenticated client;
7. apply the returned authoritative operation through the normal sync materialization path;
8. resynchronize without clearing unresolved state prematurely;
9. handle duplicate success, stale conflict, already-resolved conflict, offline retry, and token refresh deterministically;
10. add focused state, API, retry, and presentation tests before UI merge.

No automatic destructive choice is permitted.

### P7-D — Focused retry and async correctness hardening

After the main conflict-choice flow is stable:

- add a deterministic test where the database commit succeeds but the HTTP response is lost, followed by replay with the same key;
- enable type-aware `@typescript-eslint/no-floating-promises` and `no-misused-promises` only with reviewed, actionable configuration;
- keep `AsyncLocalStorage` limited to request/trace context propagation rather than treating it as a race detector;
- add focused concurrency tests at service and HTTP boundaries before generalized load tooling.

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