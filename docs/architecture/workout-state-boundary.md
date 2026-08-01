# Workout State Boundary

Updated: 2026-08-01

Status: complete on code baseline `3ead4fbadb68ed7c6ef44c3fe8e9f41441a2af7a`.

## Purpose

`WorkoutState` is the first focused domain-state boundary extracted from the compatibility `AppContext`.

It narrows React subscriptions without changing the internal `AppState`, repository, ordered mutation queue, synchronization ownership, persisted schemas, active-draft storage, or Workout actions.

## Contract

The boundary contains only:

- `workouts`;
- `trainingPrograms`;
- `exercises`;
- `workoutSessions`.

Mutation functions remain in stable `AppActions`. Restore and mutation status remain in `AppInfrastructure`.

The provider value is memoized from the four Workout-domain array identities. Nutrition, weight, profile, onboarding, Safety, and Recovery changes do not create a new `WorkoutState` value.

## Completed migration slices

1. PR #302 — introduced `WorkoutState`; migrated the Workouts hub and standalone Exercise Library. Merge: `c0b9456b40072017dbcc92e83fead2c0916d9765`.
2. PR #303 — migrated Program Detail and Workout Template Detail. Merge: `46813780b230f7f41f5cd7a61bb275a03135b173`.
3. PR #304 — migrated New Routine. Merge: `f46aa94bc7557ee1480e9e1b17b6a103cc4c704c`.
4. PR #305 — migrated active Workout Session. Merge: `51bbaee498e9cbb9448e0c2b5547c7d7bb435fd4`.
5. PR #306 — migrated the active-session exercise picker. Merge: `4dd982545867665a691b3cf4e483844d04634b44`.
6. PR #307 — migrated editable Workout History. Merge: `415ab2b83d1109d16e777ae92ebcf9b059f5b874`.
7. PR #310 — refreshed the exact AST inventory and migrated the remaining seven pure Workout readers. Merge: `3ead4fbadb68ed7c6ef44c3fe8e9f41441a2af7a`.

The final slice covered:

- Combined Coach Proposal;
- Strength Coach;
- Exercise Detail;
- Share Workout;
- Workout Builder;
- Workout History Detail;
- filtered Workout History.

Every migrated consumer is protected by a source guard that rejects reintroduction of `useAppContext`.

## Intentionally mixed consumers

Four screens still read Workout data through the compatibility context because they also require state domains that do not yet have focused boundaries:

- Home;
- Progress;
- Weight Details;
- Combined Coach Review.

They are not Workout-boundary gaps. They should migrate only after their additional Nutrition, Progress, Profile, or Safety state hooks exist.

## Result

- pure Workout compatibility consumers remaining: 0;
- `WorkoutState` contract remains limited to four arrays;
- no Workout-specific action context was added because stable `AppActions` already avoids array subscriptions;
- runtime behavior, persistence, synchronization, navigation, and UI remain compatible;
- all code-bearing slices passed blocking Mobile CI on their exact heads.

## Explicit exclusions

The boundary did not include:

- list virtualization;
- selector rewrites;
- persistence coalescing;
- synchronization changes;
- active workout draft storage changes;
- Zustand, Jotai, or another state library;
- route or UI changes;
- OTA publication, native builds, or deployments.
