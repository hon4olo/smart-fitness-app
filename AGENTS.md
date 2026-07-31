# Smart Fitness App — Agent Instructions

## Project

This repository is the Expo / React Native mobile client for Smart Fitness.

Current approved scope:

- workout tracking;
- nutrition tracking;
- progress tracking;
- profile and authentication;
- offline-first local persistence;
- revision-aware synchronization with the production backend;
- deterministic and structured AI Coach flows.

Do not expand the product beyond the user's current task.

## Connected backend

Use the existing backend only:

- repository: `hon4olo/smart-fitness-backend`;
- production API: `https://api.peptonio.com`;
- stack: Node.js 22, TypeScript, Fastify, PostgreSQL, Drizzle ORM, Zod, Pino, Docker Compose.

Do not introduce Supabase, Firebase, a second backend, or direct provider calls from mobile.

## Mobile stack and boundaries

- Expo SDK 56;
- React Native and Expo Router;
- TypeScript;
- AsyncStorage for offline-first application state and queues;
- Expo SecureStore for native access and refresh tokens;
- shared backend API through `src/api/`;
- dark minimal UI.

Main application state lives in `src/context/AppContext.tsx`.
Synchronization orchestration lives in `src/context/SyncContext.tsx` and `src/cloud/`.
The cross-repository execution plan is `docs/implementation-plan.md`.

## Current implementation status

### Revisioned synchronization

First-class revisioned sync is implemented for:

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
- custom exercises with stable UUID references;
- meal templates with strict nested food snapshots.

Do not describe synchronization as weight-only and do not route unrelated entities through the weight adapter.

Remaining synchronization work is hardening rather than adding those entities:

- extend or explicitly document durable restart recovery beyond the current weight-history journal;
- verify token refresh during push and pull;
- expand concurrent local-mutation / remote-materialization coverage;
- complete two-device conflict coverage and physical second-device validation.

Critical local persistence is ordered and observable through the application mutation queue. Save and outbox failures are surfaced with retry controls. Application-state persistence and outbox enqueue are not one atomic transaction, so recovery semantics must remain explicit and tested.

### AI Coach

Implemented product surfaces include:

- deterministic Nutrition review and metrics;
- structured Nutrition Strategy preview and explicit confirmation;
- deterministic Strength review and structured Strategy preview;
- explicit workout-template confirmation;
- deterministic Safety & Recovery review;
- pre-workout Safety acknowledgement and immutable workout provenance;
- read-only Combined Review;
- Combined Proposal with effective Safety-capped Strength;
- separate explicit Strength-template and Nutrition-target confirmations;
- strict parsing, revisioned writes, idempotency, and no automatic application.

A provider-backed model is capability-gated by the backend. Mobile remains provider-neutral and never contains provider secrets.

Do not invent a client-only compensating revert. A safe revert requires an explicit backend/API contract covering ownership, revisions, idempotency, conflicts, and audit history.

### Authentication, persistence, and CI

The mobile client already:

- stores native access and refresh tokens in Expo SecureStore;
- migrates verified legacy token envelopes into secure storage;
- keeps ordinary cached session storage tokenless;
- uses volatile token storage for web and non-native test runtimes;
- serializes critical local persistence mutations;
- surfaces persistence and outbox failures with retry controls.

`expo-secure-store` is a native dependency. A matching native runtime is required before release.

Mobile CI blocks on:

- repository and changed-file line limits;
- TypeScript;
- Coach and sync contract tests;
- the complete regression suite;
- Expo export;
- Expo Doctor.

No currently known tracked hand-written mobile source file exceeds 500 physical lines. Keep the blocking audit active.

## Required workflow

Before code changes:

1. Inspect exact current `main` in both repositories.
2. Inspect open pull requests.
3. Read this file once per working session.
4. Read `PROJECT_LEARNINGS.md`.
5. Read `docs/implementation-plan.md` for roadmap work.
6. Read `DEBUGGING_SKILL.md` for failures or regressions when present.
7. Read only files relevant to the bounded task.
8. Work from a clean branch based on exact current `main`.

After TypeScript / TSX changes, authoritative validation is the full Mobile CI workflow. Locally, when available, run:

```bash
npx tsc --noEmit
npm test
```

Do not claim completion while CI is failing. Merge only the exact validated head.

## File-size policy

Hand-written source files must remain at or below 500 physical lines.

- Extract cohesive components, hooks, styles, parsers, contracts, or pure helpers.
- Do not create generic abstractions only to reduce line count.
- Keep every new hand-written file below the limit.
- Preserve public behavior and tests when moving logic.
- Generated files, lockfiles, generated migrations, and packed outputs are excluded.

