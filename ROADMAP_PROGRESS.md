# Smart Fitness Roadmap Progress

Updated: 2026-07-25

This is the canonical handoff document for continuing the current Smart Fitness roadmap in a new agent or chat session.

Read this file together with:

- `AGENTS.md`;
- `PROJECT_LEARNINGS.md`;
- `docs/implementation-plan.md`;
- `docs/nutrition-roadmap.md`;
- `docs/release/validation-record-2026-07-24.md`;
- `docs/release/rollout-and-rollback.md`;
- `docs/release/crash-reporting.md`;
- backend `hon4olo/smart-fitness-backend/AGENTS.md` when backend changes are required.

## Repositories

- Mobile: `hon4olo/smart-fitness-app`
- Backend: `hon4olo/smart-fitness-backend`
- Production API: `https://api.peptonio.com`

Always inspect the latest `main` and open pull requests in both repositories before changing code. Do not infer merge state from an earlier conversation summary.

## Working rules

- Continue the roadmap without asking for confirmation after every completed code slice.
- Use small focused branches and pull requests.
- Run full blocking CI before merge and merge only the exact green head.
- Preserve existing behavior unless the roadmap explicitly changes it.
- Keep every hand-written source file at or below 500 physical lines.
- Do not add Supabase, Firebase, a second backend, direct mobile model calls, or provider secrets in the mobile app.
- Do not perform OTA/EAS publish, native builds, device installation, backend deployment, staging credential activation, or production feature activation unless explicitly requested.
- New user-facing copy must use the localization layer after Phase I starts; do not continue expanding hardcoded screen copy.
- Privacy-sensitive health, nutrition, workout, limitation, authentication, or Coach content must not be added to analytics or crash telemetry.

## Overall completion

The core architecture, synchronization, Coach contracts, production backend, and repository CI are substantially complete at source-code level. The project is not yet considered release-complete because production observability, account lifecycle, localization, application settings, staged OTA validation, native builds, real-device testing, and second-device verification remain.

The remaining work is concentrated in:

1. release validation, crash observability, and safe OTA rollout;
2. account lifecycle, privacy-safe analytics, and user-visible sync status;
3. localization, units, accessibility, and a dedicated Settings experience;
4. cross-device Nutrition library synchronization;
5. visual regression coverage and long-term local-storage scalability.

## Completed foundation

### Architecture and documentation

- [x] Single Fastify/PostgreSQL backend established.
- [x] Mobile and backend agent instructions describe the current architecture.
- [x] Cross-repository implementation plan exists.
- [x] Changed-file and repository-wide 500-line audits are blocking in mobile CI.
- [x] Full mobile regression suite is blocking in CI.
- [x] A cross-repository fixed-SHA release-gate workflow exists.
- [x] Release validation evidence and rollout/rollback procedures are documented.

### Authentication and persistence

- [x] Native access and refresh tokens use Expo SecureStore.
- [x] Verified legacy AsyncStorage token migration exists.
- [x] Ordinary cached auth session is tokenless.
- [x] Critical local persistence mutations are serialized and observable.
- [x] Save and outbox failures expose retry controls.
- [x] Durable recovery journal restores failed outbox writes after restart.
- [x] Push and pull token-refresh behavior is covered by tests.

### Revision-aware synchronization

Implemented for:

- [x] weight history;
- [x] completed workout sessions and sets;
- [x] workout templates;
- [x] training programs;
- [x] food entries;
- [x] meal templates;
- [x] nutrition targets;
- [x] fitness profile;
- [x] user limitations;
- [x] recovery check-ins;
- [x] typed body measurements;
- [x] custom exercises.

Additional hardening:

- [x] malformed and unsupported remote entities fail closed;
- [x] cursor advancement requires every returned operation to be handled;
- [x] local mutations arriving while pull metadata loads are preserved;
- [x] deterministic two-device conflict coverage exists for every mutable policy;
- [x] update-versus-delete is covered in both directions;
- [x] duplicate remote delivery is idempotent after conflict resolution;
- [x] unresolved conflicts persist per user and recover after restart;
- [x] queue deduplication and idempotency protections exist.

### AI Coach

