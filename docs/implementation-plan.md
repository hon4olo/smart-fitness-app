# Smart Fitness Implementation Completion Plan

Updated: 2026-07-23

This document is the execution plan for completing the current Smart Fitness architecture across:

- `hon4olo/smart-fitness-app`;
- `hon4olo/smart-fitness-backend`.

It covers the already-approved product scope only. It does not add lab analysis, diagnosis, pharmacology, social, marketplace, payment, or subscription features.

## Current baseline

Already implemented:

- production Fastify/PostgreSQL backend at `https://api.peptonio.com`;
- offline-first mobile persistence;
- platform SecureStore for native auth tokens;
- ordered and observable local persistence mutations;
- revisioned sync for weight history;
- revisioned sync for completed workout sessions and sets;
- revisioned sync for custom workout templates;
- revisioned sync for food entries;
- revisioned sync for nutrition targets;
- revisioned sync for fitness profiles;
- revisioned sync for user limitations;
- revisioned sync for recovery check-ins;
- revisioned sync for typed body measurements;
- revisioned sync for training programs;
- deterministic Nutrition review;
- structured Nutrition Strategy preview and explicit confirmation;
- deterministic Strength review;
- structured Strength Strategy preview and explicit workout-template confirmation;
- deterministic Safety & Recovery review;
- pre-workout Safety acknowledgement with immutable completed-workout provenance;
- read-only Combined Coach review.

## Execution order

### Phase 0 — documentation and audit baseline

Estimate: 0.5 day.

Tasks:

- [x] create this implementation plan;
- [ ] update mobile `AGENTS.md` to match current implementation;
- [ ] update mobile `PROJECT_LEARNINGS.md` to match current implementation;
- [ ] update backend `AGENTS.md` to match current sync coverage;
- [ ] record the remaining oversized hand-written files;
- [ ] keep one canonical priority order across both repositories.

Acceptance criteria:

- no instruction file lists SecureStore, body-measurement sync, training-program sync, or observable persistence as unfinished;
- remaining work is described consistently in both repositories;
- agents cannot mistake completed infrastructure for pending work.

### Phase 1 — decompose oversized files

Estimate: 1.5–2.5 days.

Priority targets:

1. mobile `src/api/coach.ts`;
2. backend `src/services/coach/nutrition-coach-orchestrator.ts`;
3. mobile `src/features/nutrition/styles/addFoodStyles.ts`;
4. backend `docs/architecture/ai-coach.md`;
5. mobile `src/context/AppContext.tsx` before it crosses the limit;
6. mobile `src/context/SyncContext.tsx` before adding more entity planners.

Rules:

- preserve public contracts and runtime behavior;
- move cohesive parsers, contracts, helpers, styles, or execution infrastructure;
- keep every new hand-written file at or below 500 physical lines;
- retain or add focused tests for moved logic;
- avoid generic abstractions created only to satisfy the line limit.

Acceptance criteria:

- all currently known hand-written files are at or below 500 lines;
- TypeScript/build, focused tests, lint, and formatting checks pass;
- no route, DTO, sync, or UI behavior changes.

### Phase 2 — finish remaining revisioned sync entities

Estimate: 2–3 days.

#### Custom exercises

Tasks:

- [ ] define a schema-versioned mobile/backend sync payload;
- [ ] normalize legacy IDs into stable entity IDs;
- [ ] add backend schema, repository, dispatcher, and ownership tests;
- [ ] add mobile queue operation builder and sync planner;
- [ ] add revision metadata storage and remote materialization;
- [ ] preserve references from workout templates, sessions, and training programs;
- [ ] test create, update, delete, duplicate delivery, conflict, malformed payload, and offline queueing.

#### Meal templates

Tasks:

- [ ] define a schema-versioned payload for template metadata and items;
- [ ] add backend schema, repository, dispatcher, and ownership tests;
- [ ] add mobile planner, metadata store, and remote materialization;
- [ ] validate embedded food-entry snapshots at the trust boundary;
- [ ] test create, update, delete, duplicate delivery, conflict, malformed payload, and offline queueing.

Acceptance criteria:

- every user-created entity required by Nutrition and Strength Coach is available after sign-in on a second device;
- unsupported or malformed remote entities fail closed without advancing the sync cursor;
- tombstones and conflicts behave deterministically.

### Phase 3 — sync and persistence hardening

Estimate: 0.5–1.5 days.

Tasks:

