# Social network roadmap

Updated: 2026-08-01

## Product objective

Add a privacy-first social layer around completed workouts without coupling public content to the private offline-sync state.

The first release is a Social MVP, not a general-purpose social network. It should improve accountability, retention, and organic discovery while keeping health, nutrition, recovery, limitation, authentication, and Coach data private by default.

## Architecture boundary

Private application data remains in the existing offline-first AppState and revisioned sync system.

Social data is server-authoritative and uses a separate API boundary:

```text
Private sync
- workouts and active drafts
- nutrition and measurements
- limitations and recovery
- private profile/settings

Social API
- social profiles
- follows and follow requests
- blocks and reports
- workout-post snapshots
- reactions and comments
- notifications
- moderated media assets
```

Rules:

- never expose a private workout entity directly in a feed;
- a shared workout is an immutable bounded public snapshot created only after explicit confirmation;
- later edits or deletion of the private workout must not silently rewrite the published snapshot;
- publication is opt-in and never automatic;
- public DTOs must not contain email, auth/session/device data, health limitations, recovery data, body measurements, nutrition logs, Coach context, raw internal IDs, or free-form private notes;
- social writes require authenticated ownership and idempotency where retryable;
- block enforcement is server-side and applies to profiles, follows, feeds, posts, comments, reactions, and notifications;
- account deletion cascades through all social records;
- user-uploaded media must remain private until server-side validation and moderation approve it;
- PostgreSQL stores media metadata and audit state, while image bytes live in private object storage and approved CDN variants.

## Phase S0 — contracts and safety baseline

Status: complete and maintained as a blocking boundary.

- [x] define the Social MVP scope and architecture boundary;
- [x] define versioned public DTOs and stable error codes;
- [x] define username normalization, reservation, validation, and uniqueness;
- [x] define public/private profile visibility;
- [x] define block semantics and account-deletion cascade;
- [x] add backend migration, repository/service boundaries, and blocking tests;
- [x] add mobile API parsers only after backend contracts are merged.

Acceptance criteria:

- the backend derives ownership only from the authenticated session;
- public data is bounded and privacy-reviewed;
- usernames are canonical and case-insensitively unique;
- changing visibility cannot bypass an existing block;
- source CI is green before any device or deployment claim.

## Phase S1 — social profiles and follow graph

Backend:

- [x] `social_profiles` with username, display name, bio, avatar URL, visibility, timestamps, and counters derived safely;
- [x] `social_follows` for accepted relationships;
- [x] `social_follow_requests` for private profiles;
- [x] `social_blocks` with symmetric visibility enforcement;
- [x] authenticated self-profile read/update;
- [x] username lookup and public-profile read;
- [x] follow, unfollow, request, approve, reject, and cancel operations;
- [x] ownership, privacy, duplicate-delivery, block, and account-deletion tests;
- [x] private incoming-request profile review and viewer-owned unblock recovery without revealing reverse-side blocks;
- [x] cursor-paginated follower, following, incoming-request, and outgoing-request discovery routes.

Contract note:

A private requester may be inspected by the authenticated request recipient so approve/reject controls remain reachable. A viewer-owned block returns a dedicated bounded error solely to restore `Unblock`; a reverse-side block remains generic. Relationship discovery uses authenticated owner-scoped cursor endpoints with stable `createdAt + id` ordering and opaque fail-closed cursors.

Mobile:

- [x] Social profile editor;
- [x] public profile screen with exact-username lookup;
- [x] follow, unfollow, request, cancel, approve, reject, block, and restart-safe unblock controls;
- [x] strict versioned follower/following/request page contracts and bounded API pagination;
- [x] followers/following and incoming/outgoing request lists with cursor pagination;
- [x] localized empty, loading, offline, expired-session, invalid-cursor, retry, private-visibility, and pending-request states;
- [x] approve, reject, cancel-request, and unfollow actions directly from relationship lists;
- [x] Social network access from the existing Profile surface without adding a bottom-tab Social destination.

## Phase S2 — workout posts

Backend:

