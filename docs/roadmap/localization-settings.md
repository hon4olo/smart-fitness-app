# Localization and Settings Roadmap

Updated: 2026-07-30

## Localization and regional formatting

Goal: make English and Russian first-class product languages across every reachable production surface while keeping persisted values, API identifiers, sync schemas, user-created names and canonical health/fitness units stable.

## Shared foundations

Completed:

- System, English and Russian language selection with persisted preference;
- immediate language application without restart;
- centralized locale-aware date and number formatting;
- deterministic English/Russian one/few/many/other pluralization;
- weight, length and energy display-unit preferences;
- canonical persistence in `kg`, `cm` and `kcal`;
- English fallback and EN/RU catalog parity checks;
- Account & Security entry and flows inside dedicated Settings;
- pre-provider root recovery localization;
- password-reset source flow localization;
- privacy-safe local storage/API diagnostics without raw payloads, tokens, email addresses or health values.

Stable internal data remains untranslated: routes, IDs, enum values, sync fields, provider/database identifiers, user-created names and canonical measurement values.

## Completed production surfaces

### Account, Home and Settings

Completed root navigation, Home summaries, onboarding, authentication, sessions/devices, password/account flows, Settings, Account & Security, Privacy, About, Data & Sync, Profile preferences and production hiding of developer/OTA diagnostics.

### Nutrition diary and food flows

Completed:

- main diary, selected-day navigation, seven-day strip and full calendar;
- streak, macro headers, meal groups, counts, Nutrition details and fibre;
- Add Food search, recent foods, favourites, My foods and saved meals;
- custom food, portion editor and barcode/manual-product flows;
- safe provider/search/scanner errors;
- selected `kcal/kJ` presentation.

### Workouts core flows

Completed:

- Workouts hub and program-creation entry;
- active session, set table, RPE, cancellation, finish and summary;
- Exercise Library, filters, favourites, recently used and custom exercise;
- exercise detail sheet;
- Workout History list/edit/delete;
- selected `kg/lb` with conversion back to canonical kilograms on edit;
- workout-template detail loading/not-found states, menu, favourite toggle, deletion confirmation, pluralized set counts, accessibility and start action;
- program detail loading/not-found states, stable-ID titles, favourite/delete/remove actions, unavailable-template handling, pluralized exercise counts and saved toast;
- linked new-routine builder, exercise picker/action menu, selected `kg/lb` labels and localized accessibility;
- program builder, reusable-workout picker, workout editor, builder card and exercise-row controls;
- localized discard interception, stable-ID workout titles, count-dependent picker actions and builder accessibility states;
- session-header metrics using selected `kg/lb` and locale-aware numbers;
- collapsed exercise previews with localized repetitions, selected units and Add Set controls;
- semantic set-input, RPE and completion accessibility states;
- display-only localization for empty and built-in workout titles without changing persisted draft values.

Program/routine details merged in PR #228. Builder/picker/editor localization merged in PR #229. Session-preview boundaries merged in PR #230.

### Progress

Completed:

- primary Progress and Weight Details copy, dates, chart states and recent weigh-ins;
- selected `kg/lb` on weight summaries and Weight Details;
- locale-aware body-measurement labels, entry validation and selected `cm/in` previews;
- Safety & Recovery history and weekly-trend cards;
- central locale formatting for Progress chart bounds, midpoint and body-fat values;
- selected `kg/lb` workout-volume summaries converted from canonical kilogram volume;
- selected units in Progress and Weight Details chart latest-value presentation;
- Exercise Detail tabs, loading/error/empty states, history and progress metrics in EN/RU;
- selected `kg/lb`, locale-aware dates/counts and volume-trend values on Exercise Detail;
- bounded Exercise Detail errors and removal of raw provider/source/media diagnostics from user presentation.

The first Secondary Progress analytics-formatting slice merged in PR #231. Exercise Detail progress localization is implemented in PR #232 with source-contract coverage and must merge only from an exact-green Mobile CI head.

### Coach history and trust

Completed immutable run history/detail, trust states, provenance, Nutrition/Strength/Combined before-after summaries, deterministic rationale, privacy-safe input coverage and fail-closed metadata parsing.

