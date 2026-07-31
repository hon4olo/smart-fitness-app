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
- revisioned sync for weight history, workout sessions/sets, workout templates, food entries, nutrition targets, fitness profiles, limitations, recovery check-ins, body measurements, training programs, custom exercises, and meal templates;
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
- [x] refresh localization roadmap after repository-wide control/status audits.

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

Status: partially complete and the first active code phase.

Completed:

- [x] durable restart replay for weight-history save-succeeded/outbox-enqueue-failed mutations;
- [x] persisted unresolved conflicts with restart restoration and per-user isolation;
- [x] deterministic push validation isolation;
- [x] idempotency-key length migration and targeted key-reuse repair;
- [x] cursor advancement guarded by supported-entity handling and conflicts;
- [x] existing focused token-refresh and concurrent-pull coverage for implemented paths;
- [x] representative PostgreSQL concurrency coverage for Nutrition library sync.

Next source-verifiable work:

- [ ] audit every critical synchronized mutation against the durable recovery contract;
- [ ] extend recovery journaling where save-succeeded/enqueue-failed can still lose an operation after restart;
- [ ] fill confirmed token-refresh gaps for push and pull;
- [ ] fill confirmed concurrent local-mutation / remote-materialization gaps across representative entities;
- [ ] complete source-level two-device conflict coverage for mutable synchronized entities;
- [ ] keep user-visible Data & Sync recovery bounded, sanitized, and non-destructive.

External validation:

- [ ] physical second-device conflict matrix;
- [ ] offline restart and queue recovery on a matching standalone runtime.

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
- [x] localization source audits are blocking.

Remaining:

- [ ] configure and run the fixed-SHA cross-repository release gate;
- [ ] verify matching native runtime includes SecureStore and all native modules;
- [ ] run physical workout, nutrition, progress, auth, sync, Coach, accessibility, and offline smoke tests;
- [ ] validate narrow/standard/wide layouts and EN/RU appearance/unit matrices;
- [ ] publish OTA or create native builds only when explicitly authorized.

Green source CI does not replace device validation.

## Immediate next actions

1. Audit durable recovery coverage for every critical synchronized mutation and implement the first confirmed gap.
2. Audit existing token-refresh, concurrent-materialization, and two-device tests before adding non-duplicative coverage.
3. Add safe user-visible Data & Sync recovery only where a real recoverable action exists.
4. Introduce provider-neutral Coach model configuration when staging credentials are available.
5. Configure the fixed-SHA cross-repository release gate.
6. Complete physical release-device, offline-restart, accessibility, and second-device validation.

## Operating rules

- Inspect exact current `main` and open PRs in both repositories before each slice.
- Use small bounded branches and PRs.
- Merge only the exact green head.
- Preserve business logic, routes, IDs, canonical units, persistence, API/sync contracts, polling, idempotency, explicit confirmations, and completed history unless the task explicitly changes them.
- Do not publish OTA, create native builds, install on devices, deploy backend changes, activate staging/production, or change credentials without explicit authorization.
