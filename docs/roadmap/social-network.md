# Social network roadmap

Updated: 2026-07-31

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
```

Rules:

- never expose a private workout entity directly in a feed;
- a shared workout is an immutable bounded public snapshot created only after explicit confirmation;
- later edits or deletion of the private workout must not silently rewrite the published snapshot;
- publication is opt-in and never automatic;
- public DTOs must not contain email, auth/session/device data, health limitations, recovery data, body measurements, nutrition logs, Coach context, raw internal IDs, or free-form private notes;
- social writes require authenticated ownership and idempotency where retryable;
- block enforcement is server-side and applies to profiles, follows, feeds, posts, comments, reactions, and notifications;
- account deletion cascades through all social records.

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

Status: chronological server-authoritative source surface complete. Persistent local caching remains separately pending.

- [x] chronological following-only feed;
- [x] cursor pagination and pull-to-refresh;
- [x] block/private-profile enforcement in every backend query;
- [ ] bounded account-scoped local cache for responsiveness, with backend as source of truth;
- [x] no algorithmic ranking, recommendations, or engagement optimization in the MVP;
- [x] localized feed loading, empty, offline, expired-session, invalid-cursor, retry, refresh, and deleted-post detail states;
- [x] Social feed access from the existing Profile surface without adding a bottom-tab destination.

## Phase S4 — reactions, comments, and notifications

Status: reactions, bounded comments, and server-authoritative in-app notifications are source-complete end to end. Anti-spam controls remain pending.

- [x] one reaction per user/post with idempotent toggle semantics;
- [x] bounded comments and delete-own-comment;
- [x] post owner moderation for comments;
- [x] in-app notifications for follow requests, accepted follows, reactions, and comments;
- [x] notification read state and cursor pagination;
- [x] localized notification loading, empty, sign-in, missing-profile, offline, expired-session, invalid-cursor, retry, pagination, and stale-notification states;
- [x] notification navigation to the relevant profile or immutable workout post;
- [x] Social notification access from the existing Profile surface without adding a bottom-tab destination;
- [ ] rate limits and anti-spam controls;
- [ ] no push notifications until permission, privacy, and delivery contracts are separately approved.

## Phase S5 — moderation and trust

Required before broad release:

- [ ] report profile, post, and comment with bounded reason codes;
- [ ] block/unblock;
- [ ] soft deletion and audit-safe moderation state;
- [ ] abuse rate limits and duplicate-report handling;
- [ ] privacy-safe moderation logs;
- [ ] terms/community-guideline surfaces;
- [ ] operational review path for reports;
- [ ] device tests for blocked/private/deleted states.

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
- public leaderboards based on body or health metrics.

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
11. [x] Chronological following feed.
12. [x] Reactions and bounded comments.
13. [x] In-app notifications and read state.
14. [ ] Moderation and physical-device release matrix.

## Release boundary

No backend deployment, production activation, OTA publication, native build, device installation, analytics SDK, push-notification setup, or credentials change is implied by source completion.
