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
- Do not perform OTA/EAS publish, native build, device installation, backend deployment, staging credential activation, or production feature activation unless explicitly requested.

## Overall completion

Estimated roadmap completion: about 97–98%.

The remaining work is concentrated in:

1. configure and smoke-test the model provider in the protected staging environment;
2. finish the remaining Combined Nutrition reconciliation policy;
3. complete release-device and production-readiness validation.

## Completed foundation

### Architecture and documentation

- [x] Single production Fastify/PostgreSQL backend established.
- [x] Mobile and backend agent instructions describe the current architecture.
- [x] Cross-repository implementation plan exists.
- [x] Hand-written file limit of 500 lines is enforced for changed files in CI.
- [x] Repository-wide tracked-file line audit is enforced in blocking mobile CI.
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
- [x] deterministic two-device conflict coverage exists for every mutable entity policy;
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
- [x] Separate explicit Combined Strength-template and Nutrition-target confirmations.
- [x] Revision-safe, idempotent Combined mutation application and interrupted-write recovery.
- [x] Provider-neutral backend model abstraction and capability gating.
- [x] Provider-neutral default model with optional Nutrition, Strength, and Combined overrides.
- [x] Domain guardrail repair/rejection and provider telemetry are explicitly covered.

### Major file decomposition

- [x] All tracked hand-written mobile files are at or below 500 physical lines.
- [x] `SyncCoordinator.ts` is a compatibility facade over operations, state-machine, types, and helpers.
- [x] `WorkoutTemplateSync.ts` is a compatibility facade over serialization/queue and remote-apply modules.
- [x] Coach view models, large screens, Add Food styles, and intelligence fixtures are decomposed below the limit.
- [x] The backend Combined proposal worker is split into contract, strict summary parser, and evaluator modules below 500 lines.
- [x] The mobile Combined parser and application UI are split into contracts, common parsing, v2 parsing, view-model, result, and screen modules below 500 lines.

## Remaining roadmap

### Phase A — complete sync conflict matrix

Status: complete.

Latest completed hardening:

- independent and overlapping edits have explicit deterministic or manual-review policies;
- tombstones are normalized across mutable policies;
- auto-resolved conflicts no longer block cursor advancement;
- duplicate delivery retains stable conflict identity and zero unresolved count;
- unresolved conflict snapshots are stored per user, deduplicated, cleaned up by terminal updates, and restored after restart.

### Phase B — finish oversized-file decomposition

Status: complete.

- [x] resolve every known oversized source file;
- [x] rerun the repository-wide tracked-file audit;
- [x] make the audit a permanent blocking mobile CI step.

Generated files such as `package-lock.json` and `repomix-output.xml` remain excluded.

### Phase C — staging model-provider activation

Status: source-code configuration and verification complete; protected staging activation remains external.

Required:

- [x] make default Coach model configuration provider-neutral with optional domain overrides;
- [ ] configure staging-only provider credentials on the backend;
- [x] verify Nutrition structured-output retry and guardrail rejection paths;
- [x] verify Strength structured-output retry and guardrail rejection paths;
- [x] record latency, provider/model identifier, attempts, token usage, and validation failures;
- [x] confirm deterministic reviews continue to work with model execution disabled;
- [x] confirm capability flags reflect actual runtime availability.

Completed provider slices:

- backend PR `#35`, merge `0618ffc4534f72120ed2861b929fbd5021276294`:
  - `COACH_MODEL_DEFAULT_MODEL` is the provider-neutral fallback;
  - optional Nutrition, Strength, and Combined overrides are routed per request;
  - the model feature remains disabled by default;
  - blank disabled configuration values are treated as unconfigured;
  - the protected smoke workflow exposes no credentials or raw provider output;
- backend PR `#36`, merge `1f295d8cc76ca4c3d53308929cc574dccf77fcc3`:
  - Nutrition and Strength use real agent definitions in bounded repair-success and three-attempt rejection tests;
  - deterministic guardrail issues are supplied to the next model attempt;
- backend PR `#37`, merge `a15e751f4032f9dda1f88613523c3643ae56a8ec`:
  - rejected structured runs retain provider, model, cumulative latency, token usage, attempts, and validation issues;
  - Nutrition and Strength persist the rejection telemetry in agent-run error details.

Disabled-provider verification is covered by the configured-client factory tests and deterministic orchestrator tests. Capability tests verify that structured Strategy flags are false without a runtime model client and true only when one is actually supplied.

The remaining staging credential item requires real protected environment values and an explicitly authorized smoke run. It cannot be marked complete from source code alone. Never put provider credentials in mobile code or `EXPO_PUBLIC_*` variables.

### Phase D — Combined Strategy proposal

