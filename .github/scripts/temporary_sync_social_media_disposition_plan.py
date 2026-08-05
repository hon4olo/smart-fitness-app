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
    """Verified after backend PR #171 and mobile PR #449:

- mobile `main` before this roadmap-sync slice: `aad136aa2caeafb15240ff0b817f9fd3bd86110e`;
- backend `main`: `be3548f0266f819324170e24bc4d5d66bdf10189`;
- no open mobile or backend pull requests before this roadmap-sync slice;
- all public provider-backed capabilities remain disabled;
- analytics, crash reporting, performance telemetry, attribution and advertising collection remain disabled;
- no production analytics event or measurement purpose is registered;
- the default production composition has no data-access export endpoint; an optional source-only route boundary, durable PostgreSQL attempt limiter, six complete ownership-safe allowlisted projections, and the bounded Social owned-content source exist, but they are not composed by default and no complete Social projection, multi-surface assembly, archive generation or delivery path exists;
- no provider/staging execution, deployment, migration outside CI, backend worker scheduling, native build, OTA/EAS publication, rollback execution, store submission, legal-hold mutation, destructive production cleanup or production activation has been performed.
""",
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
)

text = replace_once(
    text,
    '| P9-D privacy-facing controls and policy evidence | active; source contracts, route boundary, durable limiter, six complete projections and a bounded Social owned-content source defined |',
    '| P9-D privacy-facing controls and policy evidence | active; source contracts, route boundary, durable limiter, six complete projections, bounded Social owned-content source and notice-only managed-media disposition defined |',
)

text = replace_once(
    text,
    '3. **P9-D — Privacy-facing controls and policy evidence.** Preserve the six complete ownership-safe projections and the bounded `social_profile_and_authored_posts` source, resolve one remaining Social audit decision at a time, then define multi-surface assembly plus audit/idempotency and continue deletion-status/reviewed-disclosure work. The optional route remains disabled by default pending separate deployed-composition approval; the full Social surface, secure delivery, UI integration and public policy text remain separate reviewed slices.',
    '3. **P9-D — Privacy-facing controls and policy evidence.** Preserve the six complete ownership-safe projections, the bounded `social_profile_and_authored_posts` source, and the notice-only managed-media disposition; resolve one remaining Social audit decision at a time, then define multi-surface assembly plus audit/idempotency and continue deletion-status/reviewed-disclosure work. The optional route remains disabled by default pending separate deployed-composition approval; the complete Social surface, managed-media notice/binary implementation, secure delivery, UI integration and public policy text remain separate reviewed slices.',
)

anchor = """Evidence: backend `docs/privacy/data-access-export-social-audit.md` and `docs/privacy/data-access-export-social-projection.md`.

Mobile PR #431 establishes a privacy-safe account-deletion status presentation contract:
"""
replacement = """Evidence: backend `docs/privacy/data-access-export-social-audit.md` and `docs/privacy/data-access-export-social-projection.md`.

Backend PR #172 resolves managed avatar and workout-post media disposition without expanding the Social source:

- `social_profiles.avatar_url`, `social_profiles.avatar_media_asset_id`, and `social_workout_posts.media_asset_id` remain excluded from owned-content and raw Social relationship/activity sources;
- both bindings map to the separate registered `managed_media_metadata` surface;
- that surface remains `notice_only` with `mixed_policy_review` row scope;
- raw URLs, asset IDs, public descriptors, private object keys, hashes, provider/model fields, moderation/OCR signals, reviewer state, appeals, legal holds, cleanup, delivery, lease, and retention internals remain excluded;
- otherwise eligible non-media profile/post content remains exportable when media is missing, deleted, rejected, failed, or unavailable, with no internal-ID or URL fallback;
- executable guards require exact agreement with all seven managed-media governance tables;
- `SOCIAL_MANAGED_MEDIA_NOTICE_PROJECTION_IMPLEMENTATION_ALLOWED` and `SOCIAL_EXPORT_PROJECTION_IMPLEMENTATION_ALLOWED` remain `false`;
- exact-head Backend CI and Account Deletion Receipt CI passed before merge;
- no schema, migration, media query, notice projection, binary export, route, archive, delivery, deployment, or production activation was added.

Evidence: backend `docs/privacy/data-access-export-social-media-disposition.md`.

Mobile PR #431 establishes a privacy-safe account-deletion status presentation contract:
"""
text = replace_once(text, anchor, replacement)

text = replace_once(
    text,
    '- preserve the bounded `social_profile_and_authored_posts` source and resolve one remaining Social audit decision at a time; the complete `social_relationships_and_account_activity` surface remains blocked and must not be inferred from the partial source;',
    '- preserve the bounded `social_profile_and_authored_posts` source and the notice-only managed-media disposition, then resolve one remaining Social audit decision at a time; the complete `social_relationships_and_account_activity` surface and managed-media notice/binary implementation remain blocked and must not be inferred from those source contracts;',
)

text = replace_once(
    text,
    '- **P9-D implementation and review:** bounded own-profile/own-post Social source is complete; counterpart, action-target, received-activity, notification, media and inaccessible-record decisions remain before any full Social projection, followed by multi-surface assembly, separately approved route composition, audit/idempotency, secure delivery, mobile UI/localization/accessibility and policy/legal approval;',
    '- **P9-D implementation and review:** bounded own-profile/own-post Social source and notice-only managed-media disposition are complete; counterpart, action-target, received-activity, notification, inaccessible-record and remaining table-bound decisions remain before any complete Social projection, while managed-media notice/binary implementation, multi-surface assembly, separately approved route composition, audit/idempotency, secure delivery, mobile UI/localization/accessibility and policy/legal approval remain separate;',
)

PATH.write_text(text)
