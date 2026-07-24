# Smart Fitness Roadmap Progress

Updated: 2026-07-24

This is the canonical handoff document for continuing the current Smart Fitness roadmap in a new agent/chat session.

Read this file together with:

- `AGENTS.md`;
- `PROJECT_LEARNINGS.md`;
- `docs/implementation-plan.md`;
- backend `hon4olo/smart-fitness-backend/AGENTS.md` when backend changes are required.

## Repositories

- Mobile: `hon4olo/smart-fitness-app`
- Backend: `hon4olo/smart-fitness-backend`
- Production API: `https://api.peptonio.com`

Always inspect the latest `main` in both repositories before changing code because concurrent work may have landed.

## Working rules

- Continue the roadmap without asking for confirmation after every completed slice.
- Use small focused branches and pull requests.
- Run full blocking CI before merge.
- Preserve existing behavior unless the roadmap explicitly changes it.
- Keep every hand-written source file at or below 500 physical lines.
- When independent work does not touch the same files, it may run in parallel branches.
- Do not add Supabase, Firebase, a second backend, direct mobile LLM calls, or provider secrets in the mobile app.
- Do not perform OTA/EAS publish, native build, device installation, backend deployment, or production feature activation unless explicitly requested.

## Overall completion

Estimated roadmap completion: about 85–90%.

The remaining work is concentrated in:

1. complete multi-device sync hardening;
2. finish remaining oversized-file decomposition;
3. activate and validate the model provider in staging;
4. complete Combined Strategy proposal composition and explicit application flows;
5. complete release-device and production-readiness validation.

## Completed foundation

### Architecture and documentation

- [x] Single production Fastify/PostgreSQL backend established.
- [x] Mobile and backend agent instructions describe the current architecture.
- [x] Cross-repository implementation plan exists.
- [x] Hand-written file limit of 500 lines is enforced for changed files in CI.
- [x] Full mobile regression suite is blocking in CI.
- [x] Cross-repository release-gate workflow exists.

### Authentication and persistence

- [x] Native access and refresh tokens use Expo SecureStore.
- [x] Verified legacy AsyncStorage token migration exists.
- [x] Ordinary cached auth session is tokenless.
- [x] Critical local persistence mutations are serialized and observable.
- [x] Save and outbox failures expose retry controls.
- [x] Durable recovery journal restores failed outbox writes after restart.
- [x] Push and pull token-refresh behavior is covered by tests.

### Revision-aware synchronization

Implemented for:

- [x] weight history;
- [x] completed workout sessions and sets;
- [x] workout templates;
- [x] training programs;
- [x] food entries;
- [x] meal templates;
- [x] nutrition targets;
- [x] fitness profile;
- [x] user limitations;
- [x] recovery check-ins;
- [x] typed body measurements;
- [x] custom exercises.

Additional sync hardening completed:

- [x] malformed and unsupported remote entities fail closed;
- [x] cursor advancement requires every returned operation to be handled;
- [x] local mutations arriving while pull metadata loads are preserved;
- [x] deterministic baseline two-device conflict tests exist;
- [x] queue deduplication and idempotency protections exist.

### AI Coach

- [x] Deterministic Nutrition review.
- [x] Structured Nutrition Strategy preview and explicit confirmation.
- [x] Deterministic Strength review.
- [x] Structured Strength Strategy preview and explicit workout-template confirmation.
- [x] Deterministic Safety & Recovery review.
- [x] Pre-workout Safety acknowledgement and immutable completed-workout provenance.
- [x] Read-only Combined Coach review.
- [x] Provider-neutral backend model abstraction and capability gating.

### Major file decomposition already completed

- [x] `WorkoutSessionScreen.tsx` reduced below 500 lines.
- [x] `WorkoutSessionFinishScreen.tsx` reduced below 500 lines.
- [x] `WorkoutHistoryScreen.tsx` reduced below 500 lines.
- [x] `WorkoutHistoryDetailScreen.tsx` reduced below 500 lines.
- [x] `WorkoutsScreen.tsx` reduced below 500 lines.
- [x] `NutritionCoachScreen.tsx` reduced below 500 lines.
- [x] `StrengthCoachScreen.tsx` reduced below 500 lines.
- [x] `SafetyRecoveryCoachScreen.tsx` reduced below 500 lines.
- [x] `UserLimitationScreen.tsx` reduced below 500 lines.
- [x] `add-food.tsx` reduced below 500 lines.
- [x] `SyncContext.tsx` reduced below 500 lines.
- [x] `CloudConflictResolver.ts` reduced below 500 lines.

## Remaining roadmap

### Phase A — complete sync conflict matrix

Status: in progress.

Required next work:

- [x] add explicit two-device conflict scenarios for workout templates;
- [x] add explicit two-device conflict scenarios for training programs;
- [x] add explicit two-device conflict scenarios for meal templates;
- [x] add explicit two-device conflict scenarios for custom exercises;
- [x] add explicit two-device conflict scenarios for body measurements;
- [x] add explicit two-device conflict scenarios for nutrition targets;
- [x] add explicit two-device conflict scenarios for limitations and recovery records;
- [ ] test update-versus-delete in both directions for mutable entities;
- [ ] test duplicate remote delivery after conflict resolution;
- [ ] verify conflict state remains visible and recoverable after restart.

Latest completed sync-hardening slices:

