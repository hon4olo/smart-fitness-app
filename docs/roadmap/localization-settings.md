# Localization and Settings roadmap

Updated: 2026-07-25

## Localization and regional formatting

Status: English/Russian typed foundation and the main unit-preference rollout are complete; full-screen translation, pluralization, accessibility, and screenshot validation remain.

Completed:

- typed message keys with English fallback;
- Russian and English catalogs;
- device-language detection and persisted System/English/Russian override;
- localized root navigation, tabs, Settings, auth, Account & Security, destructive confirmations, validation, and safe errors;
- locale-aware dates on account/session and Weight details surfaces;
- stable untranslated persisted identifiers, enums, routes, and sync fields;
- metric/imperial preferences with canonical internal storage;
- `kg/lb` across active workout, profile goals, onboarding, Home, Progress, weight history, workout history, completed-workout detail, body measurements, and Exercise detail;
- `cm/in` for profile height and body-measurement entry/analytics;
- `kcal/kJ` across Nutrition summary, search, favorites, recent foods, saved meals, portion editor, Add Food summary, and custom-food input;
- locale-aware weight/length/energy formatter API in UnitPreferencesProvider.

Relevant mobile PRs:

- #100 `9c4b9437cbd99a399dbf7f4546501005d39e6b43`: localization and Settings foundation;
- #101 `72566ab50e4a5e3bd9fb710673fc8a119f6b453b`: auth/account localization;
- #102–#110: unit-preference rollout;
- #111 `35cc082094611abac9df7ad7b409d2e829cf6e3a`: locale-aware unit formatting.

Remaining:

- complete Russian/English translation for Home, Workouts, Nutrition, Progress, Exercise detail, Profile, Coach, release/update, loading, empty, and error copy;
- migrate remaining direct `Intl` and `toLocaleString` usage to the localization/unit formatting boundary;
- add pluralization API and real pluralized messages;
- test missing keys, interpolation, plural forms, and unsupported locales;
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
- Account & Security flows exist and are reachable from Profile.

Remaining:

- move Account & Security navigation into the dedicated Settings information architecture;
- Data & Sync status and recovery;
- Privacy disclosure and analytics consent when applicable;
- About: version, build, runtime, update/channel, support diagnostics, and legal links;
- specified workout preferences only after behavior is defined;
- implemented notification categories only;
- account-scoped preference policy and account-switching isolation tests;
- hide developer diagnostics from production users unless explicitly enabled by support mode.
