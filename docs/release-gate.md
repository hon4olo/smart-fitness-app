# Blocking release gate

The integration release gate lives in the mobile repository under **Smart Fitness Release Gate**.

It validates source and integration readiness only. It does not deploy, publish an OTA update, create a native build, install an application, submit a store release, enable a provider, change credentials, or access production infrastructure.

## Immutable inputs

Every run requires four immutable inputs:

- a full 40-character mobile commit SHA;
- a full 40-character backend commit SHA;
- a full 40-character previously validated rollback mobile SHA;
- a full 40-character previously validated rollback backend SHA.

Moving branches, tags, abbreviated hashes, placeholders, and malformed refs are rejected before repository validation begins. Each rollback SHA must be distinct from the selected release SHA and must be an ancestor of the selected release commit in its repository. This prevents a rollback declaration from silently pointing to unrelated or newer source.

Each current checkout is verified with `git rev-parse HEAD`. Each rollback source is resolved as an exact commit and checked with `git merge-base --is-ancestor`.

A release is eligible only when immutable-ref validation, the mobile job, and the backend job all pass.

## Mobile checks

- clean dependency installation;
- repository-wide file-size audit;
- TypeScript compilation;
- complete Vitest suite;
- Expo public configuration generation against the non-production `release-gate.invalid` host;
- exact source provenance injected through `EXPO_PUBLIC_SOURCE_COMMIT_SHA`;
- `extra.buildProvenance.sourceCommit` equality with the checked-out mobile SHA;
- app identifier parity for Android package and iOS bundle identifier;
- application scheme, `appVersion` runtime policy, and production update-channel validation;
- iOS associated-domain and Android verified app-link validation for `https://release-gate.invalid/auth/reset-password`;
- Expo export and Expo Doctor.

The generated mobile evidence contains only bounded release metadata: source SHA, application version, package identifiers, runtime policy, update channel, and the synthetic password-reset route. It contains no user, token, credential, health, workout, nutrition, or provider data.

The pull-request changed-file audit is intentionally not run here because an arbitrary pinned release SHA has no pull-request base context. The repository-wide audit remains authoritative for the checked-out release tree.

## Backend checks

- clean dependency installation with development tooling;
- type-aware lint and TypeScript build;
- compiled production environment validation with all provider-backed public capabilities disabled;
- all Drizzle migrations on a clean PostgreSQL 16 database;
- repeated migration execution to verify idempotency;
- migrated-schema and scoped-idempotency integration tests against PostgreSQL;
- complete Vitest suite;
- production startup and `/health` verification.

## Repository access

The backend checkout uses `BACKEND_REPOSITORY_TOKEN` when configured and otherwise falls back to the workflow token. Configure the repository secret only when the default token cannot read `hon4olo/smart-fitness-backend`.

Never put the token in workflow inputs, source files, logs, Expo public configuration, or release evidence.

## Evidence artifact

The final `Release ready` job fails whenever immutable-ref validation, mobile validation, or backend validation is skipped, cancelled, or fails.

On success it writes `release-evidence.json` with schema version `1`, the GitHub run ID, exact mobile/backend release SHAs, and exact mobile/backend rollback SHAs. The artifact is retained for 30 days. No branch or tag is recorded as authoritative evidence.

This artifact proves only that the pinned source pair passed the source-level release gate at that run. It does not prove physical-device behavior, store acceptance, deployment success, production health, or that a rollback was executed.

## Operator use and stop conditions

Before approving a release-gate run:

1. Select the exact intended mobile and backend commits.
2. Select the exact previously validated mobile and backend rollback commits.
3. Confirm both rollback commits are known-good together as a pair.
4. Confirm the release contains no authorization-gated operational action.
5. Run the gate and retain the successful evidence artifact with the release decision.

Stop immediately and do not publish or deploy when:

- any SHA is missing, mutable, abbreviated, unresolved, or not the intended commit;
- either rollback commit is not an ancestor of the selected release;
- source provenance, package identity, app-link routing, runtime policy, or update channel differs from the approved contract;
- any mobile or backend validation is skipped, cancelled, or fails;
- the final evidence artifact is absent or does not contain all four exact SHAs;
- physical-device, native-runtime, credential, infrastructure, migration, or rollback ownership is unresolved.

The gate does not replace physical-device validation. Native builds, installation, OTA/EAS publication, deployment, migration outside CI, store submission, rollback execution, and production activation remain authorization-gated actions.
