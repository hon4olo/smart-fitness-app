from pathlib import Path
import re

MOBILE_MAIN = "720273195668d3663ec35ba7baca090127ee1b15"
BACKEND_MAIN = "37d4c91cafdeedde122e344fbaca78d00f1c70be"
PR105_HEAD = "47237518847f1135629ca730cce9fd442508cb4d"


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one match, found {count}")
    return text.replace(old, new, 1)


def replace_pattern(text: str, pattern: str, replacement: str, label: str) -> str:
    updated, count = re.subn(pattern, replacement, text, count=1, flags=re.S)
    if count != 1:
        raise SystemExit(f"{label}: expected one match, found {count}")
    return updated


def update_baseline(text: str, label: str) -> str:
    text = replace_once(
        text,
        "- mobile `main`: `c3e3aca3d7593386924569b4ceeaac2c4a72c56f`;",
        f"- mobile `main`: `{MOBILE_MAIN}`;",
        f"{label} mobile baseline",
    )
    text = replace_once(
        text,
        "- backend `main`: `3d2e8cdeb0b0f3d9767a5416e59e06caa4d006c3`;",
        f"- backend `main`: `{BACKEND_MAIN}`;",
        f"{label} backend baseline",
    )
    marker = "- backend PR #104 merge: `3d2e8cdeb0b0f3d9767a5416e59e06caa4d006c3`;"
    addition = (
        marker
        + f"\n- backend PR #105 exact green head: `{PR105_HEAD}`;"
        + f"\n- backend PR #105 merge: `{BACKEND_MAIN}`;"
    )
    return replace_once(text, marker, addition, f"{label} PR105 evidence")


roadmap_path = Path("ROADMAP_PROGRESS.md")
roadmap = update_baseline(roadmap_path.read_text(), "roadmap")
roadmap = replace_once(
    roadmap,
    "Status: active. Provider-neutral transport and the complete Amazon Rekognition classifier source boundary are merged; OCR selection/runtime, composition-root support, readiness, and activation remain open.",
    "Status: active. Provider-neutral transport and the complete Amazon Rekognition classifier and OCR source boundaries are merged; composition-root support, environment schema, production source support, readiness, and activation remain open.",
    "roadmap P3 status",
)
pr104_end = "- made no real provider call and did not change factories, environment schema, source readiness, workers, product capabilities, or activation."
pr105_block = f"""{pr104_end}

Backend PR #105, exact green head `{PR105_HEAD}`, merge `{BACKEND_MAIN}`:

- selected and documented Amazon Rekognition `DetectText` as the OCR API contract;
- added an explicit confidence-80 JPEG-byte request with a 5 MiB input bound;
- added strict text-model-major-3 parsing with bounded geometry, unique identifiers, line/word parent validation, 100-word enforcement, and line-only text projection;
- generalized the pinned Rekognition endpoint and SigV4 boundaries only to the two approved classifier/OCR operations;
- composed exactly one bounded OCR HTTP/circuit attempt per provider invocation and preserved retry ownership in `runMediaOcr`;
- mapped timeout, network, circuit, throttling, retryable/terminal HTTP, malformed-response, model-drift, and runtime-configuration outcomes into existing `ocr_*` result codes;
- added deterministic no-network contract/runtime conformance and excluded raw provider payloads, messages, signed headers, image bytes, endpoints, credentials, and OCR plaintext from errors and logs;
- made no real provider call and did not change factories, environment schema, production source support, readiness, workers, product capabilities, or activation."""
roadmap = replace_once(roadmap, pr104_end, pr105_block, "roadmap PR105 summary")
roadmap = replace_pattern(
    roadmap,
    r"Remaining P3 boundary:\n\n(?:- .*\n)+\n### P4",
    """Remaining P3 boundary:

- add backend-only configuration for the selected Rekognition classifier and OCR adapters without committing credentials;
- compose both adapters only in the backend application root, reusing one bounded transport and explicitly scoped circuit instances;
- validate region, timeout, access-key identifier, secret/session-token presence, and selector combinations through the existing strict configuration boundary;
- update production source-support validation only for the fully implemented selected adapters while keeping configured, ready, and enabled states separate;
- preserve safe unavailable defaults when settings are absent and fail closed for incomplete or unsafe enabled production configuration;
- add deterministic factory, redaction, configuration, readiness-manifest, capability, and production-validation coverage without real network calls;
- keep credentials, real calls, staging configuration, managed-media product enablement, and P4 calibration outside autonomous source work.

### P4""",
    "roadmap remaining P3",
)
roadmap = replace_once(
    roadmap,
    "1. P3 selected OCR adapter and classifier/OCR composition/readiness.",
    "1. P3 classifier/OCR composition-root configuration, source support, and readiness.",
    "roadmap execution order",
)
roadmap = replace_pattern(
    roadmap,
    r"> Continue autonomous work on the Smart Fitness Provider and Release Readiness program\..*\Z",
    f"""> Continue autonomous work on the Smart Fitness Provider and Release Readiness program. Repositories: mobile `hon4olo/smart-fitness-app`, backend `hon4olo/smart-fitness-backend`. Do not rely only on this prompt: first verify exact current `main` and open PRs in both repositories; read both `AGENTS.md`, mobile `PROJECT_LEARNINGS.md`, `ROADMAP_PROGRESS.md`, `docs/implementation-plan.md`, `docs/roadmap/provider-readiness.md`, `docs/roadmap/social-network.md`, `docs/architecture/app-context-consumer-inventory.md`, backend `docs/architecture/social-media-worker-runtime.md`, backend `docs/architecture/provider-http-transport.md`, backend `docs/architecture/amazon-rekognition-classifier.md`, and backend `docs/architecture/amazon-rekognition-ocr.md`; then inspect only code and tests relevant to the selected bounded slice. P0, P1, and P2 are source-complete. P3 provider transport and Amazon Rekognition classifier/OCR source boundaries are complete through backend PR #105 exact green head `{PR105_HEAD}`, merge `{BACKEND_MAIN}`. Provider factories, environment schema, production source support, operational readiness, and managed-media capabilities remain disabled. Continue with the smallest complete composition-root slice: add strict backend-only configuration for the selected Rekognition classifier and OCR adapters, compose them only in the application root through the existing bounded transport/circuit boundaries, update source-support validation only for complete adapters, and add deterministic configuration/factory/readiness/redaction coverage. Keep configured, ready, and enabled states separate; credentials alone must not activate any capability. Preserve all lifecycle, ownership, state-version, CAS, lease, moderation, review, appeal, evidence, retention, legal-hold, cleanup, authentication, sync, idempotency, localization, offline, navigation, draft, polling, and privacy boundaries. Work through meaningful bounded backend/mobile/docs PRs, run full blocking CI, inspect review threads, and merge only exact fully green heads. Do not configure credentials, call real providers, create buckets/CDN/DNS, deploy backend changes, execute migrations outside CI, schedule workers, activate staging or production, publish OTA/EAS, create/install native builds, enable public media uploads, or activate production password-reset email without my direct request.
""",
    "roadmap starter prompt",
)
roadmap_path.write_text(roadmap)


