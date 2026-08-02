from pathlib import Path

MOBILE_MAIN = "9c7eca92793b175c2bbff541a94bc9d1c29e76c2"
BACKEND_MAIN = "237d83eb25688e2a72157ea8e199b724bd9426e2"
PR101_HEAD = "cc261cfe01c82d8b18888195fc8e4eec1ee56558"
PR101_MERGE = BACKEND_MAIN


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
        "- mobile `main`: `8a5ea3f7ae2bf7df425a568b85a2404b1b6d72a7`;",
        f"- mobile `main`: `{MOBILE_MAIN}`;",
        "mobile baseline",
    )
    text = replace_once(
        text,
        "- backend `main`: `6a2b7f1a1196ee66b4e3ad4f049afcef561981f9`;",
        f"- backend `main`: `{BACKEND_MAIN}`;",
        "backend baseline",
    )
    marker = "- backend PR #100 merge: `6a2b7f1a1196ee66b4e3ad4f049afcef561981f9`;"
    evidence = marker + f"\n- backend PR #101 exact green head: `{PR101_HEAD}`;\n- backend PR #101 merge: `{PR101_MERGE}`;"
    return text.replace(marker, evidence, 1)


roadmap_path = Path("ROADMAP_PROGRESS.md")
roadmap = update_baseline(roadmap_path.read_text())
roadmap_p2 = f"""### P2 — worker entrypoints and orchestration

Status: source-complete and merged.

Backend PR #96, exact green head `6ec65413b4c3164bcf176d41230d817e203b8095`, merge `b6fe1fa4d7f42960f0e0544f256466faa3cf9b49`:

- added the shared bounded one-shot and continuous worker runtime;
- added privacy-safe aggregate summaries, deterministic exit codes, abortable polling, and process resource cleanup;
- added source-only cleanup processing around existing claims, leases, legal holds, dependency ordering, and append-only audit.

Backend PR #98, exact green head `565d60f99cf20cac7fb7c3bf0dcef01d737048ca`, merge `34104bec69533fbe89bbaa53cef0884119c13e38`:

- added per-operation abort observation;
- hardened cleanup shutdown;
- added derivative-delivery processing and expired-claim recovery through existing worker contracts.

Backend PR #99, exact green head `6c1a2efe46e435d990df5a5dc39afe07562339f6`, merge `ec42dc864a56311e04997a3bd76f400e0bde129f`:

- added media-moderation processing and expired-claim recovery;
- preserved normalization, classifier, OCR, text policy, state-version, token, lease, stale-result, failed-state, and manual-review contracts.

Backend PR #100, exact green head `5fb21ca3b5d63fee89bf0e3db65b2bf37ba672fd`, merge `6a2b7f1a1196ee66b4e3ad4f049afcef561981f9`:

- added stale private-upload expiry through `expireStaleUploads(1)`;
- preserved oldest-expired ordering, private deletion before terminal CAS, exact state versions, retention eligibility, and safe retry after deletion failure.

Backend PR #101, exact green head `{PR101_HEAD}`, merge `{PR101_MERGE}`:

- added a strict versioned privacy-safe readiness manifest for every P2 worker operation;
- separated configured/ready state from product enablement and worker activation;
- fixed retry ownership so provider attempts stay in provider runners and domain replay stays in existing claims, release, idempotent deletion, recovery, and CAS contracts;
- recorded bounded external restart backoff and the no-heartbeat decision with explicit reopen criteria;
- added a readiness CLI that opens no database and performs no provider call;
- added disabled-by-default systemd unit/timer examples and a manual-profile non-restarting Docker Compose example;
- added deterministic source tests and an operations runbook for startup order, duplicate processes, crash recovery, emergency disable, rollback, and privacy-safe evidence.

P2 source completion does not activate workers or managed-media product behavior. No credentials, real provider calls, provider accounts, buckets, CDN, DNS, deployment, migration execution outside CI, unit installation, timer enablement, Docker worker startup, environment activation, public uploads, or production feature enablement were performed.
"""
roadmap = replace_section(
    roadmap,
    "### P2 — worker entrypoints and orchestration",
    "### P3 — classifier and OCR readiness",
    roadmap_p2,
    "roadmap P2 section",
)
roadmap = replace_once(
    roadmap,
    "### P3 — classifier and OCR readiness\n\n- bounded provider transport",
    "### P3 — classifier and OCR readiness\n\nStatus: active next phase.\n\n- bounded provider transport",
    "roadmap P3 status",
)
roadmap = replace_once(
    roadmap,
    "1. P2 worker entrypoints and process templates.\n2. P3 provider transport and selected classifier/OCR adapters.\n3. P4 moderation calibration harness.\n4. P5 password-reset mobile, links, templates, and delivery readiness.\n5. P6 deployment policies, smoke scripts, and runbooks.\n6. P7 backend-owned conflict choices and then mobile UI.\n7. P8 diagnostics, fixed-SHA release source gate, and Android source preparation.\n8. P9 technical privacy, legal, and analytics prerequisites.",
    "1. P3 provider transport and selected classifier/OCR adapters.\n2. P4 moderation calibration harness.\n3. P5 password-reset mobile, links, templates, and delivery readiness.\n4. P6 deployment policies, smoke scripts, and runbooks.\n5. P7 backend-owned conflict choices and then mobile UI.\n6. P8 diagnostics, fixed-SHA release source gate, and Android source preparation.\n7. P9 technical privacy, legal, and analytics prerequisites.",
    "roadmap execution order",
)
roadmap_prompt = f"""> Continue autonomous work on the Smart Fitness Provider and Release Readiness program. Repositories: mobile `hon4olo/smart-fitness-app`, backend `hon4olo/smart-fitness-backend`. Do not rely only on this prompt: first verify exact current `main` and open PRs in both repositories; read both `AGENTS.md`, mobile `PROJECT_LEARNINGS.md`, `ROADMAP_PROGRESS.md`, `docs/implementation-plan.md`, `docs/roadmap/provider-readiness.md`, `docs/roadmap/social-network.md`, `docs/architecture/app-context-consumer-inventory.md`, and backend `docs/architecture/social-media-worker-runtime.md`; then inspect only code and tests relevant to the selected bounded slice. P0, P1, and P2 are source-complete. P2 completed through backend PR #101 exact green head `{PR101_HEAD}`, merge `{PR101_MERGE}`; no worker, provider, upload, or environment was activated. Start P3 with a bounded provider-neutral HTTP transport and reusable conformance suite for classifier/OCR adapters: abortable timeout, response-size limit, strict status handling, rate-limit parsing, retry classification, redacted errors, cancellation, malformed responses, unknown categories, and bounded circuit/failure containment. Do not select or implement a provider-specific parser until a provider contract is explicitly chosen; keep current unavailable providers and managed-media product capabilities disabled. Preserve all lifecycle, ownership, state-version, CAS, lease, moderation, review, appeal, evidence, retention, legal-hold, cleanup, authentication, sync, idempotency, localization, offline, navigation, draft, polling, and privacy boundaries. Work through meaningful bounded backend/mobile/docs PRs, run full blocking CI, inspect review threads, and merge only exact fully green heads. Do not configure credentials, call real providers, create buckets/CDN/DNS, deploy backend changes, execute migrations outside CI, schedule workers, activate staging or production, publish OTA/EAS, create/install native builds, enable public media uploads, or activate production password-reset email without my direct request."""
roadmap = roadmap[:roadmap.index("## New-chat starter prompt")] + "## New-chat starter prompt\n\n" + roadmap_prompt + "\n"
roadmap_path.write_text(roadmap)

