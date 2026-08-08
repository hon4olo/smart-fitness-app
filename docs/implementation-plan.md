# Smart Fitness Active Implementation Plan

Updated: 2026-08-08

This is the canonical cross-repository execution plan for:

- mobile: `hon4olo/smart-fitness-app`;
- backend: `hon4olo/smart-fitness-backend`.

Provider and release-readiness evidence remains in `docs/roadmap/provider-readiness.md`. Detailed architecture, privacy and operational evidence remains in focused documents and merged pull requests.

## Verified baseline

Verified after backend PR #191 and mobile PR #456:

- mobile `main` before this roadmap-sync slice: `0d0901acd76e1435088c9b88bb28bb86a769e8f0`;
- backend `main`: `203887655ef93c268b06db85ef03dcd4de272228`;
- backend PR #190 completed the ownership-safe `social_relationships_and_account_activity` source/projection;
- backend PR #191 added deterministic source-only multi-surface assembly for all seven complete candidate projections;
- mobile PR #456 optimized CI runner allocation without changing product/runtime behavior;
- no open mobile or backend pull requests existed before this roadmap-sync branch was created;
- all public provider-backed capabilities remain disabled;
- analytics, crash reporting, performance telemetry, attribution and advertising collection remain disabled;
- no production analytics event or measurement purpose is registered;
- the default production composition still has no data-access export endpoint;
- no provider/staging execution, deployment, production migration execution, backend worker scheduling, native build, OTA/EAS publication, rollback execution, store submission, legal-hold mutation, destructive production cleanup or production activation was performed by the completed P9-D source slices.

Always re-check exact `main`, open pull requests, `AGENTS.md`, `PROJECT_LEARNINGS.md`, this plan and relevant architecture/operations documents before another source slice.

## Engineering progress estimate

Weighted by roadmap work packages rather than pull-request count or lines changed:

- completed: approximately **90%**;
- remaining: approximately **10%**.

This is an engineering planning estimate, not a release-readiness or legal-compliance certification.

| Work package | Current state |
| --- | --- |
| P0-P5 provider-neutral foundations | source-complete |
| P6 provider/staging readiness | source-complete; real isolated evidence authorization-gated |
| P7 explicit sync-conflict resolution | complete |
| P8 diagnostics and adversarial release preparation | complete |
| P9-A technical data inventory | complete |
| P9-B1 operational retention foundation | complete |
| P9-B2 cross-surface account deletion | source-complete |
| P9-B3 provider/environment retention evidence | active; externally blocked |
| P9-C consent and analytics prerequisites | active; provider-neutral source guards substantially complete, collection disabled |
| P9-D privacy-facing controls and policy evidence | active; seven complete candidate projections plus deterministic source-only assembly complete; audit/idempotency is next |

The remaining estimate is concentrated in exact provider/environment evidence, policy/legal decisions, export audit/idempotency and delivery semantics, product integration, localization/accessibility and physical release evidence.

## Product and architecture baseline

Smart Fitness remains an Expo / React Native offline-first application backed by the existing Fastify/PostgreSQL service.

Approved boundaries:

- the single AsyncStorage `AppState` snapshot remains the accepted local persistence architecture;
- private data remains revision-aware through explicit revisions, idempotency keys, tombstones, retry contracts and persisted conflicts;
- mobile owns offline interaction, explicit user choices and local recovery presentation;
- backend owns authenticated authority, atomic conflict resolution, durable idempotency and authoritative revisions;
- Coach flows remain deterministic, structured and explicit-confirmation based;
- Social and managed media remain server-authoritative and separate from private `AppState` synchronization;
- provider credentials and provider calls remain backend-only;
- unavailable provider-backed operations remain hidden or fail closed;
- no production screen may consume the full compatibility `AppContext` boundary.

The reviewed local-state evidence remains canonical in `docs/architecture/local-state-performance-decision.md`. The focused context boundary remains recorded in `docs/architecture/app-context-consumer-inventory.md`.

