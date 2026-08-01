# Persistence Measurement Results

Updated: 2026-08-01

This note records deterministic source-level and unit-level measurements for the Phase 3 persistence decision gate. It does not claim physical-device latency or hard process-kill guarantees.

## Active workout draft

Persistence path: dedicated AsyncStorage write queue in `src/features/workouts/storage.ts`.

Measured scenarios:

| Scenario | User-level revisions | Committed storage operations | Result |
| --- | ---: | ---: | --- |
| Three revisions issued before the queue commits | 3 | 1 write | Stale revisions are suppressed; latest snapshot wins. |
| Two revisions separated by a completed write | 2 | 2 writes | Each settled edit boundary commits once. |
| New revision queued behind an in-flight write | 2 | 2 ordered writes | The in-flight write completes, then the latest snapshot commits. |
| Clear issued behind an in-flight write | 1 write + clear | 1 write, then 1 remove | Removal executes last and stored draft is cleared. |
| In-memory edit made during hydration | 1 edit | latest snapshot write | Stored hydration data does not replace the newer in-memory revision. |

Interpretation:

- the active draft path already suppresses superseded writes that have not started;
- an already in-flight AsyncStorage write cannot be cancelled, but the revision-aware queue deterministically follows it with the latest write or clear;
- hydration cannot overwrite a newer in-memory edit;
- it does not use `repository.saveState()`;
- adding a time-based debounce is not justified by the measured scenarios.

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

These actions are explicit submission or commit boundaries rather than per-keystroke persistence paths. The evidence does not show repeated redundant `repository.saveState()` writes for one user action.

## Failure, ordering, and recovery

Mutation queue and measurement tests establish:

- local persistence completes before the outbox step starts;
- persistence failures reject the mutation and are recorded without swallowing the original error;
- failed mutations retain retry semantics;
- outbox-bearing weight and onboarding operations retain identity and ordering;
- measurement metadata is bounded, in-memory, payload-free, and disabled in production builds.

## Final decision

Do not add generic debounce or coalescing around `AppMutationQueue`.

Do not add a time-based debounce to active workout draft storage.

Rationale:

- rapid pending revisions already collapse to the latest queued revision;
- in-flight writes, clears, and hydration are deterministically ordered;
- nutrition and profile mutations persist once at explicit action boundaries;
- weight and onboarding mutations are outbox-bearing and are not eligible for generic coalescing;
- no measured representative flow demonstrates a material redundant committed-write problem.

The development-only measurement foundation remains available as a bounded diagnostic surface. Any future persistence optimization requires new measurements showing a concrete problem.
