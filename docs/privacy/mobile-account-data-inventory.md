# Mobile account data inventory

Status: source-level technical inventory for P9-A and the mobile P9-B2 deletion-confirmation boundary.

This document records account-linked data persisted by the Expo application, why it exists, whether it is transmitted, and how local deletion is performed. It is an engineering control document, not a legal-compliance determination or a public privacy notice.

The executable inventory is `src/privacy/mobileAccountDataInventory.ts`. Its contract test requires every persistent key exported by `src/storage/index.ts` to be classified and included in the account-deletion boundary. Secret-bearing deletion-receipt state is classified separately because it is stored in Expo SecureStore and must survive until the server result and local cleanup are both authoritative.

## Storage boundaries

| Surface | Storage | Data | Purpose | Transmission | Local deletion |
| --- | --- | --- | --- | --- | --- |
| Tokenless auth session | AsyncStorage | User, device and session metadata; no access or refresh token | Restore the signed-in shell | Authentication/profile API | Cleared by auth cleanup on sign-out, password change/reset and account deletion |
| Native auth tokens | Expo SecureStore | Access token, refresh token, token type and expiry metadata | Authenticated API access and refresh | Authentication header and refresh endpoint | Cleared by auth cleanup |
| Account deletion receipt | Expo SecureStore | Account user ID, opaque request UUID, high-entropy status secret and request timestamp | Recover an authoritative deletion result after a lost response | Account-deletion request and secret-protected status endpoint | Removed after confirmed deletion and terminal local cleanup, or after a definitive unregistered/expired receipt result |
| Main application state | AsyncStorage | Profile inputs, workout data, nutrition data, progress records, limitations and recovery check-ins | Offline-first product operation | Revisioned backend synchronization | Cleared by account-data cleanup |
| Sync queue, cursor and recovery state | AsyncStorage | Pending envelopes, revisions, tombstones, idempotency identity, cursor and recovery records | Retry, ordering, duplicate safety and restart recovery | Sync API | Cleared by account-data cleanup |
| Persisted conflicts and resolution intent | AsyncStorage | Conflict identity, bounded revision metadata and explicit saved choice | Prevent silent overwrite and preserve user choice | Conflict-resolution and sync APIs | Cleared by account-data cleanup |
| Safety review and acknowledgement state | AsyncStorage | Bounded review status and pre-workout acknowledgement | Preserve safety context and workout provenance | Relevant synchronized workout/safety records | Cleared by account-data cleanup |
| User-scoped nutrition and social caches | AsyncStorage | Nutrition favourites, Nutrition library items and following-feed cache | Fast access and offline presentation | Nutrition sync or Social APIs depending on surface | Cleared by account-data cleanup using user-keyed storage keys |
| Local-state diagnostics | AsyncStorage | Aggregate counts, serialized byte size, durations and failure counters | Measure local persistence size and performance | None | Cleared by account-data cleanup |
| Pending deletion marker | Expo SecureStore | Confirmed-deleted account user ID and cleanup-request timestamp | Resume interrupted local deletion | None | Removed only after account and auth cleanup complete |

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

## Authentication and deletion separation

The cached auth-session record is intentionally tokenless. Native access and refresh tokens use Expo SecureStore. Legacy AsyncStorage token envelopes are removed only after secure migration is verified.

Receipt-enabled account deletion follows this sequence:

1. The mobile creates an opaque UUID and 256-bit status secret using the runtime cryptographic random source.
2. The receipt identity is written to Expo SecureStore before the destructive request.
3. The authenticated request sends the current password, request UUID and status secret. It never sends a user ID.
4. A successful response is strictly parsed. A transport failure triggers a body-based status lookup with the same receipt identity.
5. `pending`, `blocked`, an unreachable status endpoint or a generic authentication failure never authorizes local deletion.
6. Only authoritative `completed` status starts account-data cleanup and auth cleanup.
7. The post-confirmation cleanup marker remains until both local cleanup paths complete.
8. The receipt secret is removed only after terminal local cleanup; interrupted cleanup keeps both recovery boundaries needed for the next launch.

The status secret is never stored in AsyncStorage, placed in a URL, logged, added to diagnostics or rendered in UI. The status response is restricted to version, opaque request ID, bounded state/blocker, expiry and completion timestamp.

The legacy password-only request remains supported by the backend for older released clients, but the current mobile source uses the receipt-enabled contract.

## Lost-response and restart behavior

A successful database deletion can commit while the final HTTP response is lost. The mobile therefore does not interpret `401`, an expired token, missing session metadata or a refresh failure as proof that the account was deleted.

When the destructive response is uncertain:

- the exact receipt identity is retained;
- local account data and auth state are retained unless ordinary auth expiry independently clears tokens;
- another deletion attempt reuses the same request UUID and secret;
- application bootstrap queries the status endpoint before restoring the cached session;
- authoritative `completed` status resumes the same confirmed-deletion cleanup path;
- malformed, unknown-field or identity-mismatched status responses fail closed.

A definitive credential rejection followed by receipt `404` removes the unregistered receipt identity while preserving local account data. An expired receipt cannot prove deletion, so it does not trigger local account cleanup.

## Account-deletion coverage

`ACCOUNT_SCOPED_ASYNC_STORAGE_KEYS` is the authoritative static key set used by local account cleanup. Dynamic user-keyed caches are added at runtime.

The P9-A audit identified two account-linked stores that were exported but not previously included in the static deletion set:

- persisted sync-conflict resolution intent;
- aggregate local-state diagnostics.

Both are removed during normal and resumed account cleanup. The contract test reads the storage export boundary so a new exported persistent key cannot be added without explicit classification.

The deletion receipt is intentionally not part of the AsyncStorage account-data key set. It is an independent SecureStore recovery secret and is cleared only by its own terminal receipt-cleanup path.

## Data minimization boundaries

Current source guarantees include:

- support diagnostics contain bounded release and aggregate sync metadata only;
- local-state diagnostics retain counts and timing/size measurements, not raw records;
- conflict UI and support output do not render raw local/remote payloads, ownership IDs, revisions, tokens, email or full idempotency keys;
- deletion status UI receives no raw provider errors, object keys, user IDs, password or status secret;
- mobile does not contain provider credentials or call model/food providers directly;
- hidden model reasoning is not persisted;
- ordinary device preferences are not deleted as account data unless they become account-linked.

## User controls

Existing technical controls include:

- editing or deleting supported workout, nutrition, profile and progress records;
- resolving eligible synchronization conflicts explicitly;
- signing out;
- changing or resetting the password, which clears local authentication state;
- deleting the account, including restart-safe confirmation and resumable local cleanup.

The inventory does not claim that every category has an independent bulk-export, retention selector or per-category deletion control. Those requirements belong to later P9 policy and product decisions.

## Known limits and next work

This source boundary does not deploy the backend migration, prove physical SecureStore behavior on a matching standalone build, schedule backend receipt purging, or provide public legal/policy text.

Follow-up P9 work must still address:

- authorized operational purging of expired backend receipts;
- provider/cache and review-evidence disposition where applicable;
- user-visible deletion status and exceptional-retention explanation;
- consent, withdrawal, access control and deletion requirements before analytics activation;
- matching backend/mobile real-device validation after deployment authorization.

No analytics SDK, telemetry upload, provider activation, deployment, production migration, native build, OTA publication or production action is introduced by this slice.
