# Smart Fitness Active Implementation Plan

Updated: 2026-08-04

This is the canonical cross-repository execution plan for:

- mobile: `hon4olo/smart-fitness-app`;
- backend: `hon4olo/smart-fitness-backend`.

Detailed provider and release-readiness evidence remains in `docs/roadmap/provider-readiness.md`. Historical implementation evidence remains in merged pull requests and focused architecture documents.

## Verified baseline

Verified before the P8-D scheduled-validation slice:

- mobile `main`: `33b21d836115446c50734c1f62a86007039318e0`;
- backend `main`: `6facc94aac4aea19ba96fd337c48eff2107e9121`;
- no open mobile or backend pull requests before mobile PR #421;
- backend PRs #143-#152 complete the current conflict-resolution, replay, Promise-lint, rollback, and multi-instance correctness boundary;
- mobile PRs #406, #409, and #411-#416 complete the strict client, safe candidate, durable intent, submission, reconciliation, confirmation UI, and uncertain-response replay boundaries;
- mobile PR #418 completes bounded generated conflict-intent model sequences;
- mobile PR #419 completes privacy-safe support diagnostics and exact source provenance;
- mobile PR #420 completes the four-SHA release/rollback source gate and fail-closed Expo/package/app-link evidence contract;
- mobile PR #421 implements bounded scheduled adversarial validation, subject to exact-head Mobile CI before merge;
- all public provider-backed capabilities remain disabled;
- no provider/staging execution, deployment, migration outside CI, backend worker scheduling, native build, OTA/EAS publication, rollback execution, store submission, or production activation has been performed.

Always re-check exact `main`, open pull requests, `AGENTS.md`, `PROJECT_LEARNINGS.md`, this plan, and relevant architecture/operations documents before another slice.

## Product and architecture baseline

Smart Fitness remains an Expo / React Native offline-first application backed by the existing Fastify/PostgreSQL service.

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

P7 source correctness and P8-A through P8-C source evidence are complete. The active order is bounded scheduled validation, then privacy/legal prerequisites.

1. **P8-D — Bounded adversarial scheduled validation.** Complete exact-head CI and merge expanded deterministic mobile model sequences, focused PostgreSQL retry/rollback coverage, exact-source artifacts, hard runtime bounds, and fail-closed scheduled evidence.
2. **P9-A — Technical privacy inventory.** Map stored/transmitted data, purpose, ownership, retention, deletion, and user-facing controls before adding broader instrumentation.
3. **P9-B — Consent and analytics prerequisites.** Define consent/withdrawal, minimization, redaction, retention, deletion, and access-control contracts before any analytics or telemetry activation.

A broader audit of retryable non-sync writes may proceed in independent focused slices, but it must not displace the active order unless it exposes a defect in a currently used contract.

P6 real provider/staging evidence remains authorization-gated and does not block autonomous source work.

## Completed phases

### P0-P5

Source-complete for provider-neutral capability contracts, private storage/delivery adapters, worker entrypoints, classifier/OCR adapters, moderation calibration tooling, and password reset across backend/mobile source boundaries.

Operational activation still depends on explicitly authorized credentials, infrastructure, deployment, staging, DNS/domain, native-build, and device evidence.

### P6 — Provider and staging readiness

Source-complete through backend PR #142.

Implemented source boundaries include:

- strict staging-only plans and exact-SHA confirmation;
- synthetic authentication and cleanup;
- private quarantine, moderation, delivery, recovery, expiry, cleanup, and immutable observation;
- password-reset staging composition;
- consolidated operator runbook and stop/rollback guidance.

The remaining P6 action is a real isolated non-production evidence run. It requires direct authorization and complete operational ownership, credentials, quota, fixture, retention, rollback, and stop-condition inputs.

Do not perform that action autonomously.

## P7 — Explicit sync-conflict resolution and focused hardening

### Backend correctness — complete through PR #152

Merged evidence includes:

- strict supported-choice and authenticated resolution contracts;
- PostgreSQL-backed API integration and blocking correctness CI;
- numeric normalization of PostgreSQL aggregate `bigint` revisions;
- user-scoped idempotency uniqueness and runtime replay/reuse contracts;
- deterministic transaction rollback after injected failures;
- committed-response-loss replay with one durable effect;
- type-aware Promise linting without broad suppressions;
- equivalent concurrent delivery through independent Fastify instances and PostgreSQL pools.

The backend proves authenticated ownership, exact revisions, advisory-lock serialization, compare-and-set conflict transition, restart-safe replay, user-scoped idempotency, complete rollback, post-commit response-loss recovery, and multi-instance correctness without process-local serialization.

Entity deletion remains a revisioned tombstone rather than physical row removal. Do not add mechanical `FOR UPDATE` requirements where an atomic statement, compare-and-set, advisory lock, or database constraint already expresses the invariant. `AsyncLocalStorage` remains request/trace context propagation, not a race detector.

