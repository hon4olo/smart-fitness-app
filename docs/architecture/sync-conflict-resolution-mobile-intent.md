# Mobile sync conflict resolution intent and submission boundary

P7-C2 adds a per-user AsyncStorage-backed intent store between safe conflict-candidate derivation and authenticated conflict-resolution submission.

Each conflict may have one immutable intent containing only:

- conflict ID;
- expected conflict and remote revisions;
- `keep_local` or `keep_remote` choice;
- a deterministic versioned idempotency key;
- bounded attempt state;
- creation, update, and optional last-attempt timestamps.

The idempotency key is derived from the immutable conflict identity, expected revisions, and initial choice. Creating the same intent again returns the existing record. Attempting to change the choice or revision boundary for the same conflict fails without replacing the persisted key.

The persisted state machine supports pending, in-flight, retryable, accepted, stale, and completed states. A process restart repairs an in-flight `submitting` record to `retryable` while preserving the exact idempotency key and last-attempt timestamp. Only a `completed` intent may be removed, and removal is scoped to the authenticated user and exact idempotency identity.

Malformed critical fields, noncanonical idempotency identities, conflicting duplicate records, and unknown envelope versions fail closed. Safe parseable timestamps are normalized, and interrupted in-flight state is repaired. The original persisted conflict snapshot is never mutated or removed by this store.

P7-C3 begins with a narrow submission executor over the persisted record. The executor:

- loads the immutable intent instead of accepting request fields from presentation code;
- transitions pending or retryable records to `submitting` before the request;
- invokes the authenticated client with the exact persisted revisions, choice, and key;
- records a valid success, including backend duplicate replay, as `accepted`;
- records network, timeout, authentication, provider-unavailable, response-parse, and other uncertain failures as `retryable` without changing the key;
- classifies stale, already-resolved, not-found, unsupported, ownership, validation, and key-reuse responses without repeatedly resubmitting the same deterministic rejection;
- leaves accepted and stale intents durable for authoritative synchronization and reconciliation.

The executor does not accept raw payloads, device IDs, ownership IDs, or an arbitrary idempotency key. It does not remove the conflict or intent, synthesize a pull result, advance a cursor, or apply returned payloads directly. The normal pull/materialization path remains authoritative because a resolution response revision alone cannot prove that no intervening operations must be applied.

Authoritative pull/materialization, post-resolution verification, and terminal cleanup remain the next P7-C3 slice. No presentation action, OTA/EAS publication, native build/install, backend deployment, or production activation is part of this boundary.
