from pathlib import Path

MOBILE_MAIN = "fa09d0f3948a8b579ca3fbe91b2e1b44c7bda6aa"
BACKEND_MAIN = "ec42dc864a56311e04997a3bd76f400e0bde129f"
PR99_HEAD = "6c1a2efe46e435d990df5a5dc39afe07562339f6"
PR99_MERGE = BACKEND_MAIN


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one match, found {count}")
    return text.replace(old, new, 1)


def replace_section(text: str, start: str, end: str, body: str, label: str) -> str:
    start_index = text.find(start)
    if start_index < 0:
        raise SystemExit(f"{label}: start marker missing")
    end_index = text.find(end, start_index)
    if end_index < 0:
        raise SystemExit(f"{label}: end marker missing")
    return text[:start_index] + body.rstrip() + "\n\n" + text[end_index:]


def update_baseline(text: str, previous_mobile: str, previous_backend: str) -> str:
    text = replace_once(
        text,
        f"- mobile `main`: `{previous_mobile}`;",
        f"- mobile `main`: `{MOBILE_MAIN}`;",
        "mobile baseline",
    )
    text = replace_once(
        text,
        f"- backend `main`: `{previous_backend}`;",
        f"- backend `main`: `{BACKEND_MAIN}`;",
        "backend baseline",
    )
    marker = "- backend PR #98 merge: `34104bec69533fbe89bbaa53cef0884119c13e38`;"
    evidence = marker + f"\n- backend PR #99 exact green head: `{PR99_HEAD}`;\n- backend PR #99 merge: `{PR99_MERGE}`;"
    return replace_once(text, marker, evidence, "PR99 baseline evidence")


roadmap_path = Path("ROADMAP_PROGRESS.md")
roadmap = update_baseline(
    roadmap_path.read_text(),
    "7695b3ff1116fae667e0dbbfd1f11baa9ae4d455",
    "34104bec69533fbe89bbaa53cef0884119c13e38",
)
roadmap_p2 = f"""### P2 — worker entrypoints and orchestration

Status: active. Shared runtime plus cleanup, derivative-delivery, and moderation process boundaries are merged; upload expiry and operational orchestration remain incomplete.

Backend PR #96, exact green head `6ec65413b4c3164bcf176d41230d817e203b8095`, merge `b6fe1fa4d7f42960f0e0544f256466faa3cf9b49`:

- added the shared bounded one-shot and continuous worker runtime;
- added privacy-safe aggregate summaries, deterministic exit codes, abortable idle polling, and process resource cleanup;
- added the source-only managed-media cleanup entrypoint around existing claims, leases, legal holds, dependency ordering, and append-only audit;
- kept workers unscheduled and product capabilities disabled.

Backend PR #98, exact green head `565d60f99cf20cac7fb7c3bf0dcef01d737048ca`, merge `34104bec69533fbe89bbaa53cef0884119c13e38`:

- added a reusable per-claim batch boundary that checks abort before every next claimed operation;
- hardened cleanup shutdown so no new cleanup claim starts after `SIGINT` or `SIGTERM` is observed;
- added source-only derivative-delivery `process` and expired-claim `recover` operations;
- reused existing delivery ownership, state versions, processing tokens, leases, moderation-master integrity, immutable publication, stale-worker rejection, partial-publication cleanup, and recovery contracts.

Backend PR #99, exact green head `{PR99_HEAD}`, merge `{PR99_MERGE}`:

- added source-only media-moderation `process` and expired-claim `recover` operations on the shared runtime;
- composed the existing moderation repository, image normalizer, HEIC decoder, private storage, classifier, OCR, and OCR text-moderation orchestrator;
- failed closed unless private storage, classifier, and OCR are operationally ready;
- preserved source checksum, MIME and length validation, metadata stripping, private moderation-master persistence, provider attempt metadata, deterministic fitness-aware policy, manual-review routing, state versions, processing tokens, leases, stale-result behavior, failed-state recording, and expired recovery;
- accepted no owner IDs, asset IDs, object keys, OCR text, media bytes, provider payloads, or credentials from CLI input.

Remaining P2 boundary:

- add a bounded stale-upload expiry entrypoint through the existing `expireStaleUploads(1)` path;
- preserve oldest-expired ordering, private-object deletion before terminal CAS, state versions, failure retention, and retry-on-storage-failure behavior;
- classify the remaining safe retry boundaries, bounded backoff, maximum attempts, and heartbeat only where measured operation duration requires it;
- expose privacy-safe aggregate readiness across all worker types;
- add systemd unit/timer and Docker Compose templates plus process ordering, duplicate-process, crash-recovery, rollout, rollback, and emergency-disable runbooks;
- do not deploy, schedule, activate, or enable workers during source implementation.
"""
roadmap = replace_section(
    roadmap,
    "### P2 — worker entrypoints and orchestration",
    "### P3 — classifier and OCR readiness",
    roadmap_p2,
    "roadmap P2 section",
)
roadmap_prompt = f"""> Continue autonomous work on the Smart Fitness Provider and Release Readiness program. Repositories: mobile `hon4olo/smart-fitness-app`, backend `hon4olo/smart-fitness-backend`. Do not rely only on this prompt: first verify exact current `main` and open PRs in both repositories; read both `AGENTS.md`, mobile `PROJECT_LEARNINGS.md`, `ROADMAP_PROGRESS.md`, `docs/implementation-plan.md`, `docs/roadmap/provider-readiness.md`, `docs/roadmap/social-network.md`, `docs/architecture/app-context-consumer-inventory.md`, and backend `docs/architecture/social-media-worker-runtime.md`; then inspect only code and tests relevant to the selected bounded slice. P0 and P1 are complete. P2 is active through backend PR #99 exact green head `{PR99_HEAD}`, merge `{PR99_MERGE}`: the shared runtime, per-claim shutdown, cleanup, derivative-delivery processing/recovery, and media-moderation processing/recovery entrypoints are merged. Continue with the smallest complete stale-upload expiry entrypoint using the existing `SocialMediaUploadService.expireStaleUploads`, oldest-expired repository ordering, private storage deletion, exact state-version CAS, failed-state retention, and shared per-claim runtime. Preserve all lifecycle, ownership, state-version, CAS, lease, moderation, review, appeal, evidence, retention, legal-hold, cleanup, authentication, sync, idempotency, localization, offline, navigation, draft, polling, and privacy boundaries. Work through meaningful bounded backend/mobile/docs PRs, run full blocking CI, inspect review threads, and merge only exact fully green heads. Do not configure credentials, call real providers, create buckets/CDN/DNS, deploy backend changes, execute migrations outside CI, schedule workers, activate staging or production, publish OTA/EAS, create/install native builds, enable public media uploads, or activate production password-reset email without my direct request."""
roadmap = replace_section(
    roadmap,
    "## New-chat starter prompt",
    "__END_OF_FILE__",
    "## New-chat starter prompt\n\n" + roadmap_prompt,
    "roadmap starter prompt",
) if "__END_OF_FILE__" in roadmap else roadmap[:roadmap.index("## New-chat starter prompt")] + "## New-chat starter prompt\n\n" + roadmap_prompt + "\n"
roadmap_path.write_text(roadmap)

