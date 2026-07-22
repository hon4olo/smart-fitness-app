# Project Learnings

Reusable project-specific lessons and known pitfalls.

## Architecture

- The production backend already exists in `hon4olo/smart-fitness-backend`; do not introduce Supabase or a parallel backend.
- Production mobile API traffic should use the shared base URL configuration in `src/api/config.ts`, defaulting to `https://api.peptonio.com`.
- Shared user state should go through `src/context/AppContext.tsx` when multiple tabs need the same data.
- The app is offline-first: preserve local mutations and add synchronization incrementally through queues, revisions, and idempotency.
- Current cloud synchronization is incomplete. Weight history has the most developed path; do not assume all AppState entities are cloud-backed.
- Avoid mixing demo data with user-created state unless explicitly requested.
- Do not introduce AI APIs, lab tracking, pharmacology logic, payments, or social features without explicit approval.

## AI Trainer

- Required architecture: `Orchestrator → typed Subagents → deterministic TypeScript Workers → Output Engine`.
- Never implement the AI Trainer as one monolithic prompt.
- The mobile client must call only the Smart Fitness backend and must never call an LLM provider directly.
- All subagent outputs require versioned Zod schemas / structured outputs.
- Deterministic workers own authoritative calculations: macro calories, BMR/TDEE calculations, tonnage, estimated 1RM, progression deltas, and hard safety limits.
- Run deterministic metrics before LLM interpretation where possible.
- The Safety & Recovery Agent reviews validated Nutrition and Strength proposals; final approval still belongs to deterministic guardrails.
- Retry loops must be bounded and return typed failure states after the final invalid attempt.
- Persist structured outputs, schema/prompt/policy versions, validation reports, latency, and token usage. Do not persist hidden chain-of-thought.
- Build and test the orchestrator with fixture/mock agents before adding a real model provider.
- The first real AI vertical slice should be Nutrition; Strength follows after workout sets, RPE, and exercise IDs are reliably synchronized.

## API and authentication

- Use `EXPO_PUBLIC_API_BASE_URL` for environment-specific API hosts.
- `EXPO_PUBLIC_FOOD_API_BASE_URL` exists only as a backwards-compatible fallback and should not be used for new configuration.
- Feature modules must not hardcode their own backend hosts.
- FatSecret and future AI provider credentials belong only in backend environment variables.
- Access and refresh tokens currently use the common storage abstraction; production hardening should move sensitive tokens to platform secure storage in a native-build change.

## Synchronization

- Use stable IDs, ISO timestamps, entity schema versions, idempotency keys, and explicit revision metadata.
- Do not always pull from revision zero once revision persistence is available.
- Do not coerce all remote entities into `weightHistory`; map each synchronized entity through an explicit adapter.
- Add synchronization one entity at a time with round-trip, offline queue, duplicate delivery, conflict, and deletion tests.
- Target order: weight history → workout sessions/sets → food entries/targets → measurements → programs/templates → recovery/profile data.
- Fire-and-forget persistence or enqueue calls can hide failures; critical mutations need observable queue/persistence error handling.

## Data readiness for AI

- Workout analytics require normalized workout sessions, exercises, and sets rather than relying only on a generic JSON payload.
- Preserve canonical `exerciseId` values through active drafts, saved sessions, synchronization, and backend storage.
- Store target and actual RPE explicitly on workout sets.
- Body measurements should use typed measurement kind, numeric value, unit, and timestamp rather than only free-form label/value strings.
- Nutrition recommendations must return `needs_input` when required profile fields are missing instead of inventing age, sex, activity, or body-composition inputs.
- Safety analysis requires explicit limitations/injuries and recovery check-ins; absence of data must be represented as unknown.

## Navigation

- Home → Start Workout and Workouts → Start Workout must route to `/workout-session`.
- Active workout session should stay outside the tab group.
- Finish Workout should save the session and return to Home.
- Cancel Workout should return to Home without saving.
- Do not show `(tabs)` as an iOS back label.

## Nutrition

- Nutrition date navigation has previously been fragile. Avoid mutable Date bugs.
- Macro totals must recalculate after food weight changes.
- Food entries and meal/history lists should prefer vertical mobile layouts rather than cramped horizontal rows.
- Forms should use `keyboardShouldPersistTaps="handled"` when inside `ScrollView`.
- Food search, autocomplete, barcode lookup, and custom barcode products should all use the same shared API base URL.

## Workouts

- Workout history must refresh after finishing a workout session.
- Preserve active workout flow when editing workout-related screens.
- Do not break persistent bottom actions on the workout session screen.
- Exercise catalog data is only user-visible when the active workout exercise picker loads through `src/features/exercises` repository and stores canonical `exerciseId` values in the active draft.
- Exercise Library rows must not autoplay remote GIF thumbnails; keep animated playback on the detail screen to avoid release-device memory pressure.

## Progress

- Progress screens can become large. Prefer extracting focused components when a screen grows too much.
- Keep latest summary cards visible when useful and collapse heavier sections if the screen becomes crowded.

## Mobile layout

- Long scrollable screens need enough bottom padding to avoid tab bar overlap.
- Use `useSafeAreaInsets` where bottom controls or long scroll content can overlap system UI.
- Avoid narrow text columns that wrap words letter-by-letter.
- Keep logically related text, inputs, toggles, icons, and values in a shared parent layout rather than positioning them independently.

## Build and deployment

- Release iPhone builds should not depend on Metro.
- OTA-safe changes are JS / TS / TSX / compatible assets-only changes.
- Use `[ota]` in commit messages only for OTA-safe changes.
- Installed release/OTA builds run with `__DEV__` false; internal-only runtime behavior needs an explicit non-secret public flag, not a dev-mode check.
- Before re-enabling JS that imports new native modules, bump the app/runtime version, create a new native iOS build, and publish OTA bundles only to the matching runtime/channel.
- Expo native modules must stay on the same SDK patch set. Dyld symbol errors between modules such as `ExpoCamera`, `ExpoImage`, and `ExpoModulesCore` indicate ABI drift; run `npx expo install --fix`, verify `npx expo-doctor`, then regenerate iOS and pods cleanly before a native build.
