# Nutrition State Boundary

Updated: 2026-08-01

Status: in progress; first migration slice complete on code baseline `099994f34a322aa4e2bed8c7933c8a25b55cfc65`.

## Purpose

`useNutritionState` narrows Nutrition-screen subscriptions without changing the internal `AppState`, persistence repository, mutation queue, outbox, or synchronization ownership.

## Contract

The focused value contains only:

- `foodEntries`;
- `mealTemplates`;
- `nutritionTargets`.

The existing macro-summary model named `NutritionState` remains unchanged. The focused context type is named `NutritionDataState` to avoid changing that public domain model.

Nutrition mutations remain in stable `AppActions`. Restore and mutation status remain in `AppInfrastructure`.

## Completed slice 1 — Nutrition diary and date picker

PR #312 introduced the context and migrated:

- `src/app/(tabs)/nutrition.tsx`;
- `src/app/nutrition/date-picker.tsx`.

The Nutrition tab reads entries and targets. The date picker reads entries only. Neither screen now subscribes to Workout, Progress, Profile, Safety, Recovery, onboarding, actions, or infrastructure state through compatibility `AppContext`.

The slice also updated source-regression tests so adjacent focused state types are inspected with exact boundaries.

Merge: `099994f34a322aa4e2bed8c7933c8a25b55cfc65`.

## Remaining pure consumer

`src/app/nutrition/add-food.tsx` remains the only pure Nutrition compatibility consumer. It combines:

- `foodEntries` and `mealTemplates` from Nutrition state;
- seven existing mutation functions from stable `AppActions`;
- substantial local editor, search, favorites, scanner, and library state.

Its migration must be a separate mechanical slice using `useNutritionState` plus `useAppActions`.

## Explicit exclusions

The boundary does not change:

- persisted schemas or serialized values;
- Nutrition repositories or synchronization;
- diary selectors or calculations;
- routes, UI, or local screen state;
- list virtualization;
- persistence coalescing;
- dependencies or external state libraries;
- OTA, native builds, or deployments.
