# Smart Fitness Roadmap Progress

Updated: 2026-07-31

This is the canonical roadmap index. Detailed phase state lives in focused files under `docs/roadmap/`.

Read this index together with:

- `AGENTS.md`;
- `PROJECT_LEARNINGS.md`;
- `docs/implementation-plan.md`;
- `docs/nutrition-roadmap.md`;
- `docs/release/validation-record-2026-07-24.md`;
- `docs/release/rollout-and-rollback.md`;
- `docs/release/crash-reporting.md`;
- backend `hon4olo/smart-fitness-backend/AGENTS.md` when backend changes are required.

## Repositories

- Mobile: `hon4olo/smart-fitness-app`
- Backend: `hon4olo/smart-fitness-backend`
- Production API: `https://api.peptonio.com`

Always inspect current `main` and open pull requests in both repositories before changing code.

## Working rules

- Continue without asking for confirmation after every completed slice.
- Use small focused branches and pull requests.
- Run full blocking CI and merge only the exact green head.
- Preserve behavior unless the roadmap explicitly changes it.
- Keep every hand-written source file at or below 500 physical lines.
- Do not add a second backend or provider secrets to mobile code.
- Do not perform OTA/EAS publish, native builds, device installation, backend deployment, staging activation, or production activation unless explicitly requested.
- New user-facing copy must use the localization layer.
- Never add health, nutrition, workout, limitation, authentication, or Coach content to telemetry.

## Completed foundation

- Single Fastify/PostgreSQL backend.
- Revision-aware offline-first synchronization for weight history, workout sessions, workout templates, food entries, nutrition targets, fitness profiles, limitations, recovery check-ins, body measurements, training programs, custom exercises, meal templates, and the account-scoped Nutrition library.
- Stable UUID custom-exercise references across templates, sessions, programs, and Coach contexts.
- Strict nested meal-template snapshot validation with separate template/diary identity.
- Deterministic and provider-neutral Coach contracts with explicit confirmation boundaries.
- Combined Review and Combined Proposal source flows with separate applying confirmations and no automatic mutation.
- Blocking mobile line audits, TypeScript, Coach/sync contracts, full regression suite, Expo export, and Expo Doctor.
- Blocking backend lint, build, tests, migration/schema checks, startup, and health validation.
- All tracked hand-written mobile/backend source and architecture files at or below 500 lines.
- Durable restart recovery for the eager weight-history outbox path.
- Deterministic restart replanning for planner-based synchronized domains from persisted state, metadata, and pending operations.
- Push and pull access-token refresh retry contracts preserving exact revisions, payloads, and idempotency keys.
- Behavioral concurrent-pull coverage proving local mutations survive metadata loading while remote non-weight data is materialized.
- Broad two-device conflict coverage, including update/delete matrices for all mutable synchronized domains and real PostgreSQL Nutrition-library concurrency.
- Persisted unresolved conflict state and safe Data & Sync status, retry, recovery, conflict review, and diagnostics.
- Account deletion, authenticated password change, and session/device management complete at source-code level.
- Typed English/Russian localization foundation and dedicated Settings route complete.
- Repository-wide presentation audits for controls, accessibility, units, formatting, statuses, provider/backend errors, and internal codes.
- Weight, length, and energy unit preferences implemented with canonical `kg/cm/kcal` storage.

## Detailed phase files

### Release and account

See [`docs/roadmap/release-and-account.md`](docs/roadmap/release-and-account.md).

Covers:

- release gate, staging, native builds, OTA lanes, and device validation;
- account deletion, password change, sessions/devices, password reset, privacy, and analytics prerequisites.

### Localization and Settings

See [`docs/roadmap/localization-settings.md`](docs/roadmap/localization-settings.md).

Covers:

- English/Russian translation rollout;
- locale dates, numbers, decimal separators, grouping, and pluralization;
- `kg/lb`, `cm/in`, and `kcal/kJ` coverage;
- visible control-copy and raw-status source audits;
- accessibility and physical-device validation;
- Settings information architecture and preference scope.

### Data, quality, and scale

See [`docs/roadmap/data-quality-and-scale.md`](docs/roadmap/data-quality-and-scale.md).

Covers:

- user-visible sync status and recovery;
- privacy-safe analytics;
- Coach history and trust;
- restart recovery, token refresh, concurrent mutation, and second-device conflict hardening;
- measured local-storage scalability and possible SQLite migration;
- deferred major scope.

## Recommended immediate next actions

All currently known autonomous source-level localization and sync-hardening gaps are complete. The next items depend on a product contract, credentials, or physical environments:

1. Configure `BACKEND_REPOSITORY_TOKEN` and run the fixed-SHA cross-repository release gate when explicitly authorized.
2. Introduce provider-neutral Coach model configuration and validate the provider in staging when credentials are available.
3. Create matching native builds and execute the release-device, offline-restart, second-device, EN/RU, unit, and accessibility matrices when explicitly authorized.
4. Define an explicit local-versus-account conflict-choice contract before adding destructive conflict controls.
5. Define the privacy/consent/retention contract before implementing product analytics.
6. Measure local-state size and restore/save performance before considering SQLite.
7. Continue bounded source work only for newly discovered real regressions or separately prioritized product scope.

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

For localization changes, also run missing-key, fallback, interpolation, pluralization, and source-boundary checks.

For Settings changes, also test existing-install defaults, account switching, persistence scope, and immediate application.

Do not claim completion when CI is failing or when an external environment action has not actually been performed.

## New-chat starter prompt

> Continue the Smart Fitness roadmap. Read `AGENTS.md`, `PROJECT_LEARNINGS.md`, `ROADMAP_PROGRESS.md`, the files under `docs/roadmap/`, `docs/implementation-plan.md`, `docs/nutrition-roadmap.md`, and the release documents first. Inspect latest `main` and open PRs in both repositories. Continue from the first unchecked code-verifiable item, note external or product-contract blockers without inventing completion, work in small focused PRs, run full blocking CI, merge only exact green heads, preserve behavior, and keep hand-written source files at or below 500 lines. Do not publish OTA, create native builds, install on devices, deploy backend changes, or activate credentials unless explicitly requested.
