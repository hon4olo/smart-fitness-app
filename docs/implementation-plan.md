# Smart Fitness Active Refactor Roadmap

Updated: 2026-08-01

Canonical execution plan for `hon4olo/smart-fitness-app`. Completed implementation detail belongs in merged PRs and Git history. Backend work is included only when a mobile slice requires a server-contract change.

## Verified baseline

Mobile:

- current `main`: `a34c9f21c2577960dcbaed133c44d6873ab82963`;
- Expo SDK 56, React Native, Expo Router, TypeScript;
- offline-first repository persistence;
- ordered observable mutation queue;
- revision-aware synchronization for supported domains;
- focused action and infrastructure contexts now coexist with the compatibility `AppContext`;
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

Completed slices:

1. PR #291 — active roadmap, root artifact cleanup, and `.gitignore` hardening; merge `5329e992374376c0b381e14d4c19b3ff103aae2b`.
2. PR #292 — legacy route redirects and canonical Home navigation; merge `f5bd042282381f1e5cd36ad99a37ab6194051226`.
3. PR #293 — shared empty-state consolidation; merge `b2f8133fa530a00211be7ad3dea8a571f600e2b6`.
4. PR #294 — cloud-module classification and runtime reachability guard; merge `9489f2c4cd7208a7f31f01c088d95b682db836b7`.
5. PR #295 — bundled timestamp semantics without persistence migration; merge `bb7fcbd3dd9ccd0912ec2f172f51d12dd492c503`.

Architecture notes:

- `docs/architecture/cloud-module-inventory.md`;
- `docs/architecture/placeholder-timestamp-inventory.md`.

Phase 1 conclusions:

- generated and local repository artifacts are removed and ignored;
- old tab names remain only as compatibility redirects;
- redundant empty-state wrappers are removed;
- all production cloud modules are active and protected from accidental orphaning;
- bundled timestamps have explicit semantics without serialized-data drift;
- every slice passed blocking Mobile CI.

# Phase 2 — state and persistence architecture

Status: in progress.

The application retains one orchestration, repository, queue, and synchronization boundary. Public React subscriptions are being narrowed incrementally instead of replacing the state architecture in one rewrite.

## Completed: initial public boundaries

PR #296, merge `a34c9f21c2577960dcbaed133c44d6873ab82963`:

- [x] inventory all 40 production `useAppContext` consumers with TypeScript AST;
- [x] identify high-frequency fields and broad full-state reconstruction;
- [x] define `AppActions` and `AppInfrastructure` types;
- [x] add memoized `AppActionsContext` and `AppInfrastructureContext` providers;
- [x] expose `useAppActions` and `useAppInfrastructure`;
- [x] retain `useAppContext` as a compatibility layer;
- [x] move registration and weight entry to the action context;
- [x] move Data Recovery to the infrastructure context;
- [x] add boundary regression coverage and architecture documentation;
- [x] pass full Mobile CI.

Inventory: `docs/architecture/app-context-consumer-inventory.md`.

## Next: remaining focused consumers

- [ ] move `resetOnboarding` in Settings to `useAppActions`;
- [ ] move restore-only Coach screens to `useAppInfrastructure`;
- [ ] move Workout Session Finish to the action and infrastructure hooks;
- [ ] add source guards so action-only and infrastructure-only consumers do not return to the compatibility context.

## Typed state updater actions

Four consumers currently read nearly every state slice only to create a new object for `replaceState`:

- `RecoveryCheckInScreen`;
- `UserLimitationScreen`;
- `ProgressPlanningSections`;
- `PersonalDetailsSettingsCard`.

Tasks:

- [ ] replace full-state reconstruction with typed domain updater actions;
- [ ] preserve the same ordered persistence path and synchronization semantics;
- [ ] remove broad state reads once each bounded updater is available;
- [ ] test each update against legacy persisted data.

## Domain state boundaries

Recommended order:

1. Workouts, sessions, programs, templates, and exercises.
2. Nutrition entries, targets, meal templates, and library data.
3. Weight history, measurements, and progress analytics.
4. Profile, onboarding, goals, and preferences.

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
- domain mutations do not broadly invalidate unrelated screens;
- full-state reconstruction is removed from bounded forms;
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

### Phase 3 exit criteria

- unbounded collections have one coherent virtualized scroll owner;
- no nested vertical virtualized-list warnings remain;
- large fixtures stay responsive;
- measured renders improve without visual or interaction regressions.

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
7. [ ] Remaining action and infrastructure consumers.
8. [ ] Typed domain updater actions.
9. [ ] Workout domain state boundary.
10. [ ] Nutrition, Progress, and Profile state boundaries.
11. [ ] Pure selectors and consumer migration.
12. [ ] Coalesced persistence and lifecycle flush.
13. [ ] Nutrition `SectionList` migration.
14. [ ] Proven unbounded-list virtualization.
15. [ ] SVG weight trend.
16. [ ] Weekly workout-volume selector and SVG chart.

# Validation policy

Every code-bearing mobile slice requires focused tests, `npx tsc --noEmit`, `npm test`, blocking Mobile CI, review-thread inspection, and merge of the exact green head only.

# Immediate next action

Migrate the remaining action-only and infrastructure-only consumers in a separate bounded PR, then introduce typed state updater actions for the four broad snapshot consumers.
