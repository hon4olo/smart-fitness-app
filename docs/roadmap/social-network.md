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

Status: active.

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
- [x] ownership, privacy, duplicate-delivery, block, and account-deletion tests.

Mobile:

- [x] Social profile editor;
- [ ] public profile screen;
- [ ] follow/request state controls;
- [ ] followers/following lists with cursor pagination;
- [ ] localized empty, loading, error, blocked, private, and pending states;
- [x] no social tab until the profile/follow contracts are stable.

## Phase S2 — workout posts

Backend:

- [ ] immutable versioned workout-post snapshot schema;
- [ ] explicit field-level share controls for title, duration, exercises, sets, load, repetitions, RPE, volume, and caption;
- [ ] create, read, delete-own-post, and profile-post-list routes;
- [ ] cursor pagination and deterministic ordering;
- [ ] bounded caption length and content validation;
- [ ] private-workout ownership verification before snapshot creation;
- [ ] no automatic publication and no raw private-workout payload storage.

Mobile:

- [ ] `Share workout` action after a completed workout;
- [ ] preview with per-field visibility controls;
- [ ] explicit final confirmation;
- [ ] post detail and profile grid/list;
- [ ] safe handling when the source private workout is later changed or removed.

## Phase S3 — following feed

- [ ] chronological following-only feed;
- [ ] cursor pagination and refresh;
- [ ] block/private-profile enforcement in every query;
- [ ] bounded local cache for responsiveness, with backend as source of truth;
- [ ] no algorithmic ranking, recommendations, or engagement optimization in the MVP;
- [ ] feed loading, empty, offline, retry, and deleted-post states.

## Phase S4 — reactions, comments, and notifications

- [ ] one reaction per user/post with idempotent toggle semantics;
- [ ] bounded comments and delete-own-comment;
- [ ] post owner moderation for comments;
- [ ] in-app notifications for follow requests, accepted follows, reactions, and comments;
- [ ] notification read state and cursor pagination;
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
4. [x] Mobile strict API/parser layer.
5. [x] Mobile social profile editor.
6. [ ] Public profile and relationship controls.
7. [ ] Immutable workout-post snapshot contract.
8. [ ] Chronological following feed.
9. [ ] Reactions/comments/notifications.
10. [ ] Moderation and physical-device release matrix.

## Release boundary

No backend deployment, production activation, OTA publication, native build, device installation, analytics SDK, push-notification setup, or credentials change is implied by source completion.
