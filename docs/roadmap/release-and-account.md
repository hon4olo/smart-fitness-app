# Release and account roadmap

Updated: 2026-07-30

## Release readiness and observability

Status: source-code foundation complete; external configuration and device validation remain.

Completed:

- backend production config, migrations, compiled startup, and `/health` are blocking in CI;
- rollout and rollback procedures are documented;
- root error recovery and privacy-safe local diagnostics remain available without a third-party crash-reporting SDK;
- account deletion, password change, and session/device management are complete at source-code level.

Remaining:

- configure `BACKEND_REPOSITORY_TOKEN` and run the fixed-SHA cross-repository gate;
- the standalone iOS runtime 1.0.3 is working; create and validate the matching Android build;
- run staged preview/internal-production rollout and rollback rehearsal;
- run real-device smoke on small iPhone, standard iPhone, Android, offline restart, and a second device;
- complete privacy-safe local auth-refresh and API failure-category diagnostics without raw payloads.

## Account lifecycle

Completed:

- account deletion with current-password re-authentication and server-side cascade;
- fail-closed local cleanup marker and account-scoped cache/token/outbox/conflict cleanup;
- authenticated password change with all-session revocation;
- active sessions/devices screen;
- revoke one owned non-current session;
- revoke all other sessions while preserving the current session;
- backend password-reset token storage, generic non-disclosing request/reset routes, hashed one-time tokens, expiry, replay rejection, delivery injection, and all-session revocation are complete at source-code level.

Relevant merges:

- backend #48 `cf3a249b307a7493c68d5f6485e241a9af3b0272` and mobile #97 `475a55619cc03644de5423a8440fbf4b0019345e`: account deletion;
- backend #49 `dba333ab652e1f055fd954cb91040b19071fdd0c` and mobile #98 `e5a2b8d378f37cec1f6968c349d0b504d2760219`: password change;
- backend #50 `88df103237caf67052770c32c77d9ba092df3065` and mobile #99 `aa2a55bfe9cf006a27de087de398d01941fa1a05`: session/device management;
- backend #60 `5aa7fa35b0d3e89fe1e824266fd659d1296a61a3`: password-reset source foundation.

Remaining:

- select and configure a mail provider and verified sender domain;
- add the mobile forgot-password/reset-password link flow and validated deep link;
- deploy the current backend migration and endpoints;
- validate reset delivery, expiry, replay rejection, token invalidation, and reauthentication on devices;
- validate destructive flows, cleanup retry, and re-registration on devices;
- add user-facing privacy explanation;
- add privacy-safe analytics only after event and consent contracts are approved.

Data export remains intentionally deferred.
