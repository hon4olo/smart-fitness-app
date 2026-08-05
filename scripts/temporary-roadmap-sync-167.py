from pathlib import Path

PLAN_PATH = Path('docs/implementation-plan.md')
CURRENT_STATUS_PATH = Path('docs/current-status.md')
HANDOFF_PATH = Path('docs/handoffs/latest.md')

plan = PLAN_PATH.read_text()

if 'Backend PR #167 adds the fifth ownership-safe' not in plan:
    replacements = [
        (
            '- mobile `main`: `edc457a6de504434ca555f3305535ae0ef01bab8`;\n- backend `main`: `947989f8adfe85fa34248fc439b07e210f00d1b4`;',
            '- mobile `main`: `5669c445000c4e6d3782826049d16feb78975858`;\n- backend `main`: `cbcecff4c0def1771bd91a67ff389ae517f48d8a`;',
        ),
        (
            'four ownership-safe allowlisted projections exist',
            'five ownership-safe allowlisted projections exist',
        ),
        (
            'first four ownership-safe projections defined',
            'first five ownership-safe projections defined',
        ),
        (
            'The durable limiter and first four projections exist in source',
            'The durable limiter and first five projections exist in source',
        ),
    ]

    for old, new in replacements:
        count = plan.count(old)
        if count != 1:
            raise SystemExit(
                f'Expected exactly one occurrence of {old!r}, found {count}'
            )
        plan = plan.replace(old, new)

    anchor = """Evidence: backend `docs/privacy/data-access-export-nutrition-projection.md`.

Mobile PR #431 establishes a privacy-safe account-deletion status presentation contract:"""
    insertion = """Evidence: backend `docs/privacy/data-access-export-nutrition-projection.md`.

Backend PR #167 adds the fifth ownership-safe allowlisted export projection for `workouts_programs_and_exercises`:

- only the authenticated owner's active workout templates, workout sessions, normalized session exercises and sets, training programs, and custom exercises are read;
- all six registered workout tables share one read-only repeatable-read PostgreSQL snapshot;
- JSON-backed templates, programs, and custom exercises are rebuilt through strict versioned parsers, while sessions are rebuilt from validated normalized relationships;
- raw `templateData`, `sessionData`, `programData`, `exerciseData`, internal row and relationship IDs, ownership/device metadata, revisions, tombstones, source-set IDs, Coach run/session IDs, rationale codes, and arbitrary metadata are excluded before serialization;
- malformed snapshots, duplicate IDs/orders, broken prescription or set relationships, invalid numeric ranges, and non-custom rows in the custom-exercise table fail closed;
- source bounds fail closed above 250 templates, 1,000 sessions, 5,000 normalized exercises, 20,000 sets, 250 programs, or 500 custom exercises;
- PostgreSQL evidence covers cross-user isolation, deleted owners/tombstones, malformed normalized relationships, every source bound, and concurrent snapshot consistency;
- the canonical projection registry guard now includes `workouts_programs_and_exercises`;
- the projection remains separate from preparation, route composition, multi-surface assembly, archive generation, secure delivery, and mobile UI.

Evidence: backend `docs/privacy/data-access-export-workouts-projection.md`.

Mobile PR #431 establishes a privacy-safe account-deletion status presentation contract:"""
    if plan.count(anchor) != 1:
        raise SystemExit(
            f'Expected one PR #167 insertion anchor, found {plan.count(anchor)}'
        )
    plan = plan.replace(anchor, insertion)
    PLAN_PATH.write_text(plan)

