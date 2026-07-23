# Smart Fitness App — Agent Instructions

## Project

This repository contains the React Native / Expo mobile client for the Smart Fitness product.

Current product scope:
- workout tracking;
- nutrition tracking;
- progress tracking;
- profile and authentication;
- offline-first local persistence;
- revision-aware synchronization with the production backend;
- deterministic and structured AI Coach review flows.

Do not expand the product beyond the user's current task.

## Connected backend

The production backend is a separate repository:

- repository: `hon4olo/smart-fitness-backend`
- production API: `https://api.peptonio.com`
- stack: Node.js 22, TypeScript, Fastify, PostgreSQL, Drizzle ORM, Zod, Pino, Docker Compose

Do not introduce Supabase, Firebase, or a second backend. Do not claim that the project has no backend.

## Mobile stack

- Expo SDK 56
- React Native
- Expo Router
- TypeScript
- AsyncStorage for offline-first application state and queues
- production backend through `src/api/`
- dark minimal UI

Main application state lives in `src/context/AppContext.tsx`.
Synchronization orchestration lives in `src/context/SyncContext.tsx` and `src/cloud/`.

## Current implementation status

### Revisioned sync already implemented

The mobile client currently has entity-specific revisioned sync for:
- weight history;
- completed workout sessions and sets;
- custom workout templates;
- food entries;
- nutrition targets;
- fitness profile;
- user limitations;
- recovery check-ins.

Remaining sync work includes:
- typed body measurements;
- training programs as their own synchronized entity;
- meal templates;
- custom exercises;
- stronger observable local-persistence and outbox failure handling.

Do not describe synchronization as weight-only and do not route unrelated entities through the weight adapter.

### AI Coach already implemented

The codebase already supports:
- deterministic Nutrition review and metrics;
- structured Nutrition Strategy preview and explicit confirmation;
- structured Strength Strategy preview and explicit workout-template confirmation;
- deterministic Safety & Recovery review;
- pre-workout Safety acknowledgement and immutable workout provenance;
- read-only Combined Coach review.

A provider-backed model is capability-gated by the backend. The mobile client must remain provider-neutral.
Full Combined proposal composition is not complete until the backend capability and a strict mobile parser/UI are merged.

### Known hardening work

Still required:
- move access and refresh tokens to platform secure storage;
- stop duplicating tokens inside the ordinary AsyncStorage session envelope;
- make critical persistence and enqueue failures observable instead of fire-and-forget;
- finish normalization of body measurements and units;
- finish remaining entity sync contracts.

Moving tokens to secure storage adds a native Expo dependency and therefore requires a new matching native build/runtime. Do not label that change OTA-only.

## AI Trainer architecture

AI Trainer functionality must not be implemented as one monolithic LLM prompt.

Required backend architecture:

```text
Fastify endpoint
→ Orchestrator
→ narrowly scoped typed Subagents
→ deterministic TypeScript Workers / Validation
→ Output Engine
→ PostgreSQL through Drizzle ORM
```

Required subagent roles:
- Nutrition Agent
- Strength & Volume Agent
- Safety & Recovery Agent

All subagent outputs must use strictly typed, versioned Zod schemas / structured outputs.

LLMs must not perform authoritative calculations or enforce hard safety limits. Deterministic TypeScript workers own:
- BMR and TDEE calculations when inputs are complete;
- macro calories using `4 * protein + 4 * carbs + 9 * fat`;
- tonnage and volume;
- estimated 1RM;
- progression deltas;
- exercise and limitation restrictions;
- maximum permitted training-volume changes;
- final hard guardrail approval.

The mobile app must never call an LLM provider directly and must never contain provider secrets. It calls only the Smart Fitness backend.

The authoritative design document is in the backend repository at `docs/architecture/ai-coach.md`.

## Required workflow

Before code changes:
1. Locate the repository root.
2. Read `AGENTS.md` once per working session.
3. Read `PROJECT_LEARNINGS.md`.
4. For bug fixes or failed validation, read `DEBUGGING_SKILL.md` if present.
5. Inspect current `main` because concurrent work may have landed.
6. Read only files relevant to the task unless the user requests a repository-wide review.
7. Make small, targeted changes and preserve existing behavior.

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

## File-size policy

Hand-written source files should not exceed 500 physical lines.

Rules:
- when touching a hand-written file already over 500 lines, include a focused extraction when it can be done safely;
- extract cohesive components, hooks, styles, parsers, or pure helpers into the existing feature folder;
- keep every newly created hand-written file at or below 500 lines;
- run independent extractions in parallel branches when they do not touch the same files;
- do not create broad abstractions merely to reduce line count;
- generated or machine-maintained files such as lockfiles, migrations generated by tooling, and `repomix-output.xml` are excluded from this limit;
- preserve public behavior and add tests when logic moves.