plan_path = Path("docs/implementation-plan.md")
plan = update_baseline(plan_path.read_text())
plan_p2 = f"""## Completed P2 status

Production worker entrypoints and source orchestration are source-complete.

Merged evidence:

- backend PR #96 exact green head `6ec65413b4c3164bcf176d41230d817e203b8095`, merge `b6fe1fa4d7f42960f0e0544f256466faa3cf9b49`;
- backend PR #98 exact green head `565d60f99cf20cac7fb7c3bf0dcef01d737048ca`, merge `34104bec69533fbe89bbaa53cef0884119c13e38`;
- backend PR #99 exact green head `6c1a2efe46e435d990df5a5dc39afe07562339f6`, merge `ec42dc864a56311e04997a3bd76f400e0bde129f`;
- backend PR #100 exact green head `5fb21ca3b5d63fee89bf0e3db65b2bf37ba672fd`, merge `6a2b7f1a1196ee66b4e3ad4f049afcef561981f9`;
- backend PR #101 exact green head `{PR101_HEAD}`, merge `{PR101_MERGE}`.

Completed source boundary:

- bounded one-shot and continuous worker runtime with per-operation abort observation;
- cleanup, derivative-delivery processing/recovery, moderation processing/recovery, and stale-upload expiry entrypoints;
- strict privacy-safe readiness manifest and read-only CLI;
- explicit retry ownership and bounded process-manager backoff without multiplying provider attempts;
- documented lease budgets and no-heartbeat decision with measured-reopen criteria;
- disabled-by-default systemd and manual-profile Docker Compose examples;
- deterministic template/readiness tests and operational runbook;
- no deployment, scheduling, credentials, provider calls, environment activation, public uploads, or product enablement.

## Next bounded slice

Start P3 with the provider-neutral transport and conformance foundation:

- audit current classifier/OCR provider contracts, unavailable providers, provider runner, configuration bounds, and existing deterministic policy inputs;
- add a backend-only bounded HTTP transport with abortable timeout, cancellation, response-size limits, strict status handling, rate-limit metadata, and redacted errors;
- define retryable versus terminal transport outcomes without changing existing domain policy or worker leases;
- add reusable conformance tests for timeout, cancellation, malformed response, oversized response, unknown status/category, rate limiting, retryable failure, terminal failure, and secret non-disclosure;
- keep provider-specific request/response parsers deferred until a provider API is selected;
- keep classifier/OCR readiness unavailable and managed-media product capabilities disabled.

No deployment, migration execution outside CI, worker scheduling, environment activation, credential change, real provider call, public upload activation, OTA, or native build is authorized.
"""
plan = replace_section(
    plan,
    "## Current P2 status",
    "## Execution rules",
    plan_p2,
    "implementation plan P2 section",
)
plan_path.write_text(plan)