plan_path = Path("docs/implementation-plan.md")
plan = update_baseline(plan_path.read_text(), "implementation plan")
plan = replace_once(
    plan,
    "- preserved absent factory support, environment schema, source readiness, product capability enablement, credentials, real calls, and deployment.",
    f"""- preserved absent factory support, environment schema, source readiness, product capability enablement, credentials, real calls, and deployment.

Backend PR #105, exact green head `{PR105_HEAD}`, merge `{BACKEND_MAIN}`:

- selected and documented Amazon Rekognition `DetectText` as the OCR API contract;
- added fixed bounded JPEG-byte request construction with an explicit confidence threshold;
- added strict text-model-major-3 parsing, line/word relationship validation, 100-word enforcement, and line-only text projection;
- reused only the pinned Rekognition endpoint and approved-operation SigV4 boundaries;
- composed exactly one bounded OCR transport/circuit attempt per provider invocation;
- preserved retry ownership in `runMediaOcr` and existing worker lease, state-version, CAS, and stale-result behavior;
- mapped bounded transport, HTTP, throttling, parsing, model, and configuration outcomes into the existing OCR provider result contract;
- retained constant non-reflective failures without raw provider payloads, messages, signed headers, image bytes, endpoints, credentials, or OCR plaintext;
- preserved absent factory support, environment schema, production source readiness, product capability enablement, credentials, real calls, and deployment.""",
    "implementation PR105 summary",
)
plan = replace_pattern(
    plan,
    r"## Next bounded slice\n\n.*?\n\nNo deployment, migration execution outside CI, worker scheduling, environment activation, credential change, real provider call, public upload activation, OTA, or native build is authorized\.",
    """## Next bounded slice

Complete the selected classifier/OCR composition-root and source-readiness boundary without activating providers:

- add strict backend-only Rekognition configuration for region, bounded timeout, access-key identifier, secret access key, and optional session token;
- keep credentials represented only as runtime environment inputs and redacted from summaries, errors, capabilities, readiness manifests, and logs;
- compose classifier and OCR providers only in the backend application root through the existing bounded HTTP transport and explicitly scoped circuit containment;
- preserve independent provider-runner retry ownership and keep adapter transport timeout at or below the configured runner attempt timeout;
- update source-support validation only for the selected fully implemented adapters while preserving separate configured, ready, and enabled states;
- keep absent/incomplete settings fail-closed and preserve unavailable providers as the safe default;
- add deterministic configuration, factory, source-support, production-validation, worker-readiness, capability, and secret non-disclosure coverage without network calls;
- do not mark operational readiness true without complete runtime settings, and do not enable managed-media product behavior or public uploads.

No deployment, migration execution outside CI, worker scheduling, environment activation, credential change, real provider call, public upload activation, OTA, or native build is authorized.""",
    "implementation next slice",
)
plan_path.write_text(plan)


