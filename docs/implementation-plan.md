# Smart Fitness Implementation Completion Plan

Updated: 2026-07-31

This is the canonical cross-repository execution plan for:

- `hon4olo/smart-fitness-app`;
- `hon4olo/smart-fitness-backend`.

It covers the approved product scope only. It does not add lab analysis, diagnosis, pharmacology, social, marketplace, payment, or subscription features.

## Current baseline

Implemented:

- production Fastify/PostgreSQL backend at `https://api.peptonio.com`;
- offline-first mobile persistence and ordered observable mutations;
- native SecureStore authentication tokens;
- revisioned sync for weight history, workout sessions/sets, workout templates, food entries, nutrition targets, fitness profiles, limitations, recovery check-ins, body measurements, training programs, custom exercises, meal templates, and the account-scoped Nutrition library;
- deterministic Nutrition, Strength, and Safety & Recovery reviews;
- structured Nutrition and Strength Strategy previews with explicit confirmations;
- read-only Combined Review and Combined Proposal with effective Safety-capped Strength;
- separate explicit Combined Strength-template and Nutrition-target confirmations;
- immutable Coach history, trust metadata, provenance, before/after summaries, and privacy-safe input coverage;
- blocking Mobile CI for line limits, TypeScript, Coach/sync contracts, full regression, Expo export, and Expo Doctor;
- blocking backend lint, build, tests, migration/schema, startup, and health checks;
- no currently known tracked hand-written source/architecture file above 500 physical lines;
- repository-wide localization boundaries for formatting, units, accessibility, buttons, Alerts, Pressables, menu/tab/state controls, and raw-status presentation.

## Phase 0 — documentation and audit baseline

Status: complete and maintained continuously.

- [x] create this implementation plan;
- [x] verify mobile and backend instruction files against actual architecture;
- [x] record the oversized-file audit and blocking CI baseline;
- [x] maintain one canonical priority order;
- [x] remove stale custom-exercise and meal-template “unfinished” wording from secondary instruction documents;
- [x] refresh localization and sync-hardening roadmaps after completed source audits.

Acceptance criteria:

- completed infrastructure is not listed as pending;
- active instruction and roadmap files describe remaining work consistently;
- external validation is not presented as source-code completion.

## Phase 1 — file-size decomposition

Status: initial audited pass complete. Blocking repository and changed-file audits remain active.

Completed targets include:

- mobile `src/api/coach.ts`;
- backend Nutrition Coach orchestrator;
- mobile Add Food style composition;
- backend AI Coach architecture documents;
- mobile `AppContext.tsx` and `SyncContext.tsx` concerns;
- Safety/Recovery Progress, barcode scanner, Workouts, Workout Builder, cloud queue, sync coordinator, and exercise-picker presentation extractions.

Rules:

- keep every hand-written source file at or below 500 physical lines;
- extract cohesive components, hooks, styles, parsers, contracts, or helpers;
- preserve public contracts and runtime behavior;
- do not create broad abstractions only to satisfy line count.

## Phase 2 — revisioned sync entities

Status: complete across mobile and backend.

### Custom exercises

Implemented in backend PR #29 and mobile PR #49, with pull-accounting aliases completed in mobile PR #51:

- schema-versioned strict payloads;
- stable UUID entity references;
- ownership-safe backend materialization and tombstones;
- mobile planner, metadata store, queue operations, and remote application;
- references preserved across workouts, programs, and Coach contexts;
- create/update/delete, malformed-payload, ownership, and materialization tests.

### Meal templates

Implemented in backend PR #30 and mobile PR #50:

- schema-versioned template and nested food snapshot payloads;
- ownership-safe backend materialization and tombstones;
- mobile planner, metadata store, legacy-ID normalization, and remote application;
- strict nested snapshot and item-ID validation;
- create/update/delete, malformed-payload, and materialization tests.

Do not reimplement these entities or describe them as local-only.

## Phase 3 — sync and persistence hardening

Status: source implementation and automated coverage complete for the current contracts. Physical multi-device validation remains external.

Completed:

- [x] durable restart replay for the eager weight-history save-succeeded/outbox-enqueue-failed path;
- [x] architecture audit confirming planner-based domains regenerate operations after restart from persisted state, metadata, and pending queue instead of requiring duplicate journals;
- [x] persisted unresolved conflicts with restart restoration and per-user isolation;
- [x] deterministic push validation isolation;
- [x] idempotency-key length migration and targeted key-reuse repair;
- [x] cursor advancement guarded by supported-entity handling and conflicts;
- [x] push and pull 401 refresh/retry coverage preserving exact cursor, payload, base revision, and idempotency key;
- [x] behavioral concurrent local-mutation / remote-materialization coverage using a non-weight entity;
- [x] source-level two-device conflict coverage for mutable synchronized domains, including independent edits, overlapping edits, duplicate delivery, update-versus-delete, delete-versus-update, and matching deletes;
- [x] real PostgreSQL Nutrition-library create/update/delete concurrency and replay coverage in backend PR #62;
- [x] bounded user-visible Data & Sync status, retry, recovery replay, conflict review, and privacy-safe diagnostics.

