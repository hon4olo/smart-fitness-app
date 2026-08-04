# Bounded adversarial validation

Status: P8-D source contract.

## Purpose

The scheduled workflow supplements, but never replaces, blocking pull-request validation. It increases deterministic sequence coverage and reruns existing PostgreSQL retry/transaction invariants against independently resolved repository sources.

It is not a release gate, deployment job, production smoke test, load test, provider test, or network-fault platform.

## Schedule and manual execution

`Smart Fitness Adversarial Validation` may run:

- once per week at `03:17 UTC` on Sunday;
- manually through `workflow_dispatch`.

Concurrent executions are serialized without cancelling an in-progress run. The workflow does not run on pull requests or pushes, so ordinary source validation remains bounded and predictable.

## Mobile generated model expansion

The reviewed pull-request property test runs 128 deterministic seeds. The scheduled runner:

1. reads that exact reviewed test source;
2. requires one exact bounded-loop marker;
3. creates a temporary test copy with a larger seed count;
4. runs only that generated test;
5. records the exact mobile SHA, source SHA-256 digest, seed range, result, and schema version;
6. removes the temporary file.

The scheduled count is 2,048 seeds. The runner rejects values below 129 or above 4,096. This prevents accidental unbounded execution while giving materially wider state-machine coverage.

A pull-request smoke step executes the same runner with 129 seeds, proving the generation and cleanup path without imposing the scheduled workload on every change.

## Backend PostgreSQL boundaries

The backend job resolves the current backend `main` to an exact commit SHA and runs only existing deterministic PostgreSQL suites for:

- authenticated conflict-resolution HTTP replay, including lost response and independent application instances;
- user-scoped idempotency and conflicting key reuse;
- transaction rollback after injected failures.

The job uses a disposable PostgreSQL 16 service and applies migrations only to that CI database. It does not access staging or production infrastructure.

## Evidence and failure behavior

Each job uploads focused logs and evidence. A final schema-v1 artifact records:

- GitHub run ID;
- exact mobile SHA;
- exact backend SHA;
- mobile and backend results;
- scheduled mobile seed count.

Focused logs are retained for 14 days. The consolidated exact-source result is retained for 30 days. The final job fails when either bounded suite is skipped, cancelled, or fails.

A generated sequence failure already includes the original seed and a minimized failing command sequence through the underlying property test.

## Explicit exclusions

This slice intentionally does not add:

- k6, Toxiproxy, or another external fault-injection dependency;
- virtual-user load or database iteration targets unrelated to a reviewed invariant;
- automatic reruns that could conceal flakes;
- deployment, OTA/EAS publication, native build, installation, store submission, rollback execution, migration outside CI, provider activation, or production access.

Network fault injection and load tooling remain deferred until a deterministic oracle exists for each proposed scenario and repeated scheduled evidence justifies the runtime and maintenance cost.
