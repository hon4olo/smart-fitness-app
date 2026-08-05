# Smart Fitness Current Status

Updated: 2026-08-05

## Verified repository baseline

Verified after backend PR #172:

- mobile `main` before this documentation slice: `1960315fb9befe1a9ad8d34c1cce8b16983eb5d7`;
- backend `main`: `9a19bff2bf8ce327b7cbeda77fc3097c5994b40e`;
- backend PR #168 merged the `coach_reviews_proposals_and_run_history` export projection;
- backend PR #169 added strict parent-run/child-stage lifecycle validation for that projection;
- backend PR #170 added an executable Social ownership/privacy audit and kept complete Social projection implementation globally blocked;
- backend PR #171 added the audit-approved `social_profile_and_authored_posts` source for the owner's own profile and active authored posts without registering a seventh complete projection;
- backend PR #172 resolved managed avatar/post-media disposition as a separate notice-only mixed-policy surface while keeping both complete Social and managed-media notice projection implementation blocked;
- mobile PR #450 synchronized the canonical roadmap to the bounded Social owned-content source;
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
3. P9-D privacy-facing controls and policy evidence — six complete source projections, the bounded Social owned-content source, and a resolved notice-only managed-media disposition exist; complete Social and managed-media notice projection implementation remain blocked.
4. Operational and physical evidence — authorization-gated staging, deployment, worker scheduling, native build, release-device, offline-restart, accessibility, localization, and second-device validation.

The managed-media decision does not reorder those roadmap packages, increase the implemented-projection count, or activate an export route. See `docs/implementation-plan.md` for complete package evidence.

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

Backend PR #171 additionally provides the bounded non-surface source `social_profile_and_authored_posts`:

- it reads only the authenticated owner's active account, own Social profile, and active authored workout posts;
- profile output is limited to username, display name, bio, visibility, and timestamps;
- post output is rebuilt through a strict version-1 snapshot parser and includes only bounded user-facing workout values, caption, and creation time;
- raw avatar URLs, managed-media references, graph edges, requests, blocks, reactions, comments, received activity, notifications, internal IDs, revisions, idempotency keys, raw JSON, and every other-user field are excluded;
- owner/profile/post reads share one read-only repeatable-read snapshot and fail closed above 1,000 active authored posts;
- the output uses `sourceId: social_profile_and_authored_posts`, sets `fullSurfaceProjectionAllowed: false`, and is not part of the implemented-projection registry.

Backend PR #172 adds the executable decision `managed_media_notice_only`:

- `social_profiles.avatar_url`, `social_profiles.avatar_media_asset_id`, and `social_workout_posts.media_asset_id` remain excluded from owned-content and raw Social relationship/activity sources;
- both avatar and workout-post media map to the separate registered `managed_media_metadata` surface;
- that surface remains `notice_only` with `mixed_policy_review` row scope;
- raw URLs, asset IDs, public descriptors, private object keys, hashes, provider/model fields, moderation/OCR signals, reviewer state, appeals, legal holds, cleanup, delivery, lease, and retention internals remain excluded;
- missing, deleted, rejected, failed, or unavailable media does not prevent export of otherwise eligible non-media profile/post content and never causes an ID or URL fallback;
- all seven managed-media governance tables remain notice-only;
- `SOCIAL_MANAGED_MEDIA_NOTICE_PROJECTION_IMPLEMENTATION_ALLOWED` remains `false`.

The Coach projection reads owner-scoped runs and stages in one repeatable-read snapshot, explicitly parses all nine current request types, excludes raw request/context/result/stage payloads and internal/provider metadata, and fails closed on unsupported result shapes, ownership mismatch, source-bound overflow, or lifecycle inconsistency.

Lifecycle validation requires status-appropriate stage timestamps, prevents active stages under queued runs and unfinished stages under terminal runs, and bounds every stage start/completion inside the parent run window.

All projections and partial source/decision contracts remain separate from preparation invocation, route activation, multi-surface assembly, archive generation, secure delivery, and mobile UI.

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

The current audit establishes:

- own-profile and own-active-post data is implemented only through the bounded partial source and strict allowlists;
- follows, follow requests, blocks, reactions, comments, and notifications remain blocked on counterpart, third-party, target, inaccessible-record, or deterministic-bound decisions;
- incoming block relationships are permanently excluded;
- reactions and comments are candidate only when authored by the authenticated user;
- internal account/content IDs, idempotency/dedupe keys, source workout IDs/revisions, and other-user private fields are excluded;
- moderation and anti-abuse governance remain separate notice-only or mixed-policy surfaces;
- managed avatar/post media disposition is resolved as separate `managed_media_metadata` notice-only mixed-policy data and remains excluded from the Social owned-content source;
- counterpart representation, received third-party activity, deleted/private/blocked/inaccessible targets, and deterministic bounds/snapshot semantics remain unresolved;
- `SOCIAL_EXPORT_PROJECTION_IMPLEMENTATION_ALLOWED` remains `false`.

The complete registered Social surface remains blocked. Counterpart identity, incoming third-party activity, action-target representation, notifications, deleted/private/blocked/inaccessible target behavior, and remaining table bounds/snapshot semantics still require separate reviewed decisions. Incoming block disclosure remains permanently prohibited.

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
- complete Social projection implementation;
- managed-media notice projection and binary media export;
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
- `docs/implementation-plan.md` remains the canonical cross-repository roadmap and records the bounded Social source plus notice-only media disposition while requiring one reviewed decision per remaining Social boundary.
