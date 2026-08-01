# Smart Fitness Active Refactor Roadmap

Updated: 2026-08-01

Canonical execution plan for `hon4olo/smart-fitness-app`. Merged implementation detail belongs in PR history and focused architecture notes. Backend work is included only when a mobile slice requires a server-contract change.

## Verified baseline

Mobile code baseline:

- `3ead4fbadb68ed7c6ef44c3fe8e9f41441a2af7a` — final pure Workout-context migration;
- Expo SDK 56, React Native, Expo Router, TypeScript;
- offline-first repository persistence;
- ordered observable mutation queue;
- revision-aware synchronization for supported domains;
- stable `AppActions`, `AppInfrastructure`, and `WorkoutState` contexts coexist with compatibility `AppContext`;
- no production UI reconstructs full `AppState` for a bounded edit;
- no pure Workout consumer remains on compatibility state;
- blocking Mobile CI covers line audits, TypeScript, Coach/sync contracts, full regression, Expo export, and Expo Doctor.

Backend baseline:

- `3f6c907efcfa503bd4beaf12b072c4e5b4573362`;
- no backend change is required for the current state-boundary work.

## Invariants

- Preserve IDs, persisted schemas, canonical units, authentication, revisions, idempotency, conflicts, completed history, and explicit Coach confirmations unless a bounded task explicitly changes them.
- Retain one internal `AppState`, repository, mutation queue, and synchronization ownership boundary during focused-context migration.
- Keep mutation functions in stable `AppActions` and operational status in `AppInfrastructure` unless measured evidence justifies a narrower context.
- Do not apply a generic debounce to outbox-bearing mutations.
- Do not add a state or chart library without measured need.
- Keep hand-written source files at or below 500 physical lines.
- Use small PRs and merge only the exact green head.
- Do not publish OTA, build or install native binaries, deploy backend changes, activate environments, or change credentials without explicit authorization.

# Phase 1 — cleanup and preparation

Status: complete.

- PR #291 — active roadmap, root artifact cleanup, and ignore hardening.
- PR #292 — canonical Home navigation and legacy compatibility redirects.
- PR #293 — shared empty-state consolidation.
- PR #294 — cloud-module inventory and reachability guard.
- PR #295 — bundled timestamp semantics without persistence migration.

Architecture notes:

- `docs/architecture/cloud-module-inventory.md`;
- `docs/architecture/placeholder-timestamp-inventory.md`.

# Phase 2 — state and persistence architecture

Status: in progress.

## Completed boundaries

### Stable actions and infrastructure

PRs #296 and #298:

- introduced memoized `AppActions` and `AppInfrastructure` contexts;
- retained compatibility `AppContext` for incremental migration;
- moved action-only and infrastructure-only consumers;
- added source guards.

### Typed bounded updater actions

PRs #299 and #300:

- added typed functional updaters for Safety, Recovery, Coach Profile, and personal details;
- removed all four full-state reconstruction paths;
- preserved validation, unit conversion, ordered persistence, and synchronization behavior.

### Workout state boundary

Status: complete.

PRs #302–#307 and #310:

- defined memoized `WorkoutState` containing only `workouts`, `trainingPrograms`, `exercises`, and `workoutSessions`;
- migrated all pure Workout consumers;
- retained four intentionally mixed readers until their other domain hooks exist;
- reduced compatibility consumers from 40 to 18;
- added permanent source guards;
- passed blocking Mobile CI on every code-bearing slice.

Architecture notes:

- `docs/architecture/app-context-consumer-inventory.md`;
- `docs/architecture/workout-state-boundary.md`.

## Current target — Nutrition state boundary

Goal: isolate Nutrition reads from unrelated Workout, Progress, Profile, Safety, Recovery, and onboarding updates without changing persistence or synchronization ownership.

Initial contract candidate:

- `foodEntries`;
- `nutritionTargets`;
- `mealTemplates`.

The exact type must be derived from current `AppState`; do not add fields without an identified production consumer.

Initial pure consumers:

- `src/app/(tabs)/nutrition.tsx`;
- `src/app/nutrition/date-picker.tsx`;
- `src/app/nutrition/add-food.tsx`.

Tasks:

- [ ] verify the exact current Nutrition fields and consumer dependencies;
- [ ] define memoized `NutritionState` containing only required Nutrition arrays;
- [ ] expose `useNutritionState` while retaining one internal `AppState`;
- [ ] keep Nutrition mutations in stable `AppActions`;
- [ ] migrate the Nutrition tab and date picker first;
- [ ] migrate Add Food separately because it combines multiple actions and local editor state;
- [ ] add source guards preventing migrated consumers from returning to `useAppContext`;
- [ ] keep Home and Combined Coach on compatibility state until all their required domain hooks exist;
- [ ] pass full Mobile CI on every bounded slice.

Do not combine this boundary with diary virtualization, persistence coalescing, sync changes, route/UI redesign, or a state-library migration.