- [x] immutable versioned workout-post snapshot schema;
- [x] explicit field-level share controls for title, duration, exercises, sets, load, repetitions, RPE, volume, and caption;
- [x] create, read, delete-own-post, and profile-post-list routes;
- [x] cursor pagination and deterministic ordering;
- [x] bounded caption length and content validation;
- [x] private-workout ownership and completed-state verification before snapshot creation;
- [x] no automatic publication and no raw private-workout payload storage;
- [x] private-profile follow access, symmetric block enforcement, idempotency, immutable-source, migration, and PostgreSQL API tests.

Mobile foundation:

- [x] versioned workout-post, snapshot, exercise, set, page, and share-control contracts;
- [x] strict fail-closed parsers that reject unknown/private fields and malformed versions;
- [x] authenticated create, get, profile-list, and delete-own API methods;
- [x] bounded client-side pagination validation and opaque cursor handling;
- [x] stable workout-post error-code parsing.

Mobile product surface:

- [x] `Share workout` action after a completed workout while preserving ordinary Save;
- [x] preview with explicit per-field visibility controls and dependent set-field handling;
- [x] explicit final confirmation before any network publication;
- [x] synchronize the completed private workout before creating the server-authoritative snapshot;
- [x] bounded sign-in, missing-profile, offline, source-not-ready, retry, and success states;
- [x] immutable post detail and cursor-paginated profile workout-post list;
- [x] owner-only published-snapshot deletion with explicit destructive confirmation;
- [x] safe handling when the source private workout is later changed or removed through the immutable backend snapshot.

## Phase S3 — following feed

Status: chronological server-authoritative source surface and bounded account-scoped first-page cache are source-complete.

- [x] chronological following-only feed;
- [x] cursor pagination and pull-to-refresh;
- [x] block/private-profile enforcement in every backend query;
- [x] bounded account-scoped local cache for responsiveness, with backend as source of truth;
- [x] no algorithmic ranking, recommendations, or engagement optimization in the MVP;
- [x] localized feed loading, empty, offline, expired-session, invalid-cursor, retry, refresh, cached-data, and deleted-post detail states;
- [x] Social feed access from the existing Profile surface without adding a bottom-tab destination.

Cache contract:

- cache only the first page and at most 20 strict public workout-post DTOs;
- cap serialized data at 512 KiB and expire it after five minutes;
- scope the storage key to the authenticated account and remove it during account deletion cleanup;
- never persist access tokens, email, private fitness data, report/moderation data, or an opaque pagination cursor;
- render cached data only as a short-lived preview while immediately revalidating from the backend;
- enable pagination only after a current backend response supplies a fresh cursor;
- malformed, duplicate, cross-account, expired, oversized, or unknown-field cache data fails closed.

## Phase S4 — reactions, comments, notifications, and anti-spam

Status: reactions, bounded comments, server-authoritative notifications, and persistent Social write rate limits are source-complete end to end.

- [x] one reaction per user/post with idempotent toggle semantics;
- [x] bounded comments and delete-own-comment;
- [x] post owner moderation for comments;
- [x] in-app notifications for follow requests, accepted follows, reactions, and comments;
- [x] notification read state and cursor pagination;
- [x] localized notification loading, empty, sign-in, missing-profile, offline, expired-session, invalid-cursor, retry, pagination, and stale-notification states;
- [x] notification navigation to the relevant profile or immutable workout post;
- [x] Social notification access from the existing Profile surface without adding a bottom-tab destination;
- [x] PostgreSQL-backed short-window and daily caps for profile updates, follow creation, workout publication, reaction toggles, and comment creation;
- [x] stable `SOCIAL_RATE_LIMITED` responses with bounded retry-after details and localized write-surface recovery copy;
- [ ] no push notifications until permission, privacy, and delivery contracts are separately approved.

## Phase S5 — reports, operator moderation, and trust

Status: post-publication report intake, bounded evidence, internal review operations, explicit server-side hide/restore restrictions, and the user-facing Community Guidelines surface are source-complete. Legal policy review and physical-device validation remain release blockers. Proactive pre-publication moderation is tracked separately in Phase S6.

