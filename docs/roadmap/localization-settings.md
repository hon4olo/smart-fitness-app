# Localization and Settings Roadmap

Updated: 2026-07-30

## Goal

Make English and Russian first-class product languages across every reachable production surface while keeping persisted values, API identifiers, sync schemas, user-created names and canonical health/fitness units stable.

## Shared foundations

Completed:

- System, English and Russian language selection with persisted preference;
- immediate language application without restart;
- centralized locale-aware date and number formatting;
- deterministic English/Russian pluralization helpers;
- weight, length and energy display-unit preferences;
- canonical persistence in `kg`, `cm` and `kcal`;
- English fallback and EN/RU catalog parity checks;
- Account & Security inside dedicated Settings;
- pre-provider root recovery localization;
- password-reset source flow localization;
- privacy-safe local storage/API diagnostics without raw payloads, tokens, email addresses or health values.

Stable internal data must remain untranslated:

- routes, IDs, enum values and sync fields;
- provider/database content and attribution identifiers;
- user-created food, meal, workout, exercise, routine, program and template names;
- canonical measurement and nutrition values.

## Completed production surfaces

### Home, navigation and account

Completed:

- root navigation and bottom tabs;
- Home summary, weekly snapshot, current weight and workout action;
- onboarding and account-first flows;
- sign-in, registration, sessions/devices, password change and account deletion;
- forgot-password and reset-password source flows;
- Settings, Account & Security, Privacy, About and Data & Sync;
- Profile summary, personal details, goals and AI Coach profile;
- production-only hiding of developer and OTA diagnostics.

### Nutrition diary and food flows

Completed:

- main Nutrition diary and selected-day navigation;
- seven-day strip, full Nutrition calendar and logged-day accessibility states;
- streak, macro headers, meal groups and item-count pluralization;
- Nutrition details and fibre summary;
- Add Food route and picker modes;
- search, provider states and attribution;
- recent foods, favourites and My foods;
- saved meals and meal-template management;
- custom-food creation and validation;
- portion editor;
- barcode scanner, permission, lookup and manual-product flows;
- safe localized search/barcode errors;
- selected `kcal/kJ` presentation across completed diary and food surfaces.

### Workouts core flows

Completed:

- Workouts hub and program-creation entry;
- active workout session and set-table labels/actions;
- RPE, previous result, cancellation, finish flow, summary and alerts;
- Exercise Library browser, search, filters, favourites and recently used;
- custom-exercise form and exercise detail sheet;
- Workout History list, editing, validation and deletion confirmation;
- selected `kg/lb` display with conversion back to canonical kilograms on edit.

### Progress

Completed:

- primary Progress overview and cards;
- weight summary and primary analytics;
- Weight Details route;
- 30-day trend and chart states;
- recent weigh-ins;
- selected `kg/lb` presentation while analytics remain canonical kilograms;
- link from Weight Details to localized Workout History.

### Coach history and trust surfaces

Completed:

- immutable Coach run history and filters;
- run details, trust states and provenance;
- Nutrition and Strength before/after summaries;
- Combined effective Strength before/after summaries;
- deterministic rationale;
- privacy-safe input-coverage summaries;
- fail-closed parsing of displayed metadata.

### Safety and Recovery

Completed:

- Recovery Check-In fields, score controls, timestamps, validation and sync states;
- User Limitations form/list;
- typed display mappings for limitation kind, body region, side, severity, training impact, movement pattern and status;
- selected-locale onset and resolved dates;
- Safety & Recovery preflight and deterministic readiness gates;
- Safety & Recovery review/results;
- localized restrictions, findings, load recommendations and snapshot states;
- bounded capability, request, sync and issue errors.

### Combined Coach

Completed:

- read-only Combined Review;
- child Strength, Nutrition and Safety summaries;
- capability schema v6 gate, polling, idempotency and `automaticApplication: false`;
- selected `kg/lb` and `kcal/kJ` presentation;
- bounded typed findings and safe request errors;
- Combined Proposal review;
- effective Safety-capped Strength plan;
- separate explicit Strength-template and Nutrition-target confirmation actions;
- source revisions, idempotency keys and revisioned writes;
- fail-closed parsing and no automatic mutation.