- [x] Deterministic Nutrition review.
- [x] Structured Nutrition Strategy preview and explicit confirmation.
- [x] Deterministic Strength review.
- [x] Structured Strength Strategy preview and explicit workout-template confirmation.
- [x] Deterministic Safety & Recovery review.
- [x] Pre-workout Safety acknowledgement and immutable completed-workout provenance.
- [x] Read-only Combined Coach review.
- [x] Versioned Combined Strategy proposal review.
- [x] Safety-adjusted effective Strength plan.
- [x] Conservative Nutrition reconciliation against Safety and effective training demand.
- [x] Separate explicit Combined Strength-template and Nutrition-target confirmations.
- [x] Revision-safe, idempotent Combined mutation application and interrupted-write recovery.
- [x] Provider-neutral backend model abstraction and capability gating.
- [x] Provider-neutral default model with optional Nutrition, Strength, and Combined overrides.
- [x] Domain guardrail repair/rejection and provider telemetry coverage.

### Major file decomposition

- [x] All tracked hand-written mobile files are at or below 500 physical lines.
- [x] `SyncCoordinator.ts` is a compatibility facade over focused modules.
- [x] `WorkoutTemplateSync.ts` is a compatibility facade over focused modules.
- [x] Large Coach view models, screens, styles, fixtures, and parsers are decomposed.
- [x] Backend Combined contract, summaries, evaluator, effective-Strength worker, and reconciliation worker remain separated.

## Remaining roadmap

### Phase A — sync conflict matrix

Status: complete.

### Phase B — oversized-file decomposition

Status: complete.

Generated files such as `package-lock.json` and `repomix-output.xml` remain excluded from the hand-written source limit.

### Phase C — staging model-provider activation

Status: source-code configuration and verification complete; protected staging activation remains external.

Required:

- [x] provider-neutral default Coach model with optional domain overrides;
- [ ] configure staging-only provider credentials on the backend;
- [x] verify Nutrition structured-output retry and guardrail rejection paths;
- [x] verify Strength structured-output retry and guardrail rejection paths;
- [x] persist latency, provider/model identifier, attempts, token usage, and validation failures;
- [x] confirm deterministic reviews work with model execution disabled;
- [x] confirm capability flags reflect actual runtime availability.

Completed provider slices:

- backend PR `#35`, merge `0618ffc4534f72120ed2861b929fbd5021276294`: provider-neutral configuration and model routing;
- backend PR `#36`, merge `1f295d8cc76ca4c3d53308929cc574dccf77fcc3`: bounded Nutrition and Strength repair/rejection tests;
- backend PR `#37`, merge `a15e751f4032f9dda1f88613523c3643ae56a8ec`: persisted rejection telemetry.

The remaining credential item requires protected environment values and an explicitly authorized smoke run. Never put provider credentials in mobile code or `EXPO_PUBLIC_*` variables.

### Phase D — Combined Strategy

Status: complete at source-code level.

Backend:

- [x] versioned Combined Strategy request/response contract;
- [x] eligible Nutrition and Strength child proposals composed with Safety context;
- [x] deterministic Safety restrictions and effective Strength load ceilings;
- [x] conservative Nutrition reconciliation with recovery and effective training-load context;
- [x] deterministic final guardrail;
- [x] persisted child run IDs, policy versions, validation reports, and application metadata;
- [x] capability schemas through v10;
- [x] explicit partial-failure and retry behavior;
- [x] automatic application disabled.

Mobile:

- [x] strict capability parsing through v10;
- [x] strict Combined result parsing through contract v3, with v1/v2 compatibility;
- [x] one Combined preview/application screen;
- [x] proposed, maximum allowed, and effective Strength loads displayed;
- [x] reconciliation decision, calorie delta, Safety multiplier, and training-load ratio validated;
- [x] blocking, input-required, modification, warning, and unresolved-movement states displayed;
- [x] separate explicit confirmation for every applying action;
- [x] revision-safe and idempotent application of confirmed mutations.

Latest Combined slices:

- backend PR `#39`, merge `a291293faabb97a6766a053482f9e22649fc2e6a`: Combined v2 and effective Strength plan;
- backend PRs `#40`–`#43`: separate Strength and Nutrition confirmation boundaries and capability schemas v8/v9;
- backend PR `#44`, merge `a4927c5c017a086cfa4787558fa1d37547336780`: conservative reconciliation worker;
- mobile PR `#85`, merge `2c0f8113358c0efacaf26bf8a57a37e718323ca4`: strict v3/v10 parsing, rendering, and confirmation gating;
- backend PR `#45`, merge `14b24e41f27266555230120f3b31d47b86795a73`: Combined v3 integration, capability v10, v2 confirmation compatibility, and reconciliation-gated Nutrition writes.

