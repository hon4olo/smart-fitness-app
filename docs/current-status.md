# Smart Fitness Current Status

Updated: 2026-08-08

## Verified repository baseline

- Mobile repo: `ivangemini/smart-fitness-app`
- Mobile `main` at responsive-UI branch start: `60edb23de9cab90bbc4d4e23466a481bef2b94e6` (PR #458)
- Responsive UI branch: `ui/responsive-layout-foundation`
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

The current responsive-UI package changes presentation/layout behavior only. It does not change routes, persistence schemas, synchronization contracts, calculations, workout ownership, completed workout history, or backend APIs.

## Responsive UI hardening — RUI-1

A focused responsive contract now lives at `docs/architecture/responsive-mobile-ui.md`.

The initial audit found that many primary surfaces already use `useSafeAreaInsets()`, but bottom navigation clearance was represented inconsistently by independent screen-local values.

Observed pre-package patterns included:

- Home, Progress, Coach and Profile independently using `safeAreaInsets.bottom + 120`;
- Nutrition reserving only `insetsBottom + 24` below its virtualized diary list;
- Workouts combining `BottomTabInset`, an additional fixed `+84`, and a separately inset absolute footer;
- several text-heavy horizontal rows without explicit shrink behavior.

RUI-1 currently implements:

- shared floating-tab bottom-clearance calculation in `src/components/navigation/floatingTabBarLayout.ts`;
- focused unit coverage for safe-area, minimum offset, sticky-action and invalid-input cases;
- Nutrition diary clearance based on floating-tab geometry;
- Coach and Profile bottom clearance based on the same helper rather than independent `+120` constants;
- Workouts Start/Resume sticky action positioned above actual safe-area + floating-tab clearance;
- scroll content reservation so the Workouts sticky action cannot hide the final content;
- bounded `flexShrink`/wrapping improvements on touched text-heavy surfaces;
- `flexGrow: 1` on touched bounded scroll containers where short-screen reachability requires it.

No blanket prohibition on fixed component dimensions was introduced. Fixed icon/control/tab geometry remains valid when it is part of the component contract rather than a device-specific positioning hack.

### Remaining responsive UI packages

- **RUI-2:** Home and Progress primary-tab clearance/text-pressure cleanup, plus runtime re-check of Nutrition and Workouts.
- **RUI-3:** active Workout Session, finish flow, New Routine, Workout Builder, Program Detail, Exercise Library/detail; focus on keyboard overlap, set-table compression, sticky actions and long names.
- **RUI-4:** auth, onboarding, settings and Nutrition forms; focus on keyboard reachability, short-height scrolling and action reachability.
- **RUI-5:** remaining secondary Coach/Social/Progress surfaces.
- **RUI-6:** focused automated guardrails for proven responsive failure patterns after the remediation inventory stabilizes.

Physical narrow/short-device, large-text, keyboard and real safe-area evidence remains separate from source/CI validation.

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

Backend PR #197 is the active separately reviewed source-contract package for private export storage and delivery semantics. Do not overlap or activate provider/storage infrastructure implicitly from mobile UI work.

## Remaining roadmap concentration

### Responsive mobile UI

RUI-1 is implemented on the current branch and requires exact-head CI plus review. RUI-2/RUI-3 are the next high-frequency mobile UI packages; RUI-4/RUI-5/RUI-6 follow as bounded remediation packages.

### P9-D

Continue the separately reviewed secure storage/delivery source contract without provider activation, then address storage persistence/routes/UI only through explicit bounded packages.

### P9-B3

Exact provider/environment retention evidence remains externally blocked until a real environment is selected and can prove maximum lifetime, access, deletion/expiry, failure monitoring and account-deletion behavior.

### P9-C

Analytics/crash/performance/attribution/advertising collection remains disabled. Consent/policy/provider evidence must be complete before activation.

### P9-A

Physical-device, production-scheme/native, OTA/EAS, rollback and release evidence remain authorization-gated.

## Validation/evidence state

Backend PRs #192, #194, #195 and #196 passed exact-head Backend CI (lint, Prettier, TypeScript build, production-config validation and full test suite).

Backend PR #193 passed exact-head Backend CI, Backend PostgreSQL CI and Account Deletion Receipt CI. PostgreSQL CI applied the complete migration chain twice and validated the migrated schema. The standalone `tests/data-access-export-request-postgres.test.ts` file was added as focused evidence, but the existing PostgreSQL workflow does not directly enumerate that new file; do not falsely claim that specific standalone file ran in CI.

RUI-1 source validation is not yet complete until its exact branch/PR head passes Mobile CI. CI does not replace physical-device responsive validation.

## Actions not performed

No backend deployment, production migration execution, provider activation, production data access, object-storage write, public/default export-route activation, OTA/EAS publication, native build/install, credential/DNS change, destructive production cleanup or store submission was performed by this responsive UI package.
