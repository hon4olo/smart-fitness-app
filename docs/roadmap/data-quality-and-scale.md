# Data, quality, and scale roadmap

Updated: 2026-07-25

## User-visible sync status and recovery — P1

Completed:

- Settings contains a localized Data & Sync status card;
- the detail screen shows local-only, syncing, synced, offline, failed, and conflict states without internal IDs;
- last successful sync, pending mutation count, and unresolved conflict count are visible;
- manual sync and retry actions use the existing SyncProvider contract;
- raw internal sync error text is not displayed to users;
- local-only and account-synchronized behavior are explained in English and Russian.

Remaining:

- expose safe recovery actions for failed local persistence and durable outbox writes;
- provide a deterministic user-visible conflict-resolution path;
- test offline edit, termination, restart, refresh, reconnect, and eventual synchronization on devices;
- include runtime/update details in support diagnostics.

## Cross-device Nutrition library sync — P1

Remaining:

- add revisioned sync entities for reusable custom foods and provider-favorite snapshots;
- preserve stable IDs, normalized nutrition snapshot, attribution, provider IDs, revision, timestamps, and tombstones;
- preserve immediate offline-first local use;
- add create/update/delete conflicts and idempotent replay tests;
- decide explicitly whether anonymous data may be imported into an account;
- keep provider favorites usable while the provider is unavailable;
- validate the library on a second signed-in device.

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
