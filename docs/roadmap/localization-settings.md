# Localization and Settings Roadmap

Updated: 2026-07-31

## Localization and regional formatting

Goal: make English and Russian first-class product languages across every reachable production surface while preserving routes, IDs, enum values, sync fields, provider/database identifiers, user-created names, and canonical `kg/cm/kcal` persistence.

## Shared foundations — completed

- System, English, and Russian selection with persisted preference;
- immediate language application without restart;
- centralized locale-aware date, number, plural, and unit formatting;
- deterministic English/Russian one/few/many/other pluralization with a Hermes-safe fallback;
- weight, length, and energy display preferences;
- canonical persistence in `kg`, `cm`, and `kcal`;
- English fallback and EN/RU catalog parity checks;
- Account & Security inside dedicated Settings;
- privacy-safe local storage/API diagnostics;
- bounded provider/backend/status/error presentation.

## Completed production surfaces

### Account, Home, and Settings

Root navigation, Home summaries, onboarding, authentication, sessions/devices, password/account flows, Settings, Account & Security, Privacy, About, Data & Sync, Profile preferences, and production hiding of developer/OTA diagnostics.

### Nutrition

- main diary, day navigation, seven-day strip, and calendar;
- macro headers, meal groups, counts, details, and fibre;
- Add Food search, recent, favourites, My foods, and saved meals;
- custom food, portions, barcode/manual-product flows;
- safe provider/search/scanner errors;
- selected `kcal/kJ` presentation.

### Workouts

- Workouts hub and program creation;
- active session, set table, RPE, cancellation, finish, and summary;
- Exercise Library, filters, favourites, recent, custom exercises, and details;
- Workout History list/detail/edit/delete;
- selected `kg/lb` presentation with canonical kg writes;
- workout-template and program details, menus, favourites, deletion, counts, and accessibility;
- routine/program builders, reusable-workout picker, editor, and row controls;
- active-workout exercise picker loading/error/empty/count states in EN/RU;
- removal of raw provider/source/error diagnostics from the active-workout picker;
- pre-workout Safety Gate title, status, restrictions, findings, acknowledgement, navigation, storage errors, and disclaimer in EN/RU.

Relevant merges:

- program/routine details: PR #228;
- builder/picker/editor: PR #229;
- session previews: PR #230;
- active-workout picker and obsolete builder cleanup: PR #251;
- menu/tab/state/raw-status audit and complete Safety Gate boundary: PR #253.

### Progress

- Progress and Weight Details copy, dates, charts, recent weigh-ins, and selected units;
- body-measurement labels, validation, and `cm/in` previews;
- Safety & Recovery history and weekly trends;
- workout-volume conversion and locale-aware analytics;
- Exercise Detail tabs, history, metrics, errors, and provider-safe presentation.

Secondary analytics merged in PR #231. Exercise Detail localization merged in PR #232.

### Coach and Safety

Completed:

- Nutrition Coach and Strength Coach account/capability/review/proposal/confirmation states;
- Combined Review and Combined Proposal trust presentation;
- separate explicit Combined Strength and Nutrition confirmations;
- immutable run history/detail, provenance, before/after summaries, rationale, and privacy-safe input coverage;
- Recovery Check-In, User Limitations, preflight, readiness review, restrictions, findings, load recommendations, and bounded errors;
- no user-visible internal schema versions or raw enum/code fallbacks.

Relevant merges:

- Nutrition Coach: PR #224;
- Strength Coach: PR #226;
- Combined trust presentation: PR #233;
- remaining Safety/Recovery retry and status presentation: PR #234;
- complete pre-workout Safety Gate boundary: PR #253.

## Repository-wide presentation boundaries — completed

Permanent source contracts now cover:

- direct locale formatting and `.toLocaleString` in reachable TSX;
- unsafe formatting in TS helpers/view models;
- presentation-level `.toFixed`;
- fixed display-unit literals;
- accessibility labels and hints;
- static button labels;
- static `Alert.alert` action labels;
- static `Pressable` text;
- static menu, tab, navigator, and state-control labels;
- direct raw status/provider/source member presentation;
- uppercased internal status/code presentation;
- raw `Error.message` fallbacks;
- unsafe status and humanized-code fallbacks.

Audit sequence:

- TSX boundaries: PR #235;
- TS helper boundaries: PR #236;
- `.toFixed`: PR #237;
- display units: PR #238;
- accessibility: PR #239;
- buttons: PR #240;
- Alerts: PR #250;
- Pressables: PR #251;
- menu/tab/state/raw status: PR #253.

## Remaining source-verifiable localization work

No known broad reachable production surface remains unlocalized after PR #253. Continue only with bounded real findings:

- new or changed screens detected by permanent source contracts;
- literal-English tests that should assert semantic behavior rather than physical file placement;
- confirmed raw provider/backend/policy text not covered by current patterns;
- user-visible Data & Sync recovery copy introduced by Phase 3 hardening.

Do not create no-op localization PRs.

## Product/API dependency

Compensating revert for Coach-applied changes remains unavailable because Mobile exposes confirmation operations but no backend reversal contract. A safe revert requires explicit ownership, source/applied revisions, idempotency, conflict handling, and immutable audit semantics. Do not invent a client-only rollback.

## External validation still required

- physical iPhone EN/RU visual pass;
- Android build/layout validation;
- narrow/standard/wide devices;
- Dynamic Type and VoiceOver/TalkBack;
- focus, keyboard, touch targets, clipping, and safe areas;
- appearance and unit matrices;
- second-device sync/conflicts and offline restart recovery;
- production password-reset email after provider configuration/deployment;
- OTA/native-build, rollback, and release-gate validation.

## Rules for future presentation changes

- preserve business logic, persistence, API/sync contracts, polling, idempotency, confirmations, and history;
- use typed or bounded copy contracts;
- use central date, number, plural, and unit formatters;
- retain English fallback and EN/RU parity checks;
- prevent hard-coded controls, raw statuses, provider errors, internal codes, and unsafe formatting;
- require line audit, TypeScript, Coach/sync contracts, full regression, Expo export, and Expo Doctor;
- do not claim rendered layout/accessibility completion without device or screenshot validation.