Combined never offers an aggregate apply operation. Effective Strength and Nutrition use separate routes, confirmation dialogs, idempotency identities, revisioned writes, metadata, and retry/recovery rules. Completed workout history remains immutable. A non-zero calorie delta is review-only until a separate deterministic energy-adjustment policy is approved.

### Phase E — release readiness

Status: production backend smoke passed; cross-repository, staging, native, OTA, offline-restart, and multi-device validation remain.

Required:

- [x] make backend production-config and migration validation blocking on current `main`;
- [x] make compiled production startup and local `/health` blocking in backend CI;
- [ ] run the cross-repository release gate successfully on fixed current mobile/backend SHAs;
- [ ] deploy and validate backend in staging;
- [ ] apply and verify migrations on staging PostgreSQL;
- [ ] verify `/health`, auth, sync push/pull, and Coach polling against staging;
- [ ] create matching native iOS and Android builds containing Expo SecureStore;
- [ ] run real-device smoke tests for workout, nutrition, progress, auth, sync, and Coach flows;
- [ ] test offline restart and queue recovery on device;
- [ ] test sign-in and synchronization on a second device/account runtime;
- [x] document rollout and rollback steps;
- [ ] publish OTA only to a compatible runtime/channel when explicitly requested.

Completed Phase E source/CI slices:

- backend PR `#46`, merge `c8cf3f848e9debacf5e12a105501f5ca8d5cbc96`: PostgreSQL 16, production config, initial/repeated migrations, migrated-schema integration, and full tests;
- backend PR `#47`, merge `bb9129ac6a4a3654f5c0d478a547d33fe5272b9a`: compiled production startup and `/health` gate;
- mobile PR `#88`, merge `92749354b5812fe95ba8b698f2f78c67231d6bb7`: optional `BACKEND_REPOSITORY_TOKEN` support for private backend checkout;
- production smoke: health, registration, auth, refresh, user profile, sync push/pull with `weightHistory`, idempotent replay, Coach capabilities, logout, and post-logout revocation passed without HTTP 5xx, backend exceptions, or PostgreSQL errors.

The combined gate remains blocked until the mobile repository receives a read-only Actions secret named `BACKEND_REPOSITORY_TOKEN` with access to `hon4olo/smart-fitness-backend`. This is an external repository-access configuration item. See `docs/release/validation-record-2026-07-24.md`.

### Phase F — Nutrition UX hardening

Status: source-code work complete; release-device and second-device validation remain. The main Nutrition diary screen remains unchanged.

Completed child-flow slices:

- [x] audit Nutrition routes, components, calculations, forms, empty states, destructive actions, and narrow-device layouts;
- [x] use a local calendar date instead of UTC fallback when opening Add Food without a date parameter;
- [x] display remote-provider calories and macros for the same serving shown in the result row;
- [x] parse decimal-comma quantities without truncating them;
- [x] reject zero, negative, blank, and non-numeric custom-food serving or nutrition values;
- [x] give custom-food fields persistent labels, stable two-column sizing, and main-screen card treatment;
- [x] keep the seven-column calendar grid stable on narrow iPhones;
- [x] require confirmation before deleting a diary entry or saved meal;
- [x] persist explicit local-catalog favorites in an anonymous device scope or a separate signed-in user scope;
- [x] stop treating recent foods as implicit favorites and allow removal directly from the Favorites tab;
- [x] render the portion editor in an accessible modal with bounded height, scrolling, keyboard avoidance, and safe-area padding;
- [x] add saved-meal detail, rename, and replace-from-current-diary actions;
- [x] debounce full provider search and autocomplete in one request cycle;
- [x] distinguish waiting, loading, empty, provider-error, and local-fallback states;
- [x] persist reusable custom foods in an account-scoped offline library;
- [x] persist provider-favorite snapshots for reuse without another provider lookup;
- [x] expose local favorites, provider favorites, and custom foods through one Favorites & My foods surface.

Latest Nutrition slices:

