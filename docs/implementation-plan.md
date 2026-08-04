# Smart Fitness Active Implementation Plan

Updated: 2026-08-04

This is the canonical cross-repository execution plan for:

- mobile: `hon4olo/smart-fitness-app`;
- backend: `hon4olo/smart-fitness-backend`.

Detailed provider and release-readiness evidence remains in `docs/roadmap/provider-readiness.md`. Historical implementation evidence remains in merged pull requests and focused architecture documents.

## Verified baseline

Verified after the first P9-B operational-retention slice:

- mobile `main`: `e65c18d5ea570949e699a7cd767f4c4447f94c01`;
- backend `main`: `80faac750f54868cd7b6cabd1b91314088e5f949`;
- no open mobile or backend pull requests before this roadmap update;
- backend PRs #143-#152 complete the conflict-resolution, replay, Promise-lint, rollback and multi-instance correctness boundary;
- mobile PRs #406, #409 and #411-#416 complete strict client-side conflict resolution and uncertain-response replay;
- mobile PRs #418-#421 complete generated state-model, privacy-safe diagnostics, release/rollback and bounded scheduled adversarial evidence;
- mobile PR #422 completes mobile account-data inventory and local deletion coverage;
- backend PR #153 completes the PostgreSQL technical data inventory;
- backend PR #154 completes the first operational-retention registry and hardens structured-log redaction;
- all public provider-backed capabilities remain disabled;
- no provider/staging execution, deployment, migration outside CI, backend worker scheduling, native build, OTA/EAS publication, rollback execution, store submission, legal-hold mutation, destructive cleanup or production activation has been performed.

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

P7 correctness, P8 release evidence, P9-A inventories and the P9-B1 retention registry are complete. The active order is cross-surface deletion/recovery before analytics or broader instrumentation.

1. **P9-B2 — Cross-surface account deletion.** Define and prove a fail-closed deletion plan across PostgreSQL, mobile persistence, private object storage/CDN, provider/cache surfaces, review evidence and authorized exceptional retention. Include retry, idempotency, recovery, completion evidence and user-visible status without executing destructive production actions.
2. **P9-B3 — Retention blocker closure.** Replace `unset_blocker` entries only with provider/environment-specific evidence for maximum lifetime, access, expiry/deletion and failure monitoring. Do not fabricate guarantees for unselected infrastructure.
3. **P9-C — Consent and analytics prerequisites.** Define purpose, consent/withdrawal where required, minimization, redaction, access, retention and deletion before any analytics SDK, telemetry upload or production instrumentation.
4. **P9-D — Privacy-facing controls and policy evidence.** Specify access/export, account-deletion status, retention disclosures and technical evidence for legal/policy review. Source completion alone is not legal approval.

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

### P9-B2 — Cross-surface account deletion — active

The next source slice must define a versioned deletion plan with explicit steps and dependencies for:

- authenticated PostgreSQL account deletion;
- mobile account/auth cleanup and durable restart marker;
- private quarantine, normalized-master and delivery-derivative cleanup;
- cache/provider deletion or bounded exceptional retention;
- review/evidence export handling;
- legal-hold stop conditions;
- retry/idempotency, completion criteria and partial-failure recovery;
- privacy-safe user/support status without raw object keys, provider payloads or credentials.

The plan must fail closed when an account-linked operational surface has no deletion mechanism. It must not execute real object/provider deletion, remove legal holds or claim completed production cleanup.

### P9-C — Consent and analytics prerequisites — planned

No analytics SDK, telemetry upload, tracking identifier or production event collection may be introduced before approved purpose, consent/withdrawal where required, minimization/redaction, access control, retention and deletion contracts exist.

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
