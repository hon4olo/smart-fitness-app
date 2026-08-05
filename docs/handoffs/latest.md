# Latest Handoff

Updated: 2026-08-05

## Checkpoint

Mobile audit-hardening and Coach export baseline after backend PR #168:

- mobile `main` before this documentation slice: `6df2278614b296e782e4edffb6b4895e7176f3a6`;
- backend `main`: `ccea35967516b168e877e8803a8dd3c7c40c973d`;
- backend PR #168 merged the sixth ownership-safe projection, `coach_reviews_proposals_and_run_history`;
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
- It validates run/result/terminal consistency, timestamps, stage ownership, stage sequence, and fail-closed source bounds.
- It remains separate from preparation invocation, route activation, assembly, archive generation, delivery, and mobile UI.

## Current continuation boundary

- The active roadmap priority order is unchanged: P9-B3, P9-C, P9-D, then authorization-gated operational and physical evidence.
- The only remaining raw candidate export surface is `social_relationships_and_account_activity`.
- Do not implement Social export until authored-versus-received activity, other-user fields, relationship/block state, notifications, moderation/security records, and mixed-policy data are explicitly separated.
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
