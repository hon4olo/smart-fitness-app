# Smart Fitness Active Implementation Plan

Updated: 2026-08-02

This file tracks only current and next work. Completed details belong in PR history and focused architecture documents.

## Current baseline

- Mobile `main`: `a0330570b2e451b508fdbf2eebc15fc77f21c54e` before the current slice.
- Backend `main`: `3f6c907efcfa503bd4beaf12b072c4e5b4573362`.
- Production `useAppContext` consumers: `0`.
- State boundaries, persistence decision gate, high-volume list virtualization, and Progress charts are complete.
- Blocking Mobile CI covers line audits, TypeScript, Coach/sync contracts, full regression, Expo export, and Expo Doctor.

## Invariants

- Preserve persisted schemas, stable IDs, canonical units, auth, revisions, idempotency, conflicts, completed history, routes, and explicit Coach confirmations.
- Keep actions in `AppActions`, operational status in `AppInfrastructure`, and domain data in focused state hooks.
- Do not debounce or compact outbox-bearing operations without a new semantic contract.
- Do not add Zustand, Jotai, SQLite, a chart library, or another persistence layer without measured need.
- Keep hand-written source files at or below 500 physical lines.
- Merge only exact green heads.
- Do not publish OTA, build/install native binaries, deploy backend changes, activate environments, or change credentials without explicit authorization.

# Active phase — local-state size and restore/save performance

Goal: decide whether the current AsyncStorage snapshot remains adequate before considering SQLite or state partitioning.

## Slice 1 — measurement boundary

- extend development-only persistence metrics to include restore duration and restored snapshot size;
- keep measurements payload-free, bounded, in-memory, and disabled in production;
- preserve existing restore fallback and navigation ordering;
- add deterministic unit coverage for successful, empty, failed, and disabled restore paths.

## Slice 2 — representative state fixtures

- build deterministic small, representative, and stress AppState fixtures from existing domain fixtures;
- record serialized size by top-level domain;
- measure JSON serialization, repository save, repository restore, and normalization costs;
- keep benchmark data out of production bundles.

## Slice 3 — decision gate

- document observed sizes and timings;
- identify which domains dominate snapshot growth;
- decide among no change, bounded snapshot cleanup, domain partitioning, or a separately approved SQLite design;
- do not implement storage migration in the same PR as the decision.

## Exit criteria

- repeatable measurements exist for default, representative, and stress states;
- restore/save behavior and failure semantics remain unchanged;
- production builds add no telemetry or benchmark overhead;
- a documented evidence-based storage decision is merged.

# Deferred external work

- OTA publication or native build/install;
- backend deployment or environment activation;
- provider-backed Coach staging validation;
- fixed-SHA cross-repository release gate requiring additional credentials;
- physical-device offline-restart, accessibility, EN/RU/unit, performance, and second-device matrices;
- privacy, consent, retention, deletion, and analytics policy work.
