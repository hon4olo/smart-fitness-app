# Smart Fitness Current Status

Updated: 2026-08-05

## Verified repository baseline

Verified after backend PR #170 and closure of backend draft PR #171:

- mobile `main`: `53a7f638ef4d94b98b998f088374f64b733c3f26`;
- backend `main`: `f840253791414abca044e85d4a50e78789699a14`;
- backend PR #168 merged the `coach_reviews_proposals_and_run_history` export projection;
- backend PR #169 added strict parent-run/child-stage lifecycle validation for that projection;
- backend PR #170 added an executable Social ownership/privacy audit and kept Social projection implementation globally blocked;
- backend draft PR #171 attempted a Social projection from the pre-audit baseline and was closed without merge after confirmed policy, managed-media, deleted-target, stale-base, and file-size blockers;
- mobile PR #447 synchronized the canonical roadmap from five to six ownership-safe projections;
- mobile PR #448 recorded Coach lifecycle-hardening evidence and selected Social audit as the next safe slice;
- no open mobile or backend pull requests before this documentation slice.

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
3. P9-D privacy-facing controls and policy evidence — six source projections exist; Social ownership/privacy decisions remain blocked before any seventh projection.
4. Operational and physical evidence — authorization-gated staging, deployment, worker scheduling, native build, release-device, offline-restart, accessibility, localization, and second-device validation.

The Social audit does not reorder those roadmap packages or increase the implemented-projection count. See `docs/implementation-plan.md` for complete package evidence.

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

The Coach projection reads owner-scoped runs and stages in one repeatable-read snapshot, explicitly parses all nine current request types, excludes raw request/context/result/stage payloads and internal/provider metadata, and fails closed on unsupported result shapes, ownership mismatch, source-bound overflow, or lifecycle inconsistency.

Lifecycle validation requires status-appropriate stage timestamps, prevents active stages under queued runs and unfinished stages under terminal runs, and bounds every stage start/completion inside the parent run window.

All projections remain separate from preparation, route activation, multi-surface assembly, archive generation, secure delivery, and mobile UI.

## Social export audit state

Backend PR #170 covers exactly eight registered Social candidate tables:

- `social_profiles`;
- `social_follows`;
- `social_follow_requests`;
- `social_blocks`;
- `social_workout_posts`;
- `social_workout_reactions`;
- `social_workout_comments`;
- `social_notifications`.

The audit establishes:

- own-profile and own-active-post source planning may proceed only through strict allowlists;
- follows, follow requests, blocks, reactions, comments, and notifications remain blocked on counterpart or third-party policy decisions;
- incoming block relationships are permanently excluded;
- reactions and comments are candidate only when authored by the authenticated user;
- internal account/content IDs, idempotency/dedupe keys, source workout IDs/revisions, managed-media IDs, and other-user private fields are excluded;
- moderation, anti-abuse, and managed-media governance remain separate notice-only or mixed-policy surfaces;
- counterpart representation, received third-party activity, managed-media disposition, deleted/inaccessible targets, and deterministic bounds/snapshot semantics remain unresolved;
- `SOCIAL_EXPORT_PROJECTION_IMPLEMENTATION_ALLOWED` remains `false`.

Backend draft PR #171 was not accepted as a seventh projection because it was based before the audit, autonomously resolved blocked policy questions, exported the unresolved avatar URL, did not exclude deleted referenced posts, and introduced a 527-line repository above the mandatory 500-line limit. The branch remains available for selective reuse after reviewed decisions.

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
- `docs/implementation-plan.md` remains the canonical cross-repository roadmap and already requires an explicit ownership/privacy decision before Social implementation.
