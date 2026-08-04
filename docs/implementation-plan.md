# Smart Fitness Active Implementation Plan

Updated: 2026-08-04

This is the canonical cross-repository execution plan for:

- mobile: `hon4olo/smart-fitness-app`;
- backend: `hon4olo/smart-fitness-backend`.

Detailed provider and release-readiness evidence remains in `docs/roadmap/provider-readiness.md`. Historical implementation evidence remains in merged pull requests and focused architecture documents.

## Verified baseline

Verified before the first P9-C analytics-activation source slice:

- mobile `main`: `33ffa5b0d548209ac50a4c1d40eb442627fea64c`;
- backend `main`: `c3ccf43ffc8bd0c2c82ade824b1d8963398e1caa`;
- no open mobile or backend pull requests before this source slice;
- backend PRs #143-#152 complete the conflict-resolution, replay, Promise-lint, rollback and multi-instance correctness boundary;
- mobile PRs #406, #409 and #411-#416 complete strict client-side conflict resolution and uncertain-response replay;
- mobile PRs #418-#421 complete generated state-model, privacy-safe diagnostics, release/rollback and bounded scheduled adversarial evidence;
- mobile PR #422 completes mobile account-data inventory and local deletion coverage;
- backend PR #153 completes the PostgreSQL technical data inventory;
- backend PR #154 completes the first operational-retention registry and hardens structured-log redaction;
- backend PR #156 completes durable PostgreSQL account-deletion receipts, atomic account deletion and secret-protected uncertain-response status recovery;
- mobile PR #425 completes receipt persistence, exact-identity retry/restart reconciliation and authoritative-only local cleanup;
- backend PR #157 completes the bounded source purge path and PostgreSQL evidence for expired deletion receipts;
- mobile PR #426 records P9-B2 source completion and moves unresolved provider/environment lifecycle evidence to P9-B3;
- all public provider-backed capabilities remain disabled;
- no analytics/crash/attribution/advertising SDK, telemetry upload or production event collection is active;
- no provider/staging execution, deployment, migration outside CI, backend worker scheduling, native build, OTA/EAS publication, rollback execution, store submission, legal-hold mutation, destructive production cleanup or production activation has been performed.

Always re-check exact `main`, open pull requests, `AGENTS.md`, `PROJECT_LEARNINGS.md`, this plan, and relevant architecture/operations documents before another slice.

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

There is no remaining approved autonomous source-refactor phase. Any future provider-internals restructuring requires a new evidence-backed decision rather than continuation by default.

## Current priority order

P7 correctness, P8 release evidence, P9-A inventories, P9-B1 retention foundations and the source-level P9-B2 deletion/recovery boundary are complete. P9-B3 requires exact external provider/environment evidence; while those inputs remain unavailable, fail-closed P9-C source prerequisites are active.

1. **P9-B3 — Retention blocker closure.** Replace `unset_blocker` entries only with provider/environment-specific evidence for maximum lifetime, access, expiry/deletion and failure monitoring. Do not fabricate guarantees for unselected infrastructure. Provider accounts, credentials, deployment, worker scheduling and real cleanup remain direct-authorization actions.
2. **P9-C — Consent and analytics prerequisites.** Keep analytics activation blocked while defining purpose, user choice or other lawful basis, withdrawal where applicable, minimization, access, retention, deletion, provider and disclosure requirements. Do not add an SDK, event upload or tracking identifier.
3. **P9-D — Privacy-facing controls and policy evidence.** Specify access/export, account-deletion status, retention disclosures and technical evidence for legal/policy review. Source completion alone is not legal approval.

P9-B3 can advance only for an exact selected provider/environment with reviewed evidence. Independent source-only P9-C or P9-D work may proceed only when it remains provider-neutral, fail closed and does not imply provider approval or production activation.

A broader audit of retryable non-sync writes may proceed in independent focused slices, but it must not displace the active order unless it exposes a defect in a currently used contract.

P6 real provider/staging evidence remains authorization-gated and does not block autonomous source work.

## Completed phases

### P0-P5

Source-complete for provider-neutral capability contracts, private storage/delivery adapters, worker entrypoints, classifier/OCR adapters, moderation calibration tooling and password reset across backend/mobile source boundaries.

Operational activation still depends on explicitly authorized credentials, infrastructure, deployment, staging, DNS/domain, native-build and device evidence.

### P6 — Provider and staging readiness

Source-complete through backend PR #142. The remaining real isolated non-production evidence run requires direct authorization and complete operational ownership, credentials, quota, fixture, retention, rollback and stop-condition inputs. Do not perform that action autonomously.