- mobile PR `#91`, merge `d1f4dd5c801c371b07da930623b6bcf86cbdcc7f`: child-flow bug and layout hardening;
- mobile PR `#92`, merge `b183daaba66a361d66e8f4822a27c43f8f0cdd60`: persistent account-scoped local favorites;
- mobile PR `#93`, merge `290face80038e33a35070b50618749877659e23e`: keyboard-safe portion editor;
- mobile PR `#94`, merge `9f4aab6a705f133055e63244515d546bbc2d80df`: saved-meal management, debounced search states, custom-food library, and provider-favorite snapshots.

Remaining validation:

- [ ] run the full Nutrition flow on a matching production-channel iPhone build;
- [ ] verify keyboard behavior on the smallest supported iPhone viewport;
- [ ] verify provider search during airplane mode, timeout, empty result, and recovery;
- [ ] verify anonymous-to-account and account-to-account library isolation;
- [ ] verify saved-meal rename/replacement synchronization on a second device;
- [ ] verify barcode permission denial, lookup failure, manual creation, and repeat scan.

Guardrails:

- do not modify `src/app/(tabs)/nutrition.tsx` or its diary presentation solely to complete Phase F;
- preserve offline-first food-entry and meal-template mutations;
- keep provider credentials and provider-specific authentication on the backend;
- keep Phase F source changes OTA-safe unless a later explicitly approved native requirement proves otherwise.

### Phase G — production observability and safe rollout

Priority: P0, required before a broad public beta.

Status: crash-reporting source foundation complete in mobile PR `#96`; external Sentry configuration, a new compatible native runtime, source-map verification, staged rollout, rollback rehearsal, and device validation remain.

- [x] add privacy-safe Sentry crash reporting for JS exceptions and native crashes, disabled in development and when no DSN is configured;
- [x] wire source maps for native builds and EAS Updates through the Sentry Expo plugin, Sentry Metro config, and an explicit update upload command;
- [x] attach app version, build number, runtime version, optional Git commit, EAS update ID/channel, masked route, sync status, inferred online state, and non-sensitive failure category;
- [ ] complete auth-refresh and API failure-category instrumentation; sync and persistence failures already report fixed safe categories without raw messages;
- [x] add a production Expo Router error boundary with retry, restart, and a stable support identifier;
- [x] define the crash-event privacy contract and native/update source-map verification procedure in `docs/release/crash-reporting.md`;
- [x] add blocking Expo Doctor validation for dependency and native-config changes;
- [ ] configure the Sentry project and EAS environment values, then inspect a sanitized test payload against the privacy contract;
- [ ] choose a new app/runtime version and create matching iOS and Android native builds before enabling Sentry-dependent JavaScript;
- [ ] define preview, internal-production, staged-production, and rollback release lanes;
- [ ] rehearse one preview OTA publish, device application, rollback, and post-rollback verification;
- [ ] document release promotion evidence: commit SHA, runtime, channel, update group, smoke results, rollout percentage, and rollback target;
- [ ] add a blocking release checklist for incompatible runtime/native changes;
- [ ] complete real-device smoke on a small iPhone, a standard iPhone, and an Android device before broad rollout.

### Phase H — account lifecycle, privacy, and data control

Priority: P0 for account deletion; remaining items are P1.

- [ ] add forgot-password and reset-password backend/mobile flows;
- [ ] add authenticated password change with session re-verification;
- [ ] add a sessions/devices screen with last-seen metadata;
- [ ] allow revoking one session and all other sessions;
- [ ] add in-app account deletion with explicit confirmation and re-authentication;
- [ ] cascade account deletion through user data, sessions, sync operations, Coach runs, templates, measurements, workouts, nutrition data, and custom entities;
- [ ] clear account-scoped local caches, tokens, pending queues, favorites, and custom-food libraries after deletion;
- [ ] add a privacy explanation for local data, synchronized data, telemetry, and model execution;
- [ ] add privacy-safe product analytics using action events only, never health values or content payloads;
- [ ] add analytics consent/opt-out where required by the chosen provider and release jurisdictions.

Data export is intentionally deferred and is not part of the current implementation roadmap.

### Phase I — localization, regional formats, units, and accessibility

Priority: P1, begin before hardcoded copy expands further.

