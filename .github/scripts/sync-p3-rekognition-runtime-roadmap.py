from pathlib import Path

MOBILE_BEFORE = "b95f696b3176ca8597f3cd36bb499b3d9c5971ce"
MOBILE_AFTER = "c3e3aca3d7593386924569b4ceeaac2c4a72c56f"
BACKEND_BEFORE = "0e2829d91b077eec9fb60d25390b038ada0676db"
BACKEND_AFTER = "3d2e8cdeb0b0f3d9767a5416e59e06caa4d006c3"
PR_104_HEAD = "7c684cc9426d33b4a9ec4e52cb818966ae71fdac"


def replace_once(content: str, old: str, new: str, label: str) -> str:
    count = content.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected one match, found {count}")
    return content.replace(old, new, 1)


def replace_first(content: str, old: str, new: str, label: str) -> str:
    if old not in content:
        raise RuntimeError(f"{label}: expected at least one match")
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
        f"- backend PR #103 merge: `{BACKEND_BEFORE}`;\n"
        f"- backend PR #104 exact green head: `{PR_104_HEAD}`;\n"
        f"- backend PR #104 merge: `{BACKEND_AFTER}`;"
    )
    return replace_first(
        content,
        f"- backend PR #103 merge: `{BACKEND_BEFORE}`;",
        evidence,
        f"{label} PR 104 baseline evidence",
    )


def update_roadmap_progress() -> None:
    path = Path("ROADMAP_PROGRESS.md")
    content = common_baseline(path.read_text(), path.name)
    content = replace_once(
        content,
        "Status: active. Provider-neutral transport is merged, and the Amazon Rekognition `DetectModerationLabels` classifier request/parser contract is source-complete; classifier signing/transport composition, OCR selection, factories, readiness, and activation remain open.",
        "Status: active. Provider-neutral transport and the complete Amazon Rekognition `DetectModerationLabels` classifier source boundary are merged; OCR selection/runtime, composition-root support, readiness, and activation remain open.",
        "ROADMAP P3 status",
    )
    pr_104 = f"""Backend PR #104, exact green head `{PR_104_HEAD}`, merge `{BACKEND_AFTER}`:

- added a pinned standard Rekognition endpoint contract for moderation-capable regions;
- added a separate service-correct SigV4 signer scoped to `rekognition` without reusing S3-only assumptions;
- composed the strict classifier request/parser through exactly one injected bounded HTTP transport call per provider invocation;
- promoted bounded Rekognition throughput/throttling HTTP `400` errors before circuit accounting;
- mapped timeout, network, circuit, retryable/terminal HTTP, malformed-response, model-drift, and runtime-configuration outcomes into the existing media classifier result contract;
- preserved retry ownership in `runMediaClassifier` and added deterministic retry-then-success integration coverage;
- documented the absence of caller cancellation in the current provider interface instead of inventing an adapter-local contract;
- made no real provider call and did not change factories, environment schema, source readiness, workers, product capabilities, or activation.

Remaining P3 boundary:"""
    content = replace_once(
        content,
        "Remaining P3 boundary:",
        pr_104,
        "ROADMAP PR 104 block",
    )
    old_boundary = """- add a trusted region-derived Rekognition endpoint contract and service-correct SigV4 signing;
- compose the classifier request through the shared bounded HTTP transport and map only bounded transport outcomes into the existing provider result contract;
- add classifier conformance for retryable and terminal statuses, timeout, cancellation, rate limits, circuit-open state, stale workers, and secret non-disclosure;
- select and document the OCR provider API contract before implementing its request builder and strict versioned response parser;
- map only validated OCR outputs into the existing internal OCR signals without changing deterministic policy;
- retain bounded provider/model/parser metadata without raw responses or OCR plaintext;
- enable source readiness in provider factories and production validation only after both selected adapters are implemented and tested;
- keep credentials, real calls, staging configuration, managed-media product enablement, and calibration outside autonomous source work."""
    new_boundary = """- select and document the OCR provider API contract before implementing its request builder and strict versioned response parser;
- compose exactly one bounded OCR transport attempt through trusted endpoint/authentication and the shared HTTP/circuit boundary;
- map only validated OCR outputs into the existing internal OCR signals without changing deterministic policy;
- preserve runner-owned retries, timeout bounds, leases, stale-result handling, and secret non-disclosure;
- retain bounded provider/model/parser metadata without raw responses, signed headers, image bytes, endpoints, credentials, or OCR plaintext;
- compose classifier and OCR providers only in the backend application root after the OCR adapter is complete;
- update environment schema, source-support validation, factories, and readiness only after both selected adapters and conformance boundaries are complete;
- keep credentials, real calls, staging configuration, managed-media product enablement, and calibration outside autonomous source work."""
    content = replace_once(
        content,
        old_boundary,
        new_boundary,
        "ROADMAP remaining P3 boundary",
    )
    content = replace_once(
        content,
        "1. P3 provider transport and selected classifier/OCR adapters.",
        "1. P3 selected OCR adapter and classifier/OCR composition/readiness.",
        "ROADMAP execution order",
    )
    old_starter_evidence = (
        f"P3 transport foundation is complete through backend PR #102 exact green head `b7aa65cdd22d47b914fcb83e7bb674129b6c1c35`, merge `1d98e50aa9014bca59a7ed7a51ef3803f296dae3`; the selected Amazon Rekognition classifier request/parser contract is complete through backend PR #103 exact green head `02675ab50683c4745f7f1a3c5cc05b081016bb15`, merge `{BACKEND_BEFORE}`."
    )
    new_starter_evidence = (
        old_starter_evidence
        + f" The Rekognition classifier runtime is complete through backend PR #104 exact green head `{PR_104_HEAD}`, merge `{BACKEND_AFTER}`."
    )
    content = replace_once(
        content,
        old_starter_evidence,
        new_starter_evidence,
        "ROADMAP starter evidence",
    )
    content = replace_once(
        content,
        "The classifier API contract is selected, but Rekognition signing/transport composition is incomplete; the OCR API contract is not selected, provider factories remain unavailable, and managed-media capabilities remain disabled.",
        "The classifier source boundary is complete, but the OCR API contract is not selected, provider factories remain unavailable, and managed-media capabilities remain disabled.",
        "ROADMAP starter status",
    )
    content = replace_once(
        content,
        "Continue with the smallest complete Rekognition classifier runtime slice: trusted region-derived endpoint construction, service-correct SigV4 signing, shared transport/circuit integration, bounded result mapping, and deterministic failure conformance; keep OCR work blocked until an explicit documented OCR API contract is selected.",
        "Continue with the smallest complete OCR slice: select and document one provider API contract, then add strict bounded request construction, exact versioned response parsing, provider-neutral OCR mapping, one-attempt transport/circuit integration, runner-owned retry conformance, and secret non-disclosure without changing factories or readiness yet.",
        "ROADMAP starter next slice",
    )
    path.write_text(content)