provider_path = Path("docs/roadmap/provider-readiness.md")
provider = update_baseline(provider_path.read_text(), "provider roadmap")
provider = replace_once(
    provider,
    "Status: active. Provider-neutral transport and the complete Amazon Rekognition classifier source boundary are merged; OCR selection/runtime, composition-root support, readiness, and activation remain open.",
    "Status: active. Provider-neutral transport and the complete Amazon Rekognition classifier and OCR source boundaries are merged; composition-root support, environment schema, production source support, readiness, and activation remain open.",
    "provider P3 status",
)
provider = replace_once(
    provider,
    "- backend PR #104 merge: `3d2e8cdeb0b0f3d9767a5416e59e06caa4d006c3`;\n- all three exact heads passed",
    f"- backend PR #104 merge: `3d2e8cdeb0b0f3d9767a5416e59e06caa4d006c3`;\n- backend PR #105 exact green head: `{PR105_HEAD}`;\n- backend PR #105 merge: `{BACKEND_MAIN}`;\n- all four exact heads passed",
    "provider PR105 evidence",
)
provider = replace_once(
    provider,
    "- [ ] validate and map the selected OCR provider through its own strict versioned parser;",
    "- [x] validate and map the selected OCR provider through its own strict versioned parser;",
    "provider OCR parser checkbox",
)
provider = replace_once(
    provider,
    "- [ ] retain equivalent bounded OCR provider/model/parser metadata without raw responses or OCR plaintext;",
    "- [x] retain equivalent bounded OCR provider/model/parser metadata without raw responses or OCR plaintext;",
    "provider OCR metadata checkbox",
)
provider = replace_once(
    provider,
    "- [ ] complete equivalent OCR conformance, including OCR-plaintext non-disclosure and stale-result behavior.",
    "- [x] complete equivalent OCR adapter conformance, including OCR-plaintext non-disclosure, while preserving existing worker stale-result behavior.",
    "provider OCR conformance checkbox",
)
provider = replace_once(
    provider,
    "- [ ] select and document the OCR provider API contract;",
    "- [x] select and document Amazon Rekognition `DetectText` as the OCR provider API contract;",
    "provider OCR selection checkbox",
)
provider = replace_once(
    provider,
    "- [ ] implement the selected OCR request builder and strict response parser;",
    "- [x] implement the selected OCR request builder, strict response parser, approved-operation signing, and one-attempt runtime adapter;",
    "provider OCR implementation checkbox",
)
provider = replace_once(
    provider,
    "No API key or real provider call was required for the transport or classifier slices. The classifier source boundary is complete, and OCR selection is still required before OCR request, response, and runtime integration can begin.",
    "No API key or real provider call was required for the transport, classifier, or OCR slices. Both selected adapter source boundaries are complete; composition-root configuration, source-support validation, operational readiness, and product activation remain separate open gates.",
    "provider P3 conclusion",
)
provider = replace_once(
    provider,
    "No credential, provider account, network call, deployment, worker activation, public upload activation, or production environment change was performed.\n\n## Phase P4",
    """No credential, provider account, network call, deployment, worker activation, public upload activation, or production environment change was performed.

Next source slice:

- add strict backend-only Rekognition runtime configuration without committing credentials;
- compose both adapters only in the application root through bounded shared transport and explicitly scoped circuit instances;
- update source-support validation and factories only for the complete selected adapters;
- preserve separate configured, ready, and enabled states and safe unavailable defaults;
- add deterministic factory, configuration, production-validation, worker-readiness, capability, redaction, and no-network coverage;
- keep operational activation, real credentials/calls, managed-media enablement, public uploads, and P4 calibration outside this source slice.

## Phase P4""",
    "provider next slice",
)
provider_path.write_text(provider)
