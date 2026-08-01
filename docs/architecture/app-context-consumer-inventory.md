# AppContext Consumer Inventory

Updated: 2026-08-01

Scope: production `useAppContext` consumers after PR #314 on mobile baseline `b5f8ba2ee85bdebbbaf6dd0a18c12bfbea0b5cb2`.

## Current baseline

- compatibility-context consumers: 15;
- original baseline: 40;
- reduction: 25 consumers, or 62.5%;
- pure Workout consumers remaining: 0;
- pure Nutrition consumers remaining: 0;
- no production UI reconstructs full `AppState` for a bounded edit.

Focused boundaries currently available:

- `AppActions`;
- `AppInfrastructure`;
- `WorkoutState`;
- `NutritionDataState`.

One internal `AppState`, repository, mutation queue, outbox, and synchronization ownership boundary remain authoritative.

## Intentionally mixed readers

These screens remain on compatibility state until every required domain hook exists:

- `src/app/(tabs)/index.tsx` — Workout, Nutrition, Progress, Profile, and onboarding;
- `src/app/(tabs)/progress.tsx` — Workout sessions, exercises, weight, and measurements;
- `src/app/weight-details.tsx` — Workout sessions, exercises, weight, and measurements;
- `src/features/coach/screens/CombinedCoachScreen.tsx` — Workout, Nutrition, Recovery, and limitations.

## Remaining compatibility consumers by domain

### Progress, Profile, and onboarding

- `src/app/(tabs)/profile.tsx` — `profile`;
- `src/app/auth/index.tsx` — restore and onboarding status;
- `src/features/onboarding/OnboardingClientScreen.tsx` — profile, onboarding, actions, and mutation status;
- `src/features/profile/components/ProfileGoalsSection.tsx` — profile, weight history, and goal actions;
- `src/features/progress/ProgressPlanningSections.tsx` — profile;
- `src/features/settings/PersonalDetailsSettingsCard.tsx` — profile.

### Safety and Recovery

- `src/features/coach/screens/RecoveryCheckInScreen.tsx` — recovery check-ins;
- `src/features/coach/screens/SafetyRecoveryCoachScreen.tsx` — recovery check-ins and limitations;
- `src/features/coach/screens/SafetyRecoveryPreflightScreen.tsx` — restore, recovery, and limitations;
- `src/features/coach/screens/UserLimitationScreen.tsx` — limitations;
- `src/features/workouts/screens/WorkoutSafetyGateScreen.tsx` — recovery and limitations.

### Mixed multi-domain

- Home;
- Progress;
- Weight Details;
- Combined Coach.

## Completed boundary work

### Stable actions and infrastructure

PRs #296 and #298 introduced stable action and infrastructure hooks and migrated action-only and status-only consumers.

### Typed bounded updater actions

PRs #299 and #300 removed all four full-state reconstruction paths.

### Workout state

PRs #302–#307 and #310 migrated every pure Workout consumer and added permanent source guards.

### Nutrition state

PR #312 introduced `NutritionDataState` containing only:

- `foodEntries`;
- `mealTemplates`;
- `nutritionTargets`.

PR #314 migrated Add Food, completing all pure Nutrition consumers. The Nutrition tab, date picker, and Add Food are protected from returning to `useAppContext`.

## Next boundary

Introduce the smallest useful Progress state contract, initially considering only:

- `weightHistory`;
- `bodyMeasurements`.

Before implementation, classify current Progress readers precisely. Do not add Workout data to `ProgressState`; mixed Progress screens should compose `useProgressState` with the existing `useWorkoutState`.

Do not combine this boundary with chart work, selector redesign, persistence coalescing, synchronization changes, or an external state library.