- [x] report profile, post, and comment with bounded reason codes;
- [x] strict mobile report receipt contracts and authenticated target-specific API methods;
- [x] localized reason picker, success receipt, offline/session/rate-limit recovery, and self-target suppression;
- [x] block/unblock;
- [x] explicit server-side hide/restore restrictions for profiles, workout posts, and comments;
- [x] fail-closed filtering across profile discovery, relationship lists, feeds, post detail, comments, reactions, notifications, and repeat reporting;
- [x] restricted-profile write blocking without changing private fitness, sync, or authentication data;
- [x] bounded report evidence retained across later content edits or deletion;
- [x] report abuse rate limits and duplicate-report handling;
- [x] privacy-safe append-only moderation and restriction logs;
- [x] internal database-backed report queue and explicit status-transition workflow;
- [x] idempotent operator-only hide/restore CLI with no public staff/admin HTTP API;
- [x] localized Community Guidelines surface covering respect, harm, authenticity, privacy, fitness safety, blocking, and reporting;
- [ ] legal Terms of Service and Privacy Policy reviewed for broad release;
- [ ] physical-device tests for blocked/private/deleted/restricted/restored states.

Contract note:

Moderation state is not exposed in public DTOs. Restricted targets use existing bounded not-found or profile-required behavior. Resolving a report as `actioned` never performs automatic enforcement: an operator must explicitly hide the report-derived target, and restoration is a separate audited action after reopen or dismissal.

S5 remains the post-publication human/operator safety contour. AI moderation in S6 is a separate pre-publication gate and must not silently create, resolve, or enforce report records.

## Phase S6 — proactive AI content moderation

Status: text-only Phase S6 is source-complete; production provider activation remains disabled.

The moderation pipeline follows the same separation-of-responsibility principles as AI Coach, but it is an independent bounded subsystem. Coach orchestrators and domain contracts must not be reused for content enforcement.

```text
Social create/update endpoint
→ Content Moderation Orchestrator
→ deterministic preprocessing workers
→ provider-neutral typed text/image classifiers
→ strict versioned response parser
→ deterministic policy decision worker
→ allow | review_required | reject
→ persistence and privacy-safe audit
```

Architecture and provider boundary:

- [x] define versioned moderation categories, reason codes, policy versions, confidence bands, and terminal decisions;
- [x] introduce a backend-only `ContentModerationProvider` abstraction separate from `StructuredModelClient` and Coach contracts;
- [x] permit reuse only of low-level provider transport, retry, timeout, telemetry, and configuration plumbing where dependency direction remains clean;
- [x] ensure routes contain no provider prompts, provider payloads, policy thresholds, or orchestration logic;
- [x] validate every provider result through strict versioned Zod contracts and reject unknown critical fields;
- [x] persist structured category results, hashes, policy/model identifiers, attempts, latency, and bounded failure metadata without chain-of-thought or raw provider responses;
- [x] use idempotent moderation runs and content hashes so retries cannot publish duplicate or stale content;
- [x] keep the backend as the only caller of moderation providers and keep credentials server-side.

Deterministic preprocessing and policy:

- [x] normalize Unicode, confusable characters, hidden characters, stretched words, whitespace, links, repeated spam, and obvious prohibited terms before model classification;
- [x] use deterministic reserved/prohibited-term checks for usernames and use model classification only where context is materially useful;
- [x] define categories for explicit sexual content, nudity, possible minor safety, graphic violence, hate, harassment, self-harm, personal data/doxxing, spam/scams, and dangerous fitness or medical claims;
- [x] make the model return typed signals only; the deterministic policy worker owns `allow`, `review_required`, and `reject`;
- [x] prohibit provider output from overriding hard policy rules or existing block/restriction enforcement;
- [ ] use a fitness-specific image policy so ordinary adult workout photos, posing, sportswear, bodybuilding stages, and non-erotic progress photos are not automatically treated as explicit content;
- [ ] never claim or persist a precise age inferred from appearance; combine possible-minor signals with sexual-content signals conservatively;
- [x] keep false-positive-sensitive cases in `review_required` rather than silently deleting them.

