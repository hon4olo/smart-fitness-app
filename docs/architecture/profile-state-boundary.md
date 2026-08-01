# Profile State Boundary

Updated: 2026-08-01

Status: provider foundation and three consumer migrations complete.

## Purpose

`ProfileStateProvider` publishes only Profile and onboarding state while retaining the existing internal `AppState`, repository, mutation queue, outbox, and synchronization ownership.

## Contract

The focused value contains only:

- `profile`;
- `onboardingCompleted`.

Profile and onboarding mutations remain in stable `AppActions`. Operational restore and mutation status remain in `AppInfrastructure`.

The focused type is named `ProfileDataState` so it does not collide with the existing domain model named `ProfileState`.

## Completed slice 1 — provider foundation

PR #319:

- added `ProfileStateProvider` and `useProfileState`;
- memoized the value from only `profile` and `onboardingCompleted`;
- mounted the provider inside the existing `AppProvider` boundary;
- added permanent contract tests.

## Completed slice 2 — Profile tab

`src/app/(tabs)/profile.tsx` now reads `profile` through `useProfileState` and no longer subscribes to compatibility `AppContext`.

Profile summary calculations, routes, Social Profile entry, Profile Goals composition, layout, styling, and UI behavior remain unchanged.

## Completed slice 3 — planning and personal details

The following consumers now read `profile` through `useProfileState` and keep mutations in `useAppActions`:

- `src/features/progress/ProgressPlanningSections.tsx`;
- `src/features/settings/PersonalDetailsSettingsCard.tsx`.

Profile validation, unit conversion, local form state, alerts, routes, and save behavior remain unchanged.

## Next slices

Migrate remaining Profile readers:

- Profile Goals by composing `useProfileState`, `useProgressState`, and stable actions;
- onboarding and Home only after all required domain hooks are available.

## Explicit exclusions

This boundary does not change:

- persisted schemas or serialized values;
- repositories, mutation ordering, outbox, or synchronization;
- profile calculations, validation, or onboarding flow;
- routes, UI, or local screen state;
- persistence coalescing or external state libraries;
- OTA, native builds, backend deployment, or environment activation.
