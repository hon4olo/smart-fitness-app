from pathlib import Path

MOBILE_MAIN = "8a5ea3f7ae2bf7df425a568b85a2404b1b6d72a7"
BACKEND_MAIN = "6a2b7f1a1196ee66b4e3ad4f049afcef561981f9"
PR100_HEAD = "5fb21ca3b5d63fee89bf0e3db65b2bf37ba672fd"
PR100_MERGE = BACKEND_MAIN


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


def update_baseline(text: str) -> str:
    text = replace_once(
        text,
        "- mobile `main`: `fa09d0f3948a8b579ca3fbe91b2e1b44c7bda6aa`;",
        f"- mobile `main`: `{MOBILE_MAIN}`;",
        "mobile baseline",
    )
    text = replace_once(
        text,
        "- backend `main`: `ec42dc864a56311e04997a3bd76f400e0bde129f`;",
        f"- backend `main`: `{BACKEND_MAIN}`;",
        "backend baseline",
    )
    marker = "- backend PR #99 merge: `ec42dc864a56311e04997a3bd76f400e0bde129f`;"
    evidence = marker + f"\n- backend PR #100 exact green head: `{PR100_HEAD}`;\n- backend PR #100 merge: `{PR100_MERGE}`;"
    return text.replace(marker, evidence, 1)


