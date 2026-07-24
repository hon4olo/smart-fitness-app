# Smart Fitness Roadmap Progress

Updated: 2026-07-24

This is the canonical handoff document for continuing the current Smart Fitness roadmap in a new agent or chat session.

Read this file together with:

- `AGENTS.md`;
- `PROJECT_LEARNINGS.md`;
- `docs/implementation-plan.md`;
- `docs/release/validation-record-2026-07-24.md`;
- `docs/release/rollout-and-rollback.md`;
- backend `hon4olo/smart-fitness-backend/AGENTS.md` when backend changes are required.

## Repositories

- Mobile: `hon4olo/smart-fitness-app`
- Backend: `hon4olo/smart-fitness-backend`
- Production API: `https://api.peptonio.com`

Always inspect the latest `main` and open pull requests in both repositories before changing code. Do not infer merge state from an earlier conversation summary.

## Working rules

- Continue the roadmap without asking for confirmation after every completed code slice.
- Use small focused branches and pull requests.
- Run full blocking CI before merge and merge only the exact green head.
- Preserve existing behavior unless the roadmap explicitly changes it.
- Keep every hand-written source file at or below 500 physical lines.
- Do not add Supabase, Firebase, a second backend, direct mobile model calls, or provider secrets in the mobile app.
- Do not perform OTA/EAS publish, native builds, device installation, backend deployment, staging credential activation, or production feature activation unless explicitly requested.

## Overall completion

Estimated roadmap completion: about 98–99% at source-code and repository-CI level.

The remaining work is concentrated in protected/external validation:

1. configure read-only private-backend access for the combined release gate and rerun it on exact current SHAs;
2. configure and smoke-test the model provider in protected staging;
3. deploy and validate staging;
4. complete native-build and real-device validation.

## Completed foundation

### Architecture and documentation

- [x] Single Fastify/PostgreSQL backend established.
- [x] Mobile and backend agent instructions describe the current architecture.
- [x] Cross-repository implementation plan exists.
- [x] Changed-file and repository-wide 500-line audits are blocking in mobile CI.
- [x] Full mobile regression suite is blocking in CI.
- [x] A cross-repository fixed-SHA release-gate workflow exists.
- [x] Release validation evidence and rollout/rollback procedures are documented.

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

Additional hardening:

- [x] malformed and unsupported remote entities fail closed;
- [x] cursor advancement requires every returned operation to be handled;
- [x] local mutations arriving while pull metadata loads are preserved;
- [x] deterministic two-device conflict coverage exists for every mutable policy;
- [x] update-versus-delete is covered in both directions;
- [x] duplicate remote delivery is idempotent after conflict resolution;
- [x] unresolved conflicts persist per user and recover after restart;
- [x] queue deduplication and idempotency protections exist.

### AI Coach

- [x] Deterministic Nutrition review.
- [x] Structured Nutrition Strategy preview and explicit confirmation.
- [x] Deterministic Strength review.
- [x] Structured Strength Strategy preview and explicit workout-template confirmation.
- [x] Deterministic Safety & Recovery review.
- [x] Pre-workout Safety acknowledgement and immutable completed-workout provenance.
- [x] Read-only Combined Coach review.
- [x] Versioned Combined Strategy proposal review.
- [x] Safety-adjusted effective Strength plan.
- [x] Conservative Nutrition reconciliation against Safety and effective training demand.
- [x] Separate explicit Combined Strength-template and Nutrition-target confirmations.
- [x] Revision-safe, idempotent Combined mutation application and interrupted-write recovery.
- [x] Provider-neutral backend model abstraction and capability gating.
- [x] Provider-neutral default model with optional Nutrition, Strength, and Combined overrides.
- [x] Domain guardrail repair/rejection and provider telemetry coverage.

### Major file decomposition

- [x] All tracked hand-written mobile files are at or below 500 physical lines.
- [x] `SyncCoordinator.ts` is a compatibility facade over focused modules.
- [x] `WorkoutTemplateSync.ts` is a compatibility facade over focused modules.
- [x] Large Coach view models, screens, styles, fixtures, and parsers are decomposed.
- [x] Backend Combined contract, summaries, evaluator, effective-Strength worker, and reconciliation worker remain separated.

## Remaining roadmap

### Phase A — sync conflict matrix

Status: complete.

### Phase B — oversized-file decomposition

Status: complete.

Generated files such as `package-lock.json` and `repomix-output.xml` remain excluded from the hand-written source limit.

### Phase C — staging model-provider activation

Status: source-code configuration and verification complete; protected staging activation remains external.

Required:

- [x] provider-neutral default Coach model with optional domain overrides;
- [ ] configure staging-only provider credentials on the backend;
- [x] verify Nutrition structured-output retry and guardrail rejection paths;
- [x] verify Strength structured-output retry and guardrail rejection paths;
- [x] persist latency, provider/model identifier, attempts, token usage, and validation failures;
- [x] confirm deterministic reviews work with model execution disabled;
- [x] confirm capability flags reflect actual runtime availability.

Completed provider slices:

- backend PR `#35`, merge `0618ffc4534f72120ed2861b929fbd5021276294`: provider-neutral configuration and model routing;
- backend PR `#36`, merge `1f295d8cc76ca4c3d53308929cc574dccf77fcc3`: bounded Nutrition and Strength repair/rejection tests;
- backend PR `#37`, merge `a15e751f4032f9dda1f88613523c3643ae56a8ec`: persisted rejection telemetry.

The remaining credential item requires protected environment values and an explicitly authorized smoke run. Never put provider credentials in mobile code or `EXPO_PUBLIC_*` variables.

### Phase D — Combined Strategy

