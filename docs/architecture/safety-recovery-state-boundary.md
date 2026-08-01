# Safety Recovery State Boundary

Updated: 2026-08-01

Status: provider foundation introduced; consumer migration pending.

## Purpose

`SafetyRecoveryStateProvider` publishes only Safety and Recovery state while retaining the existing internal `AppState`, repository, mutation queue, outbox, and synchronization ownership.

## Contract

The focused value contains only:

- `recoveryCheckIns`;
- `userLimitations`.

Mutations remain in stable `AppActions`. Restore and mutation status remain in `AppInfrastructure`. Sync state remains in `SyncContext`.

## First slice

This slice:

- adds `SafetyRecoveryStateProvider` and `useSafetyRecoveryState`;
- memoizes the value from only the two Safety/Recovery arrays;
- mounts the provider inside the existing `AppProvider` boundary;
- adds permanent contract tests.

No production consumer migrates in this foundation slice.

## Next slices

Migrate pure readers first:

- Recovery Check-In;
- User Limitation.

Then migrate mixed readers by composing focused Safety/Recovery state with infrastructure, actions, Workout state, and sync hooks as required:

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
