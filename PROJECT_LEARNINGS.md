# Project Learnings

Reusable project-specific lessons and current constraints.

## Architecture

- The production backend is `hon4olo/smart-fitness-backend`; do not introduce Supabase or a parallel backend.
- Production API traffic uses `src/api/config.ts`, defaulting to `https://api.peptonio.com`.
- Shared user state goes through `src/context/AppContext.tsx`.
- Synchronization orchestration goes through `src/context/SyncContext.tsx` and `src/cloud/`.
- The app is offline-first. Preserve local mutations and extend synchronization through entity-specific adapters, revisions, idempotency, tombstones, and explicit conflict handling.
- The cross-repository execution plan is `docs/implementation-plan.md`.
- Avoid mixing demo data with user-created state.
- Do not add lab analysis, pharmacology logic, payments, social features, or marketplace functionality without explicit approval.

## Current synchronization coverage

Revisioned sync exists for:

- weight history;
- completed workout sessions and sets;
- custom workout templates;
- food entries;
- nutrition targets;
- fitness profiles;
- user limitations;
- recovery check-ins;
- typed body measurements;
- training programs;
- custom exercises;
- meal templates.

Custom exercises use stable UUID references across workouts, programs, sync, and Coach contexts. Meal templates synchronize strict reusable food snapshots independently from consumed diary entries.

Remaining work is hardening:

- extend or explicitly document restart recovery beyond the current weight-history journal;
- verify token refresh during push and pull;
- expand concurrent local-mutation / remote-materialization tests;
- complete two-device conflict coverage for every mutable synchronized entity;
- execute second-device and offline-restart validation on a matching standalone runtime.

Do not describe the project as weight-sync-only, and do not claim custom exercises or meal templates are local-only.

## Synchronization invariants

- Use stable IDs, ISO timestamps, schema versions, idempotency keys, and revision metadata.
- Read the stored cursor; revision zero is only the initial state.
- Every entity has an explicit adapter and parser. Never coerce unrelated entities into weight history.
- Advance the cursor only when every returned operation is supported and safely materialized.
- Critical mutations use the ordered observable mutation queue and expose persistence or outbox failures with retry controls.
- Keep authenticated user/device identity in the sync envelope or metadata, not inside strict entity payloads.
- Normalize persisted queue entries when outbound contracts change and regenerate idempotency keys only when required.
- Deterministic client errors in one queued operation must not block valid siblings.
- Isolate HTTP 400/422 and `SYNC_IDEMPOTENCY_KEY_REUSE` failures.
- Keep idempotency keys within the backend 255-character contract by hashing canonical operation content.
- Conflict policy keys must match actual entity names and aliases.
- Never render raw local/remote conflict versions, payloads, IDs, tokens, email, or full idempotency keys.
- Apply deterministic server-wins data before clearing its persisted conflict snapshot.
- Queue locking and deduplication do not make state persistence and outbox enqueue one atomic transaction.
- Save-succeeded/enqueue-failed paths must remain recoverable after restart and visible to the user.

## AI Coach

Required architecture:

`Orchestrator → typed Subagents → deterministic TypeScript Workers → Output Engine`.

Never implement AI Trainer as one monolithic prompt. Mobile calls only the Smart Fitness backend and never an LLM provider directly.

Implemented Coach surfaces include:

- deterministic Nutrition review and metrics;
- structured Nutrition Strategy preview and explicit confirmation;
- deterministic Strength review and structured Strategy preview;
- explicit workout-template confirmation;
- deterministic Safety & Recovery review;
- pre-workout Safety acknowledgement and immutable completed-workout provenance;
- read-only Combined Review;
- Combined Proposal with effective Safety-capped Strength;
- separate explicit Strength-template and Nutrition-target confirmations;
- immutable run history, provenance, before/after summaries, trust state, and privacy-safe input coverage.

Deterministic workers own authoritative calculations and hard limits: macro calories, BMR/TDEE when inputs are complete, tonnage, estimated 1RM, progression deltas, volume limits, and movement restrictions.

All structured outputs require versioned Zod schemas and fail-closed parsing. Retry loops are bounded. Persist versioned structured results and audit metadata, never hidden chain-of-thought.

Automatic application remains prohibited. Do not invent a client-only compensating revert; it requires an explicit backend/API ownership, revision, idempotency, conflict, and audit contract.

## API and authentication

