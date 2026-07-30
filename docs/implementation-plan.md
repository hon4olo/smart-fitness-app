# Smart Fitness Implementation Completion Plan

Updated: 2026-07-31

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
- revisioned sync for custom exercises with stable UUID references;
- revisioned sync for meal templates with strict nested food snapshots;
- deterministic Nutrition review;
- structured Nutrition Strategy preview and explicit confirmation;
- deterministic Strength review;
- structured Strength Strategy preview and explicit workout-template confirmation;
- deterministic Safety & Recovery review;
- pre-workout Safety acknowledgement with immutable completed-workout provenance;
- read-only Combined Coach review;
- blocking Mobile CI checks for repository line limits, TypeScript, Coach/sync contracts, the full regression suite, Expo export, and Expo Doctor;
- blocking backend lint, build, tests, migration/schema checks, startup, and health validation;
- a completed initial decomposition pass with no currently known hand-written mobile or backend source/architecture file above 500 physical lines.

## Execution order

### Phase 0 — documentation and audit baseline

Status: implementation plan refreshed on 2026-07-31. Instruction/status documents must continue to be corrected whenever older completion language is discovered.

Tasks:

- [x] create this implementation plan;
- [x] refresh the mobile implementation status and decomposition baseline;
- [x] verify the backend instruction file reflects the production stack and blocking validation;
- [x] record the current oversized-file audit result;
- [x] keep one canonical priority order in this document;
- [ ] remove any remaining stale custom-exercise or meal-template “unfinished” wording from secondary instruction documents.

Acceptance criteria:

- no canonical execution plan lists completed sync entities or completed decompositions as unfinished;
- remaining work is described consistently across active roadmap files;
- agents cannot mistake completed infrastructure for pending implementation.

### Phase 1 — decompose oversized files

Status: initial audited pass completed. The 500-line policy and blocking repository audit remain active for future additions.

Completed priority targets:

1. [x] mobile `src/api/coach.ts` — reduced to a small public barrel over focused Coach modules;
2. [x] backend `src/services/coach/nutrition-coach-orchestrator.ts` — split below the limit;
3. [x] mobile `src/features/nutrition/styles/addFoodStyles.ts` — reduced to a small composed style barrel;
4. [x] backend AI Coach architecture ADR — split into focused documents;
5. [x] mobile `src/context/AppContext.tsx` — state-action hooks extracted;
6. [x] mobile `src/context/SyncContext.tsx` — sync-store initialization extracted.

Additional completed mobile decompositions:

- `SafetyRecoveryProgressCard.tsx`;
- `BarcodeScannerModal.tsx`;
- `WorkoutsScreen.tsx`;
- `WorkoutBuilderScreen.tsx`;
- `CloudQueueHelpers.ts`;
- `SyncCoordinatorOperations.ts`.

Rules:

- preserve public contracts and runtime behavior;
- move cohesive parsers, contracts, helpers, styles, or execution infrastructure;
- keep every new hand-written file at or below 500 physical lines;
- retain or add focused tests for moved logic;
- avoid generic abstractions created only to satisfy the line limit;
- re-run the repository audit after major additions rather than assuming the current result remains true.

Acceptance criteria:

- all currently known hand-written files are at or below 500 lines;
- TypeScript/build, focused tests, lint, and formatting checks pass;
- no route, DTO, sync, or UI behavior changes.

### Phase 2 — remaining revisioned sync entities

Status: completed across mobile and backend on 2026-07-23.

#### Custom exercises

Completed:

- [x] schema-versioned mobile/backend payload;
- [x] deterministic normalization of legacy IDs into stable UUID entity IDs;
- [x] backend table, repository, dispatcher, ownership validation, tombstones, and migration;
- [x] mobile queue operation builder and sync planner;
- [x] revision metadata storage and remote materialization;
- [x] canonical references preserved for workout templates, sessions, training programs, and Coach contexts;
- [x] focused create/update/delete, malformed-payload, ownership, planner, and remote-materialization coverage.

Implemented in backend PR #29 and mobile PR #49. Mobile PR #51 subsequently registered the entity aliases in supported pull accounting so valid operations no longer block cursor advancement.

#### Meal templates

Completed:

