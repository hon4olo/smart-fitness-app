# Safety Recovery State Boundary

Updated: 2026-08-01

Status: provider foundation, pure editors, preflight, and workout safety gate migrations complete.

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

PR #324 migrated:

- Recovery Check-In;
- User Limitation.

These screens now read Safety/Recovery arrays through `useSafetyRecoveryState`. Their mutations remain in `useAppActions`, restore status remains in `useAppInfrastructure`, and sync state remains in `SyncContext`.

## Completed slice 3 — preflight composition

PR #325 migrated Safety Recovery Preflight. It now composes:

- `useSafetyRecoveryState` for recovery check-ins and limitations;
- `useAppInfrastructure` for restore status;
- `SyncContext` for pending operations, conflicts, status, and synchronization;
- the existing auth session hook for account readiness.

Local summary calculation, review gating, synchronization controls, routes, and UI behavior remain unchanged.

## Completed slice 4 — workout safety gate

Workout Safety Gate now reads recovery check-ins and limitations directly from `useSafetyRecoveryState`.

The workout draft remains an explicit component prop, the persisted review snapshot remains owned by its existing store, and authentication remains owned by the auth session hook. No Workout or infrastructure state was added because the screen does not read those domains.

Decision calculation, acknowledgement handling, review snapshot loading, routes, and UI behavior remain unchanged.

## Next slices

Migrate the remaining mixed readers:

- Safety Recovery Coach;
- Combined Coach.

Compose only the focused boundaries each screen actually reads. Do not add Workout, Profile, Progress, Nutrition, action, infrastructure, or sync dependencies unless the source requires them.

## Explicit exclusions

This boundary does not change:

- persisted schemas or serialized values;
- repositories, mutation ordering, outbox, or synchronization;
- validation, scoring, readiness, or safety rules;
- routes, UI, or local form state;
- persistence coalescing or external state libraries;
- OTA, native builds, backend deployment, or environment activation.