There is no remaining approved autonomous source-refactor phase. Future restructuring requires a new evidence-backed decision rather than continuation by default.

## Current priority order

1. **P9-B3 — Retention blocker closure.** Replace `unset_blocker` entries only with exact selected-provider/environment evidence for maximum lifetime, access, expiry/deletion and failure monitoring. Provider accounts, credentials, deployment, worker scheduling and real cleanup remain direct-authorization actions.
2. **P9-C — Consent and analytics prerequisites.** Keep all collection disabled. Remaining work requires policy/legal decisions, exact provider evidence, persistence/ownership decisions, reviewed disclosures and eventual product integration. Do not add an SDK, production event, tracking identifier or upload route while activation remains blocked.
3. **P9-D — Privacy-facing controls and policy evidence.** Preserve the seven complete ownership-safe candidate projections and deterministic source-only assembler. The next safe source package is **export auditability and idempotency semantics**. Do not activate the optional route, integrate preparation into assembly, generate archives or add delivery/UI in that package.
4. **Operational and physical evidence.** Execute staging/provider checks, release-device validation, worker scheduling, deployment and lifecycle proof only after explicit authorization and complete ownership inputs.

P9-B3 can advance only for an exact selected provider/environment. Independent P9-C or P9-D work may proceed only when provider-neutral, fail closed and not presented as legal approval or production activation.

P6 real provider/staging evidence remains authorization-gated and does not block bounded source-only work.

## Completed phases

### P0-P5 — source-complete

Provider-neutral capability contracts, private storage/delivery adapters, worker entrypoints, classifier/OCR adapters, moderation calibration tooling and password reset are source-complete across backend/mobile boundaries.

Operational activation still depends on explicitly authorized credentials, infrastructure, deployment, staging, DNS/domain, native-build and device evidence.

### P6 — provider and staging readiness

Source-complete through backend PR #142. The remaining isolated non-production evidence run requires direct authorization plus operational ownership, credentials, quota, fixtures, retention, rollback and stop-condition inputs.

### P7 — explicit sync-conflict resolution and focused hardening — complete

Backend source through PR #152 proves authenticated ownership, exact revisions, user-scoped idempotency, advisory-lock/compare-and-set serialization, complete transaction rollback, committed-response-loss replay, type-aware Promise correctness and equivalent delivery through independent Fastify/PostgreSQL instances.

Mobile source through PR #416 proves strict response parsing, immutable persisted intent, bounded submission/reconciliation, explicit localized confirmation, authoritative terminal cleanup and uncertain-response restart replay with the same idempotency identity.

Entity deletion remains a revisioned tombstone rather than physical row removal. The mobile never chooses automatically, synthesizes pull state from a resolution response, or renders payloads, entity IDs, revisions, idempotency keys, ownership IDs or raw backend errors.

Evidence remains in `docs/architecture/sync-conflict-resolution-mobile-intent.md`.

### P8 — diagnostics and adversarial release preparation — complete

- P8-A / mobile PR #418: generated state-machine sequences, two-user isolation, model-versus-store comparison and deterministic shrinking/seed evidence.
- P8-B / mobile PR #419: privacy-safe support diagnostics with exact source provenance, bounded aggregates, zero default retention and no upload.
- P8-C / mobile PR #420: exact-SHA source release/rollback gate and fail-closed stop conditions; the manual release gate was not executed.
- P8-D / mobile PR #421: bounded scheduled/manual adversarial CI against exact source SHAs and disposable infrastructure.

Evidence remains in:

- `docs/architecture/privacy-safe-support-diagnostics.md`;
- `docs/architecture/bounded-adversarial-validation.md`.

## P9 — privacy, retention, deletion and analytics prerequisites

### P9-A — technical data inventory — complete

Mobile PR #422 provides an executable inventory for account-linked AsyncStorage/SecureStore surfaces, an authoritative deletion-key registry, complete exported-key coverage and resumable cleanup.

