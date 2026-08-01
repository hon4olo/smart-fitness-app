# Smart Fitness Active Refactor Roadmap

Updated: 2026-08-01

This file contains only active and upcoming work. Completed implementation detail belongs in PR history and focused architecture notes.

## Verified architecture

- One authoritative internal `AppState` remains behind repository, mutation queue, outbox, and synchronization layers.
- Focused boundaries are available for actions, infrastructure, Workout, Nutrition, Progress, Profile, and Safety/Recovery state.
- Production `useAppContext` consumers have been reduced from 40 to 3.
- No production UI reconstructs the full application state for a bounded edit.
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

Status: nearly complete.

Completed boundaries:

- stable actions and infrastructure;
- typed bounded updater actions;
- Workout state;
- Nutrition state;
- Progress state;
- Profile state;
- Safety/Recovery state.

Current compatibility consumers:

- Home;
- auth startup redirect;
- onboarding client.

## Immediate next action

Close the compatibility-context decision gate:

1. inspect the exact fields still read by Home, auth startup, and onboarding;
2. migrate Home by composing existing focused hooks where this does not create an unreadable subscription surface;
3. introduce a minimal startup/onboarding boundary only if `onboardingCompleted` and restore state cannot be represented cleanly through existing Profile and Infrastructure hooks;
4. preserve onboarding validation, mutations, redirects, restore ordering, persistence, sync, and UI;
5. add permanent source guards;
6. confirm whether compatibility `useAppContext` can then be removed from production exports or retained only as an internal migration adapter.

Phase 2 exit criteria:

- no broad production subscription remains without a documented reason;
- mixed readers compose focused hooks;
- action-only and status-only consumers avoid domain arrays;
- critical and outbox-bearing operations remain durable and ordered;
- persistence and synchronization contracts remain compatible.

# Phase 3 — persistence measurement and coalescing decision

Status: pending Phase 2 completion.

Before implementation:

- measure save frequency during set editing, nutrition editing, weight entry, and profile forms;
- identify which writes are local snapshot-only and which carry outbox semantics;
- record app-background and process-termination behavior.

Implement coalescing only if measurements show material redundant writes.

Required properties:

- immediate in-memory updates;
- latest-state coalescing around 300–500 ms only for eligible local writes;
- immediate flush for critical operations and lifecycle transitions;
- preserved mutation order, retry, recovery, observability, and outbox identity.

# Phase 4 — UI virtualization and render performance

Status: pending stable state and persistence boundaries.

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
