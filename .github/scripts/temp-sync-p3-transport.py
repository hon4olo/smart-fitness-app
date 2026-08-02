from pathlib import Path

MOBILE_MAIN = "4ea33fcbb20458676b12536cd3662eec35bb9000"
BACKEND_MAIN = "1d98e50aa9014bca59a7ed7a51ef3803f296dae3"
PR102_HEAD = "b7aa65cdd22d47b914fcb83e7bb674129b6c1c35"
PR102_MERGE = BACKEND_MAIN


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
        "- mobile `main`: `9c7eca92793b175c2bbff541a94bc9d1c29e76c2`;",
        f"- mobile `main`: `{MOBILE_MAIN}`;",
        "mobile baseline",
    )
    text = replace_once(
        text,
        "- backend `main`: `237d83eb25688e2a72157ea8e199b724bd9426e2`;",
        f"- backend `main`: `{BACKEND_MAIN}`;",
        "backend baseline",
    )
    marker = "- backend PR #101 merge: `237d83eb25688e2a72157ea8e199b724bd9426e2`;"
    evidence = marker + f"\n- backend PR #102 exact green head: `{PR102_HEAD}`;\n- backend PR #102 merge: `{PR102_MERGE}`;"
    return text.replace(marker, evidence, 1)


roadmap_path = Path("ROADMAP_PROGRESS.md")
roadmap = update_baseline(roadmap_path.read_text())
roadmap_p3 = f"""### P3 — classifier and OCR readiness

Status: active. The provider-neutral HTTP transport and failure-containment foundation are merged; provider-specific classifier/OCR adapters remain blocked on provider contract selection.

Backend PR #102, exact green head `{PR102_HEAD}`, merge `{PR102_MERGE}`:

- added a backend-only HTTPS transport with bounded URL, headers, request bytes, timeout, response bytes, redirect behavior, and caller cancellation;
- performs exactly one transport attempt so existing provider runners retain retry ownership;
- added strict success, retryable-failure, and terminal-failure HTTP classification;
- added bounded standard rate-limit metadata parsing;
- added generic redacted errors for invalid request, cancellation, timeout, network failure, oversized response, invalid response, and open circuit;
- added optional bounded circuit containment with one half-open probe and no provider identity or endpoint state;
- added deterministic conformance coverage for redirect blocking, rate limits, malformed metadata, declared and streamed overflow, timeout, cancellation, network failure, unsafe requests, redaction, circuit state, and strict bounds;
- made no network calls and did not change provider factories, configuration support, classifier/OCR readiness, workers, or product capabilities.

Remaining P3 boundary:

- select and document the classifier provider API contract before implementing its request builder and strict versioned response parser;
- select and document the OCR provider API contract before implementing its request builder and strict versioned response parser;
- map only validated provider outputs into the existing internal classifier and OCR signals without changing deterministic policy;
- retain bounded provider/model/parser metadata without raw responses or OCR plaintext;
- add adapter conformance for malformed JSON, unknown or duplicate categories, retryable and terminal transport outcomes, cancellation, rate limits, stale workers, and secret non-disclosure;
- enable source readiness in provider factories and production validation only after both selected adapters are implemented and tested;
- keep credentials, real calls, staging configuration, managed-media product enablement, and calibration outside autonomous source work.
"""
roadmap = replace_section(
    roadmap,
    "### P3 — classifier and OCR readiness",
    "### P4 — moderation calibration harness",
    roadmap_p3,
    "roadmap P3 section",
)
roadmap_prompt = f"""> Continue autonomous work on the Smart Fitness Provider and Release Readiness program. Repositories: mobile `hon4olo/smart-fitness-app`, backend `hon4olo/smart-fitness-backend`. Do not rely only on this prompt: first verify exact current `main` and open PRs in both repositories; read both `AGENTS.md`, mobile `PROJECT_LEARNINGS.md`, `ROADMAP_PROGRESS.md`, `docs/implementation-plan.md`, `docs/roadmap/provider-readiness.md`, `docs/roadmap/social-network.md`, `docs/architecture/app-context-consumer-inventory.md`, backend `docs/architecture/social-media-worker-runtime.md`, and backend `docs/architecture/provider-http-transport.md`; then inspect only code and tests relevant to the selected bounded slice. P0, P1, and P2 are source-complete. P3 transport foundation is complete through backend PR #102 exact green head `{PR102_HEAD}`, merge `{PR102_MERGE}`. Provider-specific classifier and OCR adapters are not selected, provider factories remain unavailable, and managed-media capabilities remain disabled. Continue only after identifying an explicitly selected documented provider API contract; then implement the smallest complete classifier or OCR adapter with strict request construction, exact response parsing, mapping into existing internal signals, transport/circuit integration, bounded metadata, and deterministic conformance tests. Do not invent a generic provider payload or make a provider source-ready without a selected contract. Preserve all lifecycle, ownership, state-version, CAS, lease, moderation, review, appeal, evidence, retention, legal-hold, cleanup, authentication, sync, idempotency, localization, offline, navigation, draft, polling, and privacy boundaries. Work through meaningful bounded backend/mobile/docs PRs, run full blocking CI, inspect review threads, and merge only exact fully green heads. Do not configure credentials, call real providers, create buckets/CDN/DNS, deploy backend changes, execute migrations outside CI, schedule workers, activate staging or production, publish OTA/EAS, create/install native builds, enable public media uploads, or activate production password-reset email without my direct request."""
roadmap = roadmap[:roadmap.index("## New-chat starter prompt")] + "## New-chat starter prompt\n\n" + roadmap_prompt + "\n"
roadmap_path.write_text(roadmap)

