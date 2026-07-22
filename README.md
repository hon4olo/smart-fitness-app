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

The Profile tab includes a dedicated Coach profile editor with strict date, age, height, and enum validation. Saving updates only local `AppState`; the normal sync coordinator detects the changed normalized snapshot and queues it. Missing fields remain nullable until the user provides them. The backend readiness worker returns `needs_input`; it must not infer them through an LLM.

## Deterministic Nutrition Review

The Nutrition Coach review parses versioned readiness and energy-worker outputs from the backend. It shows either the exact missing profile fields, typed policy blocks, or deterministic Mifflin–St Jeor BMR, TDEE, goal-adjusted calories, permissible calorie range, and protein/fat policy ranges. These values are read-only calculations; the screen does not call a model or change nutrition targets.

Malformed or unsupported worker versions are not displayed as valid metrics. Typed rejection reasons such as an unreconcilable calorie/macro target receive dedicated user-facing explanations rather than a generic missing-data message.

## Run

```bash
npm install
npx expo start
```

## API configuration

Set `EXPO_PUBLIC_API_BASE_URL` for the backend. The older food-specific variable may remain as a compatibility fallback only where already supported.

Do not add FatSecret, model-provider, or other service credentials to Expo environment variables. Provider credentials live only in `smart-fitness-backend`; the app consumes normalized backend DTOs and never calls those providers directly.
