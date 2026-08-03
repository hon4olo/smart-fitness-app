# Release and account roadmap

Updated: 2026-08-03

## Release readiness and observability

Status: source-code foundation complete; external configuration, deployment, native builds, and device validation remain.

Completed:

- backend production config, migrations, compiled startup, and `/health` are blocking in CI;
- rollout and rollback procedures are documented;
- root error recovery and privacy-safe local diagnostics remain available without a third-party crash-reporting SDK;
- account deletion, password change, session/device management, and password-reset source flows are complete;
- password-reset email delivery is source-prepared behind explicit configuration, readiness, and capability gating;
- iOS universal-link and Android app-link source configuration is fail-closed and scoped to the exact `/auth/reset-password` route.

Remaining:

- configure `BACKEND_REPOSITORY_TOKEN` and run the fixed-SHA cross-repository gate;
- create and validate the matching Android build;
- run staged preview/internal-production rollout and rollback rehearsal;
- run real-device smoke on small iPhone, standard iPhone, Android, offline restart, and a second device;
- complete privacy-safe local auth-refresh and API failure-category diagnostics without raw payloads;
- configure approved provider/domain infrastructure only in explicitly targeted environments.

## Account lifecycle

Completed:

- account deletion with current-password re-authentication and server-side cascade;
- fail-closed local cleanup marker and account-scoped cache/token/outbox/conflict cleanup;
- authenticated password change with all-session revocation;
- active sessions/devices screen;
- revoke one owned non-current session;
- revoke all other sessions while preserving the current session;
- backend password-reset token storage, generic non-disclosing request/reset routes, hashed one-time tokens, cooldown, expiry, replay rejection, undelivered-token invalidation, password replacement, and all-session revocation;
- selected Resend request/template/parser/runtime/configuration/composition/readiness source boundary;
- localized capability-gated mobile forgot/reset screens;
- exact HTTPS reset-route source configuration for iOS universal links and Android verified app links;
- exact 43-character base64url token parsing, duplicate rejection, and navigation-state cleanup.

Relevant merges:

- backend #48 `cf3a249b307a7493c68d5f6485e241a9af3b0272` and mobile #97 `475a55619cc03644de5423a8440fbf4b0019345e`: account deletion;
- backend #49 `dba333ab652e1f055fd954cb91040b19071fdd0c` and mobile #98 `e5a2b8d378f37cec1f6968c349d0b504d2760219`: password change;
- backend #50 `88df103237caf67052770c32c77d9ba092df3065` and mobile #99 `aa2a55bfe9cf006a27de087de398d01941fa1a05`: session/device management;
- backend #60 `5aa7fa35b0d3e89fe1e824266fd659d1296a61a3` and mobile #200 `1b77802bb765a1a3db6b8dcd1f081c210049a2d0`: provider-neutral password-reset foundation and localized mobile flow;
- backend #110 `2c683c95274409aa5958033e96cb8acf67ca8b56`, #111 `ecd8a2e425b032be323b9852ba9e60221a1ca968`, and #112 `44604b216bef723680fdd12f3a5d9d100bb70e3b`: Resend contract, runtime, configuration, composition, and readiness;
- mobile #383 `ef048d41f47487fe079afb1b5ac4b49edea36d76`: fail-closed universal/app-link source preparation and strict reset-token navigation.

Remaining:

- create the Resend account and credential and verify the approved sender domain;
- select and configure one owned HTTPS link domain identically for backend and native builds;
- deploy narrowly scoped Apple App Site Association and Android Digital Asset Links files;
- deploy the current backend migration and endpoints in an explicitly targeted environment;
- create a new native build containing the associated-domain entitlement and verified intent filter;
- validate real reset delivery, expiry, replay rejection, undelivered-token invalidation, reauthentication, cold/warm link routing, and session revocation on physical devices;
- validate destructive flows, cleanup retry, and re-registration on devices;
- add user-facing privacy explanation;
- add privacy-safe analytics only after event and consent contracts are approved;
- enable the password-reset capability only after all external gates pass.

Data export remains intentionally deferred.