plan_path = Path("docs/implementation-plan.md")
plan = update_baseline(
    plan_path.read_text(),
    "7695b3ff1116fae667e0dbbfd1f11baa9ae4d455",
    "34104bec69533fbe89bbaa53cef0884119c13e38",
)
plan_p2 = f"""## Current P2 status

P2 is active. Shared runtime, cleanup, derivative-delivery processing/recovery, and media-moderation processing/recovery are merged.

Backend PR #96, exact green head `6ec65413b4c3164bcf176d41230d817e203b8095`, merge `b6fe1fa4d7f42960f0e0544f256466faa3cf9b49`:

- added the provider-neutral bounded one-shot and continuous process loop;
- added the source-only cleanup worker around existing cleanup claims and providers;
- added deterministic aggregate output, exit codes, abortable polling, resource close, and privacy tests.

Backend PR #98, exact green head `565d60f99cf20cac7fb7c3bf0dcef01d737048ca`, merge `34104bec69533fbe89bbaa53cef0884119c13e38`:

- added per-claim abort observation;
- hardened cleanup shutdown;
- added derivative-delivery processing and expired-processing recovery through existing worker contracts.

Backend PR #99, exact green head `{PR99_HEAD}`, merge `{PR99_MERGE}`:

- added media-moderation processing and expired-processing recovery through the existing moderation worker;
- composed private storage, normalization, classifier, OCR, and OCR text moderation only in the process composition boundary;
- preserved checksum validation, normalized-master integrity, provider attempt metadata, deterministic policy, manual-review routing, exact state versions, tokens, leases, stale-result handling, failed-state recording, and recovery;
- added bounded one-shot/continuous execution, readiness failure, privacy-safe aggregate output, resource cleanup, and deterministic tests;
- added no scheduling, deployment, provider activation, credentials, or lifecycle changes.

## Next bounded slice

Continue P2 with stale upload expiry:

- compose the existing upload repository, private storage, image validator, cleanup service, and `SocialMediaUploadService` without enabling public uploads;
- add a source-only expiry operation that invokes `expireStaleUploads(1)` through the shared per-claim runtime;
- preserve oldest-expired ordering, exact state versions, private-object deletion before `upload_expired` terminal CAS, immediate retention eligibility, and safe retry when object deletion fails;
- expose only aggregate process results and bounded failure categories without IDs, object keys, signed URLs, media bytes, provider payloads, credentials, or raw exceptions;
- keep the worker unscheduled and leave public media capabilities disabled.

After the expiry boundary, audit the remaining retry/backoff, aggregate readiness, process-template, and runbook work before declaring P2 source-complete.

No deployment, migration execution outside CI, worker scheduling, environment activation, credential change, real provider call, public upload activation, OTA, or native build is authorized.
"""
plan = replace_section(
    plan,
    "## Current P2 status",
    "## Execution rules",
    plan_p2,
    "implementation-plan P2 section",
)
plan_path.write_text(plan)

