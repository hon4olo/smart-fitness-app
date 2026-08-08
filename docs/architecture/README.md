# Mobile Architecture Index

Updated: 2026-08-08

This directory contains focused architecture evidence. Use this index instead of creating overlapping broad summaries.

For stable cross-repository orientation, read `../project-context.md`. For current execution state, read `../current-status.md`. For roadmap sequencing, read `../implementation-plan.md`.

## State and persistence

- `app-context-consumer-inventory.md` — focused state-boundary migration and the zero-production-consumer invariant.
- `local-state-performance-decision.md` — measured decision to retain the single AsyncStorage `AppState` architecture.
- `persistence-operation-matrix.md` — persistence and mutation behavior by operation.
- `persistence-measurement-results.md` — measured persistence evidence.
- `nutrition-state-boundary.md` — Nutrition state ownership.
- `progress-state-boundary.md` — Progress state ownership.
- `profile-state-boundary.md` — Profile state ownership.

## Synchronization and cloud boundaries

- `cloud-module-inventory.md` — cloud/synchronization module responsibilities.
- `sync-conflict-resolution-mobile-intent.md` — explicit local-versus-account conflict intent and reconciliation.
- `placeholder-timestamp-inventory.md` — placeholder timestamp audit.
- `bounded-adversarial-validation.md` — generated state-machine and adversarial validation boundary.
- `privacy-safe-support-diagnostics.md` — bounded local support diagnostics.

## Media, links, platform composition, and UI layout

- `mobile-managed-media-composition-analysis.md` — managed-media composition boundary.
- `password-reset-app-links.md` — password-reset universal/app link architecture.
- `list-performance-baseline.md` — list-rendering performance baseline.
- `responsive-mobile-ui.md` — responsive layout, Safe Area, floating navigation, sticky action, scrolling, keyboard, and validation contract.

## Maintenance rule

Update this index when a focused architecture document is added, renamed, superseded, or removed.

Do not add generic `mobile-architecture.md`, `system-overview.md`, or `data-sync.md` files unless a future audit proves that the existing project context, implementation plan, and focused documents cannot represent the required information without material ambiguity.