- [ ] introduce a typed localization layer with stable message keys and namespace ownership by feature;
- [ ] make English the fallback locale and ship complete Russian and English translations first;
- [ ] add device-language detection and an explicit in-app language override;
- [ ] localize navigation labels, forms, validation, errors, empty states, destructive confirmations, Coach explanations, and release/update copy;
- [ ] format dates, times, decimal separators, plural forms, and number grouping through the selected locale;
- [ ] add metric/imperial unit preferences for kg/lb and cm/in with one canonical storage unit internally;
- [ ] evaluate kcal/kJ display as a separate nutrition preference while keeping canonical calorie calculations unchanged;
- [ ] prevent translated strings from being used as persisted identifiers, enum values, route parameters, or sync contract fields;
- [ ] add tests for missing keys, fallback behavior, interpolation, pluralization, and unsupported locales;
- [ ] add screenshot checks for Russian and English on narrow and wide devices;
- [ ] audit Dynamic Type, VoiceOver/TalkBack labels, contrast, Reduce Motion, focus order, and minimum touch targets;
- [ ] verify long translations do not clip workout tables, Nutrition rows, Coach cards, settings rows, or modal actions.

### Phase J — dedicated application Settings

Priority: P1.

Create a dedicated Settings surface rather than continuing to overload Profile.

Required sections:

- [ ] General: language, appearance, and regional/unit preferences;
- [ ] Appearance: System, Light, and Dark modes using the existing theme provider;
- [ ] Units: weight, body measurements, and optional energy display;
- [ ] Workout preferences: rest-timer sound, haptics, keep-screen-awake behavior, and default increments only after each behavior is explicitly specified;
- [ ] Notifications: show only implemented notification categories; do not expose inert toggles;
- [ ] Data & Sync: online/offline state, last successful sync, pending changes, failed mutation retry, and manual sync;
- [ ] Account & Security: profile, password, sessions/devices, logout, and account deletion;
- [ ] Privacy: analytics consent, crash-reporting disclosure, and local-versus-synced data explanation;
- [ ] About: app version, runtime version, update ID/channel, build number, legal links, and support diagnostics;
- [ ] Developer diagnostics must be hidden from ordinary users unless explicitly enabled in a non-production or support mode.

Settings implementation requirements:

- [ ] persist preferences account-scoped where they should follow the user and device-scoped where they are device behavior;
- [ ] define migration/default behavior for existing installs;
- [ ] apply setting changes immediately without requiring restart where technically safe;
- [ ] test logout/login account switching so preferences do not leak between accounts;
- [ ] keep unavailable settings out of the UI instead of showing disabled placeholders.

### Phase K — user-visible sync status and recovery

Priority: P1.

- [ ] add a clear data-status card showing synced, pending, offline, failed, and conflict states;
- [ ] show last successful sync and pending mutation count without exposing internal IDs;
- [ ] add manual retry and recovery actions for failed local persistence and outbox writes;
- [ ] distinguish local-only entities from entities synchronized to the account;
- [ ] surface unresolved conflicts with a safe explanation and deterministic resolution path;
- [ ] test offline edits, app termination, restart, token refresh, reconnect, and eventual synchronization;
- [ ] include runtime/update information in support diagnostics.

### Phase L — cross-device Nutrition library sync

Priority: P1 after current local library passes device smoke.

- [ ] add a revisioned sync entity for reusable custom foods and provider-favorite snapshots;
- [ ] preserve stable IDs, kind, normalized nutrition snapshot, attribution, provider/external IDs, revision, timestamps, and tombstones;
- [ ] keep local use immediate and offline-first;
- [ ] add create/update/delete conflict tests and idempotent replay;
- [ ] verify anonymous data does not silently merge into an account without an explicit product decision;
- [ ] verify provider favorites remain usable when the provider is unavailable;
- [ ] verify the library on a second signed-in device.

### Phase M — visual regression and release-device UX matrix

Priority: P1.

- [ ] establish reference screenshots for Home, Workouts hub, active workout, exercise picker, Nutrition diary, Add Food, portion editor, calendar, Progress, Profile, auth, Coach, and Settings;
- [ ] cover smallest supported iPhone, standard iPhone, large iPhone, and representative Android viewports;
- [ ] cover Light, Dark, English, Russian, large text, keyboard-open, loading, empty, error, and offline states;
- [ ] compare layout anchors, clipping, touch targets, column alignment, safe areas, and bottom navigation;
- [ ] keep screenshot review focused on meaningful diffs rather than brittle pixel noise;
- [ ] add a manual release-device checklist for camera permission, barcode failure, force-close recovery, OTA apply, and rollback.

