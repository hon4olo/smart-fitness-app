# Latest Handoff

Updated: 2026-08-07

## Checkpoint

Social notification source-plan baseline after backend PR #174:

- mobile `main` before this documentation slice: `9f850036142fd72bc8cb76a3beaf756989ad0b38`;
- backend `main`: `5f66e7b5b9756d951bbfe1071b6e9b459604ea3d`;
- backend PR #170 established the executable Social ownership/privacy audit;
- backend PR #171 added only the bounded `social_profile_and_authored_posts` partial source;
- backend PR #172 resolved managed media as notice-only mixed-policy data;
- backend PR #173 resolved notification actor/target representation through permanent omission;
- backend PR #174 resolved notification source bounds, deterministic ordering and repeatable-read snapshot semantics;
- backend PR #174 exact head `8ca5081928000d6f7fab62c6e2aea78e907fab4f` passed Backend CI run `31127989601` and Account Deletion Receipt CI run `31127989983` before squash merge;
- backend PR #174 merge SHA is `5f66e7b5b9756d951bbfe1071b6e9b459604ea3d`.

## Start-of-session checklist

1. Fetch exact current `main` for both repositories.
2. Inspect open pull requests and avoid overlapping active branches.
3. Read `AGENTS.md`, project context/status, `PROJECT_LEARNINGS.md`, `docs/implementation-plan.md`, and relevant privacy/architecture documents.
4. Treat the executable Social audit and merged PRs #171-#174 as authoritative over older wording.
5. Work inside exactly one approved roadmap boundary from a clean branch.

## Current notification contract

The maximum future representation remains actor/target-free:

- closed notification type;
- read timestamp;
- creation timestamp.

Actor and target representation are permanently omitted. Actor/recipient IDs, actor display/profile data, target IDs/content, dedupe keys and delivery metadata are excluded.

PR #174 resolves only the technical source-plan semantics:

- active authenticated owner required;
- owner-as-recipient rows only;
- one read-only PostgreSQL `REPEATABLE READ` transaction;
- deterministic order by `created_at` ascending then internal notification ID ascending;
- internal notification ID is a non-exported tie-breaker;
- fail closed above 5,000 eligible rows;
- no silent truncation, continuation token or independently committed page;
- closed notification-type and type-specific target-shape validation;
- self-actor rows fail closed.

The following remain blocked:

- `receivedActivityDisclosure`;
- `sourceImplementationAllowed`;
- `social_notifications` source readiness;
- complete Social projection implementation;
- multi-surface assembly, audit/idempotency, archive generation, secure delivery and mobile UI.

No query, repository, DTO, route, schema, migration, archive, delivery, deployment or production activation was introduced by PR #174.

## Current continuation boundary

The active roadmap priority remains P9-B3, P9-C, P9-D, then authorization-gated operational/physical evidence. P9-B3 cannot advance from assumptions and P9-C must keep collection fail closed.

For provider-neutral P9-D work, resolve exactly one remaining Social audit decision at a time. The most direct next notification slice is:

**Decide whether the already-minimized actor/target-free received notification metadata may be disclosed at all.**

That decision must be explicit and executable. It must not silently authorize a source implementation. If disclosure remains blocked, record the reason and preserve `sourceImplementationAllowed: false`. If disclosure is approved, source implementation must still be a separate reviewed slice using the already-defined bounds/snapshot contract.

Alternative bounded Social decisions remain counterpart representation for outgoing graph/action rows, incoming follow/request disclosure, owner-authored comment/reaction target representation, and deleted/private/blocked/inaccessible target behavior.

Incoming blocks remain permanently excluded. Received third-party activity is not automatically owner-authored export data.

## Validation and runner note

Backend PR #174 validation completed successfully after the Hermes backend self-hosted runner service was safely restarted. The runner configuration and credentials were not changed. Old queued runs on obsolete heads are non-authoritative; exact-head green evidence above is authoritative.

Documentation-only mobile changes do not require Expo execution, but exact baselines, links and cross-repository claims must be verified and the exact-head Mobile CI must pass before merge.

## Prohibited implicit actions

Do not perform or claim backend deployment, production migration execution, provider/staging activation, complete Social projection approval, notification source implementation, managed-media notice/binary implementation, route activation, archive generation, worker scheduling, secure delivery, OTA/EAS publication, native build/install, rollback, store submission, or credential/DNS/production-environment changes without direct authorization.