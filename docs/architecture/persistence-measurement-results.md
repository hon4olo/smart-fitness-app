# Persistence Measurement Results

Updated: 2026-08-01

This note records deterministic source-level and unit-level measurements for the Phase 3 persistence decision gate. It does not claim physical-device latency or process-termination coverage.

## Active workout draft

Persistence path: dedicated AsyncStorage write queue in `src/features/workouts/storage.ts`.

Measured scenarios:

| Scenario | User-level revisions | Committed AsyncStorage writes | Result |
| --- | ---: | ---: | --- |
| Three revisions issued before the queue commits | 3 | 1 | Stale revisions are suppressed; latest snapshot wins. |
| Two revisions separated by a completed write | 2 | 2 | Each settled edit boundary commits once. |

Interpretation:

- the active draft path already suppresses superseded queued writes;
- it does not use `repository.saveState()`;
- adding a time-based debounce is not justified by the rapid-revision scenario;
- lifecycle and process-termination behavior remains a separate decision input.

## Main AppState mutations

The centralized mutation queue performs one `repository.saveState(nextState)` call for each scheduled mutation before any outbox step.

Representative explicit action boundaries:

| Flow | Mutation boundary | Local saves per action | Outbox |
| --- | --- | ---: | --- |
| Nutrition entry create | `Save food entry` | 1 | No direct outbox step |
| Nutrition entry update | `Update food entry` | 1 | No direct outbox step |
| Nutrition entry delete | `Delete food entry` | 1 | No direct outbox step |
| Profile goals submit | `Save profile goals` | 1 | No direct outbox step |
| Registration profile submit | `Save registration profile` | 1 | No direct outbox step |
| Weight create/update/delete | weight action label | 1 | Recoverable outbox required |
| Onboarding completion | `Complete onboarding` | 1 | Initial-weight recoverable outbox required |

These actions are explicit submission or commit boundaries rather than per-keystroke persistence paths. The current evidence does not show repeated redundant `repository.saveState()` writes for one user action.

## Failure, ordering, and recovery

Existing mutation queue and measurement tests establish:

- local persistence completes before the outbox step starts;
- persistence failures reject the mutation and are recorded without swallowing the original error;
- failed mutations retain retry semantics;
- outbox-bearing weight and onboarding operations retain their identity and ordering;
- measurement metadata is bounded, in-memory, payload-free, and disabled in production builds.

## Current decision

Do not add generic debounce or coalescing around `AppMutationQueue`.

No measured representative flow currently demonstrates a material redundant-write problem:

- rapid active-draft revisions already collapse to the latest queued revision;
- nutrition and profile mutations persist once at explicit action boundaries;
- weight and onboarding mutations are outbox-bearing and are not eligible for generic coalescing.

Before closing Phase 3, verify the remaining lifecycle-sensitive active-draft behavior and record the final decision in the active roadmap.
