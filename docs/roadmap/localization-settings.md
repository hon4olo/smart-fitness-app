# Localization and Settings Roadmap

Updated: 2026-07-30

## Goal

Make English and Russian first-class product languages across the complete user journey while keeping persisted values, sync schemas, API identifiers and canonical health/fitness units stable.

## Current foundations

Completed shared foundations:

- system, English and Russian language selection;
- persisted language preference;
- centralized locale-aware date and number formatting;
- deterministic English/Russian pluralization helpers;
- weight, length and energy display-unit preferences;
- canonical persistence in kilograms, centimetres and kilocalories;
- root error-recovery localization before providers mount;
- password-reset source flow localization;
- Account & Security inside dedicated Settings;
- support-only local storage/API diagnostics with no raw user payloads.

## Completed product surfaces

### Home and primary navigation

Completed:

- Home summary and snapshot surfaces;
- quick actions and tab labels;
- primary Settings navigation;
- primary Profile preferences and goals.

### Nutrition

Completed:

- main Nutrition diary;
- selected-day and seven-day navigation;
- streak, macro headers and meal groups;
- food-entry accessibility copy;
- Nutrition details and fibre summary;
- full Nutrition calendar and logged-day accessibility states;
- Add Food route and picker modes;
- search, provider states and provider attribution;
- recent foods;
- favourites and My foods;
- saved meals and meal-template management;
- custom-food creation and validation;
- portion editor;
- barcode scanner, permission, lookup and manual-product flows;
- safe localized barcode and food-search errors;
- kcal/kJ presentation across diary, discovery, saved meals, custom food and portion editing.

Stable product data remains unchanged:

- food names and brands;
- provider identifiers and attribution;
- meal identifiers and user-created meal names;
- canonical nutrition values;
- food-entry, food-library and meal-template sync schemas.

### Workouts

Completed:

- active workout session labels and set table;
- workout-session actions and validation;
- exercise browser, filters, favourites and recently used;
- custom exercise form;
- exercise-detail sheet;
- Workout History list, editing, validation and deletion confirmation;
- kg/lb display and canonical-kg persistence when editing completed sets.

Persisted exercise names, database content, workout IDs and sync schemas remain unchanged.

### Progress

Completed:

- primary Progress tab;
- weight summary and primary analytics;
- localized Weight Details route;
- 30-day weight trend and chart states;
- recent weigh-ins;
- selected kg/lb presentation while retaining canonical kg analytics;
- link from Weight Details to localized Workout History.

### Coach trust and history

Completed:

- Coach run history and detail presentation;
- provenance and source-revision display;
- before/after Nutrition summaries;
- standalone Strength before/after summaries;
- Combined effective Strength before/after summaries;
- input-coverage summaries without raw snapshots or health values;
- safe fail-closed parsing of displayed metadata.

### Safety and Recovery

Completed:

- Recovery Check-In;
- localized recovery fields, score controls, timestamps, validation and sync states;
- User Limitations;
- typed display mappings for limitation kind, body region, side, severity, training impact, movement pattern and status;
- selected-locale onset and resolved dates;
- Safety & Recovery preflight;
- deterministic local-readiness and synchronization gates;
- Safety & Recovery review and results;
- localized restrictions, findings, load recommendations and snapshot states;
- bounded user-safe capability, request, sync and issue errors.

Stable validation models, deterministic policies, API lifecycle, persisted enums and sync schemas remain unchanged.

### Settings and support

Completed:

- language, appearance and unit preferences;
- Account & Security placement;
- production diagnostics hidden by default;
- support diagnostics available only in development or explicit support mode;
- privacy disclosure aligned with the absence of external crash telemetry;
- local aggregate storage and API metrics without payloads, tokens, email addresses or health values.

## Remaining source work

### Workouts secondary surfaces

Still requires a focused audit and localization pass:

- program and routine detail screens;
- workout-template detail and builder screens;
- program workout picker/editor modals;
- secondary preview and discard-confirmation surfaces;
- any remaining Safety gate/session-preview copy outside completed session and history flows.

### Progress secondary surfaces

Still requires a focused audit and localization pass:

- secondary measurement detail routes;
- exercise-progress detail views;
- workout-volume detail views;
- additional Safety/Recovery analytics summaries outside completed Coach review surfaces.

### Advanced Coach proposal and confirmation surfaces

Still requires localization and safe-error presentation:

- Nutrition proposal/review confirmation surfaces;
- Strength strategy/proposal confirmation surfaces;
- Combined proposal and explicit Strength/Nutrition application surfaces;
- remaining advanced Coach status, issue and alert copy outside history and completed Safety/Recovery flows.

All proposal work must continue to preserve:

- explicit confirmation before mutation;
- revisioned writes;
- idempotency keys;
- fail-closed parsers;
- separation between Strength, Nutrition and Safety mutations;
- no raw provider/backend error details in user-visible copy.

### Repository-wide cleanup

Remaining audit work:

- direct `Intl` or `toLocaleString` calls in user-facing secondary screens;
- fixed English accessibility labels in secondary routes;
- fixed `kg`, `cm`, `kcal` or date copy outside established unit/locale boundaries;
- tests that assert obsolete English literals instead of semantic localization contracts.

## External validation still required

Source and CI completion does not replace physical-device validation.

Still requires user/device or release access:

- full English/Russian visual pass on physical iOS hardware;
- Android build and layout validation;
- large-text and screen-reader matrix;
- narrow/wide device layout checks;
- light/dark/system appearance matrix;
- kg/lb, cm/in and kcal/kJ matrix;
- second-device sync and conflict checks;
- offline termination/restart recovery;
- production password-reset email delivery after provider configuration and deployment;
- OTA/native build, rollback and release-gate validation.

## Completion criteria

Localization is complete only when:

- every reachable production surface has English and Russian copy;
- dates and numbers follow the selected app language rather than only the OS locale;
- user-facing units follow selected preferences while persistence remains canonical;
- plural forms are deterministic;
- accessibility labels and alerts are localized;
- raw backend/provider errors and internal enum codes are not displayed;
- EN/RU, theme, unit, accessibility and device matrices pass;
- no persistence, sync or API identifiers are translated.
