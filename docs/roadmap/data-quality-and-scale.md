# Data, quality, and scale roadmap

Updated: 2026-07-31

## User-visible sync status and recovery — P1

Completed:

- Settings contains a localized Data & Sync status card;
- the detail screen shows local-only, syncing, synced, offline, failed, and conflict states without internal IDs;
- last successful sync, pending mutation count, and unresolved conflict count are visible;
- manual sync and retry actions use the existing SyncProvider contract;
- raw internal sync error text is not displayed to users;
- local-only and account-synchronized behavior are explained in English and Russian;
- failed local persistence exposes a safe retry action without displaying the raw exception;
- durable weight-history outbox recovery records are counted and can be replayed manually without deleting records after a failed replay;
- planner-based domains regenerate missing operations from persisted state, metadata, and pending queue on the next sync;
- unresolved conflict snapshots are listed by localized domain, detection time, and sync stage without raw payload values;
- users can retry the existing deterministic conflict resolver through the ordinary synchronization contract without deleting either version;
- Data & Sync exposes privacy-safe app version, build, runtime, channel, update ID/source, environment, and aggregate sync diagnostics without account identity or user content;
- push and pull access-token refresh retries are covered and preserve exact cursor, payload, base revision, and idempotency identity;
- behavioral concurrent-pull coverage proves a local mutation survives metadata loading while remote custom-exercise materialization and cursor advancement complete;
- source-level two-device conflict coverage exists for every mutable synchronized domain, including update/delete races;
- backend PostgreSQL coverage validates concurrent Nutrition-library create, update, delete, conflict, materialization, and idempotent replay behavior.

Remaining product/external work:

- define an explicit local-versus-account choice contract for conflicts that remain unresolved after deterministic retry;
- test offline edit, termination, restart, refresh, reconnect, eventual synchronization, and conflict/recovery UI on physical devices;
- run the second-device matrix on matching standalone runtimes.

Do not add destructive conflict controls before the ownership, revision, idempotency, audit, and rollback behavior is explicitly defined.

## Cross-device Nutrition library sync — P1

Completed:

- local custom foods and provider-favorite snapshots retain stable library IDs and normalized nutrition/provider attribution;
- records carry revision, saved/updated timestamps, deletion tombstones, and a backward-compatible synchronized-revision marker while legacy v1 arrays migrate during parsing;
- UI selectors hide tombstones while the underlying account-scoped local store preserves them for cross-device deletion sync;
- local create, update, favorite toggle, and removal remain immediate and offline-first;
- backend PR #51 adds an ownership-safe revisioned `nutrition_library_items` entity, migration, tombstones, sync routing, idempotency, pull history, and account-deletion cascade;
- signed-in local mutations enqueue idempotent create/update/delete operations through the existing durable offline queue;
- planning compares local revision with the last acknowledged server revision, so clean records are not re-enqueued indefinitely;
- pull application writes remote upserts and tombstones into the signed-in account library before cursor advancement and marks the received revision synchronized;
- stale remote revisions cannot overwrite a newer local mutation;
- anonymous storage remains isolated and is never silently imported into a signed-in account;
- provider-favorite snapshots remain locally usable without another provider request;
- automated mobile coverage includes deterministic create/update/delete identities, recovered-pending deduplication, server acknowledgement, partial acknowledgement with a newer local edit, duplicate remote delivery, repeated tombstones, stale remote delivery, malformed remote snapshots, anonymous/account isolation, offline provider-snapshot restoration, and tombstone resurrection;
- backend dispatcher coverage validates entity aliases, ownership-scoped writes, strict snapshots, stable-ID matching, tombstones, and replay inputs;
- backend PR #62 validates concurrent create/update/delete races against real PostgreSQL, exactly one revisioned winner, conflict persistence, materialization, and idempotent replay without duplicate conflicts.

External validation still required:

- validate offline termination/restart and the library on a second signed-in device.

## Visual regression and release-device matrix — P1

Completed:

- a regenerated native iOS project and Pods installed and launched the application successfully from the Xcode workspace on one physical iPhone;
- source CI validates Expo export and Expo Doctor on every mobile PR.

