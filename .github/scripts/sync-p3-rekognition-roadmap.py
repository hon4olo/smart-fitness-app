from pathlib import Path

MOBILE_BEFORE = "4ea33fcbb20458676b12536cd3662eec35bb9000"
MOBILE_AFTER = "b95f696b3176ca8597f3cd36bb499b3d9c5971ce"
BACKEND_BEFORE = "1d98e50aa9014bca59a7ed7a51ef3803f296dae3"
BACKEND_AFTER = "0e2829d91b077eec9fb60d25390b038ada0676db"
PR_103_HEAD = "02675ab50683c4745f7f1a3c5cc05b081016bb15"


def replace_once(content: str, old: str, new: str, label: str) -> str:
    count = content.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected one match, found {count}")
    return content.replace(old, new, 1)


def replace_first(content: str, old: str, new: str, label: str) -> str:
    count = content.count(old)
    if count < 1:
        raise RuntimeError(f"{label}: expected at least one match, found {count}")
    return content.replace(old, new, 1)


def common_baseline(content: str, label: str) -> str:
    content = replace_once(
        content,
        f"- mobile `main`: `{MOBILE_BEFORE}`;",
        f"- mobile `main`: `{MOBILE_AFTER}`;",
        f"{label} mobile baseline",
    )
    content = replace_once(
        content,
        f"- backend `main`: `{BACKEND_BEFORE}`;",
        f"- backend `main`: `{BACKEND_AFTER}`;",
        f"{label} backend baseline",
    )
    evidence = (
        f"- backend PR #102 merge: `{BACKEND_BEFORE}`;\n"
        f"- backend PR #103 exact green head: `{PR_103_HEAD}`;\n"
        f"- backend PR #103 merge: `{BACKEND_AFTER}`;"
    )
    return replace_first(
        content,
        f"- backend PR #102 merge: `{BACKEND_BEFORE}`;",
        evidence,
        f"{label} PR 103 evidence",
    )


def update_roadmap_progress() -> None:
    path = Path("ROADMAP_PROGRESS.md")
    content = common_baseline(path.read_text(), path.name)
    content = replace_once(
        content,
        "Status: active. The provider-neutral HTTP transport and failure-containment foundation are merged; provider-specific classifier/OCR adapters remain blocked on provider contract selection.",
        "Status: active. Provider-neutral transport is merged, and the Amazon Rekognition `DetectModerationLabels` classifier request/parser contract is source-complete; classifier signing/transport composition, OCR selection, factories, readiness, and activation remain open.",
        "ROADMAP P3 status",
    )
    pr_103_block = f"""Backend PR #103, exact green head `{PR_103_HEAD}`, merge `{BACKEND_AFTER}`:

- selected and documented Amazon Rekognition `DetectModerationLabels` as the classifier API contract;
- added bounded endpoint-relative JPEG-byte request construction with a fixed minimum confidence and response budget;
- added a strict moderation-model-v7 parser with exact field, hierarchy, duplicate, model, taxonomy, size, and unknown-label rejection;
- mapped only validated labels into the existing internal classifier categories and risk contexts without changing moderation policy;
- intentionally emitted no fitness context and no unsupported possible-minor, personal-data, or spam/scam signal;
- retained constant non-reflective errors and deterministic no-network conformance coverage;
- did not add credentials, signing, endpoint configuration, network calls, factory support, readiness, workers, or product capability changes.

Remaining P3 boundary:"""
    content = replace_once(
        content,
        "Remaining P3 boundary:",
        pr_103_block,
        "ROADMAP PR 103 block",
    )
    old_boundary = """- select and document the classifier provider API contract before implementing its request builder and strict versioned response parser;
- select and document the OCR provider API contract before implementing its request builder and strict versioned response parser;
- map only validated provider outputs into the existing internal classifier and OCR signals without changing deterministic policy;
- retain bounded provider/model/parser metadata without raw responses or OCR plaintext;
- add adapter conformance for malformed JSON, unknown or duplicate categories, retryable and terminal transport outcomes, cancellation, rate limits, stale workers, and secret non-disclosure;
- enable source readiness in provider factories and production validation only after both selected adapters are implemented and tested;
- keep credentials, real calls, staging configuration, managed-media product enablement, and calibration outside autonomous source work."""
    new_boundary = """- add a trusted region-derived Rekognition endpoint contract and service-correct SigV4 signing;
- compose the classifier request through the shared bounded HTTP transport and map only bounded transport outcomes into the existing provider result contract;
- add classifier conformance for retryable and terminal statuses, timeout, cancellation, rate limits, circuit-open state, stale workers, and secret non-disclosure;
- select and document the OCR provider API contract before implementing its request builder and strict versioned response parser;
- map only validated OCR outputs into the existing internal OCR signals without changing deterministic policy;
- retain bounded provider/model/parser metadata without raw responses or OCR plaintext;
- enable source readiness in provider factories and production validation only after both selected adapters are implemented and tested;
- keep credentials, real calls, staging configuration, managed-media product enablement, and calibration outside autonomous source work."""
    content = replace_once(
        content,
        old_boundary,
        new_boundary,
        "ROADMAP remaining P3 boundary",
    )
    content = replace_once(
        content,
        f"P3 transport foundation is complete through backend PR #102 exact green head `b7aa65cdd22d47b914fcb83e7bb674129b6c1c35`, merge `{BACKEND_BEFORE}`.",
        f"P3 transport foundation is complete through backend PR #102 exact green head `b7aa65cdd22d47b914fcb83e7bb674129b6c1c35`, merge `{BACKEND_BEFORE}`; the selected Amazon Rekognition classifier request/parser contract is complete through backend PR #103 exact green head `{PR_103_HEAD}`, merge `{BACKEND_AFTER}`.",
        "ROADMAP starter evidence",
    )
    content = replace_once(
        content,
        "Provider-specific classifier and OCR adapters are not selected, provider factories remain unavailable, and managed-media capabilities remain disabled.",
        "The classifier API contract is selected, but Rekognition signing/transport composition is incomplete; the OCR API contract is not selected, provider factories remain unavailable, and managed-media capabilities remain disabled.",
        "ROADMAP starter status",
    )
    content = replace_once(
        content,
        "Continue only after identifying an explicitly selected documented provider API contract; then implement the smallest complete classifier or OCR adapter with strict request construction, exact response parsing, mapping into existing internal signals, transport/circuit integration, bounded metadata, and deterministic conformance tests.",
        "Continue with the smallest complete Rekognition classifier runtime slice: trusted region-derived endpoint construction, service-correct SigV4 signing, shared transport/circuit integration, bounded result mapping, and deterministic failure conformance; keep OCR work blocked until an explicit documented OCR API contract is selected.",
        "ROADMAP starter next slice",
    )
    path.write_text(content)


