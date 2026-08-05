# Smart Fitness Current Status

Updated: 2026-08-05

## Verified repository baseline

Verified after backend PR #168 and mobile PR #446:

- mobile `main`: `6df2278614b296e782e4edffb6b4895e7176f3a6`;
- backend `main`: `ccea35967516b168e877e8803a8dd3c7c40c973d`;
- backend PR #168 merged the `coach_reviews_proposals_and_run_history` export projection;
- mobile PR #444 removed the destructive Expo template reset command/script and two empty root artifacts;
- mobile PR #445 replaced the auth token manager's `globalThis.atob` dependency with strict platform-independent base64url/UTF-8 decoding and added focused fail-closed tests;
- mobile PR #446 recorded the audit-hardening baseline;
- no open mobile or backend pull requests before this roadmap-sync slice.

Always re-check both repositories and open pull requests before work. This file records a checkpoint, not a live Git query.

## Engineering state

The canonical implementation plan estimates approximately:

- completed: 89%;
- remaining: 11%.

Completed source packages include:

- P0-P6 provider-neutral foundations and readiness scaffolding;
- P7 explicit synchronization-conflict resolution;
- P8 diagnostics and adversarial release preparation;
- P9-A technical data inventory;
- P9-B1 operational retention foundation;
- P9-B2 cross-surface account deletion source work.

Active packages remain unchanged:

1. P9-B3 provider/environment retention evidence — externally blocked until exact providers, environments, owners, credentials, lifecycle controls, and evidence are available.
2. P9-C consent and analytics prerequisites — collection remains disabled; no production event or measurement purpose is registered.
3. P9-D privacy-facing controls and policy evidence — source-only preparation boundaries and ownership-safe projections are being extended.
4. Operational and physical evidence — authorization-gated staging, deployment, worker scheduling, native build, release-device, offline-restart, accessibility, localization, and second-device validation.

The repository-hygiene and JWT-hardening work does not reorder those roadmap packages. See `docs/implementation-plan.md` for complete package evidence.

## Mobile state

Current mobile source includes:

- focused production state boundaries with zero production `useAppContext` consumers;
- revisioned synchronization for every currently registered private mobile domain;
- persisted conflict review and explicit conflict resolution;
- secure native token storage;
- strict platform-independent JWT base64url/UTF-8 expiry decoding with fail-closed malformed-token behavior;
- no destructive template reset command or script and no tracked empty root log/success artifacts;
- deterministic and structured Coach flows with explicit confirmation;
- account-deletion recovery and privacy-facing fail-closed contracts;
- blocking source CI, Expo export, and Expo Doctor checks;
- no known tracked hand-written source file above 500 physical lines.

Source tests do not replace physical matching-runtime validation.

## Backend state

Backend `main` contains:

- authenticated ownership-safe revisioned synchronization for the full current mobile entity set;
- deterministic and structured Coach orchestration;
- provider-neutral capability gates;
- account deletion and deletion-receipt source flows;
- technical data and operational retention registries;
- disabled-by-default data-access export route/preparation boundaries;
- durable source attempt limiting;
- six ownership-safe export projections on `main`:
  - `profile_and_account_metadata`;
  - `progress_measurements_and_weight`;
  - `limitations_recovery_and_safety_context`;
  - `nutrition_and_meal_data`;
  - `workouts_programs_and_exercises`;
  - `coach_reviews_proposals_and_run_history`.

The Coach projection reads owner-scoped runs and stages in one repeatable-read snapshot, explicitly parses all nine current request types, excludes raw request/context/result/stage payloads and internal/provider metadata, and fails closed on unsupported result shapes, lifecycle inconsistencies, ownership mismatch, or source-bound overflow.

All projections remain separate from preparation, route activation, multi-surface assembly, archive generation, secure delivery, and mobile UI.

## Remaining candidate export surface

The only remaining raw candidate surface is:

- `social_relationships_and_account_activity`.

Social requires explicit separation of authored versus received activity, self-owned versus other-user fields, relationships and blocks, notifications, moderation/security records, and mixed-policy data before implementation.

## Deferred audit recommendations

The following audit suggestions are not approved implementation work without new evidence:

- migrating focused Context boundaries to Zustand or Jotai;
- replacing the reviewed AsyncStorage snapshot with SQLite, WatermelonDB, MMKV, or another local database;
- mass-moving shared `data`, `domain`, and `components` code into feature directories;
- mechanically consolidating `test/`, `tests/`, and colocated tests without first auditing CI, path-reading tests, and ownership;
- adding performance refactors before release-device profiling demonstrates a specific render or interaction bottleneck.

## Disabled or authorization-gated

The following remain disabled, absent from default production composition, or require direct authorization:

- product analytics, crash collection, performance telemetry, attribution, and advertising tracking;
- public data-access export assembly, archive generation, secure delivery, and mobile export UI;
- model/provider staging execution;
- worker scheduling and external lifecycle proof;
- backend deployment and production migration execution;
- OTA/EAS publication, native build, installation, rollback execution, and store submission;
- credential, DNS, provider-account, or production-environment changes.

## Documentation state

- `docs/project-context.md` provides stable orientation;
- `docs/current-status.md` provides mutable verified state;
- `docs/handoffs/latest.md` provides the continuation checkpoint;
- `docs/architecture/README.md` indexes focused architecture documents;
- `docs/implementation-plan.md` remains the canonical cross-repository roadmap.
