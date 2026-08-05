from pathlib import Path

path = Path('docs/implementation-plan.md')
text = path.read_text()

replacements = [
    (
        '- mobile `main`: `5669c445000c4e6d3782826049d16feb78975858`;\n- backend `main`: `cbcecff4c0def1771bd91a67ff389ae517f48d8a`;',
        '- mobile `main`: `6df2278614b296e782e4edffb6b4895e7176f3a6`;\n- backend `main`: `ccea35967516b168e877e8803a8dd3c7c40c973d`;',
    ),
    (
        'five ownership-safe allowlisted projections exist',
        'six ownership-safe allowlisted projections exist',
    ),
    (
        'first five ownership-safe projections defined',
        'first six ownership-safe projections defined',
    ),
    (
        'The durable limiter and first five projections exist in source',
        'The durable limiter and first six projections exist in source',
    ),
]

for old, new in replacements:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'Expected one occurrence of {old!r}, found {count}')
    text = text.replace(old, new)

anchor = """Evidence: backend `docs/privacy/data-access-export-workouts-projection.md`.

Mobile PR #431 establishes a privacy-safe account-deletion status presentation contract:"""
insertion = """Evidence: backend `docs/privacy/data-access-export-workouts-projection.md`.

Backend PR #168 adds the sixth ownership-safe allowlisted export projection for `coach_reviews_proposals_and_run_history`:

- only the authenticated owner's Coach runs and stages are read, with both tables sharing one read-only repeatable-read PostgreSQL snapshot;
- all nine current request types use explicit domain-specific result parsers rather than raw Coach JSON serialization;
- output is limited to bounded user-facing metrics, proposals, readiness, confirmation/application state, failure codes, run status, and stage chronology;
- run/stage/child/source/target/exercise/limitation IDs, idempotency keys, revisions, raw request/context/result/input/output/error payloads, provider/model/usage metadata, prompts, hidden reasoning, validation paths, and internal diagnostics are excluded;
- failed runs expose only a bounded error code, and unsupported historical result shapes fail closed rather than being guessed or omitted;
- domain/request/result/terminal consistency, lifecycle timestamps, stage ownership, stage sequence, and signed Nutrition target deltas are validated;
- source bounds fail closed above 500 Coach runs or 5,000 Coach stages;
- unit evidence covers every request type and PostgreSQL evidence covers owner isolation, deleted owners, stage ownership mismatch, both bounds, and concurrent snapshot consistency;
- the canonical projection registry guard now includes `coach_reviews_proposals_and_run_history`;
- the projection remains separate from preparation invocation, route composition, multi-surface assembly, archive generation, secure delivery, and mobile UI.

Evidence: backend `docs/privacy/data-access-export-coach-projection.md`.

Mobile PR #431 establishes a privacy-safe account-deletion status presentation contract:"""

if text.count(anchor) != 1:
    raise SystemExit(f'Expected one Coach insertion anchor, found {text.count(anchor)}')
text = text.replace(anchor, insertion)
path.write_text(text)
