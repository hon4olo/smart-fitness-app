# Safety Recovery State Boundary

Updated: 2026-08-01

Status: complete.

## Contract

`SafetyRecoveryStateProvider` publishes only:

- `recoveryCheckIns`;
- `userLimitations`.

Mutations remain in `AppActions`, operational state remains in `AppInfrastructure`, synchronization remains in `SyncContext`, and the internal `AppState` remains authoritative.

## Completed migrations

- PR #323 — provider foundation and contract tests.
- PR #324 — Recovery Check-In and User Limitation editors.
- PR #325 — Safety Recovery Preflight.
- PR #326 — Workout Safety Gate.
- Final slice — Safety Recovery Coach and Combined Coach.

`SafetyRecoveryCoachScreen` composes focused Safety/Recovery state with restore status from `AppInfrastructure`.

`CombinedCoachScreen` composes the existing Workout, Nutrition, and Safety/Recovery state boundaries. It does not receive a new combined state context.

## Preserved behavior

The boundary migration does not change:

- readiness, restriction, scoring, or acknowledgement rules;
- Coach capability checks, polling, idempotency, or review snapshots;
- persisted schemas, repository ownership, mutation ordering, outbox, or sync;
- routes, UI, local form state, native configuration, backend, OTA, or deployment.

Permanent source guards prevent migrated consumers from returning to `useAppContext`.
