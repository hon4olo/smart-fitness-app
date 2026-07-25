# Localization and Settings roadmap

Updated: 2026-07-25

## Localization and regional formatting

Status: English/Russian typed foundation, pluralization infrastructure, and the main unit-preference rollout are complete; full-screen translation, accessibility, and screenshot validation remain.

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
- locale-aware weight/length/energy formatter API in UnitPreferencesProvider;
- `Intl.PluralRules`-backed English/Russian pluralization helpers with one/few/many/other support and count interpolation.

Relevant mobile PRs:

- #100 `9c4b9437cbd99a399dbf7f4546501005d39e6b43`: localization and Settings foundation;
- #101 `72566ab50e4a5e3bd9fb710673fc8a119f6b453b`: auth/account localization;
- #102–#110: unit-preference rollout;
- #111 `35cc082094611abac9df7ad7b409d2e829cf6e3a`: locale-aware unit formatting;
- #113 `bfd64b6f8b3c99a927b7181eb0e7e7ee126b416f`: English/Russian pluralization helpers.

Remaining:

- complete Russian/English translation for Home, Workouts, Nutrition, Progress, Exercise detail, Profile, Coach, release/update, loading, empty, and error copy;
- migrate remaining direct `Intl` and `toLocaleString` usage to the localization/unit formatting boundary;
- adopt pluralization helpers in real count-dependent user-facing messages;
- extend missing-key, interpolation, plural-form, and unsupported-locale tests as catalogs grow;
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