roadmap_path = Path("ROADMAP_PROGRESS.md")
roadmap = update_baseline(roadmap_path.read_text())
roadmap_p2 = f"""### P2 — worker entrypoints and orchestration

Status: active final orchestration boundary. Shared runtime plus cleanup, derivative-delivery, moderation, and stale-upload expiry process entrypoints are merged; aggregate readiness, retry classification, templates, and runbooks remain incomplete.

Backend PR #96, exact green head `6ec65413b4c3164bcf176d41230d817e203b8095`, merge `b6fe1fa4d7f42960f0e0544f256466faa3cf9b49`:

- added the shared bounded one-shot and continuous worker runtime;
- added privacy-safe aggregate summaries, deterministic exit codes, abortable idle polling, and process resource cleanup;
- added source-only cleanup processing around existing claims, leases, legal holds, dependency ordering, and append-only audit.

Backend PR #98, exact green head `565d60f99cf20cac7fb7c3bf0dcef01d737048ca`, merge `34104bec69533fbe89bbaa53cef0884119c13e38`:

- added per-operation abort observation;
- hardened cleanup shutdown;
- added derivative-delivery processing and expired-claim recovery through existing worker contracts.

Backend PR #99, exact green head `6c1a2efe46e435d990df5a5dc39afe07562339f6`, merge `ec42dc864a56311e04997a3bd76f400e0bde129f`:

- added media-moderation processing and expired-claim recovery;
- reused existing normalization, classifier, OCR, text policy, state-version, token, lease, stale-result, failed-state, and manual-review contracts.

Backend PR #100, exact green head `{PR100_HEAD}`, merge `{PR100_MERGE}`:

- added source-only stale private-upload expiry through `expireStaleUploads(1)`;
- preserved oldest-expired ordering, stable tie breaking, private-object deletion before terminal compare-and-set, exact state versions, `failed/upload_expired`, immediate retention eligibility, and safe retry when deletion fails;
- added no second claim or lease contract and kept public uploads explicitly disabled;
- added bounded one-shot/continuous execution, abort-between-operations, privacy-safe aggregate output, readiness failure, resource cleanup, and deletion-ordering tests.

Remaining P2 boundary:

- inventory each process dependency and publish a privacy-safe versioned worker-readiness contract without provider names, endpoints, secrets, object keys, IDs, or private values;
- classify retry behavior by existing domain contract and add process-level backoff only for continuous idle or bounded retryable outcomes that do not duplicate provider-level attempts;
- document why no new heartbeat is required where current per-operation work fits existing lease budgets, or add one only where measured duration proves it necessary;
- add source-only systemd unit/timer and Docker Compose templates with disabled-by-default examples;
- document process ordering, duplicate-process behavior, crash recovery, rollout, rollback, emergency disable, and capability-enable sequencing;
- do not deploy, schedule, activate, or enable workers during source implementation.
"""
roadmap = replace_section(
    roadmap,
    "### P2 — worker entrypoints and orchestration",
    "### P3 — classifier and OCR readiness",
    roadmap_p2,
    "roadmap P2 section",
)
roadmap_prompt = f"""> Continue autonomous work on the Smart Fitness Provider and Release Readiness program. Repositories: mobile `hon4olo/smart-fitness-app`, backend `hon4olo/smart-fitness-backend`. Do not rely only on this prompt: first verify exact current `main` and open PRs in both repositories; read both `AGENTS.md`, mobile `PROJECT_LEARNINGS.md`, `ROADMAP_PROGRESS.md`, `docs/implementation-plan.md`, `docs/roadmap/provider-readiness.md`, `docs/roadmap/social-network.md`, `docs/architecture/app-context-consumer-inventory.md`, and backend `docs/architecture/social-media-worker-runtime.md`; then inspect only code, configuration, templates, and tests relevant to the selected bounded slice. P0 and P1 are complete. P2 process entrypoints are complete through backend PR #100 exact green head `{PR100_HEAD}`, merge `{PR100_MERGE}`: shared runtime, per-operation shutdown, cleanup, derivative delivery, media moderation, recovery, and stale-upload expiry are merged. Continue with the final P2 orchestration boundary: privacy-safe versioned worker readiness, explicit retry/backoff ownership, lease/heartbeat justification, disabled-by-default systemd and Docker Compose templates, and process-ordering/crash-recovery/rollback/emergency-disable runbooks. Preserve all lifecycle, ownership, state-version, CAS, lease, moderation, review, appeal, evidence, retention, legal-hold, cleanup, authentication, sync, idempotency, localization, offline, navigation, draft, polling, and privacy boundaries. Work through meaningful bounded backend/mobile/docs PRs, run full blocking CI, inspect review threads, and merge only exact fully green heads. Do not configure credentials, call real providers, create buckets/CDN/DNS, deploy backend changes, execute migrations outside CI, schedule workers, activate staging or production, publish OTA/EAS, create/install native builds, enable public media uploads, or activate production password-reset email without my direct request."""
roadmap = roadmap[:roadmap.index("## New-chat starter prompt")] + "## New-chat starter prompt\n\n" + roadmap_prompt + "\n"
roadmap_path.write_text(roadmap)

plan_path = Path("docs/implementation-plan.md")
plan = update_baseline(plan_path.read_text())
plan_p2 = f"""## Current P2 status

P2 is active at its final orchestration boundary. Shared runtime plus cleanup, derivative-delivery, moderation, recovery, and stale-upload expiry entrypoints are merged.

Backend PR #96 merged the bounded one-shot/continuous process loop, cleanup entrypoint, aggregate output, exit codes, abortable polling, and resource cleanup.

Backend PR #98 merged per-operation abort observation plus derivative-delivery processing and expired-processing recovery.

Backend PR #99, exact green head `6c1a2efe46e435d990df5a5dc39afe07562339f6`, merge `ec42dc864a56311e04997a3bd76f400e0bde129f`, merged media-moderation processing and expired-processing recovery through existing normalization, provider, policy, token, lease, and state-version contracts.

Backend PR #100, exact green head `{PR100_HEAD}`, merge `{PR100_MERGE}`:

- added stale private-upload expiry through the existing `expireStaleUploads(1)` service path;
- preserved oldest-expired selection, private deletion before terminal CAS, exact state versions, terminal retention eligibility, and retry when deletion fails;
- kept uploads disabled and added no claim, lease, route, DTO, schema, or lifecycle transition;
- added bounded process, abort, readiness, close, privacy, and deletion-order tests.

## Next bounded slice

Complete the final P2 orchestration source boundary:

- derive a strict versioned worker-readiness summary from existing provider configuration and process dependency matrices;
- keep the summary privacy-safe and independent from user data, IDs, object keys, endpoints, credentials, and provider names;
- document retry ownership so provider-level attempts are not multiplied by process-level retries;
- add bounded continuous-mode backoff only where the existing domain contract marks retry safe;
- audit lease budgets and record the heartbeat decision per worker;
- add disabled-by-default systemd unit/timer and Docker Compose templates without environment activation;
- add runbooks for process order, duplicate workers, crash recovery, rollout, rollback, emergency disable, and later capability enablement.

P2 may be marked source-complete only after full Backend CI, exact-green merge, canonical mobile roadmap synchronization, and confirmation that no environment was activated.

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
provider = update_baseline(provider_path.read_text())
provider_p2 = f"""## Phase P2 — production worker entrypoints and orchestration

