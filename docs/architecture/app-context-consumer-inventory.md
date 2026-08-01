# AppContext Consumer Inventory

Updated: 2026-08-01

Scope: static TypeScript-AST inventory of `useAppContext` consumers on mobile `main` at `bb7fcbd3dd9ccd0912ec2f172f51d12dd492c503`.

## Baseline

- global-context consumers: 40;
- most common state field: `workoutSessions`, used by 19 consumers;
- infrastructure field `isRestoringState`: 15 consumers;
- `workouts`: 11 consumers;
- `exercises`: 10 consumers;
- `foodEntries`: 9 consumers;
- `profile`, `recoveryCheckIns`, `trainingPrograms`, `userLimitations`, and `weightHistory`: 8 consumers each;
- `bodyMeasurements` and `onboardingCompleted`: 7 consumers each;
- `nutritionTargets`: 6 consumers.

The original `AppContext` value combines all state slices, mutation actions, restore state, mutation failure state, and derived accessors. Any state replacement creates a new global context value and invalidates every global consumer.

## High-value findings

### Action-only consumers

These consumers do not need application state:

- `src/app/auth/register.tsx` — `updateRegistrationProfile`;
- `src/app/weight-entry.tsx` — `addWeightEntry`;
- `src/app/settings/index.tsx` — `resetOnboarding`.

They should subscribe to a stable action context rather than the global state object.

### Infrastructure-only consumers

- `src/features/settings/DataRecoveryCard.tsx` — mutation failure, pending count, retry;
- `src/features/coach/screens/NutritionCoachScreen.tsx` — restore state;
- `src/features/coach/screens/NutritionTargetProposalScreen.tsx` — restore state.

They should subscribe only to infrastructure status.

### Mixed focused consumer

`src/features/workouts/screens/WorkoutSessionFinishScreen.tsx` needs one mutation action and one infrastructure field:

- `saveWorkoutSession` from `AppActions`;
- `isRestoringState` from `AppInfrastructure`.

It does not need any domain arrays and should not subscribe to the compatibility context.

### Broad snapshot reconstruction

The original inventory found four screens that read nearly every state slice and called `replaceState`:

- `RecoveryCheckInScreen`;
- `UserLimitationScreen`;
- `ProgressPlanningSections`;
- `PersonalDetailsSettingsCard`.

All four are now migrated to typed functional updater actions. No production UI consumer in this inventory reconstructs the full `AppState` for a bounded domain edit.

### Workout concentration

Workout-related data dominates global subscriptions:

- `workoutSessions`: 19 consumers;
- `workouts`: 11 consumers;
- `exercises`: 10 consumers;
- `trainingPrograms`: 8 consumers.

The Workout domain should be the first full state slice extracted after infrastructure and actions.

## Public boundary slices

### PR #296 — boundary introduction

PR #296 introduced:

- `AppActions` type and `AppActionsContext`;
- `AppInfrastructure` type and `AppInfrastructureContext`;
- `useAppActions` and `useAppInfrastructure` hooks;
- memoized provider values;
- compatibility retention of `useAppContext` during migration.

Initial consumers moved off the global context:

- registration;
- weight entry;
- Data Recovery.

### PR #298 — focused-consumer migration

PR #298 moved:

- Settings reset-onboarding to `useAppActions`;
- Nutrition Coach restore status to `useAppInfrastructure`;
- Nutrition Target Proposal restore status to `useAppInfrastructure`;
- Workout Session Finish save and restore dependencies to the two focused hooks.

A source regression guard requires these files to retain focused hooks and rejects reintroduction of `useAppContext`.

### PR #299 — Safety & Recovery typed updater actions

PR #299 added typed actions for:

- recovery check-in upsert;
- user-limitation upsert;
- user-limitation deletion.

`RecoveryCheckInScreen` and `UserLimitationScreen` keep reading only their current domain arrays while validation and ordered persistence live behind `AppActions`. They no longer copy every `AppState` field or call `replaceState`.

### Profile typed updater actions

The next bounded slice adds:

- `updateCoachProfile` for the validated Coach profile form;
- `updatePersonalDetails` for date of birth and calculation sex.

`ProgressPlanningSections` and `PersonalDetailsSettingsCard` retain their current profile reads, validation, alerts, and ordered persistence while removing the final two full-state replacement paths.

## Recommended migration order

1. Extract Workout state and actions as the first complete domain boundary.
2. Extract Nutrition, Progress, and Profile state boundaries.
3. Retain the compatibility context until no production consumer requires it.
4. Profile render counts before considering an external store.
5. Specify and test coalesced persistence only after subscription boundaries stabilize.

## Decision gate

Do not introduce Zustand or Jotai at this stage. The current architecture can obtain a substantial reduction in invalidation through stable contexts and focused hooks without changing persistence or synchronization ownership.
