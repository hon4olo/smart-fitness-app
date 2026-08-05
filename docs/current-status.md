# Smart Fitness Current Status

Updated: 2026-08-05

## Verified repository baseline

Verified after backend PR #167:

- mobile `main`: `5669c445000c4e6d3782826049d16feb78975858`;
- backend `main`: `cbcecff4c0def1771bd91a67ff389ae517f48d8a`;
- backend PR #167 merged the `workouts_programs_and_exercises` export projection;
- no open mobile or backend pull requests before this roadmap-sync slice.

Always re-check both repositories and open pull requests before work. This file records a checkpoint, not a live Git query.

## Engineering state

The canonical implementation plan estimates approximately:

- completed: 89%;
- remaining: 11%.

Completed source packages include:

- P0-P6 provider-neutral foundations and readiness scaffolding;
- P7 explicit synchronization-conflict resolution;
- P8 diagnostics and adversarial release preparation;
- P9-A technical data inventory;
- P9-B1 operational retention foundation;
- P9-B2 cross-surface account deletion source work.

Active packages:

1. P9-B3 provider/environment retention evidence — externally blocked until exact providers, environments, owners, credentials, lifecycle controls, and evidence are available.
2. P9-C consent and analytics prerequisites — collection remains disabled; no production event or measurement purpose is registered.
3. P9-D privacy-facing controls and policy evidence — source-only preparation boundaries and ownership-safe projections are being extended.
4. Operational and physical evidence — authorization-gated staging, deployment, worker scheduling, native build, release-device, offline-restart, accessibility, localization, and second-device validation.

See `docs/implementation-plan.md` for complete package evidence.

## Mobile state

Current mobile source includes:

- focused production state boundaries with zero production `useAppContext` consumers;
- revisioned synchronization for every currently registered private mobile domain;
- persisted conflict review and explicit conflict resolution;
- secure native token storage;
- deterministic and structured Coach flows with explicit confirmation;
- account-deletion recovery and privacy-facing fail-closed contracts;
- blocking source CI, Expo export, and Expo Doctor checks;
- no known tracked hand-written source file above 500 physical lines.

Source tests do not replace physical matching-runtime validation.

## Backend state

Backend `main` contains:

- authenticated ownership-safe revisioned synchronization for the full current mobile entity set;
- deterministic and structured Coach orchestration;
- provider-neutral capability gates;
- account deletion and deletion-receipt source flows;
- technical data and operational retention registries;
- disabled-by-default data-access export route/preparation boundaries;
- durable source attempt limiting;
- five ownership-safe export projections on `main`:
  - `profile_and_account_metadata`;
  - `progress_measurements_and_weight`;
  - `limitations_recovery_and_safety_context`;
  - `nutrition_and_meal_data`;
  - `workouts_programs_and_exercises`.

The workout projection reads six owner-scoped tables in one repeatable-read snapshot, strictly parses JSON-backed records, reconstructs normalized sessions, excludes internal identifiers and metadata, and fails closed on malformed relationships or source-bound overflow.

All projections remain separate from preparation, route activation, multi-surface assembly, archive generation, secure delivery, and mobile UI.

## Remaining candidate export surfaces

Source projections are still absent for:

- `coach_reviews_proposals_and_run_history`;
- `social_relationships_and_account_activity`.

The Coach surface is the next bounded candidate, subject to a fresh schema/privacy audit. Social requires explicit separation of authored, received, relationship, block, notification, and mixed-policy data before implementation.

## Disabled or authorization-gated

The following remain disabled, absent from default production composition, or require direct authorization:

- product analytics, crash collection, performance telemetry, attribution, and advertising tracking;
- public data-access export assembly, archive generation, secure delivery, and mobile export UI;
- model/provider staging execution;
- worker scheduling and external lifecycle proof;
- backend deployment and production migration execution;
- OTA/EAS publication, native build, installation, rollback execution, and store submission;
- credential, DNS, provider-account, or production-environment changes.

## Documentation state

- `docs/project-context.md` provides stable orientation;
- `docs/current-status.md` provides mutable verified state;
- `docs/handoffs/latest.md` provides the continuation checkpoint;
- `docs/architecture/README.md` indexes focused architecture documents;
- `docs/implementation-plan.md` remains the canonical cross-repository roadmap.