Backend PR #153 provides an executable PostgreSQL registry covering every table exactly once with purpose, ownership, retention, deletion, transmission, user-control and exceptional-retention metadata.

Evidence remains in:

- `docs/privacy/mobile-account-data-inventory.md`;
- backend `docs/privacy/backend-data-inventory.md`.

These are technical controls, not public privacy notices or legal determinations.

### P9-B1 — operational retention foundation — complete

Backend PR #154 adds the machine-readable registry for logs, backups, media/CDN, email, model/moderation/classifier/OCR providers, food cache, CI/release artifacts, support exports, review evidence and incident copies.

Source-enforced boundaries include:

- 3-day backend failure artifacts;
- 30-day release evidence;
- zero default support-diagnostic retention;
- structured-log secret/body redaction;
- explicit `unset_blocker` states for unknown production/provider guarantees.

Evidence remains in backend `docs/privacy/operational-retention-contracts.md`.

A source `record_expiry` field does not prove external-byte deletion until the selected provider and deployed worker produce evidence.

### P9-B2 — cross-surface account deletion — source-complete

Backend PR #156 provides password verification, managed private-origin/derivative cleanup before database deletion, legal-hold blocking, durable secret-protected deletion receipts, atomic user deletion and status recovery after lost responses.

Mobile PR #425 provides SecureStore receipt persistence, exact-identity retry/restart reconciliation and authoritative-only local cleanup.

Backend PR #157 provides deterministic bounded source purging for expired receipts and focused PostgreSQL evidence.

Mobile PR #426 records source completion and moves provider/environment lifecycle proof to P9-B3.

This remains source completion, not production cleanup proof. Provider/cache retention, logs, backups, object storage/CDN lifecycle and worker scheduling remain blocked.

### P9-B3 — retention blocker closure — active, external evidence required

Unresolved surfaces include:

- application and reverse-proxy logs;
- database backups;
- object storage and CDN;
- email delivery metadata;
- model, moderation, classifier and OCR providers;
- food-provider cache;
- review exports and incident copies.

A blocker may be removed only after recording and testing for the exact selected environment:

- maximum lifetime and region where applicable;
- operator, support and subprocessor access;
- deletion, expiry or lifecycle mechanism;
- failure monitoring and retained evidence;
- account-deletion and environment-retirement behavior;
- bounded legal-hold or incident exception scope.

Do not replace blockers with assumptions, marketing claims or generic provider documentation.

### P9-C — consent and analytics prerequisites — active, collection disabled

Mobile PR #427 establishes a fail-closed activation contract for product usage, crash diagnostics, performance telemetry, attribution and advertising/cross-app tracking.

Mobile PR #428 adds a closed versioned event/property registry:

- the production registry is empty;
- unknown events, versions, properties, types and values fail closed;
- no generic tracking escape hatch exists;
- no production event is registered.

Mobile PR #429 adds a strict purpose-scoped consent-state contract:

- the production measurement-purpose registry is empty;
- denied, withdrawn, missing, stale-version and policy-pending states remain blocked;
- even a valid synthetic grant cannot override the global activation blocker;
- no storage key, backend record, consent UI or collection path was added.

Evidence remains in:

- `docs/privacy/analytics-consent-prerequisites.md`;
- `docs/privacy/analytics-consent-state.md`.

Remaining P9-C work:

- policy/legal decision for each purpose and region;
- exact provider/region, retention, access, security and account-deletion evidence;
- consent ownership, persistence, synchronization and conflict semantics if collection is ever approved;
- refusal/withdrawal product behavior, localization, accessibility and reviewed disclosures;
- SDK/ingestion implementation only after every activation blocker is resolved and separately approved.

### P9-D — privacy-facing controls and policy evidence — active

#### Registry, preparation, route and limiter

