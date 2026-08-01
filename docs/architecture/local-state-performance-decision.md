# Local AppState performance decision

Updated: 2026-08-02

## Scope

This decision evaluates the current single JSON `AppState` snapshot stored through `LocalAppRepository` and AsyncStorage. It does not change persisted schemas, synchronization, queues, outbox identity, routes, or native configuration.

## Evidence sources

1. Deterministic default, representative, and stress `AppState` fixtures.
2. A Node 22 / Ubuntu CI benchmark through the actual `LocalAppRepository.saveState()` and `loadState()` code paths using in-memory storage.
3. Existing support-only device diagnostics, which record real AsyncStorage snapshot bytes and save/load durations without recording payloads or identifiers.

The CI benchmark isolates JSON serialization, parsing, normalization, and repository overhead. It deliberately excludes the React Native bridge and physical storage latency. Device diagnostics remain authoritative for release-hardware I/O.

## Fixture profiles

| Profile | Food entries | Weight entries | Completed sessions | Sets per session |
|---|---:|---:|---:|---:|
| Default | bundled/default state | 0 | 0 | n/a |
| Representative | 180 | 180 | 120 | 12 |
| Stress | 1,000 | 730 | 500 | 12 |

The representative profile approximates sustained personal use. The stress profile is intentionally beyond the normal near-term case and is used to preserve headroom.

## Captured CI results

Medians from Mobile CI run 1316 on Node 22.23.1 / Ubuntu 24.04:

| Profile | Serialized bytes | JSON stringify | JSON parse | Repository save | Repository load |
|---|---:|---:|---:|---:|---:|
| Default | 12,685 | 0.032 ms | 0.082 ms | 0.060 ms | 0.588 ms |
| Representative | 262,315 | 1.752 ms | 1.121 ms | 1.656 ms | 15.774 ms |
| Stress | 1,114,421 | 7.364 ms | 4.842 ms | 4.794 ms | 71.582 ms |

Timing columns are separate medians and must not be added together. Small differences between raw stringify and repository save are normal benchmark noise and warm-runtime effects.

## Growth concentration

The stress-size report identifies these as the dominant domains:

1. `workoutSessions`;
2. `foodEntries`.

Weight history and the remaining settings/profile domains are materially smaller. If snapshot growth becomes a real problem, completed workout history and consumed food history are therefore the first partition/archive candidates. Mutation queues, outbox data, authentication tokens, and synchronization metadata already have separate ownership and must not be folded into an AppState migration.

## Decision

**Keep the current single AsyncStorage AppState snapshot. Do not introduce SQLite or domain partitioning now.**

Reasons:

- the representative snapshot is about 256 KiB;
- the deliberately large stress snapshot remains about 1.06 MiB;
- representative repository restore CPU cost is about 16 ms in CI;
- stress repository restore CPU cost remains about 72 ms in CI;
- save/restore failures and canonical normalization are already covered;
- real device-side bytes and durations are already recorded in privacy-safe support diagnostics;
- a storage migration would add schema migration, rollback, partial-write, consistency, and cross-version risks without measured user benefit.

## Permanent budgets

The deterministic benchmark test enforces reviewed serialized-size ceilings:

- default: 25,000 bytes;
- representative: 350,000 bytes;
- stress: 1,500,000 bytes.

These are regression-review gates, not user-facing storage quotas. A deliberate schema or fixture expansion may update them only with a new size report and storage decision review.

## Reopen criteria

Reopen the storage design only when at least one of these is observed:

- supported release-device diagnostics repeatedly show snapshots above 2 MiB;
- supported release-device maximum load duration repeatedly exceeds 150 ms;
- supported release-device maximum save duration repeatedly exceeds 75 ms;
- AsyncStorage write/read failures are correlated with snapshot size;
- a product requirement needs indexed queries, partial loading, retention windows, or archival that cannot be expressed safely with the snapshot model.

The duration values are investigation triggers, not SLAs. A single cold-start outlier is insufficient.

## If the gate reopens

Use a separate design phase before implementation:

1. collect device diagnostics across representative hardware;
2. confirm the dominant domain and access pattern;
3. evaluate bounded history retention or domain partitioning before SQLite;
4. define migration versioning, restart recovery, rollback, and mixed-app-version behavior;
5. preserve repository, mutation queue, outbox, and sync ownership;
6. implement migration separately from the decision PR.

## Current release evidence gap

Physical-device cold-start and sustained-use measurements remain release validation. They are not a blocker for retaining the current source architecture because the app already exposes the required support-only aggregate diagnostics.
