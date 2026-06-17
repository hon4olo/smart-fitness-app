# Smart Fitness App — Codex Instructions

## Project Overview

This is a React Native + Expo Router + TypeScript fitness MVP.

The product goal is to build a clean fitness tracking app with:

* workout tracking;
* nutrition tracking;
* progress tracking;
* basic profile data;
* later: education, AI recommendations, lab tracking, coach marketplace.

Current MVP scope is intentionally limited. Do not expand the product beyond the current task.

---

## Current Stack

* Expo SDK 56
* React Native
* Expo Router
* TypeScript
* AsyncStorage as temporary local persistence
* Dark minimal UI
* No backend yet
* No Supabase yet
* No AI API yet

---

## Current App Structure

Main app routes:

* `src/app/_layout.tsx` — root stack layout
* `src/app/workout-session.tsx` — active workout session screen
* `src/app/(tabs)/_layout.tsx` — bottom tab navigation

Current tab files:

* `src/app/(tabs)/index.tsx`
* `src/app/(tabs)/coach.tsx`
* `src/app/(tabs)/labs.tsx`
* `src/app/(tabs)/track.tsx`
* `src/app/(tabs)/eat.tsx`
* `src/app/(tabs)/workouts.tsx`
* `src/app/(tabs)/nutrition.tsx`
* `src/app/(tabs)/progress.tsx`
* `src/app/(tabs)/profile.tsx`

Alias routes:

* `coach.tsx` re-exports `index.tsx`
* `track.tsx` re-exports `workouts.tsx`
* `eat.tsx` re-exports `nutrition.tsx`

Component folders:

* `src/components/ui/`
* `src/components/workouts/`
* `src/components/nutrition/`

Temporary MVP state:

* `src/context/AppContext.tsx`

Theme:

* `src/constants/theme.ts`

---

## Core Product Rules

Build a fitness MVP, not a medical/pharmacology app.

Do not add:

* Supabase unless explicitly requested;
* AI features unless explicitly requested;
* blood test analysis unless explicitly requested;
* medical advice;
* pharmacology;
* hormone protocols;
* SARMs;
* dosing logic;
* supplement protocols;
* diagnosis logic;
* coach marketplace;
* social network features;
* payments;
* subscriptions.

If a task seems to require one of these, stop and ask for confirmation.

---

## Coding Rules

Prefer small, surgical changes.

Default behavior:

* Modify only the files explicitly mentioned in the user task.
* Do not refactor unrelated code.
* Do not rename files unless the task explicitly asks.
* Do not change routing unless the task explicitly asks.
* Do not install new dependencies unless explicitly requested.
* Do not rewrite architecture unless explicitly requested.
* Do not move state from AsyncStorage to backend unless explicitly requested.
* Keep TypeScript strict-compatible.
* Keep UI consistent with the current dark minimal style.
* Use existing UI components before creating new ones.
* Avoid adding large abstractions too early.

When adding functionality:

* Keep the implementation simple.
* Prefer readable code over clever code.
* Keep MVP state in `AppContext.tsx` unless the task says otherwise.
* Keep local persistence through the existing AsyncStorage pattern.
* Preserve existing working features.

---

## UI Rules

General UI direction:

* dark theme;
* clean cards;
* large readable text;
* simple spacing;
* no decorative complexity;
* mobile-first layout;
* avoid overcrowded horizontal rows.

Use existing components where possible:

* `AppCard`
* `AppButton`
* `MetricCard`
* `SectionHeader`

Important mobile layout rules:

* Always account for bottom tab bar overlap.
* Use `useSafeAreaInsets` when adding screens with long scrollable content.
* `ScrollView` screens should generally include enough `paddingBottom`.
* Use `keyboardShouldPersistTaps="handled"` on forms.
* Avoid `selectable` on normal UI text unless specifically needed.
* Do not make text columns so narrow that words wrap letter-by-letter.
* For lists like food entries or workout history, prefer vertical layout:

  * title/name on first line;
  * metadata on second line.

---

## Navigation Rules

Expo Router is used.

Current route expectations:

* Home tab: `/`
* Workouts tab: `/workouts`
* Nutrition tab: `/nutrition`
* Progress tab: `/progress`
* Profile tab: `/profile`
* Active workout session: `/workout-session`

The active workout session is outside the tab group and should open as a stack screen.

Do not break:

