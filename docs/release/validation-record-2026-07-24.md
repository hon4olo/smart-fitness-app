# Release Validation Record — 2026-07-24

Status: **not release-ready**. Source-code and repository-local CI gates are green, but the combined private-repository gate, staging validation, native builds, and device validation remain incomplete.

## Verified repository state

### Mobile

- Runtime/source baseline validated by the fixed-SHA gate: `a29d823ec83a8c07109754bf79e95f4ecbdb9112`.
- Fixed-SHA workflow run: `30099396214`.
- Successful mobile checks in that run:
  - dependency installation;
  - TypeScript;
  - complete mobile test suite;
  - Expo public configuration generation.
- Release-gate private-backend token support was later merged in mobile PR `#88`, merge `92749354b5812fe95ba8b698f2f78c67231d6bb7`.
- PR `#88` exact head `3caf75331dc81ffca83698b50fc807dcdfaa303c` passed repository line audits, TypeScript, Coach/sync contracts, and the full regression suite in Mobile CI run `30100074400`.

### Backend

- Combined Strategy v3 integration: backend PR `#45`, merge `14b24e41f27266555230120f3b31d47b86795a73`.
- Production configuration and PostgreSQL migration gate: backend PR `#46`, merge `c8cf3f848e9debacf5e12a105501f5ca8d5cbc96`.
  - Exact validated head: `4fae33807939d5de3abdbdb3aedab8749daad898`.
  - Backend CI run: `30099074550`.
  - Successful checks: lint, TypeScript build, production configuration parsing, initial migrations, repeated migrations, migrated-schema integration, full Vitest suite.
- Compiled production startup and health gate: backend PR `#47`, merge `bb9129ac6a4a3654f5c0d478a547d33fe5272b9a`.
  - Exact validated head: `9b8ffda2435b878a1a48068fa8f0ab4e33cfe22f`.
  - Backend CI run: `30099797169`.
  - Successful checks: every PR `#46` check plus `npm run start:production` and a successful local `/health` response.

## Combined fixed-SHA attempt

Temporary mobile PR `#87` invoked the reusable release gate with:

- mobile: `a29d823ec83a8c07109754bf79e95f4ecbdb9112`;
- backend: `c8cf3f848e9debacf5e12a105501f5ca8d5cbc96`;
- workflow run: `30099396214`.

Outcome:

- mobile job: **success**;
- backend job: **failed during cross-repository checkout before backend code executed**;
- final release-ready job: **failed**, as designed.

The checkout used the mobile repository's scoped `GITHUB_TOKEN`, which did not have sufficient access to read the private backend repository. This is an orchestration/credential boundary, not a backend test failure.

Mobile PR `#88` added optional read-only checkout support through the Actions secret `BACKEND_REPOSITORY_TOKEN`. No credential was created, stored, or activated by source-code work.

## Required rerun

Before release readiness can be claimed:

1. Configure `BACKEND_REPOSITORY_TOKEN` in the mobile repository with read-only access to `hon4olo/smart-fitness-backend`.
2. Run `Smart Fitness Release Gate` through `workflow_dispatch` using exact current mobile and backend commit SHAs.
3. Record the workflow run ID and require all three jobs to succeed:
   - Mobile release validation;
   - Backend release validation;
   - Release ready.
4. Continue with protected staging and device validation only after the combined gate is green.

## Explicitly not performed

- backend deployment;
- production or staging migration execution;
- model-provider credential activation;
- native iOS or Android build;
- device installation;
- TestFlight, Play testing, EAS Update, or OTA publication;
- real-device or second-device smoke testing;
- production activation.
