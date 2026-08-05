# Latest Handoff

Updated: 2026-08-05

## Checkpoint

Social data-access export ownership-audit baseline after backend PR #170:

- mobile `main` before this documentation slice: `53a7f638ef4d94b98b998f088374f64b733c3f26`;
- backend `main`: `f840253791414abca044e85d4a50e78789699a14`;
- backend PR #168 merged the sixth ownership-safe projection, `coach_reviews_proposals_and_run_history`;
- backend PR #169 hardened parent-run/child-stage lifecycle integrity for the Coach projection;
- backend PR #170 added the executable Social ownership/privacy audit and kept Social projection implementation globally blocked;
- backend draft PR #171 attempted implementation from the pre-audit baseline and was closed without merge after confirmed policy and source-integrity blockers;
- mobile PR #448 synchronized Coach lifecycle evidence and selected Social audit as the next safe slice;
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

Backend draft PR #171 was closed without merge. Confirmed blockers were:

- stale base before PR #170 and no reconciliation with the executable audit contract;
- autonomous resolution of blocked third-party/counterpart disclosure choices;
- unresolved `profile.avatarUrl` export despite managed-media disposition remaining blocked;
- referenced target-post reads without deleted-row exclusion despite contrary documentation;
- a 527-line repository above the mandatory 500-line policy.

The branch and code remain available for selective reuse; nothing was deleted.

## Current continuation boundary

- The active roadmap priority order remains P9-B3, P9-C, P9-D, then authorization-gated operational and physical evidence.
- There are still six implemented ownership-safe projections, not seven.
- The next Social step is a reviewed product/privacy decision, not autonomous implementation.
- Required decisions include counterpart identity representation, incoming follow/request disclosure, received-notification actor/target disclosure, outgoing-block counterpart representation, managed avatar/post-media disposition, and deleted/private/blocked/inaccessible target behavior.
- Incoming blocks remain permanently excluded.
- After decisions, any implementation must start from exact current `main`, amend the executable audit contract, stay under file-size limits, use strict allowlists and repeatable-read source bounds, and rerun all PostgreSQL/privacy evidence.
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
