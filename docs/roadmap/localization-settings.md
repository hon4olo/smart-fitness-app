# Localization and Settings roadmap

Updated: 2026-07-26


## Full mobile UI localization audit — 2026-07-26

Audit scope and method:

- inspected the current `main` source tree under `src/app`, `src/features`, and `src/components`;
- scanned 328 handwritten TypeScript/TSX files after excluding tests, specs, and fixture directories;
- reviewed routes, screen components, alerts, placeholders, accessibility copy, loading/empty/error states, status labels, and local copy helpers;
- treated email addresses, UUIDs, API routes, `runtimeVersion`, `updateId`, and non-visible internal codes as technical data rather than translation copy.

Verified baseline findings before the first slice:

- the central English and Russian catalogs each contained 141 unique keys with exact key parity and no duplicate keys;
- 11 user-source files contained 117 direct locale branches (`locale === 'ru'` or equivalent);
- Settings used the central catalog alongside five separate local bilingual copy contracts (Privacy/About, support diagnostics, sync status, recovery, and conflict review) plus inline locale branches in the Settings shell and personal-details editor;
- the same user flow could therefore render central translations, local translations, raw status codes, and hard-coded English on one screen;
- confirmed mixed-language examples included `resolver`, `support`, raw sync/environment status codes, developer controls, OTA alerts/fallbacks, session `App` metadata, and account-form placeholders.

Screen groups with incomplete or mixed localization after this first slice:

1. **Profile, Progress, goals, and Coach profile** — Profile summary, goal/planning sections, Coach profile controls, progress overview cards, charts, body measurements, muscle analytics, Safety & Recovery history, weight entry, and weight details.
2. **Home and onboarding** — remaining Home status/action copy and the dedicated onboarding validation, labels, segmented options, success alerts, and accessibility copy.
3. **Workouts** — Workouts hub, active session, finish flow, set table/actions, exercise library/detail, workout history/detail, programs, routines, templates, builder, safety gate, preview tools, and integration/coming-soon states.
4. **Nutrition** — Nutrition tab, food browser/search, Add Food, custom-food form, barcode scanner, serving editor, favorites/recent foods, meal templates, targets, empty/error states, and Nutrition Coach proposal surfaces.
5. **Advanced Coach** — Coach history/trust/detail, recovery check-in, training limitations, Safety & Recovery preflight/review, Combined Coach, Strength Coach, Nutrition Coach, proposals, provenance/trust statuses, and raw validation/result copy.
6. **Final global pass** — remaining direct `Intl`/`toLocaleString`, visible enum formatting, count-dependent copy, accessibility labels/hints, dialogs, alerts, stale/offline/retry states, and a repository-wide hard-coded English baseline.

First slice implemented in PR #147:

- Settings shell, section headings, subtitle, alerts, developer tools, OTA status copy, and localized fallbacks;
- Account/auth placeholders and device-session metadata/platform labels;
- Personal details labels, validation, helper text, success state, and calculation-formula options;
- Data & Sync summary/detail, status labels, offline/error/conflict explanations, recovery, conflict entity/source labels, and support diagnostics;
- Privacy and About disclosures, Coach history/trust link, release metadata labels, and unavailable-link explanation;
- local Settings bilingual dictionaries replaced by the typed localization contract;
- real Russian pluralization applied to protected recovery-change counts;
- targeted source-contract tests added to prevent inline locale branches, local Settings dictionaries, direct English alert text, and direct English high-risk UI props from returning in this slice.


Second slice implemented in PR #148:

- Profile summary, preferences, Settings entry accessibility, and localized account/goal/Coach status rows;
- Progress overview headings, current-weight and trend summaries, measurement/training cards, locale-aware dates, and validation states;
- Goal editor labels, segmented options, target-weight/training-day inputs, save states, and accessibility copy;
- AI Coach profile labels, activity/experience options, height input, validation, helper text, save state, and disclosure copy;
- body-measurement entry labels and validation plus chart accessibility descriptions;
- Safety & Recovery history and weekly-trend cards, including status, period, movement-pattern, training-load, empty, unavailable, and accessibility states;
- a separate typed Profile/Progress catalog with 189 English and 189 Russian keys, exact key parity, and no duplicate keys;
- completed-scope source contracts preventing component-level locale branches, direct English high-risk props/alerts, and raw analytics/internal status codes from being rendered;
- global direct locale branches reduced from 11 files / 117 branches at audit baseline to 4 files / 50 branches.

Third slice implemented in PR #149:

- Home summary, calories state, current weight, workout action, weekly snapshot, recovery status, and all action labels now use typed translation keys;
- deterministic Home motivation and recovery values are mapped to bounded user-facing copy instead of rendering internal English results;
- weekly workout-volume display uses the selected weight unit and locale-aware number formatting without changing canonical calculations;
- workout streaks use the existing English/Russian pluralization contract;
- onboarding heading, field labels, goal choices, validation, disabled-action explanation, success alert, and input accessibility labels are localized;
- a separate typed Home/onboarding catalog contains 70 English and 70 Russian keys with exact parity and no duplicates;
- completed-scope tests prevent inline locale branches, raw Home analytics strings, direct English high-risk props, and direct English Alert copy;
- direct locale branches are reduced from 11 files / 117 branches at audit baseline to 2 advanced-Coach files / 33 branches.

Remaining screen groups after PR #149:

