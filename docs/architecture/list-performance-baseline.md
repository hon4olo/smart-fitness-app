# List Performance Baseline

Updated: 2026-08-01

This note starts Phase 4 with deterministic fixture sizes and source-level inventory. It does not claim physical-device frame timing or memory measurements.

## Representative fixture sizes

- 500 food entries
- 100 training programs
- 500 completed workout sessions
- 500 exercises
- 365 weight entries

The reusable test fixtures live in `src/testing/listPerformanceFixtures.ts`. They provide stable unique IDs, deterministic group keys, and deterministic sort values without modifying production data or runtime behavior.

## Nutrition diary

Current route: `src/app/(tabs)/nutrition.tsx`.

Current primitive: one vertical `ScrollView`.

Verified rendering behavior:

- all four meal groups are mapped inside the ScrollView;
- each expanded meal maps every entry directly to a `FoodEntryRow`;
- there is no `FlatList` or `SectionList` boundary on the diary screen;
- food-entry keys use stable `entry.id` values;
- date navigation, summary cards, meal expansion, keyboard behavior, accessibility labels, and routing share the same screen layout.

Deterministic 500-entry result:

| Expanded groups | Mounted food-entry rows |
| --- | ---: |
| None | 0 |
| One evenly populated meal | 125 |
| All four meals | 500 |

The meal summary path is now a pure single-pass grouping model instead of filtering the selected-date array once per meal type. Nutrition subtotals and stable meal ordering remain unchanged.

Decision:

- there is a concrete row-materialization risk when a large day is expanded;
- the selector/grouping path itself is bounded and deterministic after the single-pass extraction;
- a `SectionList` implementation is now justified for the row-rendering boundary, but must preserve the existing summary header, meal expansion, keyboard behavior, accessibility, date navigation, and routes;
- virtualization should be a separate bounded PR, not combined with other list surfaces.

## Remaining surfaces

Inventory and measure before implementation:

- Programs with 100 programs;
- Workout history with 500 completed sessions;
- Exercise Library with 500 exercises;
- weight history with 365 entries;
- food search, templates, and saved items where representative data can materialize many rows.

## Decision rules

A surface is eligible for implementation work only when source or deterministic measurements show at least one of:

- all dataset rows mount at once;
- repeated sorting/grouping occurs on unrelated renders;
- unstable keys or callbacks invalidate row memoization;
- nested scrolling creates a measurable rendering or interaction problem;
- representative fixtures expose a material selector or transformation cost.

No persistence, synchronization, native configuration, or production dataset is changed by this baseline.
