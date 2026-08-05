# Smart Fitness Active Implementation Plan

Updated: 2026-08-05

This is the canonical cross-repository execution plan for:

- mobile: `hon4olo/smart-fitness-app`;
- backend: `hon4olo/smart-fitness-backend`.

Provider and release-readiness evidence remains in `docs/roadmap/provider-readiness.md`. Detailed architecture, privacy and operational evidence remains in the focused documents and merged pull requests referenced below.

## Verified baseline

Verified after the current provider-neutral P9-C/P9-D source sequence:

- mobile `main`: `6df2278614b296e782e4edffb6b4895e7176f3a6`;
- backend `main`: `ccea35967516b168e877e8803a8dd3c7c40c973d`;
- no open mobile or backend pull requests before this roadmap-sync slice;
- all public provider-backed capabilities remain disabled;
- analytics, crash reporting, performance telemetry, attribution and advertising collection remain disabled;
- no production analytics event or measurement purpose is registered;
- the default production composition has no data-access export endpoint; an optional source-only route boundary, durable PostgreSQL attempt limiter and six ownership-safe allowlisted projections exist, but they are not composed by default and no multi-surface assembly, archive generation or delivery path exists;
- no provider/staging execution, deployment, migration outside CI, backend worker scheduling, native build, OTA/EAS publication, rollback execution, store submission, legal-hold mutation, destructive production cleanup or production activation has been performed.

Always re-check exact `main`, open pull requests, `AGENTS.md`, `PROJECT_LEARNINGS.md`, this plan and the relevant architecture/operations documents before another source slice.

## Engineering progress estimate

Weighted by roadmap work packages rather than pull-request count or lines changed:

- completed: approximately **89%**;
- remaining: approximately **11%**.

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
| P9-C consent and analytics prerequisites | active; provider-neutral source guards substantially complete |
| P9-D privacy-facing controls and policy evidence | active; source contracts, route boundary, durable limiter and first six ownership-safe projections defined |

The remaining estimate is concentrated in exact provider/environment evidence, policy/legal decisions, real backend export implementation, product integration, localization/accessibility and physical release evidence.

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
3. **P9-D — Privacy-facing controls and policy evidence.** Extend ownership-safe allowlisted projections to the remaining selected surfaces, define multi-surface assembly plus audit/idempotency and continue deletion-status/reviewed-disclosure work. The durable limiter and first six projections exist in source, but the optional route remains disabled by default pending separate deployed-composition approval; secure delivery, UI integration and public policy text remain separate reviewed slices.
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

Evidence remains in:

- `docs/privacy/mobile-account-data-inventory.md`;
- backend `docs/privacy/account-deletion-receipts.md`;
- backend `docs/privacy/operational-retention-contracts.md`.

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

Mobile PR #430 establishes a fail-closed data-access/export registry and structural request contract:

- candidate export, notice-only and permanently excluded secret surfaces are explicit;
- tokens, passwords/hashes, deletion secrets, provider credentials, object keys, full idempotency keys, security material, provider payloads and hidden reasoning are excluded;
- no export API, worker, query, UI, archive or delivery path exists;
- identity verification, authoritative source mapping, minimization, provider disposition, secure delivery, audit and policy blockers were explicitly recorded for backend follow-up.

Evidence: `docs/privacy/data-access-export-requirements.md`.

Backend PR #158 adds the corresponding fail-closed export-preparation boundary:

- every table in the executable backend inventory maps exactly once to `candidate_export`, `notice_only`, `excluded_secret` or `not_account_scoped`;
- selectable backend surfaces align with mobile `json_v1` identifiers;
- sessions, password-reset tokens and account-deletion receipts are not selectable export sources;
- password/token hashes, deletion secrets, raw sync payloads, full idempotency keys, private object keys, provider payloads, hidden reasoning and mixed-policy internals are explicit exclusions;
- a strict request parser and same-invocation injected current-password verifier are defined;
- no reusable authorization proof, user identity or password appears in the preparation result;
- every successfully re-verified request remains blocked because complete multi-surface assembly, audit records, route-level limiter integration, mobile companion data and secure delivery are not implemented;
- no route, repository query, migration, archive, delivery or production-data operation was added.

Evidence: backend `docs/privacy/data-access-export-preparation.md`.

