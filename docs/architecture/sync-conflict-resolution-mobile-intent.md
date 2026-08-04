# Mobile sync conflict resolution intent, submission, reconciliation, and confirmation

P7-C2 adds a per-user AsyncStorage-backed intent store between safe conflict-candidate derivation and authenticated conflict-resolution submission.

Each conflict may have one immutable intent containing only:

- conflict ID;
- expected conflict and remote revisions;
- `keep_local` or `keep_remote` choice;
- a deterministic versioned idempotency key;
- bounded attempt state;
- creation, update, and optional last-attempt timestamps;
- the authoritative resolution revision after a successful response.

The idempotency key is derived from the immutable conflict identity, expected revisions, and initial choice. Creating the same intent again returns the existing record. Attempting to change the choice or revision boundary for the same conflict fails without replacing the persisted key.

The persisted state machine supports pending, in-flight, retryable, accepted, stale, and completed states. A process restart repairs an in-flight `submitting` record to `retryable` while preserving the exact idempotency key and last-attempt timestamp. An `accepted` record is valid only with its authoritative resolution revision. Only a `completed` intent may be removed, and removal is scoped to the authenticated user and exact idempotency identity.

Malformed critical fields, noncanonical idempotency identities, invalid state-specific resolution revisions, conflicting duplicate records, and unknown envelope versions fail closed. Safe parseable timestamps are normalized, and interrupted in-flight state is repaired. The original persisted conflict snapshot is never mutated or removed by this store.

P7-C3 submission uses a narrow executor over the persisted record. The executor:

- loads the immutable intent instead of accepting request fields from presentation code;
- transitions pending or retryable records to `submitting` before the request;
- invokes the authenticated client with the exact persisted revisions, choice, and key;
- records a valid success, including backend duplicate replay, as `accepted` together with the returned revision;
- records network, timeout, authentication, provider-unavailable, response-parse, and other uncertain failures as `retryable` without changing the key;
- classifies stale, already-resolved, not-found, unsupported, ownership, validation, and key-reuse responses without repeatedly resubmitting the same deterministic rejection;
- leaves accepted and stale intents durable for authoritative synchronization and reconciliation.

The submission executor does not accept raw payloads, device IDs, ownership IDs, or an arbitrary idempotency key. It does not remove the conflict or intent, synthesize a pull result, advance a cursor, or apply returned payloads directly.

The P7-C3 reconciliation workflow enforces the post-submission boundary:

1. create or restore the one immutable intent;
2. submit it through the executor;
3. persist the exact accepted revision before synchronization;
4. invoke the normal synchronization path for accepted, stale, or already-resolved outcomes;
5. require the original persisted conflict to disappear through that path;
6. require the user cursor to reach the accepted revision, including after process restart;
7. only then transition the intent to `completed` and remove its terminal record.

A failed synchronization, a remaining conflict, or a cursor below the accepted resolution revision leaves the intent durable. Retryable submission outcomes do not trigger synchronization. An accepted intent restored after restart can continue reconciliation without creating another logical request or losing its exact cursor target. The workflow can resume directly from the durable conflict ID even if normal materialization already removed the original conflict snapshot before the cursor reached the accepted revision.

The mobile composition boundary is exposed through `useSyncConflictResolution`. It derives the current user and token from `AuthContext`, constructs the strict authenticated API client, binds the persisted conflict, cursor, and intent stores, and delegates reconciliation to the existing `useWeightSync().syncNow` path. Consumers receive safe review items, initial explicit resolution, and continuation of an existing durable intent. They cannot supply a user ID, device ID, idempotency key, raw payload, or arbitrary revision.

Unauthenticated listing returns no review items and unauthenticated resolution fails closed before an intent is created. Candidate presentation contains only a localized entity label, detection time, and whether the local-device and account versions represent saved data or deletion. Raw payloads, entity IDs, revisions, request IDs, fingerprints, schema versions, and internal errors are not rendered.

P7-C4 extends Data & Sync with explicit confirmation:

- unresolved safe candidates show separate this-device and account version kinds;
- neither version is preferred automatically;
- choosing either side opens a second confirmation step before intent creation;
- all choice buttons are disabled while any resolution or synchronization action is in flight;
- once an intent exists, the opposite choice is no longer presented;
- retryable and accepted intents expose only continuation of the persisted choice;
- accepted intents remain recoverable after process restart, including when the original conflict snapshot is already gone;
- stale, retryable, authentication, rejection, waiting, and resolved results map to bounded localized copy;
- unsupported conflicts retain the non-destructive ordinary synchronization retry path.

No OTA/EAS publication, native build/install, backend deployment, or production activation is part of this work.
