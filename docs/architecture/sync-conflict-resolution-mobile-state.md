# Mobile sync conflict resolution candidate boundary

This P7 slice derives a safe, read-only conflict-choice candidate from the existing persisted `SyncConflictSnapshot` without adding presentation actions or mutating synchronization state.

A snapshot is eligible only when:

- it came from an authenticated backend push or pull result rather than a client-only conflict;
- it remains `pending`;
- the persisted conflict identity, entity type, and entity ID match the raw backend record;
- the backend conflict type is `revision_mismatch`;
- both the conflict revision and authoritative remote revision are bounded non-negative integers;
- exactly one payload is a tombstone and the other is an object payload.

Upsert-versus-upsert, tombstone-versus-tombstone, malformed, stale-shaped, terminal, client-only, or identity-mismatched snapshots are not exposed as explicit-choice candidates.

The derived candidate contains only:

- conflict and entity identity needed by the existing resolution route;
- expected conflict and authoritative remote revisions;
- whether the local and remote versions represent an upsert or deletion;
- detection time.

It deliberately excludes raw local/remote payloads, ownership identifiers, internal reason strings, resolution strategy, schema internals, and other diagnostic details. This keeps the future presentation layer bounded while preserving the original persisted snapshot until an authoritative resolution and subsequent synchronization complete.

Separate slices remain responsible for stable idempotency identity, authenticated submission, confirmation UI, authoritative operation materialization, stale/already-resolved handling, and removal of the terminal persisted conflict.

No conflict choice is made automatically. No storage schema, sync algorithm, backend contract, OTA/EAS publication, native build/install, deployment, or production activation changes in this slice.
