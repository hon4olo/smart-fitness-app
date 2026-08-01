# Smart Fitness Active Refactor Roadmap

Updated: 2026-08-01

This file contains only active and upcoming work. Completed implementation detail belongs in PR history and focused architecture notes.

## Verified architecture

- One authoritative internal `AppState` remains behind repository, mutation queue, outbox, and synchronization layers.
- Focused boundaries are available for actions, infrastructure, Workout, Nutrition, Progress, Profile, and Safety/Recovery state.
- Production `useAppContext` consumers have been reduced from 40 to 0.
- No production UI reconstructs or subscribes to the full application state.
- A permanent source guard prevents production consumers from returning to `useAppContext`.
- Blocking Mobile CI covers line audits, TypeScript, Coach/sync contracts, full regression, Expo export, and Expo Doctor.

## Invariants

- Preserve persisted schemas, IDs, canonical units, authentication, revisions, idempotency, conflicts, completed history, and explicit Coach confirmations.
- Keep actions in `AppActions` and operational status in `AppInfrastructure`.
- Do not debounce or compact outbox-bearing operations without an explicit semantic design.
- Do not add Zustand, Jotai, a chart library, or another persistence layer without measured need.
- Keep hand-written source files at or below 500 physical lines.
- Use bounded PRs and merge only exact green heads.
- Do not publish OTA, build/install native binaries, deploy backend changes, activate environments, or change credentials without explicit authorization.

# Phase 1 — cleanup

Status: complete.

Root artifacts, alias routes, duplicate empty states, cloud reachability, and bundled timestamp semantics were audited and cleaned in PRs #291–#295.

# Phase 2 — state architecture

Status: complete.

Completed boundaries:

- stable actions and infrastructure;
- typed bounded updater actions;
- Workout state;
- Nutrition state;
- Progress state;
- Profile state;
- Safety/Recovery state;
- Home composition from existing focused hooks;
- auth startup composition from Profile and Infrastructure state;
- onboarding composition from Profile state, AppActions, and AppInfrastructure.

Exit criteria satisfied:

- production `useAppContext` consumers: 0;
- mixed readers compose focused hooks;
- action-only and status-only consumers avoid domain arrays;
- critical and outbox-bearing operations remain durable and ordered;
- persistence and synchronization contracts remain compatible.

The internal compatibility primitive remains provider-internal. Removing it is not required for the production subscription boundary and must not be combined with persistence work.

# Phase 3 — persistence measurement and coalescing decision

Status: complete.

Completed evidence:

- development-only measurement at the single `repository.saveState()` boundary;
- bounded payload-free metrics disabled in production builds;
- source-level operation matrix in `docs/architecture/persistence-operation-matrix.md`;
- deterministic results in `docs/architecture/persistence-measurement-results.md`;
- rapid active-draft revision suppression;
- ordered handling of in-flight writes and later revisions;
- clear/discard ordering after an in-flight write;
- hydration protection against overwriting a newer in-memory edit;
- one AppState save per explicit nutrition/profile action;
- preserved outbox identity for weight and onboarding operations;
- preserved persistence-before-outbox, failure, and retry semantics.

Decision:

- do not add generic debounce or coalescing around `AppMutationQueue`;
- do not add time-based debounce to active workout draft persistence;
- retain bounded development-only instrumentation for future diagnostics;
- require new measurements before any future persistence optimization.

Exit criteria satisfied:

- representative write frequency and ordering are measured;
- snapshot-only and outbox-bearing paths are classified;
- lifecycle-sensitive draft behavior is covered;
- no material redundant committed-write problem is demonstrated;
- persistence schemas, mutation ordering, recovery, and sync ownership remain unchanged.

# Phase 4 — UI virtualization and render performance

Status: active.

## Completed baseline

- deterministic fixture targets exist for 500 food entries, 100 programs, 500 completed sessions, 500 exercises, and 365 weight entries;
- fixtures provide stable unique keys and deterministic grouping/sorting inputs;
- the baseline is recorded in `docs/architecture/list-performance-baseline.md`;
- Nutrition diary is confirmed to use one vertical `ScrollView` with mapped meal groups and no virtualized list boundary;
- no production UI or data path has been changed.

## Immediate next action

Measure and inventory the Nutrition diary before implementation:

1. benchmark `useNutritionDaySummary` grouping/summary work with 500 entries;
2. inspect `MealGroup` to determine how many expanded entry rows mount;
3. verify key and callback stability for meal and food-entry rows;
4. record keyboard, accessibility, date-navigation, and expansion constraints;
5. decide whether one `SectionList` is justified.

Then repeat the same bounded inventory for:

- Programs with 100 programs;
- Workout history with 500 completed sessions;
- Exercise Library with 500 exercises;
- weight history with 365 entries;
- food search, templates, and saved items where representative data can materialize many rows.

Do not virtualize a surface until measurements demonstrate a material problem. Do not begin charts until stable selectors and measured list performance are recorded.

# Phase 5 — progress charts

Status: pending stable selectors and measured performance.

Use installed `react-native-svg` by default.

Weight trend:

- accessible 7/30/90-day time series;
- canonical kg storage with kg/lb presentation;
- zero and one-entry states.

Weekly workout volume:

- pure timezone-aware selector;
- valid completed sets only;
- consistent empty weeks;
- 8–12 week display;
- legacy, deload, incomplete-set, and timezone coverage.

# Deferred external work

Not part of autonomous refactor execution:

- OTA publication or native build/install;
- backend deployment or environment activation;
- provider-backed Coach staging validation;
- fixed-SHA cross-repository release gates requiring additional credentials;
- physical-device accessibility, language, unit, and two-device conflict matrices;
- privacy, consent, retention, deletion, and analytics policy work.
