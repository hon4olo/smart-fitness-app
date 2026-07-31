# Smart Fitness Roadmap Progress

Updated: 2026-07-31

This is the canonical roadmap index. Detailed phase state lives in focused files under `docs/roadmap/`.

Read this index together with:

- `AGENTS.md`;
- `PROJECT_LEARNINGS.md`;
- `docs/implementation-plan.md`;
- `docs/nutrition-roadmap.md`;
- `docs/roadmap/social-network.md`;
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
- Never add health, nutrition, workout, limitation, authentication, Coach, or social-content payloads to telemetry.

## Completed foundation

- Single Fastify/PostgreSQL backend.
- Revision-aware offline-first synchronization for private fitness data and the account-scoped Nutrition library.
- Stable UUID custom-exercise references across templates, sessions, programs, and Coach contexts.
- Strict nested meal-template snapshot validation with separate template/diary identity.
- Deterministic and provider-neutral Coach contracts with explicit confirmation boundaries.
- Combined Review and Combined Proposal source flows with separate applying confirmations and no automatic mutation.
- Blocking mobile line audits, TypeScript, Coach/sync contracts, full regression suite, Expo export, and Expo Doctor.
- Blocking backend lint, build, tests, migration/schema checks, startup, and health validation.
- All tracked hand-written mobile/backend source and architecture files at or below 500 lines.
- Durable restart recovery, token refresh, concurrent pull, two-device conflict, and privacy-safe Data & Sync coverage for current private-data contracts.
- Account deletion, authenticated password change, and session/device management complete at source-code level.
- Typed English/Russian localization foundation and repository-wide presentation audits.
- Weight, length, and energy unit preferences implemented with canonical `kg/cm/kcal` storage.

## Detailed phase files

### Social network

See [`docs/roadmap/social-network.md`](docs/roadmap/social-network.md).

Covers:

- server-authoritative social profiles and follow graph;
- immutable opt-in workout-post snapshots;
- chronological following feed;
- reactions, comments, notifications, blocking, reports, and moderation;
- strict privacy separation from private AppState and revisioned sync.

### Release and account

See [`docs/roadmap/release-and-account.md`](docs/roadmap/release-and-account.md).

Covers release gate, staging, native builds, OTA lanes, device validation, account security, privacy, and analytics prerequisites.

### Localization and Settings

See [`docs/roadmap/localization-settings.md`](docs/roadmap/localization-settings.md).

Covers English/Russian copy, locale formatting, unit presentation, source audits, accessibility, and Settings preference scope.

### Data, quality, and scale

See [`docs/roadmap/data-quality-and-scale.md`](docs/roadmap/data-quality-and-scale.md).

Covers sync status/recovery, Coach trust, privacy-safe analytics prerequisites, local-storage measurement, and physical second-device validation.

## Recommended immediate next actions

Social MVP is now the first active source-code program:

1. Implement backend social-profile schema, username contract, visibility, ownership-safe repository/service boundaries, migration, and tests.
2. Add authenticated self-profile and bounded username/public-profile reads.
3. Add follow requests, follows, and block enforcement.
4. Add strict mobile API parsers and profile screens only after backend contracts merge.
5. Define and implement immutable opt-in workout-post snapshots.
6. Add the chronological following feed, then reactions/comments/notifications.
7. Complete moderation and physical-device matrices before broad release.

Parallel external items remain blocked on explicit authorization or dependencies: release-gate execution, staging model credentials, native builds, deployment, and physical second-device/accessibility validation.

## Validation expectations

For mobile TypeScript changes:

```bash
npx tsc --noEmit
npm test
```

For backend TypeScript/schema changes:

```bash
npm run build
npm test
npm run lint
npm run format:check
npm run db:generate
```

For native dependency or Expo configuration changes:

```bash
npx expo-doctor
```

Do not claim completion when CI is failing or when an external environment action has not actually been performed.

## New-chat starter prompt

> Continue the Smart Fitness Social MVP roadmap. Read `AGENTS.md`, `PROJECT_LEARNINGS.md`, `ROADMAP_PROGRESS.md`, `docs/roadmap/social-network.md`, `docs/implementation-plan.md`, and relevant backend instructions first. Inspect latest `main` and open PRs in both repositories. Continue from the first unchecked Social MVP item, keep public social data separate from private offline sync, work in small focused PRs, run full blocking CI, merge only exact green heads, preserve privacy and ownership boundaries, and keep hand-written files at or below 500 lines. Do not publish OTA, create native builds, install on devices, deploy backend changes, or activate credentials unless explicitly requested.
