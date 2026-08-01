# Progress State Boundary

Updated: 2026-08-01

Status: primary Progress consumers migrated.

## Purpose

`ProgressStateProvider` publishes only the state owned by the Progress domain while retaining the existing internal `AppState`, repository, mutation queue, outbox, and synchronization ownership.

## Contract

The focused value contains only:

- `weightHistory`;
- `bodyMeasurements`.

Workout sessions and exercises remain owned by `WorkoutState`. Mixed Progress screens compose `useProgressState` with `useWorkoutState` rather than duplicating Workout arrays in the Progress contract.

Progress mutations remain in stable `AppActions`. Operational state remains in `AppInfrastructure`.

## Completed slice 1 — provider foundation

PR #316:

- added `ProgressStateProvider` and `useProgressState`;
- memoized the value from only `weightHistory` and `bodyMeasurements`;
- mounted the provider inside the existing `AppProvider` boundary;
- added permanent contract tests.

## Completed slice 2 — Weight Details

PR #317 migrated `src/app/weight-details.tsx`:

- reads `weightHistory` and `bodyMeasurements` through `useProgressState`;
- reads `workoutSessions` and `exercises` through `useWorkoutState`;
- no longer subscribes to compatibility `AppContext`.

## Completed slice 3 — Progress tab

`src/app/(tabs)/progress.tsx` now:

- reads `weightHistory` and `bodyMeasurements` through `useProgressState`;
- reads `workoutSessions` and `exercises` through `useWorkoutState`;
- receives `addBodyMeasurement` through stable `useAppActions`;
- no longer subscribes to compatibility `AppContext`.

Analytics, chart data, body-measurement form behavior, Safety/Recovery cards, units, routes, UI, persistence, and synchronization remain unchanged.

## Remaining mixed readers

Home and Profile Goals still combine Progress data with domains that do not yet all have focused state boundaries. They should migrate only when their remaining Profile/onboarding dependencies are available through focused hooks.

## Explicit exclusions

This boundary does not change:

- persisted schemas or serialized values;
- repositories, mutation ordering, outbox, or synchronization;
- analytics or selector behavior;
- charts, routes, UI, or local screen state;
- list virtualization or persistence coalescing;
- dependencies or external state libraries;
- OTA, native builds, backend deployment, or environment activation.
