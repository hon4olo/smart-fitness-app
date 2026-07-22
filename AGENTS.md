# Smart Fitness App — Agent Instructions

## Project

This repository contains the React Native / Expo mobile client for the Smart Fitness product.

Current product scope:
- workout tracking;
- nutrition tracking;
- progress tracking;
- profile and authentication;
- offline-first local persistence;
- incremental synchronization with the production backend.

Do not expand the product beyond the user's current task.

## Connected backend

The production backend already exists in a separate repository:

- repository: `hon4olo/smart-fitness-backend`
- production API: `https://api.peptonio.com`
- stack: Node.js 22, TypeScript, Fastify, PostgreSQL, Drizzle ORM, Zod, Pino, Docker Compose

The mobile client already contains foundations for:
- backend food search and barcode lookup;
- authentication and profile requests;
- access/refresh tokens;
- an offline operation queue;
- cloud synchronization.

Do not introduce Supabase or a second backend. Do not claim that the project has no backend.

## Mobile stack

- Expo SDK 56
- React Native
- Expo Router
- TypeScript
- AsyncStorage for offline-first local state and operation queues
- production backend through `src/api/`
- dark minimal UI

Main application state currently lives in:
- `src/context/AppContext.tsx`

Current backend integration is incomplete. Weight history has the most developed sync path; other entities are still primarily local. Preserve offline behavior while expanding synchronization incrementally.

## AI Trainer architecture

AI Trainer functionality must not be implemented as one monolithic LLM prompt.

The required backend architecture is:

```text
Fastify endpoint
→ Orchestrator
→ narrowly scoped Subagents
→ deterministic TypeScript Workers / Validation
→ Output Engine
→ PostgreSQL through Drizzle ORM
```

Required subagent roles:
- Nutrition Agent
- Strength & Volume Agent
- Safety & Recovery Agent

All subagent outputs must use strictly typed Zod schemas / structured outputs.

LLMs must not be trusted to perform authoritative calculations or enforce hard safety limits. Deterministic TypeScript workers must calculate or validate:
- BMR and TDEE inputs/results;
- macro calories using `4 * protein + 4 * carbs + 9 * fat`;
- tonnage and volume;
- estimated 1RM;
- progression deltas;
- configured exercise and injury restrictions;
- maximum permitted changes in training volume.

The mobile app must never call an LLM provider directly and must never contain provider API secrets. It calls only the Smart Fitness backend.

Do not add a real AI provider until the data contracts, sync foundation, deterministic workers, mocked orchestration pipeline, logging, and retry behavior are in place.

The authoritative design document belongs in the backend repository at:
- `docs/architecture/ai-coach.md`

## Required workflow

Before code changes:
1. Locate the repository root.
2. Read `AGENTS.md` once per working session.
3. Read `PROJECT_LEARNINGS.md` if it exists.
4. For bug fixes or failed validation, use `DEBUGGING_SKILL.md` if it exists.
5. Read only files relevant to the task unless the user explicitly requests a repository-wide review.
6. Make small, targeted changes.
7. Preserve existing working features.

After TypeScript / TSX changes, run:

```bash
npx tsc --noEmit
npm test
```

For native dependency or Expo configuration changes, also run:

```bash
npx expo-doctor
```

Do not claim completion unless validation passes or the blocker is clearly stated.

## Scope rules

Do not add these unless explicitly requested:
- AI provider calls;
- blood test analysis;
- diagnosis logic;
- pharmacology or hormone protocols;
- supplement dosing logic;
- coach marketplace;
- social network features;
- payments or subscriptions;
- new native dependencies.

Backend work is allowed only when it uses the existing `smart-fitness-backend` architecture. Do not create Supabase schemas, Firebase services, or a parallel backend.

## API rules

Use the shared API configuration from:
- `src/api/config.ts`

Production default:
- `https://api.peptonio.com`

Preferred public environment variable:
- `EXPO_PUBLIC_API_BASE_URL`

`EXPO_PUBLIC_FOOD_API_BASE_URL` is accepted only as a temporary backwards-compatible fallback. Do not create feature-specific hardcoded backend hosts.

Secrets must never use `EXPO_PUBLIC_*` and must never be committed. FatSecret and future AI provider credentials live only in backend environment variables.

## Data and synchronization rules

The app is offline-first. Local mutations must remain usable without a network connection.

