# Smart Fitness Rollout and Rollback

This document defines the release procedure. It does not authorize or record a deployment.

## Release invariants

- Release only exact mobile and backend commit SHAs that passed the combined release gate.
- Keep model execution disabled until deterministic staging flows are green.
- Never place backend/provider secrets in mobile code or `EXPO_PUBLIC_*` variables.
- Do not rewrite completed workout history during Coach generation or confirmation.
- Apply Strength and Nutrition changes through their separate revisioned confirmation paths.
- Do not publish an OTA to an incompatible native runtime.
- Stop the rollout if migrations, authentication, synchronization, Coach polling, or recovery behavior is uncertain.

## Required evidence before staging

Record:

- mobile commit SHA;
- backend commit SHA;
- combined release-gate run ID;
- migration set/hash or latest migration identifier;
- intended staging API URL;
- intended native runtime/build identifiers;
- owner of the rollout;
- rollback decision owner.

All Mobile, Backend, and Release ready jobs must be green.

## Staging rollout order

### 1. Prepare the database

- Confirm the staging PostgreSQL backup/restore process.
- Capture a restore point before applying new migrations.
- Verify the deployment uses the expected `DATABASE_URL` and no production database.
- Apply migrations through the approved backend startup path or an explicit migration job.
- Run the migration command again and require an idempotent result.
- Verify expected tables, indexes, revisions, tombstones, and foreign keys.

Do not use destructive down migrations as the default rollback strategy.

### 2. Deploy backend with model execution disabled

Required initial configuration:

- `NODE_ENV=production`;
- production-grade access and refresh secrets;
- staging-only database URL;
- staging CORS allowlist;
- `COACH_MODEL_ENABLED=false`;
- no provider credential exposed to the client.

Validate:

- process startup;
- `/health`;
- registration/sign-in/refresh/sign-out;
- sync push, pull, conflict, retry, and cursor behavior;
- deterministic Nutrition, Strength, Safety, and Combined reviews;
- Combined v3 preview;
- separate effective-Strength and Nutrition confirmations;
- immutable completed workout history.

### 3. Activate the model provider separately

Only after deterministic staging validation:

- add protected staging provider credentials;
- select the provider-neutral default model and optional domain overrides;
- enable model execution in staging only;
- run the protected Coach model smoke workflow;
- verify bounded retries, strict structured parsing, guardrail rejection, latency, attempts, token usage, and provider/model telemetry;
- disable model execution immediately if deterministic bounds or telemetry are incomplete.

### 4. Create matching native builds

- Build iOS and Android from the exact validated mobile SHA.
- Confirm the runtime contains Expo SecureStore and the expected API base URL.
- Record build/runtime identifiers.
- Do not reuse an older runtime for an update that requires native changes.

### 5. Device validation

On at least one real iOS and one real Android device:

- authentication and token refresh;
- workout creation, active-session persistence, completion, and history;
- Nutrition diary, targets, meals, and totals;
- Progress measurements and charts;
- offline mutation, restart, journal recovery, and later synchronization;
- Coach polling, deterministic fallback, Combined preview, and explicit confirmations.

On a second device/account runtime:

- sign in independently;
- synchronize the same user data;
- exercise two-device update/update and update/delete conflicts;
- verify unresolved conflicts persist and duplicate delivery is idempotent.

### 6. Production rollout

- Repeat the fixed-SHA release gate immediately before release.
- Deploy backend before exposing a mobile version that depends on new server capability flags.
- Keep new capability use fail-closed on older backend schemas.
- Use a limited mobile rollout before broad availability.
- Monitor health, authentication errors, sync conflicts, queue recovery, Coach failures, and database load.

## Rollback triggers

Rollback or halt when any of the following occurs:

- backend cannot start or `/health` fails;
- migration application or idempotency fails;
- authentication or refresh-token regression;
- sync cursor stalls, ownership violations, data loss, or unresolved conflict growth;
- completed history changes unexpectedly;
- Coach output bypasses deterministic bounds or confirmation;
- mobile crash, startup failure, or incompatible runtime;
- provider latency/errors exceed the accepted staging baseline;
- telemetry is insufficient to identify the failed run.

## Backend rollback

1. Disable model execution with `COACH_MODEL_ENABLED=false` when the issue is provider- or model-related.
2. Stop new traffic or return the service to maintenance mode when data integrity is at risk.
3. Redeploy the last validated backend SHA.
4. Prefer a forward-compatible corrective migration over a destructive down migration.
5. Restore PostgreSQL from the recorded restore point only when a migration caused irreversible corruption and the rollback owner approves data loss implications.
6. Re-run `/health`, auth, sync, and deterministic Coach smoke tests before reopening traffic.

A backend code rollback does not imply deleting revisioned sync operations, conflicts, Coach audit metadata, or completed workout history.

## Mobile rollback

### Native release

- Stop or pause staged store rollout.
- Return distribution to the previous validated build where the platform permits it.
- Keep backend compatibility for both the previous and current mobile capability parsers during rollback.

### OTA/EAS Update

- Publish only to the matching runtime/channel.
- Roll back by republishing the last validated update for that same runtime/channel.
- Do not use OTA to change native dependencies, SecureStore availability, or other native configuration.

## Post-rollback validation

- Confirm the active backend and mobile SHAs/builds.
- Confirm database revision and migration state.
- Re-run health, authentication, sync, offline recovery, and deterministic Coach checks.
- Record the incident, trigger, rollback decision, evidence, and remaining remediation.

## Release record template

```text
Date/time:
Environment:
Mobile SHA:
Backend SHA:
Release-gate run:
Backend deployment/build:
Mobile runtime/build:
Database restore point:
Migrations applied:
Provider enabled: yes/no
Validation owner:
Rollback owner:
Result:
Open risks:
```
