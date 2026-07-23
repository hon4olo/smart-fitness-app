# Project Learnings

Reusable project-specific lessons and known pitfalls.

## Architecture

- The production backend is `hon4olo/smart-fitness-backend`; do not introduce Supabase or a parallel backend.
- Production API traffic uses `src/api/config.ts`, defaulting to `https://api.peptonio.com`.
- Shared user state goes through `src/context/AppContext.tsx`; synchronization orchestration goes through `src/context/SyncContext.tsx` and `src/cloud/`.
- The app is offline-first. Preserve local mutations and extend cloud synchronization through entity-specific adapters, revisions, idempotency, tombstones, and explicit conflict handling.
- Avoid mixing demo data with user-created state unless explicitly requested.
- Do not add lab analysis, pharmacology logic, payments, social features, or marketplace functionality without explicit approval.

## Current synchronization coverage

Revisioned sync currently exists for:
- weight history;
- completed workout sessions and sets;
- custom workout templates;
- food entries;
- nutrition targets;
- fitness profile;
- user limitations;
- recovery check-ins.

Still local-only or incomplete:
- typed body measurements;
- training programs as a synchronized entity;
- meal templates;
- custom exercises;
- atomic or observable persistence-plus-outbox behavior for all critical mutations.

Do not describe the project as weight-sync-only, but also do not assume every `AppState` field is cloud-backed.

## AI Trainer

- Required architecture: `Orchestrator → typed Subagents → deterministic TypeScript Workers → Output Engine`.
- Never implement the AI Trainer as one monolithic prompt.
- The mobile client calls only the Smart Fitness backend and never an LLM provider directly.
- All subagent outputs require versioned Zod schemas and strict parsing.
- Deterministic workers own authoritative calculations and hard limits: macro calories, BMR/TDEE, tonnage, estimated 1RM, progression deltas, volume limits, and movement restrictions.
- Retry loops are bounded and end in typed failure states.
- Persist structured outputs, schema/prompt/policy versions, validation reports, latency, token usage, and snapshot hashes where relevant. Do not persist hidden chain-of-thought.

Implemented Coach slices:
- deterministic Nutrition metrics/review;
- structured Nutrition Strategy preview and explicit confirmation;
- structured Strength Strategy preview and explicit workout-template confirmation;
- deterministic Safety & Recovery review;
- pre-workout Safety acknowledgement and immutable completed-workout provenance;
- read-only Combined Coach review.

Full Combined proposal composition still requires an exposed backend capability and strict mobile parser/UI. Do not infer capability support from schema version alone.

## API and authentication

- Use `EXPO_PUBLIC_API_BASE_URL` for environment-specific API hosts.
- `EXPO_PUBLIC_FOOD_API_BASE_URL` is only a backwards-compatible fallback.
- Feature modules must not hardcode backend hosts.
- Food-provider and AI-provider credentials remain backend-only.
- Access and refresh tokens currently pass through the common storage abstraction and are also represented in the cached auth session. Production hardening must move tokens to platform secure storage and remove ordinary-storage duplication.
- Adding `expo-secure-store` is a native runtime change: validate with Expo Doctor and produce a new matching native build before using it in released code.

## Synchronization

- Use stable IDs, ISO timestamps, schema versions, idempotency keys, and explicit revision metadata.
- Read the stored sync cursor; revision zero is only the initial state, not a permanent pull value.
- Every synchronized entity needs an explicit adapter and parser. Never coerce unrelated entities into weight history.
- Add one entity at a time with round-trip, offline queue, duplicate delivery, conflict, malformed payload, and deletion tests.
- Advance the cursor only when every returned operation is supported and safely materialized.
- Fire-and-forget `repository.saveState()` or enqueue calls can hide data loss. Critical mutations need observable sequencing and error handling.
- Queue mutation locking and deduplication protect the queue itself, but do not make application-state persistence and outbox enqueue atomic.

## Data readiness

- Workout analytics use normalized sessions and sets with canonical `exerciseId` values.
- Preserve `exerciseId` through active drafts, saved sessions, synchronization, and backend storage.
- Store target and actual RPE explicitly.
- Body measurements still require migration from free-form `label` / `value` strings to typed kind, numeric value, unit, and ISO timestamp.
- Nutrition recommendations return `needs_input` when required profile fields are missing rather than inventing age, sex, activity, or body-composition inputs.
- Safety analysis uses explicit limitations and recovery check-ins; missing information remains unknown.

## Navigation

- Home → Start Workout and Workouts → Start Workout route to `/workout-session`.
- Active workout session remains outside the tab group.
- Finish Workout saves and returns to Home.
- Cancel Workout returns without saving.
- Do not show `(tabs)` as an iOS back label.
- Workout history and detail screens display immutable historical Safety metadata and must not recalculate current readiness.

## Nutrition

- Nutrition date navigation has previously been fragile. Avoid mutable `Date` bugs.
- Macro totals recalculate after food-weight changes.
- Food lists and meal history should use vertical mobile layouts rather than cramped rows.
- Forms inside `ScrollView` use `keyboardShouldPersistTaps="handled"`.
- Search, autocomplete, barcode lookup, and custom barcode products share the same API base URL.

## Workouts

- Workout history refreshes after finishing a session.
- Preserve active workout state when editing adjacent screens.
- Do not break persistent bottom Cancel/Finish actions.
- Exercise picker data flows through `src/features/exercises` and stores canonical exercise IDs.
- Exercise Library rows do not autoplay remote GIFs; animated playback belongs on the detail screen to limit release-device memory pressure.
- Safety context stored on a completed workout is an immutable record of what the user saw before starting, not a current recommendation.

## Progress

- Progress screens grow quickly. Extract focused cards, styles, and pure view models instead of extending one screen indefinitely.
- Keep useful summary cards visible and collapse or move heavy sections when necessary.
- Safety analytics use immutable completed-workout metadata and must exclude stale/missing reviews from fresh status calculations.

## Mobile layout

- Long scrollable screens need enough bottom padding to avoid tab-bar overlap.
- Use `useSafeAreaInsets` where long content or controls may overlap system UI.
- Avoid narrow text columns that wrap words letter-by-letter.
- Keep logically related text, input, toggle, icon, and value elements in one parent layout rather than positioning them independently.

## File size

- Hand-written source files should remain at or below 500 physical lines.
- When touching an oversized file, extract cohesive styles, components, hooks, parsers, or pure helpers when safe.
- Keep every new hand-written file at or below 500 lines.
- Independent file splits may run in parallel branches if they do not overlap.
- Lockfiles, generated migrations, and packed outputs such as `repomix-output.xml` are excluded.
- Do not replace one oversized file with an untestable generic abstraction.

## Build and deployment

- Release iPhone builds must not depend on Metro.
- OTA-safe changes are compatible JS, TS, TSX, and assets-only changes.
- Use `[ota]` only for OTA-safe changes.
- Native module, Expo plugin, entitlement, Pod, runtime-version, or binary changes require a new native build.
- Before enabling JavaScript that imports a new native module, bump or align the runtime, create a new native build, and publish only to the matching channel.
- Expo native modules must remain on the same SDK patch set. Dyld symbol failures usually indicate ABI drift; run `npx expo install --fix`, `npx expo-doctor`, and regenerate native projects/pods before rebuilding.
- A merge to `main` is not an OTA or device deployment. Never claim installation unless publishing/building actually occurred.