Mobile PR #430 establishes the fail-closed data-access/export registry and structural request contract. Candidate export, notice-only and permanently excluded secret surfaces are explicit; tokens, passwords/hashes, deletion secrets, provider credentials, object keys, full idempotency keys, security material, provider payloads and hidden reasoning are excluded.

Backend PR #158 adds the corresponding fail-closed export-preparation boundary with exact table-policy coverage, strict request parsing and same-invocation current-password verification. It produces no reusable authorization proof, user identity or password.

Backend PR #159 adds a disabled-by-default authenticated route-composition boundary. Default production `createApp()` has no export endpoint. Explicit composition still produces only the bounded unavailable response.

Backend PR #160 adds durable account-scoped PostgreSQL attempt limiting. Session changes cannot reset the budget; passwords, session/token material, request bodies, selected surfaces and export contents are not persisted. Default production composition still does not inject the limiter.

Evidence remains in backend:

- `docs/privacy/data-access-export-preparation.md`;
- `docs/privacy/data-access-export-route-boundary.md`;
- `docs/privacy/data-access-export-attempt-limiter.md`.

#### Seven complete ownership-safe candidate projections

Backend source now contains seven complete candidate projections:

1. PR #161 — `profile_and_account_metadata`;
2. PR #162 — `progress_measurements_and_weight`;
3. PR #163 plus #164 contract correction — `limitations_recovery_and_safety_context`;
4. PR #165 — `nutrition_and_meal_data`;
5. PR #167 — `workouts_programs_and_exercises`;
6. PR #168 plus #169 lifecycle hardening — `coach_reviews_proposals_and_run_history`;
7. PR #190 — `social_relationships_and_account_activity`.

The projection registry has type-checked alignment guards. Projection implementations use strict allowlists, authenticated ownership, deterministic source bounds and fail-closed parsing/validation rather than raw-row serialization.

The first six non-Social projections remain documented in focused backend `docs/privacy/data-access-export-*-projection.md` evidence.

#### Social audit, policy decisions and complete projection

Backend PR #170 introduced the executable Social ownership/privacy audit. PR #171 added the bounded `social_profile_and_authored_posts` partial source. PR #172 kept managed avatar/post media in the separate `managed_media_metadata` `notice_only` / `mixed_policy_review` surface. PR #173 defined actor/target-free notification representation, and PR #174 defined a bounded notification source plan while disclosure remained blocked.

Subsequent reviewed Social decision slices resolved the remaining counterpart, target, inaccessible-record and source-bound questions required for the complete candidate projection. Backend PR #190 is the authoritative implemented result.

PR #190 complete Social behavior:

- verifies an active authenticated owner;
- uses one read-only PostgreSQL `REPEATABLE READ` transaction;
- exports only the owner's Social profile and active authored workout posts;
- exports outgoing follows, current pending outgoing follow requests and outgoing blocks without counterpart identity;
- exports owner-authored reactions and comments only when the target is currently readable;
- omits incoming follows/requests/blocks, target/counterpart identity, other-user comments, resolved request history, deleted post history, managed-media values, notification rows, internal IDs, revisions, idempotency keys, raw JSON, moderation internals and provider/operational metadata;
- fails closed above reviewed source bounds.

Received `social_notifications` are permanently excluded from the complete projection. Managed media remains a separate notice-only mixed-policy surface with no notice projection or binary export.

The earlier `social_profile_and_authored_posts` source remains valid focused evidence but no longer defines the maximum implemented Social export boundary.

#### Deterministic multi-surface assembly

Backend PR #191 adds assembly schema version 1 for the seven complete candidate projections.

The assembler:

- accepts only the seven complete `candidate_export` surface IDs;
- rejects notice-only surfaces before loader execution;
- preflights all selected loaders;
- emits selected surfaces in canonical deterministic order independent of caller order;
- invokes only selected loaders;
- validates returned projection surface IDs and schema versions;
- returns a bounded blocked result with no partial projection payload when a selected loader is unavailable, fails or returns a mismatched contract;
- does not serialize authenticated owner identifiers or repository error details.

