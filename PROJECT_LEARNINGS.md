# Project Learnings

Reusable project-specific lessons and known pitfalls.

## Architecture

- Shared user state should go through src/context/AppContext.tsx, not isolated local-only state, when multiple tabs need the same data.
- Keep MVP persistence local through the existing AsyncStorage pattern until the user explicitly requests a backend.
- Avoid mixing demo data with user-created state unless explicitly requested.
- Do not introduce Supabase, AI APIs, lab tracking, pharmacology logic, payments, or social features without explicit approval.

## Navigation

- Home → Start Workout and Workouts → Start Workout must route to /workout-session.
- Active workout session should stay outside the tab group.
- Finish Workout should save the session and return to Home.
- Cancel Workout should return to Home without saving.
- Do not show "(tabs)" as an iOS back label.

## Nutrition

- Nutrition date navigation has previously been fragile. Avoid mutable Date bugs.
- Macro totals must recalculate after food weight changes.
- Food entries and meal/history lists should prefer vertical mobile layouts rather than cramped horizontal rows.
- Forms should use keyboardShouldPersistTaps="handled" when inside ScrollView.

## Workouts

- Workout history must refresh after finishing a workout session.
- Preserve active workout flow when editing workout-related screens.
- Do not break persistent bottom actions on the workout session screen.
- Exercise catalog data is only user-visible when the active workout exercise picker loads through `src/features/exercises` repository and stores canonical `exerciseId` values in the active draft.
- Exercise Library rows must not autoplay remote GIF thumbnails; keep animated playback on the detail screen to avoid release-device memory pressure.

## Progress

- Progress screens can become large. Prefer extracting focused components when a screen grows too much.
- Keep latest summary cards visible when useful and collapse heavier sections if the screen becomes crowded.

## Mobile Layout

- Long scrollable screens need enough bottom padding to avoid tab bar overlap.
- useSafeAreaInsets should be used where bottom controls or long scroll content can overlap system UI.
- Avoid narrow text columns that wrap words letter-by-letter.

## Build / Deployment

- Release iPhone builds should not depend on Metro.
- OTA-safe changes are JS / TS / TSX / assets-only.
- Use [ota] in commit messages only for OTA-safe changes.
- Installed release/OTA builds run with `__DEV__` false; internal-only runtime behavior needs an explicit non-secret public flag, not a dev-mode check.
- Before re-enabling JS that imports native modules such as `expo-image`, bump the app version or runtimeVersion, create a new native iOS build for that runtime, and publish those OTA bundles only to the matching runtime/channel. Never send native-module JS to runtime `1.0.0`.