def update_implementation_plan() -> None:
    path = Path("docs/implementation-plan.md")
    content = common_baseline(path.read_text(), path.name)
    content = replace_once(
        content,
        "The provider-neutral HTTP transport and failure-containment foundation are source-complete.",
        "The provider-neutral HTTP transport and complete Amazon Rekognition classifier source boundary are source-complete. OCR selection/runtime and final provider composition/readiness remain open.",
        "implementation P3 status",
    )
    marker = "## Next bounded slice"
    pr_104 = f"""Backend PR #104, exact green head `{PR_104_HEAD}`, merge `{BACKEND_AFTER}`:

- added trusted region-derived Rekognition endpoints and service-correct SigV4 signing;
- composed exactly one bounded classifier transport call per provider invocation;
- mapped bounded HTTP, timeout, circuit, parsing, model, and configuration outcomes into the existing classifier provider result contract;
- preserved retry ownership in `runMediaClassifier` with deterministic retry-then-success coverage;
- retained constant non-reflective errors and excluded raw payloads, signed headers, image bytes, endpoints, and credentials;
- preserved absent factory support, environment schema, source readiness, product capability enablement, credentials, real calls, and deployment.

"""
    content = replace_once(
        content,
        marker,
        pr_104 + marker,
        "implementation PR 104 block",
    )
    start = content.index(marker)
    end_marker = "No deployment, migration execution outside CI, worker scheduling, environment activation, credential change, real provider call, public upload activation, OTA, or native build is authorized."
    end = content.index(end_marker, start)
    next_section = """## Next bounded slice

Complete the OCR source boundary before changing provider factories or readiness:

- select and document one OCR provider API contract rather than inventing a generic payload;
- add bounded request construction and a strict versioned response parser;
- map only validated OCR output into the existing provider-neutral OCR contract without retaining raw OCR plaintext;
- use a trusted endpoint and provider-correct authentication through exactly one shared bounded HTTP/circuit attempt per provider invocation;
- map timeout, network, retryable/terminal HTTP, malformed response, model/version drift, and configuration outcomes into the existing OCR provider result contract;
- preserve provider-runner retry ownership, attempt bounds, worker leases, state-version/CAS handling, stale-result rejection, and non-reflective errors;
- add deterministic no-network conformance for request/signing, parsing, transport outcomes, retry ownership, and secret/plaintext non-disclosure.

Do not compose classifier or OCR providers in the application root, add environment schema or credentials, update production source support, mark factories ready, or enable managed-media behavior until the OCR adapter and both complete conformance boundaries are merged.

"""
    content = content[:start] + next_section + content[end:]
    path.write_text(content)