Remaining:

- complete on-device smoke checks for local-data preservation, primary tabs, Settings, Coach history safe failure, Nutrition library, active workout, force-close recovery, and standalone runtime stability;
- verify launch without Metro rather than inferring it from a successful Xcode install;
- capture reference screenshots for primary screens and critical child flows;
- test smallest, standard, and large iPhones plus representative Android sizes;
- test Light, Dark, English, Russian, large text, keyboard-open, loading, empty, error, and offline states;
- review layout anchors, clipping, touch targets, table columns, safe areas, and bottom navigation;
- manually test camera permission, barcode failure, force-close recovery, OTA application, and rollback.

## Privacy-safe product analytics — P1 after privacy contract

Blocked until the product privacy contract is defined.

Required before implementation:

- minimal action-only event taxonomy;
- explicit consent and settings behavior;
- analytics identity separate from auth tokens;
- retention and deletion policy;
- account-deletion cleanup;
- schema ownership and versioning;
- hard prohibition on body values, calories, macros, limitations, exercise values, food names, email, tokens, IDs that reveal records, or free text.

Do not add an analytics SDK or telemetry events before these requirements are approved.

## Coach history and trust — P2

Completed:

- backend PR #53 exposes an ownership-safe bounded Coach run history query over existing immutable run records;
- mobile Coach history provides localized domain/status filters and opens immutable run details;
- history summaries expose request type, policy versions, status, and timestamps without raw context snapshots or health values;
- run details expose policy versions and ordered agent stages without rewriting historical records;
- Settings provides a visible entry point to Coach history and trust information;
- backend PR #54 defines a bounded versioned application-provenance contract with deterministic source-revision fingerprints and records Combined Nutrition source-to-applied revision metadata, including interrupted-parent retry recovery;
- backend PR #55 carries ownership-scoped workout-session revisions into new Strength proposals, rejects changed or unavailable sources before a sync write, preserves legacy proposal safety through exact source-set comparison, and records source-session to workout-template provenance;
- backend PR #56 applies the same ownership-scoped source-revision, legacy exact-set fallback, immutable provenance, and idempotent recovery guarantees to Combined effective Strength applications;
- Nutrition, standalone Strength, and Combined effective Strength confirmations fail closed when their proposal-time source revision no longer matches the current revision;
- mobile PR #126 parses provenance fail-closed and displays only localized entity types and revisions, without raw entity IDs, fingerprint hashes, context snapshots, result payloads, health values, or agent input/output;
- backend PR #57 derives ownership-safe `current`, `stale`, `unavailable`, and `applied` trust states when an immutable run detail is read, while keeping the bounded history list free of per-row source queries;
- mobile PR #129 parses derived trust metadata fail-closed, preserves the run detail when metadata is malformed, and displays localized source status plus proposal/current revisions without source IDs;
- applied history is not retroactively marked stale after later source changes, and idempotent recovery preserves immutable provenance without repeating the underlying revisioned mutation;
- bounded domain-specific input coverage, deterministic rationale, and before/after confirmed-change summaries are implemented for Nutrition, Strength, and Combined paths.

Remaining product dependency:

- implement compensating revert only through a new backend-owned revisioned mutation contract; never rewrite immutable history or invent a client-only rollback.

## Local-storage scalability — P2, measure first

Remaining:

- define a privacy-safe measurement contract for local-state byte size, restore/save duration, entity counts, and failure rate without content;
- establish thresholds from measured startup/write performance;
- preserve repository and sync contracts while storage evolves;
- migrate high-volume domains incrementally to SQLite only when measurements justify it;
- consider food entries and workout sessions/sets first;
- require migration, rollback, corruption-recovery, and interrupted-write tests.

Do not begin SQLite migration based only on source-file size or theoretical scale.

## Deferred scope

Do not begin without explicit prioritization:

- social feed and public profiles;
- trainer marketplace and paid coaching;
- subscriptions and payments;
- user-to-user chat;
- additional large AI product areas;
- broad redesigns of stable primary screens;
- user data export;
- lab analysis or pharmacology features.