def update_implementation_plan() -> None:
    path = Path("docs/implementation-plan.md")
    content = common_baseline(path.read_text(), path.name)
    marker = "## Next bounded slice"
    pr_103_block = f"""Backend PR #103, exact green head `{PR_103_HEAD}`, merge `{BACKEND_AFTER}`:

- selected and documented Amazon Rekognition `DetectModerationLabels` as the classifier API contract;
- added bounded endpoint-relative JPEG request construction;
- added strict moderation-model-v7 response and taxonomy parsing;
- mapped validated labels into existing internal classifier signals without changing deterministic moderation policy;
- intentionally emitted no inferred fitness context or unsupported safety/privacy signals;
- added deterministic no-network conformance and constant redacted errors;
- preserved absent credentials, signing, endpoint configuration, provider factories, readiness, and managed-media product disablement.

"""
    content = replace_once(
        content,
        marker,
        pr_103_block + marker,
        "implementation PR 103 block",
    )
    start = content.index(marker)
    end_marker = "No deployment, migration execution outside CI, worker scheduling, environment activation, credential change, real provider call, public upload activation, OTA, or native build is authorized."
    end = content.index(end_marker, start)
    next_section = f"""## Next bounded slice

Complete the selected Rekognition classifier runtime boundary before changing factories or readiness:

- construct only a trusted region-derived Rekognition HTTPS endpoint;
- add service-correct SigV4 signing for `rekognition` without reusing S3-only assumptions;
- compose the already strict request/parser through the merged provider HTTP transport and circuit containment;
- map success, retryable, terminal, timeout, cancellation, rate-limit, circuit-open, invalid-response, and unavailable outcomes into the existing bounded provider result contract;
- preserve worker-runner retry ownership, leases, cancellation, stale-worker handling, and non-reflective errors;
- retain only bounded provider/model/parser/policy/attempt metadata without raw responses, signed headers, image bytes, endpoints, credentials, or OCR plaintext;
- add deterministic no-network conformance for signing, transport outcomes, stale workers, and secret non-disclosure.

OCR remains blocked until an explicit documented OCR provider API contract is selected. Do not mark classifier or OCR factories source-ready, change production capability readiness, or enable managed-media behavior until both required adapters and their complete conformance boundaries are merged.

"""
    content = content[:start] + next_section + content[end:]
    path.write_text(content)


