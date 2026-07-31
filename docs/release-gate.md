# Blocking release gate

The integration release gate lives in the mobile repository under **Smart Fitness Release Gate**.

It accepts only a full 40-character mobile commit SHA and a full 40-character backend commit SHA. Moving branches and abbreviated refs are rejected before either repository validation job starts. Each checkout is verified with `git rev-parse HEAD`, and the final result records the exact resolved SHAs.

A release is eligible only when immutable-ref validation, the mobile job, and the backend job all pass.

## Mobile checks

- clean dependency installation;
- repository-wide file-size audit;
- TypeScript compilation;
- complete Vitest suite;
- Expo public configuration generation against a non-production release-gate API host;
- Expo export and Expo Doctor.

The pull-request changed-file audit is intentionally not run here because an arbitrary pinned release SHA has no pull-request base context. The repository-wide audit remains authoritative for the checked-out release tree.

## Backend checks

- clean dependency installation with development tooling;
- lint and TypeScript build;
- compiled production environment validation;
- all Drizzle migrations on a clean PostgreSQL 16 database;
- repeated migration execution to verify idempotency;
- migrated-schema integration test against PostgreSQL;
- complete Vitest suite;
- production startup and `/health` verification.

## Repository access

The backend checkout uses `BACKEND_REPOSITORY_TOKEN` when configured and otherwise falls back to the workflow token. Configure the repository secret when the default token cannot read `hon4olo/smart-fitness-backend`. Never put the token in workflow inputs, source files, logs, or Expo public configuration.

## Use

Run the workflow manually and provide immutable full commit SHAs for both repositories. Do not use branches, moving tags, or abbreviated SHAs when approving a release.

The final `Release ready` job fails whenever ref validation, mobile validation, or backend validation is skipped, cancelled, or fails. It reports the exact checked-out commit SHAs on success.

This gate validates source and integration readiness. It does not replace physical-device validation and never deploys, publishes OTA updates, starts an EAS build, enables the Coach model provider, changes credentials, or accesses production infrastructure.
