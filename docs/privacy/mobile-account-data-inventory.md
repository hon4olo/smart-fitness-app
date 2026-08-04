# Mobile account data inventory

Status: source-level technical inventory for P9-A.

This document records account-linked data persisted by the Expo application, why it exists, whether it is transmitted, and how local deletion is performed. It is an engineering control document, not a legal-compliance determination or a public privacy notice.

The executable inventory is `src/privacy/mobileAccountDataInventory.ts`. Its contract test requires every persistent key exported by `src/storage/index.ts` to be classified and included in the account-deletion boundary.

## Storage boundaries

| Surface | Storage | Data | Purpose | Transmission | Local deletion |
| --- | --- | --- | --- | --- | --- |
| Tokenless auth session | AsyncStorage | User, device and session metadata; no access or refresh token | Restore the signed-in shell | Authentication/profile API | Cleared by auth cleanup on sign-out, password change/reset and account deletion |
| Native auth tokens | Expo SecureStore | Access token, refresh token, token type and expiry metadata | Authenticated API access and refresh | Authentication header and refresh endpoint | Cleared by auth cleanup |
| Main application state | AsyncStorage | Profile inputs, workout data, nutrition data, progress records, limitations and recovery check-ins | Offline-first product operation | Revisioned backend synchronization | Cleared by account-data cleanup |
| Sync queue, cursor and recovery state | AsyncStorage | Pending envelopes, revisions, tombstones, idempotency identity, cursor and recovery records | Retry, ordering, duplicate safety and restart recovery | Sync API | Cleared by account-data cleanup |
| Persisted conflicts and resolution intent | AsyncStorage | Conflict identity, bounded revision metadata and explicit saved choice | Prevent silent overwrite and preserve user choice | Conflict-resolution and sync APIs | Cleared by account-data cleanup |
| Safety review and acknowledgement state | AsyncStorage | Bounded review status and pre-workout acknowledgement | Preserve safety context and workout provenance | Relevant synchronized workout/safety records | Cleared by account-data cleanup |
| User-scoped nutrition and social caches | AsyncStorage | Nutrition favourites, Nutrition library items and following-feed cache | Fast access and offline presentation | Nutrition sync or Social APIs depending on surface | Cleared by account-data cleanup using user-keyed storage keys |
| Local-state diagnostics | AsyncStorage | Aggregate counts, serialized byte size, durations and failure counters | Measure local persistence size and performance | None | Cleared by account-data cleanup |
| Pending deletion marker | Expo SecureStore | User ID and cleanup-request timestamp | Resume interrupted local deletion | None | Removed only after account and auth cleanup complete |

## Main application-state categories

The main `AppState` snapshot can contain:

- profile and onboarding inputs;
- workout templates and training programs;
- custom and catalog exercise references;
- active and completed workout sessions and sets;
- food entries, meal templates, nutrition targets and Nutrition library state;
- weight history and typed body measurements;
- self-reported limitations and recovery check-ins;
- selected device-independent product state required to restore the account experience.

Canonical units and stable IDs remain implementation data required for calculations, display and synchronization. The snapshot is not telemetry and is not uploaded as an unrestricted opaque object. Entity-specific sync adapters validate and transmit bounded versioned payloads.

## Authentication separation

The cached auth-session record is intentionally tokenless. Native access and refresh tokens use Expo SecureStore. Legacy AsyncStorage token envelopes are removed only after secure migration is verified.

Account deletion follows this sequence:

1. The authenticated backend deletion request succeeds.
2. Account-scoped application data is removed.
3. Local auth session and tokens are removed.
4. The durable cleanup marker is removed only when both cleanup paths completed.
5. An interrupted cleanup keeps the marker so deletion can resume without restoring the deleted session.

This separation prevents a local cleanup failure from being reported as a successful complete deletion while account-linked data remains on the device.

## Account-deletion coverage

`ACCOUNT_SCOPED_ASYNC_STORAGE_KEYS` is the authoritative static key set used by local account cleanup. Dynamic user-keyed caches are added at runtime.

The P9-A audit identified two account-linked stores that were exported but not previously included in the static deletion set:

- persisted sync-conflict resolution intent;
- aggregate local-state diagnostics.

Both are now removed during normal and resumed account cleanup. The contract test reads the storage export boundary so a new exported persistent key cannot be added without explicit classification.

## Data minimization boundaries

Current source guarantees include:

- support diagnostics contain bounded release and aggregate sync metadata only;
- local-state diagnostics retain counts and timing/size measurements, not raw records;
- conflict UI and support output do not render raw local/remote payloads, ownership IDs, revisions, tokens, email or full idempotency keys;
- mobile does not contain provider credentials or call model/food providers directly;
- hidden model reasoning is not persisted;
- ordinary device preferences are not deleted as account data unless they become account-linked.

## User controls

Existing technical controls include:

- editing or deleting supported workout, nutrition, profile and progress records;
- resolving eligible synchronization conflicts explicitly;
- signing out;
- changing or resetting the password, which clears local authentication state;
- deleting the account, which invokes backend deletion and resumable local cleanup.

The inventory does not claim that every category has an independent bulk-export, retention selector or per-category deletion control. Those requirements belong to later P9 policy and product decisions.

## Known limits and next work

This slice covers mobile persistence and local account deletion. Follow-up inventory work must map:

- every PostgreSQL table to purpose, ownership, deletion and exceptional retention;
- server logs and infrastructure-level retention;
- provider-bound requests and allowed response/cache retention;
- Social moderation, media review evidence and legal-hold exceptions;
- consent, withdrawal, access control and deletion requirements before any analytics activation.

No analytics SDK, telemetry upload, provider activation, deployment, migration, native build, OTA publication or production action is introduced by this inventory.
