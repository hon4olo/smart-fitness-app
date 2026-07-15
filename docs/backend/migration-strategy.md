# Backend Architecture 1.0 — Migration Strategy

Zero-data-loss migration path from local-only mode to cloud-backed mode.

## Current state

- Local-only user experience
- Persistent data stored on the device
- No backend dependency
- Sync queue and cloud contracts are future-facing only

## Target state

- User can sign in
- Local data is uploaded safely
- Remote state becomes authoritative for cross-device access
- The app remains usable offline
- Cloud sync activates without losing local history

## Migration phases

### 1) Local-only user

- User already has local workout, nutrition, and progress data.
- No account exists yet.
- No cloud state exists yet.

### 2) Login

- User authenticates.
- Device is registered.
- The client obtains tokens and a device identity.
- Nothing is uploaded yet until the client confirms a safe bootstrap path.

### 3) First upload

- Client scans local records.
- Client builds sync operations from local data.
- Client uploads a deterministic batch.
- Server creates canonical rows and revision markers.
- Tombstones are generated for deletions rather than removed data.

### 4) Merge

- If the server already contains data, the client compares local and remote versions.
- Conflicts are staged instead of overwritten.
- Auto-merge is only used for safe, non-lossy cases.
- Manual review is required for ambiguous edits.

### 5) Cloud becomes active

- The client uses the server revision as the sync baseline.
- Future writes flow through the queue and sync pipeline.
- Local-first behavior remains intact.
- Cross-device access becomes available.

## Zero data loss rules

- Never upload by replacing whole user state blindly.
- Never drop local entities because a remote entity exists.
- Never delete history when a device is registered.
- Never resolve conflicts by silent overwrite when the data shape is ambiguous.
- Preserve tombstones and operation history until both client and server have advanced past the revision boundary.

## Recommended migration checkpoints

- Local snapshot created before first upload
- Device ID bound to the account
- Initial server revision recorded locally
- Conflict count reported to the user or logs
- Re-sync successful after app restart

## Rollback posture

If cloud activation fails:

- Keep local state intact
- Keep queued operations intact when safe
- Keep sync baseline unchanged
- Allow the user to continue offline

## Success definition

Migration is successful when:

- the local user can sign in,
- the first upload completes without data loss,
- merge conflicts are explicit,
- the app can restart and continue syncing from the same baseline,
- and another device can bootstrap from the same account.
