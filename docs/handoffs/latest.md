# Latest Handoff

Updated: 2026-08-08

## Checkpoint

P9-D data-access export checkpoint after backend PR #191:

- mobile `main` before this documentation slice: `0d0901acd76e1435088c9b88bb28bb86a769e8f0`;
- backend `main`: `203887655ef93c268b06db85ef03dcd4de272228`;
- backend PR #190 completed the ownership-safe `social_relationships_and_account_activity` source/projection;
- backend PR #191 added deterministic source-only assembly for all seven complete candidate projections;
- no open mobile or backend pull requests existed before this documentation branch was created.

This file is a continuation checkpoint. Refresh it whenever a merged change materially alters the active package, blockers, repository baseline or next safe action.

## Start-of-session checklist

1. Fetch exact current `main` for both repositories.
2. Inspect open pull requests and avoid overlapping active branches.
3. Read `AGENTS.md`, project context/status, `PROJECT_LEARNINGS.md`, the implementation plan and relevant privacy/architecture documents.
4. Treat current code/tests and the seven-projection/assembly backend state as authoritative over older six-projection Social wording.
5. Confirm the task is inside exactly one approved roadmap boundary.
6. Work from a clean branch based on exact current `main`.

## Completed P9-D source boundaries

Backend source now includes:

- disabled-by-default export preparation and optional route composition;
- durable PostgreSQL preparation-attempt limiting;
- complete ownership-safe projections for:
  - profile/account metadata;
  - workouts/programs/exercises;
  - nutrition/meal data;
  - progress/measurements/weight;
  - limitations/recovery/safety context;
  - Coach reviews/proposals/run history;
  - Social relationships/account activity;
- deterministic source-only multi-surface assembly for those seven candidate projections.

All remain separate from product availability, archive generation, secure delivery and mobile UI.

## Complete Social projection

Backend PR #190:

- verifies an active authenticated owner;
- uses one read-only PostgreSQL `REPEATABLE READ` transaction;
- exports only the owner's Social profile and active authored workout posts;
- includes outgoing follows, current pending outgoing follow requests and outgoing blocks without counterpart identity;
- includes owner-authored reactions/comments only when the target is currently readable;
- excludes incoming relationships, target/counterpart identity, other-user comments, resolved request history, deleted post history, managed-media values, notification rows, internal IDs, revisions, idempotency keys, raw JSON, moderation internals and provider/operational metadata;
- fails closed above reviewed source bounds.

Received `social_notifications` are permanently excluded. Managed media remains `notice_only` / `mixed_policy_review` with no notice or binary projection.

## Multi-surface assembly boundary

Backend PR #191 defines assembly schema version 1.

The assembler:

- accepts only the seven complete candidate-export surface IDs;
- rejects notice-only surfaces before loader execution;
- preflights selected loaders;
- orders selected surfaces canonically;
- invokes only selected loaders;
- validates returned surface IDs and projection schema versions;
- returns no partial payload on missing loaders, loader failures or contract mismatch;
- does not expose authenticated owner IDs or repository error text.

The assembler is deliberately not called by `prepareDataAccessExport` or the optional route. The preparation issue is `assembly_not_integrated`.

## Current continuation boundary

The active roadmap order remains:

1. P9-B3 exact provider/environment retention evidence;
2. P9-C consent/analytics prerequisites with collection disabled;
3. P9-D privacy-facing controls;
4. authorization-gated operational and physical evidence.

Within P9-D, the recommended next bounded package is **export auditability and idempotency semantics**.

That package should define:

- ownership-safe export attempt/audit metadata;
- deterministic request identity;
- retry and committed-response-loss behavior;
- bounded retention and account-deletion interaction;
- explicit exclusions for passwords, selected payloads, full secrets and reusable authorization proofs.

Keep route activation, preparation-to-assembly integration, archive generation, secure delivery, mobile UI, provider configuration, deployment and production execution outside that package.

Separate future reviewed concerns include:

- cross-surface snapshot semantics;
- pagination/continuation semantics;
- maximum assembled-size limits;
- managed-media notice/binary export;
- archive generation and secure expiring/revocable delivery;
- mobile-local export transformation and reviewed confirmation/status UI;
- localization/accessibility and approved policy wording.

## P9-B3 and P9-C blockers

P9-B3 cannot progress through assumptions. Exact selected-provider/environment evidence is required for lifetime, access, expiry/deletion, failure monitoring, account-deletion behavior and exceptional-retention scope.

P9-C must keep analytics, crash collection, performance telemetry, attribution, advertising tracking and generic measurement disabled until policy, provider, persistence, disclosure, localization, accessibility and consent requirements are resolved and separately approved.

## Validation evidence

Backend PR #191 exact final head `39bd68f1706d5ff3873055f00cd9b33fbc9d2757` passed authoritative Backend CI before merge:

- lint;
- Prettier formatting check;
- TypeScript build;
- production configuration validation;
- full backend test suite.

PR #191 merged as backend `main` `203887655ef93c268b06db85ef03dcd4de272228`.

This mobile sync changes only Markdown under `docs/`. The authoritative Mobile CI workflow intentionally ignores `docs/**` and `**/*.md` on pull requests, so no Mobile CI run is expected for this documentation-only slice. Validation is the exact three-file diff, verified repository baselines and cross-repository claims; no Expo/native/runtime execution is required by `AGENTS.md` for docs-only changes.

## Deferred audit recommendations

Do not start autonomous Context-store migration, local-database migration, mass feature restructuring, test-directory consolidation or generic performance optimization without new measured evidence.

## Prohibited implicit actions

Do not perform or claim backend deployment, production migration execution, provider/staging activation, export route activation, preparation-to-assembly integration, managed-media notice/binary implementation, archive generation, worker scheduling, secure delivery, OTA/EAS publication, native build/install, rollback, store submission or credential/DNS/production-environment changes.

These require direct authorization.

## Handoff update template

When replacing this checkpoint, record verification date, exact repository SHAs, open PRs, completed package/PR, validation run, active blockers, next safe action and actions not performed.
