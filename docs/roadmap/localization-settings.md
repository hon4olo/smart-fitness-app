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

Secondary Progress analytics formatting merged in PR #231. Exercise Detail progress localization merged in PR #232. The final route-backed audit found no additional reachable measurement-history or workout-volume detail screen requiring a separate no-op slice.

### Coach history and trust

Completed immutable run history/detail, trust states, provenance, Nutrition/Strength/Combined before-after summaries, deterministic rationale, privacy-safe input coverage and fail-closed metadata parsing.

### Safety and Recovery

Completed:

- Recovery Check-In and User Limitations;
- typed enum display mappings and selected-locale dates;
- preflight and deterministic readiness review;
- readiness, pending-operation and conflict gates;
- restrictions, findings and load recommendations;
- bounded request and snapshot errors;
- bounded preflight sync statuses and review run statuses;
- bounded unknown limitation enums without humanized internal-code fallbacks;
- capability copy without user-visible internal schema versions.

The remaining Safety & Recovery retry/status presentation merged in PR #234.

### Combined Coach

Completed:

- read-only Combined Review with child Strength/Nutrition/Safety summaries;
- schema-v6 gate, polling, idempotency and `automaticApplication: false`;
- selected `kg/lb` and `kcal/kJ`;
- Combined Proposal with effective Safety-capped Strength;
- separate explicit Strength-template and Nutrition-target confirmations;
- revisioned writes, idempotency keys, fail-closed parsing and no automatic mutation;
- bounded standalone capability states without user-visible schema versions;
- bounded EN/RU sync presentation with a safe unknown-status fallback.

Standalone Combined Review/Proposal trust presentation merged in PR #233.

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

### Repository-wide presentation boundaries

Completed:

- recursive `.tsx` audit for direct locale formatting, raw status fallback and humanized internal-code fallback;
- removal of unreachable legacy presentation components;
- bounded standalone Nutrition Target Proposal and Workout History list/detail presentation;
- central selected-locale and selected-unit formatting on reachable presentation surfaces;
- permanent source contracts preventing regression.

The `.tsx` presentation boundary audit merged in PR #235. The `.ts` helper/view-model boundary audit is implemented in PR #236 and must merge only from an exact-green Mobile CI head.

## Current next task

### Repository-wide contextual literal audit

After PR #236, audit remaining reachable source with context-sensitive checks that cannot be safely enforced by the broad formatting guards:

- presentation-level `toFixed` while preserving calculation and serialization rounding;
- fixed `kg`, `lb`, `cm`, `in`, `kcal` and `kJ` display copy outside central unit boundaries;
- fixed English accessibility labels, hints and control text;
- raw provider/backend/status/enum fallbacks not matched by the bounded status guards;
- literal-English source tests that should assert semantic behavior.

Use separate bounded PRs for real findings and do not create no-op changes.

Must preserve routes, IDs, persisted canonical units, API and sync schemas, business logic, polling, idempotency, explicit confirmations and completed history.

## Product/API dependency

Compensating revert for Coach-applied changes is not implemented because the current Mobile `CoachApi` exposes confirm operations but no revert mutation or reversal contract. A safe implementation requires an explicit backend/API product contract with ownership, revision, idempotency, conflict and audit semantics; do not invent a client-only rollback.

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
