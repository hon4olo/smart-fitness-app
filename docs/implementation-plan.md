# Smart Fitness Active Refactor Roadmap

Updated: 2026-08-01

Canonical execution plan for `hon4olo/smart-fitness-app`. Completed implementation detail belongs in merged PRs and Git history. Backend work is included only when a mobile slice requires a server-contract change.

## Verified baseline

Mobile:

- current `main`: `86b0c1d871be40bdcdb0d0463d4c2a9e219a44fb`;
- Expo SDK 56, React Native, Expo Router, TypeScript;
- offline-first repository persistence;
- ordered observable mutation queue;
- revision-aware synchronization for supported domains;
- stable `AppActions` and `AppInfrastructure` contexts coexist with the compatibility `AppContext`;
- all previously identified full-state reconstruction paths are removed from production UI;
- `react-native-svg` is installed;
- blocking Mobile CI covers line audits, TypeScript, Coach/sync contracts, full regression, Expo export, and Expo Doctor.

Backend:

- verified `main`: `3f6c907efcfa503bd4beaf12b072c4e5b4573362`;
- no backend change is required for the current refactor slices.

## Invariants

- Preserve IDs, persisted schemas, canonical units, authentication, revisions, idempotency, conflicts, completed history, and explicit Coach confirmations unless a bounded task explicitly changes them.
- Keep legacy routes only where compatibility requires them; application code uses canonical routes.
- Do not apply a generic debounce to outbox-bearing mutations.
- Do not add a state or chart library without measured need.
- Keep hand-written source files at or below 500 physical lines.
- Do not publish OTA, build or install native binaries, deploy backend changes, activate environments, or change credentials without explicit authorization.
- Use small PRs and merge only an exact green head.

# Phase 1 — cleanup and preparation

Status: complete.

1. PR #291 — active roadmap, root artifact cleanup, and `.gitignore` hardening; merge `5329e992374376c0b381e14d4c19b3ff103aae2b`.
2. PR #292 — legacy route redirects and canonical Home navigation; merge `f5bd042282381f1e5cd36ad99a37ab6194051226`.
3. PR #293 — shared empty-state consolidation; merge `b2f8133fa530a00211be7ad3dea8a571f600e2b6`.
4. PR #294 — cloud-module classification and runtime reachability guard; merge `9489f2c4cd7208a7f31f01c088d95b682db836b7`.
5. PR #295 — bundled timestamp semantics without persistence migration; merge `bb7fcbd3dd9ccd0912ec2f172f51d12dd492c503`.

Architecture notes:

- `docs/architecture/cloud-module-inventory.md`;
- `docs/architecture/placeholder-timestamp-inventory.md`.

# Phase 2 — state and persistence architecture

Status: in progress.

The application retains one internal state object, repository, mutation queue, and synchronization boundary. Public React subscriptions are narrowed incrementally; persistence and sync ownership are not being rewritten.

## Completed public-boundary work

### PR #296 — initial context boundaries

Merge: `a34c9f21c2577960dcbaed133c44d6873ab82963`.

- [x] inventory all 40 production `useAppContext` consumers;
- [x] define and provide stable `AppActions` and `AppInfrastructure` contexts;
- [x] retain `useAppContext` as a compatibility layer;
- [x] migrate registration, weight entry, and Data Recovery;
- [x] add source regression coverage.

### PR #298 — remaining focused consumers

Merge: `68640d686df93fb2bc0be907be3fc56564a0de5c`.

- [x] move Settings reset-onboarding to `useAppActions`;
- [x] move restore-only Nutrition Coach screens to `useAppInfrastructure`;
- [x] split Workout Session Finish between action and infrastructure hooks;
- [x] guard migrated files from returning to the compatibility context.

### PR #299 — Safety & Recovery updater actions

Merge: `03b8b671e19d5128a5399766e9ec0790766b5a62`.

- [x] add typed recovery check-in and user-limitation updater actions;
- [x] remove full `AppState` reconstruction from both Safety & Recovery forms;
- [x] preserve validation, ordered persistence, and subsequent synchronization;
- [x] use functional state updates to avoid stale-snapshot replacement.

### PR #300 — Profile updater actions

Merge: `86b0c1d871be40bdcdb0d0463d4c2a9e219a44fb`.

- [x] add typed Coach-profile and personal-details updater actions;
- [x] remove the final two full-state reconstruction paths;
- [x] preserve alerts, unit conversion, validation, and ordered persistence;
- [x] prove unrelated state slices retain identity in behavior tests.

Inventory: `docs/architecture/app-context-consumer-inventory.md`.

## Current target — Workout domain state boundary

Scope:

- workouts and templates;
- completed workout sessions;
- training programs;
- exercise catalogue and custom exercises;
- active restore status remains in `AppInfrastructure`;
- mutation functions remain in `AppActions` until a measured need justifies domain-specific action contexts.

Tasks:

- [ ] inventory exact Workout state consumers after PR #300;
- [ ] define a memoized `WorkoutState` value containing only Workout-domain arrays;
- [ ] expose `useWorkoutState` without changing the internal `AppState` object;
- [ ] migrate Workout screens and pure Workout-dependent cards incrementally;
- [ ] keep mixed Home, Coach, and Progress consumers on compatibility state until their required slices are explicitly separated;
- [ ] add source guards preventing migrated Workout consumers from returning to `useAppContext`;
- [ ] add render-focused tests where practical;
- [ ] pass full Mobile CI on each bounded migration slice.

Do not combine this with list virtualization, persistence coalescing, or a state-library migration.

## Later domain state boundaries

Recommended order after Workout:

1. Nutrition entries, targets, meal templates, and library data.
2. Weight history, measurements, and progress analytics.
3. Profile, onboarding, goals, and preferences.