## P7 — Explicit sync-conflict resolution and focused hardening — complete

Backend source through PR #152 proves authenticated ownership, exact revisions, user-scoped idempotency, advisory-lock/compare-and-set serialization, complete transaction rollback, committed-response-loss replay, type-aware Promise correctness and equivalent delivery through independent Fastify/PostgreSQL instances.

Mobile source through PR #416 proves strict response parsing, immutable persisted intent, bounded submission/reconciliation, explicit localized confirmation, authoritative terminal cleanup and uncertain-response restart replay with the same idempotency identity.

Entity deletion remains a revisioned tombstone rather than physical row removal. The mobile never chooses automatically, synthesizes pull state from a resolution response, or renders payloads, entity IDs, revisions, idempotency keys, ownership IDs or raw backend errors.

Focused evidence remains in `docs/architecture/sync-conflict-resolution-mobile-intent.md`.

## P8 — Diagnostics and adversarial release preparation — complete

### P8-A through PR #418

Generated state-machine sequences cover deterministic commands, two-user isolation, model-versus-store comparison, shrinking/seed reporting, stable identity and terminal-only removal.

### P8-B through PR #419

The versioned `support_diagnostics_snapshot` records exact immutable source provenance and bounded release/aggregate sync metadata. Email, tokens, ownership IDs, payloads, health values and nutrition text are excluded. Default retention is zero with no upload or analytics activation.

Architecture evidence remains in `docs/architecture/privacy-safe-support-diagnostics.md`.

### P8-C through PR #420

The source gate requires exact release/rollback SHAs, rollback ancestry, Expo/source equality, package/scheme/runtime/channel/app-link parity, backend migration/startup evidence, bounded artifacts and fail-closed stop conditions. The manual release gate was not executed.

### P8-D through PR #421

The weekly/manual workflow runs bounded deterministic mobile model sequences and focused PostgreSQL retry, response-loss, multi-instance, idempotency and rollback invariants against exact source SHAs. It uses disposable CI infrastructure and no automatic retry that could conceal flakes.

Architecture evidence remains in `docs/architecture/bounded-adversarial-validation.md`.

## P9 — Privacy, retention, deletion and analytics prerequisites

### P9-A — Technical data inventory — complete through mobile PR #422 and backend PR #153

Mobile evidence includes an executable inventory for account-linked AsyncStorage/SecureStore surfaces, an authoritative deletion-key registry, coverage of every exported persistent key, resumable cleanup and correction of omitted conflict-intent/local-diagnostics deletion.

Backend evidence includes an executable registry covering every PostgreSQL table exactly once with purpose, ownership, retention, deletion, transmission, user-control and exceptional-retention metadata.

Evidence remains in:

- `docs/privacy/mobile-account-data-inventory.md`;
- backend `docs/privacy/backend-data-inventory.md`.

These inventories are technical controls, not public privacy notices or legal-compliance determinations.

### P9-B1 — Operational retention foundation — complete through backend PR #154

Merged behavior:

- machine-readable registry for application/reverse-proxy logs, backups, private media/CDN, email, model/moderation/classifier/OCR providers, food cache, CI/release artifacts, support exports, review evidence and incident copies;
- owner, purpose, allowed/forbidden data, access, retention, deletion, failure evidence, account-deletion relationship and source evidence per surface;
- explicit `unset_blocker` state for unknown infrastructure/provider guarantees;
- source-enforced 3-day backend failure artifacts, 30-day release evidence and zero default support-diagnostic retention;
- account-linked lifecycle classification for quarantine, normalized masters and delivery derivatives;
- Fastify/Pino redaction for authorization/cookies, request/response bodies, passwords, tokens, hashes and API/provider keys;
- deterministic proof that representative credentials and fitness payloads do not appear in structured output.

Evidence remains in backend `docs/privacy/operational-retention-contracts.md`.

The registry does not authorize any blocked provider or infrastructure. `record_expiry` source fields do not prove that external bytes are deleted until the selected provider and deployed worker produce evidence.

### P9-B2 — Cross-surface account deletion — source-complete through backend PRs #156/#157 and mobile PR #425

Merged source behavior:

