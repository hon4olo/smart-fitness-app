# Smart Fitness Active Refactor Roadmap

Updated: 2026-08-01

Canonical execution plan for `hon4olo/smart-fitness-app`. Completed implementation detail belongs in PR history and focused architecture notes.

## Verified baseline

Mobile baseline:

- `b5f8ba2ee85bdebbbaf6dd0a18c12bfbea0b5cb2` — pure Nutrition consumer migration complete;
- Expo SDK 56, React Native, Expo Router, TypeScript;
- offline-first repository persistence;
- ordered observable mutation queue;
- revision-aware synchronization;
- focused `AppActions`, `AppInfrastructure`, `WorkoutState`, and `NutritionDataState` contexts;
- compatibility consumers reduced from 40 to 15;
- no pure Workout or Nutrition consumer remains on compatibility state;
- no production UI reconstructs full `AppState` for a bounded edit;
- blocking Mobile CI covers line audits, TypeScript, Coach/sync contracts, regression, Expo export, and Expo Doctor.

Backend baseline:

- `3f6c907efcfa503bd4beaf12b072c4e5b4573362`;
- no backend change is required for current state-boundary work.

## Invariants

- Preserve IDs, persisted schemas, canonical units, authentication, revisions, idempotency, conflicts, completed history, and explicit Coach confirmations.
- Retain one internal `AppState`, repository, mutation queue, outbox, and synchronization ownership boundary during focused-context migration.
- Keep mutations in stable `AppActions` and operational status in `AppInfrastructure`.
- Do not apply generic debounce to outbox-bearing operations.
- Do not add a state or chart library without measured need.
- Keep hand-written source files at or below 500 physical lines.
- Use bounded PRs and merge only exact green heads.
- Do not publish OTA, build/install native binaries, deploy backend changes, activate environments, or change credentials without explicit authorization.

# Phase 1 — cleanup and preparation

Status: complete.

- PR #291 — roadmap and root artifact cleanup.
- PR #292 — canonical routes and compatibility redirects.
- PR #293 — empty-state consolidation.
- PR #294 — cloud reachability inventory.
- PR #295 — bundled timestamp semantics.

# Phase 2 — state and persistence architecture

Status: in progress.

## Completed

### Stable actions and infrastructure

PRs #296 and #298 introduced focused action and infrastructure contexts and migrated action-only/status-only consumers.

### Typed bounded updater actions

PRs #299 and #300 removed all four full-state reconstruction paths.

### Workout state boundary

PRs #302–#307 and #310:

- defined `WorkoutState` from workouts, programs, exercises, and sessions;
- migrated every pure Workout reader;
- retained mixed readers until all required domain hooks exist;
- added permanent source guards.

### Nutrition state boundary

PRs #312 and #314:

- defined `NutritionDataState` from food entries, meal templates, and targets;
- migrated Nutrition tab, date picker, and Add Food;
- retained the existing macro-summary type named `NutritionState`;
- kept editor, catalog, scanner, persistence, synchronization, routes, and UI unchanged;
- left zero pure Nutrition consumers on compatibility state.

Architecture notes:

- `docs/architecture/app-context-consumer-inventory.md`;
- `docs/architecture/workout-state-boundary.md`;
- `docs/architecture/nutrition-state-boundary.md`.

## Current target — Progress state boundary

Goal: isolate weight and measurement reads from unrelated Nutrition, Profile, Safety, Recovery, and onboarding updates while composing with existing Workout state where required.

Initial contract candidate:

- `weightHistory`;
- `bodyMeasurements`.

Do not include `workoutSessions` or `exercises` in Progress state. Mixed Progress readers should use both `useProgressState` and `useWorkoutState`.

Tasks:

- [ ] build a fresh inventory of Progress-related `useAppContext` consumers and exact fields;
- [ ] identify pure Progress readers and mixed Progress/Workout readers;
- [ ] define a memoized focused Progress state type from actual consumers only;
- [ ] expose `useProgressState` while retaining one internal `AppState`;
- [ ] migrate pure Progress readers first;
- [ ] migrate mixed Progress/Workout readers by composing focused hooks;
- [ ] keep Profile fields on compatibility state until the Profile boundary exists;
- [ ] add permanent source guards;
- [ ] pass full Mobile CI on every bounded slice.

Explicit exclusions:

- charts and SVG work;
- selector redesign;
- persistence coalescing;
- synchronization or schema changes;
- route or UI redesign;
- Zustand/Jotai migration.

## Later focused boundaries

Recommended order after Progress:

1. Profile and onboarding.
2. Safety and Recovery.

For each boundary:

- derive the minimum contract from actual consumers;
- memoize only required identities;
- migrate pure consumers first;
- compose existing focused hooks for mixed consumers;
- retain source guards and exact-head CI validation.

## Pure selectors

After focused state contracts stabilize:

- extract daily Nutrition totals and diary grouping selectors;
- extract program/session selectors;
- extract weekly volume and weight-trend selectors;
- keep time, locale, and unit boundaries explicit;
- cover legacy normalization and edge cases.

## Coalesced persistence decision gate

Start only after focused boundaries stabilize and measurements confirm high-frequency full-snapshot writes are material.

Required properties:

- immediate in-memory updates;
- latest-state coalescing over roughly 300–500 ms for eligible local writes;
- immediate flush for critical operations and lifecycle transitions;
- preserved outbox order, identity, observability, retry, and recovery semantics.

## External-state-library decision gate

- measure render counts after focused contexts;
- consider Zustand only if broad invalidation remains materially expensive;
- do not adopt Zustand or Jotai as an unmeasured cleanup exercise.

### Phase 2 exit criteria

- pure domain consumers use focused hooks;
- mixed consumers compose focused hooks where available;
- action-only and status-only consumers avoid domain arrays;
- bounded forms never reconstruct full application state;
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

Priorities:

- replace the unbounded Nutrition diary with one `SectionList`;
- virtualize the unbounded program list;
- evaluate Workout history, exercise library, food search, templates, and saved items using measured growth;
- preserve active-session, keyboard, accessibility, and navigation behavior.

# Phase 4 — progress charts

Status: pending stable Progress selectors and performance boundaries.

Use installed `react-native-svg` by default.

## Weight trend

- accessible SVG time series;
- 7, 30, and 90-day ranges;
- canonical kg storage with kg/lb presentation;
- zero and one-entry states.

## Weekly Workout volume

- pure timezone-aware selector;
- valid completed sets only;
- consistent empty weeks;
- 8–12 week display;
- incomplete, legacy, deload, and timezone edge coverage.

# External and deferred work

Not part of autonomous refactor execution:

- fixed-SHA cross-repository release gate requiring authorized token access;
- provider-backed Coach staging validation;
- native builds and physical-device release testing;
- second-device conflict matrices;
- accessibility and EN/RU/unit device matrices;
- privacy, consent, identity, retention, deletion, and analytics requirements;
- SQLite consideration before state-size and restore/save measurements;
- OTA publication, native build/install, backend deployment, environment activation, or credential changes.

# Validation policy

Every code-bearing mobile slice requires focused tests, TypeScript, the complete regression suite, blocking Mobile CI, review-thread inspection, and merge of the exact green head only.

# Immediate next action

Build the exact Progress consumer inventory and implement the smallest useful `ProgressState` boundary without changing persistence, synchronization, charts, routes, or UI.