Tasks:

- [ ] expose focused state hooks per domain;
- [ ] migrate consumers incrementally;
- [ ] retain one internal state object during migration;
- [ ] retire the compatibility context only after production consumers are migrated;
- [ ] measure render counts before considering an external store.

## Pure selectors

- [ ] extract program, session, daily Nutrition, weekly volume, weight-trend, and personal-record selectors;
- [ ] accept only the minimum required state slices;
- [ ] keep time, locale, and unit boundaries explicit;
- [ ] cover legacy normalization and edge cases with unit tests.

## Coalesced persistence

Required behavior:

- high-frequency local edits update memory immediately and coalesce the latest snapshot over roughly 300–500 ms;
- critical operations flush immediately;
- background and inactive lifecycle transitions flush pending local state;
- outbox steps preserve order, identity, observability, and retry behavior;
- operation compaction is allowed only through tested domain-specific rules.

Planned API:

- `scheduleLatestState`;
- `enqueueCriticalMutation`;
- `flush`;
- `cancelPending` where safe.

Critical examples:

- finishing a workout;
- destructive deletion;
- onboarding completion;
- logout;
- synchronized full-state replacement;
- any required outbox mutation.

Tasks:

- [ ] specify queue semantics and failure behavior;
- [ ] add fake-timer coalescing and flush tests;
- [ ] add lifecycle flushing;
- [ ] preserve failure notices and retry controls;
- [ ] verify restart recovery and planner regeneration.

## State-library decision gate

- [ ] profile focused contexts before considering an external store;
- [ ] consider Zustand only if broad subscriptions remain materially expensive;
- [ ] do not adopt Zustand or Jotai as an unmeasured cleanup exercise.

### Phase 2 exit criteria

- action-only and infrastructure-only consumers do not subscribe to domain arrays;
- full-state reconstruction is absent from bounded forms;
- domain mutations do not broadly invalidate unrelated screens;
- repeated local form edits do not persist a full snapshot per keystroke;
- critical and outbox-bearing operations remain durable and ordered;
- persisted and synchronization contracts remain compatible.

# Phase 3 — UI virtualization and render performance

Status: pending Phase 2 subscription boundaries.

## Performance baseline

Use representative fixtures: 500 food entries, 100 programs, 500 completed sessions, 500 exercises, and 365 weight entries.

Measure render commits, first render, tab switching, long-list scrolling, restore/save duration, and authorized real-device memory behavior.

## Nutrition

- [ ] replace the diary `ScrollView` and unbounded entry maps with one `SectionList`;
- [ ] use meal sections and food rows as the virtualized data model;
- [ ] keep summary and week controls in `ListHeaderComponent`;
- [ ] keep details in `ListFooterComponent`;
- [ ] preserve collapse, editing, keyboard, accessibility, and scroll behavior;
- [ ] avoid nested vertical virtualized lists.

## Workouts and other growing lists

- [ ] virtualize the unbounded program list;
- [ ] retain simple rendering for tiny bounded suggested and recent collections unless profiling disproves it;
- [ ] evaluate exercise library, history, food search, templates, and saved items by measured growth;
- [ ] preserve active-session resume, sticky controls, and navigation.

## Row stability

- [ ] memoize proven hot rows only;
- [ ] use stable callbacks and identity keys;
- [ ] use `getItemLayout` only for truly fixed dimensions;
- [ ] pass minimal props;
- [ ] prevent nested-list and scroll-restoration regressions.

# Phase 4 — progress charts

Status: pending stable selectors and performance boundaries.

Use installed `react-native-svg` by default.

## Weight trend

- [ ] replace view-based bars with an SVG time-series chart;
- [ ] support 7, 30, and 90-day ranges;
- [ ] preserve canonical kg storage and kg/lb presentation;
- [ ] handle zero and one-entry states;
- [ ] expose accessible min, max, current, and selected summaries.

## Weekly workout volume

- [ ] implement a pure weekly-volume selector;
- [ ] define timezone and week-start behavior;
- [ ] include valid completed sets only;
- [ ] represent empty weeks consistently;
- [ ] display 8–12 weeks with UI-boundary unit conversion;
- [ ] test deloads, incomplete sets, missing values, legacy data, and timezone edges.

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

# Pull-request sequence

1. [x] Active roadmap and root artifact cleanup — PR #291.
2. [x] Legacy route compatibility and Home navigation repair — PR #292.
3. [x] Empty-state consolidation — PR #293.
4. [x] Cloud inventory and reachability guard — PR #294.
5. [x] Bundled timestamp semantics — PR #295.
6. [x] Initial AppActions and AppInfrastructure boundaries — PR #296.
7. [x] Focused action/infrastructure consumer migration — PR #298.
8. [x] Safety & Recovery typed updater actions — PR #299.
9. [x] Profile typed updater actions — PR #300.
10. [ ] Workout domain state boundary.
11. [ ] Nutrition, Progress, and Profile state boundaries.
12. [ ] Pure selectors and consumer migration.
13. [ ] Coalesced persistence and lifecycle flush.
14. [ ] Nutrition `SectionList` migration.
15. [ ] Proven unbounded-list virtualization.
16. [ ] SVG weight trend.
17. [ ] Weekly workout-volume selector and SVG chart.

# Validation policy

Every code-bearing mobile slice requires focused tests, `npx tsc --noEmit`, `npm test`, blocking Mobile CI, review-thread inspection, and merge of the exact green head only.

# Immediate next action

Inventory exact Workout state consumers on current `main`, then introduce the smallest useful `WorkoutState` context and migrate a bounded first group without changing persistence or synchronization behavior.
