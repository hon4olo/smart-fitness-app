# Smart Fitness Roadmap Progress

Updated: 2026-08-02

This is the canonical product and release roadmap index for:

- mobile: `hon4olo/smart-fitness-app`;
- backend: `hon4olo/smart-fitness-backend`.

Detailed contracts and phase history live in the linked focused files. Completed work must not remain listed as future implementation.

Read this index together with:

- `AGENTS.md`;
- `PROJECT_LEARNINGS.md`;
- `docs/implementation-plan.md`;
- `docs/roadmap/social-network.md`;
- `docs/roadmap/release-and-account.md`;
- `docs/roadmap/localization-settings.md`;
- `docs/roadmap/data-quality-and-scale.md`;
- `docs/nutrition-roadmap.md`;
- backend `AGENTS.md` when backend work is required.

## Verified repository baseline

At this update:

- mobile `main`: `7583e6cda4694b8ff9c0690235712f6b876ec235`;
- backend `main`: `6a492cc1636108e52de5eae91bbed217c81c81a5`;
- open mobile pull requests before this docs-only branch: none;
- open backend pull requests: none.

Always recheck exact `main` and open pull requests before changing code.

## Working rules

- Continue through a meaningful phase rather than stopping after every micro-change.
- Use bounded branches and pull requests; merge only an exact fully green head.
- Preserve routes, stable IDs, persisted schemas, canonical units, authentication, revisions, idempotency, conflicts, completed history, and explicit Coach confirmations unless the task explicitly changes them.
- Keep private fitness data in the existing offline-first and revision-aware private-data boundary.
- Keep Social data server-authoritative and separate from private `AppState` synchronization.
- Keep every hand-written source file at or below 500 physical lines.
- New user-facing copy must use the localization layer.
- Never add health, nutrition, workout, limitation, authentication, Coach, Social content, email, token, or raw payload values to telemetry.
- Do not publish OTA, create native builds, install on devices, deploy backend changes, activate staging or production, configure credentials, connect real providers, or execute migrations without explicit authorization.

## Completed foundation

### Core application and architecture

- Single Fastify/PostgreSQL backend and shared mobile API boundary.
- Offline-first local persistence with ordered observable critical mutations.
- Revision-aware synchronization for supported private fitness domains and the account-scoped Nutrition library.
- Secure native token storage and source-complete account deletion, password change, and session/device management.
- Focused state/action boundaries with zero production `useAppContext` compatibility consumers.
- High-volume Nutrition Diary, Programs, Workout History, and Exercise Library virtualization.
- Weight trend `7D / 30D / 90D` and continuous weekly workout-volume Progress charts.
- Deterministic default, representative, and stress local-state benchmarks.
- Current storage decision: retain the single AsyncStorage `AppState` snapshot; SQLite and domain partitioning are not justified by current measurements.
- Blocking mobile CI for line audits, TypeScript, Coach/sync contracts, full regression, Expo export, and Expo Doctor.
- Blocking backend lint, formatting, build, tests, migration/schema, startup, and health validation.

### Localization, Settings, and recovery

- First-class English/Russian localization foundation and centralized date, number, plural, weight, length, and energy presentation.
- Repository-wide source guards against unsafe visible copy, raw statuses, provider errors, fixed display units, and presentation formatting.
- Data & Sync status, privacy-safe diagnostics, persistence retry, outbox recovery, and unresolved-conflict review surfaces.
- Source-level restart recovery, auth-refresh retry, concurrent pull, idempotency, and two-device conflict coverage for current synchronized contracts.

### Social S0-S6

Social phases S0-S6 are source-complete for the bounded text-first product:

- social profiles, visibility, usernames, follows, requests, and blocks;
- follower/following/request discovery lists;
- immutable opt-in workout-post snapshots and explicit Share Workout confirmation;
- profile post lists, post detail, deletion, and chronological following feed;
- bounded account-scoped first-page feed cache;
- reactions, comments, notifications, and persistent write-rate limits;
- profile/post/comment reports, Community Guidelines, operator report queue, audited hide/restore restrictions, and fail-closed visibility enforcement;
- provider-neutral, typed, deterministic pre-publication text moderation for captions, comments, display names, and bios.

Production moderation-provider activation remains disabled until separately configured and validated. Do not restart Social work from profiles, follow graph, text-only workout posts, feed, reactions, comments, notifications, reports, or text moderation.

## Active source-code program — Social S7 managed media

Status: Social S7.1-S7.6 is source-complete and merged across backend and mobile. S7.7 manual review, appeal, and retention operations is the active source-code slice.

