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
- workout-template detail loading/not-found states, menu, favourite toggle, deletion confirmation, pluralized set counts, accessibility and start action.

### Progress

Completed primary Progress, Weight Details, 30-day trend, chart states, recent weigh-ins, selected `kg/lb` and the link to localized Workout History.

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

### Secondary Workouts — program and routine details

Immediate linked slice after workout-template detail:

- `src/features/workouts/screens/ProgramDetailScreen.tsx`;
- routine creation/editor routes reached from the program detail screen;
- directly required typed copy modules and source-contract tests.

Confirmed remaining issues include:

- hard-coded loading/not-found, menu, favourite, delete, unavailable-workout and saved-toast copy;
- direct English exercise/workout counts;
- hard-coded accessibility boundaries and uppercase presentation controls;
- user-facing built-in program/workout titles bypassing stable-ID localization;
- remaining builder, picker, preview and discard-confirmation copy outside the localization boundary.

Must preserve:

- program IDs, workout-template IDs, day IDs and schedule ordering;
- custom vs built-in program behavior;
- favourite, delete and remove-from-program actions;
- routine creation navigation and saved-workout return state;
- training-program persistence and revisioned sync contracts;
- completed workout history.

## Remaining source work

### Secondary Workouts after program/routine details

Audit/localize remaining workout-template builders, workout picker/editor modals, preview/discard surfaces and remaining Safety gate/session-preview copy.

### Secondary Progress

Audit/localize measurement details, exercise-progress details, workout-volume details and other secondary analytics outside established locale/unit boundaries.

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
