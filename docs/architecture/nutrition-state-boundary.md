# Nutrition State Boundary

Updated: 2026-08-01

Status: pure Nutrition consumer migration complete.

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

## Completed slice 2 — Add Food

`src/app/nutrition/add-food.tsx` now:

- reads `foodEntries` and `mealTemplates` through `useNutritionState`;
- receives `addFoodEntries`, `addFoodEntry`, `addMealTemplate`, `deleteFoodEntry`, `deleteMealTemplate`, and `updateFoodEntry` through stable `useAppActions`;
- no longer subscribes to compatibility `AppContext`.

Local editor state, food search, favorites, scanner, food library integration, routes, calculations, and UI behavior remain unchanged.

All three pure Nutrition consumers are protected by permanent source guards.

## Mixed consumers

Home and Combined Coach continue to read Nutrition data through compatibility state because they also require other domains. They should migrate only after all of their remaining domain boundaries exist.

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