1. **Workouts** — Workouts hub, active session, finish flow, set table/actions, exercise library/detail, workout history/detail, programs, routines, templates, builder, safety gate, preview tools, and integration/coming-soon states.
2. **Nutrition** — Nutrition tab, food browser/search, Add Food, custom-food form, barcode scanner, serving editor, favorites/recent foods, meal templates, targets, empty/error states, and Nutrition Coach proposal surfaces.
3. **Progress detail flows** — weight entry/details, measurement detail/charts/forms, exercise detail analytics, and any remaining secondary progress routes.
4. **Advanced Coach** — Coach history/trust/detail, recovery check-in, training limitations, Safety & Recovery preflight/review, Combined Coach, Strength Coach, Nutrition Coach, proposals, provenance/trust statuses, and raw validation/result copy.
5. **Final global pass** — remaining direct `Intl`/`toLocaleString`, visible enum formatting, count-dependent copy, accessibility labels/hints, dialogs, alerts, stale/offline/retry states, and the repository-wide hard-coded English baseline.

Validation boundary:

- code and automated checks can verify catalog parity, source-contract rules, TypeScript, and regression behavior;
- Russian layout, truncation, Dynamic Type, VoiceOver, keyboard, offline, sync conflict, and OTA diagnostic states still require physical-iPhone validation after runtime 1.0.2 is installed.

## Localization and regional formatting

Status: English/Russian typed foundation, pluralization infrastructure, and the main unit-preference rollout are complete; full-screen translation, accessibility, and screenshot validation remain.

Completed:

- typed message keys with English fallback;
- Russian and English catalogs;
- device-language detection and persisted System/English/Russian override;
- localized root navigation, tabs, Settings, auth, Account & Security, destructive confirmations, validation, and safe errors;
- centralized Settings/Account/Privacy/About/Sync copy with no component-level locale branches in the completed slice;
- centralized Profile/Progress/Goals/AI Coach overview copy with no component-level locale branches in the completed slice;
- centralized Home/onboarding copy with bounded deterministic-status localization and no component-level locale branches in the completed slice;
- locale-aware dates on account/session and Weight details surfaces;
- stable untranslated persisted identifiers, enums, routes, and sync fields;
- metric/imperial preferences with canonical internal storage;
- `kg/lb` across active workout, profile goals, onboarding, Home, Progress, weight history, workout history, completed-workout detail, body measurements, and Exercise detail;
- `cm/in` for profile height and body-measurement entry/analytics;
- `kcal/kJ` across Nutrition summary, search, favorites, recent foods, saved meals, portion editor, Add Food summary, and custom-food input;
- locale-aware weight/length/energy formatter API in UnitPreferencesProvider;
- `Intl.PluralRules`-backed English/Russian pluralization helpers with one/few/many/other support and count interpolation.

Relevant mobile PRs:

- #100 `9c4b9437cbd99a399dbf7f4546501005d39e6b43`: localization and Settings foundation;
- #101 `72566ab50e4a5e3bd9fb710673fc8a119f6b453b`: auth/account localization;
- #102–#110: unit-preference rollout;
- #111 `35cc082094611abac9df7ad7b409d2e829cf6e3a`: locale-aware unit formatting;
- #113 `bfd64b6f8b3c99a927b7181eb0e7e7ee126b416f`: English/Russian pluralization helpers.

Remaining:

- complete Russian/English translation for Workouts, Nutrition, Progress detail flows, and advanced Coach copy;
- migrate remaining direct `Intl` and `toLocaleString` usage to the localization/unit formatting boundary;
- adopt pluralization helpers in real count-dependent user-facing messages;
- extend the hard-coded English guard from the completed Settings/Account slice to each subsequent screen group;
- extend interpolation, plural-form, and unsupported-locale tests as catalogs grow;
- verify long Russian strings on narrow and wide layouts;
- add Russian/English screenshot checks;
- audit Dynamic Type, VoiceOver/TalkBack, contrast, Reduce Motion, focus order, and touch targets.

## Dedicated Settings

Completed:

- dedicated Settings route;
- Language: System, English, Russian;
- Appearance: System, Light, Dark;
- Units: weight, length, and energy;
- safe defaults and persistence;
- immediate application without restart;
- unavailable settings are hidden instead of shown as inert controls;
- Account & Security flows exist and are reachable from Profile;
- Account & Security is surfaced inside the dedicated Settings information architecture using the existing authenticated account card;
- Data & Sync status, recovery, conflict review, and support diagnostics are surfaced;
- Privacy explains local versus synchronized scope, anonymous isolation, sanitized crash reporting, excluded sensitive content, and that product analytics is not enabled;
- About shows app version, build, runtime, update/channel/source details and hides legal/support links until verified destinations exist;
- the preference-scope policy is explicit: language, appearance, and units are device-scoped, while Nutrition library, sync metadata, and account data are account-scoped;
- account-switch isolation tests verify distinct anonymous/account storage keys and prevent device preferences from being misclassified as account data.

Remaining:

- remove the duplicate Account surface from Profile after layout/device validation of the Settings placement;
- add analytics consent only when an analytics provider and reviewed event contract are approved;
- configure verified legal and support destinations before showing links;
- specified workout preferences only after behavior is defined;
- implemented notification categories only;
- hide developer diagnostics from production users unless explicitly enabled by support mode.
