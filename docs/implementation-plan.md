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

Status: active.

## Immediate next action

Measure `repository.saveState()` frequency and timing during four representative flows:

1. active workout set editing;
2. nutrition entry editing;
3. weight entry creation/editing;
4. profile form editing.

For every observed write path, classify:

- snapshot-only local persistence;
- eager outbox-bearing operation;
- planner-based synchronized operation;
- critical transition requiring immediate flush;
- lifecycle-sensitive write requiring background/termination handling.

Record:

- write count per user action;
- payload/state size where available;
- queue ordering and retry behavior;
- app-background and process-termination behavior;
- whether repeated writes are materially redundant.

Do not implement coalescing until measurements establish a concrete redundant-write problem.

If implementation becomes justified, required properties are:

- immediate in-memory updates;
- latest-state coalescing around 300–500 ms only for eligible snapshot-only writes;
- immediate flush for critical operations and lifecycle transitions;
- preserved mutation order, retry, recovery, observability, and outbox identity;
- no generic debounce around the mutation queue.

# Phase 4 — UI virtualization and render performance

Status: pending stable persistence decision.

Use representative fixtures:

- 500 food entries;
- 100 programs;
- 500 completed sessions;
- 500 exercises;
- 365 weight entries.

Priorities:

- Nutrition diary as one `SectionList`;
- virtualized program list;
- measured evaluation of workout history, exercise library, food search, templates, and saved items;
- preservation of active-session, keyboard, accessibility, and navigation behavior.

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