- [x] schema-versioned payload for template metadata and nested food snapshots;
- [x] backend table, repository, dispatcher, ownership validation, tombstones, and migration;
- [x] mobile planner, metadata store, and remote materialization;
- [x] strict trust-boundary validation for embedded food snapshots and unique item IDs;
- [x] deterministic migration of legacy template/item IDs;
- [x] focused create/update/delete, malformed-payload, planner, and remote-materialization coverage.

Implemented in backend PR #30 and mobile PR #50.

Acceptance criteria:

- user-created custom exercises and meal templates use first-class revisioned sync entities;
- unsupported or malformed remote entities fail closed without advancing the sync cursor;
- tombstones and ownership checks remain deterministic.

### Phase 3 — sync and persistence hardening

Status: partially complete.

Completed:

- [x] durable restart replay for the weight-history save-succeeded/outbox-enqueue-failed path;
- [x] persisted unresolved conflict state with restart restoration and per-user isolation;
- [x] deterministic push validation isolation so one rejected operation does not block valid siblings;
- [x] idempotency-key length migration and targeted key-reuse repair;
- [x] cursor advancement guarded by supported-entity handling and conflict state.

Remaining:

- [ ] extend or explicitly document durable outbox recovery coverage for every critical synchronized mutation;
- [ ] test token refresh during push and pull;
- [ ] test concurrent local mutation and remote pull materialization across representative entities;
- [ ] complete two-device conflict coverage for every mutable synchronized entity;
- [ ] execute the physical second-device and offline-restart matrix on a matching standalone runtime.

Acceptance criteria:

- no critical persistence or enqueue failure is silently ignored;
- retries do not duplicate accepted operations;
- conflict state remains visible and recoverable;
- an interrupted mutation cannot silently lose user data;
- release-device validation confirms the tested source contracts on a matching binary/runtime.

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

Status: source implementation is substantially complete; verify the exact backend/mobile contract and remaining rollout gates before adding new behavior.

Implemented product surface includes:

- read-only Combined Review;
- Combined Proposal with effective Safety-capped Strength output;
- separate explicit Strength-template and Nutrition-target confirmations;
- revisioned writes, idempotency keys, strict parsing, and no automatic application.

Remaining work is limited to confirmed contract gaps, staging/provider validation, release validation, and any separately approved compensating-revert contract. Do not infer a missing implementation solely from the older phase checklist.

Acceptance criteria:

- malformed child output or an invalid Safety boundary fails closed;
- the combined proposal cannot override deterministic workers;
- no completed workout history is mutated;
- no nutrition target or workout template is changed without explicit confirmation;
- every applied mutation remains revision-safe and idempotent.

### Phase 6 — CI and release readiness

Status: source-level CI is substantially complete; environment/device validation remains external.

Completed:

- [x] make the full mobile regression suite blocking in CI;
- [x] make mobile line audit, TypeScript, Coach/sync contracts, Expo export, and Expo Doctor blocking;
- [x] make backend lint, build, test, migration/schema, startup, and health validation blocking;
- [x] add rollout/rollback and release validation documentation.

Remaining:

- [ ] remove remaining stale source assertions as they are discovered during bounded refactors;
- [ ] run release-device smoke tests for workout, nutrition, progress, auth, sync, and Coach flows;
- [ ] verify offline restart and queue recovery on a matching standalone runtime;
- [ ] verify a matching native build contains Expo SecureStore;
- [ ] configure and run the fixed-SHA cross-repository release gate;
- [ ] publish OTA changes only to a compatible runtime/channel when explicitly authorized.

Acceptance criteria:

- green CI means all configured required source-level suites passed;
- green CI does not replace physical release-device validation;
- the production mobile binary contains every required native module;
- staging smoke tests pass before production feature flags are enabled;
- rollback does not require destructive database operations.

## Immediate next actions

1. Remove stale completion wording from secondary roadmap/instruction documents.
2. Complete the repository-wide visible Pressable/menu/tab/state-control and raw-status presentation audit.
3. Extend sync restart-recovery coverage beyond the current weight-history journal or document the exact bounded contract.
4. Add token-refresh, concurrent-mutation, and broader two-device conflict tests.
5. Introduce provider-neutral Coach model configuration and validate it in staging when credentials are available.
6. Configure the fixed-SHA cross-repository release gate.
7. Complete physical release-device, offline-restart, and second-device validation.
