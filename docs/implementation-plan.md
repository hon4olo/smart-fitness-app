# Smart Fitness Active Refactor Roadmap

Updated: 2026-08-01

This is the canonical active execution plan for:

- `hon4olo/smart-fitness-app`;
- `hon4olo/smart-fitness-backend` where a mobile change requires a backend contract change.

Completed historical implementation detail belongs in Git history and merged PRs, not in this active roadmap. This document contains only the current baseline, approved refactor scope, external blockers, and the next executable slices.

## Verified baseline

Mobile baseline:

- `main`: `9be1c0d3d547a1468b1da516e84869cac87d5063`;
- no open mobile pull requests at the start of this roadmap;
- Expo SDK 56, React Native, Expo Router, TypeScript;
- offline-first application state persisted through the existing repository boundary;
- ordered observable mutation queue with explicit local-persistence and outbox stages;
- revision-aware synchronization for the currently supported domains;
- `react-native-svg` is already installed;
- weight progress already has a basic non-SVG chart;
- source CI, line-size audits, TypeScript, tests, Expo export, and Expo Doctor remain blocking.

Backend baseline:

- `main`: `3f6c907efcfa503bd4beaf12b072c4e5b4573362`;
- no open backend pull requests at the start of this roadmap;
- no backend work is required for the initial cleanup and mobile performance slices.

## Non-negotiable invariants

- Preserve routes, IDs, persisted schemas, canonical units, authentication, synchronization revisions, idempotency, conflict handling, completed history, and explicit Coach confirmations unless a bounded task explicitly changes them.
- Do not introduce a second backend, direct provider calls from mobile, or a new state library without measured justification.
- Do not apply a generic debounce around outbox-bearing mutations.
- Do not publish OTA, create native builds, install on devices, deploy backend changes, activate staging or production, or change credentials without explicit authorization.
- Keep every hand-written source file at or below 500 physical lines.
- Use small branches and merge only an exact green head.

# Phase 1 — cleanup and preparation

Status: in progress.

## 1.1 Baseline and inventory

- [x] verify exact mobile and backend `main`;
- [x] verify open pull requests;
- [x] inspect `AGENTS.md`, `PROJECT_LEARNINGS.md`, and this roadmap;
- [ ] record the current full validation result for the first code-bearing slice;
- [ ] inventory all internal links, deep links, tests, and compatibility consumers before removing legacy routes.

## 1.2 Repository-root cleanup

- [ ] remove tracked `repomix-output.xml`;
- [ ] remove tracked empty `connect.txt`;
- [ ] ignore generated Repomix outputs, local connection notes, coverage output, and generic log files;
- [ ] confirm no CI or documentation step depends on either removed file.

## 1.3 Legacy Expo Router aliases

Candidates:

- `src/app/(tabs)/labs.tsx`;
- `src/app/(tabs)/track.tsx`;
- `src/app/(tabs)/eat.tsx`.

Rules:

- `src/app/(tabs)/coach.tsx` is a real screen and must not be removed;
- remove an alias only after repository links, saved navigation state, deep-link compatibility, tests, and older supported clients are checked;
- use an explicit compatibility redirect instead of silent deletion when an old route must remain supported.

Tasks:

- [ ] inventory alias consumers;
- [ ] remove unused aliases or replace required aliases with documented redirects;
- [ ] remove obsolete hidden tab registrations after the route decision;
- [ ] run navigation and typed-route validation.

## 1.4 Empty-state consolidation

Audit:

- `EmptyNutritionState.tsx`;
- `NutritionEmptyState.tsx`;
- `EmptyWorkoutState.tsx`;
- `EmptyProgressState.tsx`;
- the shared `EmptyState.tsx`.

Tasks:

- [ ] remove wrappers that only forward props;
- [ ] retain a domain wrapper only when it owns stable localization, domain actions, accessibility semantics, or feature-level API boundaries;
- [ ] prevent a single global component from accumulating domain-specific conditionals;
- [ ] update imports and focused tests.

## 1.5 Cloud and synchronization inventory

`src/cloud/` is not presumed dead. Current authentication, synchronization, queue recovery, and outbox behavior depend on parts of it.

Tasks:

