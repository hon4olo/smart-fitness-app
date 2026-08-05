# Smart Fitness Current Status

Updated: 2026-08-05

## Verified repository baseline

Verified after backend PR #173:

- mobile `main` before this documentation slice: `4cf8494c8a960874747ff8b3cc32109f3c91aadc`;
- backend `main`: `f35a8c0b9a343ac759e1d617c7d088d599b0ed7a`;
- backend PR #170 added an executable Social ownership/privacy audit and kept complete Social projection implementation globally blocked;
- backend PR #171 added the audit-approved `social_profile_and_authored_posts` source without registering a seventh complete projection;
- backend PR #172 resolved managed avatar/post-media disposition as a separate notice-only mixed-policy surface while keeping media notice/binary implementation blocked;
- backend PR #173 resolved notification actor/target representation through permanent omission while keeping notification disclosure and source implementation blocked;
- mobile PR #451 synchronized the canonical roadmap to the managed-media decision;
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
3. P9-D privacy-facing controls and policy evidence — six complete source projections, bounded Social owned-content source, notice-only managed-media disposition, and actor/target-free notification representation exist; complete Social, notification source, and media notice/binary implementation remain blocked.
4. Operational and physical evidence — authorization-gated staging, deployment, worker scheduling, native build, release-device, offline-restart, accessibility, localization, and second-device validation.

The Social decisions do not reorder those roadmap packages, increase the implemented-projection count, or activate an export route. See `docs/implementation-plan.md` for complete package evidence.

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

Backend PR #172 adds executable decision `managed_media_notice_only`:

- profile avatar and workout-post media remain excluded from owned-content and raw Social relationship/activity sources;
- both bindings map to `managed_media_metadata` as `notice_only` / `mixed_policy_review`;
- raw URLs, asset IDs, descriptors, object keys, hashes, provider/model fields, moderation/OCR signals, reviewer state, appeals, legal holds, cleanup, delivery, lease, and retention internals remain excluded;
- missing or unavailable media never blocks otherwise eligible non-media content and never causes an ID/URL fallback;
- separate notice projection and binary media export remain blocked.

Backend PR #173 adds executable decision `notification_metadata_without_actor_or_target`:

- the maximum future notification shape is closed notification type, read timestamp, and creation timestamp;
- actor and target representation are always omitted;
- actor/recipient IDs, actor profile/display fields, post/comment IDs and content, dedupe keys, and delivery metadata remain excluded;
- actor/target deletion, blocking, privacy changes, or inaccessibility have no representation effect because actor/target data is absent;
- `receivedActivityDisclosure` remains `blocked`;
- `sourceImplementationAllowed` remains `false`;
- notification bounds, ordering, repeatable-read semantics, deleted-owner behavior, and PostgreSQL source evidence remain unresolved.

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
- follows, follow requests, blocks, reactions, comments, and notifications remain `blocked_policy_decision` sources;
- incoming block relationships are permanently excluded;
- reactions and comments are candidate only when authored by the authenticated user;
- internal account/content IDs, idempotency/dedupe keys, source workout IDs/revisions, and other-user private fields are excluded;
- managed media is separate notice-only mixed-policy data and remains excluded from the Social owned-content source;
- notification actor/target representation is resolved by omission, but received-notification third-party disclosure and source bounds/snapshot semantics remain unresolved;
- counterpart representation, incoming third-party activity, action-target/inaccessible-record behavior, and deterministic bounds/snapshot semantics remain unresolved;
- `SOCIAL_EXPORT_PROJECTION_IMPLEMENTATION_ALLOWED` remains `false`.

The complete registered Social surface remains blocked. Incoming block disclosure remains permanently prohibited, and received third-party activity is not automatically owner-authored export data.

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
- notification source implementation and received-activity disclosure;
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
- `docs/implementation-plan.md` remains the canonical cross-repository roadmap and records the bounded Social source plus resolved media and notification representation decisions while requiring one reviewed decision per remaining Social boundary.
