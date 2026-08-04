# Smart Fitness Active Implementation Plan

Updated: 2026-08-04

This is the canonical cross-repository execution plan for:

- mobile: `hon4olo/smart-fitness-app`;
- backend: `hon4olo/smart-fitness-backend`.

Detailed provider and release-readiness evidence remains in `docs/roadmap/provider-readiness.md`. Historical implementation evidence remains in merged pull requests and focused architecture documents.

## Verified baseline

Verified before this progress synchronization:

- mobile `main`: `4227a7581a47f414bd66c2867512f4d3e6d89e7d`;
- backend `main`: `8bc59def85440c43b00f0b8d792642fe60d10903`;
- open mobile pull requests: none;
- open backend pull requests: none;
- mobile PR #406 merged the strict authenticated conflict-resolution API client;
- mobile PR #407 reprioritized P7 around blocking sync correctness before conflict UI;
- backend PRs #143-#145 merged the conflict-choice contract, authenticated route, and PostgreSQL API coverage;
- backend PR #146 made conflict replay/concurrency/API tests blocking and fixed numeric server-revision ordering;
- backend PR #147 aligned sync-operation idempotency uniqueness with authenticated user scope;
- backend PR #148 made replay, key-reuse, cross-user, and concurrent duplicate-delivery invariants blocking in CI;
- all public provider-backed capabilities remain disabled;
- no real provider/staging execution, deployment, migration outside CI, worker scheduling, native build, OTA/EAS publication, or production activation has been performed.

Always re-check exact `main`, open pull requests, `AGENTS.md`, this plan, and relevant architecture/operations documents before another slice.

## Product and architecture baseline

Smart Fitness remains an Expo / React Native offline-first mobile application backed by the existing Fastify/PostgreSQL service.

The reviewed local-state evidence and decision remain canonical in `docs/architecture/local-state-performance-decision.md`.

Approved boundaries:

- the single AsyncStorage `AppState` snapshot remains the accepted local persistence architecture;
- private data remains revision-aware through explicit revisions, idempotency keys, tombstones, retry contracts, and persisted conflicts;
- mobile owns offline interaction and local recovery presentation;
- backend owns authenticated authority, atomic conflict resolution, durable idempotency, and authoritative revisions;
- Coach flows remain deterministic, structured, and explicit-confirmation based;
- Social and managed media remain server-authoritative and separate from private `AppState` synchronization;
- provider credentials and provider calls remain backend-only;
- unavailable provider-backed operations remain hidden or fail closed.

`docs/architecture/app-context-consumer-inventory.md` records no remaining production `useAppContext` consumers. There is no remaining approved autonomous source-refactor phase.

## Program order

The order is intentionally mixed: finish the last narrow backend correctness proof that directly protects the active P7 write path, then continue the user-facing mobile flow. Expensive generalized stress infrastructure remains deferred.

1. **P7-B2 — Atomic rollback proof.** Add a deterministic PostgreSQL test proving that a failure after domain mutation but before sync-operation/conflict completion rolls the complete transaction back.
2. **P7-C — Mobile explicit conflict resolution.** Integrate the merged client into persisted conflict state, bounded presentation, explicit choice, safe replay, and post-resolution resynchronization.
3. **P7-D — Focused retry and async correctness hardening.** Add deterministic lost-response replay coverage and type-aware Promise linting where it produces actionable signal.
4. **P8 — Broader diagnostics and adversarial validation.** Add property-based sequence tests, multi-instance HTTP concurrency, and optional nightly k6/Toxiproxy scenarios after the P7 product path is complete.
5. **P9 — Privacy, legal, consent, retention, and analytics prerequisites.** Define technical requirements before analytics or broader production instrumentation.

A broader inventory of retryable non-sync writes may continue in independent focused slices, but it must not displace the P7 mobile product path unless it exposes a correctness defect in a currently active contract.

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
- PR #145: PostgreSQL-backed authenticated API integration coverage;
- PR #146: blocking PostgreSQL sync-correctness CI and numeric `bigint` revision comparison;
- PR #147: forward-safe migration from global idempotency uniqueness to `(user_id, idempotency_key)`;
- PR #148: blocking runtime coverage for equivalent replay, conflicting key reuse, cross-user key reuse, and concurrent identical delivery.

Mobile:

- PR #406: strict versioned parser and authenticated API client with one-time token-refresh retry.

The backend contract provides:

- authenticated user and device ownership checks;
- expected conflict and authoritative remote revisions;
- bounded `keep_local` / `keep_remote` choices;
- atomic transaction-bound resolution;
- user revision locking and exact compare-and-set conflict transition;
- restart-safe idempotency audit metadata;
- deterministic rejection of stale, unauthorized, malformed, unsupported, or conflicting choices.

### P7-A — Blocking sync correctness gate

**Complete through backend PR #146.**

The dedicated PostgreSQL CI path now runs the service and authenticated API conflict-resolution contracts against the migrated schema with file parallelism disabled. It blocks pull requests on replay, ownership, stale revision, concurrent choice, tombstone publication, and pull visibility.

The first blocking run exposed and fixed a real defect: PostgreSQL aggregate `bigint` revisions were arriving as runtime strings and could be compared lexicographically. Server revision selection now normalizes values with `BigInt` before computing the maximum.

### P7-B — Idempotency and database invariant audit

**Blocking key-scope and duplicate-delivery slices complete through backend PR #148.**

Completed:

- repository lookup and PostgreSQL uniqueness now share the authenticated `(user_id, idempotency_key)` boundary;
- migration creates the replacement composite unique index before dropping the previous global index;
- the same key may be used independently by different users;
- the same user and equivalent request replay one durable operation;
- the same user and key with a different request returns `SYNC_IDEMPOTENCY_KEY_REUSE`;
- concurrent identical delivery serializes to one operation and one replay;
- all of these contracts run in the focused blocking PostgreSQL sync-correctness stage.

Immediate remaining blocking proof:

1. inject a deterministic failure after a routed domain mutation but before operation persistence or conflict completion;
2. prove the domain mutation, sync operation, conflict transition, and revision allocation all roll back together;
3. keep the failure injection test-only and preserve public service/route contracts.

Do not require `FOR UPDATE` mechanically where an atomic statement, compare-and-set, advisory lock, or database constraint already expresses the invariant.

### P7-C — Mobile explicit conflict resolution

Begin immediately after the P7-B2 rollback proof is green. Independent non-blocking audit work may continue in parallel without altering the public conflict contract.

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