Goal: replace arbitrary remote image inputs and text-only workout posts with a bounded, server-owned, privacy-safe media pipeline. Public image upload remains disabled until provider configuration, deployment, device validation, moderation operations, and release gates are explicitly authorized.

### S7.1 Media domain and lifecycle contracts — complete

Merged backend PR #82:

- exact green head: `c8a904fbd36bcfc0239b433344a1e6199f8697d2`;
- merge SHA: `44af28822f2ab8e27dec0449ba9d948671be4c64`.

Completed:

- versioned `social_media_assets` metadata with owner, asset type, state, timestamps, terminal states, and account-deletion cascade;
- strict lifecycle transitions, state-version compare-and-swap, worker leases, stale-result protection, idempotency, retention, restart recovery, and deletion semantics;
- separate internal, owner, and public DTO boundaries;
- asset IDs and named immutable variants instead of user-supplied managed URLs;
- image bytes remain outside PostgreSQL.

### S7.2 Private quarantine upload boundary — complete

Merged backend PR #83:

- exact green head: `a7d02235ef29a471891d552449546e3f8d72a941`;
- merge SHA: `b8a5d725f30cca0c3fddf79161709651141bb83a`.

Completed:

- provider-neutral private object-storage interface and deterministic in-memory provider;
- narrowly scoped signed PUT uploads into versioned private quarantine keys;
- bounded JPEG, HEIC/HEIF, and PNG acceptance;
- animated, unsupported-container, malformed-file, MIME-mismatch, byte, dimension, pixel, and decompression-bomb rejection;
- signature, decode, ownership, idempotency, duplicate-delivery, stale-state, expiry, deletion, and abuse-rate-limit checks;
- uploads remain disabled by default.

### S7.3 Normalization, privacy, and image moderation — complete

Merged backend PR #84:

- exact green head: `6554c60834c754eb9211b226a29d38429dea48ea`;
- merge SHA: `494c4a075f0911339a3493bd506c5c4ac33721fc`.

Completed:

- orientation and color normalization into bounded metadata-stripped sRGB JPEG moderation masters;
- removal of EXIF, GPS, device metadata, embedded thumbnails, orientation metadata, and unsupported profiles;
- strict versioned provider-neutral image-classifier and OCR contracts;
- OCR text routed through the typed text-moderation boundary;
- deterministic fitness-aware policy for ordinary adult gym photos, sportswear, posing, bodybuilding stages, and non-erotic progress photos;
- no exact age inference or persistence;
- uncertain cases remain non-public in `review_required`;
- CAS worker claims, lease recovery, duplicate handling, stale-result rejection, restart recovery, and cleanup;
- PostgreSQL stores bounded metadata and decisions, never image bytes, OCR plaintext, raw provider responses, exact inferred age, or chain-of-thought.

### S7.4 Approved derivatives and delivery — complete

Merged backend PR #85:

- exact green head: `f94ff7efd26a65b0a91c025836f706f4a8a1855c`;
- merge SHA: `918383fe832256f370668293b5264373c5239256`.

Completed:

- public variants generated only from internally allowed assets;
- exact avatar variants `64 / 128 / 256 / 512` and workout-post variants `320 / 640 / 1080 / 1440`;
- strict descriptors with asset ID, dimensions, aspect ratio, average-color placeholder, and immutable named variants;
- provider-neutral managed delivery with content-hashed object keys, HTTPS boundaries, and immutable cache contracts;
- compare-and-swap publication into `approved`;
- partial-generation cleanup, retry, duplicate handling, expired-lease recovery, stale-result rejection, and deletion-race protection;
- quarantine, normalized-master, and public-prefix cleanup across approval, deletion, restart recovery, and account deletion.

### S7.5 Managed-avatar binding and mobile flow — source-complete

Merged backend PR #86:

- exact green head: `b51bd2deaff6bfc964e9d5e32f387049fd89d213`;
- merge SHA: `86f773c92d682c5a42e090a00a7be8908e881c0b`.

Completed backend contract:

- approved owner-scoped avatar assets bind to the authenticated Social profile only through asset ID and expected state version;
- arbitrary avatar URLs were removed from profile write contracts;
- public profile `avatarUrl` is a server-derived projection of the approved immutable managed variant;
- replacement, deletion, stale-state, ownership, report-evidence privacy, account cleanup, and owner-opaque public URL behavior are covered by PostgreSQL and full backend CI.

Merged mobile PR #353:

- exact green head: `2eadb498bbbf39ed2ed49e6635b5de16014a6de7`;
- merge SHA: `aa693a959a16b20c125c4358d31c2107624a5258`.

