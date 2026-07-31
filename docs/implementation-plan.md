# Smart Fitness Active Refactor Roadmap

Updated: 2026-08-01

Canonical active plan for `hon4olo/smart-fitness-app`. Backend work is included only when a mobile change requires a new server contract.

Completed implementation history belongs in merged PRs and Git history. This file tracks only active work, constraints, external blockers, and the next bounded slices.

## Current verified baseline

Mobile:

- current base for the navigation slice: `5329e992374376c0b381e14d4c19b3ff103aae2b`;
- Expo SDK 56, React Native, Expo Router, TypeScript;
- offline-first repository persistence;
- ordered observable mutation queue;
- revision-aware synchronization for supported domains;
- `react-native-svg` already installed;
- blocking Mobile CI covers line audits, TypeScript, Coach/sync contracts, full regression, Expo export, and Expo Doctor.

Backend:

- verified `main`: `3f6c907efcfa503bd4beaf12b072c4e5b4573362`;
- no backend change is required for the current cleanup slices.

## Invariants

- Preserve IDs, persisted schemas, canonical units, authentication, revisions, idempotency, conflicts, completed history, and explicit Coach confirmations unless a bounded task explicitly changes them.
- Keep legacy routes only where compatibility requires them; application code must use canonical routes.
- Do not apply a generic debounce to outbox-bearing mutations.
- Do not add a state or chart library without measured need.
- Keep hand-written source files at or below 500 physical lines.
- Do not publish OTA, build/install native binaries, deploy backend changes, activate environments, or change credentials without explicit authorization.
- Use small PRs and merge only an exact green head.

# Phase 1 — cleanup and preparation

Status: in progress.

## 1. Repository and roadmap cleanup

Completed in mobile PR #291, merge `5329e992374376c0b381e14d4c19b3ff103aae2b`:

- [x] replace the stale completion-history roadmap with this active plan;
- [x] remove tracked `repomix-output.xml`;
- [x] remove tracked empty `connect.txt`;
- [x] ignore Repomix output, connection notes, coverage, and generic logs;
- [x] pass full Mobile CI on the exact merged head.

## 2. Legacy tab routes

Compatibility routes:

- `/labs` → Progress;
- `/track` → Workouts;
- `/eat` → Nutrition.

Current navigation slice:

- [x] verify the aliases originated from the former Labs/Track/Eat information architecture;
- [x] identify internal Home usage of `/track`;
- [x] fix Home Start Workout to use canonical Workouts navigation;
- [x] fix Home Add Food to use canonical Nutrition navigation;
- [x] replace screen re-exports with explicit compatibility redirects;
- [x] retain hidden tab registrations for old deep links and cached navigation state;
- [x] add a contract test preventing internal legacy-route reuse;
- [ ] pass full Mobile CI and merge PR #292 on its exact green head.

`src/app/(tabs)/coach.tsx` is a real public screen and is not part of legacy-route cleanup.

## 3. Empty-state consolidation

Audit targets:

- `EmptyNutritionState.tsx`;
- `NutritionEmptyState.tsx`;
- `EmptyWorkoutState.tsx`;
- `EmptyProgressState.tsx`;
- shared `EmptyState.tsx`.

Tasks:

- [ ] remove wrappers that only forward props;
- [ ] retain domain wrappers only when they own stable localization, actions, accessibility semantics, or a feature API boundary;
- [ ] keep domain-specific conditionals out of the shared component;
- [ ] update imports and focused tests.

## 4. Cloud-module inventory

`src/cloud/` is not presumed dead. Active authentication, synchronization, recovery, and outbox behavior depend on parts of it.

Tasks:

- [ ] classify modules as production-used, feature-gated, test-only, duplicate, or unreachable;
- [ ] remove only code with no import, runtime, persisted-compatibility, or test responsibility;
- [ ] isolate future-only code behind an explicit boundary;
- [ ] preserve revision, cursor, conflict, recovery, and idempotency semantics.

## 5. Placeholder timestamps

Tasks:

- [ ] inventory sentinel timestamps such as `2000-01-01T00:00:00.000Z`;
- [ ] classify each as unknown date, bundled data, migration fallback, or sort key;
- [ ] replace ambiguous sentinels with nullable dates, source metadata, or stable sort order;
- [ ] add persisted-state migration when the serialized contract changes;
- [ ] never substitute current time during hydration.

### Phase 1 exit criteria

- temporary artifacts are untracked and ignored;
- legacy routes are explicit compatibility redirects only;
- duplicate presentation wrappers are reduced without semantic loss;
- no active sync/recovery path is removed;
- persisted data remains readable;
- full Mobile CI is green for every slice.

# Phase 2 — state and persistence architecture

