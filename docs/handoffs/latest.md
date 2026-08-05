# Latest Handoff

Updated: 2026-08-05

## Checkpoint

Social managed-media disposition baseline after backend PR #172:

- mobile `main` before this documentation slice: `1960315fb9befe1a9ad8d34c1cce8b16983eb5d7`;
- backend `main`: `9a19bff2bf8ce327b7cbeda77fc3097c5994b40e`;
- backend PR #170 added the executable Social ownership/privacy audit and kept complete Social projection implementation globally blocked;
- backend PR #171 added only the audit-approved `social_profile_and_authored_posts` bounded source and preserved the count at six complete projections;
- backend PR #172 resolved avatar/post-media disposition as a separate notice-only mixed-policy surface without implementing a media notice projection or binary export;
- mobile PR #450 synchronized the bounded owned-content source baseline;
- no open mobile or backend pull requests existed before this documentation branch was created.

This file is a continuation checkpoint. It must be updated when a merged change materially alters the active package, blockers, repository baseline, or next safe action.

## Start-of-session checklist

1. Fetch exact current `main` for both repositories.
2. Inspect open pull requests and avoid overlapping active branches.
3. Read `AGENTS.md`, project context/status, `PROJECT_LEARNINGS.md`, the implementation plan, and relevant privacy/architecture documents.
4. Treat the executable Social audit and managed-media disposition contract as authoritative over older wording.
5. Confirm the task is inside exactly one approved roadmap boundary.
6. Work from a clean branch based on exact current `main`.

## Completed audit-hardening boundary

- The Expo template `reset-project` command and script are absent.
- Empty tracked root log/success artifacts are absent.
- JWT expiry parsing is platform-independent, strict base64url/UTF-8, and fail closed.
- Focused tests cover Hermes-like absence of `atob`, URL-safe characters, UTF-8 claims, padding, expiry skew, and malformed input.
- Mobile CI passed line checks, TypeScript, focused contracts, full regression, Expo export, and Expo Doctor.

## Completed Coach export boundary

- Backend `main` contains six ownership-safe source projections.
- The Coach projection explicitly parses all nine current request types into a privacy-safe history DTO.
- It excludes IDs, idempotency, revisions, raw request/context/result/input/output/error payloads, provider/model/usage metadata, prompts, hidden reasoning, validation paths, and internal diagnostics.
- Parent-child lifecycle validation requires status-appropriate stage timestamps, prevents active stages under queued runs and unfinished stages under terminal runs, and rejects stages outside the parent run window.
- The projection remains separate from preparation invocation, route activation, assembly, archive generation, delivery, and mobile UI.

## Completed Social audit and owned-content source

Backend PR #170:

- inventories all eight registered candidate tables exactly once;
- separates own rows, owner-authored actions, owner-received records, and two-sided relationship edges;
- permanently excludes incoming block relationships;
- excludes internal account/content IDs, target IDs, idempotency/dedupe keys, source workout IDs/revisions, managed-media IDs, and other-user private fields;
- sets `SOCIAL_EXPORT_PROJECTION_IMPLEMENTATION_ALLOWED` to `false`.

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

Backend PR #172 adds decision `managed_media_notice_only` for:

- `social_profiles.avatar_url`;
- `social_profiles.avatar_media_asset_id`;
- `social_workout_posts.media_asset_id`.

The executable contract requires:

- exclusion from the bounded owned-content source and raw Social relationship/activity projection;
- assignment to the separate registered `managed_media_metadata` surface;
- `notice_only` disposition and `mixed_policy_review` row scope;
- exclusion of raw URLs, asset IDs, public descriptors, private object keys, hashes, provider/model fields, moderation/OCR signals, reviewer state, appeals, legal holds, cleanup, delivery, lease, and retention internals;
- otherwise eligible non-media profile/post content remains exportable when media is missing, deleted, rejected, failed, or unavailable;
- no internal-ID or URL fallback;
- exact agreement with all seven managed-media governance tables.

`SOCIAL_MANAGED_MEDIA_NOTICE_PROJECTION_IMPLEMENTATION_ALLOWED` remains `false`. No notice projection, binary media export, public wording, provider evidence, route, archive, or delivery path was added.

## Current continuation boundary

- The active roadmap priority order remains P9-B3, P9-C, P9-D, then authorization-gated operational and physical evidence.
- There are still six complete ownership-safe projections, not seven; `social_profile_and_authored_posts` remains a bounded partial source.
- Managed media is no longer an unresolved Social-surface decision, but its separate notice projection and binary export remain unimplemented and blocked.
- The next Social step must resolve exactly one remaining audit decision rather than expand the partial source by implication.
- Candidate decisions include counterpart representation for outgoing follows/requests/blocks, incoming follow/request third-party disclosure, target representation for owner-authored comments/reactions, notification representation without actor/target disclosure, deleted/private/blocked/inaccessible target behavior, or deterministic bounds/snapshot semantics for one exact table boundary.
- Incoming blocks remain permanently excluded, and received third-party activity is not automatically owner-authored export data.
- Any next implementation must start from exact current `main`, explicitly amend or remain within the executable audit contract, stay under file-size limits, use strict allowlists and repeatable-read bounds where applicable, and rerun required evidence.
- Complete Social projection approval, managed-media notice/binary implementation, multi-surface assembly, route activation, audit/idempotency, archive generation, secure delivery, mobile integration, and public policy wording remain separate future scopes.
- P9-B3 cannot progress through assumptions; it requires exact provider/environment evidence.
- P9-C must keep every collection path fail closed until policy, provider, persistence, disclosure, localization, accessibility, and consent requirements are resolved.

## Validation evidence

Backend PR #172 exact-head evidence passed:

- lint and format;
- TypeScript build and production configuration validation;
- migrations, migration idempotency, and migrated-schema validation;
- PostgreSQL Social API and Sync correctness;
- full Vitest, including managed-media disposition and registry-alignment guards;
- production startup/health;
- separate account-deletion receipt migration/runtime/purge workflow.

This mobile documentation slice must pass the exact-head Mobile CI before merge.

## Deferred audit recommendations

Do not start autonomous Context-store migration, local-database migration, mass feature restructuring, test-directory consolidation, or generic performance optimization without new measured evidence.

## Prohibited implicit actions

Do not perform or claim backend deployment, production migration execution, provider/staging activation, complete Social projection approval, managed-media notice/binary implementation, route activation, archive generation, worker scheduling, secure delivery, OTA/EAS publication, native build/install, rollback, store submission, or credential/DNS/production-environment changes.

These require direct authorization.

## Handoff update template

When replacing this checkpoint, record verification date, exact repository SHAs, open PRs, completed package/PR, validation run, active blockers, next safe action, and actions not performed.