- [ ] audit every critical `AppContext` mutation for use of the ordered mutation queue;
- [ ] document the save-succeeded/enqueue-failed recovery contract;
- [ ] add application-restart recovery tests for failed outbox writes;
- [ ] test token refresh during push and pull;
- [ ] test concurrent local mutation and remote pull materialization;
- [ ] test two-device conflicts for each mutable synchronized entity;
- [ ] verify cursor advancement only after all returned operations are handled.

Acceptance criteria:

- no critical persistence or enqueue failure is silently ignored;
- retries do not duplicate accepted operations;
- conflict state remains visible and recoverable;
- an interrupted mutation cannot silently lose user data.

### Phase 4 — staging model-provider activation

Estimate: 0.5–1 day after credentials and model selection are available.

Tasks:

- [ ] replace Nutrition-specific default model naming with provider-neutral configuration;
- [ ] support a default Coach model with optional domain overrides;
- [ ] configure staging credentials only on the backend;
- [ ] verify Nutrition structured-output retries and guardrail rejection paths;
- [ ] verify Strength structured-output retries and guardrail rejection paths;
- [ ] record latency, provider/model identifier, attempts, token usage, and validation failures;
- [ ] keep deterministic reviews available when the provider is disabled.

Acceptance criteria:

- no provider key or provider-specific payload reaches the mobile client;
- capability flags reflect actual provider availability;
- provider failure returns a typed failure without weakening guardrails;
- deterministic review remains operational with `COACH_MODEL_ENABLED=false`.

### Phase 5 — Combined Strategy proposal

Estimate: 3–5 days.

The existing Combined Coach is a read-only deterministic review. This phase adds a coordinated proposal without automatic application.

Backend tasks:

- [ ] add a versioned `combined_strategy_proposal` request type;
- [ ] run eligible Nutrition and Strength structured agents with Safety context;
- [ ] apply Safety restrictions and load multipliers to the Strength proposal;
- [ ] reconcile nutrition targets with recovery state and training demand;
- [ ] add a deterministic combined final guardrail;
- [ ] persist child run IDs, versions, validation reports, and concise audit metadata;
- [ ] expose a separate Combined Strategy capability flag;
- [ ] define explicit partial-failure and retry behavior;
- [ ] keep automatic application disabled.

Mobile tasks:

- [ ] add strict Combined Strategy capability parsing;
- [ ] add a strict versioned result parser and view model;
- [ ] render one read-only combined preview;
- [ ] display blocking, input-required, modification, and warning states clearly;
- [ ] require separate explicit confirmation for every applying action;
- [ ] never infer support from schema version alone.

Acceptance criteria:

- malformed child output or an invalid Safety boundary fails closed;
- the combined proposal cannot override deterministic workers;
- no completed workout history is mutated;
- no nutrition target or workout template is changed without explicit confirmation;
- every applied mutation remains revision-safe and idempotent.

### Phase 6 — CI and release readiness

Estimate: 1.5–2.5 days.

Tasks:

- [ ] remove stale assertions from the full mobile regression suite;
- [ ] make the full mobile regression suite blocking in CI;
- [ ] ensure backend build, test, lint, and format checks are blocking;
- [ ] add focused end-to-end contract tests for auth, sync, and Coach polling;
- [ ] run release-device smoke tests for workout, nutrition, progress, auth, sync, and Coach flows;
- [ ] verify offline restart and queue recovery;
- [ ] verify a matching native build contains Expo SecureStore;
- [ ] publish OTA changes only to a compatible runtime/channel;
- [ ] document staging and production rollout/rollback steps.

Acceptance criteria:

- green CI means all required regression suites passed;
- the current production mobile binary contains every required native module;
- staging smoke tests pass before production feature flags are enabled;
- rollback does not require destructive database operations.

## Estimated total

Expected engineering time:

- implementation only: 6–9 working days;
- production-ready validation and stabilization: 8–12 working days;
- practical calendar allowance: 2–3 weeks, including CI, native-build, staging, and release-device feedback.

## Immediate next actions

1. Complete Phase 0 documentation refresh.
2. Decompose `src/api/coach.ts` without changing its exported contract.
3. Decompose the Nutrition Coach orchestrator using a small typed run-execution helper.
4. Implement custom-exercise sync before meal-template sync because workout templates and training programs depend on canonical exercise references.
5. Complete meal-template sync.
6. Harden restart and two-device conflict scenarios.
7. Activate the model provider in staging.
8. Implement Combined Strategy proposal.
9. Make the full regression suite blocking and complete release validation.
