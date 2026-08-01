# Progress State Boundary

Updated: 2026-08-01

Status: provider foundation introduced; consumer migration pending.

## Purpose

`ProgressStateProvider` publishes only the state owned by the Progress domain while retaining the existing internal `AppState`, repository, mutation queue, outbox, and synchronization ownership.

## Contract

The focused value contains only:

- `weightHistory`;
- `bodyMeasurements`.

Workout sessions and exercises remain owned by `WorkoutState`. Mixed Progress screens must compose `useProgressState` with `useWorkoutState` rather than duplicating Workout arrays in the Progress contract.

Progress mutations remain in stable `AppActions`. Operational state remains in `AppInfrastructure`.

## First slice

This slice:

- adds `ProgressStateProvider` and `useProgressState`;
- memoizes the value from only `weightHistory` and `bodyMeasurements`;
- mounts the provider inside the existing `AppProvider` boundary;
- adds permanent contract tests.

No production consumer migrates in this foundation slice. The next bounded slice will move the Progress tab and Weight Details to composition of focused Progress, Workout, and action hooks.

## Explicit exclusions

This slice does not change:

- persisted schemas or serialized values;
- repositories, mutation ordering, outbox, or synchronization;
- analytics or selector behavior;
- charts, routes, UI, or local screen state;
- list virtualization or persistence coalescing;
- dependencies or external state libraries;
- OTA, native builds, backend deployment, or environment activation.