## Later focused state boundaries

Recommended order after Nutrition:

1. Progress state — weight history and body measurements.
2. Profile and onboarding state.
3. Safety and Recovery state — limitations and recovery check-ins.

For each domain:

- [ ] derive the minimum state contract from actual consumers;
- [ ] memoize only the required state identities;
- [ ] migrate pure consumers first;
- [ ] defer mixed consumers until every dependency has a focused hook;
- [ ] retain source guards and exact-head CI validation.

## Pure selectors

After focused state contracts stabilize:

- [ ] extract daily Nutrition totals and diary grouping selectors;
- [ ] extract program/session selectors;
- [ ] extract weekly volume and weight-trend selectors;
- [ ] accept only minimum required slices;
- [ ] keep time, locale, and unit boundaries explicit;
- [ ] cover legacy normalization and edge cases.

## Coalesced persistence

Start only after subscription boundaries stabilize and measurements confirm high-frequency full-snapshot writes are material.

Required properties:

- memory updates immediately;
- eligible latest-state writes coalesce over roughly 300–500 ms;
- critical operations flush immediately;
- background/inactive transitions flush pending local state;
- outbox operations retain order, identity, observability, and retry behavior;
- compaction uses tested domain-specific rules only.

Critical operations include workout completion, destructive deletion, onboarding completion, logout, synchronized state replacement, and required outbox mutations.

Tasks:

- [ ] specify queue and failure semantics;
- [ ] add fake-timer coalescing tests;
- [ ] add lifecycle flushing;
- [ ] preserve failure notices and retry controls;
- [ ] verify restart recovery and planner regeneration.

## External-state-library decision gate

- [ ] measure render counts after focused contexts;
- [ ] consider Zustand only if broad invalidation remains materially expensive;
- [ ] do not adopt Zustand or Jotai as an unmeasured cleanup exercise.

### Phase 2 exit criteria

- pure domain consumers use focused state hooks;
- action-only and infrastructure-only consumers avoid domain arrays;
- bounded forms never reconstruct full application state;
- unrelated domain mutations do not invalidate focused screens;
- high-frequency persistence is measured and, if necessary, safely coalesced;
- critical and outbox-bearing operations remain durable and ordered;
- persisted and synchronization contracts remain compatible.

# Phase 3 — UI virtualization and render performance

Status: pending stable Phase 2 boundaries.

Representative fixtures:

- 500 food entries;
- 100 programs;
- 500 completed sessions;
- 500 exercises;
- 365 weight entries.

Measure render commits, first render, tab switching, long-list scrolling, restore/save duration, and authorized real-device memory behavior.

## Nutrition diary

- [ ] replace unbounded diary rendering with one `SectionList`;
- [ ] use meal sections and food rows as the virtualized model;
- [ ] retain summary and week controls in the list header;
- [ ] retain details in the list footer;
- [ ] preserve collapse, editing, keyboard, accessibility, and scroll behavior;
- [ ] avoid nested vertical virtualized lists.

## Other growing lists

- [ ] virtualize the unbounded program list;
- [ ] evaluate Workout history, exercise library, food search, templates, and saved items using measured growth;
- [ ] keep tiny bounded collections simple unless profiling disproves it;
- [ ] preserve active-session resume, sticky controls, and navigation.

# Phase 4 — progress charts

Status: pending stable selectors and performance boundaries.

Use installed `react-native-svg` by default.

## Weight trend

- [ ] implement an accessible SVG time-series chart;
- [ ] support 7, 30, and 90-day ranges;
- [ ] preserve canonical kg storage and kg/lb presentation;
- [ ] handle zero and one-entry states.

## Weekly Workout volume

- [ ] implement a pure timezone-aware weekly-volume selector;
- [ ] include valid completed sets only;
- [ ] represent empty weeks consistently;
- [ ] display 8–12 weeks with UI-boundary unit conversion;
- [ ] cover incomplete sets, missing values, legacy data, deloads, and timezone edges.

# External and deferred work

Not part of autonomous refactor execution:

- fixed-SHA cross-repository release gate requiring authorized token access;
- provider-backed Coach staging validation;
- native builds and physical-device release testing;
- offline termination/restart and second-device conflict matrices;
- accessibility and EN/RU/unit device matrices;
- destructive local-versus-account conflict-choice contract;
- privacy, consent, identity, retention, deletion, and analytics requirements;
- SQLite consideration before state-size and restore/save measurements;
- OTA publication, native build/install, backend deployment, environment activation, or credential changes.

# Validation policy

Every code-bearing mobile slice requires focused tests, TypeScript, the complete regression suite, blocking Mobile CI, review-thread inspection, and merge of the exact green head only.

# Immediate next action

Verify the exact Nutrition fields in current `AppState`, introduce the smallest useful memoized `NutritionState`, and migrate the Nutrition tab plus date picker without changing persistence, synchronization, routes, or UI.
