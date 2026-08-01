# Smart Fitness Active Refactor Roadmap

Updated: 2026-08-01

Canonical execution plan for `hon4olo/smart-fitness-app`. Completed implementation history stays in merged PRs and Git history. Backend work is included only when a mobile slice requires a server-contract change.

## Verified baseline

Mobile:

- current `main`: `bb7fcbd3dd9ccd0912ec2f172f51d12dd492c503`;
- Expo SDK 56, React Native, Expo Router, TypeScript;
- offline-first repository persistence;
- ordered observable mutation queue;
- revision-aware synchronization for supported domains;
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

## Completed slices

- [x] PR #291 — active roadmap, root artifact cleanup, and `.gitignore` hardening; merge `5329e992374376c0b381e14d4c19b3ff103aae2b`.
- [x] PR #292 — legacy tab compatibility redirects and canonical Home navigation; merge `f5bd042282381f1e5cd36ad99a37ab6194051226`.
- [x] PR #293 — shared empty-state consolidation; merge `b2f8133fa530a00211be7ad3dea8a571f600e2b6`.
- [x] PR #294 — cloud-module classification and runtime reachability guard; merge `9489f2c4cd7208a7f31f01c088d95b682db836b7`.
- [x] PR #295 — bundled timestamp semantics without persistence migration; merge `bb7fcbd3dd9ccd0912ec2f172f51d12dd492c503`.

Architecture notes:

- `docs/architecture/cloud-module-inventory.md`;
- `docs/architecture/placeholder-timestamp-inventory.md`.

Phase 1 conclusions:

- temporary repository artifacts are removed and ignored;
- legacy routes are compatibility redirects only;
- redundant empty-state wrappers are removed;
- all production cloud modules are active and protected from accidental orphaning;
- bundled timestamps have explicit semantics without serialized-data drift;
- every slice passed blocking Mobile CI.

# Phase 2 — state and persistence architecture

Status: in progress.

The existing `AppContext` is already internally decomposed into infrastructure and domain action hooks. Phase 2 narrows public subscriptions incrementally while retaining one orchestration and persistence boundary.

## 2.1 Public context boundaries

Current PR #296:

- [x] inventory all 40 `useAppContext` consumers with TypeScript AST;
- [x] identify the highest-frequency subscriptions and broad snapshot reconstruction;
- [x] define `AppActions` and `AppInfrastructure` boundaries;
- [x] add stable `useAppActions` and `useAppInfrastructure` hooks;
- [x] retain `useAppContext` as a compatibility layer during migration;
- [x] move registration and weight entry to the action context;
- [x] move Data Recovery to the infrastructure context;
- [x] add boundary regression coverage and architecture documentation;
- [ ] pass full Mobile CI and squash-merge the exact green head.

Inventory: `docs/architecture/app-context-consumer-inventory.md`.

Next bounded slices:

- [ ] migrate remaining action-only consumers;
- [ ] migrate remaining infrastructure-only consumers;
- [ ] replace four full-state reconstruction consumers with typed updater actions;
- [ ] extract Workout state as the first complete domain subscription boundary;
- [ ] extract Nutrition, Progress, and Profile boundaries;
- [ ] retire the compatibility context only after production consumers are migrated.

## 2.2 Pure selectors

- [ ] extract program, session, daily Nutrition, weekly volume, weight-trend, and personal-record selectors;
- [ ] accept only the minimum required state slices;
- [ ] keep time, locale, and unit boundaries explicit;
- [ ] cover legacy normalization and edge cases with unit tests.

## 2.3 Coalesced persistence

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

## 2.4 State-library decision gate

- [ ] profile focused contexts before considering an external store;
- [ ] consider Zustand only if broad subscriptions remain materially expensive;
- [ ] do not adopt Zustand or Jotai as an unmeasured cleanup exercise.

### Phase 2 exit criteria

- domain mutations do not broadly invalidate unrelated consumers;
- action-only consumers do not subscribe to state arrays;
- repeated form edits do not persist a full snapshot per keystroke;
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
2. [x] Legacy-route compatibility and Home navigation repair — PR #292.
3. [x] Empty-state consolidation — PR #293.
4. [x] Cloud inventory and reachability guard — PR #294.
5. [x] Bundled timestamp semantics — PR #295.
6. [ ] Initial AppActions and AppInfrastructure boundaries — PR #296.
7. [ ] Remaining action/infrastructure migration and typed state updaters.
8. [ ] Workout domain subscription boundary.
9. [ ] Nutrition, Progress, and Profile boundaries.
10. [ ] Pure selectors and consumer migration.
11. [ ] Coalesced persistence and lifecycle flush.
12. [ ] Nutrition `SectionList` migration.
13. [ ] Proven unbounded-list virtualization.
14. [ ] SVG weight trend.
15. [ ] Weekly workout-volume selector and SVG chart.

# Validation policy

Every code-bearing mobile slice requires focused tests, `npx tsc --noEmit`, `npm test`, blocking Mobile CI, review-thread inspection, and merge of the exact green head only.

# Immediate next action

Finish validation and squash-merge PR #296. Then migrate the remaining action-only and infrastructure-only consumers in a separate bounded PR.
