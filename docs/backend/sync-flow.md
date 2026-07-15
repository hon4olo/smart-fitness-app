# Backend Architecture 1.0 — Sync Flow

Documentation-only sync behavior for future cloud synchronization.

## Principles

- Local data remains usable offline.
- Sync is incremental by default.
- Conflicts are explicit, not silent.
- New device onboarding must not destroy prior data.
- Deletions are represented by tombstones, not hidden hard deletes.

## Startup sync

### Goal
Bring the local client to the latest known server state as soon as a trusted device is online.

### Flow
1. App starts.
2. Client reads local queue and local sync state.
3. Client checks auth/session validity.
4. Client obtains device identity.
5. Client performs `GET /v1/sync/status` or equivalent status read.
6. Client calls `POST /v1/sync/push` for pending local operations.
7. Client calls `POST /v1/sync/pull` using the last known revision.
8. Client resolves conflicts if any are returned.
9. Client persists the new revision marker locally.

### Success criteria
- Local queue is empty or acknowledged.
- Server revision is advanced.
- Local and server state converge.

## Offline sync

### Goal
Allow the client to capture user changes when the network is unavailable.

### Flow
1. User makes changes offline.
2. Client writes changes to local storage.
3. Client appends operations to the offline sync queue.
4. Each operation gets an idempotency key and entity reference.
5. When connectivity returns, pending operations are pushed in order.
6. Failed operations are retried with backoff.

### Rules
- Never drop local writes because the network is unavailable.
- Never reorder dependent operations without explicit batching logic.
- Treat idempotency as required for every queued write.

## Conflict sync

### Goal
Make divergent local and remote edits visible and resolvable.

### Flow
1. Server detects version mismatch or conflicting semantic updates.
2. Server returns conflict records.
3. Client stores conflict metadata locally.
4. Client may auto-resolve trivial cases using policy rules.
5. Client presents unresolved conflicts for manual review.
6. Client submits the chosen resolution through `POST /v1/sync/conflicts`.
7. Server writes the resolved version and updates revision state.

### Conflict strategies
- local wins
- remote wins
- last write wins
- merge fields
- append union
- manual review

## Device registration

### Goal
Bind a real client device to a user and enable sync trust.

### Flow
1. Client generates or receives a device ID.
2. Client sends device metadata during login or first sync.
3. Server creates or updates a device row.
4. Server links the device to the user account.
5. Sync operations from that device become trusted.

### Device metadata
- name
- platform
- app version
- client build
- last seen timestamp

## New device bootstrap

### Goal
Give a new device the minimum data it needs to become productive without overwriting existing user history.

### Flow
1. User signs in on a new device.
2. Device receives a bootstrap snapshot or initial revision.
3. Device downloads active profile, programs, templates, and current targets.
4. Device downloads recent history and relevant aggregates.
5. Device records the bootstrap revision.
6. Device enters normal incremental sync mode.

### Notes
- Bootstrap should prefer snapshots only when the state is large or heavily diverged.
- The initial payload should be enough to avoid a blank UI.

## Deleted device recovery

### Goal
Recover from a device that was removed, reset, or lost local state.

### Flow
1. Device loses local data or is reinstalled.
2. Device re-authenticates.
3. Server sees a known user but stale device state.
4. Device receives a fresh bootstrap state and revision.
5. Local tombstones and pending queues are discarded only if they were already acknowledged or are unrecoverable.
6. Sync restarts from a safe baseline.

### Notes
- Recovery must never blindly replay deleted operations as if they were new.
- Server revision and operation idempotency are the source of truth.

## Sync state model

Recommended states:

- `idle`
- `preparing`
- `uploading`
- `downloading`
- `resolving`
- `conflict`
- `healthy`
- `offline`
- `failed`

## Operational guarantees

- At-least-once delivery for queued operations
- Idempotent server writes
- Monotonic revision markers
- Explicit conflict persistence
- No data loss during login/bootstrap/merge transitions