- `d5afb4d513c27e026f885efa8b3021033c76b245` — preserve local mutations during remote materialization.
- Workout-template conflict coverage now includes independent two-device merges, overlapping edits, and update-versus-delete in both directions.
- Training-program conflict coverage now includes independent metadata, schedule, and progression merges plus overlapping edits and update-versus-delete in both directions.
- Meal-template conflict coverage now includes independent template, item-list, and nested item merges plus overlapping edits and update-versus-delete in both directions.
- Custom-exercise conflict coverage now uses an explicit structured merge policy for independent edits while preserving overlapping and update-versus-delete conflicts for manual review.
- Body-measurement conflict coverage now verifies distinct append records, duplicate delivery, divergent same-record edits, and deterministic append-only union behavior.
- Nutrition-target conflict coverage now verifies duplicate delivery, revision-number ordering, timestamp ordering, and stable revision-ID tie-breaking.
- Safety/Recovery conflict coverage now explicitly merges independent limitation edits while preserving overlapping limitation edits and divergent recovery records for review.

### Phase B — finish oversized-file decomposition

Status: in progress; run in parallel with functional work when file sets do not overlap.

Known remaining candidates from the audit and later growth:

- [ ] `src/cloud/SyncCoordinator.ts`;
- [ ] `src/api/coach.ts`;
- [ ] `src/features/coach/nutritionCoachViewModel.ts` if still above 500 lines;
- [ ] `src/features/nutrition/styles/addFoodStyles.ts`;
- [ ] `src/cloud/WorkoutTemplateSync.ts` if still above 500 lines;
- [ ] rerun a repository-wide tracked-file line audit and update this list.

Do not split generated files such as `package-lock.json` or `repomix-output.xml` merely to satisfy the source-file policy.

### Phase C — staging model-provider activation

Status: code foundation exists; runtime activation not verified.

Required:

- [ ] make default Coach model configuration provider-neutral with optional domain overrides;
- [ ] configure staging-only provider credentials on the backend;
- [ ] verify Nutrition structured-output retry and guardrail rejection paths;
- [ ] verify Strength structured-output retry and guardrail rejection paths;
- [ ] record latency, provider/model identifier, attempts, token usage, and validation failures;
- [ ] confirm deterministic reviews continue to work with model execution disabled;
- [ ] confirm capability flags reflect actual runtime availability.

Never put provider credentials in mobile code or `EXPO_PUBLIC_*` variables.

### Phase D — Combined Strategy proposal

Status: read-only Combined review exists; coordinated proposal/application flow is incomplete.

Backend remaining:

- [ ] finalize the versioned Combined Strategy request/response contract;
- [ ] compose eligible Nutrition and Strength proposals with Safety context;
- [ ] apply deterministic Safety restrictions and load ceilings;
- [ ] reconcile nutrition targets with recovery state and training demand;
- [ ] add a deterministic final combined guardrail;
- [ ] persist child run IDs, versions, validation reports, and audit metadata;
- [ ] expose a dedicated capability flag;
- [ ] define partial-failure and retry behavior;
- [ ] keep automatic application disabled.

Mobile remaining:

- [ ] strict capability parsing;
- [ ] strict versioned result parser and view model;
- [ ] one combined preview screen;
- [ ] clear blocking, input-required, modification, and warning states;
- [ ] separate explicit confirmation for every applying action;
- [ ] revision-safe and idempotent application of confirmed mutations.

### Phase E — release readiness

Status: CI foundation mostly complete; real runtime validation remains.

Required:

- [ ] run cross-repository release gate on fixed mobile/backend SHAs;
- [ ] deploy and validate backend in staging;
- [ ] apply and verify migrations on staging PostgreSQL;
- [ ] verify `/health`, auth, sync push/pull, and Coach polling against staging;
- [ ] create a matching native iOS/Android build containing Expo SecureStore;
- [ ] run real-device smoke tests for workout, nutrition, progress, auth, sync, and Coach flows;
- [ ] test offline restart and queue recovery on device;
- [ ] test sign-in and synchronization on a second device/account runtime;
- [ ] document rollout and rollback steps;
- [ ] publish OTA only to a compatible runtime/channel when explicitly requested.

## Recommended immediate next actions

1. Inspect latest `main` and open PRs in both repositories.
2. Complete the entity-specific two-device conflict matrix.
3. In a separate non-overlapping branch, split `src/cloud/SyncCoordinator.ts` below 500 lines.
4. Rerun the complete line-count audit and update the oversized-file list.
5. Continue with staging model-provider activation.
6. Implement Combined Strategy proposal after provider/staging contracts are stable.
7. Finish native-build and real-device release validation.

## Validation expectations

For mobile TypeScript changes:

```bash
npx tsc --noEmit
npm test
```

For native dependency or Expo configuration changes:

```bash
npx expo-doctor
```

For backend changes, run the repository's blocking lint, build, test, migration, and production-config checks.

Do not claim completion when CI is failing. State blockers explicitly.

## New-chat starter prompt

Use this in a new chat:

> Continue the Smart Fitness roadmap. Read `AGENTS.md`, `PROJECT_LEARNINGS.md`, `ROADMAP_PROGRESS.md`, and `docs/implementation-plan.md` first. Inspect latest `main` and open PRs in both `hon4olo/smart-fitness-app` and `hon4olo/smart-fitness-backend`. Continue from the first unchecked item in `ROADMAP_PROGRESS.md`. Work in small focused PRs, run full blocking CI, merge only green exact heads, preserve existing behavior, and keep every hand-written source file at or below 500 lines. Run independent decompositions in parallel when file sets do not overlap. Do not perform OTA/EAS publish, native builds, device installation, backend deployment, or production feature activation unless explicitly requested. After finishing a slice, update `ROADMAP_PROGRESS.md` and continue to the next item.