## Scope rules

Do not add these unless explicitly requested:
- blood-test analysis;
- diagnosis logic;
- pharmacology or hormone protocols;
- supplement dosing logic;
- coach marketplace;
- social-network features;
- payments or subscriptions.

Backend work must use the existing `smart-fitness-backend` architecture.

## API rules

Use shared API configuration from `src/api/config.ts`.

Production default:
- `https://api.peptonio.com`

Preferred public environment variable:
- `EXPO_PUBLIC_API_BASE_URL`

`EXPO_PUBLIC_FOOD_API_BASE_URL` is only a backwards-compatible fallback. Do not create feature-specific hardcoded hosts.

Secrets must never use `EXPO_PUBLIC_*` and must never be committed. Food-provider and AI-provider credentials remain backend-only.

## Data and synchronization rules

The app is offline-first. Local mutations must remain usable without a network connection.

When adding or changing cloud sync:
- use stable entity IDs;
- use ISO timestamps;
- keep payloads schema-versioned;
- enqueue mutations through the existing operation queue;
- preserve idempotency keys and revision metadata;
- never silently overwrite unresolved conflicts;
- validate remote payloads at the trust boundary;
- never replace the full local state with an unvalidated response;
- test round-trip, deletion, duplicate delivery, offline queueing, and conflicts;
- advance the sync cursor only after all returned operations are safely handled.

Critical mutations must not rely on unobserved `void repository.saveState(...)` or `void enqueue(...)` calls once the relevant persistence flow is hardened.

## Coding rules

Prefer minimal diffs.

Do:
- keep TypeScript strict-compatible;
- use existing UI components before creating new ones;
- keep local mutations offline-capable;
- add explicit types for new data;
- keep persisted data serializable;
- include stable IDs and ISO `createdAt` / `updatedAt` timestamps where appropriate;
- keep calculations in pure functions;
- validate network and storage data at trust boundaries.

Do not:
- refactor unrelated code;
- rename files unless required;
- change routing unless required;
- install dependencies without task approval;
- move all state to the backend in one change;
- duplicate API clients;
- call AI providers from the mobile client;
- modify formatting across unrelated files.

## UI rules

Follow the existing dark minimal style.

Prefer:
- clean cards;
- readable typography;
- simple spacing;
- mobile-first layouts;
- vertical lists for food entries, workout history, and records.

Use existing components where possible:
- `AppCard`
- `AppButton`
- `MetricCard`
- `SectionHeader`

Mobile layout rules:
- account for bottom-tab overlap;
- use `useSafeAreaInsets` on long scrollable screens;
- provide sufficient `paddingBottom`;
- use `keyboardShouldPersistTaps="handled"` on forms;
- avoid overcrowded horizontal rows and narrow text columns.

Text and its logically related toggle, icon, chevron, checkmark, input, or value must be siblings in one parent Flexbox container. The parent owns alignment and spacing. Do not position related controls independently with screen-relative coordinates or pixel nudges.

## Navigation invariants

Do not break:
- Home → Start Workout → `/workout-session`
- Workouts → Start Workout → `/workout-session`
- Finish Workout → save session and return to Home
- Cancel Workout → return to Home without saving
- active workout resume after leaving the session screen

The workout session remains outside the tab group.

## Git and deployment

For approved changes:
1. branch from the latest `main`;
2. make minimal changes;
3. run relevant validation;
4. open a PR;
5. merge only the exact validated head when mergeable.

Use `[ota]` only for OTA-safe JavaScript, TypeScript, TSX, or compatible asset changes.

Native dependency, Expo plugin, entitlement, Info.plist, Pod, runtime-version, or binary changes require a new native build and must not be represented as OTA-only.

Do not state that a change is installed on the phone unless an EAS/native build or OTA publish was actually performed.

## Current priority order

1. Keep architecture and project documentation synchronized with the actual implementation.
2. Move auth tokens to platform secure storage in a coordinated native-build change.
3. Make critical local persistence and outbox operations observable and ordered.
4. Finish remaining revisioned sync entities one at a time.
5. Normalize body measurements and units.
6. Complete Combined proposal review capability, strict mobile parsing, and read-only proposal UI.
7. Continue decomposing audited hand-written files until all are at or below 500 lines.
8. Add education, lab tracking, marketplace, social, and payments only when explicitly prioritized.
