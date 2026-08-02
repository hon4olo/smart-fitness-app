# Smart Fitness Roadmap Progress

Updated: 2026-08-02

This is the canonical product and release roadmap index for:

- mobile: `hon4olo/smart-fitness-app`;
- backend: `hon4olo/smart-fitness-backend`.

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

- mobile `main`: `33764007e9599655eeb13be29a33738e83078626`;
- backend `main`: `7dea48e9001a218f5b5b51db8907a46d2c7bffb6`;
- open mobile pull requests before this docs-only branch: none;
- open backend pull requests: none.

Always recheck exact `main` and open pull requests before changing code.

## Working rules

- Continue through a meaningful bounded phase rather than stopping after every micro-change.
- Use branches and pull requests; merge only an exact fully green head.
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
- Blocking mobile CI for line audits, TypeScript, Coach/sync contracts, full regression, Expo export, and Expo Doctor.
- Blocking backend lint, formatting, build, tests, migration/schema, startup, and health validation.

### Localization, Settings, and recovery

- First-class English/Russian localization foundation and centralized date, number, plural, weight, length, and energy presentation.
- Repository-wide source guards against unsafe visible copy, raw statuses, provider errors, fixed display units, and presentation formatting.
- Data & Sync status, privacy-safe diagnostics, persistence retry, outbox recovery, and unresolved-conflict review surfaces.
- Source-level restart recovery, auth-refresh retry, concurrent pull, idempotency, and two-device conflict coverage for current synchronized contracts.

### Social S0-S6

Social phases S0-S6 are source-complete for the bounded text-first product:

- profiles, visibility, usernames, follows, requests, and blocks;
- relationship discovery lists;
- immutable opt-in workout-post snapshots and explicit Share Workout confirmation;
- profile post lists, post detail, deletion, and chronological following feed;
- bounded account-scoped first-page feed cache;
- reactions, comments, notifications, and persistent write-rate limits;
- reports, Community Guidelines, operator report queue, audited restrictions, and fail-closed visibility enforcement;
- provider-neutral typed pre-publication text moderation for captions, comments, display names, and bios.

Production moderation-provider activation remains disabled until separately configured and validated.

## Social S7 managed media

Status: S7.1-S7.6 and the first two S7.7 operations slices are source-complete and merged. Reviewer evidence export plus broader bounded retention/cleanup operations remain active. Public media upload remains disabled.

### S7.1 Media domain and lifecycle — complete

Merged backend PR #82:

- exact green head: `c8a904fbd36bcfc0239b433344a1e6199f8697d2`;
- merge SHA: `44af28822f2ab8e27dec0449ba9d948671be4c64`.

Completed:

- versioned media metadata, ownership, states, state versions, timestamps, terminal states, worker leases, idempotency, deletion, and account cascade;
- separate internal, owner, and public DTO boundaries;
- image bytes remain outside PostgreSQL.

### S7.2 Private quarantine upload — complete

Merged backend PR #83:

- exact green head: `a7d02235ef29a471891d552449546e3f8d72a941`;
- merge SHA: `b8a5d725f30cca0c3fddf79161709651141bb83a`.

Completed:

- provider-neutral private object storage and narrowly scoped signed PUT uploads;
- bounded JPEG, HEIC/HEIF, and PNG acceptance;
- signature, MIME, byte, dimension, pixel, malformed-file, animated-image, decompression-bomb, expiry, stale-state, ownership, idempotency, and rate-limit checks;
- uploads remain disabled by default.

### S7.3 Normalization, privacy, and image moderation — complete

Merged backend PR #84:

- exact green head: `6554c60834c754eb9211b226a29d38429dea48ea`;
- merge SHA: `494c4a075f0911339a3493bd506c5c4ac33721fc`.

Completed:

- orientation and color normalization into metadata-stripped sRGB JPEG moderation masters;
- EXIF/GPS/device metadata and embedded thumbnail removal;
- strict provider-neutral image-classifier and OCR contracts;
- OCR text moderation and deterministic fitness-aware policy;
- uncertain cases remain non-public in `review_required`;
- no exact age inference or persistence;
- retry, duplicate, lease recovery, stale-result rejection, restart recovery, and cleanup coverage.

