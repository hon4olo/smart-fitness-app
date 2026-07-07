# Smart Fitness App — Agent Instructions

## Project

This is a React Native + Expo Router + TypeScript fitness MVP.

Current product scope:
- workout tracking;
- nutrition tracking;
- progress tracking;
- basic profile data.

Do not expand the product beyond the user’s current task.

Future features such as AI recommendations, lab tracking, education, backend, payments, coach marketplace, and social features must not be added unless explicitly requested.

## Stack

- Expo SDK 56
- React Native
- Expo Router
- TypeScript
- AsyncStorage for temporary local persistence
- Dark minimal UI
- No backend yet
- No Supabase yet
- No AI API yet

Main state currently lives in:
- src/context/AppContext.tsx

## Required Workflow

Before code changes:
1. Locate the repository root.
2. Read AGENTS.md once per working session.
3. Read PROJECT_LEARNINGS.md if it exists.
4. For bugfixes or failed validation, use DEBUGGING_SKILL.md if it exists.
5. Read only files relevant to the task.
6. Make small, targeted changes.
7. Preserve existing working features.

After TS / TSX code changes, run:
npx tsc --noEmit

Do not claim completion unless validation passes or the blocker is clearly stated.

## Scope Rules

Do not add these unless the user explicitly asks:
- Supabase;
- backend schemas;
- AI features;
- blood test analysis;
- medical advice;
- pharmacology;
- hormone protocols;
- SARMs;
- supplement dosing logic;
- diagnosis logic;
- coach marketplace;
- social network features;
- payments;
- subscriptions;
- new dependencies.

If a task appears to require any of these, stop and ask for confirmation.

## Key Routes and Files

Root/layout:
- src/app/_layout.tsx
- src/app/(tabs)/_layout.tsx

Main screens:
- src/app/(tabs)/index.tsx
- src/app/(tabs)/workouts.tsx
- src/app/(tabs)/nutrition.tsx
- src/app/(tabs)/progress.tsx
- src/app/(tabs)/profile.tsx
- src/app/workout-session.tsx

Alias routes:
- src/app/(tabs)/coach.tsx re-exports index.tsx
- src/app/(tabs)/track.tsx re-exports workouts.tsx
- src/app/(tabs)/eat.tsx re-exports nutrition.tsx

Shared code:
- src/context/AppContext.tsx
- src/constants/theme.ts
- src/components/ui/
- src/components/workouts/
- src/components/nutrition/

## Coding Rules

Prefer minimal diffs.

Do:
- keep TypeScript strict-compatible;
- use existing UI components before creating new ones;
- keep MVP state in AppContext.tsx unless told otherwise;
- keep persistence through the existing AsyncStorage pattern;
- add clear TypeScript types for new data;
- keep data serializable;
- include id for user-created records;
- include createdAt when the record represents user-created history.

Do not:
- refactor unrelated code;
- rename files unless required;
- change routing unless required;
- install dependencies without approval;
- rewrite architecture;
- move state to a backend;
- inspect the whole repo unless asked;
- modify formatting across unrelated files.

## UI Rules

Follow the existing dark minimal style.

Prefer:
- clean cards;
- readable text;
- simple spacing;
- mobile-first layout;
- vertical list layouts for food entries, workout history, and records.

Use existing components where possible:
- AppCard
- AppButton
- MetricCard
- SectionHeader

Mobile layout rules:
- account for bottom tab bar overlap;
- use useSafeAreaInsets on long scrollable screens;
- give ScrollView enough paddingBottom;
- use keyboardShouldPersistTaps="handled" on forms;
- avoid overcrowded horizontal rows;
- avoid narrow text columns that wrap words letter-by-letter.

## Navigation Rules

Expo Router is used.

Expected routes:
- Home: /
- Workouts: /workouts
- Nutrition: /nutrition
- Progress: /progress
- Profile: /profile
- Active workout session: /workout-session

The workout session screen is outside the tab group and should open as a stack screen.

Do not break:
- Home → Start Workout → /workout-session
- Workouts → Start Workout → /workout-session
- Finish Workout → return to Home and save session
- Cancel Workout → return to Home without saving

## Dependencies and Docs

Do not add dependencies without explicit approval.

Use external docs only when needed for:
- Expo SDK version changes;
- package installation;
- native modules;
- Expo Router structure;
- EAS/build/deployment;
- platform-specific APIs.

For routine UI, CRUD, AppContext, forms, styling, and local TypeScript changes, work from the existing codebase.

## Large Screen Policy

Large tab screen files should not grow indefinitely.

Prefer extracting focused reusable UI blocks into:
- src/components/ui/
- src/components/workouts/
- src/components/nutrition/

Keep extracted files small and task-specific.

Do not create large abstractions too early.

## Git and Deployment

For approved code changes:
1. Make minimal changes.
2. Run npx tsc --noEmit.
3. Commit changes.
4. Push to main.

Use [ota] in the commit message only for OTA-safe changes:
- JS;
- TS;
- TSX;
- assets-only changes.

Do not check GitHub Actions unless explicitly asked.

If normal git push fails, report the failure before using any fallback unless the user has already approved fallback behavior.

## Response Format After Changes

After completing a task, respond with:
1. Files changed
2. What changed
3. Validation result
4. Commit/push result
5. Manual checks needed

## MVP Priority

Default build order:
1. Workout logger
2. Nutrition logger
3. Progress logger
4. Choose workout before session
5. Edit/delete entries
6. Basic onboarding/profile setup
7. Better design system
8. Supabase backend
9. AI recommendations
10. Education content
11. Lab tracking
12. Coach marketplace / social features

Do not jump ahead unless explicitly asked.