When adding cloud synchronization:
- use stable entity IDs;
- use ISO timestamps;
- keep serialized payloads versionable;
- enqueue mutations through the existing operation queue pattern;
- preserve idempotency keys and revision metadata;
- do not silently overwrite unresolved conflicts;
- do not replace the entire local state with an unvalidated remote payload;
- add one entity type at a time with tests.

Target entities for incremental sync:
1. weight history;
2. workout sessions and sets;
3. food entries and nutrition targets;
4. body measurements;
5. training programs and templates;
6. recovery check-ins and fitness profile data.

## Key routes and files

Root/layout:
- `src/app/_layout.tsx`
- `src/app/(tabs)/_layout.tsx`

Main screens:
- `src/app/(tabs)/index.tsx`
- `src/app/(tabs)/workouts.tsx`
- `src/app/(tabs)/nutrition.tsx`
- `src/app/(tabs)/progress.tsx`
- `src/app/(tabs)/profile.tsx`
- `src/app/workout-session.tsx`

Shared architecture:
- `src/context/AppContext.tsx`
- `src/context/SyncContext.tsx`
- `src/api/`
- `src/auth/`
- `src/cloud/`
- `src/repositories/`
- `src/storage/`
- `src/types/`

## Coding rules

Prefer minimal diffs.

Do:
- keep TypeScript strict-compatible;
- use existing UI components before creating new ones;
- keep local mutations offline-capable;
- add clear TypeScript types for new data;
- keep data serializable;
- include stable IDs for user-created records;
- include `createdAt` and `updatedAt` where appropriate;
- keep domain calculations in pure functions;
- validate network responses at trust boundaries.

Do not:
- refactor unrelated code;
- rename files unless required;
- change routing unless required;
- install dependencies without approval;
- move all state to the backend in one change;
- duplicate API clients or hardcode feature-specific hosts;
- call AI providers from the mobile client;
- modify formatting across unrelated files.

## UI rules

Follow the existing dark minimal style.

Prefer:
- clean cards;
- readable text;
- simple spacing;
- mobile-first layouts;
- vertical list layouts for food entries, workout history, and records.

Use existing components where possible:
- `AppCard`
- `AppButton`
- `MetricCard`
- `SectionHeader`

Mobile layout rules:
- account for bottom tab bar overlap;
- use `useSafeAreaInsets` on long scrollable screens;
- give `ScrollView` enough `paddingBottom`;
- use `keyboardShouldPersistTaps="handled"` on forms;
- avoid overcrowded horizontal rows;
- avoid narrow text columns that wrap words letter-by-letter.

Semantic layout rule:
Text and its logically related accessory—toggle, icon, chevron, checkmark, input, or value—must be siblings inside one parent Flexbox container. The parent owns alignment and spacing. Do not use screen-relative coordinates, absolute positioning, or independent pixel nudges for related elements.

## Navigation rules

Expected routes:
- Home: `/`
- Workouts: `/workouts`
- Nutrition: `/nutrition`
- Progress: `/progress`
- Profile: `/profile`
- Active workout session: `/workout-session`

The workout session screen is outside the tab group and should open as a stack screen.

Do not break:
- Home → Start Workout → `/workout-session`
- Workouts → Start Workout → `/workout-session`
- Finish Workout → save session and return to Home
- Cancel Workout → return to Home without saving

## Large screen policy

Large screens should not grow indefinitely. Prefer extracting focused components and pure state helpers into existing feature folders. Do not create large abstractions before a real second use case exists.

## Git and deployment

For approved code changes:
1. Make minimal changes.
2. Run relevant validation.
3. Commit changes.
4. Push to `main` unless the user requests another workflow.

Use `[ota]` only for OTA-safe changes:
- JavaScript;
- TypeScript;
- TSX;
- assets-only changes that do not require a new native runtime.

Native dependency, Expo plugin, entitlement, Info.plist, Pod, or binary changes require a new native build and must not be represented as OTA-only.

## Current implementation order

1. Stabilize workout and nutrition UX.
2. Keep auth and food backend integration reliable.
3. Complete revision-aware offline sync, one entity at a time.
4. Normalize workout sets and RPE data for analytics.
5. Add fitness profile, limitations, and recovery inputs.
6. Add deterministic analytics and validation workers on the backend.
7. Add a mocked AI Coach orchestrator pipeline.
8. Connect the Nutrition Agent as the first real structured-output LLM vertical slice.
9. Add Strength & Volume Agent after sufficient workout history exists.
10. Add Safety & Recovery review and the combined AI Trainer output engine.
11. Add education, lab tracking, marketplace, social, and payments only when explicitly prioritized.
