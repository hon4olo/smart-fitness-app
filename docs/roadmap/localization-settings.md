# Localization and Settings roadmap

Updated: 2026-07-30

## Localization and regional formatting

Status: typed English/Russian infrastructure, unit preferences, deterministic pluralization, and the principal account/navigation/training surfaces are complete at source-code level. Remaining work is concentrated in Nutrition, secondary Workouts/Progress routes, advanced Coach flows, final formatting/accessibility audit, screenshots, and physical-device validation.

Completed foundation:

- typed message keys with English fallback and exact English/Russian catalog parity checks;
- device-language detection plus persisted System/English/Russian override;
- immediate language application without restart;
- locale-aware date and number formatting boundaries;
- deterministic English/Russian one/few/many/other pluralization without relying on unavailable Hermes `Intl.PluralRules`;
- metric/imperial preferences with canonical internal `kg/cm/kcal` storage;
- `kg/lb`, `cm/in`, and `kcal/kJ` formatting and input conversion across implemented flows;
- stable persisted identifiers, enums, routes, sync fields, user-created names, and provider/database source content remain untranslated internally.

Completed screen groups:

- root navigation and bottom tabs;
- Settings, Account & Security, Privacy, About, Data & Sync, conflict/recovery/support diagnostics, and personal details;
- registration, sign-in, account-first choice, onboarding, password change, account deletion, sessions/devices, forgot-password, and reset-password;
- Profile summary, goals, AI Coach profile, body-measurement entry, and main Progress overview/cards;
- Home summary, recovery/motivation states, current weight, workout action, weekly snapshot, and onboarding;
- Workouts hub, built-in seed-title display mapping, program creation entry, loading/empty/disabled states, and accessibility copy;
- active workout, set table/actions, RPE/previous-result copy, cancellation, finish flow, summary, and alerts;
- immutable Coach history filters/detail, trust states, provenance, applied Nutrition/Strength before-after changes, deterministic rationale, and input-coverage summaries;
- pre-provider root error recovery;
- local performance/support diagnostics and the current local-only privacy disclosure;
- developer and OTA diagnostics hidden from ordinary production users.

Completed or in final validation on 2026-07-30:

- Exercise Library browser, search, filters, favorites, recently used, custom-exercise form, accessibility actions, rows, and exercise detail sheet;
- Workout History list/edit/delete flow, relative dates, pluralized set counts, selected `kg/lb` display, and conversion back to canonical kilograms on edit.

Remaining screen groups:

1. **Secondary Workouts routes** — program/routine/template details and builders, workout safety gate, preview tools, integration/coming-soon surfaces, and any remaining completed-workout secondary detail copy not covered by Workout History.
2. **Nutrition** — diary, food browser/search, Add Food, custom-food form, barcode scanner, serving editor, favorites/recent foods, saved meals, meal templates, targets, loading/empty/error states, and Nutrition Coach proposal surfaces.
3. **Progress secondary routes** — any remaining weight/measurement detail screens, charts/forms, exercise-detail analytics, and secondary insight surfaces that still bypass the localization boundary.
4. **Advanced Coach** — recovery check-in, limitations, Safety & Recovery preflight/review, Combined/Strength/Nutrition proposal and confirmation surfaces, and remaining validation/result states outside immutable history.
5. **Final global pass** — remaining direct `Intl`/`toLocaleString`, visible enum formatting, count-dependent copy, accessibility labels/hints, dialogs, alerts, stale/offline/retry states, and repository-wide hard-coded English source contracts.

Validation still requiring devices or rendered screenshots:

- long Russian strings on narrow, standard, and wide layouts;
- English/Russian reference screenshots for primary screens and critical child flows;
- Dynamic Type, VoiceOver/TalkBack, contrast, Reduce Motion, focus order, keyboard-open states, touch targets, clipping, and safe areas;
- physical-iPhone and Android verification of locale switching, decimal input, units, offline/error states, and deep links.

## Dedicated Settings

Completed:

- dedicated Settings route;
- Language: System, English, Russian;
- Appearance: System, Light, Dark;
- weight, length, and energy units;
- safe defaults, persistence, account/device storage-scope separation, and immediate application;
- Account & Security entry and flows;
- personal details and goal/profile controls;
- Data & Sync status, recovery, conflict review, and sanitized support diagnostics;
- Privacy disclosure matching the current architecture: no external crash reporting, no product analytics, and only privacy-safe device-local aggregate diagnostics;
- About version/build/runtime/update metadata;
- developer/support diagnostics hidden unless development mode or explicit support mode is enabled;
- local performance diagnostics visible only inside the collapsed support-only developer section;
- unavailable or unimplemented settings hidden instead of shown as inert controls.

Remaining:

- remove the duplicate Account surface from Profile only after Settings placement and back-navigation are validated on devices;
- configure verified legal and support destinations before showing links;
- add analytics consent only after a provider and reviewed event/retention/deletion contract are approved;
- add workout preferences only after their behavior and persistence scope are defined;
- add notification categories only when the corresponding notification behavior exists.

## Source and validation rules

For each completed localization slice:

- preserve persisted values and business logic;
- use typed or bounded copy contracts rather than component-level locale branches scattered across the UI;
- use central date/number/unit formatters;
- keep English/Russian key parity and fallback tests current;
- add source-contract tests preventing audited direct English controls, raw internal statuses, and unsafe direct formatting from returning;
- do not claim layout/accessibility completion until rendered-device checks have actually passed.