### S7.4 Approved derivatives and delivery — complete

Merged backend PR #85:

- exact green head: `f94ff7efd26a65b0a91c025836f706f4a8a1855c`;
- merge SHA: `918383fe832256f370668293b5264373c5239256`.

Completed:

- approved-only avatar variants `64 / 128 / 256 / 512` and workout-post variants `320 / 640 / 1080 / 1440`;
- strict descriptors with dimensions, aspect ratio, average-color placeholder, named variants, and owner-opaque immutable URLs;
- partial-generation cleanup, retry, duplicate handling, lease recovery, stale-result rejection, deletion-race protection, and account cleanup.

### S7.5 Managed avatars — source-complete

Merged backend PR #86:

- exact green head: `b51bd2deaff6bfc964e9d5e32f387049fd89d213`;
- merge SHA: `86f773c92d682c5a42e090a00a7be8908e881c0b`.

Merged mobile PR #353:

- exact green head: `2eadb498bbbf39ed2ed49e6635b5de16014a6de7`;
- merge SHA: `aa693a959a16b20c125c4358d31c2107624a5258`.

Completed:

- arbitrary avatar URLs removed from profile writes;
- approved owner-scoped asset binding by asset ID and expected state version;
- strict owner/public parsers and owner-opaque URL checks;
- SDK 56 image selection, preview, bounded preprocessing, signed upload progress, polling, approval binding, retry, rejection, deletion, offline, expiry, stale-state, and session states;
- restart-safe draft state stores only asset ID and local preview URI;
- English/Russian localization and full blocking mobile/backend CI.

### S7.6 One-image workout posts — source-complete

Merged backend PR #87:

- exact green head: `3cd3e9aa5815edf7968f0aecaa9377cb3414e7ee`;
- merge SHA: `6a492cc1636108e52de5eae91bbed217c81c81a5`.

Merged mobile PR #355:

- exact green head: `dea24b1f3fb7c5a7359818f527808ff9d2c1a14e`;
- merge SHA: `7583e6cda4694b8ff9c0690235712f6b876ec235`.

Completed:

- one approved owner-scoped `workout_post_image` can bind to an immutable post snapshot by asset ID and expected state version;
- strict nullable DTO v2 image projection keeps non-public/deleted assets out of public surfaces;
- optional single-image selection, preview, preprocessing, upload progress, moderation states, replacement, removal, retry, and bounded refresh;
- publication remains explicitly confirmed and private workout data stays separate from the public snapshot;
- approved variants render in cards, profile lists, following feed, and post detail;
- asynchronous state updates are sequence-isolated across account/session changes and late callbacks;
- full backend CI and mobile line audits, TypeScript, 1164-test regression, iOS/Android/Web export, and Expo Doctor are green.

### S7.7 Internal manual review — first slice complete

Merged backend PR #88:

- exact green head: `7fcbf68651790903a4ecbf831bcdbe01fd9ebb2b`;
- merge SHA: `ca479965a38ade831dd0fb8993bbd7a4d5d68111`.

Completed:

- internal oldest-first bounded queue for managed assets in `review_required`;
- direct-database CLI only, with no public or staff HTTP API;
- privacy-bounded queue DTO excludes owner IDs, object keys, signed URLs, raw provider payloads, OCR plaintext, and private storage details;
- transaction and state-version CAS allow only one concurrent decision;
- explicit manual approval preserves automated evidence and returns the asset to delivery eligibility;
- explicit rejection remains non-public;
- action-specific reason codes and bounded operator identifiers;
- append-only audit records operator, decision, reason, states, and exact state-version transition;
- direct audit mutation is blocked while account deletion can cascade asset-owned audit history;
- migration `0030`, idempotency, migrated schema, PostgreSQL Social API, full Vitest, production startup, and health are green.

### S7.7 Owner appeals and rejected evidence — second slice complete

Merged backend PR #89:

