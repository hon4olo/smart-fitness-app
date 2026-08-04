# Mobile sync conflict resolution API boundary

This P7 slice adds a strict mobile client for the backend-owned conflict resolution endpoint.

The client accepts only the conflict ID, expected conflict and remote revisions, a bounded `keep_local` or `keep_remote` choice, and an idempotency key. The authenticated device ID is derived from the current session and cannot be supplied by presentation code.

The response parser requires the exact versioned backend response shape and rejects unknown fields, malformed UUIDs, unsupported choices, non-integer revisions, invalid timestamps, array payloads, and schema-version drift.

The client preserves the existing access-token refresh behavior for a single 401 response. It does not add presentation state, mutate conflict stores, trigger synchronization automatically, or expose a generic payload submission surface.

Explicit conflict-choice UI and post-resolution store reconciliation remain separate bounded slices. No OTA/EAS publication, native build/install, backend deployment, or production activation is part of this change.