The assembler intentionally does not claim one cross-surface PostgreSQL transaction/snapshot across the independent projection repositories.

Evidence: backend `docs/privacy/data-access-export-assembly.md`.

The assembler is not invoked by `prepareDataAccessExport` or the optional route. The standing preparation blocker is `assembly_not_integrated`.

#### Remaining P9-D work

Next bounded source package: **export auditability and idempotency semantics**.

That package should:

- define one ownership-safe export attempt/audit record contract;
- define deterministic request identity and retry semantics;
- define committed-response-loss and deterministic replay behavior;
- define bounded audit-metadata retention and account-deletion interaction;
- explicitly exclude passwords, selected projection payloads, full secrets and reusable authorization proofs;
- remain source-only and fail closed.

Keep out of that package:

- route activation;
- preparation-to-assembly integration;
- archive generation;
- object storage;
- secure delivery;
- mobile export UI;
- provider configuration;
- deployment and production execution.

Separate later P9-D concerns:

- define cross-surface snapshot consistency expectations;
- define pagination/continuation semantics;
- define maximum assembled-size limits;
- separately approve and inject the durable limiter into deployed route composition with operational monitoring/stale-row cleanup expectations;
- decide synchronous response versus secure expiring/revocable delivery and prove any selected provider lifecycle through P9-B3;
- decide whether any managed-media notice or binary export is required and implement it only after mixed-policy review;
- add mobile-local export transformation and reviewed confirmation/status UI;
- integrate deletion-status presentation with EN/RU localization and accessibility;
- complete policy/legal review and approved public wording using the evidence packet;
- validate real-device, deployed-backend and provider lifecycle behavior after authorization.

Mobile PR #431 provides the privacy-safe account-deletion status presentation contract. Mobile PR #432 provides the fail-closed retention-disclosure registry. Mobile PR #434 provides the machine-readable privacy-review evidence packet. These remain source evidence, not legal approval or production proof.

## Remaining roadmap concentration

Approximately 10% remains, primarily:

- **P9-B3 external retention evidence:** selected production/staging logs, backups, storage/CDN, email and provider lifecycle contracts;
- **P9-C activation decisions and integration:** legal/policy choices, provider evidence, consent persistence/withdrawal architecture and eventual separately approved implementation;
- **P9-D implementation and review:** seven complete candidate projections and deterministic source-only assembly are complete; audit/idempotency is next, followed by snapshot/pagination/size semantics, separately approved route composition, delivery, managed-media decisions, mobile UI/localization/accessibility and policy/legal approval;
- **operational evidence:** deployment, worker scheduling, staging/provider execution, physical device/offline/second-device validation and release proof.

Source guards and preparation boundaries reduce implementation risk, but they cannot substitute for exact infrastructure evidence, legal/policy decisions or authorized production operations.

## Permanent authorization boundaries

Do not perform any of the following without a direct user request for that exact action:

- create or change provider accounts, credentials, secrets, buckets, CDN distributions, DNS, sender domains or callback configuration;
- deploy backend/workers, run migrations outside CI, change worker schedules or activate capabilities;
- activate the export route or preparation-to-assembly composition;
- execute real staging/provider smoke scenarios;
- perform native builds, install builds, publish OTA/EAS updates, submit stores, execute rollback or activate production;
- use production user data, unrelated staging data or unbounded/global worker selection for synthetic evidence;
- run destructive rollback, down migration, production data deletion, legal-hold removal, audit deletion, object deletion or generic credential revocation.

## Validation policy for every source PR

- start from exact current `main`;
- keep one coherent slice and preserve public contracts unless explicitly changed;
- maintain repository and changed-file line limits;
- add deterministic tests for changed behavior and failure paths;
- run complete repository CI on the exact final head;
- inspect review threads, reviews and comments;
- merge only the exact green head;
- update this plan when phase status or ordered backlog changes.
