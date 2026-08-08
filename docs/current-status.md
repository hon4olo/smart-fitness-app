# Smart Fitness Current Status

Updated: 2026-08-08

## Verified repository baseline

- Mobile repo: `ivangemini/smart-fitness-app`
- Mobile `main`: `2219213a9b1ba3800d10e343bebe7fad7b13080f` (PR #462 — RUI-3A)
- Active responsive branch: `ui/rui3-workout-creation` (RUI-3B)
- Backend repo: `ivangemini/smart-fitness-backend`
- Backend `main`: `431998bfa85bf169fd68e98a7e46651f70cfa2d9` (PR #196)
- Backend PR #197 is open and scoped to secure private export storage/delivery source contracts.

The earlier planning estimate of approximately **92% source-complete** applied to the roadmap before responsive UI remediation was promoted into an explicit phase. Release readiness remains lower because provider/staging/physical-device/production evidence is separately gated.

## Mobile source state

The current mobile source remains on the established architecture:

- authenticated app shell and session lifecycle;
- Home, Workouts, Nutrition, Progress and Profile flows;
- durable local ownership/state boundaries;
- backend sync across the current supported entity set;
- offline outbox/retry/idempotency/conflict handling;
- deterministic Coach surfaces and proposal/review boundaries;
- Social source boundaries and managed-media governance hooks;
- privacy/account-deletion UX foundations.

Responsive-UI packages change presentation/layout behavior only. They do not change routes, persistence schemas, synchronization contracts, calculations, workout ownership, completed workout history, or backend APIs.

## Responsive UI hardening

Canonical contract: `docs/architecture/responsive-mobile-ui.md`.

### RUI-1 — merged

PR #459 merged as `2ff71de222a0cc393ed41806978cce859c98b306`.

Delivered shared floating-tab/safe-area geometry, Nutrition/Profile/Coach clearance, Workouts sticky-action geometry, bounded text reflow and the initial responsive architecture contract.

Exact-head Mobile CI #1830 passed line audits, TypeScript, **1392/1392 regression tests**, expanded sync smoke, Expo export and Expo Doctor.

### RUI-2 — merged

PR #460 merged as `740ae06d24c895e882a37e715b59ce47e599ab5d`.

Delivered shared bottom clearance for Home/Progress, short-screen flex growth, bounded primary-tab text/layout behavior and one shared runtime geometry source for `LiquidGlassTabBar`.

Exact-head Mobile CI #1832 passed line audits, TypeScript, full regression suite, expanded sync smoke, Expo export and Expo Doctor.

### RUI-3A — merged

PR #462 merged as `2219213a9b1ba3800d10e343bebe7fad7b13080f`.

The audit found two concrete high-frequency failures:

- active set-table preferred width **358 px** exceeded the content width available on common narrow phones;
- Workout Session Finish used an independent fixed **176 px** reserve for an absolute footer whose height changes with safe area/localization/Dynamic Type.

RUI-3A delivered:

- responsive five-column set grid with 358 px retained as preferred maximum rather than required viewport width;
- proportional Previous/weight/reps compression while Set/completion controls remain bounded;
- automatic keyboard insets/dismissal for active-session inputs;
- two-line exercise names and bounded collapsed-set copy;
- usable header touch areas and shrinkable Finish/stat labels;
- `KeyboardAvoidingView` for Workout Session Finish;
- measured Finish footer height and scroll reservation from actual rendered height;
- bounded Finish header/info/integration/Save/Share copy;
- updated source contract protecting the responsive five-column grid.

Exact-head Mobile CI #1836 passed repository/changed-file line audits, TypeScript, **1392/1392 regression tests**, expanded sync smoke, Expo export and Expo Doctor.

### RUI-3B — current branch

The current `ui/rui3-workout-creation` package implements:

- Exercise Library keeps `FlatList` virtualization but measures its absolute Add footer instead of reserving `insets.bottom + 128`;
- Exercise Library gets keyboard-aware search scrolling, two-line names and bounded Details/Add labels;
- Program workout picker replaces an unbounded `.map()` collection with a bounded `FlatList`;
- New Routine gets automatic keyboard insets/dismissal, flex-growing scroll content, bounded header/actions and two-line exercise names;
- New Routine exercise picker replaces a `ScrollView` rendering up to 100 exercises with `FlatList` virtualization while preserving add/replace semantics;
- Workout Builder gets keyboard-aware scrolling and bounded header/workout/action text;
- workout editor modal keeps existing keyboard avoidance and adds automatic scroll insets plus a wrapping header/action row;
- workout builder exercise action controls can wrap under localization/text-size pressure;
- Program Detail gets only the required long-name/Add Routine/toast hardening because its safe-area/scroll architecture was already sound;
- Exercise Detail was audited and already has safe-area scrolling, bounded content width and a two-line title, so no unrelated redesign was added.

RUI-3B requires exact-head Mobile CI before merge. Physical narrow/short-device, keyboard, large-text and real safe-area proof remains separate runtime evidence.

### Remaining responsive UI packages

- **RUI-4:** auth, onboarding, settings and Nutrition forms; keyboard reachability, short-height scrolling and action reachability.
- **RUI-5:** remaining secondary Coach/Social/Progress surfaces.
- **RUI-6:** focused automated guardrails for proven responsive failure patterns after remediation stabilizes.

## Backend P9-D progress through #196

Backend PRs #192–#196 substantially advanced P9-D.

### #192 — export audit/idempotency contract

Added:
- canonical request fingerprinting;
- optional strict bounded idempotency keys;
- account-scoped SHA-256 key identity rather than raw-key persistence;
- committed-response-loss replay;
- same-key/different-request conflict;
- bounded secret-free audit metadata.

### #193 — durable audit/idempotency persistence

Added:
- `data_access_export_requests`;
- migration `0038`;
- owner FK with `ON DELETE CASCADE`;
- account-scoped keyed uniqueness;
- owner-scoped repository reads;
- concurrency-safe create/replay/conflict handling;
- database constraints and privacy inventory classification.

No production migration was executed.

### #194 — preparation → durable audit integration

The explicitly composed `/v1/privacy/data-access/export/prepare` route now:

1. requires authentication;
2. strictly validates the body;
3. validates optional `Idempotency-Key`;
4. consumes the configured attempt guard;
5. freshly re-verifies the current password;
6. constructs bounded audit metadata;
7. durably creates/replays/conflicts;
8. still returns fail-closed export availability.

No audit write occurs before successful password re-verification.

New/replayed requests still end `409 DATA_EXPORT_NOT_AVAILABLE`. Same-key/different-request is bounded `DATA_EXPORT_IDEMPOTENCY_CONFLICT`; audit persistence failure is bounded `DATA_EXPORT_AUDIT_UNAVAILABLE`.

### #195 — bounded audited assembly execution

Added source-only execution over the seven complete candidate projections:

- accepts audited metadata rather than arbitrary public input;
- hard maximum **8 MiB** serialized `json_v1` output;
- exact UTF-8 byte accounting;
- callers may lower but never raise the ceiling;
- invalid limit/notice-only surface fails before loading;
- loader/contract/serialization/oversize failures return no assembly or partial projection payload.

This executor is deliberately not invoked by `/prepare` yet.

### #196 — deterministic JSON artifact generation

Added in-memory source-only artifact generation from a successful bounded execution result:

- fixed filename `smart-fitness-data-export.json`;
- media type `application/json`;
- exact UTF-8 bytes of the measured assembly;
- regenerated byte length must equal execution measurement;
- lowercase SHA-256 digest of exact bytes;
- fail-closed invalid execution, serialization failure and size mismatch;
- artifact metadata excludes owner IDs, request references, request/key hashes, password, reusable authorization, object keys and delivery credentials.

The artifact bytes are sensitive user export content and must not be logged.

## Seven complete candidate export projections

1. `profile_and_account_metadata`
2. `workouts_programs_and_exercises`
3. `nutrition_and_meal_data`
4. `progress_measurements_and_weight`
5. `limitations_recovery_and_safety_context`
6. `coach_reviews_proposals_and_run_history`
7. `social_relationships_and_account_activity`

Received Social notifications remain excluded. Managed media and sync/operational metadata remain notice-only.

## Current P9-D fail-closed boundary

Despite the source progress, export is **not product-available**:

- default backend `createApp()` does not compose the optional export route;
- `/prepare` does not invoke assembly execution or artifact generation;
- preparation remains `DATA_EXPORT_NOT_AVAILABLE`;
- no cross-surface PostgreSQL snapshot is claimed;
- no large-account pagination/chunking exists;
- no artifact persistence/database row exists;
- no object-storage write exists;
- no status/download route exists;
- no expiring/revocable download authorization exists;
- no mobile export UI exists;
- no storage/provider environment is activated.

Backend PR #197 remains the separate source-contract package for private export storage/delivery semantics. Do not overlap or activate provider/storage infrastructure implicitly from mobile UI work.

## Remaining roadmap concentration

### Responsive mobile UI

RUI-1, RUI-2 and RUI-3A are merged. RUI-3B is the current exact-head validation package. RUI-4 is next, followed by RUI-5/RUI-6.

### P9-D

Continue the separately reviewed secure storage/delivery source contract without provider activation, then address storage persistence/routes/UI only through explicit bounded packages.

### P9-B3

Exact provider/environment retention evidence remains externally blocked until a real environment is selected and can prove maximum lifetime, access, deletion/expiry, failure monitoring and account-deletion behavior.

### P9-C

Analytics/crash/performance/attribution/advertising collection remains disabled. Consent/policy/provider evidence must be complete before activation.

### P9-A

Physical-device, production-scheme/native, OTA/EAS, rollback and release evidence remain authorization-gated.

## Validation/evidence state

RUI-1 PR #459 passed exact-head Mobile CI #1830.

RUI-2 PR #460 passed exact-head Mobile CI #1832.

RUI-3A PR #462 passed exact-head Mobile CI #1836: line audits, TypeScript, 1392/1392 regression tests, expanded sync smoke, Expo export and Expo Doctor.

RUI-3B exact-head Mobile CI is pending on the current branch.

Backend PRs #192, #194, #195 and #196 passed exact-head Backend CI (lint, Prettier, TypeScript build, production-config validation and full test suite).

Backend PR #193 passed exact-head Backend CI, Backend PostgreSQL CI and Account Deletion Receipt CI. PostgreSQL CI applied the complete migration chain twice and validated the migrated schema. The standalone `tests/data-access-export-request-postgres.test.ts` file was added as focused evidence, but the existing PostgreSQL workflow does not directly enumerate that new file; do not falsely claim that specific standalone file ran in CI.

CI does not replace physical-device responsive validation.

## Actions not performed

No backend deployment, production migration execution, provider activation, production data access, object-storage write, public/default export-route activation, OTA/EAS publication, native build/install, credential/DNS change, destructive production cleanup or store submission was performed by these responsive UI packages.