- Use `EXPO_PUBLIC_API_BASE_URL` for environment-specific API hosts.
- `EXPO_PUBLIC_FOOD_API_BASE_URL` is only a legacy fallback.
- Feature modules must not hardcode backend hosts.
- Food-provider and AI-provider credentials remain backend-only.
- Ordinary cached auth-session storage contains no access or refresh tokens.
- Native access and refresh tokens use Expo SecureStore.
- Verified legacy token envelopes migrate once and are removed only after secure verification.
- SecureStore keys must be non-empty and contain only alphanumeric characters, `.`, `-`, and `_`.
- Web and non-native test runtimes intentionally use volatile in-memory token storage.
- `expo-secure-store` requires a matching native runtime before release.
- Provider capability is optional and backend-gated. Deterministic reviews remain available when it is disabled.
- Onboarding completion commits completion, profile inputs, initial weight, and derived targets in one observable state mutation.
- Repository write failures must reject; logging and resolving creates false-success navigation.

## Data readiness

- Workout analytics use normalized sessions and sets with canonical `exerciseId` values.
- Preserve `exerciseId` through active drafts, completed sessions, synchronization, and backend storage.
- Store target and actual RPE explicitly.
- Body measurements use typed metric, numeric value, unit, and ISO timestamp fields.
- Malformed legacy values fail closed rather than being guessed.
- Training programs preserve canonical workout-template references.
- Nutrition recommendations return `needs_input` when required profile fields are missing.
- Safety analysis uses explicit limitations and recovery check-ins; missing information remains unknown.

## Navigation

- Home → Start Workout and Workouts → Start Workout route to `/workout-session`.
- Active workout remains outside the tab group.
- Finish Workout saves and returns to Home.
- Cancel Workout returns without saving.
- Active workout state persists while editing adjacent screens.
- Do not show `(tabs)` as an iOS back label.
- Historical Safety metadata is immutable and must not be recalculated from current readiness.

## Nutrition

- Nutrition date navigation has previously been fragile. Avoid mutable `Date` bugs.
- Macro totals recalculate after food-weight changes.
- Food lists and meal history use vertical mobile layouts.
- Forms inside `ScrollView` use `keyboardShouldPersistTaps="handled"`.
- Search, autocomplete, barcode lookup, and custom barcode products use the shared API base URL.
- Meal-template sync is first-class; do not reintroduce local-only assumptions.

## Workouts

- Workout history refreshes after finishing a session.
- Preserve active workout state when editing adjacent screens.
- Do not break persistent bottom Cancel/Finish actions.
- Exercise picker data flows through `src/features/exercises` and stores canonical IDs.
- Exercise Library rows do not autoplay remote GIFs; animated playback belongs on the detail screen.
- Safety context on completed workouts records what the user saw before starting.
- Custom-exercise sync is first-class; preserve stable UUID references.

## Progress

- Extract focused cards, styles, and pure view models instead of extending large screens.
- Keep useful summaries visible and move or collapse heavy sections when needed.
- Safety analytics use immutable completed-workout metadata.
- Exclude stale/missing reviews from fresh readiness calculations.
- React list keys describe item identity, not displayed text.

## Localization and presentation

- Do not assume `Intl.PluralRules` is constructable in every Hermes runtime; retain deterministic English/Russian fallback logic.
- New user-facing copy uses the localization layer.
- Use central date, number, plural, and unit formatters.
- Keep canonical storage in `kg`, `cm`, and `kcal` while presenting selected units.
- Map statuses, enums, provider/backend failures, issue codes, and policy states through bounded display contracts.
- Never render raw `Error.message`, provider diagnostics, internal status codes, schema versions, or humanized identifiers to users.
- Keep repository source audits for button, Alert, Pressable, menu/tab/state, accessibility, raw-status, formatting, and unit boundaries active.

## Mobile layout

- Long screens need enough bottom padding for tab-bar overlap.
- Use safe-area insets where content or controls can overlap system UI.
- Avoid narrow text columns that wrap words letter-by-letter.
- Keep logically related text, inputs, toggles, icons, and values in one parent Flexbox layout.

## File size and CI

- Hand-written source files remain at or below 500 physical lines.
- Extract cohesive styles, components, hooks, parsers, contracts, or pure helpers.
- Do not replace one large file with a generic untestable abstraction.
- Generated files, lockfiles, generated migrations, and packed outputs are excluded.

Mobile CI is blocking for:

- repository and changed-file line limits;
- TypeScript;
- Coach and sync contracts;
- the complete regression suite;
- Expo export;
- Expo Doctor.

Green source CI does not replace physical release-device validation.

## Build and deployment

- Release iPhone builds must not depend on Metro.
- `developmentClient: true` intentionally opens the Expo development launcher.
- Normal standalone behavior requires an internal/preview/production profile without the development-client flag.
- OTA-safe changes are compatible JS, TS, TSX, and assets only.
- Native modules, Expo plugins, entitlements, Pods, runtime changes, or binary changes require a new native build.
- Keep Expo native modules on the same SDK patch set.
- A merge to `main` is not an OTA or device deployment.
- Never claim installation without an actual authorized publish/build/install action.
