# Latest Handoff

Updated: 2026-08-05

## Checkpoint

Mobile audit-hardening and Coach export lifecycle baseline after backend PR #169:

- mobile `main` before this documentation slice: `b47f1d5ea6ccc8579165810c5efdec23b8329560`;
- backend `main`: `d5b2f887de43988dba16144859c276acf20351b4`;
- backend PR #168 merged the sixth ownership-safe projection, `coach_reviews_proposals_and_run_history`;
- backend PR #169 added strict parent-run/child-stage lifecycle validation for the Coach projection;
- mobile PR #447 synchronized the canonical roadmap from five to six ownership-safe projections;
- mobile PR #444 removed the destructive Expo template reset command/script and two empty root artifacts;
- mobile PR #445 added strict platform-independent JWT base64url/UTF-8 decoding and focused fail-closed tests;
- mobile PR #446 recorded the audit-hardening baseline;
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
- It validates run/result/terminal consistency, stage ownership, stage sequence, and fail-closed source bounds.
- Parent-child lifecycle validation requires status-appropriate stage timestamps, prevents active stages under queued runs and unfinished stages under terminal runs, and rejects stages outside the parent run window.
- Backend CI passed lint, formatting, build, production configuration, migrations and idempotency, PostgreSQL schema/social/sync suites, full Vitest, production health startup, and the separate account-deletion receipt workflow on the exact PR #169 head.
- The projection remains separate from preparation invocation, route activation, assembly, archive generation, delivery, and mobile UI.

## Current continuation boundary

- The active roadmap priority order is unchanged: P9-B3, P9-C, P9-D, then authorization-gated operational and physical evidence.
- The only remaining raw candidate export surface is `social_relationships_and_account_activity`.
- The next safe slice is a fresh Social schema/privacy audit, not immediate projection implementation.
- Before implementation, explicitly separate authored-versus-received activity, self-owned versus other-user fields, relationship/block state, notifications, moderation/security records, managed-media references, and mixed-policy data.
- Every export projection and subsequent assembly step must remain owner-scoped, allowlisted, bounded, provider-neutral, and separately reviewed.
- Multi-surface assembly, pagination/snapshot semantics, audit/idempotency, secure delivery, mobile integration, and public policy wording remain distinct future scopes; current source projections do not authorize them.
- P9-B3 cannot progress through assumptions; it requires exact provider/environment evidence.
- P9-C must keep every collection path fail closed until policy, provider, persistence, disclosure, localization, accessibility, and consent requirements are resolved.

## Deferred audit recommendations

Do not start autonomous Context-store migration, local-database migration, mass feature restructuring, test-directory consolidation, or generic performance optimization without new measured evidence.

## Prohibited implicit actions

Do not perform or claim backend deployment, production migration execution, provider/staging activation, route activation, archive generation, worker scheduling, secure delivery, OTA/EAS publication, native build/install, rollback, store submission, or credential/DNS/production-environment changes.

These require direct authorization.

## Handoff update template

When replacing this checkpoint, record verification date, exact repository SHAs, open PRs, completed package/PR, validation run, active blockers, next safe action, and actions not performed.