Completed mobile source flow:

- free-form avatar URL editing is removed from profile writes;
- strict owner-state and owner-opaque immutable public descriptor parsers fail closed;
- Expo SDK 56-compatible image selection, local preview, bounded JPEG preprocessing, signed PUT progress, completion, bounded polling, approved binding, refresh, retry, rejection, deletion, offline, expiry, stale-state, and expired-session states are implemented;
- the currently approved avatar remains public while a replacement is non-public;
- restart-safe account-scoped draft state persists only asset ID and local preview URI, never signed URLs, headers, tokens, or private payloads;
- all new visible copy is localized in English and Russian;
- line audits, TypeScript, contract tests, full regression, iOS/Android/Web Expo export, and Expo Doctor are green.

Activation boundary:

- no OTA/EAS publish, native build, device install, backend deployment, migration execution, credentials change, real storage/CDN/moderation-provider activation, or public media activation was performed;
- the new native Expo modules and config plugin require a future explicitly authorized native build and physical-device validation before runtime release claims.

### S7.6 One-image workout-post flow — source-complete

Merged backend PR #87:

- exact green head: `3cd3e9aa5815edf7968f0aecaa9377cb3414e7ee`;
- merge SHA: `6a492cc1636108e52de5eae91bbed217c81c81a5`.

Completed backend contract:

- at most one approved owner-scoped `workout_post_image` asset can bind to an immutable workout-post snapshot by asset ID and expected state version;
- ownership, type, approval, state-version, idempotency, already-attached, deletion, account-deletion, report-evidence, and restriction/block boundaries are enforced transactionally;
- public workout-post DTO schema version 2 projects only a strict nullable approved descriptor and never exposes quarantine/master object data or private storage details;
- asset deletion removes the public projection without rewriting the immutable workout snapshot;
- migration, PostgreSQL API, deletion-race, account-cascade, and full backend CI coverage are green.

Merged mobile PR #355:

- exact green head: `dea24b1f3fb7c5a7359818f527808ff9d2c1a14e`;
- merge SHA: `7583e6cda4694b8ff9c0690235712f6b876ec235`.

Completed mobile source flow:

- workout-post DTO v2 and managed image descriptors fail closed on unknown, malformed, wrong-type, private-object, or untrusted URL data;
- the existing Expo SDK 56 picker/manipulator/signed-upload lifecycle is reused for a single optional local preview and bounded JPEG preprocessing;
- upload progress, completion, processing, review-required, approved, rejected, failed, deleted, stale, offline, expiry, session, retry, refresh, replacement, and removal states are localized in English and Russian;
- publication remains explicitly confirmed, preserves existing share controls, and binds media only after approval;
- restart-safe account/session draft state stores only asset ID and local preview URI;
- replacement cleanup and asynchronous state updates are sequence-isolated across account/session changes, late upload progress, and pending picker recovery;
- approved variants render in cards, profile lists, following feed, and post detail, while non-public or deleted assets project as `image: null`;
- line audits, TypeScript, contract tests, 1164-test regression, iOS/Android/Web export, and Expo Doctor are green.

Activation boundary:

- no OTA/EAS publish, native build, device install, backend deployment, migration execution outside CI, credentials change, real storage/CDN/moderation-provider activation, or public media activation was performed;
- physical-device validation still requires a future explicitly authorized matching native build.

### S7.7 Manual review, appeal, and retention operations — active

Implement next as source-only bounded contracts:

- add an operator-only queue for media assets in `review_required`, separate from the public Social API and existing report queue;
- support explicit audited operator decisions to approve or reject a reviewed asset without trusting provider output or exposing private object details;
- add owner-visible appeal submission for eligible rejected media with bounded reason codes/text, idempotency, rate limits, and no automatic publication;
- keep appealed or reopened assets non-public until a new explicit terminal operator decision;
- define bounded retention deadlines for quarantine uploads, moderation masters, rejected/failed/review evidence, approved originals, derivatives, and deletion tombstones;
- add restart-safe cleanup claims, retries, stale-worker recovery, deletion races, account deletion, legal-hold-safe boundaries, and privacy-safe audit records;
- add exact authorization, ownership, duplicate, stale-state, appeal eligibility, decision transition, retention, cleanup, and account-deletion tests;
- do not add a public staff/admin HTTP API, activate real providers, deploy, execute migrations outside CI, or enable public uploads without explicit authorization.

### S7 exit criteria

