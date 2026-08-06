# Latest Handoff

Updated: 2026-08-06

## Checkpoint

Social notification source-plan checkpoint after backend PR #174:

- mobile `main` before this documentation slice: `9f850036142fd72bc8cb76a3beaf756989ad0b38`;
- backend `main`: `5f66e7b5b9756d951bbfe1071b6e9b459604ea3d`;
- backend PR #170 added the executable Social ownership/privacy audit and kept complete Social projection implementation globally blocked;
- backend PR #171 added only the audit-approved `social_profile_and_authored_posts` bounded source and preserved the count at six complete projections;
- backend PR #172 resolved avatar/post-media disposition as a separate notice-only mixed-policy surface;
- backend PR #173 resolved notification actor/target representation through permanent omission while preserving received-activity disclosure blockage;
- backend PR #174 added the bounded Social notification source plan and technical source-contract evidence without implementing the source;
- mobile PR #451 synchronized the managed-media decision baseline;
- mobile PR #454 is closed, its branch was reset back to mobile `main`, and its wider diff is not reused;
- no open mobile or backend pull requests existed before this documentation branch was created.

This file is a continuation checkpoint. It must be updated when a merged change materially alters the active package, blockers, repository baseline, or next safe action.

## Start-of-session checklist

1. Fetch exact current `main` for both repositories.
2. Inspect open pull requests and avoid overlapping active branches.
3. Read `AGENTS.md`, project context/status, `PROJECT_LEARNINGS.md`, the implementation plan, and relevant privacy/architecture documents.
4. Treat the executable Social audit, managed-media disposition, and notification representation as authoritative over older wording.
5. Confirm the task is inside exactly one approved roadmap boundary.
6. Work from a clean branch based on exact current `main`.

## Completed audit-hardening and Coach boundaries

- The destructive Expo template reset command and empty root artifacts are absent.
- JWT expiry parsing is strict, platform independent, and fail closed.
- Backend `main` contains six complete ownership-safe export projections.
- The Coach projection uses explicit parsers, lifecycle validation, strict source bounds, and excludes raw/internal/provider data.
- All complete projections remain separate from preparation invocation, route activation, assembly, archive generation, delivery, and mobile UI.

## Completed Social owned-content source

Backend PR #171:

- verifies an active owner and reads only the owner's Social profile and active authored posts;
- uses one read-only repeatable-read transaction;
- limits profile output to username, display name, bio, visibility, and timestamps;
- strictly parses version-1 workout snapshots and fails closed above 1,000 active posts;
- excludes avatar/media, graph edges, requests, blocks, reactions, comments, received activity, notifications, internal IDs, revisions, idempotency keys, raw JSON, and other-user data;
- uses `sourceId: social_profile_and_authored_posts` and `fullSurfaceProjectionAllowed: false`;
- remains outside the implemented projection registry.

The complete projection count remains six.

## Resolved managed-media decision

Backend PR #172:

- keeps avatar/post-media references outside Social owned-content and raw relationship/activity sources;
- maps them to `managed_media_metadata` as `notice_only` / `mixed_policy_review`;
- excludes raw URLs, asset IDs, descriptors, object keys, hashes, provider/model fields, moderation/OCR signals, reviewer state, appeals, legal holds, cleanup, delivery, lease, and retention internals;
- preserves eligible non-media content when media is missing or unavailable;
- prohibits internal-ID and URL fallback;
- keeps notice projection and binary media export blocked.

## Resolved notification representation

Backend PR #173 defines `notification_metadata_without_actor_or_target`.

The maximum future representation is:

- one closed notification type;
- read timestamp;
- creation timestamp.

The executable contract requires:

- `owner_is_subject_only` row scope;
- exact agreement with the four current `SOCIAL_NOTIFICATION_TYPES`;
- actor representation `omit`;
- target representation `omit`;
- actor and target lifecycle semantics `no_export_effect`;
- exclusion of actor/recipient IDs, actor profile/display fields, post/comment IDs and content, dedupe keys, and delivery metadata;
- `receivedActivityDisclosure: blocked`;
- `sourceImplementationAllowed: false`.

Actor/target representation and lifecycle questions are resolved, but disclosure of received notifications remains undecided. Notification bounds, ordering, repeatable-read snapshot behavior, deleted-owner handling, and PostgreSQL source evidence remain unresolved. No notification query, DTO, projection, route, migration, or UI was added.

## Current continuation boundary

- The active roadmap priority order remains P9-B3, P9-C, P9-D, then authorization-gated operational and physical evidence.
- There are still six complete ownership-safe projections, not seven; `social_profile_and_authored_posts` remains a bounded partial source.
- Managed media, actor/target omission, and the notification source-plan contract are resolved decisions, not implemented export sources.
- The next Social step must resolve exactly one remaining policy decision: whether minimized notification metadata without actor/target can be disclosed at all.
- Candidate decisions remain separate from implementation and include counterpart representation for outgoing follows/requests/blocks, incoming follow/request third-party disclosure, target representation for owner-authored comments/reactions, deleted/private/blocked/inaccessible target behavior, or deterministic bounds/snapshot semantics for one exact table boundary.
- Incoming blocks remain permanently excluded, and received third-party activity is not automatically owner-authored export data.
- Any next implementation must start from exact current `main`, explicitly amend or remain within the executable audit contract, stay under file-size limits, use strict allowlists and repeatable-read bounds where applicable, and rerun required evidence.
- Complete Social projection approval, notification source implementation, managed-media notice/binary implementation, multi-surface assembly, route activation, audit/idempotency, archive generation, secure delivery, mobile integration, and public policy wording remain separate future scopes.
- P9-B3 cannot progress through assumptions; it requires exact provider/environment evidence.
- P9-C must keep every collection path fail closed until policy, provider, persistence, disclosure, localization, accessibility, and consent requirements are resolved.

## Validation evidence

Backend PR #173 exact-head evidence passed:

- lint and format;
- TypeScript build and production configuration validation;
- migrations, migration idempotency, and migrated-schema validation;
- PostgreSQL Social API and Sync correctness;
- full Vitest, including notification type/allowlist, actor/target omission, lifecycle-independence, and continued disclosure/source blocking guards;
- production startup/health;
- separate account-deletion receipt migration/runtime/purge workflow.

This mobile documentation slice must pass the exact-head Mobile CI before merge.

## Deferred audit recommendations

Do not start autonomous Context-store migration, local-database migration, mass feature restructuring, test-directory consolidation, or generic performance optimization without new measured evidence.

## Prohibited implicit actions

Do not perform or claim backend deployment, production migration execution, provider/staging activation, complete Social projection approval, notification disclosure/source implementation, managed-media notice/binary implementation, route activation, archive generation, worker scheduling, secure delivery, OTA/EAS publication, native build/install, rollback, store submission, or credential/DNS/production-environment changes.

These require direct authorization.

## Handoff update template

When replacing this checkpoint, record verification date, exact repository SHAs, open PRs, completed package/PR, validation run, active blockers, next safe action, and actions not performed.
