# Safety Recovery State Boundary

Updated: 2026-08-01

Status: provider foundation and first pure-consumer migration complete.

## Purpose

`SafetyRecoveryStateProvider` publishes only Safety and Recovery state while retaining the existing internal `AppState`, repository, mutation queue, outbox, and synchronization ownership.

## Contract

The focused value contains only:

- `recoveryCheckIns`;
- `userLimitations`.

Mutations remain in stable `AppActions`. Restore and mutation status remain in `AppInfrastructure`. Sync state remains in `SyncContext`.

## Completed slice 1 — provider foundation

PR #323:

- added `SafetyRecoveryStateProvider` and `useSafetyRecoveryState`;
- memoized the value from only the two Safety/Recovery arrays;
- mounted the provider inside the existing `AppProvider` boundary;
- added permanent contract tests.

## Completed slice 2 — pure editors

The following screens now read Safety/Recovery arrays through `useSafetyRecoveryState` and no longer subscribe to compatibility `AppContext`:

- Recovery Check-In;
- User Limitation.

Their mutations remain in `useAppActions`, restore status remains in `useAppInfrastructure`, and sync state remains in `SyncContext`.

Validation, local form state, pending-sync tracking, alerts, routes, and UI behavior remain unchanged.

## Next slices

Migrate mixed readers by composing focused Safety/Recovery state with infrastructure, actions, Workout state, and sync hooks as required:

- Safety Recovery Coach;
- Safety Recovery Preflight;
- Workout Safety Gate;
- Combined Coach.

## Explicit exclusions

This boundary does not change:

- persisted schemas or serialized values;
- repositories, mutation ordering, outbox, or synchronization;
- validation, scoring, readiness, or safety rules;
- routes, UI, or local form state;
- persistence coalescing or external state libraries;
- OTA, native builds, backend deployment, or environment activation.
