# List Performance Baseline and Decisions

Updated: 2026-08-01

Phase 4 used deterministic source-level fixtures and list-boundary audits. It does not claim physical-device frame timing or memory profiling.

## Representative fixture sizes

- 500 food entries
- 100 training programs
- 500 completed workout sessions
- 500 exercises
- 365 weight entries

Reusable fixtures live in `src/testing/listPerformanceFixtures.ts`. They provide stable unique IDs and deterministic grouping and sorting inputs without modifying production data.

## Implemented virtualized boundaries

### Nutrition Diary

Route: `src/app/(tabs)/nutrition.tsx`.

Decision and result:

- the previous `ScrollView` path could mount 500 `FoodEntryRow` components when all meal groups were expanded;
- meal grouping was reduced to one deterministic pass;
- the diary now uses one `SectionList`;
- collapsed meal sections expose empty data;
- expanded meal sections render through the virtualized row boundary;
- food-entry keys remain stable `entry.id` values;
- summary, date navigation, meal expansion, add/edit routes, keyboard behavior, accessibility, and fiber details remain intact.

### Workout Programs

Screen: `src/features/workouts/screens/WorkoutsScreen.tsx`.

Decision and result:

- the Programs tab previously mapped every program inside a vertical `ScrollView`;
- the representative fixture contains 100 programs;
- the Programs tab now uses `FlatList`, keyed by `program.id`;
- Start Now retains its bounded existing layout;
- add-program, favorites filtering, navigation, footer CTA, and modal behavior remain intact.

### Workout History

Screen: `src/features/workouts/screens/WorkoutHistoryScreen.tsx`.

Decision and result:

- the previous history path mapped all filtered sessions inside a `ScrollView`;
- the representative fixture contains 500 completed sessions;
- history now uses `FlatList`, keyed by `session.id`;
- route header, summary, filters, empty states, safety metadata, metrics, navigation, and accessibility remain intact.

### Exercise Library

Route: `src/app/workouts/exercise-library.tsx`.

Browser boundary: `src/components/workouts/VirtualizedExerciseLibraryBrowser.tsx`.

Decision and result:

- favorites, recent, and browse sections previously mapped rows inside one outer `ScrollView`;
- the representative fixture contains 500 exercises;
- the browser now uses one `SectionList`, keyed by stable exercise IDs;
- repeated linear membership lookups were replaced with memoized maps and sets;
- search, facets, favorites, recents, custom exercise creation, detail sheet, add/delete, and favorite persistence behavior remain intact.

## Secondary-surface audit

No additional virtualization was justified in the current source state:

- local food search results are capped at 18 rows;
- recent foods are capped at 20 unique rows;
- Progress renders bounded analytics, chart points, and a three-item measurement preview rather than all 365 weight entries;
- only one saved meal template can be expanded at a time;
- food picker modes are bounded collections embedded in a keyboard-sensitive form flow.

These surfaces require new representative measurements before future virtualization. A generic rewrite of all `ScrollView` usage is not justified.

## Permanent guards

`test/list-virtualization-guards.test.ts` prevents regressions in:

- Nutrition Diary `SectionList` and stable food-entry keys;
- Programs `FlatList` and stable program keys;
- Workout History `FlatList` and stable session keys;
- Exercise Library `SectionList` and stable exercise keys;
- bounded food-search, recent-food, and Progress preview limits.

## Final decision

Phase 4 is complete at the source and deterministic-regression level.

No persistence, synchronization, route, native configuration, backend, OTA, deployment, or production data behavior was changed. Physical-device frame timing, memory profiling, and interaction validation remain external release evidence rather than blockers for this refactor phase.
