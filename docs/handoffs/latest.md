# Latest Handoff

Updated: 2026-08-05

## Checkpoint

Roadmap synchronization after backend PR #167:

- mobile `main` before this docs slice: `5669c445000c4e6d3782826049d16feb78975858`;
- backend `main`: `cbcecff4c0def1771bd91a67ff389ae517f48d8a`;
- backend PR #167 merged the fifth ownership-safe projection, `workouts_programs_and_exercises`;
- no open mobile or backend pull requests existed before this branch was created.

This file is a continuation checkpoint. It must be updated when a merged change materially alters the active package, blockers, repository baseline, or next safe action.

## Start-of-session checklist

1. Fetch exact current `main` for both repositories.
2. Inspect open pull requests and avoid overlapping active branches.
3. Read:
   - `AGENTS.md`;
   - `docs/project-context.md`;
   - `docs/current-status.md`;
   - `PROJECT_LEARNINGS.md`;
   - `docs/implementation-plan.md`;
   - relevant focused architecture/privacy/operations documents.
4. Confirm the task is inside the currently approved roadmap package.
5. Work from a clean branch based on exact current `main`.

## Current continuation boundary

- Backend `main` contains five ownership-safe source projections.
- The remaining candidate surfaces are `coach_reviews_proposals_and_run_history` and `social_relationships_and_account_activity`.
- The next bounded source-only candidate is Coach, but implementation must start with a fresh audit of Coach tables, structured outputs, provenance, provider metadata, hidden-reasoning exclusions, mixed-policy fields, and source bounds.
- Do not start Social projection work until authored-versus-received activity, other-user fields, block relationships, notifications, moderation/security records, and mixed-policy data are explicitly separated.
- Every projection must remain owner-scoped, allowlisted, bounded, provider-neutral, and separate from route activation, multi-surface assembly, archive generation, delivery, or mobile UI unless those scopes are explicitly approved.
- P9-B3 cannot progress through assumptions; it requires exact provider/environment evidence.
- P9-C must keep every collection path fail closed until policy, provider, persistence, disclosure, localization, accessibility, and consent requirements are resolved.

## Prohibited implicit actions

Do not perform or claim:

- backend deployment;
- production migration execution;
- provider or staging activation;
- route activation or archive generation;
- worker scheduling;
- OTA/EAS publication;
- native build or installation;
- rollback execution;
- store submission;
- credential, DNS, or production-environment changes.

These require direct authorization.

## Handoff update template

When replacing this checkpoint, record:

- verification date;
- exact mobile and backend `main` SHAs before the handoff update;
- open pull requests and non-overlap constraints;
- completed package or PR;
- validation actually run;
- active blockers;
- exact next safe action;
- actions not performed.
