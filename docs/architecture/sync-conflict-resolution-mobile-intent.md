# Mobile sync conflict resolution intent boundary

This P7-C2 slice adds a per-user AsyncStorage-backed intent store between safe conflict-candidate derivation and authenticated conflict-resolution submission.

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

This slice does not submit network requests, apply authoritative operations, trigger synchronization, expose presentation actions, publish OTA/EAS updates, perform a native build, deploy the backend, or activate production. Authenticated submission and post-resolution materialization remain P7-C3.