* Home → Start Workout → `/workout-session`
* Workouts → Start Workout → `/workout-session`
* Finish Workout → return to Home
* Cancel Workout → return to Home without saving

If changing headers:

* title for workout session should be `Workout Session`;
* do not show `(tabs)` as the iOS back label.

---

## Data Model Rules

Current MVP state lives in:

* `src/context/AppContext.tsx`

Existing major state areas:

* workouts
* workoutSessions
* foodEntries
* nutrition
* weightHistory
* bodyMeasurements
* profile

When adding data:

* add a clear TypeScript type;
* include `id`;
* include `createdAt` when it represents a user-created record;
* keep data serializable;
* persist through existing AsyncStorage state saving.

Do not introduce backend schemas yet.

---

## Documentation Rules

Do not search the web or read external docs for routine UI/state changes.

Use Expo SDK 56 docs only when the task involves:
- Expo SDK version changes;
- package/dependency installation;
- native modules;
- Expo Router structural changes;
- EAS / build / deployment;
- platform-specific APIs.

For normal MVP tasks such as screen edits, forms, buttons, AppContext state, layout fixes, and delete/edit logic, do not use web search. Work from the existing codebase and AGENTS.md.

## Dependency Rules

Do not add dependencies without explicit approval.

If a new dependency seems useful, first explain:

* why it is needed;
* what it replaces;
* whether Expo SDK 56 supports it;
* whether the feature can be built without it.

Avoid adding libraries for simple MVP UI.

---

## Codex Usage Rules

Be efficient with agentic usage.

Do not:

* analyze the whole repository unless explicitly requested;
* review all files unless explicitly requested;
* spawn subagents unless explicitly requested;
* perform broad architecture review unless explicitly requested;
* refactor the whole project;
* change formatting across unrelated files;
* run unnecessary commands.

Do:

* focus only on the files in the task;
* produce minimal diffs;
* explain changed files briefly after editing;
* run `npx tsc --noEmit` after code changes;
* ask before making large structural changes.

---

## Default task proposal and execution policy

When proposing tasks automatically, include:

* likely modified files;
* OTA-safety;
* whether a skill or subagent is needed;
* risk level.

Execution rules:

* Do not use subagents by default.
* Do not use research, debug, or cleanup skills for routine UI, CRUD, layout, styling, or local React Native / TypeScript tasks.
* Use skills only when clearly necessary and report which skill was used.
* Read only task-relevant files.
* Do not inspect the whole repository unless explicitly requested.
* Do not repeatedly read `AGENTS.md` in the same session unless it changed.
* Do not inspect `package.json` unless dependencies, scripts, build config, or TypeScript config are relevant.
* Prefer direct implementation over long planning.
* Modify only files needed for the approved task.
* Run `npx tsc --noEmit`.
* Use `[ota]` only for JS / TS / TSX / assets-only changes.
* Commit, then push to `main`.
* If normal `git push` fails, use the GitHub API fallback.
* Only verify GitHub Actions when explicitly asked.
* Stop after reporting changed files, any requested validation, commit, and push.

---

## Large screen splitting policy

Large tab screen files should not keep growing indefinitely.

Do:

* Prefer extracting reusable UI blocks into small components under `src/components/`.
* For future routine UI changes, avoid full-file dumps of large screens.
* Read and edit targeted components whenever possible.
* Modify only the files needed for the approved task.
* Keep the number of extracted files small and focused.

Do not:

* use subagents by default;
* use research, debug, or cleanup skills for routine UI, CRUD, layout, styling, or local React Native / TypeScript tasks;
* inspect unrelated files;
* check GitHub Actions unless explicitly asked.

For OTA-safe JS / TS / TSX changes:

* commit with `[ota]`;
* push to `main`.

---

## Preferred Response Format After Changes

After completing a task, respond with:

1. Files changed
2. What changed
3. Validation result
4. Any manual checks the user should perform

Example:

```text
Changed:
- src/app/(tabs)/nutrition.tsx
- src/context/AppContext.tsx

Done:
- Added Add Food form.
- Added addFoodEntry.
- Nutrition totals now update and persist.

Validation:
- npx tsc --noEmit passed.

Manual check:
- Add food in Nutrition.
- Confirm Home calories/protein update.
- Restart app and confirm entries persist.
```

---

## Current MVP Priority Order

Build in this order:

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
