# Latest Handoff

Updated: 2026-08-05

## Checkpoint

Mobile audit-hardening baseline after backend PR #167 and mobile PR #445:

- mobile `main` before this documentation slice: `1df306eb9d83e49014eea7063b18f7e431b68dd7`;
- backend `main`: `cbcecff4c0def1771bd91a67ff389ae517f48d8a`;
- backend PR #167 merged the fifth ownership-safe projection, `workouts_programs_and_exercises`;
- mobile PR #444 removed the destructive Expo template reset command/script and two empty root artifacts;
- mobile PR #445 added strict platform-independent JWT base64url/UTF-8 decoding and focused fail-closed tests;
- no open mobile or backend pull requests existed before this documentation branch was created.

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

## Completed audit-hardening boundary

- The Expo template `reset-project` command and `scripts/reset-project.js` are absent; ordinary project commands can no longer invoke a script capable of moving or deleting the production `src` and `scripts` trees.
- The empty tracked `succes.txt` and `server-wins-typescript.log` root artifacts are absent; the existing `*.log` ignore rule remains sufficient for future untracked logs.
- JWT expiry parsing no longer depends on `globalThis.atob`; the token manager strictly decodes padded or unpadded base64url bytes as UTF-8 and continues to fail closed for malformed, invalidly padded, missing-expiry, or non-numeric-expiry payloads.
- Focused tests cover Hermes-like absence of `atob`, URL-safe `-` and `_`, UTF-8 claims, valid padding, expiry skew, and malformed input.
- Mobile CI passed repository line checks, TypeScript, focused contracts, the full regression suite, Expo export, and Expo Doctor for both implementation PRs.

## Current continuation boundary

- The active roadmap priority order is unchanged: P9-B3, P9-C, P9-D, then authorization-gated operational and physical evidence.
- Backend `main` contains five ownership-safe source projections.
- The remaining candidate surfaces are `coach_reviews_proposals_and_run_history` and `social_relationships_and_account_activity`.
- The next bounded source-only candidate is Coach, but implementation must start with a fresh audit of Coach tables, structured outputs, provenance, provider metadata, hidden-reasoning exclusions, mixed-policy fields, and source bounds.
- Do not start Social projection work until authored-versus-received activity, other-user fields, block relationships, notifications, moderation/security records, and mixed-policy data are explicitly separated.
- Every projection must remain owner-scoped, allowlisted, bounded, provider-neutral, and separate from route activation, multi-surface assembly, archive generation, delivery, or mobile UI unless those scopes are explicitly approved.
- P9-B3 cannot progress through assumptions; it requires exact provider/environment evidence.
- P9-C must keep every collection path fail closed until policy, provider, persistence, disclosure, localization, accessibility, and consent requirements are resolved.

## Deferred audit recommendations

Do not start these as autonomous refactors:

- Context-to-Zustand/Jotai migration without measured render evidence;
- AsyncStorage-to-database migration without crossing the documented release-device reopen gates;
- mass Feature-Sliced restructuring;
- test-directory consolidation without a complete CI/path/ownership inventory;
- generic performance optimization without a reproducible bottleneck.

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