## Scope exclusions

Do not add without explicit approval:

- blood-test analysis;
- diagnosis logic;
- pharmacology or hormone protocols;
- supplement dosing logic;
- coach marketplace;
- social-network features;
- payments or subscriptions.

## API and security rules

Use shared API configuration from `src/api/config.ts`.

- Preferred public variable: `EXPO_PUBLIC_API_BASE_URL`.
- Production default: `https://api.peptonio.com`.
- `EXPO_PUBLIC_FOOD_API_BASE_URL` is only a backwards-compatible fallback.
- Secrets must never use `EXPO_PUBLIC_*` or be committed.
- Food-provider and AI-provider credentials remain backend-only.
- Never put tokens, email, raw health data, payloads, or full idempotency keys in telemetry or user-visible diagnostics.

## Synchronization rules

The app is offline-first. Preserve local usability without a network connection.

When changing sync:

- use stable entity IDs and ISO timestamps;
- keep payloads schema-versioned;
- enqueue through the existing operation queue;
- preserve idempotency keys and revision metadata;
- validate all remote payloads at the trust boundary;
- never replace full local state with an unvalidated response;
- never silently overwrite unresolved conflicts;
- advance the cursor only after every returned operation is safely handled;
- test round-trip, deletion, duplicate delivery, offline queueing, restart recovery, and conflicts.

Critical mutations must use the ordered observable mutation flow. Do not reintroduce unobserved `void repository.saveState(...)` or `void enqueue(...)` calls.

## AI Trainer architecture

AI Trainer must not become one monolithic prompt.

Required backend shape:

```text
Fastify endpoint
→ Orchestrator
→ narrowly scoped typed Subagents
→ deterministic TypeScript Workers / Validation
→ Output Engine
→ PostgreSQL through Drizzle ORM
```

Required subagent roles:

- Nutrition Agent;
- Strength & Volume Agent;
- Safety & Recovery Agent.

All subagent outputs use strictly typed, versioned Zod schemas. Deterministic TypeScript workers own authoritative calculations and hard safety limits. Hidden chain-of-thought is never persisted.

## Coding and UI rules

Prefer minimal diffs. Preserve routes, IDs, schemas, persistence, sync, calculations, polling, idempotency, confirmations, and completed history unless the task explicitly changes them.

Do:

- keep TypeScript strict-compatible;
- use existing UI components;
- keep calculations in pure functions;
- keep persisted data serializable;
- localize new user-facing copy;
- use bounded display mappings for statuses, enums, provider errors, and internal codes;
- use centralized locale/date/number/unit formatters.

Do not:

- refactor unrelated code;
- change routing without need;
- install dependencies without approval;
- duplicate API clients;
- call AI providers from mobile;
- expose raw backend/provider/status/error text in presentation.

UI invariants:

- preserve the existing dark minimal style;
- account for bottom-tab and safe-area overlap;
- use `keyboardShouldPersistTaps="handled"` on scrollable forms;
- keep logically related text and controls as siblings in one Flexbox parent;
- do not position related controls using screen-relative coordinates or pixel nudges.

## Navigation invariants

Do not break:

- Home → Start Workout → `/workout-session`;
- Workouts → Start Workout → `/workout-session`;
- Finish Workout → save session and return to Home;
- Cancel Workout → return without saving;
- active workout resume after leaving the session screen.

The workout session remains outside the tab group.

## Git and deployment

For approved changes:

1. branch from exact current `main`;
2. make a bounded change;
3. run full blocking CI;
4. inspect review threads;
5. merge only the exact green head.

Use `[ota]` only for OTA-safe JavaScript, TypeScript, TSX, or compatible assets.

Do not perform or claim OTA publication, EAS/native builds, device installation, backend deployment, staging activation, production activation, or credential changes unless explicitly requested.

## Current priority order

1. Keep architecture and status documents synchronized with actual code.
2. Complete sync and persistence hardening: restart recovery, token refresh, concurrent materialization, and conflict coverage.
3. Add user-visible Data & Sync recovery only through safe bounded contracts.
4. Introduce provider-neutral Coach model configuration and validate it in staging when credentials are available.
5. Implement only confirmed Combined/revert contract gaps; do not duplicate completed proposal and confirmation flows.
6. Configure the fixed-SHA cross-repository release gate.
7. Complete physical release-device, offline-restart, accessibility, and second-device validation.
8. Add education, lab tracking, marketplace, social, and payments only when explicitly prioritized.
