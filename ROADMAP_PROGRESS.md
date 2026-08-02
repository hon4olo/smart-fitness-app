# Smart Fitness Roadmap Progress

Updated: 2026-08-02

This is the canonical product and release roadmap index for:

- mobile: `hon4olo/smart-fitness-app`;
- backend: `hon4olo/smart-fitness-backend`.

Detailed contracts and phase history live in the linked focused files. Completed work must not remain listed as future implementation.

Read this index together with:

- `AGENTS.md`;
- `PROJECT_LEARNINGS.md`;
- `docs/implementation-plan.md` for the current bounded engineering decision gate;
- `docs/roadmap/social-network.md`;
- `docs/roadmap/release-and-account.md`;
- `docs/roadmap/localization-settings.md`;
- `docs/roadmap/data-quality-and-scale.md`;
- `docs/nutrition-roadmap.md`;
- backend `AGENTS.md` when backend work is required.

## Verified repository baseline

At this update:

- mobile `main`: `63e00a7d39c828e703fbd5cbfbd3a9e3e6c372a7`;
- backend `main`: `494c4a075f0911339a3493bd506c5c4ac33721fc`;
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
- Do not publish OTA, create native builds, install on devices, deploy backend changes, activate staging or production, configure credentials, or execute migrations without explicit authorization.

## Completed foundation

### Core application and architecture

- Single Fastify/PostgreSQL backend and shared mobile API boundary.
- Offline-first local persistence with ordered observable critical mutations.
- Revision-aware synchronization for the supported private fitness domains and account-scoped Nutrition library.
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

### Social network source status

Social phases S0-S6 are source-complete for the currently bounded text-first product:

- social profiles, visibility, usernames, follows, requests, and blocks;
- follower/following/request discovery lists;
- immutable opt-in workout-post snapshots and explicit Share Workout confirmation;
- profile post lists, post detail, deletion, and chronological following feed;
- bounded account-scoped first-page feed cache;
- reactions, comments, notifications, and persistent write-rate limits;
- profile/post/comment reports, Community Guidelines, operator report queue, audited hide/restore restrictions, and fail-closed visibility enforcement;
- provider-neutral, typed, deterministic pre-publication text moderation for captions, comments, display names, and bios;
- production moderation-provider activation remains disabled until separately configured and validated.

Do not restart Social work from profiles, follow graph, workout posts, feed, reactions, comments, notifications, reports, or text moderation. Those stages are already implemented.

## Active source-code program — Social S7 managed media

Status: backend S7.1-S7.3 source-complete and merged; S7.4 approved derivatives and delivery is the active slice.

Goal: replace arbitrary remote avatar URLs and text-only workout posts with a bounded, server-owned, privacy-safe image pipeline. Public image upload must remain disabled until the complete quarantine, validation, moderation, derivative, deletion, and account-cleanup contract is implemented and validated.

### S7.1 Media domain and lifecycle contracts — complete

Merged backend PR #82:

- exact green head: `c8a904fbd36bcfc0239b433344a1e6199f8697d2`;
- merge SHA: `44af28822f2ab8e27dec0449ba9d948671be4c64`.

Completed contract:

- versioned `social_media_assets` metadata with explicit owner, asset type, state, timestamps, terminal states, and PostgreSQL account-deletion cascade;
- strict lifecycle transitions, state-version compare-and-swap, worker leases, stale-result protection, idempotency, retention, restart recovery, and deletion semantics;
- separate internal, owner, and public DTO boundaries;
- public descriptors use asset IDs and named immutable variants rather than user-supplied URLs;
- image bytes remain outside PostgreSQL.

No migration was executed outside CI and no storage credentials or public uploads were activated.

### S7.2 Private quarantine upload boundary — complete

Merged backend PR #83:

- exact green head: `a7d02235ef29a471891d552449546e3f8d72a941`;
- merge SHA: `b8a5d725f30cca0c3fddf79161709651141bb83a`.

Completed contract:

- provider-neutral private object-storage interface and deterministic in-memory provider;
- narrowly scoped signed PUT uploads into versioned private quarantine keys;
- bounded JPEG, HEIC/HEIF, and PNG acceptance;
- explicit GIF, APNG, AVIF, unsupported-container, malformed-file, MIME-mismatch, byte-limit, dimension-limit, pixel-limit, and decompression-bomb rejection;
- authoritative signature, decode, owner, idempotency, duplicate-delivery, stale-state, expiry, deletion, and abuse-rate-limit checks;
- metadata-only migration and PostgreSQL/API/unit coverage;
- uploads remain disabled by default.

No real object-storage adapter, credentials, public bucket, CDN, deployment, or public upload activation was added.

### S7.3 Normalization, privacy, and image moderation — complete

Merged backend PR #84:

- exact green head: `6554c60834c754eb9211b226a29d38429dea48ea`;
- merge SHA: `494c4a075f0911339a3493bd506c5c4ac33721fc`.