Status: versioned composition, Safety-adjusted Strength planning, and separate explicit application flows are complete; Nutrition reconciliation remains.

Backend:

- [x] finalize the versioned Combined Strategy request/response contract;
- [x] compose eligible Nutrition and Strength proposals with Safety context;
- [x] apply deterministic Safety restrictions and load ceilings to the effective Strength plan;
- [ ] reconcile nutrition targets with recovery state and training demand;
- [x] add a deterministic final combined guardrail;
- [x] persist child run IDs, versions, validation reports, and audit/application metadata;
- [x] expose dedicated capability flags;
- [x] define explicit partial-failure and retry behavior;
- [x] keep automatic application disabled.

Mobile:

- [x] strict capability parsing;
- [x] strict versioned result and application parsers;
- [x] one combined preview/application screen;
- [x] display proposed, maximum allowed, and effective Strength loads;
- [x] clear blocking, input-required, modification, warning, and unresolved-movement states;
- [x] separate explicit confirmation for every applying action;
- [x] revision-safe and idempotent application of confirmed mutations.

Completed Combined slices:

- backend PR `#33` added the `combined_proposal_review` request, three child runs, final deterministic evaluation, child IDs, policy/audit metadata, capability schema v7, fail-closed child parsing, idempotent parent request handling, and `automaticApplication: false`;
- mobile PR `#52` added strict capability v7 parsing, strict proposal parsing/view-model construction, and the read-only Combined proposal preview with pending-action and guardrail states;
- backend PR `#38`, merge `1c39461d19b22f4953dd05841979ee6e75f9d45c`, decomposed the Combined proposal worker without changing its contract or behavior;
- backend PR `#39`, merge `a291293faabb97a6766a053482f9e22649fc2e6a`, added contract v2, strict Safety restrictions, deterministic effective Strength weights/tonnage, and fail-closed unresolved movement restrictions;
- mobile PR `#80`, merge `8b72fa1514611e7e8b8fd27fd46de66e885a8333`, added strict v2 arithmetic/restriction parsing, v1 compatibility, and effective-load rendering;
- backend PR `#40`, merge `10b4c443321af96f387a24ec0734e46206616f17`, added explicit effective-Strength confirmation with Combined revalidation, revisioned template creation, deterministic identity, and operation recovery;
- mobile PR `#82`, merge `ed1d866697ac64372897743451b42dbbc95fa61f`, added capability v8, a separate Strength confirmation dialog/control, stable retry identity, sync refresh, and strict application metadata parsing;
- backend PR `#41`, merge `c2b894a6d7894b4fc16868f8207a5cd15c919042`, advertised effective-Strength confirmation in capability schema v8;
- backend PR `#42`, merge `e988556b8053277d0e8c349a934240ad22d6ea60`, added explicit Combined Nutrition delegation, stable child idempotency, parent audit metadata, stale-state blocking, and interrupted-parent recovery;
- mobile PR `#83`, merge `de36fae882c50cbbb45fe863592f8d3c7b4dd181`, added capability v9, a separate Nutrition confirmation dialog/control, and independent Strength/Nutrition application states;
- backend PR `#43`, merge `3e4737bb5d6f35ed97a522b2aa0e049e4cb2bd79`, advertised both explicit confirmations in capability schema v9.

Combined never offers an aggregate apply operation. Effective Strength and Nutrition have separate routes, confirmation dialogs, idempotency identities, revisioned writes, application metadata, and retry/recovery rules. Completed workout history remains immutable and `automaticApplication` remains false.

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

1. Inspect the approved Nutrition and Combined policies, then define a conservative deterministic reconciliation contract for recovery state and training demand.
2. Keep reconciliation read-only until strict parsing, final guardrails, and explicit confirmation behavior are defined.
3. Configure protected staging credentials and run the provider smoke workflow only when explicitly authorized.
4. Run the fixed-SHA cross-repository release gate and real staging/device validation when deployment and native-build actions are explicitly authorized.

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

> Continue the Smart Fitness roadmap. Read `AGENTS.md`, `PROJECT_LEARNINGS.md`, `ROADMAP_PROGRESS.md`, and `docs/implementation-plan.md` first. Inspect latest `main` and open PRs in both `hon4olo/smart-fitness-app` and `hon4olo/smart-fitness-backend`. Continue from the first unchecked code-verifiable item in `ROADMAP_PROGRESS.md`; note external credential/deployment blockers without inventing completion. Work in small focused PRs, run full blocking CI, merge only green exact heads, preserve existing behavior, and keep every hand-written source file at or below 500 lines. Do not perform OTA/EAS publish, native builds, device installation, backend deployment, staging credential activation, or production feature activation unless explicitly requested. After finishing a slice, update `ROADMAP_PROGRESS.md` and continue.
