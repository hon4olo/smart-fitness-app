# Smart Fitness Roadmap Progress

Updated: 2026-07-25

This is the canonical roadmap index. Detailed, frequently updated phase state lives in small files under `docs/roadmap/` so future updates do not require replacing one large monolithic document.

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
- Revision-aware offline-first synchronization for the implemented domains.
- Deterministic and provider-neutral Coach contracts with explicit confirmation boundaries.
- Blocking mobile line audits, TypeScript, contract tests, and full regression suite.
- Blocking backend lint, build, test, migration, schema, startup, and health checks.
- All tracked hand-written mobile files at or below 500 lines.
- Nutrition child-flow hardening source work complete.
- Privacy-safe crash-reporting source foundation complete.
- Account deletion, authenticated password change, and session/device management complete at source-code level.
- Typed English/Russian localization foundation and dedicated Settings route complete.
- Weight, length, and energy unit preferences implemented with canonical `kg/cm/kcal` storage.

## Detailed phase files

### Release and account

See [`docs/roadmap/release-and-account.md`](docs/roadmap/release-and-account.md).

Covers:

- release gate, staging, native builds, OTA lanes, Sentry, and device validation;
- account deletion, password change, sessions/devices, password reset, privacy, and analytics prerequisites.

### Localization and Settings

See [`docs/roadmap/localization-settings.md`](docs/roadmap/localization-settings.md).

Covers:

- English/Russian translation rollout;
- locale dates, numbers, decimal separators, grouping, and pluralization;
- `kg/lb`, `cm/in`, and `kcal/kJ` coverage;
- accessibility and screenshot validation;
- Settings information architecture and preference scope.

### Data, quality, and scale

See [`docs/roadmap/data-quality-and-scale.md`](docs/roadmap/data-quality-and-scale.md).

Covers:

- user-visible sync status and recovery;
- cross-device Nutrition library sync;
- visual regression and release-device matrix;
- privacy-safe analytics;
- Coach history and trust;
- measured local-storage scalability and possible SQLite migration;
- deferred major scope.

## Recommended immediate next actions

1. Complete remaining localization infrastructure: pluralization, missing-key coverage, and migration of direct number/date formatting.
2. Move Account & Security into the dedicated Settings information architecture.
3. Add user-visible Data & Sync status and safe recovery actions.
4. Configure Sentry/EAS values, select a compatible runtime, and verify source maps on preview devices.
5. Deploy and validate current account-lifecycle backend endpoints when explicitly authorized.
6. Configure `BACKEND_REPOSITORY_TOKEN` and run the fixed-SHA cross-repository release gate.
7. Create matching native builds and execute the device/offline/second-device matrix.
8. Add cross-device Nutrition library sync after device validation of the current local library.

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

For localization changes, also run missing-key, fallback, interpolation, pluralization, and layout checks.

For Settings changes, also test existing-install defaults, account switching, persistence scope, and immediate application.

Do not claim completion when CI is failing or when an external environment action has not actually been performed.

## New-chat starter prompt

> Continue the Smart Fitness roadmap. Read `AGENTS.md`, `PROJECT_LEARNINGS.md`, `ROADMAP_PROGRESS.md`, the files under `docs/roadmap/`, `docs/implementation-plan.md`, `docs/nutrition-roadmap.md`, and the release documents first. Inspect latest `main` and open PRs in both repositories. Continue from the first unchecked code-verifiable item, note external blockers without inventing completion, work in small focused PRs, run full blocking CI, merge only exact green heads, preserve behavior, and keep hand-written source files at or below 500 lines. Do not publish OTA, create native builds, install on devices, deploy backend changes, or activate credentials unless explicitly requested.
