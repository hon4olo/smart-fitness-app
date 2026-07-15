# Backend Architecture 1.0 — Security

Documentation-only security model for a future cloud backend.

## JWT flow

### Access token

- Short-lived JWT
- Used for API authorization
- Contains user identity and minimal claims
- Should not contain sensitive user data

### Refresh token

- Long-lived opaque or JWT-backed token
- Rotated on refresh
- Stored server-side as a hashed or revocable session record
- Bound to a device and a session

### Expected flow
1. User logs in.
2. Server issues access token + refresh token.
3. Client uses access token on protected endpoints.
4. When access token expires, client calls refresh.
5. Server validates refresh token and rotates it.
6. Client replaces both tokens.
7. Logout revokes the session and refresh token.

## Device IDs

### Purpose

Device IDs identify a physical installation, not just a login.

### Rules

- Stable across sessions when possible.
- Bound to a user after login.
- Used for sync lineage, audit logs, and device-specific recovery.
- Must not be treated as a secret, but should still be integrity-protected.

### Recommended headers / request fields

- `deviceId`
- `deviceName`
- `platform`
- `appVersion`
- `clientId`

## API versioning

### Rules

- Version in the URL path: `/v1`
- Avoid breaking changes within a version
- Additive changes are preferred
- New major versions should coexist with old ones for a transition period

### Compatibility expectations

- Unknown fields should be ignored when safe.
- Required fields should be introduced only with a compatible rollout plan.
- Sync operations should include explicit version markers when needed.

## Rate limiting

### Goals

- Protect auth endpoints
- Protect sync endpoints from replay storms or runaway clients
- Prevent brute-force login attempts

### Suggested buckets

- login: strict per IP + per account
- refresh: per session and per device
- sync push/pull: per user + device + window
- profile/program CRUD: moderate per account

### Response behavior
- Return `429 Too Many Requests`
- Include retry hint metadata when useful

## Request signing, future

This is reserved for later and is not required for initial rollout.

### Possible future use cases

- High-trust device validation
- Replay protection for sync batches
- Tamper detection for offline queued writes

### Candidate inputs
- device ID
- request timestamp
- nonce
- body hash
- rotation key identifier

### Notes
- Request signing should complement JWTs, not replace them.
- It is a future hardening layer, not a current dependency.

## Operational security notes

- Refresh tokens should be revocable.
- Logout must revoke session state server-side.
- Sync endpoints should reject unauthenticated requests.
- Audit trails should retain enough data to investigate conflicts and replay issues.