- exact green head: `d7b1a1e79b515ffa3016869188501a24241e7218`;
- merge SHA: `7dea48e9001a218f5b5b51db8907a46d2c7bffb6`.

Completed:

- owner-only appeal submission and status reads for eligible rejected managed-media assets;
- strict bounded reason/statement contracts, normalized idempotency keys, ownership checks, rate limits, and state-version CAS;
- appealed assets reopen only to non-public `review_required` and cannot publish without an explicit operator decision;
- pending appeal context is available only to the internal review queue and resolves atomically with approval or rejection;
- rejected evidence is retained for fourteen days, closes exactly at expiry, and becomes cleanup-eligible only after the deadline;
- submission evidence is immutable while account and asset deletion retain cascade-safe behavior;
- migration `0031`, concurrency, duplicate, stale-state, expiry, cleanup, account-cascade, PostgreSQL Social API, full Vitest, production startup, and health are green.

### S7.7 Remaining active work

Remaining source work is:

- reviewer byte-view/export provider boundary without exposing private object credentials or adding a public staff API;
- bounded retention deadlines for quarantine uploads, moderation masters, failed/review evidence, approved originals, derivatives, and deletion tombstones;
- restart-safe cleanup claims, retries, stale-worker recovery, deletion races, account deletion, legal-hold-safe boundaries, and privacy-safe audit records;
- exact authorization, stale-state, export eligibility, retention, cleanup, legal-hold, and account-deletion tests.

## Activation and release boundary

No source completion in S7 activates production media.

Still prohibited without explicit authorization:

- OTA/EAS publish;
- native builds or device installation;
- backend deployment or migration execution outside CI;
- staging/production activation;
- credentials changes;
- real object-storage, CDN, OCR, classifier, or moderation-provider activation;
- enabling public image uploads.

Physical-device validation still requires a matching explicitly authorized native build.

## Other remaining product and release work

- Fixed-SHA cross-repository release gate when repository-token access is authorized.
- Android standalone build and matching iPhone/Android real-device matrix.
- Preview/internal-production rollout and rollback rehearsal.
- Password-reset provider, sender domain, mobile flow, and deep-link validation.
- Conflict-choice backend contract before any destructive local/server/merge UI.
- Terms of Service and Privacy Policy review before broad Social release.
- Product analytics consent, identity, retention, and deletion boundaries before adding analytics.
- Moderation threshold calibration and false-positive validation in staging before provider activation.
- Nutrition release-channel device and second-device validation.

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

## Next execution order

1. Continue S7.7 with the reviewer byte-view/export provider boundary.
2. Complete broader lifecycle retention deadlines and restart-safe cleanup claims.
3. Complete false-positive, stale-worker, deletion, account-cleanup, privacy, legal-hold, and export validation before any public media activation.
4. Run staging, physical-device, release, and rollback gates only with the required authorization and configuration.

## New-chat starter prompt

> Continue the Smart Fitness roadmap from `ROADMAP_PROGRESS.md`. Social S7.1-S7.6 plus the S7.7 internal manual-review and owner-appeal slices are source-complete. The next unstarted slice is the reviewer byte-view/export provider boundary, followed by broader bounded retention and restart-safe cleanup operations. At the start, verify exact `main` and open PRs for `hon4olo/smart-fitness-app` and `hon4olo/smart-fitness-backend`; read both `AGENTS.md`, mobile `PROJECT_LEARNINGS.md`, this roadmap, `docs/roadmap/social-network.md`, and only the files relevant to the requested slice. Reuse the merged managed-media lifecycle, manual-review CAS/audit, owner appeal, strict owner/public descriptors, private object-storage boundary, moderation, delivery, deletion, cleanup, and one-image workout-post contracts. Keep reviewed, appealed, rejected, failed, pending, and deleted assets non-public unless an explicit valid transition approves them. Do not publish OTA, create/install native builds, deploy backend changes, execute migrations outside CI, activate staging/production, configure credentials, connect real storage/CDN/moderation providers, or enable public image uploads without explicit authorization.