### Mobile correctness and presentation — complete through PR #416

Merged behavior includes:

- strict versioned response parsing and one-time token refresh;
- safe derivation of user-resolvable delete-versus-upsert conflicts;
- one immutable per-user intent and deterministic key per conflict;
- bounded submission classification and authoritative pull/materialization;
- cursor verification and terminal cleanup only after authoritative state;
- authenticated controller/hook composition;
- explicit localized confirmation UI without raw payload or backend-error exposure;
- uncertain-response replay after process restart with the same persisted identity.

The mobile never chooses automatically, never synthesizes pull state from a resolution response, and never renders payloads, entity IDs, revisions, idempotency keys, ownership IDs, or raw backend errors.

Focused evidence remains in `docs/architecture/sync-conflict-resolution-mobile-intent.md`. Physical second-device and matching standalone-runtime validation remain release-device evidence rather than source-completion claims.

## P8 — Diagnostics and adversarial release preparation

### P8-A — Generated state-machine sequences — complete through PR #418

Blocking pull-request evidence includes:

- 128 reproducible seeds with 20-60 commands per sequence;
- two-user isolation across create/replay, submit, retry, accepted revision, stale state, completion, removal, invalid revision, wrong key, and restart;
- model-versus-real-store comparison after every command;
- deterministic failing-sequence reduction and seed reporting;
- stable choice/idempotency identity and terminal-only removal.

### P8-B — Privacy-safe diagnostics and exact provenance — complete through PR #419

Merged source behavior includes:

- versioned `support_diagnostics_snapshot` evidence;
- exact full source SHA from explicit release input or immutable GitHub CI SHA;
- rejection of branches, tags, shortened hashes, dirty suffixes, placeholders, and malformed provenance;
- bounded app/build/runtime/update/environment/sync metadata;
- explicit field construction excluding arbitrary input;
- tests excluding email, tokens, ownership IDs, payloads, health values, and nutrition text;
- zero default retention, no persistence, no background upload, and no analytics activation.

Architecture evidence remains in `docs/architecture/privacy-safe-support-diagnostics.md`. Any future collection or transmission requires a separate consent, purpose, access-control, retention, deletion, and redaction contract.

### P8-C — Release and rollback gates — complete through PR #420

The source gate now requires:

- exact full mobile/backend release SHAs;
- exact full previously validated mobile/backend rollback SHAs;
- distinct release/rollback commits and rollback ancestry;
- Expo provenance equality with the selected mobile release SHA;
- Android package, iOS bundle identifier, app scheme, runtime policy, production update channel, iOS associated domain, and Android verified app-link parity;
- current backend disabled-capability configuration, migration idempotency, scoped-idempotency evidence, complete tests, and production startup health;
- a bounded schema-v1 artifact containing the run ID and four exact SHAs;
- explicit operator stop conditions and 30-day artifact retention.

The manual release gate was not executed. Native builds, publication, deployment, rollback execution, and production activation remain authorization-gated.

### P8-D — Bounded scheduled adversarial validation — active in PR #421

The current slice adds:

- a weekly/manual GitHub validation workflow that does not run on pull requests or pushes;
- expanded mobile conflict-intent model execution at 2,048 deterministic seeds;
- a hard accepted range of 129-4,096 seeds;
- a 129-seed pull-request smoke of the exact expansion/cleanup runner;
- focused backend PostgreSQL suites for response loss, independent application instances, idempotency, and rollback;
- disposable PostgreSQL only, with migrations limited to the CI database;
- exact resolved mobile/backend SHAs and bounded schema-v1 artifacts;
- 14-day focused logs and 30-day consolidated evidence;
- no automatic retries that could conceal flakes.

Architecture evidence is in `docs/architecture/bounded-adversarial-validation.md`.

This slice intentionally excludes k6, Toxiproxy, virtual-user load, production access, deployment, publication, and rollback execution. Such tooling remains deferred until deterministic oracles and repeated scheduled runtime/flake evidence justify the cost.

## P9 — Privacy, legal, consent, retention, and analytics prerequisites

Planned source work:

- data inventory and purpose mapping;
- consent and withdrawal contracts where required;
- retention, deletion, account deletion, and legal-hold alignment;
- analytics minimization and redaction;
- user-facing privacy controls;
- technical evidence for legal/policy review.

Source completion alone is not a legal-compliance determination.

## Permanent authorization boundaries

Do not perform any of the following without a direct user request for that exact action:

- create or change provider accounts, credentials, secrets, buckets, CDN distributions, DNS, sender domains, or callback configuration;
- deploy backend/workers, run migrations outside CI, change backend worker schedules, or activate capabilities;
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