### Nutrition Coach

Completed in PR #224 and merged to `main`:

- account, capability and analysis-period states;
- deterministic Nutrition review;
- structured AI strategy preview;
- review metrics and daily coverage;
- strategy proposal and confirmation alert;
- selected `kcal/kJ`, `kg/lb` and `g/kg` or `g/lb` presentation;
- abort handling, polling, idempotency and explicit `confirmRun` workflow;
- post-confirmation sync;
- bounded capability, request, confirmation, rejection and issue presentation;
- source-contract coverage and full Mobile CI.

## Current next task

### Strength Coach localization

Branch already exists:

- `agent/localize-strength-coach`

Current state:

- branch was created from `main`;
- audit is complete;
- no product commits or PR exist yet.

Required linked slice:

- `src/features/coach/screens/StrengthCoachScreen.tsx`;
- `src/features/coach/components/StrengthStrategyProposalView.tsx`;
- any directly required typed localization module and source-contract tests.

Confirmed issues to remove:

- direct `Intl.DateTimeFormat`;
- `toLocaleString`;
- fixed `kg` presentation;
- hard-coded metrics, controls, alerts and accessibility labels;
- uppercase/internal statuses and guardrail codes;
- raw request, confirmation, view-model and issue messages;
- direct provider/model audit details where they are not intended user-facing metadata.

Must preserve:

- `session_review`, `next_workout_proposal` and `strength_strategy_proposal` request types;
- latest/source-session mapping;
- abort and polling behavior;
- structured proposal and confirmation capability gates;
- idempotency keys;
- explicit `coachApi.confirmRun`;
- post-confirmation sync;
- deterministic source-set, load, repetition, RPE and volume validation;
- creation of a new workout template without changing completed workout history.

## Remaining source work after Strength Coach

### Secondary Workouts surfaces

Still requires focused audit/localization:

- program and routine detail screens;
- workout-template detail and builder screens;
- program workout picker/editor modals;
- secondary preview and discard-confirmation surfaces;
- remaining workout Safety gate/session-preview copy outside completed session/history flows.

### Secondary Progress surfaces

Still requires focused audit/localization:

- measurement detail routes;
- exercise-progress detail views;
- workout-volume detail views;
- secondary insight and analytics surfaces that still bypass localization/unit boundaries.

### Remaining Coach surfaces

After Strength Coach, verify:

- any standalone proposal/confirmation route not covered by Nutrition, Combined or Strength flows;
- stale/offline/retry states outside immutable history;
- remaining direct provider/backend messages;
- compensating-revert UX for Coach-applied changes, if not already implemented elsewhere.

### Repository-wide final pass

Audit and remove:

- direct `Intl` or `toLocaleString` calls in reachable user-facing secondary screens;
- fixed English accessibility labels/hints;
- fixed `kg`, `cm`, `kcal` and date copy outside established boundaries;
- visible internal enum/status formatting;
- obsolete source-tests that assert literal English instead of semantic localization contracts.

## External validation still required

Source and CI completion does not replace device/release validation.

Still requires user, device, provider or release access:

- full EN/RU visual pass on physical iPhone;
- Android build and layout validation;
- narrow, standard and wide device checks;
- Dynamic Type and VoiceOver/TalkBack matrix;
- focus order, keyboard-open states, touch targets, clipping and safe areas;
- light/dark/system appearance matrix;
- `kg/lb`, `cm/in` and `kcal/kJ` matrix;
- second-device sync and conflict checks;
- offline termination/restart recovery;
- production password-reset email delivery after provider configuration and backend deployment;
- OTA/native build, rollback and release-gate validation.

## Source and validation rules

For every localization slice:

- preserve business logic, persisted values and sync/API contracts;
- use typed or bounded copy contracts;
- use central date, number and unit formatters;
- keep English fallback and EN/RU parity tests current;
- add source-contract tests preventing audited hard-coded controls, raw internal statuses, raw provider errors and unsafe direct formatting from returning;
- require line audit, TypeScript, Coach/sync contracts, full regression suite, Expo export and Expo Doctor before merge;
- do not claim rendered layout or accessibility completion without physical-device or screenshot validation.