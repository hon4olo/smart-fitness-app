# Smart Fitness Active Implementation Plan

Updated: 2026-08-04

This is the canonical cross-repository execution plan for:

- mobile: `hon4olo/smart-fitness-app`;
- backend: `hon4olo/smart-fitness-backend`.

Detailed provider and release-readiness evidence remains in `docs/roadmap/provider-readiness.md`. Historical implementation evidence remains in merged pull requests and focused architecture documents.

## Verified baseline

Verified after the P9-A technical data-inventory slices:

- mobile `main`: `78cbb5f5e0bb59d13f2c4f7f019e255c22e2fd16`;
- backend `main`: `0a99bd1cba3bccd83435ebfd8c5fbf32d7bd5cb3`;
- no open mobile or backend pull requests before this roadmap update;
- backend PRs #143-#152 complete the current conflict-resolution, replay, Promise-lint, rollback, and multi-instance correctness boundary;
- mobile PRs #406, #409, and #411-#416 complete the strict client, safe candidate, durable intent, submission, reconciliation, confirmation UI, and uncertain-response replay boundaries;
- mobile PR #418 completes bounded generated conflict-intent model sequences;
- mobile PR #419 completes privacy-safe support diagnostics and exact source provenance;
- mobile PR #420 completes exact release/rollback source evidence;
- mobile PR #421 completes bounded weekly/manual adversarial validation;
- mobile PR #422 completes the account-linked mobile persistence inventory and fixes local account-deletion coverage;
- backend PR #153 completes the PostgreSQL technical data inventory and exposes the remaining non-table retention/deletion work;
- all public provider-backed capabilities remain disabled;
- no provider/staging execution, deployment, migration outside CI, backend worker scheduling, native build, OTA/EAS publication, rollback execution, store submission, legal-hold mutation, destructive cleanup, or production activation has been performed.

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

P7 correctness, P8 release evidence, and P9-A table/mobile persistence inventory are complete. The active order is now operational retention and cross-surface deletion before analytics or broader instrumentation.

1. **P9-B1 — Operational retention contracts.** Define bounded owners, fields, maximum durations, access, expiry, deletion and failure evidence for application/reverse-proxy logs, backups, object storage/CDN, email, provider requests/caches, CI artifacts, support exports, reviewer evidence and incident copies.
2. **P9-B2 — Cross-surface account deletion.** Map and prove deletion/retry/recovery across PostgreSQL, mobile persistence, object storage, provider/cache surfaces and authorized exceptional retention without performing destructive production actions.
3. **P9-C — Consent and analytics prerequisites.** Define purpose, consent/withdrawal where required, minimization, redaction, access, retention and deletion before any analytics SDK, telemetry upload or production instrumentation.
4. **P9-D — Privacy-facing controls and policy evidence.** Specify export/access, account deletion status, retention disclosures and technical evidence for legal/policy review. Source completion alone is not legal approval.

A broader audit of retryable non-sync writes may proceed in independent focused slices, but it must not displace the active order unless it exposes a defect in a currently used contract.

P6 real provider/staging evidence remains authorization-gated and does not block autonomous source work.

## Completed phases

### P0-P5

Source-complete for provider-neutral capability contracts, private storage/delivery adapters, worker entrypoints, classifier/OCR adapters, moderation calibration tooling, and password reset across backend/mobile source boundaries.

Operational activation still depends on explicitly authorized credentials, infrastructure, deployment, staging, DNS/domain, native-build, and device evidence.

### P6 — Provider and staging readiness

Source-complete through backend PR #142.

Implemented source boundaries include strict staging-only plans and exact-SHA confirmation, synthetic authentication/cleanup, private quarantine/moderation/delivery/recovery/expiry, password-reset staging composition, and consolidated stop/rollback guidance.

The remaining P6 action is a real isolated non-production evidence run. It requires direct authorization and complete operational ownership, credentials, quota, fixture, retention, rollback, and stop-condition inputs. Do not perform that action autonomously.

## P7 — Explicit sync-conflict resolution and focused hardening

### Backend correctness — complete through PR #152

The backend proves authenticated ownership, exact revisions, user-scoped idempotency, advisory-lock and compare-and-set serialization, complete transaction rollback, committed-response-loss replay, type-aware Promise correctness, and equivalent delivery through independent Fastify instances/PostgreSQL pools.

Entity deletion remains a revisioned tombstone rather than physical row removal. Do not add mechanical `FOR UPDATE` requirements where an atomic statement, compare-and-set, advisory lock, or database constraint already expresses the invariant. `AsyncLocalStorage` remains request/trace context propagation, not a race detector.

### Mobile correctness and presentation — complete through PR #416

The mobile has strict response parsing, persisted immutable resolution intent, bounded submission/reconciliation, explicit localized confirmation, terminal cleanup only after authoritative materialization, and uncertain-response restart replay with the same idempotency identity.

The mobile never chooses automatically, never synthesizes pull state from a resolution response, and never renders payloads, entity IDs, revisions, idempotency keys, ownership IDs, or raw backend errors.

Focused evidence remains in `docs/architecture/sync-conflict-resolution-mobile-intent.md`. Physical second-device and matching standalone-runtime validation remain release-device evidence rather than source-completion claims.