- [ ] classify every cloud module as production-used, feature-gated, test-only, duplicate, or unreachable;
- [ ] remove only modules with no imports, runtime registration, persisted compatibility role, or test responsibility;
- [ ] isolate future-only code behind a clear boundary instead of mixing it with active runtime code;
- [ ] preserve current recovery, revision, cursor, conflict, and idempotency semantics.

## 1.6 Sentinel and placeholder timestamps

Tasks:

- [ ] inventory hardcoded placeholder timestamps such as `2000-01-01T00:00:00.000Z`;
- [ ] classify each occurrence as unknown date, bundled data, migration fallback, or deterministic sort key;
- [ ] replace ambiguous timestamps with explicit metadata such as nullable dates, source fields, or stable sort order;
- [ ] add a persisted-state migration when the serialized contract changes;
- [ ] never replace a stable placeholder with current time during hydration.

### Phase 1 acceptance

- tracked temporary artifacts are gone;
- route compatibility is explicitly preserved or intentionally retired;
- duplicate presentation wrappers are reduced without losing domain semantics;
- no active sync or recovery path is removed;
- persisted data remains readable;
- full blocking CI is green.

# Phase 2 — state and persistence architecture

Status: pending Phase 1.

The existing `AppContext` is already partially decomposed internally into infrastructure and domain action hooks. This phase completes the public subscription boundary instead of rewriting the application from zero.

## 2.1 Domain boundaries

Introduce bounded state and action access for:

- workouts, sessions, programs, templates, and exercises;
- nutrition entries, targets, meal templates, and library data;
- weight history, body measurements, and progress selectors;
- profile, onboarding, goals, and user preferences;
- infrastructure status, restore state, mutation failures, authentication, and synchronization.

Tasks:

- [ ] separate state subscriptions from action access;
- [ ] expose focused hooks instead of one application-wide value object;
- [ ] retain one internal orchestration boundary while migration is in progress;
- [ ] migrate consumers one domain at a time;
- [ ] add render-focused regression coverage where practical.

## 2.2 Derived selectors

- [ ] extract pure selectors for workout summaries, recent sessions, program summaries, daily nutrition, weekly volume, weight trends, and personal records;
- [ ] accept only the minimum required state slice;
- [ ] keep date, locale, and unit conversion at explicit boundaries;
- [ ] unit-test selector edge cases and legacy data normalization.

## 2.3 Coalesced local persistence

The current ordered mutation queue must remain authoritative.

Required behavior:

- ordinary high-frequency local edits update memory immediately and coalesce the latest pending snapshot over approximately 300–500 ms;
- critical mutations flush immediately;
- lifecycle transitions flush pending local state;
- outbox operations retain explicit order and retry identity;
- create/update/delete compaction is allowed only through a tested domain-specific algorithm.

Planned queue API:

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
- any mutation carrying a required outbox step.

Tasks:

- [ ] specify queue semantics and failure behavior before implementation;
- [ ] add fake-timer tests for coalescing and flush;
- [ ] add background/inactive lifecycle flushing;
- [ ] preserve retry controls and observable failure state;
- [ ] verify restart recovery and planner-based regeneration remain intact.

## 2.4 State-library decision gate

- [ ] profile the domain-context result before considering Zustand;
- [ ] adopt an external store only if render counts, cross-domain subscriptions, or provider composition remain materially problematic;
- [ ] do not migrate to Jotai or Zustand as an unmeasured cleanup exercise.

### Phase 2 acceptance

- a nutrition mutation does not broadly invalidate workout and progress consumers;
- action-only consumers do not subscribe to unrelated state arrays;
- repeated form edits do not enqueue a full persistence write per keystroke;
- critical and outbox-bearing operations remain durable, ordered, observable, and retryable;
- existing persisted state and synchronization contracts remain compatible.

# Phase 3 — UI virtualization and render performance

Status: pending Phase 2 subscription boundaries.

## 3.1 Performance baseline

Use representative large local fixtures:

- 500 food entries;
- 100 training programs;
- 500 completed workout sessions;
- 500 exercises;
- 365 weight entries.

Measure:

- render commits;
- first meaningful screen render;
- tab-switch responsiveness;
- long-list scroll stability;
- local-state restore and save duration;
- memory behavior on a real supported iPhone when device validation is authorized.

## 3.2 Nutrition

Current structure has one outer `ScrollView`, four meal groups, and potentially unbounded food-entry maps.

Target:

