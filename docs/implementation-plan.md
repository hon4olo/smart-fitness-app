# Smart Fitness Active Refactor Roadmap

Updated: 2026-08-01

This file contains only active and upcoming work. Completed implementation detail belongs in PR history and focused architecture notes.

## Verified architecture

- One authoritative internal `AppState` remains behind repository, mutation queue, outbox, and synchronization layers.
- Focused boundaries are available for actions, infrastructure, Workout, Nutrition, Progress, Profile, and Safety/Recovery state.
- Production `useAppContext` consumers have been reduced from 40 to 0.
- No production UI reconstructs or subscribes to the full application state.
- Permanent source guards protect focused state boundaries, virtualized high-volume lists, and Progress chart contracts.
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

# Phase 4 — UI virtualization and render performance

Status: complete.

Completed evidence and implementation:

- deterministic fixtures for 500 food entries, 100 programs, 500 completed sessions, 500 exercises, and 365 weight entries;
- stable unique keys and deterministic grouping/sorting inputs;
- Nutrition Diary moved to one `SectionList` after confirming up to 500 simultaneously mounted rows;
- Programs tab moved to `FlatList` for the 100-program representative case;
- Workout History moved to `FlatList` for the 500-session representative case;
- Exercise Library moved to one `SectionList` for favorites, recent, and browse sections;
- repeated Exercise Library membership scans replaced with memoized maps and sets;
- food search remains bounded to 18 local results;
- recent foods remain bounded to 20 unique results;
- Progress keeps bounded analytics and short previews instead of rendering all 365 weight entries;
- saved meal details allow only one expanded template at a time;
- permanent source guards protect the four virtualized boundaries and bounded secondary limits.

The final decisions are recorded in `docs/architecture/list-performance-baseline.md`.

Exit criteria satisfied:

- representative high-volume surfaces no longer mount all rows at once;
- stable domain IDs back list keys;
- UI, routes, accessibility, keyboard behavior, persistence, and synchronization semantics remain compatible;
- secondary surfaces were not rewritten without measured need;
- physical-device profiling is release evidence, not a source-refactor blocker.

# Phase 5 — progress charts

Status: complete.

Completed weight trend work:

- pure canonical-kg selector for 7/30/90-day ranges;
- deterministic anchoring to the latest valid entry;
- latest-write handling for duplicate date keys;
- invalid timestamp and non-finite weight exclusion;
- accessible `7D / 30D / 90D` controls;
- kg/lb conversion retained in the presentation layer;
- zero-entry, one-entry, sparse, boundary, duplicate-date, invalid-data, and range-switch coverage;
- existing weight summary, add-weight flow, and Weight Details navigation preserved.

Completed weekly workout-volume work:

- pure selector for a continuous 8–12 week series;
- Monday week boundaries with explicit timezone offset;
- empty weeks retained for chart continuity;
- positive finite completed sets and legacy sets without `completed` counted;
- explicitly incomplete and invalid sets excluded;
- current-week volume and workout count;
- previous-week comparison;
- reusable chart card using the existing `ProgressTrendChart` and installed SVG stack;
- old session-level Training Progress summary removed from Progress;
- permanent source guards protect selector, card, and screen integration.

Exit criteria satisfied:

- no new chart dependency;
- canonical units and persistence remain unchanged;
- chart selectors are pure and deterministic;
- Progress no longer presents session count as weekly workout count;
- routes, synchronization, and native configuration remain compatible.

# Next decision gate

The active architecture, persistence, list-performance, and Progress-chart refactor roadmap is complete. The next bounded slice must be selected from measured product or release evidence rather than speculative refactoring.

Eligible inputs include:

- physical-device performance or accessibility findings;
- release-candidate smoke failures;
- user-visible workflow defects;
- backend contract gaps;
- a separately approved product roadmap item.

# Deferred external work

Not part of autonomous refactor execution:

- OTA publication or native build/install;
- backend deployment or environment activation;
- provider-backed Coach staging validation;
- fixed-SHA cross-repository release gates requiring additional credentials;
- physical-device accessibility, language, unit, performance, and two-device conflict matrices;
- privacy, consent, retention, deletion, and analytics policy work.
