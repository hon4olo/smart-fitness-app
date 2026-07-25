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
- records carry revision, saved/updated timestamps, and deletion tombstones while legacy v1 arrays migrate during parsing;
- UI selectors hide tombstones while the underlying account-scoped local store preserves them for cross-device deletion sync;
- local create, update, favorite toggle, and removal remain immediate and offline-first;
- backend PR #51 adds an ownership-safe revisioned `nutrition_library_items` entity, migration, tombstones, sync routing, idempotency, pull history, and account-deletion cascade;
- signed-in local mutations enqueue idempotent create/update/delete operations through the existing durable offline queue;
- pull application writes remote upserts and tombstones into the signed-in account library before cursor advancement;
- anonymous storage remains isolated and is never silently imported into a signed-in account;
- provider-favorite snapshots remain locally usable without another provider request;
- automated mobile coverage now includes deterministic create/update/delete identities, recovered-pending deduplication, duplicate remote delivery, repeated tombstones, malformed remote snapshots, anonymous/account isolation, offline provider-snapshot restoration, and tombstone resurrection.

Remaining:

- add backend-specific concurrent create/update/delete conflict coverage against PostgreSQL;
- validate offline termination/restart and the library on a second signed-in device.

## Visual regression and release-device matrix — P1

Remaining:

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

Remaining:

- user-visible review/proposal history;
- inputs used, deterministic rationale, policy version, validation result, and status;
- before/after values for confirmed changes;
- stale proposal marking on source revision changes;
- explicit compensating revert rather than historical mutation;
- immutable completed-workout and applied-proposal provenance.

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
