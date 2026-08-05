# Smart Fitness App

Expo / React Native client for Smart Fitness.

## Current foundation

- Offline-first local `AppState` persisted through AsyncStorage.
- Focused state boundaries for production consumers; the full compatibility `AppContext` is internal only.
- Native access and refresh tokens stored through Expo SecureStore.
- Authenticated revision-aware synchronization with explicit conflicts, tombstones, idempotency, restart recovery, and bounded diagnostics.
- Deterministic and structured Nutrition, Strength, Safety & Recovery, and Combined Coach flows.
- Explicit confirmation before any Coach proposal changes user data.
- Provider-neutral mobile code; food, model, moderation, media, and other provider credentials remain backend-only.

## Synchronization coverage

First-class synchronization exists for:

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
- meal templates;
- account-scoped Nutrition library items.

Physical standalone validation for offline termination/restart, reconnect, recovery, and second-device conflicts remains separate from source-level test coverage.

## Documentation

Start with:

- [Agent instructions](AGENTS.md)
- [Project context](docs/project-context.md)
- [Current status](docs/current-status.md)
- [Latest handoff](docs/handoffs/latest.md)
- [Cross-repository implementation plan](docs/implementation-plan.md)
- [Architecture index](docs/architecture/README.md)
- [Project learnings](PROJECT_LEARNINGS.md)

Focused architecture, privacy, QA, roadmap, and release evidence remains under `docs/`.

## Run

```bash
npm install
npx expo start
```

## API configuration

Set `EXPO_PUBLIC_API_BASE_URL` for the backend. Production defaults to `https://api.peptonio.com`.

`EXPO_PUBLIC_FOOD_API_BASE_URL` is a backwards-compatible fallback only where already supported.

Do not add FatSecret, model-provider, moderation-provider, storage-provider, or other service credentials to Expo environment variables. The app consumes normalized backend DTOs and never calls those providers directly.

## Release boundary

A merge to `main` is not an OTA, native build, device installation, backend deployment, or production activation. Native dependency, plugin, entitlement, Pod, runtime, or binary changes require a matching native build.