def update_provider_readiness() -> None:
    path = Path("docs/roadmap/provider-readiness.md")
    content = common_baseline(path.read_text(), path.name)
    content = replace_once(
        content,
        "Status: active. Provider-neutral transport and the Amazon Rekognition classifier request/parser contract are merged; classifier signing/transport composition, OCR selection, factories, readiness, and activation remain open.",
        "Status: active. Provider-neutral transport and the complete Amazon Rekognition classifier source boundary are merged; OCR selection/runtime, composition-root support, readiness, and activation remain open.",
        "provider readiness P3 status",
    )
    evidence_old = f"""- backend PR #102 exact green head: `b7aa65cdd22d47b914fcb83e7bb674129b6c1c35`;
- backend PR #102 merge: `1d98e50aa9014bca59a7ed7a51ef3803f296dae3`;
- backend PR #103 exact green head: `02675ab50683c4745f7f1a3c5cc05b081016bb15`;
- backend PR #103 merge: `{BACKEND_BEFORE}`;
- both exact heads passed lint, formatting, TypeScript build, production configuration validation, migrations and idempotency, migrated-schema integration, PostgreSQL Social API integration, full Vitest, and production startup/health."""
    evidence_new = f"""- backend PR #102 exact green head: `b7aa65cdd22d47b914fcb83e7bb674129b6c1c35`;
- backend PR #102 merge: `1d98e50aa9014bca59a7ed7a51ef3803f296dae3`;
- backend PR #103 exact green head: `02675ab50683c4745f7f1a3c5cc05b081016bb15`;
- backend PR #103 merge: `{BACKEND_BEFORE}`;
- backend PR #104 exact green head: `{PR_104_HEAD}`;
- backend PR #104 merge: `{BACKEND_AFTER}`;
- all three exact heads passed lint, formatting, TypeScript build, production configuration validation, migrations and idempotency, migrated-schema integration, PostgreSQL Social API integration, full Vitest, and production startup/health."""
    content = replace_once(
        content,
        evidence_old,
        evidence_new,
        "provider readiness evidence",
    )
    content = replace_once(
        content,
        "- [ ] compose the classifier request/parser through trusted endpoint construction, service-correct signing, shared transport, and bounded provider-result mapping;",
        "- [x] compose the classifier request/parser through trusted endpoint construction, service-correct signing, exactly one shared transport attempt, bounded circuit containment, and the existing provider-result mapping;",
        "provider readiness classifier runtime",
    )
    content = replace_once(
        content,
        "- [ ] retain parser, provider, model, policy, and attempt metadata through the runtime result boundary without raw responses or OCR plaintext;",
        "- [x] retain bounded classifier provider/model/latency output while preserving runner-owned parser, policy, attempt, and aggregate-latency metadata without raw responses;\n- [ ] retain equivalent bounded OCR provider/model/parser metadata without raw responses or OCR plaintext;",
        "provider readiness metadata",
    )
    content = replace_once(
        content,
        "- [ ] complete provider-adapter conformance for unknown category, duplicate result, malformed JSON, retryable failure, terminal failure, cancellation, rate limit, circuit-open state, stale-worker behavior, and secret non-disclosure.",
        "- [x] complete classifier conformance for unknown category, duplicate result, malformed JSON, retryable/terminal HTTP outcomes, timeout, circuit-open state, runner-owned retries, model drift, and secret non-disclosure;\n- [ ] complete equivalent OCR conformance, including OCR-plaintext non-disclosure and stale-result behavior.",
        "provider readiness conformance",
    )
    content = replace_once(
        content,
        "- [ ] add a trusted region-derived Rekognition endpoint and service-correct SigV4 signing;",
        "- [x] add a trusted region-derived Rekognition endpoint and service-correct SigV4 signing;",
        "provider readiness signing",
    )
    content = replace_once(
        content,
        "- [ ] integrate the classifier through the shared provider HTTP transport and bounded circuit containment;",
        "- [x] integrate the classifier through one shared provider HTTP transport attempt and bounded circuit containment while preserving runner-owned retries;",
        "provider readiness classifier integration",
    )
    content = replace_once(
        content,
        "No API key or real provider call was required for the transport or classifier contract slices. The classifier runtime integration remains incomplete, and OCR selection is still required before OCR request and response parsing can begin.",
        "No API key or real provider call was required for the transport or classifier slices. The classifier source boundary is complete, and OCR selection is still required before OCR request, response, and runtime integration can begin.",
        "provider readiness status paragraph",
    )
    content = replace_once(
        content,
        "1. P3 selected classifier runtime integration and selected OCR adapter.",
        "1. P3 selected OCR adapter and classifier/OCR composition/readiness.",
        "provider readiness execution order",
    )
    path.write_text(content)


update_roadmap_progress()
update_implementation_plan()
update_provider_readiness()