### Phase N — privacy-safe product analytics

Priority: P1 after privacy choices are documented.

- [ ] define a minimal event taxonomy for onboarding completion, first workout, first food log, sync failure/recovery, Coach review, proposal confirmation, and OTA application;
- [ ] never include weight, measurements, calories, macros, limitations, exercise values, food names, email, tokens, or free-text Coach content;
- [ ] separate analytics identity from authentication tokens;
- [ ] support consent and account-deletion cleanup;
- [ ] create retention and funnel dashboards only after event contracts are reviewed;
- [ ] document event ownership, schema versioning, and removal policy.

### Phase O — Coach history and trust

Priority: P2.

- [ ] add a user-visible history of Coach reviews and proposals;
- [ ] show inputs used, deterministic rationale, policy version, validation result, and proposal status;
- [ ] show before/after values for confirmed changes;
- [ ] mark proposals stale when source revisions change;
- [ ] support an explicit compensating action to revert an applied change rather than mutating historical records;
- [ ] preserve immutable completed-workout and applied-proposal provenance.

### Phase P — local-storage scalability

Priority: P2; measure before migrating.

- [ ] instrument local state size, restore duration, save duration, entity counts, and failure rate without recording user content;
- [ ] define migration thresholds based on measured startup and write performance;
- [ ] keep the existing repository and sync contracts stable while storage evolves;
- [ ] migrate high-volume domains incrementally to SQLite only when measurements justify it;
- [ ] prefer food entries and workout sessions/sets as the first candidates;
- [ ] add migration, rollback, corruption-recovery, and interrupted-write tests.

### Deferred major scope

Do not begin these until P0 release work and the core P1 quality phases are complete:

- social feed and public profiles;
- trainer marketplace and paid coaching;
- subscriptions and payments;
- user-to-user chat;
- additional large AI product areas;
- broad redesigns of already stable primary screens;
- user data export.

## Recommended immediate next actions

1. Configure the Sentry project and EAS environment values, select a new app/runtime version, then verify native-build and EAS Update source maps on preview devices.
2. Implement in-app account deletion, then password reset and session management.
3. Define the localization architecture and Settings information architecture before adding more hardcoded copy.
4. Create matching native iOS and Android builds and run the production-channel device matrix.
5. Rehearse preview OTA application and rollback.
6. Complete auth-refresh and API failure-category instrumentation without raw payloads.
7. Configure read-only `BACKEND_REPOSITORY_TOKEN` and rerun the fixed-SHA cross-repository release gate.
8. Add cross-device Nutrition library sync after local device validation passes.
9. Add screenshot regression coverage and privacy-safe analytics after the privacy contract is documented.

## Validation expectations

For mobile TypeScript changes:

```bash
npx tsc --noEmit
npm test
```

For native dependency or Expo configuration changes:

```bash
npx expo-doctor
```

For backend changes, run the repository's blocking lint, build, test, production-configuration, migration, schema, startup, and health checks.

For localization changes, also run missing-key, fallback, interpolation, pluralization, and layout-screenshot checks.

For Settings changes, also test existing-install defaults, account switching, persistence scope, and immediate application.

Do not claim completion when CI is failing or when an external environment action has not actually been performed.

## New-chat starter prompt

> Continue the Smart Fitness roadmap. Read `AGENTS.md`, `PROJECT_LEARNINGS.md`, `ROADMAP_PROGRESS.md`, `docs/implementation-plan.md`, `docs/nutrition-roadmap.md`, and the release documents first. Inspect latest `main` and open PRs in both `hon4olo/smart-fitness-app` and `hon4olo/smart-fitness-backend`. Continue from the first unchecked code-verifiable item in `ROADMAP_PROGRESS.md`; note external credential, repository-access, deployment, native-build, device, and OTA blockers without inventing completion. Work in small focused PRs, run full blocking CI, merge only exact green heads, preserve existing behavior, and keep every hand-written source file at or below 500 lines. Do not perform OTA/EAS publish, native builds, device installation, backend deployment, staging credential activation, or production feature activation unless explicitly requested. After finishing a slice, update `ROADMAP_PROGRESS.md` and continue.
