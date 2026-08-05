from pathlib import Path

PATH = Path('docs/implementation-plan.md')


def replace_once(text: str, old: str, new: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'expected one match, found {count}: {old[:160]!r}')
    return text.replace(old, new, 1)


text = PATH.read_text()

text = replace_once(
    text,
    """Verified after backend PR #172 and mobile PR #450:

- mobile `main` before this roadmap-sync slice: `1960315fb9befe1a9ad8d34c1cce8b16983eb5d7`;
- backend `main`: `9a19bff2bf8ce327b7cbeda77fc3097c5994b40e`;
- no open mobile or backend pull requests before this roadmap-sync slice;
- all public provider-backed capabilities remain disabled;
- analytics, crash reporting, performance telemetry, attribution and advertising collection remain disabled;
- no production analytics event or measurement purpose is registered;
- the default production composition has no data-access export endpoint; an optional source-only route boundary, durable PostgreSQL attempt limiter, six complete ownership-safe allowlisted projections, the bounded Social owned-content source, and a resolved notice-only managed-media disposition exist, but they are not composed by default and no complete Social projection, managed-media notice projection, binary media export, multi-surface assembly, archive generation or delivery path exists;
- no provider/staging execution, deployment, migration outside CI, backend worker scheduling, native build, OTA/EAS publication, rollback execution, store submission, legal-hold mutation, destructive production cleanup or production activation has been performed.
""",
    """Verified after backend PR #173 and mobile PR #451:

- mobile `main` before this roadmap-sync slice: `4cf8494c8a960874747ff8b3cc32109f3c91aadc`;
- backend `main`: `f35a8c0b9a343ac759e1d617c7d088d599b0ed7a`;
- no open mobile or backend pull requests before this roadmap-sync slice;
- all public provider-backed capabilities remain disabled;
- analytics, crash reporting, performance telemetry, attribution and advertising collection remain disabled;
- no production analytics event or measurement purpose is registered;
- the default production composition has no data-access export endpoint; an optional source-only route boundary, durable PostgreSQL attempt limiter, six complete ownership-safe allowlisted projections, the bounded Social owned-content source, notice-only managed-media disposition, and actor/target-free notification representation exist, but they are not composed by default and no complete Social projection, notification source, managed-media notice/binary implementation, multi-surface assembly, archive generation or delivery path exists;
- no provider/staging execution, deployment, migration outside CI, backend worker scheduling, native build, OTA/EAS publication, rollback execution, store submission, legal-hold mutation, destructive production cleanup or production activation has been performed.
""",
)

text = replace_once(
    text,
    '| P9-D privacy-facing controls and policy evidence | active; source contracts, route boundary, durable limiter, six complete projections, bounded Social owned-content source and notice-only managed-media disposition defined |',
    '| P9-D privacy-facing controls and policy evidence | active; source contracts, route boundary, durable limiter, six complete projections, bounded Social owned-content source, notice-only media disposition and actor/target-free notification representation defined |',
)

text = replace_once(
    text,
    '3. **P9-D — Privacy-facing controls and policy evidence.** Preserve the six complete ownership-safe projections, the bounded `social_profile_and_authored_posts` source, and the notice-only managed-media disposition; resolve one remaining Social audit decision at a time, then define multi-surface assembly plus audit/idempotency and continue deletion-status/reviewed-disclosure work. The optional route remains disabled by default pending separate deployed-composition approval; the complete Social surface, managed-media notice/binary implementation, secure delivery, UI integration and public policy text remain separate reviewed slices.',
    '3. **P9-D — Privacy-facing controls and policy evidence.** Preserve the six complete ownership-safe projections, the bounded `social_profile_and_authored_posts` source, the notice-only managed-media disposition, and actor/target-free notification representation; resolve one remaining Social audit decision at a time, then define multi-surface assembly plus audit/idempotency and continue deletion-status/reviewed-disclosure work. The optional route remains disabled by default pending separate deployed-composition approval; the complete Social surface, notification source/disclosure, managed-media notice/binary implementation, secure delivery, UI integration and public policy text remain separate reviewed slices.',
)

anchor = """Evidence: backend `docs/privacy/data-access-export-social-media-disposition.md`.

Mobile PR #431 establishes a privacy-safe account-deletion status presentation contract:
"""
replacement = """Evidence: backend `docs/privacy/data-access-export-social-media-disposition.md`.

Backend PR #173 resolves Social notification actor/target representation without implementing a notification source:

- the maximum future notification shape is one closed notification type, read timestamp, and creation timestamp;
- actor and target representation are always omitted;
- actor/recipient IDs, actor profile/display fields, post/comment IDs and content, dedupe keys, and delivery metadata remain excluded;
- actor/target deletion, blocking, privacy changes, or inaccessibility have no representation effect because actor/target data is absent;
- the contract agrees exactly with the four current `SOCIAL_NOTIFICATION_TYPES`;
- `receivedActivityDisclosure` remains `blocked` and `sourceImplementationAllowed` remains `false`;
- third-party received-activity disclosure and deterministic bounds/snapshot blockers remain active;
- exact-head Backend CI and Account Deletion Receipt CI passed before merge;
- no query, DTO, repository, route, schema, migration, archive, delivery, deployment, or production activation was added.

Evidence: backend `docs/privacy/data-access-export-social-notification-disposition.md`.

Mobile PR #431 establishes a privacy-safe account-deletion status presentation contract:
"""
text = replace_once(text, anchor, replacement)

text = replace_once(
    text,
    '- preserve the bounded `social_profile_and_authored_posts` source and the notice-only managed-media disposition, then resolve one remaining Social audit decision at a time; the complete `social_relationships_and_account_activity` surface and managed-media notice/binary implementation remain blocked and must not be inferred from those source contracts;',
    '- preserve the bounded `social_profile_and_authored_posts` source, notice-only managed-media disposition, and actor/target-free notification representation, then resolve one remaining Social audit decision at a time; the complete `social_relationships_and_account_activity` surface, notification disclosure/source implementation, and managed-media notice/binary implementation remain blocked and must not be inferred from those contracts;',
)

text = replace_once(
    text,
    '- **P9-D implementation and review:** bounded own-profile/own-post Social source and notice-only managed-media disposition are complete; counterpart, action-target, received-activity, notification, inaccessible-record and remaining table-bound decisions remain before any complete Social projection, while managed-media notice/binary implementation, multi-surface assembly, separately approved route composition, audit/idempotency, secure delivery, mobile UI/localization/accessibility and policy/legal approval remain separate;',
    '- **P9-D implementation and review:** bounded own-profile/own-post Social source, notice-only managed-media disposition, and notification actor/target omission are complete; counterpart, action-target, received-notification disclosure, inaccessible-record and remaining table-bound decisions remain before any complete Social projection, while notification source implementation, managed-media notice/binary implementation, multi-surface assembly, separately approved route composition, audit/idempotency, secure delivery, mobile UI/localization/accessibility and policy/legal approval remain separate;',
)

PATH.write_text(text)
