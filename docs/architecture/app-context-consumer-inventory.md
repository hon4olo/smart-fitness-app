# AppContext Consumer Inventory

Updated: 2026-08-01

## Current state

The original production baseline contained 40 `useAppContext` consumers.

After completing the focused state-boundary migration:

- original production consumers: 40;
- remaining production consumers: 0;
- removed from compatibility context: 40, or 100%.

## Available focused boundaries

- `AppActions`;
- `AppInfrastructure`;
- `WorkoutState`;
- `NutritionDataState`;
- `ProgressState`;
- `ProfileDataState`;
- `SafetyRecoveryState`.

Mixed readers compose only the focused boundaries they actually need. No production screen receives the full application state through `useAppContext`.

## Final migrated consumers

- Home composes Workout, Nutrition, Progress, Profile, and Infrastructure hooks.
- Auth startup composes Profile state, Infrastructure state, and the existing auth-session hook.
- Onboarding reads Profile state, invokes `AppActions`, and observes restore/mutation status through `AppInfrastructure`.

No Home aggregate context or startup/onboarding context was required.

## Compatibility primitive

The internal `AppContext` object and `useAppContext` helper remain inside the provider implementation as a compatibility primitive while one authoritative internal `AppState` continues to back repositories, the mutation queue, outbox, and synchronization layers.

They are not permitted in production consumers. `test/no-production-app-context-consumers.test.ts` permanently guards this boundary.

Removing the internal primitive is a separate provider-internals refactor and is not required to close the production subscription boundary.
