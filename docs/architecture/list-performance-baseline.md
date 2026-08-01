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

## First verified surface: Nutrition diary

Current route: `src/app/(tabs)/nutrition.tsx`.

Current primitive: one vertical `ScrollView`.

Current rendering behavior:

- all four meal groups are mapped inside the ScrollView;
- expanded meal entries are rendered below their meal group;
- there is no `FlatList` or `SectionList` boundary on the diary screen;
- date navigation, summary cards, meal expansion, keyboard behavior, accessibility labels, and routing are coupled to the same screen layout.

Initial classification:

- material risk exists only when a selected day contains many rendered entries;
- the screen should not be converted blindly because the summary/header content and expandable meal sections must remain intact;
- the next bounded slice should measure the derived day-summary/grouping path with 500 entries and inventory the `MealGroup` entry renderer;
- `SectionList` is a candidate, not yet an approved implementation.

## Decision rules

A surface is eligible for implementation work only when source or deterministic measurements show at least one of:

- all dataset rows mount at once;
- repeated sorting/grouping occurs on unrelated renders;
- unstable keys or callbacks invalidate row memoization;
- nested scrolling creates a measurable rendering or interaction problem;
- representative fixtures expose a material selector or transformation cost.

No UI component, navigation behavior, persistence behavior, or production dataset is changed by this baseline.