### Safety and Recovery

Completed Recovery Check-In, User Limitations, typed enum display mappings, selected-locale dates, Safety & Recovery preflight/review, deterministic readiness gates, restrictions, findings, load recommendations and bounded errors.

### Combined Coach

Completed:

- read-only Combined Review with child Strength/Nutrition/Safety summaries;
- schema-v6 gate, polling, idempotency and `automaticApplication: false`;
- selected `kg/lb` and `kcal/kJ`;
- Combined Proposal with effective Safety-capped Strength;
- separate explicit Strength-template and Nutrition-target confirmations;
- revisioned writes, idempotency keys, fail-closed parsing and no automatic mutation.

### Nutrition Coach

Completed and merged in PR #224:

- account/capability/period states;
- deterministic Nutrition review and metrics;
- structured AI strategy preview;
- strategy confirmation alert and explicit `confirmRun`;
- selected `kcal/kJ`, `kg/lb` and `g/kg` or `g/lb`;
- abort, polling, idempotency and post-confirmation sync;
- bounded capability, request, confirmation, rejection and issue presentation;
- full Mobile CI.

### Strength Coach

Completed and merged in PR #226:

- account/loading/capability and latest-workout states;
- deterministic review, next-workout proposal and structured Strength Strategy preview;
- localized metrics, mapped sets, guardrail states, rationale/caveat codes and confirmation alert;
- selected `kg/lb`, locale-aware dates/numbers and count-dependent copy;
- bounded request, confirmation, view-model, issue and provider-audit presentation;
- preserved abort, polling, idempotency, explicit `confirmRun`, post-confirmation sync and new-template-only application;
- full Mobile CI.

## Current next task

### Secondary Progress — final reachable-surface audit

After PR #232, run a repository-backed audit of remaining reachable Progress presentation, prioritizing:

- measurement-history or measurement-editor surfaces beyond the localized overview;
- exercise-progression and inactive-exercise summaries outside Exercise Detail;
- workout-volume details or filters beyond the localized overview;
- remaining secondary charts and accessibility descriptions.

The selected slice must remove directly rendered:

- direct `Intl`, `toLocaleString` or `toFixed` formatting;
- fixed `kg`, `cm` or English date/count presentation;
- hard-coded controls, empty/error states and accessibility labels;
- visible internal statuses or enum values;
- tests asserting literal English instead of semantic behavior.

Must preserve:

- measurement, workout-session and exercise IDs;
- canonical `kg`/`cm` persistence and conversion back from selected display units;
- chart ranges, aggregation and ordering;
- add/edit/delete, favorites, media, share and navigation contracts;
- sync schemas, revision behavior and completed workout history.

If no additional reachable Progress surface remains, advance directly to Remaining Coach rather than creating a no-op PR.

## Remaining source work

### Remaining Coach work

Verify standalone proposal/confirmation routes, stale/offline/retry states, remaining provider/backend messages and compensating-revert UX for Coach-applied changes.

### Repository-wide final pass

Remove remaining direct `Intl`/`toLocaleString`, fixed English accessibility labels, fixed `kg`/`cm`/`kcal` copy, visible internal enums/statuses and obsolete literal-English source tests.

## External validation still required

Requires user/device/provider/release access:

- physical iPhone EN/RU visual pass;
- Android build/layout validation;
- narrow/standard/wide devices;
- Dynamic Type and VoiceOver/TalkBack;
- focus, keyboard, touch targets, clipping and safe areas;
- appearance and unit matrices;
- second-device sync/conflicts and offline restart recovery;
- production password-reset email after provider configuration and deployment;
- OTA/native build, rollback and release-gate validation.

## Source and validation rules

For every localization slice:

- preserve business logic, persistence and sync/API contracts;
- use typed or bounded copy contracts;
- use central date, number and unit formatters;
- keep English fallback and EN/RU parity tests current;
- add source-contract tests preventing hard-coded controls, raw internal statuses, raw provider errors and unsafe formatting;
- require line audit, TypeScript, Coach/sync contracts, full regression suite, Expo export and Expo Doctor before merge;
- do not claim rendered layout/accessibility completion without device or screenshot validation.
