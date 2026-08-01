# Workout State Boundary

Updated: 2026-08-01

## Purpose

`WorkoutState` is the first focused domain-state boundary extracted from the compatibility `AppContext`.

It narrows React subscriptions without changing the internal `AppState`, repository, ordered mutation queue, synchronization ownership, persisted schemas, or Workout actions.

## Contract

The boundary contains only:

- `workouts`;
- `trainingPrograms`;
- `exercises`;
- `workoutSessions`.

Mutation functions remain in the stable `AppActions` context. Restore and mutation status remain in `AppInfrastructure`.

The provider value is memoized from the four Workout-domain array identities. Nutrition, weight, profile, onboarding, Safety, and Recovery changes do not create a new `WorkoutState` value.

## Migration slices

### Slice 1 — hub and exercise library

The first bounded consumers are:

- `src/features/workouts/screens/WorkoutsScreen.tsx`;
- `src/app/workouts/exercise-library.tsx`.

`WorkoutsScreen` combines:

- `useWorkoutState` for templates, programs, and completed sessions;
- `useAppActions` for program creation;
- `useAppInfrastructure` for restore status.

Exercise Library combines:

- `useWorkoutState` for exercises and completed sessions;
- `useAppActions` for exercise creation and deletion.

### Slice 2 — program and template detail

The second bounded consumers are:

- `src/features/workouts/screens/ProgramDetailScreen.tsx`;
- `src/features/workouts/screens/WorkoutTemplateDetailScreen.tsx`.

Program Detail combines:

- `useWorkoutState` for programs and workout templates;
- `useAppActions` for program save and deletion;
- `useAppInfrastructure` for restore status.

Workout Template Detail combines:

- `useWorkoutState` for workout templates;
- `useAppActions` for custom-template deletion;
- `useAppInfrastructure` for restore status.

Source guards prevent all migrated files from returning to `useAppContext`.

## Deferred consumers

Mixed Home, Coach, Progress, and synchronization consumers remain on the compatibility context until their non-Workout dependencies have focused boundaries.

Later Workout-only screens should migrate in small groups after their exact state, action, and infrastructure dependencies are inspected. This boundary does not add a Workout action context because the existing stable `AppActions` value already avoids domain-array subscriptions.

## Explicit exclusions

This boundary does not include:

- list virtualization;
- selector rewrites;
- persistence coalescing;
- synchronization changes;
- active workout draft storage changes;
- Zustand, Jotai, or another state library;
- route or UI changes;
- OTA publication, native builds, or deployments.