Initial text surfaces:

- [x] moderate workout-post captions synchronously before publication;
- [x] moderate comments synchronously before insertion or notification creation;
- [x] moderate display-name and bio revisions before replacing the currently approved profile version;
- [x] preserve the currently approved profile when a submitted revision is pending, rejected, or the provider is unavailable;
- [x] return stable localized errors for rejected, review-required, unavailable, timed-out, and retryable moderation states;
- [x] add exact ownership, idempotency, stale-result, provider-failure, unknown-field, policy-threshold, and account-deletion tests.

Failure and review policy:

- newly submitted public content fails closed when required moderation cannot complete;
- existing approved public content is not hidden merely because a later profile revision cannot be checked;
- `review_required` content remains non-public until an explicit operator decision;
- reports and audited restrictions remain available for content that passes automated checks but is later reported;
- provider activation, model selection, and production thresholds require explicit environment configuration and staging validation.
- source completion does not activate a production provider; enforcement and provider selection remain safe-default disabled until explicit staging and production configuration.
- `review_required` is a typed non-public terminal result in S6; it does not create or action an S5 report and has no pending-profile UI model.

## Phase S7 — safe media ingestion, compression, moderation, and delivery

Status: architecture approved; implementation not started.

Arbitrary remote `avatarUrl` values are transitional and must not be treated as a secure long-term media contract. User media must move to server-owned asset IDs and immutable approved variants.

Media lifecycle:

```text
Mobile selection and local preview
→ bounded client resize/re-encode
→ signed upload to private quarantine storage
→ server MIME/pixel/decode validation
→ orientation normalization, EXIF/GPS removal, and sRGB conversion
→ normalized moderation master
→ image moderation + OCR + OCR text moderation
→ deterministic policy decision
→ approved derivatives and CDN publication
```

Storage and upload boundary:

- [ ] add `social_media_assets` and versioned media-state metadata in PostgreSQL; never store image bytes in PostgreSQL;
- [ ] use S3-compatible object storage with private quarantine objects and narrowly scoped signed upload/download operations;
- [ ] accept only bounded JPEG, HEIC/HEIF, and PNG inputs in the first version; reject animated GIF/APNG and unsupported containers;
- [ ] enforce configurable input limits targeting at most 15 MiB and approximately 40 megapixels before decode;
- [ ] verify real file signatures and decoded dimensions rather than trusting extension or client MIME;
- [ ] defend against decompression bombs, malformed files, excessive dimensions, and repeated abusive uploads;
- [ ] remove EXIF, GPS, device metadata, embedded thumbnails, and unsupported color-profile data on the server;
- [ ] keep original uploads private and temporary, then delete them after a terminal decision or a separately approved bounded evidence-retention period;
- [ ] use SHA-256 and perceptual hashes for integrity, idempotency, duplicate detection, and repeat-abuse investigation without exposing hashes publicly.

Client-side preprocessing targets:

- [ ] correct orientation and resize the long edge to approximately 2,048–2,560 pixels before upload;
- [ ] use visually lossless JPEG compression targeting quality 82–88 for ordinary photographs;
- [ ] aim for typical uploads around 300 KiB–1.5 MiB while retaining server-side limits as the security boundary;
- [ ] retain the local preview while upload and moderation continue;
- [ ] do not rely on client EXIF stripping, file validation, or compression as authoritative security controls.

Server derivatives and delivery:

- [ ] create a normalized moderation master with a long edge around 1,600–2,048 pixels so AI and OCR inspect the same visible pixels later delivered to users;
- [ ] generate public derivatives only after `allow` to avoid permanent storage and processing cost for rejected content;
- [ ] generate avatar variants targeting 64, 128, 256, and 512 pixels;
- [ ] generate post variants targeting 320, 640, 1,080, and 1,440 pixels, with an optional 2,048-pixel detail variant only when justified;
- [ ] generate a tiny blurred preview, BlurHash, or ThumbHash for immediate layout-stable rendering;
- [ ] begin with normalized JPEG derivatives and add WebP/AVIF negotiation only after the basic pipeline is stable;
- [ ] publish immutable content-hashed URLs through a CDN with long-lived cache headers;
- [ ] return a strict media descriptor containing asset ID, dimensions, aspect ratio, placeholder, and named variants instead of one arbitrary image URL;
- [ ] lazy-load viewport media, cancel off-screen requests, select the smallest adequate variant, and use bounded device caching;
- [ ] account deletion must remove metadata and schedule deletion of every owned quarantine, master, derivative, and CDN-origin object.

Product rollout:

- [ ] migrate avatars from arbitrary URLs to managed approved media assets;
- [ ] add one moderated image per workout post before supporting multi-image posts;
- [ ] keep images with `pending`, `review_required`, or `rejected` status out of profiles, feeds, notifications, and public post DTOs;
- [ ] use asynchronous media status polling or bounded refresh rather than keeping the upload request open through full processing;
- [ ] add localized upload, compression, pending-moderation, rejected, review-required, offline, retry, and deleted-asset states;
- [ ] add manual review and appeal operations before broad public image rollout;
- [ ] measure storage per approved asset, derivative-generation latency, cache hit rate, upload failure rate, moderation latency, and false-positive outcomes without adding behavioural advertising analytics.

## Deferred beyond Social MVP

Do not begin without explicit prioritization:

- direct messages;
- groups or communities;
- public live activity;
- trainer marketplace;
- paid subscriptions or tips;
- algorithmic recommendations;
- contact-book discovery;
- location sharing;
- automatic workout publishing;
- public nutrition, weight, body-measurement, limitation, recovery, or Coach data;
- public leaderboards based on body or health metrics;
- multi-image posts and advanced media formats until the one-image moderated pipeline is stable.

## Immediate execution order

1. [x] Backend social-profile schema and public DTO contract.
2. [x] Self-profile and username lookup routes.
3. [x] Visibility, follow requests, follows, and blocks.
4. [x] Mobile strict profile/relationship API and parser layer.
5. [x] Mobile social profile editor.
6. [x] Backend immutable workout-post snapshot and mobile API/parser contracts.
7. [x] Public profile and relationship action controls.
8. [x] Mobile Share Workout preview and explicit publication flow.
9. [x] Relationship discovery/list endpoints and mobile lists.
10. [x] Post detail and profile workout-post list.
11. [x] Chronological following feed with bounded account-scoped first-page cache.
12. [x] Reactions and bounded comments.
13. [x] In-app notifications and read state.
14. [x] Persistent Social write rate limits and localized recovery copy.
15. [x] Bounded report intake for profiles, posts, and comments.
16. [x] Localized Community Guidelines surface.
17. [x] Bounded evidence, internal moderation operations, and explicit audited restrictions.
18. [ ] Legal policy review and physical-device release matrix for the existing Social surface.
19. [x] S6 policy/categories/contracts, provider boundary, persistence, and deterministic decision worker.
20. [x] S6 synchronous moderation for captions, comments, display names, and bios.
21. [ ] S7 object storage, quarantine, managed-avatar migration, normalization, compression, and variants.
22. [ ] S7 one-image workout-post contract with image moderation, OCR, placeholders, CDN delivery, and mobile states.
23. [ ] Manual review, appeal, retention, threshold calibration, and false-positive validation.
24. [ ] Multi-image posts, WebP/AVIF negotiation, and further media optimization only after the bounded first version is stable.

## Release boundary

No backend deployment, production activation, AI-provider activation, moderation-threshold activation, object-storage or CDN credential change, OTA publication, native build, device installation, analytics SDK, push-notification setup, or migration execution is implied by source completion.

Public image uploads must not be enabled until the S7 quarantine, normalization, moderation, approved-variant, deletion, and account-cleanup contracts are implemented and validated. Broad public Social release should treat the S6 pre-publication moderation policy and the existing S5 report/operator contour as complementary required safeguards.