def update_provider_readiness() -> None:
    path = Path("docs/roadmap/provider-readiness.md")
    content = common_baseline(path.read_text(), path.name)
    content = replace_once(
        content,
        "Status: active. Provider-neutral transport and failure containment are merged; provider-specific adapters remain blocked on provider selection.",
        "Status: active. Provider-neutral transport and the Amazon Rekognition classifier request/parser contract are merged; classifier signing/transport composition, OCR selection, factories, readiness, and activation remain open.",
        "provider readiness P3 status",
    )
    evidence_old = f"""- backend PR #102 exact green head: `b7aa65cdd22d47b914fcb83e7bb674129b6c1c35`;
- backend PR #102 merge: `{BACKEND_BEFORE}`;
- the exact head passed lint, formatting, TypeScript build, production configuration validation, migrations and idempotency, migrated-schema integration, PostgreSQL Social API integration, full Vitest, and production startup/health."""
    evidence_new = f"""- backend PR #102 exact green head: `b7aa65cdd22d47b914fcb83e7bb674129b6c1c35`;
- backend PR #102 merge: `{BACKEND_BEFORE}`;
- backend PR #103 exact green head: `{PR_103_HEAD}`;
- backend PR #103 merge: `{BACKEND_AFTER}`;
- both exact heads passed lint, formatting, TypeScript build, production configuration validation, migrations and idempotency, migrated-schema integration, PostgreSQL Social API integration, full Vitest, and production startup/health."""
    content = replace_once(
        content,
        evidence_old,
        evidence_new,
        "provider readiness evidence",
    )
    runtime_start = content.index("Provider-neutral runtime:")
    adapter_start = content.index("Provider-specific adapters:", runtime_start)
    runtime_block = """Provider-neutral runtime:

- [x] add a bounded backend HTTPS transport with abortable timeout, caller cancellation, response-size limits, strict status handling, and redacted errors;
- [x] perform exactly one transport attempt so existing provider runners retain bounded retry ownership;
- [x] parse bounded standard and interoperable rate-limit metadata;
- [x] block automatic redirects and reject unsafe URLs, credentials, fragments, headers, methods, and sizes;
- [x] add optional bounded circuit containment without provider identity, endpoint state, or hidden configuration failures;
- [x] add deterministic transport conformance for timeout, cancellation, network failure, malformed metadata, declared/streamed overflow, rate limiting, retryable and terminal statuses, unsafe requests, circuit behavior, and secret non-disclosure;
- [x] validate the selected classifier response through a strict moderation-model-v7 parser;
- [x] map validated classifier categories into existing internal signals without changing deterministic domain policy;
- [ ] compose the classifier request/parser through trusted endpoint construction, service-correct signing, shared transport, and bounded provider-result mapping;
- [ ] validate and map the selected OCR provider through its own strict versioned parser;
- [ ] retain parser, provider, model, policy, and attempt metadata through the runtime result boundary without raw responses or OCR plaintext;
- [ ] complete provider-adapter conformance for unknown category, duplicate result, malformed JSON, retryable failure, terminal failure, cancellation, rate limit, circuit-open state, stale-worker behavior, and secret non-disclosure.

"""
    content = content[:runtime_start] + runtime_block + content[adapter_start:]
    adapter_start = content.index("Provider-specific adapters:")
    adapter_end = content.index("No API key or real provider call", adapter_start)
    adapter_block = """Provider-specific adapters:

- [x] select and document Amazon Rekognition `DetectModerationLabels` as the classifier provider API contract;
- [x] implement the selected classifier request builder and strict response parser;
- [ ] add a trusted region-derived Rekognition endpoint and service-correct SigV4 signing;
- [ ] integrate the classifier through the shared provider HTTP transport and bounded circuit containment;
- [ ] select and document the OCR provider API contract;
- [ ] implement the selected OCR request builder and strict response parser;
- [ ] compose selected adapters only in the backend application root;
- [ ] update production source-support validation only after both required adapters are complete;
- [ ] keep credentials supplied only by backend environment variables or the deployment secret store;
- [ ] keep adapters and managed-media product capabilities disabled until explicit staging configuration and P4 calibration.

"""
    content = content[:adapter_start] + adapter_block + content[adapter_end:]
    content = replace_once(
        content,
        "No API key or real provider call was required for the transport foundation. Provider selection is required before provider-specific request and response parsing can be completed.",
        "No API key or real provider call was required for the transport or classifier contract slices. The classifier runtime integration remains incomplete, and OCR selection is still required before OCR request and response parsing can begin.",
        "provider readiness status paragraph",
    )
    old_order = """1. P2 production worker entrypoints and orchestration.
2. P3 provider transport plus selected classifier and OCR adapters.
3. P4 moderation calibration harness.
4. P5 password-reset mobile, deep-link, template, and delivery readiness.
5. P6 deployment policies, configuration templates, smoke scripts, and runbooks.
6. P7 explicit sync conflict-choice contract.
7. P8 diagnostics, fixed-SHA release gate, and Android source preparation.
8. P9 technical privacy, legal, and analytics prerequisites."""
    new_order = """1. P3 selected classifier runtime integration and selected OCR adapter.
2. P4 moderation calibration harness.
3. P5 password-reset mobile, deep-link, template, and delivery readiness.
4. P6 deployment policies, configuration templates, smoke scripts, and runbooks.
5. P7 explicit sync conflict-choice contract.
6. P8 diagnostics, fixed-SHA release gate, and Android source preparation.
7. P9 technical privacy, legal, and analytics prerequisites."""
    content = replace_once(
        content,
        old_order,
        new_order,
        "provider readiness execution order",
    )
    content = replace_once(
        content,
        "- select final classifier, OCR, storage, CDN, and email providers where not already chosen;",
        "- confirm operational use of the selected classifier contract and select final OCR, storage, CDN, and email providers where not already chosen;",
        "provider readiness external selection",
    )
    path.write_text(content)


update_roadmap_progress()
update_implementation_plan()
update_provider_readiness()
