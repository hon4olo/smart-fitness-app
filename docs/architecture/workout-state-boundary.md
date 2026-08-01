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

### Slice 3 — New Routine

The third bounded consumer is:

- `src/features/workouts/screens/NewRoutineScreen.tsx`.

New Routine combines:

- `useWorkoutState` for workout templates, programs, and exercises;
- `useAppActions` for template creation and program save.

Its local draft, exercise picker, validation, unit display, generated IDs, program attachment, and navigation behavior are unchanged.

### Slice 4 — active Workout Session

The fourth bounded consumer is:

- `src/features/workouts/screens/WorkoutSessionScreen.tsx`.

Active Workout Session combines:

- `useWorkoutState` for templates, exercises, and completed-session history;
- `useAppInfrastructure` for restore status.

Its active-draft hydration, storage, set editing, RPE tracking, exercise replacement, finish routing, discard behavior, timers, and modal interactions are unchanged. The migration modifies only React context subscriptions.

### Slice 5 — active-session exercise picker

The fifth bounded consumer is:

- `src/features/workouts/screens/WorkoutExerciseLibraryScreen.tsx`.

The picker uses `useWorkoutState` only for completed-session history that powers recent exercises. The exercise catalogue, search, filters, diagnostics, FlatList virtualization, selected-item state, active-draft update, and return navigation remain owned by their existing repositories and local state.

### Slice 6 — Workout History

The sixth bounded consumer is:

- `src/app/workouts/history.tsx`.

Workout History combines:

- `useWorkoutState` for completed sessions;
- `useAppActions` for session update and deletion.

Its grouping, date presentation, set editor, canonical weight conversion, validation, alerts, and card rendering are unchanged.

Source guards prevent all migrated files from returning to `useAppContext`.

## Deferred consumers

Mixed Home, Coach, Progress, and synchronization consumers remain on the compatibility context until their non-Workout dependencies have focused boundaries.

Later Workout-only screens should migrate in small groups after their exact state, action, and infrastructure dependencies are inspected. This boundary does not add a Workout action context because the existing stable `AppActions` value already avoids domain-array subscriptions.

## Explicit exclusions

This boundary does not include:

- list virtualization changes;
- selector rewrites;
- persistence coalescing;
- synchronization changes;
- active workout draft storage changes;
- Zustand, Jotai, or another state library;
- route or UI changes;
- OTA publication, native builds, or deployments.
