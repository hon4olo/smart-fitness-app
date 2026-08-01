# Nutrition State Boundary

Updated: 2026-08-01

Status: first migration slice.

## Purpose

`useNutritionState` narrows Nutrition-screen subscriptions without changing the internal `AppState`, persistence repository, mutation queue, outbox, or synchronization ownership.

## Initial contract

The focused value contains only:

- `foodEntries`;
- `mealTemplates`;
- `nutritionTargets`.

The existing macro-summary model named `NutritionState` remains unchanged. The focused context type is named `NutritionDataState` to avoid changing that public domain model.

Nutrition mutations remain in stable `AppActions`. Restore and mutation status remain in `AppInfrastructure`.

## First migration slice

The first consumers are:

- `src/app/(tabs)/nutrition.tsx`;
- `src/app/nutrition/date-picker.tsx`.

The Nutrition tab reads entries and targets. The date picker reads entries only. Neither screen needs Workout, Progress, Profile, Safety, Recovery, onboarding, actions, or infrastructure state.

Add Food remains deferred to a separate slice because it combines entries, meal templates, multiple mutations, and substantial local editor state.

## Explicit exclusions

This slice does not change:

- persisted schemas or serialized values;
- Nutrition repositories or synchronization;
- diary selectors or calculations;
- routes, UI, or local screen state;
- list virtualization;
- persistence coalescing;
- dependencies or external state libraries;
- OTA, native builds, or deployments.