Backend PR #159 adds a disabled-by-default authenticated route-composition boundary:

- `POST /v1/privacy/data-access/export/prepare` is registered only when an explicit attempt-guard dependency is injected;
- default production `createApp()` has no endpoint and returns `404`;
- auth and strict structural validation precede attempt consumption;
- the injected guard must fail closed and rate-limit before current-password verification;
- user identity comes only from the authenticated session;
- invalid credentials use the existing bounded auth error;
- valid re-verification still returns only `409 DATA_EXPORT_NOT_AVAILABLE` with no table names, internal issue codes, identifiers, passwords or secret-class labels;
- no production limiter, route activation, export repository, query, audit record, archive or delivery path was added.

Evidence: backend `docs/privacy/data-access-export-route-boundary.md`.

Backend PR #160 adds the durable source implementation required by the route attempt-guard contract:

- one compact PostgreSQL row is stored per authenticated account and policy;
- the fixed source policy permits five preparation attempts per 15-minute window and caps persisted denied state at six;
- atomic `INSERT ... ON CONFLICT DO UPDATE ... RETURNING` consumption is shared across independent backend instances;
- changing sessions cannot reset the account-scoped budget;
- the same row resets when the fixed window changes and cascades on account deletion;
- passwords, session/token material, request bodies, selected surfaces and export contents are not persisted;
- the new table is classified in the executable backend inventory and export-policy map;
- default `createApp()` still does not inject the limiter, so the endpoint remains absent and no deployment or production migration occurred.

Evidence: backend `docs/privacy/data-access-export-attempt-limiter.md` and updated route/preparation documents.

Backend PR #161 adds the first ownership-safe allowlisted export projection for `profile_and_account_metadata`:

- only the authenticated owner's active `users`, `devices` and `fitness_profiles` rows are read;
- every query is owner-scoped and uses explicit selected columns rather than raw rows;
- IDs, password hashes, sessions/tokens, revisions, sync ownership metadata, device `lastSeenAt`, deleted rows and other users' records are excluded before serialization;
- account, device and profile reads share one read-only repeatable-read PostgreSQL snapshot;
- devices have deterministic ordering and a fail-closed 50-row source bound rather than silent truncation;
- PostgreSQL evidence covers cross-user isolation, secret/internal-field exclusion, deleted rows, overflow and concurrent snapshot consistency;
- the projection is not invoked by export preparation or the optional route, so no export endpoint, assembly or delivery capability became active.

Evidence: backend `docs/privacy/data-access-export-profile-projection.md`.

Backend PR #162 adds the second ownership-safe allowlisted export projection for `progress_measurements_and_weight`:

- only the authenticated owner's active `weight_history` and `body_measurements` rows are read after an active-owner check;
- explicit selected columns exclude internal IDs, ownership/device metadata, revisions, tombstones and other users' records before serialization;
- owner verification plus both record queries share one read-only repeatable-read PostgreSQL snapshot;
- each table uses deterministic chronological ordering and a fail-closed 500-row source bound rather than silent truncation;
- output preserves user-facing timestamps, values, units, sources and notes through a versioned `json_v1` surface projection;
- PostgreSQL evidence covers cross-user isolation, deleted rows, secret/internal-field exclusion, both overflow boundaries and concurrent snapshot consistency;
- the projection remains separate from preparation, route composition and multi-surface assembly, so no export endpoint or delivery capability became active.

Evidence: backend `docs/privacy/data-access-export-progress-projection.md`.

Backend PR #163 adds the third ownership-safe allowlisted export projection for `limitations_recovery_and_safety_context`:

- only the authenticated owner's active `user_limitations` and `recovery_check_ins` rows are read after an active-owner check;
- explicit selected columns exclude internal IDs, ownership/device metadata, revisions, tombstones and other users' records before serialization;
- owner verification plus both health queries share one read-only repeatable-read PostgreSQL snapshot;
- limitations use deterministic ordering and a fail-closed 250-row source bound; recovery check-ins use deterministic chronological ordering and a fail-closed 500-row source bound;
- output preserves user-facing limitation classifications, dates, movement patterns, recovery scores and notes without inferring diagnoses or recommendations;
- PostgreSQL evidence covers cross-user isolation, deleted owners and rows, secret/internal-field exclusion, both overflow boundaries and concurrent snapshot consistency;
- the projection remains separate from preparation, route composition and multi-surface assembly, so no export endpoint or delivery capability became active.