provider_path = Path("docs/roadmap/provider-readiness.md")
provider = update_baseline(provider_path.read_text())
provider_p2 = f"""## Phase P2 — production worker entrypoints and orchestration

Status: source-complete and merged.

Merged evidence:

- backend PR #96 exact green head: `6ec65413b4c3164bcf176d41230d817e203b8095`;
- backend PR #96 merge: `b6fe1fa4d7f42960f0e0544f256466faa3cf9b49`;
- backend PR #98 exact green head: `565d60f99cf20cac7fb7c3bf0dcef01d737048ca`;
- backend PR #98 merge: `34104bec69533fbe89bbaa53cef0884119c13e38`;
- backend PR #99 exact green head: `6c1a2efe46e435d990df5a5dc39afe07562339f6`;
- backend PR #99 merge: `ec42dc864a56311e04997a3bd76f400e0bde129f`;
- backend PR #100 exact green head: `5fb21ca3b5d63fee89bf0e3db65b2bf37ba672fd`;
- backend PR #100 merge: `6a2b7f1a1196ee66b4e3ad4f049afcef561981f9`;
- backend PR #101 exact green head: `{PR101_HEAD}`;
- backend PR #101 merge: `{PR101_MERGE}`;
- all exact heads passed lint, formatting, TypeScript build, production configuration validation, migrations and idempotency, migrated-schema integration, PostgreSQL Social API integration, full Vitest, and production startup/health.

Acceptance criteria:

- [x] bounded one-shot and continuous runtime with deterministic aggregate output and exit codes;
- [x] graceful shutdown between individual operations and abortable idle polling;
- [x] cleanup, derivative-delivery, moderation, recovery, and stale-upload expiry process entrypoints;
- [x] strict versioned worker readiness without database access, provider calls, provider identities, endpoints, secrets, IDs, object keys, OCR text, or media bytes;
- [x] provider-level versus process-level retry ownership documented and tested;
- [x] bounded external restart backoff without in-process retry multiplication;
- [x] lease budgets and heartbeat decisions recorded for every operation;
- [x] disabled-by-default systemd unit/timer and manual Docker Compose templates;
- [x] process ordering, duplicate-process, crash-recovery, rollout, rollback, emergency-disable, and capability-enable runbook;
- [x] deterministic source tests for readiness, strict parsing, privacy, gating, timers, restart behavior, and template commands;
- [x] no worker started or scheduled in any environment during source implementation.

P2 source completion does not imply infrastructure readiness or activation. No credential, provider account, real provider call, bucket, CDN, DNS, deployment, migration execution outside CI, unit installation, timer enablement, Docker worker startup, public upload activation, or production environment change was performed.
"""
provider = replace_section(
    provider,
    "## Phase P2 — production worker entrypoints and orchestration",
    "## Phase P3 — classifier, OCR, and provider transport readiness",
    provider_p2,
    "provider roadmap P2 section",
)
provider = replace_once(
    provider,
    "## Phase P3 — classifier, OCR, and provider transport readiness\n\nProvider-neutral runtime:",
    "## Phase P3 — classifier, OCR, and provider transport readiness\n\nStatus: active next phase.\n\nProvider-neutral runtime:",
    "provider P3 status",
)
provider_path.write_text(provider)
