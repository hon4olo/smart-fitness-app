# AppContext Consumer Inventory

Updated: 2026-08-01

## Current state

The original production baseline contained 40 `useAppContext` consumers.

After the focused state-boundary migration, only three intentional compatibility consumers remain:

- `src/app/(tabs)/index.tsx` — Home composes data from every major product domain plus onboarding state;
- `src/app/auth/index.tsx` — startup redirect depends on restore and onboarding state;
- `src/features/onboarding/OnboardingClientScreen.tsx` — onboarding edits profile data and completes the onboarding transition.

Reduction:

- original: 40;
- remaining: 3;
- removed from compatibility context: 37, or 92.5%.

## Available focused boundaries

- `AppActions`;
- `AppInfrastructure`;
- `WorkoutState`;
- `NutritionDataState`;
- `ProgressState`;
- `ProfileDataState`;
- `SafetyRecoveryState`.

All pure Workout, Nutrition, Progress, Profile, and Safety/Recovery consumers use focused hooks. Mixed Coach and Progress readers compose focused boundaries rather than introducing aggregate contexts.

## Remaining decision gate

Do not remove compatibility `AppContext` mechanically.

First decide whether Home and onboarding should:

1. compose the existing focused hooks directly; or
2. use a small dedicated onboarding/startup boundary for `onboardingCompleted` and restore state.

The internal `AppState`, repository, mutation queue, outbox, and synchronization ownership remain authoritative during this decision.
