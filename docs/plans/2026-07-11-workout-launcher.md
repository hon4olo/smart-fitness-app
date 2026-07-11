# Template-First Workout Launch Implementation Plan

> **For Hermes:** Use planner-worker-critic: build a focused reusable launcher, then independently review it.

**Goal:** Replace implicit “start the first workout” behavior with a clear, reusable workout picker from both Home and Track.

**Architecture:** A new presentational `WorkoutLauncherCard` receives templates, sessions, and callbacks. Home and Track own only their expanded state and route the chosen template to `/workout-session`. The launcher derives last-session context locally; no persistence schema or dependencies change.

**Tech Stack:** Expo Router, React Native, TypeScript, existing `AppCard`, `AppButton`, and dark theme tokens.

---

### Task 1: Build the reusable workout launcher

**Files:**
- Create: `src/components/workouts/WorkoutLauncherCard.tsx`

**Acceptance criteria:**
- Collapsed state exposes a direct “Choose workout” control.
- Expanded state lists all templates with duration, exercise count, optional description, and the latest prior session context for that template.
- Selecting a template invokes `onStart(workout.id)`.
- Empty state explains how to create a workout and invokes `onCreateWorkout`.
- No dependencies or state schema changes.

**Verification:** `npx tsc --noEmit`.

### Task 2: Integrate the launcher into Home

**Files:**
- Modify: `src/app/(tabs)/index.tsx`

**Acceptance criteria:**
- “Start Workout” reveals the template picker instead of silently choosing the first template.
- The selected template routes to `/workout-session` with its `workoutId`.
- Home continues to offer nutrition and progress actions.

**Verification:** `npx tsc --noEmit`.

### Task 3: Integrate the launcher into Track

**Files:**
- Modify: `src/app/(tabs)/workouts.tsx`

**Acceptance criteria:**
- Coach CTA and primary workout action reveal the same template picker.
- Existing template cards retain their direct Start actions.
- Empty state routes the user to the existing create-workout UI.

**Verification:** `npx tsc --noEmit` and a review of the final diff.

### Task 4: Verify and review

**Acceptance criteria:**
- TypeScript passes.
- Diff is scoped to the launcher flow.
- No dependency, storage, or route-graph changes.
- Independent critic gives PASS, then commit and push with `[ota]`.