provider_path = Path("docs/roadmap/provider-readiness.md")
provider = update_baseline(
    provider_path.read_text(),
    "7695b3ff1116fae667e0dbbfd1f11baa9ae4d455",
    "34104bec69533fbe89bbaa53cef0884119c13e38",
)
provider_p2 = f"""## Phase P2 — production worker entrypoints and orchestration

Status: active. Cleanup, derivative-delivery, and media-moderation process boundaries are merged; stale-upload expiry and operational orchestration remain incomplete.

Merged evidence:

- backend PR #96 exact green head: `6ec65413b4c3164bcf176d41230d817e203b8095`;
- backend PR #96 merge: `b6fe1fa4d7f42960f0e0544f256466faa3cf9b49`;
- backend PR #98 exact green head: `565d60f99cf20cac7fb7c3bf0dcef01d737048ca`;
- backend PR #98 merge: `34104bec69533fbe89bbaa53cef0884119c13e38`;
- backend PR #99 exact green head: `{PR99_HEAD}`;
- backend PR #99 merge: `{PR99_MERGE}`;
- all exact heads passed lint, formatting, TypeScript build, production configuration validation, migrations and idempotency, migrated-schema integration, PostgreSQL Social API integration, full Vitest, and production startup/health.

Shared process runtime:

- [x] add bounded one-shot and continuous execution modes without changing domain claims or leases;
- [x] validate batch size, poll interval, optional maximum iterations, processed counts, and per-claim `0|1` results;
- [x] poll only after idle work and continue immediately after a non-empty iteration;
- [x] support abortable idle waits, `SIGINT`, `SIGTERM`, deterministic aggregate summaries, and deterministic exit codes;
- [x] close process resources in `finally` and keep raw exceptions out of direct process output;
- [x] observe graceful shutdown between individual claimed operations through the shared per-claim batch helper;
- [ ] add shared bounded failure classification, retry backoff, maximum attempts, and heartbeat only where required by measured operation duration.

Managed-media cleanup entrypoint:

- [x] compose the existing cleanup service and repositories with configured private storage and immutable delivery providers;
- [x] preserve oldest-due claims, claim tokens, lease expiry, exact state versions, legal holds, stale release, dependency ordering, tombstone purge, append-only audit, and idempotent provider deletion;
- [x] process cleanup operations one claim at a time and stop before the next claim after abort;
- [x] keep one-shot and continuous modes source-only and unscheduled.

Derivative-delivery entrypoint:

- [x] add bounded ready-asset processing through `processReadyBatch(1)`;
- [x] add bounded expired-processing recovery through `recoverExpiredProcessing(1)`;
- [x] preserve ownership, state versions, processing tokens, leases, master integrity, strict derivative generation, immutable publication, stale-worker rejection, partial cleanup, release, recovery, approval completion, and private-origin cleanup ordering;
- [x] accept no IDs, object keys, tokens, prefixes, URLs, or provider payloads from CLI input;
- [x] expose only versioned aggregate worker, operation, mode, stop-reason, iteration, processed, idle, and duration fields.

Media-moderation entrypoint:

- [x] add bounded ready-asset processing through `processReadyBatch(1)`;
- [x] add bounded expired-processing recovery through `recoverExpiredProcessing(1)`;
- [x] compose private storage, deterministic normalization, classifier, OCR, and OCR text moderation only in the process composition boundary;
- [x] preserve source checksum, MIME and length validation, metadata removal, normalized-master persistence, provider attempt metadata, deterministic fitness-aware policy, manual-review routing, exact state versions, processing tokens, leases, stale-result behavior, failed-state recording, and recovery;
- [x] fail closed unless private storage, classifier, and OCR are operationally ready;
- [x] keep OCR text, media bytes, provider payloads, IDs, object keys, and credentials out of CLI input and process output.

Remaining worker entrypoints:

- [ ] add a bounded stale-upload expiry entrypoint through `expireStaleUploads(1)`;
- [ ] preserve oldest-expired ordering, private-object deletion before terminal CAS, exact state versions, failure retention, and retry when storage deletion fails;
- [ ] add only other retryable-failure entrypoints backed by explicit existing claims or idempotent service contracts;
- [ ] expose privacy-safe aggregate readiness and operation status across worker types.

Process templates and operations:

- [ ] add systemd unit and timer templates plus Docker Compose service templates;
- [ ] document process ordering, duplicate-process behavior, crash recovery, rollout, rollback, and emergency disable procedures;
- [ ] do not start or schedule workers in any environment during source implementation.

No credential, provider account, real provider call, bucket, CDN, DNS, deployment, migration execution outside CI, worker scheduling, public upload activation, or production environment change was performed.
"""
provider = replace_section(
    provider,
    "## Phase P2 — production worker entrypoints and orchestration",
    "## Phase P3 — classifier, OCR, and provider transport readiness",
    provider_p2,
    "provider roadmap P2 section",
)
provider_path.write_text(provider)
