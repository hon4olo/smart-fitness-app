# Smart Fitness Active Refactor Roadmap

Updated: 2026-08-01

Canonical execution plan for `hon4olo/smart-fitness-app`. Completed implementation history stays in merged PRs and Git history. Backend work is included only when a mobile slice requires a server-contract change.

## Verified baseline

Mobile:

- current `main`: `9489f2c4cd7208a7f31f01c088d95b682db836b7`;
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

Status: final slice in progress.

## Completed

### PR #291 — roadmap and root artifacts

Merge: `5329e992374376c0b381e14d4c19b3ff103aae2b`.

- [x] replace the stale completion-history document with this active roadmap;
- [x] remove tracked `repomix-output.xml` and empty `connect.txt`;
- [x] ignore Repomix output, connection notes, coverage, and generic logs;
- [x] pass full Mobile CI.

### PR #292 — legacy route compatibility

Merge: `f5bd042282381f1e5cd36ad99a37ab6194051226`.

- [x] preserve `/labs`, `/track`, and `/eat` as explicit compatibility redirects;
- [x] route them to Progress, Workouts, and Nutrition;
- [x] replace internal Home usage with canonical routes;
- [x] fix Home Add Food opening Workouts through `/track`;
- [x] add a navigation regression guard and pass full Mobile CI.

`src/app/(tabs)/coach.tsx` is a real public screen and is not legacy code.

### PR #293 — empty-state consolidation

Merge: `b2f8133fa530a00211be7ad3dea8a571f600e2b6`.

- [x] remove two unused Nutrition empty-state files;
- [x] migrate Progress and workout consumers to shared `EmptyState`;
- [x] remove redundant Progress and Workout wrappers;
- [x] preserve compact presentation, copy, and actions;
- [x] add a duplicate-wrapper regression guard;
- [x] pass full Mobile CI.

### PR #294 — cloud module classification

Merge: `9489f2c4cd7208a7f31f01c088d95b682db836b7`.

- [x] inventory 79 TypeScript files under `src/cloud/`;
- [x] classify 45 production modules and 34 colocated tests;
- [x] verify all 45 production modules are runtime-reachable;
- [x] confirm zero orphaned or dead production cloud modules;
- [x] document runtime roots and module groups;
- [x] add a transitive reachability guard;
- [x] reject unsafe generic deletion of active synchronization infrastructure;
- [x] pass full Mobile CI.

Inventory: `docs/architecture/cloud-module-inventory.md`.

## Current slice — bundled timestamp semantics

PR #295:

- [x] inventory all fixed date literals in production source;
- [x] classify validation boundaries and UI examples as non-sentinel values;
- [x] identify `2000-01-01T00:00:00.000Z` as a bundled-content compatibility timestamp;
- [x] consolidate duplicate declarations into `BUNDLED_CONTENT_CREATED_AT`;
- [x] remove the unused domain timestamp export;
- [x] preserve the exact serialized value and model shape, avoiding a migration;
- [x] add a regression guard and architecture note;
- [ ] pass full Mobile CI and squash-merge the exact green head.

Inventory: `docs/architecture/placeholder-timestamp-inventory.md`.

### Phase 1 exit criteria

- temporary artifacts are untracked and ignored;
- legacy routes are compatibility redirects only;
- duplicate presentation wrappers are removed without semantic loss;
- synchronization modules are classified and protected from accidental orphaning;
- bundled timestamps have explicit semantics without persistence drift;
- every slice has green blocking Mobile CI.

# Phase 2 — state and persistence architecture

Status: next after PR #295.

The existing `AppContext` is already internally decomposed into infrastructure and domain action hooks. This phase narrows public subscriptions rather than rewriting the application from zero.

## 2.1 Domain subscription boundaries

- [ ] separate state subscriptions from action access;
- [ ] expose focused hooks for Workouts, Nutrition, Progress, Profile, and infrastructure;
- [ ] retain one internal orchestration boundary during migration;
- [ ] migrate consumers one domain at a time;
- [ ] add render-focused regression coverage where practical.

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

- [ ] profile domain contexts first;
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
5. [ ] Bundled timestamp semantics — PR #295.
6. [ ] Domain state/action subscription boundaries.
7. [ ] Pure selectors and consumer migration.
8. [ ] Coalesced persistence and lifecycle flush.
9. [ ] Nutrition `SectionList` migration.
10. [ ] Proven unbounded-list virtualization.
11. [ ] SVG weight trend.
12. [ ] Weekly workout-volume selector and SVG chart.

# Validation policy

Every code-bearing mobile slice requires focused tests, `npx tsc --noEmit`, `npm test`, blocking Mobile CI, review-thread inspection, and merge of the exact green head only.

# Immediate next action

Finish validation and squash-merge PR #295. Then start Phase 2 with a read-only consumer and render-subscription inventory before changing public state boundaries.
