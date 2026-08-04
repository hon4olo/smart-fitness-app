# Mobile sync conflict resolution intent, submission, and reconciliation

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

A failed synchronization, a remaining conflict, or a cursor below the accepted resolution revision leaves the intent durable. Retryable submission outcomes do not trigger synchronization. An accepted intent restored after restart can continue reconciliation without creating another logical request or losing its exact cursor target. This avoids treating the response payload as a substitute for ordered pull/materialization and prevents skipped intervening operations.

The mobile composition boundary is exposed through `useSyncConflictResolution`. It derives the current user and token from `AuthContext`, constructs the strict authenticated API client, binds the persisted conflict, cursor, and intent stores, and delegates reconciliation to the existing `useWeightSync().syncNow` path. Consumers receive only `listCandidates()` and `resolve(candidate, choice)`; they cannot supply a user ID, device ID, idempotency key, raw payload, or arbitrary revision.

Unauthenticated listing returns no candidates and unauthenticated resolution fails closed before an intent is created. Candidate listing continues to return only bounded identity, payload-kind, and timing metadata. The hook does not run automatically and makes no destructive choice by itself.

Explicit localized confirmation UI remains the next bounded P7-C4 slice. No OTA/EAS publication, native build/install, backend deployment, or production activation is part of this work.