Evidence: backend `docs/privacy/data-access-export-health-projection.md`.

Backend PR #164 corrects and guards the projection-to-registry contract:

- the health/recovery output now uses the exact canonical registered ID `limitations_recovery_and_safety_context`;
- focused PostgreSQL expectations and privacy evidence use the same identifier;
- a permanent type-checked regression test requires every implemented projection ID to exist in the candidate-export registry;
- the correction changes no owner query, output field, route composition, deployment or delivery behavior.

Backend PR #165 adds the fourth ownership-safe allowlisted export projection for `nutrition_and_meal_data`:

- only the authenticated owner's active food entries, meal templates, nutrition targets and saved Nutrition library rows are read after an active-owner check;
- all four groups share one read-only repeatable-read PostgreSQL snapshot and deterministic ordering;
- JSON-backed entry, template and library records are rebuilt through strict versioned parsers instead of exporting raw storage containers;
- raw `entryData`, `templateData`, `snapshot`, internal IDs, ownership/device metadata, revisions, tombstones, library/catalog IDs, external provider IDs, raw attribution objects and provider URLs are excluded before serialization;
- malformed JSON, duplicate template-item IDs, item-count mismatch and row/snapshot kind or name mismatch fail closed rather than being skipped;
- source bounds fail closed above 1,000 food entries, 250 meal templates, 250 target records, 500 library items or 200 items in one template;
- PostgreSQL evidence covers cross-user isolation, deleted owners/tombstones, malformed snapshot handling, every source bound and concurrent snapshot consistency;
- the canonical projection registry guard now includes `nutrition_and_meal_data`;
- the projection remains separate from preparation, route composition and multi-surface assembly, so no export endpoint or delivery capability became active.

Evidence: backend `docs/privacy/data-access-export-nutrition-projection.md`.

Backend PR #167 adds the fifth ownership-safe allowlisted export projection for `workouts_programs_and_exercises`:

- only the authenticated owner's active workout templates, workout sessions, normalized session exercises and sets, training programs, and custom exercises are read;
- all six registered workout tables share one read-only repeatable-read PostgreSQL snapshot;
- JSON-backed templates, programs, and custom exercises are rebuilt through strict versioned parsers, while sessions are rebuilt from validated normalized relationships;
- raw `templateData`, `sessionData`, `programData`, `exerciseData`, internal row and relationship IDs, ownership/device metadata, revisions, tombstones, source-set IDs, Coach run/session IDs, rationale codes, and arbitrary metadata are excluded before serialization;
- malformed snapshots, duplicate IDs/orders, broken prescription or set relationships, invalid numeric ranges, and non-custom rows in the custom-exercise table fail closed;
- source bounds fail closed above 250 templates, 1,000 sessions, 5,000 normalized exercises, 20,000 sets, 250 programs, or 500 custom exercises;
- PostgreSQL evidence covers cross-user isolation, deleted owners/tombstones, malformed normalized relationships, every source bound, and concurrent snapshot consistency;
- the canonical projection registry guard now includes `workouts_programs_and_exercises`;
- the projection remains separate from preparation, route composition, multi-surface assembly, archive generation, secure delivery, and mobile UI.

Evidence: backend `docs/privacy/data-access-export-workouts-projection.md`.

Backend PR #168 adds the sixth ownership-safe allowlisted export projection for `coach_reviews_proposals_and_run_history`:

- only the authenticated owner's Coach runs and stages are read, with both tables sharing one read-only repeatable-read PostgreSQL snapshot;
- all nine current request types use explicit domain-specific result parsers rather than raw Coach JSON serialization;
- output is limited to bounded user-facing metrics, proposals, readiness, confirmation/application state, failure codes, run status, and stage chronology;
- run/stage/child/source/target/exercise/limitation IDs, idempotency keys, revisions, raw request/context/result/input/output/error payloads, provider/model/usage metadata, prompts, hidden reasoning, validation paths, and internal diagnostics are excluded;
- failed runs expose only a bounded error code, and unsupported historical result shapes fail closed rather than being guessed or omitted;
- domain/request/result/terminal consistency, lifecycle timestamps, stage ownership, stage sequence, and signed Nutrition target deltas are validated;
- source bounds fail closed above 500 Coach runs or 5,000 Coach stages;
- unit evidence covers every request type and PostgreSQL evidence covers owner isolation, deleted owners, stage ownership mismatch, both bounds, and concurrent snapshot consistency;
- the canonical projection registry guard now includes `coach_reviews_proposals_and_run_history`;
- the projection remains separate from preparation invocation, route composition, multi-surface assembly, archive generation, secure delivery, and mobile UI.

