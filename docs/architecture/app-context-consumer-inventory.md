# AppContext Consumer Inventory

Updated: 2026-08-01

Scope: TypeScript-AST inventory of production `useAppContext` consumers on mobile code baseline `3ead4fbadb68ed7c6ef44c3fe8e9f41441a2af7a`.

## Current baseline

- compatibility-context consumers: 18;
- original baseline before focused boundaries: 40;
- reduction: 22 consumers, or 55%;
- pure Workout consumers remaining on compatibility state: 0;
- intentionally mixed Workout readers: 4;
- no production UI reconstructs the full `AppState` for a bounded edit.

`AppActions`, `AppInfrastructure`, and `WorkoutState` are independently memoized. The compatibility context remains only for consumers that still combine multiple state domains.

## Intentionally mixed Workout readers

These screens still read Workout data together with domains that do not yet have focused state boundaries:

- `src/app/(tabs)/index.tsx` — Home combines Workout, Nutrition, Progress, Profile, and onboarding state;
- `src/app/(tabs)/progress.tsx` — Progress combines Workout sessions with weight, measurements, and exercises;
- `src/app/weight-details.tsx` — Weight Details combines Workout sessions with weight, measurements, and exercises;
- `src/features/coach/screens/CombinedCoachScreen.tsx` — Combined Coach combines Workout, Nutrition, Recovery, and limitations.

They remain on `useAppContext` intentionally. Each should migrate only after all required domain hooks exist.

## Remaining compatibility consumers by domain

### Nutrition

- `src/app/(tabs)/nutrition.tsx` — `foodEntries`, `nutritionTargets`;
- `src/app/nutrition/add-food.tsx` — entries, meal templates, and Nutrition actions;
- `src/app/nutrition/date-picker.tsx` — `foodEntries`.

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

PRs #302–#307 introduced `WorkoutState` and migrated the main Workout flows. PR #310 refreshed the inventory and moved the final seven pure Workout readers:

- Combined Coach Proposal;
- Strength Coach;
- Exercise Detail;
- Share Workout;
- Workout Builder;
- Workout History Detail;
- Workout History.

Source guards prevent every migrated file from returning to `useAppContext`.

## Next boundary

Introduce `NutritionState` containing only the existing Nutrition arrays required by current consumers. Keep actions in `AppActions`, infrastructure in `AppInfrastructure`, and one internal `AppState` authoritative.

Do not combine the Nutrition boundary with diary virtualization, persistence coalescing, synchronization changes, or an external state library.