plan_path = Path("docs/implementation-plan.md")
plan = update_baseline(plan_path.read_text())
plan_p3 = f"""## Current P3 status

The provider-neutral HTTP transport and failure-containment foundation are source-complete.

Backend PR #102, exact green head `{PR102_HEAD}`, merge `{PR102_MERGE}`:

- added bounded HTTPS GET/POST transport with caller cancellation, internal timeout, manual redirects, no-store requests, omitted credentials, safe headers, and bounded request/response bytes;
- added strict status classification and bounded Retry-After/RateLimit metadata;
- added constant redacted transport errors and no internal retry loop;
- added optional bounded circuit containment with one half-open probe;
- added deterministic no-network conformance tests and architecture documentation;
- preserved provider-runner retry ownership, moderation policy, worker leases, provider factories, production source support, readiness, and product disablement.

## Next bounded slice

P3 provider-specific work requires an explicitly selected documented classifier or OCR provider API contract.

After selection, implement one adapter at a time:

- strict endpoint-relative request construction through the merged provider HTTP transport;
- exact versioned response parser that rejects malformed JSON, unknown required fields, unsupported categories, duplicates, non-finite values, and incompatible versions;
- mapping into the existing internal classifier or OCR contract without changing deterministic moderation policy;
- bounded provider/model/parser metadata without raw payloads or OCR plaintext;
- conformance coverage for success, retryable and terminal HTTP outcomes, timeout, cancellation, rate limit, malformed response, unknown category, duplicate result, stale worker, circuit-open state, and secret non-disclosure;
- composition-root source support only after the adapter is complete.

Do not create an invented generic provider payload, mark `external_http` source-ready, or change classifier/OCR capability readiness until provider-specific adapters are merged.

No deployment, migration execution outside CI, worker scheduling, environment activation, credential change, real provider call, public upload activation, OTA, or native build is authorized.
"""
plan = replace_section(
    plan,
    "## Next bounded slice",
    "## Execution rules",
    plan_p3,
    "implementation plan P3 status",
)
plan_path.write_text(plan)

provider_path = Path("docs/roadmap/provider-readiness.md")
provider = update_baseline(provider_path.read_text())
provider_p3 = f"""## Phase P3 — classifier, OCR, and provider transport readiness

Status: active. Provider-neutral transport and failure containment are merged; provider-specific adapters remain blocked on provider selection.

Merged evidence:

- backend PR #102 exact green head: `{PR102_HEAD}`;
- backend PR #102 merge: `{PR102_MERGE}`;
- the exact head passed lint, formatting, TypeScript build, production configuration validation, migrations and idempotency, migrated-schema integration, PostgreSQL Social API integration, full Vitest, and production startup/health.

Provider-neutral runtime:

- [x] add a bounded backend HTTPS transport with abortable timeout, caller cancellation, response-size limits, strict status handling, and redacted errors;
- [x] perform exactly one transport attempt so existing provider runners retain bounded retry ownership;
- [x] parse bounded standard and interoperable rate-limit metadata;
- [x] block automatic redirects and reject unsafe URLs, credentials, fragments, headers, methods, and sizes;
- [x] add optional bounded circuit containment without provider identity, endpoint state, or hidden configuration failures;
- [x] add deterministic conformance for timeout, cancellation, network failure, malformed metadata, declared/streamed overflow, rate limiting, retryable and terminal statuses, unsafe requests, circuit behavior, and secret non-disclosure;
- [ ] validate selected provider responses through strict versioned parsers;
- [ ] map selected provider categories into existing internal classifier and OCR signals rather than changing domain policy;
- [ ] retain parser, provider, model, policy, and attempt version metadata without raw responses or OCR plaintext;
- [ ] add provider-adapter conformance for unknown category, duplicate result, malformed JSON, retryable failure, terminal failure, cancellation, rate limit, circuit-open state, stale-worker behavior, and secret non-disclosure.

Provider-specific adapters:

- [ ] select and document the classifier provider API contract;
- [ ] implement the selected classifier request builder and strict response parser;
- [ ] select and document the OCR provider API contract;
- [ ] implement the selected OCR request builder and strict response parser;
- [ ] compose selected adapters only in the backend application root;
- [ ] update production source-support validation only after both required adapters are complete;
- [ ] keep credentials supplied only by backend environment variables or the deployment secret store;
- [ ] keep adapters and managed-media product capabilities disabled until explicit staging configuration and P4 calibration.

No API key or real provider call was required for the transport foundation. Provider selection is required before provider-specific request and response parsing can be completed.

No credential, provider account, network call, deployment, worker activation, public upload activation, or production environment change was performed.
"""
provider = replace_section(
    provider,
    "## Phase P3 — classifier, OCR, and provider transport readiness",
    "## Phase P4 — moderation calibration harness",
    provider_p3,
    "provider roadmap P3 section",
)
provider_path.write_text(provider)
