# Smart Fitness App

Expo React Native client for the Smart Fitness product.

## Current foundation

- Offline-first local `AppState` persisted through AsyncStorage.
- Authenticated backend synchronization with revisioned operations and conflict handling.
- Normalized sync support for weight history, workout sessions, food entries, nutrition targets, and fitness profiles.
- Deterministic Strength Coach and Nutrition Coach preview flows backed by the private Fastify API.
- Explicit, revision-safe confirmation before a validated Nutrition Coach proposal can change a target.

## Fitness profile synchronization

The local profile remains immediately usable offline. When an authenticated sync runs, the client maps legacy UI fields into a versioned `fitnessProfiles` full snapshot with a deterministic profile ID. Server revisions and the last accepted snapshot are stored separately from `AppState` so remote pull can be applied without generating a second local outbox operation.

The authoritative AI Coach profile fields are:

- date of birth;
- calculation sex used only by deterministic energy formulas;
- height;
- goal and target weekly weight-change rate;
- activity level;
- training experience;
- training days per week;
- target weight.

Missing fields remain nullable. The backend readiness worker returns `needs_input`; it must not infer them through an LLM.

## Run

```bash
npm install
npx expo start
```

## API configuration

Set `EXPO_PUBLIC_API_BASE_URL` for the backend. The older food-specific variable may remain as a compatibility fallback only where already supported.

Do not add FatSecret, model-provider, or other service credentials to Expo environment variables. Provider credentials live only in `smart-fitness-backend`; the app consumes normalized backend DTOs and never calls those providers directly.
