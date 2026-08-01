# Smart Fitness Active Implementation Plan

Updated: 2026-08-02

This file contains only the current verified baseline, active constraints, and the next decision gate. Completed implementation history belongs in merged PRs and focused architecture documents.

## Verified baseline

- Mobile baseline before the current closure PR: `4c750182a86dc49a1a820579cd11fcbf595dc4d7`.
- Backend `main`: `3f6c907efcfa503bd4beaf12b072c4e5b4573362`.
- Production `useAppContext` consumers: `0`.
- Focused state boundaries, persistence ordering, high-volume list virtualization, and Progress charts are complete.
- The single AsyncStorage `AppState` snapshot remains the approved local-state architecture.
- Blocking Mobile CI covers repository and changed-file line audits, TypeScript, Coach/sync contracts, full regression, Expo export, and Expo Doctor.

## Local-state decision

Status: complete after the current closure PR.

Evidence:

- deterministic default, representative, and stress snapshots;
- top-level domain size analysis;
- development-only save and restore measurements;
- actual `LocalAppRepository` save/load benchmark;
- support-only release-device diagnostics for real AsyncStorage bytes and durations.

Decision:

- retain the single AsyncStorage snapshot;
- do not add SQLite or domain partitioning now;
- treat completed workout sessions and food entries as the first candidates only if measured growth later reopens the gate;
- keep migration design and implementation separate.

Detailed results, budgets, and reopen criteria are in `docs/architecture/local-state-performance-decision.md`.

## Invariants

- Preserve persisted schemas, stable IDs, canonical units, authentication, revisions, idempotency, conflicts, completed history, routes, and explicit Coach confirmations.
- Keep actions in `AppActions`, operational status in `AppInfrastructure`, and domain data in focused state hooks.
- Do not debounce or compact outbox-bearing operations without a new semantic contract.
- Do not add Zustand, Jotai, SQLite, another persistence layer, or a chart dependency without new measured evidence.
- Keep hand-written source files at or below 500 physical lines.
- Merge only exact green heads.
- Do not publish OTA, build/install native binaries, deploy backend changes, activate environments, or change credentials without explicit authorization.

## Next decision gate

There is no remaining approved autonomous source-refactor phase after the current PR. Select the next bounded slice from one of these inputs:

1. a reproducible user-visible defect;
2. release-candidate smoke evidence;
3. supported-device performance or accessibility evidence;
4. a backend contract gap;
5. a separately approved product priority.

Do not invent speculative architecture work to keep the roadmap populated.

## Work requiring explicit authorization or additional inputs

- OTA publication or native build/install;
- physical-device cold-start, offline-restart, accessibility, EN/RU/unit, and second-device matrices;
- fixed-SHA cross-repository release gate requiring repository-token access;
- provider-backed Coach staging validation requiring model configuration and credentials;
- backend deployment or environment activation;
- destructive local-versus-account conflict controls requiring a new ownership/revision/audit contract;
- privacy, consent, retention, deletion, and analytics policy requirements.
