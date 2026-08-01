# AppContext Consumer Inventory

Updated: 2026-08-01

Scope: TypeScript-AST inventory and subsequent focused migrations through mobile code baseline `099994f34a322aa4e2bed8c7933c8a25b55cfc65`.

## Current baseline

- compatibility-context consumers: 16;
- original baseline before focused boundaries: 40;
- reduction: 24 consumers, or 60%;
- pure Workout consumers remaining on compatibility state: 0;
- pure Nutrition consumers remaining on compatibility state: 1;
- intentionally mixed Workout readers: 4;
- no production UI reconstructs the full `AppState` for a bounded edit.

`AppActions`, `AppInfrastructure`, `WorkoutState`, and `NutritionDataState` are independently memoized. The compatibility context remains only for still-unmigrated pure domains and consumers that combine multiple state domains.

## Intentionally mixed Workout readers

These screens still read Workout data together with domains that do not yet have focused state boundaries:

- `src/app/(tabs)/index.tsx` — Home combines Workout, Nutrition, Progress, Profile, and onboarding state;
- `src/app/(tabs)/progress.tsx` — Progress combines Workout sessions with weight, measurements, and exercises;
- `src/app/weight-details.tsx` — Weight Details combines Workout sessions with weight, measurements, and exercises;
- `src/features/coach/screens/CombinedCoachScreen.tsx` — Combined Coach combines Workout, Nutrition, Recovery, and limitations.

They remain on `useAppContext` intentionally. Each should migrate only after all required domain hooks exist.

## Remaining compatibility consumers by domain

### Nutrition

- `src/app/nutrition/add-food.tsx` — entries, meal templates, and Nutrition actions.

The Nutrition tab and date picker moved to `useNutritionState` in PR #312.

### Profile and onboarding

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
- Combined Coach Review.

## Completed boundary work

### Stable action and infrastructure access

PRs #296 and #298 introduced stable `AppActions` and `AppInfrastructure` hooks and migrated action-only, infrastructure-only, and Workout Session Finish consumers.

### Typed bounded updater actions

PRs #299 and #300 removed all four full-state reconstruction paths by adding typed functional updater actions for Safety, Recovery, and Profile edits.

### Workout state boundary

PRs #302–#307 introduced `WorkoutState` and migrated the main Workout flows. PR #310 refreshed the inventory and moved the final seven pure Workout readers.

### Nutrition state boundary

PR #312 introduced memoized `NutritionDataState` containing only:

- `foodEntries`;
- `mealTemplates`;
- `nutritionTargets`.

It migrated the Nutrition tab and date picker while preserving the existing macro-summary model named `NutritionState`.

Source guards prevent every migrated file from returning to `useAppContext`.

## Next action

Migrate Add Food to `useNutritionState` plus stable `useAppActions` without changing its editor, catalog, favorites, library, persistence, synchronization, route, or UI behavior.

Do not combine the Nutrition boundary with diary virtualization, persistence coalescing, synchronization changes, or an external state library.