Evidence: backend `docs/privacy/data-access-export-coach-projection.md`.

Mobile PR #431 establishes a privacy-safe account-deletion status presentation contract:

- pending, blocked, malformed, unavailable and transport-uncertain states preserve local data;
- all backend blocker codes map to one bounded user state;
- missing/expired receipts never prove deletion;
- only authoritative completion moves to required local cleanup and signed-out state;
- output contains bounded localization keys/policies/actions and no secrets, identifiers or raw errors;
- no destructive API, controller, storage or UI integration changed.

Evidence: `docs/privacy/account-deletion-status-presentation.md`.

Mobile PR #432 establishes a fail-closed retention-disclosure registry:

- source account lifecycle, source record expiry, source zero and unresolved blocker evidence are distinct;
- support diagnostics is the only current exact zero-retention source state;
- lifecycle and record-expiry evidence do not invent maximum days;
- provider/infrastructure surfaces remain unresolved;
- backup, legal-hold/incident and provider exceptions remain publication-blocked;
- no provider, region, retention setting or public policy text is selected.

Evidence: `docs/privacy/retention-disclosure-requirements.md`.

Mobile PR #434 adds a machine-readable privacy-review evidence packet:

- inventory/ownership, purpose/minimization, authentication/security, offline sync/conflicts, providers/regions, retention, deletion, access/export, analytics/consent, audience/regions and disclosures/controls are indexed separately;
- source evidence, environment evidence, operational validation, product integration and policy decisions remain distinct;
- every domain remains `not_ready` with unresolved reviewer questions and forbidden conclusions;
- source tests, record expiry, structural export parsing, synthetic consent and localization keys are not treated as production or legal proof;
- no provider, region, legal basis, approved policy copy or compliance claim was added.

Evidence: `docs/privacy/privacy-review-evidence-packet.md`.

Remaining P9-D work:

- separately approve and inject the durable limiter into a deployed route composition, including operational monitoring and stale-row cleanup expectations;
- implement ownership-safe allowlisted projections for the remaining selected surfaces and define deterministic multi-surface assembly, pagination/snapshot and maximum-size semantics;
- define export auditability, idempotency and committed-response-loss/retry semantics;
- decide synchronous response versus secure expiring/revocable delivery and prove any selected provider lifecycle through P9-B3;
- add mobile-local data transformation and integrate reviewed user confirmation/status UI;
- integrate deletion-status presentation with EN/RU localization and accessibility;
- complete policy/legal review and approved public wording using the evidence packet;
- validate real-device, deployed-backend and provider lifecycle behavior after authorization.

## Remaining roadmap concentration

Approximately 11% remains, primarily:

- **P9-B3 external retention evidence:** selected production/staging logs, backups, storage/CDN, email and provider lifecycle contracts;
- **P9-C activation decisions and integration:** legal/policy choices, provider evidence, consent persistence/withdrawal architecture and eventual separately approved implementation;
- **P9-D implementation and review:** remaining allowlisted projections and multi-surface assembly, separately approved route composition, audit/idempotency, secure delivery, mobile UI/localization/accessibility and policy/legal approval;
- **operational evidence:** deployment, worker scheduling, staging/provider execution, physical device/offline/second-device validation and release proof.

Source guards and preparation boundaries reduce implementation risk, but they cannot substitute for exact infrastructure evidence, legal/policy decisions or authorized production operations.

## Permanent authorization boundaries

Do not perform any of the following without a direct user request for that exact action:

- create or change provider accounts, credentials, secrets, buckets, CDN distributions, DNS, sender domains or callback configuration;
- deploy backend/workers, run migrations outside CI, change worker schedules or activate capabilities;
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