## P8 — Diagnostics and adversarial release preparation — complete

### P8-A — Generated state-machine sequences — complete through PR #418

Blocking evidence covers reproducible generated commands, two-user isolation, model-versus-store comparison after every command, deterministic shrinking/seed reporting, stable identity and terminal-only removal.

### P8-B — Privacy-safe diagnostics and exact provenance — complete through PR #419

The versioned `support_diagnostics_snapshot` records exact immutable source provenance and bounded release/aggregate sync metadata. Explicit field construction and tests exclude email, tokens, ownership IDs, payloads, health values and nutrition text. Default retention is zero; there is no persistence, upload or analytics activation.

Architecture evidence remains in `docs/architecture/privacy-safe-support-diagnostics.md`.

### P8-C — Release and rollback gates — complete through PR #420

The source gate requires exact full release and rollback SHAs, rollback ancestry, Expo/source equality, package/scheme/runtime/channel/app-link parity, current backend disabled-capability and migration/startup evidence, bounded artifacts and fail-closed operator stop conditions.

The manual release gate was not executed. Native builds, publication, deployment, rollback execution and production activation remain authorization-gated.

### P8-D — Bounded scheduled adversarial validation — complete through PR #421

The weekly/manual workflow runs expanded deterministic mobile model sequences and focused PostgreSQL retry, response-loss, multi-instance, idempotency and rollback invariants against exact source SHAs. It uses disposable CI infrastructure, bounded seed/runtime ranges, explicit retention and no automatic retries that could conceal flakes.

Architecture evidence remains in `docs/architecture/bounded-adversarial-validation.md`. k6, Toxiproxy and virtual-user load remain deferred until deterministic oracles and repeated runtime/flake evidence justify them.

## P9 — Privacy, retention, deletion and analytics prerequisites

### P9-A — Technical data inventory — complete through mobile PR #422 and backend PR #153

Mobile evidence:

- executable inventory for account-linked AsyncStorage/SecureStore surfaces, purpose, transmission, deletion and user control;
- authoritative account-scoped key registry used by local deletion;
- contract coverage of every exported persistent storage key;
- resumable deletion after backend-confirmed account removal;
- correction of two real omissions: persisted conflict-resolution intent and aggregate local-state diagnostics;
- tokenless cached session metadata separated from native SecureStore tokens.

Evidence remains in `docs/privacy/mobile-account-data-inventory.md`.

Backend evidence:

- executable registry covering every current PostgreSQL table exactly once;
- explicit account-owned, mixed policy-controlled and service-shared classifications;
- purpose, retention, deletion, transmission and user-control metadata;
- raw-provider/hidden-reasoning minimization for Coach and moderation/media records;
- explicit legal-hold expiry requirements and shared-catalog separation;
- documented non-table gaps for logs, backups, object storage/CDN, providers, support/review evidence and incident copies.

Evidence remains in backend `docs/privacy/backend-data-inventory.md`.

The inventory is a technical control, not a public privacy notice or legal-compliance determination.

### P9-B — Operational retention and deletion — active

The first focused source slice should define a machine-readable retention registry for non-table surfaces with:

- exact surface and responsible owner;
- allowed data classes and forbidden fields;
- purpose and access boundary;
- maximum retention or explicit zero-retention requirement;
- expiry/deletion mechanism and retry/failure evidence;
- account-deletion relationship;
- provider/legal-hold exception boundaries;
- deterministic completeness tests against documented operational surfaces.

Do not invent production retention guarantees that the current infrastructure cannot enforce. Unknown values must remain explicit blockers or policy decisions rather than fabricated commitments.

### P9-C — Consent and analytics prerequisites — planned

No analytics SDK, telemetry upload, tracking identifier or production event collection may be introduced before approved purpose, consent/withdrawal where required, minimization/redaction, access control, retention and deletion contracts exist.

### P9-D — Privacy-facing controls and policy evidence — planned

Planned work includes technical requirements for data access/export, deletion status/retry presentation, retention disclosures, moderation/media exceptional-retention explanations, and evidence suitable for legal/policy review.

## Permanent authorization boundaries

Do not perform any of the following without a direct user request for that exact action:

- create or change provider accounts, credentials, secrets, buckets, CDN distributions, DNS, sender domains, or callback configuration;
- deploy backend/workers, run migrations outside CI, change backend worker schedules, or activate capabilities;
- execute real staging/provider smoke scenarios;
- perform native builds, install builds on devices, publish OTA/EAS updates, submit stores, execute rollback, or activate production;
- use production user data, unrelated staging data, or unbounded/global worker selection for synthetic evidence;
- run destructive rollback, down migration, production data deletion, legal-hold removal, audit deletion, object deletion, or generic credential revocation.

## Validation policy for every source PR

- start from current exact `main`;
- keep one coherent slice and preserve public contracts unless explicitly changed;
- maintain repository and changed-file line limits;
- add deterministic tests for changed behavior and failure paths;
- run complete repository CI on the exact final head;
- inspect review threads, reviews, and comments;
- merge only the exact green head;
- update this plan when phase status or the ordered backlog changes.
