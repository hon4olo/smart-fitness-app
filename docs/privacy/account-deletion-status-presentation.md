# Account-deletion status presentation requirements

Status: provider-neutral P9-D source contract. No new destructive action is introduced.

This document defines the privacy-safe presentation boundary for account-deletion status, uncertainty and local cleanup. It complements the existing receipt and cleanup implementation. It does not change the deletion API, legal-hold behavior, backend authority or local deletion trigger.

The executable mapping contract is `src/privacy/accountDeletionStatusPresentation.ts`.

## Authoritative safety rule

Only an authoritative remote `completed` status may move the presentation into local-cleanup-required state.

The following never prove deletion and must preserve local account data:

- remote `pending`;
- remote `blocked`;
- offline, timeout or unavailable status checks;
- malformed or unknown presentation input;
- a missing receipt;
- an expired receipt;
- a session authentication failure;
- an ordinary account API error.

The UI must not infer account deletion from a missing cached session, rejected refresh token or inability to sign in.

## Bounded presentation input

The presentation contract accepts only these source states:

- request submitting;
- remote receipt status: pending, blocked or completed;
- transport uncertainty: offline, timeout, unavailable or unknown;
- receipt unavailable: expired or not found;
- session re-authentication required;
- local cleanup: pending, failed or completed.

Each input has exact keys and schema version `1`. Unknown fields, unsupported values and inconsistent blocker/status combinations fail closed to a generic status-unavailable presentation.

The input contract contains no:

- account/user ID;
- request UUID;
- status secret;
- email;
- password;
- raw backend/provider message;
- object key;
- sync payload;
- deletion timestamps.

## Privacy-safe output

The mapper emits only:

- a bounded status ID;
- tone: info, warning, critical or success;
- localization title and message keys;
- local-data policy;
- session policy;
- a finite action allowlist.

It never emits the backend blocker code, request identity, secret, raw error text or provider/storage implementation detail.

All backend blocker codes map to one generic user-facing blocked state. Detailed legal-hold, database, media, delivery or server-cleanup internals remain engineering/audit evidence and are not rendered directly.

## Local-data policies

### Preserve

Used for:

- request submission;
- pending status;
- blocked status;
- transport uncertainty;
- receipt unavailable;
- re-authentication required;
- malformed/unknown status input.

`preserve` means the presentation must not authorize account-data cleanup.

### Cleanup required

Used only after:

- authoritative remote completion; or
- a previously started confirmed-deletion cleanup remains pending/failed.

This state keeps the user signed out and permits only the bounded local-cleanup continuation path.

### Cleanup complete

Used after both local account-data and authentication cleanup complete. It does not claim that unresolved external provider, backup or log retention has been independently proven; those disclosures remain subject to P9-B3 and policy review.

## Session policies

- `defer_until_reconciled`: do not restore the cached signed-in shell before the pending deletion receipt is reconciled.
- `allow_if_authenticated`: a missing/expired receipt did not prove deletion; ordinary authenticated restoration may proceed if independently valid.
- `signed_out`: authoritative deletion or confirmed cleanup state must not restore the deleted account session.

## Allowed actions

The source contract permits only:

- retry status check;
- contact support;
- start a new deletion request after an unavailable receipt;
- sign in again when re-authentication is required;
- retry confirmed local cleanup.

An action identifier is not a finished UI flow. Routes, localized copy, accessibility, support availability and exact button placement require a separate reviewed integration slice.

The contract intentionally does not expose actions for:

- bypassing a blocker;
- deleting a legal hold;
- forcing remote cleanup;
- clearing a pending receipt to silence uncertainty;
- restoring local data after authoritative completion;
- retrying destructive database/provider operations directly from mobile.

## Retry guidance

Status retries must reuse the existing persisted receipt identity and secret-protected status endpoint. They must not create a new request ID while an unresolved registered receipt exists.

A local-cleanup retry is distinct from a remote deletion retry:

- remote completion is already authoritative;
- the account session stays signed out;
- cleanup resumes the existing bounded local deletion marker;
- the receipt secret remains until terminal cleanup;
- no new destructive backend request is required.

## Localization boundary

The mapper returns stable keys shaped as:

`privacy.accountDeletion.<status>.title`

`privacy.accountDeletion.<status>.message`

No English or Russian production copy is added by this source slice. Future copy must describe uncertainty accurately and avoid implying completion before authoritative status and terminal local cleanup.

## Validation boundary

Automated tests prove that:

- supported inputs parse only with exact keys and valid combinations;
- malformed input maps to a generic fail-closed state;
- pending, blocked and uncertain states preserve local data;
- every backend blocker produces the same bounded presentation;
- missing/expired receipts never prove deletion;
- authoritative completion requires cleanup and keeps the session signed out;
- cleanup failure exposes only local-cleanup retry;
- output contains localization keys and no identifiers, secrets or raw messages.

The tests do not prove real UI integration, support operations, standalone-device SecureStore behavior, backend deployment or production cleanup.

## Authorization boundary

This slice does not change the deletion endpoint, receipt storage, backend status parser, local cleanup implementation, legal holds, provider deletion, database rows, UI screens, localization resources, deployment, migration, native build, OTA/EAS publication or production data.
