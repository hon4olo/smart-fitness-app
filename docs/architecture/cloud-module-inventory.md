# Cloud Module Inventory

Updated: 2026-08-01

Scope: `src/cloud/` on mobile `main` at `b2f8133fa530a00211be7ad3dea8a571f600e2b6`.

## Result

The directory is active synchronization infrastructure, not optional boilerplate.

- total TypeScript files: 79;
- production modules: 45;
- colocated test files: 34;
- direct production entry targets from outside `src/cloud/`: 28;
- production modules reachable through the complete static import closure: 45 of 45;
- orphaned production modules: 0;
- confirmed dead cloud modules: 0.

No cloud source file should be deleted as part of generic cleanup. A future deletion requires a bounded feature or contract change plus updated synchronization tests.

## Classification

### Core contracts, queue, and conflict infrastructure — 12 modules

- `CloudConflictPolicies.ts`;
- `CloudConflictResolver.ts`;
- `CloudConflictResolverValues.ts`;
- `CloudErrors.ts`;
- `CloudProvider.ts`;
- `CloudQueueHelpers.ts`;
- `CloudQueueIdempotency.ts`;
- `CloudQueueRetry.ts`;
- `CloudQueueStore.ts`;
- `CloudQueueTypes.ts`;
- `CloudSyncStatus.ts`;
- `CloudSyncTypes.ts`.

These modules define queue operations, retries, idempotency, provider contracts, status, payloads, and conflict policy. They are imported by runtime synchronization, repositories, storage, and application context code.

### Coordinator and provider boundary — 9 modules

- `RemoteSyncEntityAdapters.ts`;
- `SyncCoordinator.ts`;
- `SyncCoordinatorHelpers.ts`;
- `SyncCoordinatorOperations.ts`;
- `SyncCoordinatorPush.ts`;
- `SyncCoordinatorStateMachine.ts`;
- `SyncCoordinatorTypes.ts`;
- `createProductionCloudProvider.ts`;
- `index.ts`.

These modules connect authenticated API transport, queue storage, entity adapters, push and pull orchestration, conflict handling, and the public cloud boundary.

### Domain synchronization — 24 modules

Body measurements:

- `BodyMeasurementRemoteSync.ts`;
- `BodyMeasurementSync.ts`;
- `BodyMeasurementSyncPlanner.ts`.

Custom exercises:

- `CustomExerciseRemoteSync.ts`;
- `CustomExerciseSync.ts`;
- `CustomExerciseSyncPlanner.ts`.

Profile and nutrition:

- `FitnessProfileSync.ts`;
- `FoodEntrySync.ts`;
- `MealTemplateRemoteSync.ts`;
- `MealTemplateSync.ts`;
- `MealTemplateSyncPlanner.ts`;
- `NutritionLibrarySync.ts`;
- `NutritionTargetSync.ts`.

Safety and training:

- `SafetyRecoverySync.ts`;
- `SafetyRecoverySyncPlanner.ts`;
- `TrainingProgramRemoteSync.ts`;
- `TrainingProgramSync.ts`;
- `TrainingProgramSyncPlanner.ts`;
- `WeightHistorySync.ts`;
- `WorkoutSessionSync.ts`;
- `WorkoutTemplateSync.ts`;
- `WorkoutTemplateSyncPlanner.ts`;
- `WorkoutTemplateSyncRemote.ts`;
- `WorkoutTemplateSyncSerialization.ts`.

Each domain module is reached from active application context, repository, feature, storage, or provider code. Planner modules support deterministic recovery and must not be treated as unused merely because they are not screen imports.

### Colocated verification — 34 files

The remaining files are unit, integration, validation, hardening, and two-device conflict tests. They cover:

- provider construction and auth refresh;
- queue payload and retry behavior;
- remote materialization;
- planner behavior;
- strict payload compatibility;
- duplicate delivery and conflict resolution;
- user isolation;
- domain-specific synchronization.

These tests are verification assets rather than runtime modules and should remain colocated while the corresponding cloud contracts exist.

## Runtime entry points

External production imports enter the cloud boundary from:

- `src/context/SyncContext.tsx`;
- `src/context/applySyncPullResult.ts`;
- `src/context/syncContextModel.ts`;
- `src/context/repairRejectedSyncOperations.ts`;
- `src/context/appContext/useAppInfrastructure.ts`;
- `src/context/appContext/useWeightHistoryActions.ts`;
- `src/context/appContext/AppMutationOutboxRecovery.ts`;
- synchronization-aware repositories;
- queue and recovery storage adapters;
- workout and Nutrition feature mutation paths.

The import closure from those runtime roots reaches every non-test module in `src/cloud/`.

## Permanent guard

`test/cloud-module-reachability.test.ts` reconstructs the static import graph and fails when a non-test cloud module is no longer reachable from production code outside `src/cloud/`.

This guard is intentionally conservative:

- a newly orphaned module must be removed or explicitly reconnected;
- tests alone do not make a production module reachable;
- a self-contained cycle inside `src/cloud/` does not count as runtime reachability;
- static `import`, `export ... from`, `import()`, and `require()` specifiers are recognized;
- computed runtime module names are outside the guard and require explicit review.

## Decision

The original proposal to delete optional cloud boilerplate is rejected for the current codebase. `src/cloud/` represents first-class production synchronization for multiple domains and recovery paths. The safe cleanup outcome is documentation plus a reachability regression guard, with no runtime deletion.
