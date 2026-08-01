# Profile State Boundary

Updated: 2026-08-01

Status: provider foundation introduced; consumer migration pending.

## Purpose

`ProfileStateProvider` publishes only Profile and onboarding state while retaining the existing internal `AppState`, repository, mutation queue, outbox, and synchronization ownership.

## Contract

The focused value contains only:

- `profile`;
- `onboardingCompleted`.

Profile and onboarding mutations remain in stable `AppActions`. Operational restore and mutation status remain in `AppInfrastructure`.

The focused type is named `ProfileDataState` so it does not collide with the existing domain model named `ProfileState`.

## First slice

This slice:

- adds `ProfileStateProvider` and `useProfileState`;
- memoizes the value from only `profile` and `onboardingCompleted`;
- mounts the provider inside the existing `AppProvider` boundary;
- adds permanent contract tests.

No production consumer migrates in this foundation slice.

## Next slices

Migrate pure Profile readers first:

- Profile tab;
- Progress planning sections;
- personal-details settings.

Then migrate onboarding and mixed Profile/Progress screens by composing focused hooks with stable actions and infrastructure.

## Explicit exclusions

This boundary does not change:

- persisted schemas or serialized values;
- repositories, mutation ordering, outbox, or synchronization;
- profile calculations, validation, or onboarding flow;
- routes, UI, or local screen state;
- persistence coalescing or external state libraries;
- OTA, native builds, backend deployment, or environment activation.