Status: active final orchestration boundary. All planned media process entrypoints are merged; readiness, retry ownership, templates, and runbooks remain incomplete.

Merged evidence:

- backend PR #96 exact green head: `6ec65413b4c3164bcf176d41230d817e203b8095`;
- backend PR #96 merge: `b6fe1fa4d7f42960f0e0544f256466faa3cf9b49`;
- backend PR #98 exact green head: `565d60f99cf20cac7fb7c3bf0dcef01d737048ca`;
- backend PR #98 merge: `34104bec69533fbe89bbaa53cef0884119c13e38`;
- backend PR #99 exact green head: `6c1a2efe46e435d990df5a5dc39afe07562339f6`;
- backend PR #99 merge: `ec42dc864a56311e04997a3bd76f400e0bde129f`;
- backend PR #100 exact green head: `{PR100_HEAD}`;
- backend PR #100 merge: `{PR100_MERGE}`;
- all exact heads passed lint, formatting, TypeScript build, production configuration validation, migrations and idempotency, migrated-schema integration, PostgreSQL Social API integration, full Vitest, and production startup/health.

Shared process runtime:

- [x] add bounded one-shot and continuous execution modes without changing domain claims or leases;
- [x] validate batch size, poll interval, optional maximum iterations, processed counts, and per-operation `0|1` results;
- [x] poll only after idle work and continue immediately after a non-empty iteration;
- [x] support abortable idle waits, `SIGINT`, `SIGTERM`, deterministic aggregate summaries, and deterministic exit codes;
- [x] close process resources in `finally` and keep raw exceptions out of direct process output;
- [x] observe graceful shutdown between individual operations through the shared batch helper.

Process entrypoints:

- [x] managed-media cleanup with existing claims, legal holds, dependency ordering, tombstone purge, and append-only audit;
- [x] derivative-delivery processing and expired-claim recovery with immutable publication and partial cleanup;
- [x] media-moderation processing and expired-claim recovery with normalization, classifier, OCR, text policy, and manual-review routing;
- [x] stale private-upload expiry through `expireStaleUploads(1)` with deletion before terminal CAS and retry when deletion fails;
- [x] keep every process source-only, unscheduled, and incapable of accepting IDs, object keys, OCR text, media bytes, provider payloads, or credentials from CLI input.

Final orchestration work:

- [ ] add a strict versioned privacy-safe readiness summary for each worker and operation;
- [ ] document provider-level versus process-level retry ownership and add only bounded non-duplicative backoff;
- [ ] record lease budgets and heartbeat decisions for cleanup, delivery, moderation, and expiry;
- [ ] add disabled-by-default systemd unit/timer templates and Docker Compose service templates;
- [ ] document process ordering, duplicate-process behavior, crash recovery, rollout, rollback, emergency disable, and capability enablement order;
- [ ] prove templates and readiness parsers through deterministic tests without credentials or real processes;
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
