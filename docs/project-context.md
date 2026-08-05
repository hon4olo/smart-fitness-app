# Smart Fitness Project Context

Updated: 2026-08-05

## Purpose

Smart Fitness is an offline-first fitness application covering workouts, nutrition, progress, profile/authentication, synchronization, and deterministic structured AI Coach workflows.

Repositories:

- mobile: `hon4olo/smart-fitness-app`;
- backend: `hon4olo/smart-fitness-backend`;
- production API: `https://api.peptonio.com`.

This file is stable orientation context. Mutable execution state belongs in `docs/current-status.md`; detailed roadmap state belongs in `docs/implementation-plan.md`.

## Product surfaces

The mobile application currently contains:

- Home;
- Workouts and active workout logging;
- Nutrition diary, targets, reusable meals, and saved library items;
- Progress and measurements;
- Profile, authentication, Data & Sync, and privacy-facing controls;
- Nutrition, Strength, Safety & Recovery, and Combined Coach surfaces.

Excluded unless explicitly approved:

- blood-test analysis;
- diagnosis;
- pharmacology, hormone, SARM, or medication dosing;
- marketplace;
- social-network product surfaces;
- payments and subscriptions.

## Mobile architecture

- Expo SDK 56, React Native, Expo Router, and TypeScript.
- One authoritative internal `AppState` is persisted through AsyncStorage.
- Production screens consume focused state boundaries rather than the full compatibility `useAppContext` hook.
- Ordered observable mutations protect critical persistence paths.
- Native access and refresh tokens use Expo SecureStore.
- API access is centralized under `src/api/`.
- Synchronization orchestration lives in `src/context/SyncContext.tsx` and `src/cloud/`.

The accepted local architecture remains a single persisted `AppState` snapshot. SQLite is not an approved migration without new measured evidence.

## Backend authority

The backend is the only server authority for:

- authentication and account ownership;
- authoritative revisions and idempotency;
- synchronized conflicts and tombstones;
- Coach orchestration and confirmation;
- provider access and secrets;
- Social and managed-media authority;
- privacy, retention, deletion, and export source controls.

Mobile must not call food, model, moderation, classifier, OCR, storage, email, or other providers directly.

## Synchronization model

Revisioned synchronization exists for:

- weight history;
- completed workout sessions and sets;
- custom workout templates;
- food entries;
- nutrition targets;
- fitness profiles;
- user limitations;
- recovery check-ins;
- body measurements;
- training programs;
- custom exercises;
- meal templates;
- Nutrition library items.

Core invariants:

- stable entity IDs;
- schema-versioned payloads;
- ISO timestamps;
- per-operation idempotency;
- authoritative server revisions;
- explicit tombstones;
- validated pull materialization;
- persisted unresolved conflicts;
- cursor advancement only after safe handling;
- explicit restart recovery for save/enqueue gaps.

Source-level hardening is complete for the current contracts. Matching standalone-runtime and physical second-device validation remains outstanding.

## AI Coach model

Required architecture:

```text
Fastify route
→ Orchestrator
→ typed specialized Subagents
→ deterministic TypeScript Workers / Validation
→ Output Engine
→ PostgreSQL / Drizzle
```

Implemented user-facing categories:

- deterministic Nutrition review;
- Nutrition Strategy proposal and confirmation;
- deterministic Strength review;
- Strength Strategy proposal and confirmation;
- deterministic Safety & Recovery review;
- Combined Review;
- Combined Proposal with Safety-capped effective Strength;
- separate explicit application paths;
- run history, provenance, trust state, and privacy-safe coverage.

Automatic application is prohibited. Hidden chain-of-thought is not stored.

## Social, media, and private state

Private fitness state uses revisioned synchronization.

Social and managed media are separate server-authoritative domains and must not be inserted into private `AppState` synchronization by default.

Provider-backed capabilities remain disabled or fail closed until configuration, policy, infrastructure, deployment, and evidence requirements are explicitly satisfied.

## Documentation hierarchy

Use this order when statements conflict:

1. exact code, migrations, schemas, tests, and current Git history;
2. `docs/implementation-plan.md`;
3. `docs/current-status.md`;
4. focused architecture, privacy, operations, QA, and release documents;
5. `docs/project-context.md`;
6. `PROJECT_LEARNINGS.md`;
7. old PR descriptions, chat summaries, and historical notes.

Permanent agent rules belong in `AGENTS.md`. The latest restart checkpoint belongs in `docs/handoffs/latest.md`.

## Change discipline

A pull request that changes architecture, synchronization coverage, roadmap state, active blockers, or deployment boundaries must update the corresponding documentation in the same change.

Do not create a second broad overview when a current canonical file already covers the subject. Add a focused document or update the architecture index instead.