- authenticated password verification precedes destructive work;
- managed private-origin and delivery-derivative cleanup runs before database deletion and fails closed when storage/delivery is unavailable;
- active account-linked legal holds block deletion with bounded status rather than being removed or bypassed;
- the durable PostgreSQL receipt stores an opaque request UUID and a SHA-256 status-secret hash, never the raw secret;
- receipt transition, user deletion with database cascades and terminal `completed` state occur in one transaction;
- a secret-protected status endpoint recovers a committed result after a lost final HTTP response without requiring the deleted session;
- mobile persists the receipt identity in SecureStore before DELETE, reuses it across retry/restart and checks status before cached-session restoration;
- `pending`, `blocked`, offline, malformed status, missing/expired receipt and ordinary `401` never authorize local account-data deletion;
- authoritative `completed` status starts resumable local account/auth cleanup, and the receipt secret remains until terminal local cleanup;
- expired backend receipts have a deterministic bounded source purge command, exact expiry recheck, aggregate-only output, retry-safe no-op behavior and focused PostgreSQL CI evidence.

Evidence remains in:

- `docs/privacy/mobile-account-data-inventory.md`;
- backend `docs/privacy/account-deletion-receipts.md`;
- backend `docs/privacy/operational-retention-contracts.md`.

This is source completion, not production cleanup proof. Provider/cache retention, external review-export destinations, logs, backups, object-storage/CDN lifecycle evidence and worker scheduling remain activation-blocked under P9-B3. No real object/provider deletion, legal-hold mutation, production migration, deployment or purge execution was performed.

### P9-B3 — Retention blocker closure — active, provider/environment evidence required

The operational registry remains fail closed for unresolved application/reverse-proxy logs, backups, object storage/CDN, email, model/moderation/classifier/OCR providers, food-provider cache, review exports and incident-copy handling.

A blocker may be removed only for an exact selected provider/environment after recording and testing:

- maximum lifetime and data region where applicable;
- access roles and support/subprocessor access;
- deletion, expiry or lifecycle mechanism;
- failure monitoring and retained evidence;
- account-deletion and environment-retirement behavior;
- legal-hold or incident exception scope and bounded expiry.

Do not replace `unset_blocker` with assumptions, marketing claims or generic provider documentation. No provider account, credentials, deployment, scheduling or production action is authorized by this plan.

### P9-C — Consent and analytics prerequisites — active, analytics disabled

The first source slice establishes a machine-readable fail-closed activation contract covering product usage, crash diagnostics, performance telemetry, marketing attribution and advertising/cross-app tracking.

Current contract:

- every analytics-adjacent surface is disabled;
- provider is `null`, collection/upload are `none` and retention is `zero`;
- activation evaluation always returns blocked prerequisites;
- exact purpose, versioned event schema, policy/legal choice decision, withdrawal where applicable, minimization, access, retention/deletion, provider/region, account-deletion integration, security/incident controls and user disclosures are required before activation;
- secrets, direct identity, advertising identifiers, raw health/fitness/recovery/workout/nutrition values, free text, sync payloads, private object keys, precise location and hidden model reasoning are forbidden analytics classes;
- repository tests reject known analytics, crash, attribution and advertising SDK markers in package and Expo configuration surfaces.

Evidence remains in `docs/privacy/analytics-consent-prerequisites.md`.

This is an activation guard, not analytics implementation. No SDK, event, tracking identifier, consent prompt, backend ingestion route, provider account, credential or upload is introduced. Further P9-C work may define a closed event-schema review mechanism and consent-state architecture, but must keep all collection disabled until policy and provider evidence are approved.

### P9-D — Privacy-facing controls and policy evidence — planned

Planned work includes technical requirements for data access/export, deletion status/retry presentation, retention disclosures, moderation/media exceptional-retention explanations and evidence suitable for legal/policy review.

## Permanent authorization boundaries

Do not perform any of the following without a direct user request for that exact action:

- create or change provider accounts, credentials, secrets, buckets, CDN distributions, DNS, sender domains or callback configuration;
- deploy backend/workers, run migrations outside CI, change backend worker schedules or activate capabilities;
- execute real staging/provider smoke scenarios;
- perform native builds, install builds on devices, publish OTA/EAS updates, submit stores, execute rollback or activate production;
- use production user data, unrelated staging data or unbounded/global worker selection for synthetic evidence;
- run destructive rollback, down migration, production data deletion, legal-hold removal, audit deletion, object deletion or generic credential revocation.

## Validation policy for every source PR

- start from current exact `main`;
- keep one coherent slice and preserve public contracts unless explicitly changed;
- maintain repository and changed-file line limits;
- add deterministic tests for changed behavior and failure paths;
- run complete repository CI on the exact final head;
- inspect review threads, reviews and comments;
- merge only the exact green head;
- update this plan when phase status or the ordered backlog changes.
