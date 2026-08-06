# Smart Fitness Current Status

Updated: 2026-08-07

## Verified repository baseline

Verified after backend PR #174:

- mobile `main` before this documentation slice: `9f850036142fd72bc8cb76a3beaf756989ad0b38`;
- backend `main`: `5f66e7b5b9756d951bbfe1071b6e9b459604ea3d`;
- backend PR #170 added the executable Social ownership/privacy audit;
- backend PR #171 added the bounded `social_profile_and_authored_posts` source without registering a seventh complete projection;
- backend PR #172 resolved managed avatar/post-media disposition as notice-only mixed-policy data;
- backend PR #173 resolved notification actor/target representation through permanent omission;
- backend PR #174 resolved notification source bounds, ordering and snapshot semantics while preserving received-activity disclosure and source-implementation blockers;
- no open mobile or backend pull requests existed before this documentation branch was created.

Always re-check both repositories and open pull requests before work. This file records a checkpoint, not a live Git query.

## Engineering state

The canonical implementation plan remains approximately 89% complete / 11% remaining by weighted roadmap work packages. Active packages remain:

1. P9-B3 provider/environment retention evidence — externally blocked until exact providers/environments and lifecycle evidence are available.
2. P9-C consent and analytics prerequisites — collection remains disabled; no production event or measurement purpose is registered.
3. P9-D privacy-facing controls and policy evidence — six complete projections plus bounded partial Social sources/decisions exist; complete Social export remains blocked.
4. Operational and physical evidence — authorization-gated staging, deployment, worker scheduling, native build, release-device, offline-restart, accessibility, localization and second-device validation.

## Mobile state

Current mobile source retains focused production state boundaries, revisioned synchronization for every registered private domain, persisted conflict review/resolution, secure native token storage, deterministic Coach flows, account-deletion recovery/privacy contracts, blocking source CI, Expo export and Expo Doctor checks. No production analytics or provider-backed collection path is active.

## Backend privacy/export state

Backend `main` contains six complete ownership-safe export projections:

- `profile_and_account_metadata`;
- `progress_measurements_and_weight`;
- `limitations_recovery_and_safety_context`;
- `nutrition_and_meal_data`;
- `workouts_programs_and_exercises`;
- `coach_reviews_proposals_and_run_history`.

`social_profile_and_authored_posts` remains a bounded partial source outside that registry. Managed media remains notice-only and blocked from implementation.

### Notification source-plan baseline

Backend PR #173 defines the maximum future actor/target-free notification representation as:

- closed notification type;
- read timestamp;
- creation timestamp.

Backend PR #174 additionally resolves the technical source-plan semantics:

- only notifications received by the authenticated active owner are eligible;
- the read occurs in one read-only PostgreSQL `REPEATABLE READ` transaction;
- deterministic ordering is `created_at` ascending with internal notification ID as the tie-breaker;
- the internal tie-breaker is never exported;
- the source fails closed above 5,000 eligible notifications;
- silent truncation, continuation tokens and independently committed pages are prohibited;
- notification type and type-specific target shape are strictly validated;
- self-actor rows fail closed;
- actor/recipient IDs, actor fields, target IDs/content, dedupe keys and delivery metadata remain excluded.

These decisions remove the notification-specific deterministic bounds/snapshot blocker only. They do **not** authorize disclosure or implementation:

- `receivedActivityDisclosure` remains `blocked`;
- `sourceImplementationAllowed` remains `false`;
- `social_notifications` remains `blocked_policy_decision`;
- the complete Social projection remains globally blocked.

No notification query/repository, DTO, route, schema, migration, archive, delivery path, deployment or production activation was added by PR #174.

## Social export audit state

The executable Social audit still covers exactly eight candidate tables. Incoming blocks remain permanently excluded. Received third-party activity is not automatically owner-authored export data. Remaining reviewed decisions include counterpart representation for graph/action tables, incoming third-party disclosure, owner-authored comment/reaction target handling, inaccessible/deleted/private/blocked target behavior, and whether minimized actor/target-free received notification metadata may be disclosed at all.

The next bounded Social slice should resolve exactly one remaining audit decision. The most direct notification continuation is the policy decision on whether the already-minimized actor/target-free received notification metadata is disclosable. Until that decision is explicitly resolved, notification source implementation remains prohibited.

## Disabled or authorization-gated

The following remain disabled, absent from default production composition, or require direct authorization:

- product analytics, crash collection, performance telemetry, attribution and advertising tracking;
- complete Social projection implementation;
- notification source implementation and received-activity disclosure;
- managed-media notice projection and binary media export;
- public data-access export assembly, archive generation, secure delivery and mobile export UI;
- provider/model staging execution;
- worker scheduling and external lifecycle proof;
- backend deployment and production migration execution;
- OTA/EAS publication, native build/install, rollback and store submission;
- credential, DNS, provider-account or production-environment changes.

## Documentation state

`docs/implementation-plan.md` remains the canonical cross-repository roadmap. This status checkpoint records backend PR #174 as the current Social notification source-plan baseline and narrows the next safe P9-D action to one reviewed policy decision at a time.