CURRENT_STATUS_PATH.write_text("""# Smart Fitness Current Status

Updated: 2026-08-05

## Verified repository baseline

Verified after backend PR #167:

- mobile `main`: `5669c445000c4e6d3782826049d16feb78975858`;
- backend `main`: `cbcecff4c0def1771bd91a67ff389ae517f48d8a`;
- backend PR #167 merged the `workouts_programs_and_exercises` export projection;
- no open mobile or backend pull requests before this roadmap-sync slice.

Always re-check both repositories and open pull requests before work. This file records a checkpoint, not a live Git query.

## Engineering state

The canonical implementation plan estimates approximately:

- completed: 89%;
- remaining: 11%.

Completed source packages include:

- P0-P6 provider-neutral foundations and readiness scaffolding;
- P7 explicit synchronization-conflict resolution;
- P8 diagnostics and adversarial release preparation;
- P9-A technical data inventory;
- P9-B1 operational retention foundation;
- P9-B2 cross-surface account deletion source work.

Active packages:

1. P9-B3 provider/environment retention evidence — externally blocked until exact providers, environments, owners, credentials, lifecycle controls, and evidence are available.
2. P9-C consent and analytics prerequisites — collection remains disabled; no production event or measurement purpose is registered.
3. P9-D privacy-facing controls and policy evidence — source-only preparation boundaries and ownership-safe projections are being extended.
4. Operational and physical evidence — authorization-gated staging, deployment, worker scheduling, native build, release-device, offline-restart, accessibility, localization, and second-device validation.

See `docs/implementation-plan.md` for complete package evidence.

## Mobile state

Current mobile source includes:

- focused production state boundaries with zero production `useAppContext` consumers;
- revisioned synchronization for every currently registered private mobile domain;
- persisted conflict review and explicit conflict resolution;
- secure native token storage;
- deterministic and structured Coach flows with explicit confirmation;
- account-deletion recovery and privacy-facing fail-closed contracts;
- blocking source CI, Expo export, and Expo Doctor checks;
- no known tracked hand-written source file above 500 physical lines.

Source tests do not replace physical matching-runtime validation.

## Backend state

Backend `main` contains:

- authenticated ownership-safe revisioned synchronization for the full current mobile entity set;
- deterministic and structured Coach orchestration;
- provider-neutral capability gates;
- account deletion and deletion-receipt source flows;
- technical data and operational retention registries;
- disabled-by-default data-access export route/preparation boundaries;
- durable source attempt limiting;
- five ownership-safe export projections on `main`:
  - `profile_and_account_metadata`;
  - `progress_measurements_and_weight`;
  - `limitations_recovery_and_safety_context`;
  - `nutrition_and_meal_data`;
  - `workouts_programs_and_exercises`.

The workout projection reads six owner-scoped tables in one repeatable-read snapshot, strictly parses JSON-backed records, reconstructs normalized sessions, excludes internal identifiers and metadata, and fails closed on malformed relationships or source-bound overflow.

All projections remain separate from preparation, route activation, multi-surface assembly, archive generation, secure delivery, and mobile UI.

## Remaining candidate export surfaces

Source projections are still absent for:

- `coach_reviews_proposals_and_run_history`;
- `social_relationships_and_account_activity`.

The Coach surface is the next bounded candidate, subject to a fresh schema/privacy audit. Social requires explicit separation of authored, received, relationship, block, notification, and mixed-policy data before implementation.

## Disabled or authorization-gated

The following remain disabled, absent from default production composition, or require direct authorization:

- product analytics, crash collection, performance telemetry, attribution, and advertising tracking;
- public data-access export assembly, archive generation, secure delivery, and mobile export UI;
- model/provider staging execution;
- worker scheduling and external lifecycle proof;
- backend deployment and production migration execution;
- OTA/EAS publication, native build, installation, rollback execution, and store submission;
- credential, DNS, provider-account, or production-environment changes.

## Documentation state

- `docs/project-context.md` provides stable orientation;
- `docs/current-status.md` provides mutable verified state;
- `docs/handoffs/latest.md` provides the continuation checkpoint;
- `docs/architecture/README.md` indexes focused architecture documents;
- `docs/implementation-plan.md` remains the canonical cross-repository roadmap.
""")

HANDOFF_PATH.write_text("""# Latest Handoff

Updated: 2026-08-05

## Checkpoint

Roadmap synchronization after backend PR #167:

- mobile `main` before this docs slice: `5669c445000c4e6d3782826049d16feb78975858`;
- backend `main`: `cbcecff4c0def1771bd91a67ff389ae517f48d8a`;
- backend PR #167 merged the fifth ownership-safe projection, `workouts_programs_and_exercises`;
- no open mobile or backend pull requests existed before this branch was created.

This file is a continuation checkpoint. It must be updated when a merged change materially alters the active package, blockers, repository baseline, or next safe action.

## Start-of-session checklist

1. Fetch exact current `main` for both repositories.
2. Inspect open pull requests and avoid overlapping active branches.
3. Read:
   - `AGENTS.md`;
   - `docs/project-context.md`;
   - `docs/current-status.md`;
   - `PROJECT_LEARNINGS.md`;
   - `docs/implementation-plan.md`;
   - relevant focused architecture/privacy/operations documents.
4. Confirm the task is inside the currently approved roadmap package.
5. Work from a clean branch based on exact current `main`.

## Current continuation boundary

- Backend `main` contains five ownership-safe source projections.
- The remaining candidate surfaces are `coach_reviews_proposals_and_run_history` and `social_relationships_and_account_activity`.
- The next bounded source-only candidate is Coach, but implementation must start with a fresh audit of Coach tables, structured outputs, provenance, provider metadata, hidden-reasoning exclusions, mixed-policy fields, and source bounds.
- Do not start Social projection work until authored-versus-received activity, other-user fields, block relationships, notifications, moderation/security records, and mixed-policy data are explicitly separated.
- Every projection must remain owner-scoped, allowlisted, bounded, provider-neutral, and separate from route activation, multi-surface assembly, archive generation, delivery, or mobile UI unless those scopes are explicitly approved.
- P9-B3 cannot progress through assumptions; it requires exact provider/environment evidence.
- P9-C must keep every collection path fail closed until policy, provider, persistence, disclosure, localization, accessibility, and consent requirements are resolved.

## Prohibited implicit actions

Do not perform or claim:

- backend deployment;
- production migration execution;
- provider or staging activation;
- route activation or archive generation;
- worker scheduling;
- OTA/EAS publication;
- native build or installation;
- rollback execution;
- store submission;
- credential, DNS, or production-environment changes.

These require direct authorization.

## Handoff update template

When replacing this checkpoint, record:

- verification date;
- exact mobile and backend `main` SHAs before the handoff update;
- open pull requests and non-overlap constraints;
- completed package or PR;
- validation actually run;
- active blockers;
- exact next safe action;
- actions not performed.
""")
