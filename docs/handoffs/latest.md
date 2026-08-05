# Latest Handoff

Updated: 2026-08-05

## Checkpoint

Documentation refresh baseline:

- mobile `main`: `baeb0046d8dae54126dce1f36f4703c885320f39`;
- backend `main`: `947989f8adfe85fa34248fc439b07e210f00d1b4`;
- backend PR #165 merged the `nutrition_and_meal_data` export projection;
- mobile PR #441 synchronized the canonical implementation plan to four ownership-safe projections;
- no overlapping feature pull request remained at the final refresh check.

This file is a continuation checkpoint. It must be updated when a merged change materially alters the active package, blockers, repository baseline, or next safe action.

## Start-of-session checklist

1. Fetch exact current `main` for both repositories.
2. Inspect open PRs and avoid overlapping active branches.
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

- Backend `main` contains four ownership-safe source projections, including `nutrition_and_meal_data`.
- The next source-only P9-D work must remain ownership-safe, allowlisted, bounded, provider-neutral, and separate from route activation, multi-surface assembly, archive generation, delivery, or mobile UI unless those scopes are explicitly approved.
- P9-B3 cannot progress through assumptions; it requires exact provider/environment evidence.
- P9-C must keep every collection path fail closed until policy, provider, persistence, disclosure, localization, accessibility, and consent requirements are resolved.

## Prohibited implicit actions

Do not perform or claim:

- backend deployment;
- production migration execution;
- provider or staging activation;
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
- open PRs and non-overlap constraints;
- completed package or PR;
- validation actually run;
- active blockers;
- exact next safe action;
- actions not performed.
