# Blocking release gate

The integration release gate lives in the mobile repository under **Smart Fitness Release Gate**.

It accepts explicit mobile and backend refs. A release is eligible only when both jobs pass.

## Mobile checks

- clean dependency installation;
- TypeScript compilation;
- complete Vitest suite;
- Expo public configuration generation.

## Backend checks

- lint and TypeScript build;
- compiled production environment validation;
- all Drizzle migrations on a clean PostgreSQL 16 database;
- repeated migration execution to verify idempotency;
- complete Vitest suite;
- production startup and `/health` verification.

## Use

Run the workflow manually and provide immutable commit SHAs or release tags for both repositories. Do not use moving branches when approving a production release.

The final `Release ready` job fails whenever either repository is skipped, cancelled, or fails. The workflow never deploys, publishes OTA updates, starts an EAS build, enables the Coach model provider, or accesses production infrastructure.
