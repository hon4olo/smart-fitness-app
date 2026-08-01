# Persistence Operation Matrix

Updated: 2026-08-01

## Purpose

This inventory classifies the persistence paths that must be measured before any coalescing decision. It records current source behavior only; it does not authorize debounce, compaction, or persistence-semantic changes.

## Shared AppState path

Scheduled AppState mutations pass through `useAppMutationQueue`. Each scheduled mutation currently performs exactly one ordered `repository.saveState(nextState)` local-persistence step. An optional outbox step runs afterward in the same queue task.

The development-only persistence measurement store records mutation label, duration, serialized character count, success/failure, and whether an outbox step exists. It stores no payload and is disabled in production builds.

## Target-flow matrix

| Flow | User action | Persistence path | Current writes | Sync classification | Coalescing eligibility |
| --- | --- | --- | --- | --- | --- |
| Active workout | Edit set weight, reps, completion, RPE, add/remove set | Dedicated active-draft AsyncStorage queue through `setActiveWorkoutSessionDraft` | One queued draft request per draft update; revision check suppresses stale queued writes before storage | Local draft only until finish | Measurement candidate, but not part of `repository.saveState()` and not eligible for mutation-queue debounce |
| Active workout | Finish workout | AppState `Save workout session`, then completed-session sync queue; active draft is cleared separately | One AppState save plus explicit completion/sync transition | Critical transition / synchronized | Not eligible |
| Nutrition | Add one diary entry | AppState `Save food entry` | One AppState save per explicit add | Planner-based synchronized state | Measure; do not coalesce across distinct entries |
| Nutrition | Add multiple entries as one action | AppState `Save food entries` | One AppState save for the batch | Planner-based synchronized state | Already batched at action boundary |
| Nutrition | Update or delete diary entry | AppState `Update food entry` / `Delete food entry` | One AppState save per explicit submit/delete | Planner-based synchronized state | Measure; only repeated draft-time submits could justify later work |
| Nutrition | Save targets | AppState `Save nutrition targets` | One AppState save per explicit save | Planner-based synchronized state | Normally not a high-frequency candidate |
| Weight | Create entry | AppState `Save weight entry` followed by recoverable outbox | One AppState save plus one eager outbox step | Eager outbox-bearing | Not eligible |
| Weight | Update entry | AppState `Update weight entry` followed by recoverable outbox | One AppState save plus one eager outbox step | Eager outbox-bearing | Not eligible |
| Weight | Delete entry | AppState `Delete weight entry` followed by recoverable outbox when the entry exists | One AppState save plus eager outbox when applicable | Eager outbox-bearing | Not eligible |
| Profile | Save goals | AppState `Save profile goals` | One AppState save per explicit save | Snapshot plus planner-based synchronization | Low-frequency measurement baseline |
| Profile | Save registration profile | AppState `Save registration profile` | One AppState save per explicit save | Snapshot plus planner-based synchronization | Low-frequency measurement baseline |
| Profile | Save personal or Coach details | AppState `Apply synchronized data` | One AppState save per explicit apply | Planner/materialization path | Not a generic coalescing candidate |
| Onboarding | Complete onboarding | AppState `Complete onboarding` followed by recoverable initial-weight outbox | One AppState save plus one eager outbox step | Critical transition / eager outbox-bearing | Not eligible |

## Source conclusions

1. Active set editing is outside the main AppRepository path. Measuring only `repository.saveState()` cannot answer whether set editing writes excessively.
2. The active-draft queue already uses revision-based stale-write suppression. It does not use a time-based debounce.
3. Weight changes and onboarding completion carry recoverable outbox semantics and must remain ordered and durable.
4. Nutrition and profile actions currently persist on explicit action boundaries rather than every text-input keystroke in the AppState queue.
5. No evidence currently justifies a generic debounce around `AppMutationQueue`.

## Required measurement scenarios

The next slice must add deterministic tests or a development harness that records:

- active-draft storage attempts and committed writes during rapid set edits;
- AppState save count and serialized size for nutrition add/update/delete;
- AppState save and outbox ordering for weight create/update/delete;
- AppState save count for profile explicit-save flows;
- failure, retry, background, and termination-sensitive behavior where the current architecture exposes a testable boundary.

A coalescing implementation is permitted only after these measurements show material redundant committed writes on a snapshot-only path.