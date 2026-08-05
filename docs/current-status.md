# Smart Fitness Current Status

Updated: 2026-08-05

## Verified repository baseline

Verified during this documentation refresh:

- mobile `main`: `baeb0046d8dae54126dce1f36f4703c885320f39`;
- backend `main`: `947989f8adfe85fa34248fc439b07e210f00d1b4`;
- mobile PR #441 synchronized the canonical implementation plan with the fourth export projection;
- backend PR #165 merged as `947989f8adfe85fa34248fc439b07e210f00d1b4`;
- no overlapping feature pull request remained at the final refresh check.

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
- four ownership-safe export projections on `main`:
  - `profile_and_account_metadata`;
  - `progress_measurements_and_weight`;
  - `limitations_recovery_and_safety_context`;
  - `nutrition_and_meal_data`.

The projections remain separate from preparation, route activation, multi-surface assembly, archive generation, secure delivery, and mobile UI.

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

This refresh establishes:

- `docs/project-context.md` for stable orientation;
- `docs/current-status.md` for mutable verified state;
- `docs/handoffs/latest.md` for continuation;
- `docs/architecture/README.md` for focused document navigation.

`docs/implementation-plan.md` remains the canonical cross-repository roadmap. No duplicate `system-overview.md`, `mobile-architecture.md`, `backend-architecture.md`, or `data-sync.md` files are created because their content is already represented by the project context, implementation plan, and focused architecture documents.
