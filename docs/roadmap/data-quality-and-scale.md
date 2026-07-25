# Data, quality, and scale roadmap

Updated: 2026-07-25

## User-visible sync status and recovery — P1

Completed:

- Settings contains a localized Data & Sync status card;
- the detail screen shows local-only, syncing, synced, offline, failed, and conflict states without internal IDs;
- last successful sync, pending mutation count, and unresolved conflict count are visible;
- manual sync and retry actions use the existing SyncProvider contract;
- raw internal sync error text is not displayed to users;
- local-only and account-synchronized behavior are explained in English and Russian;
- failed local persistence exposes a safe retry action without displaying the raw exception;
- durable outbox recovery records are counted and can be replayed manually without deleting records after a failed replay;
- the existing startup replay and in-session retry contracts from mobile PR #57 remain the recovery source of truth;
- unresolved conflict snapshots are listed by localized domain, detection time, and sync stage without internal IDs or payload values;
- users can retry the existing deterministic conflict resolver through the ordinary synchronization contract without deleting either version;
- Data & Sync exposes privacy-safe app version, build, runtime, channel, update ID/source, environment, and aggregate sync diagnostics without account identity or user content.

Remaining:

- define and implement a safe explicit local-versus-account choice contract for conflicts that remain unresolved after deterministic retry;
- test offline edit, termination, restart, refresh, reconnect, and eventual synchronization on devices.

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
- backend dispatcher coverage validates entity aliases, ownership-scoped writes, strict snapshots, stable-ID matching, tombstones, and replay inputs.

Remaining:

- add backend-specific concurrent create/update/delete conflict coverage against PostgreSQL;
- validate offline termination/restart and the library on a second signed-in device.

## Visual regression and release-device matrix — P1

Completed:

- a regenerated native iOS project and Pods installed and launched the application successfully from the Xcode workspace on one physical iPhone;
- local Xcode source-map upload was disabled with the Scheme-only `SENTRY_DISABLE_AUTO_UPLOAD=true` setting, without adding production Sentry credentials or disabling the SDK in application code.

Remaining:

- complete the on-device smoke checks for local-data preservation, all primary tabs, Settings, Coach history safe failure, Nutrition library, active workout, force-close recovery, and Sentry runtime stability;
- verify launch without Metro rather than inferring it from a successful Xcode install;
- reference screenshots for primary screens and critical child flows;
- smallest, standard, and large iPhones plus representative Android sizes;
- Light, Dark, English, Russian, large text, keyboard-open, loading, empty, error, and offline states;
- layout-anchor, clipping, touch-target, table-column, safe-area, and bottom-navigation review;
- manual checks for camera permission, barcode failure, force-close recovery, OTA application, and rollback.

## Privacy-safe product analytics — P1 after privacy contract

Remaining:

- minimal action-only event taxonomy;
- never include body values, calories, macros, limitations, exercise values, food names, email, tokens, or free text;
- separate analytics identity from auth tokens;
- consent and account-deletion cleanup;
- schema ownership, versioning, retention, and removal policy.

## Coach history and trust — P2

Completed:

- backend PR #53 exposes an ownership-safe bounded Coach run history query over existing immutable run records;
- mobile Coach history provides localized domain/status filters and opens immutable run details;
- history summaries expose request type, policy versions, status, and timestamps without raw context snapshots or health values;
- run details expose policy versions and ordered agent stages without rewriting historical records;
- Settings provides a visible entry point to Coach history and trust information.

Remaining:

- show bounded, domain-specific inputs used and deterministic rationale without dumping raw snapshots;
- show before/after values for confirmed changes;
- mark proposals stale when source revisions change;
- implement explicit compensating revert rather than historical mutation;
- preserve immutable completed-workout and applied-proposal provenance.

## Local-storage scalability — P2, measure first

Remaining:

- instrument local-state size, restore/save duration, entity counts, and failure rate without content;
- define thresholds from measured startup/write performance;
- preserve repository and sync contracts while storage evolves;
- migrate high-volume domains incrementally to SQLite only when justified;
- consider food entries and workout sessions/sets first;
- migration, rollback, corruption-recovery, and interrupted-write tests.

## Deferred scope

Do not begin before P0 and core P1 quality work is complete:

- social feed and public profiles;
- trainer marketplace and paid coaching;
- subscriptions and payments;
- user-to-user chat;
- additional large AI product areas;
- broad redesigns of stable primary screens;
- user data export.
