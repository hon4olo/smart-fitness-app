# Smart Fitness Active Implementation Plan

Updated: 2026-08-04

This is the canonical cross-repository execution plan for:

- mobile: `hon4olo/smart-fitness-app`;
- backend: `hon4olo/smart-fitness-backend`.

Detailed provider and release-readiness evidence remains in `docs/roadmap/provider-readiness.md`. Historical implementation evidence remains in merged pull requests and focused architecture documents.

## Verified baseline

Verified before this roadmap synchronization:

- mobile `main`: `5440503c1a8dfb55fbe6a6f41bfb74312f2b870c`;
- backend `main`: `eb1b869a683393ac402810ca25d21cc41645108d`;
- open mobile pull requests: none;
- open backend pull requests: none;
- backend PRs #143-#149 complete the current conflict-resolution correctness boundary;
- mobile PRs #406 and #409 provide the strict API client and safe persisted-conflict candidate boundary;
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

## Priority order

The active order is intentionally mixed by risk rather than by repository. Correctness and recoverability precede UI polish; generalized stress infrastructure remains deferred until the product path exists.

1. **P7-C2 — Stable mobile resolution intent.** Persist one bounded resolution attempt per conflict, including choice and idempotency identity, so offline retry and app restart cannot create a second logical request.
2. **P7-C3 — Authenticated submit and authoritative reconciliation.** Connect the persisted intent to the merged API client, handle replay/stale/already-resolved outcomes, run pull/materialization, and remove the conflict only after authoritative state is applied.
3. **P7-C4 — Explicit confirmation UI.** Extend Data & Sync with bounded local/account-version explanations and explicit confirmation. Never expose raw payloads or choose destructively without user action.
4. **P7-D — Focused retry and async hardening.** Add deterministic lost-response replay coverage, then type-aware Promise linting where it produces actionable signal.
5. **P8 — Diagnostics and adversarial validation.** Add property-based sequences, multi-instance concurrency, and optional nightly k6/Toxiproxy only after P7 is complete.
6. **P9 — Privacy, legal, consent, retention, and analytics prerequisites.** Define technical prerequisites before broader production instrumentation.

A broader audit of retryable non-sync writes may proceed in independent focused slices, but it must not displace the active mobile conflict-resolution path unless it exposes a correctness defect in a currently used contract.

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

### Backend correctness — complete through PR #149

Merged behavior and blocking evidence:

- PR #143: strict backend-owned choice contract for supported delete-versus-upsert revision conflicts;
- PR #144: authenticated `POST /v1/sync/conflicts/:conflictId/resolve` route;
- PR #145: PostgreSQL-backed authenticated API integration;
- PR #146: blocking conflict replay/concurrency/API CI and numeric PostgreSQL `bigint` revision comparison;
- PR #147: forward-safe migration from global idempotency uniqueness to `(user_id, idempotency_key)`;
- PR #148: blocking equivalent replay, conflicting key reuse, cross-user key reuse, and concurrent duplicate-delivery contracts;
- PR #149: deterministic rollback proof for failure after domain mutation and failure before conflict completion.

The backend now proves:

- authenticated user and device ownership;
- expected conflict and authoritative remote revisions;
- bounded `keep_local` / `keep_remote` choices;
- advisory-lock serialization and compare-and-set conflict transition;
- restart-safe idempotency metadata;
- one durable effect for equivalent replay;
- deterministic rejection of conflicting key reuse and concurrent different choices;
- independent user-scoped idempotency;
- complete transaction rollback of domain mutation, sync operation, conflict transition, and effective revision.

The blocking CI work exposed and fixed a real defect: PostgreSQL aggregate `bigint` revisions arrived as runtime strings and could previously be compared lexicographically. Values are now normalized with `BigInt` before selecting the authoritative maximum.

Do not add mechanical `FOR UPDATE` requirements where an atomic statement, compare-and-set, advisory lock, or database constraint already expresses the invariant.

### Mobile foundation — complete through PR #409

Merged:

- PR #406: exact versioned response parser and authenticated client with one-time access-token refresh;
- PR #409: strict read-only derivation of genuinely user-resolvable persisted conflicts.

The candidate boundary accepts only pending backend push/pull `revision_mismatch` conflicts where exactly one side is a tombstone. It rejects malformed, terminal, client-only, identity-mismatched, upsert-versus-upsert, and tombstone-versus-tombstone snapshots. It returns only bounded identity, revision, payload-kind, and detection-time metadata; raw payloads, ownership IDs, and internal reasons remain hidden.

### P7-C2 — Stable mobile resolution intent

**Immediate active slice.**

Required behavior:

1. define a per-user persisted resolution-intent record keyed by conflict identity;
2. store only conflict ID, expected revisions, bounded choice, stable idempotency key, attempt state, and safe timestamps;
3. validate and repair malformed persisted records fail closed;
4. reuse the same idempotency key across offline retry, token refresh, process restart, and uncertain response delivery;
5. prohibit changing choice under the same idempotency key;
6. never remove the original conflict snapshot merely because an intent was created;
7. isolate users and clear only the authenticated user's terminal intent;
8. add storage recovery, user isolation, malformed-data, and replay-identity tests.

No network submission or UI action is required in this slice.

### P7-C3 — Authenticated submission and authoritative reconciliation

After P7-C2 is green:

1. submit only a validated persisted intent through the merged client;
2. classify duplicate success, stale conflict, already-resolved conflict, authentication failure, offline failure, and unknown server failure;
3. preserve intent and conflict on uncertain failure;
4. on success, run the normal pull/materialization path from the returned authoritative revision boundary;
5. remove the conflict and terminal intent only after authoritative operation application succeeds;
6. keep retries bounded and reuse the original idempotency key;
7. add process-restart and response-loss recovery tests before presentation integration.

### P7-C4 — Explicit confirmation UI

After state and reconciliation contracts are stable:

- extend the existing Data & Sync conflict review surface;
- show only safe localized entity labels, detection time, and whether each version represents saved data or deletion;
- explain local-device versus account version without showing raw payloads, IDs, revisions, schema versions, or internal errors;
- require an explicit bounded choice and confirmation;
- disable duplicate submission while an intent is active;
- show safe retry/stale/resolved outcomes;
- never make an automatic destructive choice.

### P7-D — Focused retry and async correctness hardening

After the main conflict-choice path is stable:

- add a deterministic test where commit succeeds but the HTTP response is lost, followed by replay with the same key;
- enable type-aware `@typescript-eslint/no-floating-promises` and `no-misused-promises` only with reviewed, actionable configuration;
- keep `AsyncLocalStorage` limited to request/trace context propagation rather than treating it as a race detector;
- add focused service and HTTP concurrency tests before generalized load tooling.

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