- private object bytes are never publicly readable before approval;
- no arbitrary user-supplied image URL is trusted as a managed Social asset;
- ownership, retries, stale workers, duplicate delivery, deletion, and account cleanup are covered;
- metadata and public DTOs expose no private fitness or authentication content;
- image policy includes fitness-specific false-positive tests;
- backend and mobile blocking CI are fully green;
- no deployment, credentials, migration execution, native build, OTA, or public media activation is claimed without explicit authorization.

## Other remaining product and release work

### Release and device validation

- Configure and run the fixed-SHA cross-repository release gate when repository-token access is authorized.
- Create and validate a matching Android standalone build.
- Run preview/internal-production rollout and rollback rehearsal.
- Run real-device matrices for small/standard iPhone, Android, offline termination/restart, force-close recovery, second-device synchronization, EN/RU, units, keyboard, Dynamic Type, VoiceOver/TalkBack, permissions, clipping, touch targets, and safe areas.
- Capture reference screenshots and validate standalone launch without Metro.

### Password reset and account lifecycle

- Select and configure a mail provider and verified sender domain.
- Add the mobile forgot-password/reset-password flow and validated deep link.
- Deploy and validate the existing backend reset migration/endpoints when explicitly authorized.
- Validate expiry, replay rejection, all-session invalidation, cleanup retry, destructive flows, and re-registration on devices.
- Add user-facing privacy explanations.

### Conflict-choice contract

- Define ownership, revision, idempotency, audit, rollback, and mixed-version behavior before adding destructive local-versus-account choices.
- Do not add client-only “keep local / keep server / merge” controls without the backend-owned contract.

### Privacy, legal, analytics, and moderation operations

- Review Terms of Service and Privacy Policy before broad Social release.
- Define consent, event taxonomy, retention, deletion, and identity boundaries before adding product analytics.
- Add manual review and appeal operations before broad public image rollout.
- Calibrate moderation thresholds and false-positive handling in staging before production provider activation.
- Push notifications remain deferred until permission, privacy, delivery, and settings contracts are approved.

### Nutrition and synchronization validation

- Run the full Nutrition flow on a matching release-channel iPhone build.
- Validate provider search under airplane mode, timeout, empty result, and recovery.
- Validate barcode permission denial, lookup failure, manual creation, and repeat scan.
- Validate anonymous/account isolation, account switching, saved-meal synchronization, Nutrition library restart recovery, and second-device behavior.

## Deferred beyond the current program

Do not begin without explicit product prioritization:

- direct messages;
- groups or communities;
- trainer marketplace;
- subscriptions, payments, or tips;
- algorithmic feed ranking or recommendations;
- contact-book discovery;
- location sharing;
- automatic workout publication;
- public nutrition, weight, body-measurement, limitation, recovery, or Coach data;
- public body/health leaderboards;
- multi-image posts and advanced media formats before the bounded one-image pipeline is stable;
- lab analysis, diagnosis, pharmacology, hormone, or supplement protocol features.

## Immediate execution order

1. Define and implement S7.7 operator manual review, owner appeal, and bounded retention/cleanup contracts.
2. Complete source-level false-positive, stale-worker, deletion, account-cleanup, and privacy validation for the managed-media pipeline.
3. Run staging calibration, physical-device, release, rollback, privacy, and legal gates only with the required authorization and configuration.

## New-chat starter prompt

> Continue the Smart Fitness roadmap from `ROADMAP_PROGRESS.md`, with Social S7.7 manual media review, owner appeal, and bounded retention/cleanup operations as the active source-code slice. Work autonomously through meaningful bounded slices instead of stopping after micro-changes. At the start, verify exact `main` and open PRs for `hon4olo/smart-fitness-app` and `hon4olo/smart-fitness-backend`; read both `AGENTS.md`, mobile `PROJECT_LEARNINGS.md`, `ROADMAP_PROGRESS.md`, `docs/roadmap/social-network.md`, and only the files relevant to the current slice. Do not restart already completed Social S0-S7.6 work. Reuse the merged managed-media lifecycle, strict owner/public descriptors, signed private upload, moderation, delivery, deletion, cleanup, and one-image workout-post contracts. Keep review-required and appealed assets non-public, keep operator actions audited and separate from public APIs, make retention and cleanup restart-safe, localize owner-visible appeal states, and preserve private workout/profile boundaries. Run full blocking CI, inspect review threads, and merge only exact green heads. Do not publish OTA, create/install native builds, deploy backend changes, execute migrations outside CI, activate staging/production, configure credentials, connect real storage/CDN/moderation providers, or enable public image uploads without explicit authorization.