Recovery boundary:

- weight history creates an eager outbox operation as part of the ordered local mutation and therefore journals the exact operation before queue enqueue;
- planner-based domains persist canonical local state first and deterministically plan missing operations during synchronization, so a failed enqueue is regenerated on the next sync;
- do not add duplicate recovery journals to planner-based domains unless a future mutation bypasses deterministic replanning.

External validation still required:

- [ ] physical second-device conflict matrix;
- [ ] offline termination, restart, queue recovery, reconnect, and eventual synchronization on a matching standalone runtime;
- [ ] verify user-visible conflict/recovery states during those scenarios.

Acceptance criteria:

- no critical persistence or enqueue failure is silently ignored;
- retries remain idempotent;
- conflict state remains visible and recoverable;
- interrupted mutations cannot silently lose user data;
- external validation is recorded separately from source test completion.

## Phase 4 — provider-neutral staging configuration

Status: blocked on approved staging credentials/model selection.

Tasks:

- [ ] use provider-neutral default Coach model configuration with optional domain overrides;
- [ ] configure credentials on backend staging only;
- [ ] validate structured-output retry and guardrail rejection for Nutrition and Strength;
- [ ] record bounded provider/model, latency, attempts, token usage, and validation failure metadata;
- [ ] preserve deterministic reviews when provider capability is disabled.

No provider key or provider-specific payload may reach the mobile client.

## Phase 5 — Combined Coach and compensating actions

Status: core proposal and confirmation product surface is implemented.

Implemented:

- read-only Combined Review;
- Combined Proposal with Safety-adjusted effective Strength;
- separate explicit Strength-template and Nutrition-target confirmations;
- strict parsing, revision-safe writes, idempotency, provenance, and no automatic application.

Remaining:

- [ ] validate provider-backed/staging execution when Phase 4 is available;
- [ ] fix only confirmed backend/mobile contract gaps;
- [ ] design a compensating-revert contract only if separately approved.

A revert must be backend-owned and specify ownership, source/applied revisions, idempotency, conflict behavior, and immutable audit history. Do not invent a client-only rollback.

## Phase 6 — CI and release readiness

Status: source CI complete; environment/device work remains external.

Completed:

- [x] complete mobile regression suite is blocking;
- [x] line audits, TypeScript, Coach/sync contracts, Expo export, and Doctor are blocking;
- [x] backend lint/build/test/migration/schema/startup/health checks are blocking;
- [x] rollout, rollback, crash-reporting, and release-validation documents exist;
- [x] localization source audits are blocking;
- [x] fixed-SHA cross-repository release workflow exists.

Remaining:

- [ ] configure `BACKEND_REPOSITORY_TOKEN` and run the fixed-SHA cross-repository release gate;
- [ ] verify matching native runtime includes SecureStore and all native modules;
- [ ] run physical workout, nutrition, progress, auth, sync, Coach, accessibility, and offline smoke tests;
- [ ] validate narrow/standard/wide layouts and EN/RU appearance/unit matrices;
- [ ] publish OTA or create native builds only when explicitly authorized.

Green source CI does not replace device validation.

## Immediate next actions

No currently known autonomous source-level Phase 0–3 gap remains.

1. Configure and run the fixed-SHA cross-repository release gate when repository-token access is explicitly authorized.
2. Configure provider-neutral Coach staging credentials/model selection and validate structured outputs when explicitly authorized.
3. Create matching native builds and complete physical release-device, offline-restart, accessibility, and second-device validation when explicitly authorized.
4. Define an explicit local-versus-account conflict-choice contract before adding destructive conflict controls.
5. Define privacy, consent, identity, retention, and deletion requirements before product analytics.
6. Measure local-state size and restore/save duration before any SQLite migration decision.
7. Continue bounded source work only for a newly discovered regression or separately prioritized product feature.

## Operating rules

- Inspect exact current `main` and open PRs in both repositories before each slice.
- Use small bounded branches and PRs.
- Merge only the exact green head.
- Preserve business logic, routes, IDs, canonical units, persistence, API/sync contracts, polling, idempotency, explicit confirmations, and completed history unless the task explicitly changes them.
- Do not publish OTA, create native builds, install on devices, deploy backend changes, activate staging/production, or change credentials without explicit authorization.
