# Latest Handoff

Updated: 2026-08-05

## Checkpoint

Social owned-content source baseline after backend PR #171:

- mobile `main` before this documentation slice: `aad136aa2caeafb15240ff0b817f9fd3bd86110e`;
- backend `main`: `be3548f0266f819324170e24bc4d5d66bdf10189`;
- backend PR #168 merged the sixth ownership-safe projection, `coach_reviews_proposals_and_run_history`;
- backend PR #169 hardened parent-run/child-stage lifecycle integrity for the Coach projection;
- backend PR #170 added the executable Social ownership/privacy audit and kept full Social projection implementation globally blocked;
- backend PR #171 added only the audit-approved `social_profile_and_authored_posts` bounded source and preserved the count at six complete projections;
- mobile PR #449 recorded the audit baseline and the earlier premature form of backend PR #171 before its scope reduction and successful merge;
- no open mobile or backend pull requests existed before this documentation branch was created.

This file is a continuation checkpoint. It must be updated when a merged change materially alters the active package, blockers, repository baseline, or next safe action.

## Start-of-session checklist

1. Fetch exact current `main` for both repositories.
2. Inspect open pull requests and avoid overlapping active branches.
3. Read `AGENTS.md`, project context/status, `PROJECT_LEARNINGS.md`, the implementation plan, and relevant privacy/architecture documents.
4. Confirm the task is inside the currently approved roadmap package.
5. Work from a clean branch based on exact current `main`.

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

## Completed Social audit boundary

Backend PR #170:

- inventories all eight registered candidate tables exactly once;
- separates own rows, owner-authored actions, owner-received records, and two-sided relationship edges;
- permits bounded source planning only for the authenticated user's own profile and own active posts;
- keeps follows, follow requests, blocks, reactions, comments, and notifications blocked on counterpart or third-party policy decisions;
- permanently excludes incoming block relationships;
- excludes internal account/content IDs, target IDs, idempotency/dedupe keys, source workout IDs/revisions, managed-media IDs, and other-user private fields;
- keeps moderation, anti-abuse, and managed-media governance in separate notice-only or mixed-policy surfaces;
- records unresolved counterpart, received-activity, media, inaccessible-target, and snapshot/bound semantics;
- sets `SOCIAL_EXPORT_PROJECTION_IMPLEMENTATION_ALLOWED` to `false`;
- adds exact candidate-table coverage and incoming-block exclusion tests.

## Completed Social owned-content source

Backend PR #171 was reconciled with PR #170 and reduced to the two audit-approved own-row tables:

- active-owner verification plus own Social profile and active authored posts share one read-only repeatable-read transaction;
- profile output is limited to username, display name, bio, visibility, and timestamps;
- active authored posts use a strict version-1 workout snapshot parser and a fail-closed 1,000-row source bound;
- raw avatar URLs, managed-media references, graph edges, requests, blocks, reactions, comments, received activity, notifications, internal IDs, revisions, idempotency keys, raw JSON, and other-user data are excluded;
- the source is named `social_profile_and_authored_posts`, sets `fullSurfaceProjectionAllowed: false`, and is not registered as the complete Social surface;
- the focused repository is below the mandatory 500-line limit;
- exact-head Backend CI and Account Deletion Receipt CI passed before merge.

The complete projection count remains six. The full Social surface remains blocked by the executable audit.

## Current continuation boundary

- The active roadmap priority order remains P9-B3, P9-C, P9-D, then authorization-gated operational and physical evidence.
- There are still six complete ownership-safe projections, not seven; `social_profile_and_authored_posts` is a bounded partial source.
- The next Social step must resolve exactly one remaining audit decision rather than expand the partial source by implication.
- Candidate decisions include counterpart identity representation for outgoing relationships, target representation for owner-authored comments/reactions, notification representation without actor/target disclosure, managed avatar/post-media disposition, and deleted/private/blocked/inaccessible target behavior.
- Incoming blocks remain permanently excluded, and received third-party activity is not automatically owner-authored export data.
- Any next implementation must start from exact current `main`, explicitly amend or remain within the executable audit contract, stay under file-size limits, use strict allowlists and repeatable-read bounds, and rerun PostgreSQL/privacy evidence.
- Multi-surface assembly, route activation, audit/idempotency, archive generation, secure delivery, mobile integration, and public policy wording remain separate future scopes.
- P9-B3 cannot progress through assumptions; it requires exact provider/environment evidence.
- P9-C must keep every collection path fail closed until policy, provider, persistence, disclosure, localization, accessibility, and consent requirements are resolved.

## Deferred audit recommendations

Do not start autonomous Context-store migration, local-database migration, mass feature restructuring, test-directory consolidation, or generic performance optimization without new measured evidence.

## Prohibited implicit actions

Do not perform or claim backend deployment, production migration execution, provider/staging activation, route activation, archive generation, worker scheduling, secure delivery, OTA/EAS publication, native build/install, rollback, store submission, or credential/DNS/production-environment changes.

These require direct authorization.

## Handoff update template

When replacing this checkpoint, record verification date, exact repository SHAs, open PRs, completed package/PR, validation run, active blockers, next safe action, and actions not performed.