Status: pending Phase 1.

The existing `AppContext` is already internally decomposed into infrastructure and domain action hooks. This phase narrows public subscriptions rather than rewriting the app from zero.

## 1. Domain subscription boundaries

Create focused state/action access for:

- workouts, sessions, programs, templates, exercises;
- food entries, targets, meal templates, Nutrition library;
- weight, measurements, progress analytics;
- profile, onboarding, goals, preferences;
- restore, persistence failure, authentication, synchronization status.

Tasks:

- [ ] separate state subscriptions from action access;
- [ ] expose focused hooks instead of one application-wide value object;
- [ ] retain one internal orchestration boundary during migration;
- [ ] migrate consumers one domain at a time;
- [ ] add render-focused regression coverage where practical.

## 2. Pure selectors

- [ ] extract program, session, daily nutrition, weekly volume, weight trend, and personal-record selectors;
- [ ] accept minimum required state slices;
- [ ] keep time, locale, and unit boundaries explicit;
- [ ] cover legacy normalization and edge cases with unit tests.

## 3. Coalesced persistence

Required behavior:

- high-frequency local edits update memory immediately and coalesce the latest snapshot over roughly 300–500 ms;
- critical operations flush immediately;
- background/inactive lifecycle transitions flush pending local state;
- outbox steps preserve order, identity, observability, and retry behavior;
- domain operation compaction is allowed only through tested explicit rules.

Planned API:

- `scheduleLatestState`;
- `enqueueCriticalMutation`;
- `flush`;
- `cancelPending` where safe.

Critical examples:

- finish workout;
- destructive delete;
- onboarding completion;
- logout;
- synchronized full-state replacement;
- any required outbox mutation.

Tasks:

- [ ] specify queue semantics and failure behavior;
- [ ] add fake-timer coalescing/flush tests;
- [ ] add lifecycle flushing;
- [ ] preserve failure notices and retry controls;
- [ ] verify restart recovery and planner regeneration.

## 4. State-library decision gate

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

Representative fixtures:

- 500 food entries;
- 100 programs;
- 500 completed sessions;
- 500 exercises;
- 365 weight entries.

Measure render commits, first render, tab switching, long-list scrolling, restore/save duration, and authorized real-device memory behavior.

## Nutrition

- [ ] replace the outer diary `ScrollView` and unbounded entry maps with one `SectionList`;
- [ ] use meal sections and food rows as the virtualized data model;
- [ ] keep summary/week controls in `ListHeaderComponent`;
- [ ] keep details in `ListFooterComponent`;
- [ ] preserve collapse, editing, keyboard, accessibility, and scroll behavior;
- [ ] avoid nested vertical virtualized lists.

## Workouts and other growing lists

- [ ] virtualize the unbounded program list;
- [ ] retain simple rendering for tiny bounded suggested/recent collections unless profiling disproves it;
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

- [ ] replace the view-based bars with an SVG time-series chart;
- [ ] support 7/30/90-day ranges;
- [ ] preserve canonical kg storage and kg/lb presentation;
- [ ] handle zero/one-entry states;
- [ ] expose accessible min/max/current/selected summaries.

## Weekly workout volume

- [ ] implement a pure weekly-volume selector;
- [ ] define timezone and week-start behavior;
- [ ] include valid completed sets only;
- [ ] represent empty weeks consistently;
- [ ] display 8–12 weeks with UI-boundary unit conversion;
- [ ] test deloads, incomplete sets, missing values, legacy data, and timezone edges.

### Phase 4 exit criteria

- both charts use tested selectors;
- formatting remains centralized;
- accessibility summaries are useful;
- no chart framework is added without a documented capability gap.

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
2. [ ] Legacy-route compatibility and Home navigation repair — PR #292.
3. [ ] Empty-state consolidation.
4. [ ] Cloud inventory and confirmed dead-code removal.
5. [ ] Placeholder timestamp model and migrations where required.
6. [ ] Domain state/action subscription boundaries.
7. [ ] Pure selectors and consumer migration.
8. [ ] Coalesced persistence and lifecycle flush.
9. [ ] Nutrition `SectionList` migration.
10. [ ] Proven unbounded-list virtualization.
11. [ ] SVG weight trend.
12. [ ] Weekly workout-volume selector and SVG chart.

# Validation policy

Every code-bearing mobile slice requires:

- focused tests;
- `npx tsc --noEmit`;
- `npm test`;
- blocking Mobile CI, including line audits, Expo export, and Expo Doctor;
- review-thread inspection;
- merge of the exact green head only.

# Immediate next action

Finish validation and merge of PR #292. Then consolidate pure empty-state wrappers in a separate bounded PR.