- [ ] use one `SectionList` for meal sections and food entries;
- [ ] keep summary and week controls in `ListHeaderComponent`;
- [ ] keep details in `ListFooterComponent`;
- [ ] represent collapsed meals with empty section data;
- [ ] preserve expansion, editing, keyboard, accessibility, and scroll behavior;
- [ ] avoid nested vertical virtualized lists.

## 3.3 Workouts

Current suggested and recent collections are bounded; the program collection is not.

Target:

- [ ] virtualize the program list;
- [ ] retain simple rendering for tiny bounded collections unless profiling proves otherwise;
- [ ] evaluate exercise library, workout history, food search, templates, and saved-item screens by actual collection growth;
- [ ] preserve sticky footer, active-session resume, navigation, and exact existing interaction logic.

## 3.4 Row stability

- [ ] memoize only proven hot row components;
- [ ] use stable callbacks and `keyExtractor` values;
- [ ] use `getItemLayout` only where row dimensions are truly fixed;
- [ ] pass minimal row props rather than full domain state;
- [ ] prevent nested-list warnings and scroll-position regressions.

### Phase 3 acceptance

- unbounded collections are virtualized through one coherent scroll owner;
- no nested vertical virtualized-list warnings exist;
- large fixtures remain responsive;
- route transitions, expanded sections, sticky controls, and scroll restoration behave correctly;
- measured render counts improve without visual regressions.

# Phase 4 — progress charts

Status: pending stable selectors and performance boundaries.

No new chart dependency is approved by default. Use the installed `react-native-svg` unless requirements exceed it.

## 4.1 Weight trend

- [ ] replace the current view-based bar visualization with an SVG time-series chart;
- [ ] support 7-, 30-, and 90-day ranges;
- [ ] preserve kg/lb presentation from canonical kg storage;
- [ ] support zero/one-entry empty states;
- [ ] provide accessible min, max, current, and selected-point summaries;
- [ ] keep chart presentation separate from weight-domain selectors.

## 4.2 Weekly workout volume

- [ ] implement a pure weekly-volume selector;
- [ ] define timezone and week-start behavior explicitly;
- [ ] calculate canonical volume from valid completed sets only;
- [ ] represent weeks with no sessions consistently;
- [ ] display 8–12 weeks with kg/lb presentation conversion only at the UI boundary;
- [ ] cover deload weeks, incomplete sets, missing weight, malformed legacy data, and timezone edges.

### Phase 4 acceptance

- both charts derive from tested selectors;
- units and locale formatting remain centralized;
- the chart components expose useful accessibility summaries;
- no additional chart framework is added without a documented capability gap.

# External and deferred work

These items remain valid but are not part of the autonomous refactor sequence:

- fixed-SHA cross-repository release gate requiring authorized repository-token access;
- provider-neutral Coach staging credentials and model validation;
- matching native builds and physical release-device testing;
- offline termination/restart and second-device conflict matrices;
- accessibility and EN/RU/unit device matrices;
- explicit local-versus-account destructive conflict-choice contract;
- privacy, consent, identity, retention, deletion, and analytics requirements;
- SQLite consideration only after local-state size and restore/save measurements;
- OTA publication, native builds, device installation, backend deployment, staging activation, production activation, and credential changes.

# Planned pull-request sequence

1. Active roadmap rewrite, root artifact cleanup, and `.gitignore` hardening.
2. Legacy-route compatibility audit and bounded route cleanup.
3. Empty-state consolidation.
4. Cloud-module inventory and confirmed dead-code removal.
5. Placeholder timestamp model and migrations where required.
6. Domain state/action subscription boundaries.
7. Pure derived selectors and consumer migration.
8. Coalesced persistence with critical flush and lifecycle coverage.
9. Nutrition `SectionList` migration.
10. Workouts and other proven unbounded-list virtualization.
11. SVG weight trend.
12. Weekly workout-volume selector and SVG chart.

# Validation policy

For every code-bearing mobile slice:

- `npx tsc --noEmit`;
- `npm test`;
- relevant focused tests;
- full blocking Mobile CI, including source-size audits, Expo export, and Expo Doctor;
- inspect all review threads;
- merge only the exact green head.

Documentation-only and tracked-artifact cleanup still require repository CI before merge.

# Immediate next action

Complete PR 1: replace the stale historical implementation plan with this active roadmap, remove tracked root artifacts, harden `.gitignore`, and confirm CI before proceeding to route compatibility analysis.