Completed contract:

- private orientation and color normalization with bounded metadata-stripped sRGB JPEG moderation masters;
- removal of EXIF, GPS, device metadata, embedded thumbnails, orientation metadata, and unsupported profiles from normalized output;
- strict versioned provider-neutral image-classifier and OCR contracts;
- OCR text rerouted through the existing typed text-moderation boundary;
- deterministic fitness-aware policy covering ordinary adult gym photos, sportswear, posing, bodybuilding stages, and non-erotic progress photos without automatic explicit classification;
- no exact age inference or persistence; possible-minor signals are used conservatively only with additional safety signals;
- uncertain cases remain non-public in `review_required`;
- allowed moderation results remain private in `quarantined` until S7.4 creates approved immutable delivery variants;
- CAS worker claims, lease recovery, duplicate-run handling, stale-result rejection, restart recovery, and deletion cleanup of quarantine and moderation-master objects;
- PostgreSQL stores only bounded metadata, signals, hashes, and decisions—never image bytes, OCR plaintext, raw provider responses, exact inferred age, or chain-of-thought;
- migration `0026` and full unit/PostgreSQL coverage for provider failure, timeout, malformed output, duplicate run, stale worker, cleanup, and fitness false positives.

No real classifier, OCR provider, credentials, deployment, migration execution outside CI, or public media activation was performed.

### S7.4 Approved derivatives and delivery — active

Implement next:

- generate public variants only from internally allowed, still-private assets;
- create bounded named avatar and workout-post variants;
- create a layout-stable placeholder such as BlurHash, ThumbHash, or a reviewed equivalent;
- use immutable content-hashed object keys and delivery URLs;
- return a strict descriptor containing asset ID, dimensions, aspect ratio, placeholder, and named variants;
- keep the delivery boundary CDN-neutral and provider-neutral;
- make transition to public `approved` atomic with the descriptor and protected by state version and worker token;
- delete quarantine, normalized master, derivatives, and origin objects during terminal cleanup and account deletion;
- cover partial generation failure, retry, duplicate worker run, stale generation result, deletion race, and cleanup recovery;
- keep real storage credentials, CDN activation, and public image uploads disabled.

### S7.5 Mobile managed-avatar flow

After S7.4 backend contracts merge:

- replace free-form avatar URL editing with managed selection, local preview, compression/upload progress, moderation status, retry, rejection, deletion, offline, and expired-session states;
- review actual Expo SDK 56 compatibility before adding any native dependency;
- treat client preprocessing as UX optimization only; server validation remains authoritative;
- localize all new visible copy;
- do not create a native build without explicit authorization.

### S7.6 One-image workout-post flow

After managed avatars are stable:

- add at most one moderated image per workout post before considering multi-image posts;
- keep the private completed workout and public immutable post snapshot separate;
- keep pending, review-required, rejected, failed, and deleted assets out of public profiles, feeds, notifications, and post DTOs;
- use bounded polling or refresh rather than holding an upload request open;
- add localized offline, retry, compression, upload, processing, moderation, rejection, and removed-asset states;
- preserve current share controls and explicit final publication confirmation.

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

1. Implement S7.4 approved derivatives, immutable descriptors, deletion lifecycle, and CDN-neutral delivery contracts without real credentials or public activation.
2. Implement S7.5 managed mobile avatars after the backend descriptor and cleanup contracts merge.
3. Implement S7.6 the bounded one-image workout-post flow after managed avatars are stable.
4. Define and implement manual review/appeal and retention operations.
5. Run staging calibration, physical-device, release, rollback, privacy, and legal gates only with the required authorization and configuration.

## New-chat starter prompt

> Continue the Smart Fitness roadmap from `ROADMAP_PROGRESS.md`, with Social S7.4 approved derivatives and delivery as the active source-code slice. Work autonomously through meaningful bounded slices instead of stopping after micro-changes. At the start, verify exact `main` and open PRs for `hon4olo/smart-fitness-app` and `hon4olo/smart-fitness-backend`; read both `AGENTS.md`, mobile `PROJECT_LEARNINGS.md`, `ROADMAP_PROGRESS.md`, `docs/roadmap/social-network.md`, and only the files relevant to the current slice. Do not restart already completed Social S0-S7.3 work. Implement backend approved derivatives only after internal moderation allow, with bounded avatar/workout-post variants, a layout-stable placeholder, immutable content-hashed keys, a strict media descriptor, CDN-neutral delivery, atomic approved transition, and full cleanup/retry/stale-worker/deletion-race tests. Preserve the private-data versus Social boundary, existing routes/contracts, localization, block/restriction enforcement, and file-size limits. Run full blocking CI, inspect review threads, and merge only exact green heads. Do not publish OTA, create/install native builds, deploy backend changes, execute migrations, activate staging/production, configure credentials, connect real storage/CDN/moderation providers, or enable public image uploads without explicit authorization.