Status: complete at source-code level.

Backend:

- [x] versioned Combined Strategy request/response contract;
- [x] eligible Nutrition and Strength child proposals composed with Safety context;
- [x] deterministic Safety restrictions and effective Strength load ceilings;
- [x] conservative Nutrition reconciliation with recovery and effective training-load context;
- [x] deterministic final guardrail;
- [x] persisted child run IDs, policy versions, validation reports, and application metadata;
- [x] capability schemas through v10;
- [x] explicit partial-failure and retry behavior;
- [x] automatic application disabled.

Mobile:

- [x] strict capability parsing through v10;
- [x] strict Combined result parsing through contract v3, with v1/v2 compatibility;
- [x] one Combined preview/application screen;
- [x] proposed, maximum allowed, and effective Strength loads displayed;
- [x] reconciliation decision, calorie delta, Safety multiplier, and training-load ratio validated;
- [x] blocking, input-required, modification, warning, and unresolved-movement states displayed;
- [x] separate explicit confirmation for every applying action;
- [x] revision-safe and idempotent application of confirmed mutations.

Latest Combined slices:

- backend PR `#39`, merge `a291293faabb97a6766a053482f9e22649fc2e6a`: Combined v2 and effective Strength plan;
- backend PRs `#40`–`#43`: separate Strength and Nutrition confirmation boundaries and capability schemas v8/v9;
- backend PR `#44`, merge `a4927c5c017a086cfa4787558fa1d37547336780`: conservative reconciliation worker;
- mobile PR `#85`, merge `2c0f8113358c0efacaf26bf8a57a37e718323ca4`: strict v3/v10 parsing, rendering, and confirmation gating;
- backend PR `#45`, merge `14b24e41f27266555230120f3b31d47b86795a73`: Combined v3 integration, capability v10, v2 confirmation compatibility, and reconciliation-gated Nutrition writes.

Combined never offers an aggregate apply operation. Effective Strength and Nutrition use separate routes, confirmation dialogs, idempotency identities, revisioned writes, metadata, and retry/recovery rules. Completed workout history remains immutable. A non-zero calorie delta is review-only until a separate deterministic energy-adjustment policy is approved.

### Phase E — release readiness

Status: repository-local gates and release procedures are complete; combined private-repository, staging, native, and device validation remain.

Required:

- [x] make backend production-config and migration validation blocking on current `main`;
- [x] make compiled production startup and local `/health` blocking in backend CI;
- [ ] run the cross-repository release gate successfully on fixed current mobile/backend SHAs;
- [ ] deploy and validate backend in staging;
- [ ] apply and verify migrations on staging PostgreSQL;
- [ ] verify `/health`, auth, sync push/pull, and Coach polling against staging;
- [ ] create matching native iOS and Android builds containing Expo SecureStore;
- [ ] run real-device smoke tests for workout, nutrition, progress, auth, sync, and Coach flows;
- [ ] test offline restart and queue recovery on device;
- [ ] test sign-in and synchronization on a second device/account runtime;
- [x] document rollout and rollback steps;
- [ ] publish OTA only to a compatible runtime/channel when explicitly requested.

Completed Phase E source/CI slices:

- backend PR `#46`, merge `c8cf3f848e9debacf5e12a105501f5ca8d5cbc96`: PostgreSQL 16, production config, initial/repeated migrations, migrated-schema integration, and full tests;
- backend PR `#47`, merge `bb9129ac6a4a3654f5c0d478a547d33fe5272b9a`: compiled production startup and `/health` gate;
- mobile PR `#88`, merge `92749354b5812fe95ba8b698f2f78c67231d6bb7`: optional `BACKEND_REPOSITORY_TOKEN` support for private backend checkout;
- validation attempt run `30099396214`: mobile exact-SHA job passed; backend job stopped at private cross-repository checkout before code execution.

The combined gate remains blocked until the mobile repository receives a read-only Actions secret named `BACKEND_REPOSITORY_TOKEN` with access to `hon4olo/smart-fitness-backend`. This is an external repository-access configuration item. See `docs/release/validation-record-2026-07-24.md`.

## Recommended immediate next actions

1. Configure read-only `BACKEND_REPOSITORY_TOKEN` in mobile repository Actions secrets.
2. Run `Smart Fitness Release Gate` through `workflow_dispatch` using exact current mobile and backend SHAs; record a fully green run.
3. Configure protected staging credentials and deploy staging only when explicitly authorized.
4. Complete staging smoke, native builds, real-device, offline-restart, and second-device validation.
5. Publish OTA or activate production only when explicitly requested and only after runtime compatibility is confirmed.

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

For backend changes, run the repository's blocking lint, build, test, production-configuration, migration, schema, startup, and health checks.

Do not claim completion when CI is failing or when an external environment action has not actually been performed.

## New-chat starter prompt

> Continue the Smart Fitness roadmap. Read `AGENTS.md`, `PROJECT_LEARNINGS.md`, `ROADMAP_PROGRESS.md`, `docs/implementation-plan.md`, and the release documents first. Inspect latest `main` and open PRs in both `hon4olo/smart-fitness-app` and `hon4olo/smart-fitness-backend`. Continue from the first unchecked code-verifiable item in `ROADMAP_PROGRESS.md`; note external credential, repository-access, deployment, native-build, device, and OTA blockers without inventing completion. Work in small focused PRs, run full blocking CI, merge only exact green heads, preserve existing behavior, and keep every hand-written source file at or below 500 lines. Do not perform OTA/EAS publish, native builds, device installation, backend deployment, staging credential activation, or production feature activation unless explicitly requested. After finishing a slice, update `ROADMAP_PROGRESS.md` and continue.
